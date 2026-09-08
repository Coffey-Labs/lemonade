import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { DAY_TUNE, END_TUNE, TITLE_TUNE } from './audio/tunes'
import { synth } from './audio/synth'
import { WEATHER } from './game/constants'
import { dollars, randomSeed, rollDay, simulate } from './game/engine'
import { makeRng, type Rng } from './game/rng'
import { activePlayers, initialState, reducer } from './game/reducer'
import type { Decision } from './game/types'
import { BriefingScreen } from './components/BriefingScreen'
import { Btn, Crt, Fit } from './components/Crt'
import { DecideScreen } from './components/DecideScreen'
import { GameOverScreen } from './components/GameOverScreen'
import { IntroScreen } from './components/IntroScreen'
import { ReportScreen } from './components/ReportScreen'
import { SetupScreen } from './components/SetupScreen'
import { TitleScreen } from './components/TitleScreen'
import './App.css'

export default function App() {
  const [seed] = useState(randomSeed)
  const [state, dispatch] = useReducer(reducer, seed, initialState)
  const rng = useRef<Rng>(makeRng(seed))
  const [music, setMusic] = useState(true)
  const [sfx, setSfx] = useState(true)
  const started = useRef(false)

  const active = activePlayers(state)
  const current = active[Math.min(state.turn, Math.max(0, active.length - 1))]

  // ------------------------------------------------------------ audio glue

  const wake = useCallback(() => {
    if (started.current) return
    started.current = true
    synth.ensure()
    synth.setMusic(music)
    synth.setSfx(sfx)
  }, [music, sfx])

  useEffect(() => {
    if (!started.current) return
    const tune =
      state.phase === 'gameover'
        ? END_TUNE
        : state.phase === 'title' || state.phase === 'intro' || state.phase === 'setup'
          ? TITLE_TUNE
          : DAY_TUNE
    synth.playTune(tune, false)
  }, [state.phase])

  useEffect(() => {
    synth.setMusic(music)
  }, [music])
  useEffect(() => {
    synth.setSfx(sfx)
  }, [sfx])

  const blip = useCallback(() => synth.blip(), [])

  const goSetup = useCallback(() => {
    wake()
    synth.select()
    dispatch({ type: 'SHOW_SETUP' })
  }, [wake])

  const goIntro = useCallback(() => {
    wake()
    synth.select()
    dispatch({ type: 'SHOW_INTRO' })
  }, [wake])

  // -------------------------------------------------------------- handlers

  const beginDay = useCallback(
    (day: number, streetCrewYesterday: boolean) => {
      const conditions = rollDay(day, rng.current, streetCrewYesterday)
      dispatch({ type: 'BEGIN_DAY', conditions })
      if (conditions.heatWave) synth.heat()
      else if (conditions.weather === 'sunny') synth.sunshine()
    },
    [],
  )

  const start = (names: string[]) => {
    wake()
    synth.select()
    dispatch({ type: 'START', names })
    beginDay(1, false)
  }

  const submit = (decision: Decision) => {
    if (!state.conditions || !current) return
    const decisions = { ...state.decisions, [current.id]: decision }
    dispatch({ type: 'SUBMIT', playerId: current.id, decision })

    const everyoneIn = active.every((p) => decisions[p.id] !== undefined)
    if (!everyoneIn) return

    const results = active.map((p) => simulate(p, decisions[p.id], state.conditions!, rng.current))
    dispatch({ type: 'RESOLVE', results })

    if (state.conditions.storm) synth.thunder()
    else if (results.some((r) => r.profit > 0)) synth.cash()
    else synth.sad()
  }

  const nextDay = () => {
    synth.select()
    dispatch({ type: 'NEXT_DAY' })
    beginDay(state.day + 1, state.streetCrewYesterday)
  }

  const retire = () => {
    synth.fanfare()
    dispatch({ type: 'RETIRE' })
  }

  const restart = () => {
    const s = randomSeed()
    rng.current = makeRng(s)
    dispatch({ type: 'RESTART', seed: s })
  }

  // ---------------------------------------------------------------- render

  const status = useMemo(() => {
    if (state.phase === 'title' || state.phase === 'intro' || state.phase === 'setup') return null
    const w = state.conditions ? WEATHER[state.conditions.weather].label : ''
    return { day: state.day, weather: w, player: current }
  }, [state.phase, state.day, state.conditions, current])

  return (
    <div className="app" onPointerDown={wake} onKeyDown={wake}>
      <Crt
        footer={
          <div className="controls">
            <Btn
              kind="ghost"
              onClick={() => {
                wake()
                setMusic((m) => !m)
              }}
              title="Background music"
            >
              MUSIC {music ? 'ON' : 'OFF'}
            </Btn>
            <Btn
              kind="ghost"
              onClick={() => {
                wake()
                setSfx((s) => !s)
              }}
              title="Sound effects"
            >
              SOUND {sfx ? 'ON' : 'OFF'}
            </Btn>
            <Btn kind="ghost" onClick={restart} title="Abandon this run">
              NEW GAME
            </Btn>
            <span className="seed">SEED {state.seed}</span>
          </div>
        }
      >
        {status && (
          <div className="statusbar">
            <span>DAY {String(status.day).padStart(2, '0')}</span>
            <span>{status.weather}</span>
            <span>{status.player ? dollars(status.player.assets) : '--'}</span>
          </div>
        )}

        <Fit>
          {state.phase === 'title' && (
            <TitleGate seed={state.seed} onStart={goSetup} onInstructions={goIntro} />
          )}

          {state.phase === 'intro' && <IntroScreen onDone={() => dispatch({ type: 'SHOW_SETUP' })} />}

          {state.phase === 'setup' && <SetupScreen onStart={start} onBlip={blip} />}

          {state.phase === 'briefing' && state.conditions && (
            <BriefingScreen
              conditions={state.conditions}
              onContinue={() => {
                synth.select()
                dispatch({ type: 'OPEN_STAND' })
              }}
            />
          )}

          {state.phase === 'decide' && state.conditions && current && (
            <DecideScreen
              key={`${state.day}-${current.id}`}
              player={current}
              conditions={state.conditions}
              playerCount={active.length}
              onSubmit={submit}
              onBlip={blip}
              onReject={() => synth.reject()}
            />
          )}

          {state.phase === 'report' && state.conditions && (
            <ReportScreen
              key={state.day}
              results={state.results}
              players={state.players}
              conditions={state.conditions}
              onNextDay={nextDay}
              onRetire={retire}
              onBlip={blip}
            />
          )}

          {state.phase === 'gameover' && (
            <GameOverScreen
              players={state.players}
              history={state.history}
              days={state.day}
              onRestart={restart}
            />
          )}
        </Fit>
      </Crt>
    </div>
  )
}

/** Enter or Space works as the START key, the way the console did. */
function TitleGate(props: { seed: number; onStart: () => void; onInstructions: () => void }) {
  const { onStart } = props

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') onStart()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onStart])

  return <TitleScreen {...props} />
}
