import { useSkin } from '../skin'
import { Btn, Line } from './Crt'
import { bannerRows } from './logo'

const BANNER = bannerRows('LEMONADE')

/** The block-letter banner is the 1979 article; modern gets a wordmark. */
export function Wordmark({ small = false }: { small?: boolean }) {
  const { skin } = useSkin()
  if (skin === 'modern') {
    return (
      <div className={`wordmark ${small ? 'small' : ''}`}>
        <b>LEMONADE</b>
        <span>STAND</span>
      </div>
    )
  }
  return (
    <pre className={`banner ${small ? 'small' : ''}`} aria-label="LEMONADE">
      {BANNER.join('\n')}
    </pre>
  )
}

export function TitleScreen({
  onStart,
  onInstructions,
  onScores,
  seed,
}: {
  onStart: () => void
  onInstructions: () => void
  onScores: () => void
  seed: number
}) {
  const { skin } = useSkin()

  return (
    <div className="stack">
      <Wordmark />
      {skin === 'crt' && <Line className="center accent">S T A N D</Line>}
      <Line />
      <Line className="center">LEMONSVILLE, CALIFORNIA</Line>
      <Line className="center dim">
        {skin === 'crt' ? 'ATARI 8-BIT EDITION' : 'REMASTERED'} &middot; SEED {seed}
      </Line>
      <Line />
      <Line className="center blink">PRESS START</Line>
      <Line />
      <div className="row center">
        <Btn kind="primary" onClick={onStart}>
          START
        </Btn>
        <Btn onClick={onInstructions}>INSTRUCTIONS</Btn>
        <Btn onClick={onScores}>HIGH SCORES</Btn>
      </div>
    </div>
  )
}
