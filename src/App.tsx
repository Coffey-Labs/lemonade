import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { FUNK_DAY, FUNK_END, FUNK_TITLE } from './audio/funk'
import { DAY_TUNE, END_TUNE, TITLE_TUNE } from './audio/tunes'
import { synth } from './audio/synth'
import { WEATHER } from './game/constants'
import { dollars, randomSeed, rollDay, simulate } from './game/engine'
import { makeRng, type Rng } from './game/rng'
import { fetchScores, submitScores, type Score } from './game/highscores'
import { activePlayers, initialState, reducer } from './game/reducer'
import type { CarryOver, Decision } from './game/types'
import { useSkin } from './skin'
import { BootScreen } from './components/BootScreen'
import { BriefingScreen } from './components/BriefingScreen'
import { Btn, Crt, Fit } from './components/Crt'
import { DecideScreen } from './components/DecideScreen'
import { GameOverScreen } from './components/GameOverScreen'
import { HighScoreScreen, type BoardState } from './components/HighScoreScreen'
import { IntroScreen } from './components/IntroScreen'
import { ReportScreen } from './components/ReportScreen'
import { TradingScreen } from './components/TradingScreen'
import { SetupScreen } from './components/SetupScreen'
import { TitleScreen } from './components/TitleScreen'
import './App.css'

/**
 * AGPL section 13: anyone playing this over a network is entitled to the
 * source of the version they are playing, so the offer sits on every screen.
 */
const SOURCE_URL = 'https://git.coffeylabs.org/jcoffey-dev/lemonade'

/**
 * The way back out.
 *
 * Absolute rather than `/`, because this game is served from a subdirectory in
 * production and from the root in development -- so the relative answer is
 * right in one of those and points at the game itself in the other. The
 * destination is a particular site, and naming it is the honest way to say so.
 * The source link next to it works the same way for the same reason.
 */
const GAMES_URL = 'https://games.jcoffey.dev/'

