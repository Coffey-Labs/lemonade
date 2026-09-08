import { useEffect, useRef, useState } from 'react'
import { synth } from '../audio/synth'
import { Btn } from './Crt'

const LOAD_SECONDS = 4.2

/**
 * Loading from cassette, the way the listing in the magazine arrived. It is
 * also where the audio gets unlocked: browsers want a gesture before they
 * will make a sound, and pressing PLAY is exactly that gesture.
 */
export function BootScreen({ onLoaded }: { onLoaded: () => void }) {
  const [stage, setStage] = useState<'ready' | 'loading' | 'done'>('ready')
  const [progress, setProgress] = useState(0)
  const stopTape = useRef<(() => void) | null>(null)

  useEffect(() => () => stopTape.current?.(), [])

  useEffect(() => {
    if (stage !== 'loading') return
    const startedAt = performance.now()
    let raf = 0
    const frame = (now: number) => {
      const p = Math.min(1, (now - startedAt) / (LOAD_SECONDS * 1000))
      setProgress(p)
      if (p < 1) raf = requestAnimationFrame(frame)
      else {
        stopTape.current?.()
        setStage('done')
        synth.beep()
        window.setTimeout(onLoaded, 650)
      }
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [stage, onLoaded])

  const play = () => {
    synth.ensure()
    synth.beep()
    stopTape.current = synth.tape(LOAD_SECONDS)
    setStage('loading')
  }

  const skip = () => {
    stopTape.current?.()
    onLoaded()
  }

  return (
    <div className="boot">
      {/* Loader stripes bleed off both edges, the way tape loaders did. */}
      {stage === 'loading' && <div className="boot-stripes" aria-hidden />}

      <div className="boot-text">
        <div>ATARI 8K BASIC&nbsp;&nbsp;REV. B</div>
        <div>&nbsp;</div>
        <div>READY</div>
        <div>CLOAD</div>

        {stage === 'ready' && (
          <>
            <div>&nbsp;</div>
            <div>PRESS PLAY ON RECORDER, THEN RETURN.</div>
            <div className="boot-cursor">&#9608;</div>
          </>
        )}

        {stage !== 'ready' && (
          <>
            <div>&nbsp;</div>
            <div>
              LOADING &quot;LEMONADE&quot;
              {stage === 'loading' ? '.'.repeat(1 + Math.floor(progress * 12)) : ''}
            </div>
            {stage === 'done' && (
              <>
                <div>&nbsp;</div>
                <div>READY</div>
                <div className="boot-cursor">&#9608;</div>
              </>
            )}
          </>
        )}
      </div>

      <div className="boot-controls">
        {stage === 'ready' ? (
          <Btn kind="primary" onClick={play}>
            &#9658; PRESS PLAY
          </Btn>
        ) : (
          stage === 'loading' && (
            <Btn kind="ghost" onClick={skip}>
              SKIP THE LOAD
            </Btn>
          )
        )}
      </div>
    </div>
  )
}
