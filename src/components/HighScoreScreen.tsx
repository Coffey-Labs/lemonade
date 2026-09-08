import { dollars } from '../game/engine'
import { MAX_SCORES, type Score } from '../game/highscores'
import { Btn, Line } from './Crt'

export type BoardState = 'loading' | 'ready' | 'error'

const shortDate = (at: number) =>
  new Date(at).toLocaleDateString(undefined, { day: '2-digit', month: 'short' }).toUpperCase()

export function HighScoreScreen({
  scores,
  state,
  highlight,
  onBack,
  onRetry,
}: {
  scores: Score[]
  state: BoardState
  highlight: string[]
  onBack: () => void
  onRetry: () => void
}) {
  const fresh = new Set(highlight)

  return (
    <div className="stack">
      <Line className="center inv-line">$$ BEST STANDS IN LEMONSVILLE $$</Line>
      <Line />

      {state === 'loading' && (
        <>
          <Line className="center dim">CALLING LEMONSVILLE</Line>
          <Line className="center blink">&#9608;</Line>
        </>
      )}

      {state === 'error' && (
        <>
          <Line className="center warn">CANNOT REACH LEMONSVILLE.</Line>
          <Line />
          <Line className="center dim">THE BOARD IS KEPT IN TOWN, NOT IN</Line>
          <Line className="center dim">THIS BROWSER, SO IT NEEDS A LINE OUT.</Line>
        </>
      )}

      {state === 'ready' && scores.length === 0 && (
        <>
          <Line className="center dim">NO STANDS HAVE CLOSED THEIR BOOKS YET.</Line>
          <Line />
          <Line className="center dim">RETIRE AT THE END OF A SUMMER TO</Line>
          <Line className="center dim">TAKE A PLACE ON THIS LIST.</Line>
        </>
      )}

      {state === 'ready' &&
        scores.map((s, i) => (
          <div className={`report-row score-row ${fresh.has(s.id) ? 'is-new' : ''}`} key={s.id}>
            <span className="report-label">
              {String(i + 1).padStart(2, ' ')}. {s.name}
              {s.broke ? ' (BROKE)' : ''}
            </span>
            <span className="report-dots" aria-hidden />
            <span className="score-days dim">
              {s.days}D &middot; {shortDate(s.at)}
            </span>
            <span className="report-value money">{dollars(s.assets)}</span>
          </div>
        ))}

      <Line />
      <Line className="center dim">
        {state === 'ready'
          ? `TOP ${MAX_SCORES}, FROM EVERY STAND IN TOWN.`
          : ' '}
      </Line>
      <div className="row center">
        <Btn kind="primary" onClick={onBack}>
          BACK
        </Btn>
        {state !== 'loading' && <Btn onClick={onRetry}>REFRESH</Btn>}
      </div>
    </div>
  )
}