export default function App() {
  const [seed] = useState(randomSeed)
  const [state, dispatch] = useReducer(reducer, seed, initialState)
  const rng = useRef<Rng>(makeRng(seed))
  const [music, setMusic] = useState(true)
  const [sfx, setSfx] = useState(true)
  const started = useRef(false)
  const { skin, toggle: toggleSkin } = useSkin()
  const [scores, setScores] = useState<Score[]>([])
  const [boardState, setBoardState] = useState<BoardState>('loading')
  const [freshScores, setFreshScores] = useState<string[]>([])

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

  // 1979 gets the chiptune; the remaster gets the band.
  useEffect(() => {
    if (!started.current) return
    const front = state.phase === 'title' || state.phase === 'intro' || state.phase === 'setup'
    const set =
      skin === 'modern'
        ? { title: FUNK_TITLE, day: FUNK_DAY, end: FUNK_END }
        : { title: TITLE_TUNE, day: DAY_TUNE, end: END_TUNE }
    const tune = state.phase === 'gameover' ? set.end : front ? set.title : set.day
    synth.playTune(tune, false)
  }, [state.phase, skin])

  useEffect(() => {
    synth.setMusic(music)
  }, [music])
  useEffect(() => {
    synth.setSfx(sfx)
  }, [sfx])

  /** The board lives in town, so it is fetched rather than remembered. */
  const loadBoard = useCallback(async () => {
    setBoardState('loading')
    try {
      setScores(await fetchScores())
      setBoardState('ready')
    } catch {
      setBoardState('error')
    }
  }, [])

  const blip = useCallback(() => synth.blip(), [])

  // Pressing PLAY was the gesture that unlocked audio, so the band can start.
  const booted = useCallback(() => {
    wake()
    dispatch({ type: 'BOOTED' })
  }, [wake])

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
    (day: number, yesterday: CarryOver) => {
      const conditions = rollDay(day, rng.current, yesterday)
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
    beginDay(1, { streetCrew: false, rival: false })
  }

  const submit = (decision: Decision) => {
    if (!state.conditions || !current) return
    const decisions = { ...state.decisions, [current.id]: decision }
    dispatch({ type: 'SUBMIT', playerId: current.id, decision })

    const everyoneIn = active.every((p) => decisions[p.id] !== undefined)
    if (!everyoneIn) return

    const results = active.map((p) => simulate(p, decisions[p.id], state.conditions!, rng.current))
    dispatch({ type: 'RESOLVE', results })
  }

  /** The day has finished trading; ring up the takings and open the books. */
  const closeTill = useCallback(() => {
    if (state.conditions?.storm) synth.sad()
    else if (state.results.some((r) => r.profit > 0)) synth.cash()
    else synth.sad()
    dispatch({ type: 'SHOW_REPORT' })
  }, [state.conditions, state.results])

  const nextDay = () => {
    synth.select()
    dispatch({ type: 'NEXT_DAY' })
    beginDay(state.day + 1, state.yesterday)
  }

  /**
   * Close the books. The standings show straight away; posting to the town
   * board happens behind them, so a slow or missing line out never holds the
   * end of a season hostage.
   */
  const retire = () => {
    synth.fanfare()
    const glassesFor = (id: number) =>
      state.history.reduce((n, r) => (r.playerId === id ? n + r.glassesSold : n), 0)
    const entries = state.players.map((p) => ({
      name: p.name,
      assets: p.assets,
      days: p.bankruptDay ?? state.day,
      glasses: glassesFor(p.id),
      seed: state.seed,
      broke: p.bankrupt,
    }))

    dispatch({ type: 'RETIRE' })
    setBoardState('loading')
    submitScores(entries)
      .then(({ ids, scores: table }) => {
        setScores(table)
        setFreshScores(ids)
        setBoardState('ready')
      })
      .catch(() => setBoardState('error'))
  }

  const restart = () => {
    const s = randomSeed()
    rng.current = makeRng(s)
    setFreshScores([])
    dispatch({ type: 'RESTART', seed: s })
  }

  const showScores = () => {
    wake()
    synth.select()
    dispatch({ type: 'SHOW_SCORES' })
    if (boardState !== 'ready') void loadBoard()
  }

  // ---------------------------------------------------------------- render

  // Only the trading screens have a day, a sky and a till to report on.
  const status = useMemo(() => {
    const inPlay =
      state.phase === 'briefing' ||
      state.phase === 'decide' ||
      state.phase === 'trading' ||
      state.phase === 'report'
    if (!inPlay || !state.conditions) return null
    return {
      day: state.day,
      weather: WEATHER[state.conditions.weather].label,
      player: current,
    }
  }, [state.phase, state.day, state.conditions, current])

  return (
    <div className="app" onPointerDown={wake} onKeyDown={wake}>
      <Crt
        footer={
          <div className="controls">
            {/* Leftmost, because that is where a way back belongs. */}
            <a
              className="btn btn-ghost back"
              href={GAMES_URL}
              title="The rest of the games"
            >
              GAMES
            </a>
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
            <Btn
              kind="ghost"
              onClick={() => {
                wake()
                synth.select()
                toggleSkin()
              }}
              title={skin === 'crt' ? 'Switch to the remaster' : 'Switch to the 1979 machine'}
            >
              {skin === 'crt' ? 'REMASTER' : '1979'}
            </Btn>
            <Btn kind="ghost" onClick={restart} title="Abandon this run">
              NEW GAME
            </Btn>
            <a
              className="btn btn-ghost"
              href={SOURCE_URL}
              target="_blank"
              rel="noreferrer noopener"
              title="Free software, AGPL-3.0-or-later"
            >
              SOURCE
            </a>
            <span className="seed">SEED {state.seed}</span>
          </div>
        }
      >
        {state.phase === 'boot' && <BootScreen onLoaded={booted} />}

        {status && (
          <div className="statusbar">
            <span>DAY {String(status.day).padStart(2, '0')}</span>
            <span>{status.weather}</span>
            <span>{status.player ? dollars(status.player.assets) : '--'}</span>
          </div>
        )}

        <Fit>
          {state.phase === 'title' && (
            <TitleGate
              seed={state.seed}
              onStart={goSetup}
              onInstructions={goIntro}
              onScores={showScores}
            />
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

          {state.phase === 'trading' && state.conditions && (
            <TradingScreen
              key={state.day}
              results={state.results}
              players={state.players}
              conditions={state.conditions}
              onDone={closeTill}
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
              onScores={showScores}
            />
          )}

          {state.phase === 'scores' && (
            <HighScoreScreen
              scores={scores}
              state={boardState}
              highlight={freshScores}
              onBack={() => {
                synth.select()
                dispatch({ type: 'CLOSE_SCORES' })
              }}
              onRetry={() => {
                synth.select()
                void loadBoard()
              }}
            />
          )}
        </Fit>
      </Crt>
    </div>
  )
}

/** Enter or Space works as the START key, the way the console did. */
function TitleGate(props: {
  seed: number
  onStart: () => void
  onInstructions: () => void
  onScores: () => void
}) {
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
