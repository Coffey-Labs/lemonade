import { STARTING_ASSETS } from './constants'
import { isBankrupt } from './engine'
import type { DayConditions, DayResult, Decision, Phase, Player } from './types'

export interface GameState {
  phase: Phase
  seed: number
  day: number
  players: Player[]
  /** Index into players; only the ones still solvent take a turn. */
  turn: number
  conditions: DayConditions | null
  decisions: Record<number, Decision>
  results: DayResult[]
  history: DayResult[]
  /** True while road works were in progress yesterday, so they can run on. */
  streetCrewYesterday: boolean
  retired: boolean
}

export const initialState = (seed: number): GameState => ({
  phase: 'title',
  seed,
  day: 0,
  players: [],
  turn: 0,
  conditions: null,
  decisions: {},
  results: [],
  history: [],
  streetCrewYesterday: false,
  retired: false,
})

export type Action =
  | { type: 'SHOW_INTRO' }
  | { type: 'SHOW_SETUP' }
  | { type: 'START'; names: string[] }
  | { type: 'BEGIN_DAY'; conditions: DayConditions }
  | { type: 'OPEN_STAND' }
  | { type: 'SUBMIT'; playerId: number; decision: Decision }
  | { type: 'RESOLVE'; results: DayResult[] }
  | { type: 'NEXT_DAY' }
  | { type: 'RETIRE' }
  | { type: 'RESTART'; seed: number }

/** Players who can still afford to open the stand, in seating order. */
export const activePlayers = (s: GameState) => s.players.filter((p) => !p.bankrupt)

export function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'SHOW_INTRO':
      return { ...state, phase: 'intro' }

    case 'SHOW_SETUP':
      return { ...state, phase: 'setup' }

    case 'START':
      return {
        ...state,
        phase: 'briefing',
        day: 1,
        players: action.names.map((name, i) => ({
          id: i,
          name: name.trim().toUpperCase() || `PLAYER ${i + 1}`,
          assets: STARTING_ASSETS,
          bankrupt: false,
          bankruptDay: null,
        })),
        turn: 0,
        decisions: {},
        results: [],
        history: [],
      }

    case 'BEGIN_DAY':
      return {
        ...state,
        phase: 'briefing',
        conditions: action.conditions,
        decisions: {},
        results: [],
        turn: 0,
      }

    case 'OPEN_STAND':
      return { ...state, phase: 'decide', turn: 0 }

    case 'SUBMIT': {
      const decisions = { ...state.decisions, [action.playerId]: action.decision }
      const active = activePlayers(state)
      const done = active.every((p) => decisions[p.id] !== undefined)
      return {
        ...state,
        decisions,
        turn: done ? state.turn : state.turn + 1,
        phase: done ? 'resolve' : 'decide',
      }
    }

    case 'RESOLVE': {
      const byId = new Map(action.results.map((r) => [r.playerId, r]))
      const nextDay = state.day + 1
      return {
        ...state,
        phase: 'report',
        results: action.results,
        history: [...state.history, ...action.results],
        streetCrewYesterday: state.conditions?.streetCrew ?? false,
        players: state.players.map((p) => {
          const r = byId.get(p.id)
          if (!r) return p
          const assets = r.assetsAfter
          const broke = isBankrupt(assets, nextDay)
          return {
            ...p,
            assets,
            bankrupt: p.bankrupt || broke,
            bankruptDay: p.bankrupt ? p.bankruptDay : broke ? state.day : null,
          }
        }),
      }
    }

    case 'NEXT_DAY': {
      if (activePlayers(state).length === 0) return { ...state, phase: 'gameover' }
      return { ...state, phase: 'briefing', day: state.day + 1, turn: 0 }
    }

    case 'RETIRE':
      return { ...state, phase: 'gameover', retired: true }

    case 'RESTART':
      return initialState(action.seed)

    default:
      return state
  }
}
