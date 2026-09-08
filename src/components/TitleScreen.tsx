import { Btn, Line } from './Crt'
import { bannerRows } from './logo'

const BANNER = bannerRows('LEMONADE')

export function TitleScreen({
  onStart,
  onInstructions,
  seed,
}: {
  onStart: () => void
  onInstructions: () => void
  seed: number
}) {
  return (
    <div className="stack">
      <pre className="banner" aria-label="LEMONADE">
        {BANNER.join('\n')}
      </pre>
      <Line className="center accent">S T A N D</Line>
      <Line />
      <Line className="center">LEMONSVILLE, CALIFORNIA</Line>
      <Line className="center dim">ATARI 8-BIT EDITION &middot; SEED {seed}</Line>
      <Line />
      <Line className="center blink">PRESS START</Line>
      <Line />
      <div className="row center">
        <Btn kind="primary" onClick={onStart}>
          START
        </Btn>
        <Btn onClick={onInstructions}>INSTRUCTIONS</Btn>
      </div>
    </div>
  )
}
