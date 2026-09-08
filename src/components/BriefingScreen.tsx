import { WEATHER, costMessage } from '../game/constants'
import { streetBusyness } from '../game/engine'
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
      <Scene conditions={{ ...conditions, storm: false }} traffic={streetBusyness(conditions)} />
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
          <Line className="warn">A HEAT WAVE HAS SETTLED OVER THE</Line>
          <Line className="warn">TOWN. EVERY THROAT IN IT IS DRY.</Line>
        </>
      )}
      {conditions.streetCrew && (
        <>
          <Line />
          <Line className="warn">THE ROAD IS DUG UP OUTSIDE. NOTHING</Line>
          <Line className="warn">IS COMING DOWN YOUR STREET TODAY.</Line>
        </>
      )}
      {conditions.festival && (
        <>
          <Line />
          <Line className="accent">THE SUMMER FAIR IS ON TODAY. HALF</Line>
          <Line className="accent">THE TOWN WILL COME PAST, AND THEY</Line>
          <Line className="accent">ARE OUT TO SPEND.</Line>
        </>
      )}
      {conditions.rival && (
        <>
          <Line />
          <Line className="warn">SOMEBODY HAS SET UP A STAND ON THE</Line>
          <Line className="warn">NEXT CORNER. YOU WILL BE SPLITTING</Line>
          <Line className="warn">THE STREET WITH THEM.</Line>
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
