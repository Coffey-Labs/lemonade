import {
  FESTIVAL_CEILING,
  FESTIVAL_TRAFFIC,
  HEAT_WAVE_CEILING,
  HEAT_WAVE_TRAFFIC,
  RIVAL_TRAFFIC,
  STREET_CREW_TRAFFIC,
  SIGN_COST,
  WEATHER,
  costPerGlass,
  priceFactor,
  signFactor,
} from './constants'
import { chance, type Rng } from './rng'
import type { CarryOver, DayConditions, DayResult, Decision, Player, Weather } from './types'

/**
 * Roll the weather and the day's events. The storm is decided here but must
 * not be shown to the player until their money is committed - that is the
 * whole cruelty of a cloudy day.
 */
export function rollDay(day: number, rng: Rng, yesterday: CarryOver): DayConditions {
  const roll = rng()
  let weather: Weather
  if (roll < 0.5) weather = 'sunny'
  else if (roll < 0.8) weather = 'cloudy'
  else weather = 'hot'

  // Day 1 is always sunny so nobody loses their stake before they have played.
  if (day === 1) weather = 'sunny'

  const heatWave = weather === 'hot' && chance(rng, 0.35)
  const storm = weather === 'cloudy' && chance(rng, 0.25)
  // Road works run for two days once they start, and never on day 1 or 2.
  const streetCrew = day > 2 && (yesterday.streetCrew ? chance(rng, 0.5) : chance(rng, 0.12))
  // Nobody holds a fair on a dug-up street, or in the rain.
  const festival = day > 1 && !streetCrew && !storm && chance(rng, 0.1)
  // A rival sets up once there is business worth taking, and lingers.
  const rival = day > 3 && (yesterday.rival ? chance(rng, 0.6) : chance(rng, 0.14))

  return {
    day,
    weather,
    heatWave,
    streetCrew,
    festival,
    rival,
    storm,
    costPerGlass: costPerGlass(day),
  }
}

/** The most glasses a player can pay for today, given signs already planned. */
export function affordableGlasses(assets: number, day: number, signs = 0): number {
  return Math.max(0, Math.floor((assets - signs * SIGN_COST) / costPerGlass(day)))
}

export function simulate(
  player: Player,
  decision: Decision,
  cond: DayConditions,
  rng: Rng,
): DayResult {
  const lemonadeCost = decision.glasses * cond.costPerGlass
  const signCost = decision.signs * SIGN_COST
  const expenses = lemonadeCost + signCost

  let glassesSold = 0
  if (!cond.storm) {
    const profile = WEATHER[cond.weather]
    let traffic = profile.traffic
    let ceiling = profile.priceCeiling
    if (cond.heatWave) {
      traffic *= HEAT_WAVE_TRAFFIC
      ceiling *= HEAT_WAVE_CEILING
    }
    if (cond.streetCrew) traffic *= STREET_CREW_TRAFFIC
    if (cond.festival) {
      traffic *= FESTIVAL_TRAFFIC
      ceiling *= FESTIVAL_CEILING
    }
    if (cond.rival) traffic *= RIVAL_TRAFFIC

    const demand =
      traffic *
      priceFactor(decision.price, ceiling) *
      signFactor(decision.signs) *
      // A little daily luck, +/- 10%, so identical days are never identical.
      (0.9 + rng() * 0.2)

    glassesSold = Math.min(decision.glasses, Math.round(demand))
  }

  const income = glassesSold * decision.price
  const profit = income - expenses

  return {
    playerId: player.id,
    decision,
    glassesSold,
    income,
    lemonadeCost,
    signCost,
    expenses,
    profit,
    assetsAfter: player.assets + profit,
  }
}

/** Broke means you cannot even make a single glass tomorrow. */
export function isBankrupt(assets: number, nextDay: number): boolean {
  return assets < costPerGlass(nextDay)
}

/**
 * How busy the street looks before anyone has priced anything - used to
 * decide how many people walk on. Not part of the simulation.
 */
export function streetBusyness(cond: DayConditions): number {
  if (cond.storm) return 0.18
  const base = WEATHER[cond.weather].traffic / 140
  const heat = cond.heatWave ? 1.35 : 1
  const crew = cond.streetCrew ? STREET_CREW_TRAFFIC : 1
  const fair = cond.festival ? 1.6 : 1
  const rival = cond.rival ? RIVAL_TRAFFIC : 1
  return Math.max(0, Math.min(1, base * heat * crew * fair * rival))
}

/** How busy it actually was, from the glasses that crossed the counter. */
export const soldBusyness = (sold: number) => Math.max(0, Math.min(1, sold / 55))

export const dollars = (cents: number): string => {
  const sign = cents < 0 ? '-' : ''
  const abs = Math.abs(cents)
  return `${sign}$${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, '0')}`
}

export const randomSeed = () => Math.floor(Math.random() * 1_000_000) + 1
