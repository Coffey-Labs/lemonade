import { WEATHER, costMessage } from '../game/constants'
import type { DayConditions } from '../game/types'
import { Btn, Line } from './Crt'
import { Scene } from './Scene'

export function BriefingScreen({
  conditions,
  onContinue,
}: {
  conditions: DayConditions
  onContinue: () => void
}) {
  const cost = costMessage(conditions.day)

  return (
    <div className="stack">
      <Line className="center inv-line">DAY {conditions.day} IN LEMONSVILLE</Line>
      <Scene conditions={{ ...conditions, storm: false }} />
      <Line className="center accent">
        WEATHER REPORT: {WEATHER[conditions.weather].label}
      </Line>
      <Line />
      {cost?.map((t, i) => (
        <Line key={i}>{t}</Line>
      ))}
      {conditions.heatWave && (
        <>
          <Line />
          <Line className="warn">A HEAT WAVE IS PREDICTED FOR TODAY!</Line>
          <Line className="warn">EVERYONE IN TOWN IS THIRSTY.</Line>
        </>
      )}
      {conditions.streetCrew && (
        <>
          <Line />
          <Line className="warn">THE STREET CREWS ARE WORKING TODAY.</Line>
          <Line className="warn">THERE WILL BE NO TRAFFIC ON YOUR</Line>
          <Line className="warn">STREET.</Line>
        </>
      )}
      <Line />
      <div className="row center">
        <Btn kind="primary" onClick={onContinue}>
          OPEN THE STAND
        </Btn>
      </div>
    </div>
  )
}
