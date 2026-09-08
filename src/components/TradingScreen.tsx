import { useEffect, useRef, useState } from 'react'
import { soldBusyness } from '../game/engine'
import type { DayConditions, DayResult, Player } from '../game/types'
import { synth } from '../audio/synth'
import { Btn, Line } from './Crt'
import { Scene } from './Scene'

const TRADING_MS = 2900
const STORM_MS = 3400

/** Fast at first, settling at the end, the way a rush tails off. */
const easeOut = (p: number) => 1 - Math.pow(1 - p, 2.2)

export function TradingScreen({
  results,
  players,
  conditions,
  onDone,
}: {
  results: DayResult[]
  players: Player[]
  conditions: DayConditions
  onDone: () => void
}) {
  const [progress, setProgress] = useState(0)
  const ticked = useRef(0)

  useEffect(() => {
    const total = results.reduce((n, r) => n + r.glassesSold, 0)
    const span = conditions.storm ? STORM_MS : TRADING_MS
    const startedAt = performance.now()
    let raf = 0

    if (conditions.storm) synth.thunder()

    const frame = (now: number) => {
      const p = Math.min(1, (now - startedAt) / span)
      setProgress(p)

      // A blip per few glasses, so a busy day sounds busy.
      if (!conditions.storm && total > 0) {
        const sold = Math.round(easeOut(p) * total)
        const step = Math.max(1, Math.ceil(total / 14))
        if (sold >= ticked.current + step) {
          ticked.current = sold
          synth.tick()
        }
      }

      if (p < 1) raf = requestAnimationFrame(frame)
      else onDone()
    }

    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [results, conditions.storm, onDone])

  const eased = easeOut(progress)
  const sold = (r: DayResult) => Math.round(eased * r.glassesSold)
  const soldTotal = results.reduce((n, r) => n + sold(r), 0)
  const madeTotal = results.reduce((n, r) => n + r.decision.glasses, 0)

  if (conditions.storm) {
    return (
      <div className="stack">
        <Line className="center inv-line">DAY {conditions.day} IN LEMONSVILLE</Line>
        <Scene conditions={conditions} traffic={0.2} />
        <Line className="warn">A THUNDERSTORM HIT LEMONSVILLE EARLIER</Line>
        <Line className="warn">TODAY, JUST AS THE STANDS WERE BEING</Line>
        <Line className="warn">SET UP. EVERYTHING WAS RUINED!!</Line>
        <Line />
        <div className="row center">
          <Btn kind="primary" onClick={onDone}>
            SEE THE DAMAGE
          </Btn>
        </div>
      </div>
    )
  }

  return (
    <div className="stack">
      <Line className="center inv-line">DAY {conditions.day} &mdash; OPEN FOR BUSINESS</Line>
      <Scene
        conditions={conditions}
        price={results[0].decision.price}
        traffic={soldBusyness(results[0].glassesSold)}
      />

      <Line className="center accent">
        {soldTotal} OF {madeTotal} GLASSES SOLD
      </Line>
      <div className="till" aria-hidden>
        <span style={{ width: `${Math.round(progress * 100)}%` }} />
      </div>

      {results.length > 1 &&
        results.map((r) => {
          const player = players.find((p) => p.id === r.playerId)!
          return (
            <div className="report-row" key={r.playerId}>
              <span className="report-label">{player.name}</span>
              <span className="report-dots" aria-hidden />
              <span className="report-value">{sold(r)}</span>
            </div>
          )
        })}

      <Line />
      <div className="row center">
        <Btn kind="ghost" onClick={onDone}>
          SKIP TO THE BOOKS
        </Btn>
      </div>
    </div>
  )
}
