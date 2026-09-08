import { STARTING_ASSETS } from '../game/constants'
import { dollars } from '../game/engine'
import type { DayResult, Player } from '../game/types'
import { Btn, Line } from './Crt'
import { bannerRows } from './logo'

const BANNER = bannerRows('LEMONADE')

export function GameOverScreen({
  players,
  history,
  days,
  onRestart,
}: {
  players: Player[]
  history: DayResult[]
  days: number
  onRestart: () => void
}) {
  const ranked = [...players].sort((a, b) => b.assets - a.assets)
  const best = history.reduce<DayResult | null>(
    (acc, r) => (acc === null || r.profit > acc.profit ? r : acc),
    null,
  )
  const bestPlayer = best ? players.find((p) => p.id === best.playerId) : null
  const totalGlasses = history.reduce((n, r) => n + r.glassesSold, 0)

  return (
    <div className="stack">
      <pre className="banner small" aria-hidden>
        {BANNER.join('\n')}
      </pre>
      <Line className="center inv-line">THE SUMMER IS OVER</Line>
      <Line />
      <Line className="center">
        {days} {days === 1 ? 'DAY' : 'DAYS'} OF TRADING &middot; {totalGlasses} GLASSES SOLD
      </Line>
      <Line />
      {ranked.map((p, i) => {
        const net = p.assets - STARTING_ASSETS
        return (
          <div className="report-row" key={p.id}>
            <span className="report-label">
              {i + 1}. {p.name}
              {p.bankrupt ? ' (BROKE)' : ''}
            </span>
            <span className="report-dots" aria-hidden />
            <span className={`report-value ${net >= 0 ? 'money' : 'warn'}`}>
              {dollars(p.assets)}
            </span>
          </div>
        )
      })}
      <Line />
      {best && bestPlayer && (
        <Line className="center dim">
          BEST DAY: {bestPlayer.name} MADE {dollars(best.profit)} ON DAY{' '}
          {Math.floor(history.indexOf(best) / Math.max(1, players.length)) + 1}
        </Line>
      )}
      <Line />
      <Line className="center accent">
        {ranked[0].assets > STARTING_ASSETS
          ? 'NOT BAD FOR A CARD TABLE AND A PITCHER.'
          : 'THE LEMONS WON THIS TIME.'}
      </Line>
      <Line />
      <div className="row center">
        <Btn kind="primary" onClick={onRestart}>
          PLAY AGAIN
        </Btn>
      </div>
    </div>
  )
}
