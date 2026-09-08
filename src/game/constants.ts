import type { Weather } from './types'

/** Everything is held in whole cents so the books never drift. */
export const STARTING_ASSETS = 200 // $2.00
export const SIGN_COST = 15 // 15 cents per advertising sign
export const MAX_PLAYERS = 4
export const MAX_SIGNS = 50

/**
 * The cost of a glass climbs as the season goes on, exactly as in the
 * original: 2 cents for days 1-2, 4 cents through day 7, 5 cents after that.
 */
export function costPerGlass(day: number): number {
  if (day <= 2) return 2
  if (day <= 7) return 4
  return 5
}

export function costMessage(day: number): string[] | null {
  if (day === 1)
    return [
      'ON DAY 1 THE COST OF LEMONADE IS',
      '2 CENTS PER GLASS.',
    ]
  if (day === 3)
    return [
      'YOUR COST OF LEMONADE HAS GONE UP',
      'TO 4 CENTS PER GLASS.',
    ]
  if (day === 8)
    return [
      'YOUR COST OF LEMONADE HAS GONE UP',
      'TO 5 CENTS PER GLASS.',
    ]
  return null
}

/**
 * Demand model.
 *
 * The original BASIC listing is not reproduced here line for line - this is a
 * reconstruction tuned to behave the way the game plays: cheap lemonade sells
 * out, nobody buys at any price once it stops being a bargain, heat pushes both the crowd and the
 * price people will tolerate upwards, and signs help a lot at first and
 * hardly at all after the fourth one.
 */
export interface WeatherProfile {
  label: string
  /** Passers-by on an average day. */
  traffic: number
  /** Price (in cents) at which sales fall to nothing. */
  priceCeiling: number
}

export const WEATHER: Record<Weather, WeatherProfile> = {
  sunny: { label: 'SUNNY', traffic: 90, priceCeiling: 20 },
  cloudy: { label: 'CLOUDY', traffic: 60, priceCeiling: 15 },
  hot: { label: 'HOT AND DRY', traffic: 120, priceCeiling: 30 },
}

/** A heat wave on a hot day turns the street into a desert full of buyers. */
export const HEAT_WAVE_TRAFFIC = 1.5
export const HEAT_WAVE_CEILING = 1.25
/** Street crews close the road; a handful of regulars still find you. */
export const STREET_CREW_TRAFFIC = 0.2
/** A fair or a parade: the whole town is out, and out to spend. */
export const FESTIVAL_TRAFFIC = 1.9
export const FESTIVAL_CEILING = 1.2
/** A stand on the next corner takes a little under half the street. */
export const RIVAL_TRAFFIC = 0.58

/** Signs: +20% for the first, tailing off to a hard ceiling near +50%. */
export function signFactor(signs: number): number {
  return 1 + 0.5 * (1 - Math.pow(0.6, Math.max(0, signs)))
}

export function priceFactor(price: number, ceiling: number): number {
  if (price >= ceiling) return 0
  if (price <= 0) return 1
  return Math.pow((ceiling - price) / ceiling, 1.6)
}
