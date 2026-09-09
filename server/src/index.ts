import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { DatabaseSync } from 'node:sqlite'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { MAX_ENTRIES_PER_POST, validateBatch } from './validate.ts'

const PORT = Number(process.env.PORT ?? 5184)
const DB_PATH = process.env.DB_PATH ?? './data/scores.db'
/** Behind nginx the socket address is the proxy, so take the forwarded hop. */
const TRUST_PROXY = process.env.TRUST_PROXY === '1'
const BOARD_LIMIT = 50
/** Rows kept on disk. The board only ever shows the top of this. */
const KEEP_ROWS = 500
const MAX_BODY_BYTES = 4096

mkdirSync(dirname(DB_PATH), { recursive: true })
const db = new DatabaseSync(DB_PATH)
db.exec(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS scores (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT    NOT NULL,
    assets     INTEGER NOT NULL,
    days       INTEGER NOT NULL,
    glasses    INTEGER NOT NULL,
    seed       INTEGER NOT NULL,
    broke      INTEGER NOT NULL,
    created_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS scores_rank
    ON scores (assets DESC, days ASC, created_at ASC);
`)

const selectTop = db.prepare(
  `SELECT id, name, assets, days, glasses, broke, created_at
     FROM scores ORDER BY assets DESC, days ASC, created_at ASC LIMIT ?`,
)
const insertScore = db.prepare(
  `INSERT INTO scores (name, assets, days, glasses, seed, broke, created_at)
   VALUES (?, ?, ?, ?, ?, ?, ?)`,
)
const prune = db.prepare(
  `DELETE FROM scores WHERE id NOT IN (
     SELECT id FROM scores ORDER BY assets DESC, days ASC, created_at ASC LIMIT ?
   )`,
)

// ---------------------------------------------------------------- throttle

interface Bucket {
  count: number
  resetAt: number
}
const posts = new Map<string, Bucket>()
const POST_WINDOW_MS = 60 * 60 * 1000
/*
 * Per address, per hour. Generous on purpose: a classroom, an office or a
 * household all arrive from one address, and thirty was low enough that a
 * class finishing a season together would have started losing scores to a
 * 429. What actually keeps rubbish off the board is the plausibility check
 * in validate.ts, not this - this only stops the database being hammered.
 */
const POST_LIMIT = 120

function overPostLimit(ip: string): boolean {
  const now = Date.now()
  const b = posts.get(ip)
  if (!b || now > b.resetAt) {
    posts.set(ip, { count: 1, resetAt: now + POST_WINDOW_MS })
    return false
  }
  b.count += 1
  return b.count > POST_LIMIT
}

// Buckets are tiny, but a long-lived process should still not hoard them.
setInterval(() => {
  const now = Date.now()
  for (const [ip, b] of posts) if (now > b.resetAt) posts.delete(ip)
}, POST_WINDOW_MS).unref()

function clientIp(req: IncomingMessage): string {
  if (TRUST_PROXY) {
    const fwd = req.headers['x-forwarded-for']
    const first = (Array.isArray(fwd) ? fwd[0] : fwd)?.split(',')[0]?.trim()
    if (first) return first
  }
  return req.socket.remoteAddress ?? 'unknown'
}

// ------------------------------------------------------------------ replies

function send(res: ServerResponse, status: number, body: unknown) {
  const payload = JSON.stringify(body)
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    // A public board with no cookies and no credentials.
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET, POST, OPTIONS',
    'access-control-allow-headers': 'content-type',
    'access-control-max-age': '86400',
  })
  res.end(payload)
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let size = 0
    const chunks: Buffer[] = []
    req.on('data', (c: Buffer) => {
      size += c.length
      if (size > MAX_BODY_BYTES) {
        reject(new Error('body too large'))
        req.destroy()
        return
      }
      chunks.push(c)
    })
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

// ------------------------------------------------------------------- routes

const board = () =>
  (selectTop.all(BOARD_LIMIT) as Record<string, unknown>[]).map((r) => ({
    id: String(r.id),
    name: r.name as string,
    assets: r.assets as number,
    days: r.days as number,
    glasses: r.glasses as number,
    broke: r.broke === 1,
    at: r.created_at as number,
  }))

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`)
  const path = url.pathname.replace(/\/+$/, '') || '/'

  if (req.method === 'OPTIONS') return send(res, 204, {})
  if (path === '/api/health') return send(res, 200, { ok: true })

  if (path === '/api/scores' && req.method === 'GET') {
    return send(res, 200, { scores: board() })
  }

  if (path === '/api/scores' && req.method === 'POST') {
    const ip = clientIp(req)
    if (overPostLimit(ip)) return send(res, 429, { error: 'too many submissions' })

    let parsed: unknown
    try {
      parsed = JSON.parse(await readBody(req))
    } catch {
      return send(res, 400, { error: 'invalid JSON' })
    }

    const check = validateBatch(parsed)
    if (!check.ok) return send(res, 400, { error: check.why })

    const now = Date.now()
    const ids: string[] = []
    for (const e of check.entries) {
      const info = insertScore.run(e.name, e.assets, e.days, e.glasses, e.seed, e.broke ? 1 : 0, now)
      ids.push(String(info.lastInsertRowid))
    }
    prune.run(KEEP_ROWS)

    return send(res, 201, { ids, scores: board() })
  }

  send(res, 404, { error: 'not found' })
})

server.listen(PORT, () => {
  console.log(`[scores] listening on :${PORT}, db ${DB_PATH}, max ${MAX_ENTRIES_PER_POST}/post`)
})

for (const sig of ['SIGINT', 'SIGTERM'] as const) {
  process.on(sig, () => {
    server.close(() => {
      db.close()
      process.exit(0)
    })
  })
}
