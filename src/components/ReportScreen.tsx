import { useState } from 'react'
import { WEATHER } from '../game/constants'
import { dollars, soldBusyness } from '../game/engine'
import type { DayConditions, DayResult, Player } from '../game/types'
import { Btn, Line } from './Crt'
import { Scene } from './Scene'

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`report-row ${strong ? 'strong' : ''}`}>
      <span className="report-label">{label}</span>
      <span className="report-dots" aria-hidden />
      <span className="report-value">{value}</span>
    </div>
  )
}

export function ReportScreen({
  results,
  players,
  conditions,
  onNextDay,
  onRetire,
  onBlip,
}: {
  results: DayResult[]
  players: Player[]
  conditions: DayConditions
  onNextDay: () => void
  onRetire: () => void
  onBlip: () => void
}) {
  // App remounts this each day, so this starts fresh without a reset effect.
  const [index, setIndex] = useState(0)

  const r = results[index]
  const player = players.find((p) => p.id === r.playerId)!
  const isLast = index === results.length - 1
  const everyoneBroke = players.every((p) => p.bankrupt)

  const events = [
    WEATHER[conditions.weather].label,
    conditions.heatWave ? 'HEAT WAVE' : null,
    conditions.festival ? 'SUMMER FAIR' : null,
    conditions.streetCrew ? 'STREET CREWS' : null,
    conditions.rival ? 'RIVAL STAND' : null,
    conditions.storm ? 'THUNDERSTORM' : null,
  ]
    .filter(Boolean)
    .join(' \u00b7 ')

  return (
    <div className="stack">
      <Line className="center inv-line">$$ LEMONSVILLE DAILY FINANCIAL REPORT $$</Line>

      <Scene
        conditions={conditions}
        price={r.decision.price}
        traffic={soldBusyness(r.glassesSold)}
        variant="strip"
      />
      <Line className="center accent">
        DAY {conditions.day} &mdash; {player.name}
      </Line>
      <Line className="center dim">{events}</Line>
      <Line />
      <Row label="GLASSES SOLD" value={String(r.glassesSold)} />
      <Row label="PRICE PER GLASS" value={`${r.decision.price}¢`} />
      <Row label="INCOME" value={dollars(r.income)} />
      <Line />
      <Row label="GLASSES MADE" value={String(r.decision.glasses)} />
      <Row label="COST OF LEMONADE" value={dollars(r.lemonadeCost)} />
      <Row label="COST OF SIGNS" value={dollars(r.signCost)} />
      <Row label="EXPENSES" value={dollars(r.expenses)} />
      <Line />
      <Row label="PROFIT" value={dollars(r.profit)} strong />
      <Row label="ASSETS" value={dollars(r.assetsAfter)} strong />


      {player.bankrupt && (
        <>
          <Line />
          <Line className="warn">{player.name}, YOU DO NOT HAVE ENOUGH</Line>
          <Line className="warn">MONEY LEFT TO STAY IN BUSINESS.</Line>
        </>
      )}

      <div className="row center">
        {!isLast && (
          <Btn
            kind="primary"
            onClick={() => {
              onBlip()
              setIndex(index + 1)
            }}
          >
            NEXT REPORT ({index + 2}/{results.length})
          </Btn>
        )}
        {isLast && !everyoneBroke && (
          <Btn kind="primary" onClick={onNextDay}>
            DAY {conditions.day + 1}
          </Btn>
        )}
        {isLast && (
          <Btn kind={everyoneBroke ? 'primary' : 'normal'} onClick={onRetire}>
            {everyoneBroke ? 'SEE FINAL STANDINGS' : 'RETIRE'}
          </Btn>
        )}
      </div>
    </div>
  )
}
