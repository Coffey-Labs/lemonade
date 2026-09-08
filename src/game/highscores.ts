/**
 * The leaderboard is one table shared by everybody, held by the scores
 * service rather than the browser. Nothing about it is trusted on the way in:
 * the server decides what is plausible, and the client re-checks the shape of
 * whatever comes back before putting it on screen.
 */

const BASE = (import.meta.env.VITE_SCORES_API ?? '/api').replace(/\/+$/, '')
const TIMEOUT_MS = 8000

export const MAX_SCORES = 50

export interface Score {
  id: string
  name: string
  /** Closing assets, in whole cents. */
  assets: number
  days: number
  glasses: number
  at: number
  broke: boolean
}

export type NewScore = Omit<Score, 'id' | 'at'>

/** Rows arrive over the network, so every field is checked before use. */
function isScore(v: unknown): v is Score {
  if (typeof v !== 'object' || v === null) return false
  const s = v as Record<string, unknown>
  return (
    typeof s.id === 'string' &&
    typeof s.name === 'string' &&
    Number.isFinite(s.assets) &&
    Number.isFinite(s.days) &&
    Number.isFinite(s.glasses) &&
    Number.isFinite(s.at) &&
    typeof s.broke === 'boolean'
  )
}

const parseBoard = (body: unknown): Score[] => {
  const rows = (body as { scores?: unknown })?.scores
  if (!Array.isArray(rows)) return []
  return rows
    .filter(isScore)
    .map((s) => ({ ...s, name: s.name.slice(0, 12) }))
    .slice(0, MAX_SCORES)
}

async function call(path: string, init?: RequestInit): Promise<unknown> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
  })
  const body: unknown = await res.json().catch(() => null)
  if (!res.ok) {
    const why = (body as { error?: string })?.error
    throw new Error(why ?? `scores service returned ${res.status}`)
  }
  return body
}

export async function fetchScores(): Promise<Score[]> {
  return parseBoard(await call('/scores'))
}

/** Posts a whole table's worth of players at once and returns the new board. */
export async function submitScores(
  entries: NewScore[],
): Promise<{ ids: string[]; scores: Score[] }> {
  const body = await call('/scores', { method: 'POST', body: JSON.stringify({ entries }) })
  const ids = (body as { ids?: unknown })?.ids
  return {
    ids: Array.isArray(ids) ? ids.filter((i): i is string => typeof i === 'string') : [],
    scores: parseBoard(body),
  }
}
