export const HIGH_SCORE_KEY = 'lemonade.highscores.v1'
const KEY = HIGH_SCORE_KEY
export const MAX_SCORES = 10

export interface Score {
  id: string
  name: string
  /** Closing assets, in whole cents. */
  assets: number
  days: number
  glasses: number
  seed: number
  /** Epoch milliseconds, for the tie-break and the date column. */
  at: number
  broke: boolean
}

export type NewScore = Omit<Score, 'id' | 'at'>

const isScore = (v: unknown): v is Score => {
  if (typeof v !== 'object' || v === null) return false
  const s = v as Record<string, unknown>
  return (
    typeof s.id === 'string' &&
    typeof s.name === 'string' &&
    Number.isFinite(s.assets) &&
    Number.isFinite(s.days) &&
    Number.isFinite(s.glasses) &&
    Number.isFinite(s.seed) &&
    Number.isFinite(s.at) &&
    typeof s.broke === 'boolean'
  )
}

const rank = (a: Score, b: Score) => b.assets - a.assets || a.days - b.days || a.at - b.at

/**
 * Anything already in storage was written by someone who can edit it freely,
 * so every field is checked before it is trusted.
 */
export function loadScores(): Score[] {
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter(isScore)
      .map((s) => ({ ...s, name: s.name.slice(0, 12).toUpperCase() }))
      .sort(rank)
      .slice(0, MAX_SCORES)
  } catch {
    // Private windows, blocked site data, or corrupt JSON: play without a table.
    return []
  }
}

function persist(scores: Score[]): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(scores))
  } catch {
    // Nothing to do - the run still shows in the table until the tab closes.
  }
}

const newId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`

/**
 * Returns the saved table and the ids of the entries this call added. The
 * table only ever loses a row by being pushed past MAX_SCORES by a better
 * one - there is no way to clear it.
 */
export function addScores(entries: NewScore[]): { table: Score[]; added: string[] } {
  const at = Date.now()
  const fresh: Score[] = entries.map((e) => ({ ...e, id: newId(), at }))
  const table = [...loadScores(), ...fresh].sort(rank).slice(0, MAX_SCORES)
  persist(table)
  const kept = new Set(table.map((s) => s.id))
  return { table, added: fresh.filter((s) => kept.has(s.id)).map((s) => s.id) }
}
