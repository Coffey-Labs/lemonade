export type Weather = 'sunny' | 'cloudy' | 'hot'

export interface Player {
  id: number
  name: string
  assets: number // in cents, always integer
  bankrupt: boolean
  bankruptDay: number | null
}

/** What a player typed in for a single day. */
export interface Decision {
  glasses: number
  signs: number
  price: number // cents per glass
}

/** Everything the world decided for a given day, before anyone buys anything. */
export interface DayConditions {
  day: number
  weather: Weather
  heatWave: boolean
  streetCrew: boolean
  /** Only ever true on a cloudy day, and only revealed after decisions are locked in. */
  storm: boolean
  costPerGlass: number
}

export interface DayResult {
  playerId: number
  decision: Decision
  glassesSold: number
  income: number
  lemonadeCost: number
  signCost: number
  expenses: number
  profit: number
  assetsAfter: number
}

export type Phase =
  | 'boot'
  | 'title'
  | 'intro'
  | 'setup'
  | 'briefing'
  | 'decide'
  | 'resolve'
  | 'trading'
  | 'report'
  | 'gameover'
  | 'scores'
