import { useState } from 'react'
import { dollars } from '../game/engine'
import { MAX_SCORES, type Score } from '../game/highscores'
import { Btn, Line } from './Crt'

const shortDate = (at: number) =>
  new Date(at).toLocaleDateString(undefined, { day: '2-digit', month: 'short' }).toUpperCase()

export function HighScoreScreen({
  scores,
  highlight,
  onBack,
  onClear,
  onBlip,
}: {
  scores: Score[]
  highlight: string[]
  onBack: () => void
  onClear: () => void
  onBlip: () => void
}) {
  const [confirming, setConfirming] = useState(false)
  const fresh = new Set(highlight)

  return (
    <div className="stack">
      <Line className="center inv-line">$$ BEST STANDS IN LEMONSVILLE $$</Line>
      <Line />

      {scores.length === 0 ? (
        <>
          <Line className="center dim">NO STANDS HAVE CLOSED THEIR BOOKS YET.</Line>
          <Line />
          <Line className="center dim">RETIRE AT THE END OF A SUMMER TO</Line>
          <Line className="center dim">TAKE A PLACE ON THIS LIST.</Line>
        </>
      ) : (
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
        ))
      )}

      <Line />
      <Line className="center dim">TOP {MAX_SCORES}, KEPT IN THIS BROWSER.</Line>
      <Line />
      <div className="row center">
        <Btn kind="primary" onClick={onBack}>
          BACK
        </Btn>
        {scores.length > 0 && (
          <Btn
            onClick={() => {
              onBlip()
              if (confirming) {
                onClear()
                setConfirming(false)
              } else {
                setConfirming(true)
              }
            }}
          >
            {confirming ? 'REALLY WIPE?' : 'WIPE TABLE'}
          </Btn>
        )}
      </div>
    </div>
  )
}
