/**
 * Everything here treats the request body as hostile. A public leaderboard
 * with no accounts cannot prove a score is real - what it can do is refuse
 * anything impossible, keep names printable, and stop one client filling the
 * table on its own.
 */

export interface Entry {
  name: string
  assets: number
  days: number
  glasses: number
  seed: number
  broke: boolean
}

export const MAX_ENTRIES_PER_POST = 4
export const NAME_MAX = 12

/** The simulation's best possible day is about $12.50; $25 leaves headroom. */
const MAX_CENTS_PER_DAY = 2500
const STARTING_ASSETS = 200
const MAX_GLASSES_PER_DAY = 400
const MAX_DAYS = 365

const isInt = (v: unknown, lo: number, hi: number): v is number =>
  typeof v === 'number' && Number.isInteger(v) && v >= lo && v <= hi

/** Printable, uppercase, and short enough to fit the board. */
export function cleanName(raw: unknown): string {
  if (typeof raw !== 'string') return 'ANON'
  const cleaned = raw
    .toUpperCase()
    .replace(/[^A-Z0-9 .'-]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, NAME_MAX)
  return cleaned || 'ANON'
}

export type Validated = { ok: true; entry: Entry } | { ok: false; why: string }

export function validateEntry(raw: unknown): Validated {
  if (typeof raw !== 'object' || raw === null) return { ok: false, why: 'not an object' }
  const e = raw as Record<string, unknown>

  if (!isInt(e.days, 1, MAX_DAYS)) return { ok: false, why: 'days out of range' }
  if (!isInt(e.assets, 0, 10_000_00)) return { ok: false, why: 'assets out of range' }
  if (!isInt(e.glasses, 0, MAX_DAYS * MAX_GLASSES_PER_DAY))
    return { ok: false, why: 'glasses out of range' }
  if (!isInt(e.seed, 0, 9_999_999)) return { ok: false, why: 'seed out of range' }
  if (typeof e.broke !== 'boolean') return { ok: false, why: 'broke must be a boolean' }

  // No stand can earn more than the simulation allows in the days it traded.
  if (e.assets > STARTING_ASSETS + e.days * MAX_CENTS_PER_DAY)
    return { ok: false, why: 'assets impossible for that many days' }
  if (e.glasses > e.days * MAX_GLASSES_PER_DAY)
    return { ok: false, why: 'glasses impossible for that many days' }

  return {
    ok: true,
    entry: {
      name: cleanName(e.name),
      assets: e.assets,
      days: e.days,
      glasses: e.glasses,
      seed: e.seed,
      broke: e.broke,
    },
  }
}

export function validateBatch(raw: unknown): { ok: true; entries: Entry[] } | { ok: false; why: string } {
  const list = Array.isArray(raw) ? raw : (raw as { entries?: unknown })?.entries
  if (!Array.isArray(list)) return { ok: false, why: 'expected an array of entries' }
  if (list.length === 0) return { ok: false, why: 'no entries' }
  if (list.length > MAX_ENTRIES_PER_POST) return { ok: false, why: 'too many entries' }

  const entries: Entry[] = []
  for (const item of list) {
    const v = validateEntry(item)
    if (!v.ok) return v
    entries.push(v.entry)
  }
  return { ok: true, entries }
}
