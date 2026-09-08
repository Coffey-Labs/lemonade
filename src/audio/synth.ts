/**
 * A very small chiptune engine: pulse waves for voices, filtered white noise
 * for percussion, and a look-ahead scheduler so patterns stay in time even
 * when React is busy re-rendering.
 */

const NOTE_INDEX: Record<string, number> = {
  C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5,
  'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11,
}

/** "C#4" -> Hz. A4 = 440. */
export function noteToFreq(note: string): number {
  const m = /^([A-G]#?)(-?\d)$/.exec(note)
  if (!m) return 0
  const semis = NOTE_INDEX[m[1]] + (Number(m[2]) + 1) * 12
  return 440 * Math.pow(2, (semis - 69) / 12)
}

export type Wave = 'pulse12' | 'pulse25' | 'pulse50' | 'triangle' | 'saw' | 'noise'

export interface Track {
  wave: Wave
  gain: number
  /**
   * One entry per step. '.' rest, '=' sustain previous, otherwise a note.
   * Slashes stack notes into a chord: "F4/A4/C5". On a noise track the
   * letter picks the drum: K kick, S snare, C clap, H closed hat, O open hat.
   */
  notes: string[]
  /** Sweeping lowpass, the whole point of a funk bass. */
  filter?: { from: number; to: number; q?: number }
  /** Fraction of the note's length actually sounded; low values are stabs. */
  gate?: number
  /** Cents, for a fatter unison. */
  detune?: number
}

export interface Tune {
  bpm: number
  stepsPerBeat: number
  tracks: Track[]
  /** 0 is straight, ~0.15 is a light funk shuffle. Delays every other step. */
  swing?: number
}

/** Fourier series for a pulse wave of the given duty cycle. */
function pulseWave(ctx: AudioContext, duty: number, harmonics = 24): PeriodicWave {
  const real = new Float32Array(harmonics + 1)
  const imag = new Float32Array(harmonics + 1)
  for (let n = 1; n <= harmonics; n++) {
    imag[n] = (2 / (n * Math.PI)) * Math.sin(n * Math.PI * duty)
  }
  return ctx.createPeriodicWave(real, imag, { disableNormalization: false })
}

export class Synth {
  private ctx: AudioContext | null = null
  private master!: GainNode
  private musicBus!: GainNode
  private sfxBus!: GainNode
  private waves: Partial<Record<Wave, PeriodicWave>> = {}
  private noiseBuffer!: AudioBuffer

  private tune: Tune | null = null
  private step = 0
  private nextStepTime = 0
  private timer: number | null = null

  musicOn = true
  sfxOn = true

  /** Must be called from a user gesture the first time. */
  ensure(): AudioContext {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume()
      return this.ctx
    }
    const ctx = new AudioContext()
    this.ctx = ctx
    this.master = ctx.createGain()
    this.master.gain.value = 0.5
    this.master.connect(ctx.destination)

    this.musicBus = ctx.createGain()
    this.musicBus.gain.value = 0.55
    this.musicBus.connect(this.master)

    this.sfxBus = ctx.createGain()
    this.sfxBus.gain.value = 0.9
    this.sfxBus.connect(this.master)

    this.waves.pulse12 = pulseWave(ctx, 0.125)
    this.waves.pulse25 = pulseWave(ctx, 0.25)
    this.waves.pulse50 = pulseWave(ctx, 0.5)

    const len = Math.floor(ctx.sampleRate * 1.5)
    const buf = ctx.createBuffer(1, len, ctx.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1
    this.noiseBuffer = buf

    return ctx
  }

  setMusic(on: boolean) {
    this.musicOn = on
    if (!this.ctx) return
    this.musicBus.gain.setTargetAtTime(on ? 0.55 : 0, this.ctx.currentTime, 0.05)
  }

  setSfx(on: boolean) {
    this.sfxOn = on
    if (!this.ctx) return
    this.sfxBus.gain.setTargetAtTime(on ? 0.9 : 0, this.ctx.currentTime, 0.02)
  }

  // ---------------------------------------------------------------- voices

  private voice(
    dest: AudioNode,
    wave: Wave,
    freq: number,
    at: number,
    dur: number,
    gain: number,
    opts: { filter?: Track['filter']; detune?: number } = {},
  ) {
    const ctx = this.ensure()
    const osc = ctx.createOscillator()
    if (wave === 'triangle') osc.type = 'triangle'
    else if (wave === 'saw') osc.type = 'sawtooth'
    else osc.setPeriodicWave(this.waves[wave] ?? this.waves.pulse50!)
    osc.frequency.setValueAtTime(freq, at)
    if (opts.detune) osc.detune.setValueAtTime(opts.detune, at)

    const env = ctx.createGain()
    const peak = Math.max(0.0001, gain)
    env.gain.setValueAtTime(0.0001, at)
    env.gain.exponentialRampToValueAtTime(peak, at + 0.008)
    env.gain.setValueAtTime(peak, at + Math.max(0.02, dur * 0.6))
    env.gain.exponentialRampToValueAtTime(0.0001, at + dur)

    let node: AudioNode = osc
    if (opts.filter) {
      const lp = ctx.createBiquadFilter()
      lp.type = 'lowpass'
      lp.Q.value = opts.filter.q ?? 6
      lp.frequency.setValueAtTime(opts.filter.from, at)
      lp.frequency.exponentialRampToValueAtTime(
        Math.max(60, opts.filter.to),
        at + Math.max(0.05, dur),
      )
      osc.connect(lp)
      node = lp
    }

    node.connect(env).connect(dest)
    osc.start(at)
    osc.stop(at + dur + 0.02)
  }

  /** A small kit: pitched-sine kick, noise-and-tone snare, clap, two hats. */
  private drum(dest: AudioNode, kind: string, at: number, gain: number) {
    const ctx = this.ensure()

    if (kind === 'K') {
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(130, at)
      osc.frequency.exponentialRampToValueAtTime(42, at + 0.11)
      const env = ctx.createGain()
      env.gain.setValueAtTime(gain * 1.5, at)
      env.gain.exponentialRampToValueAtTime(0.0001, at + 0.24)
      osc.connect(env).connect(dest)
      osc.start(at)
      osc.stop(at + 0.26)
      return
    }

    const noise = ctx.createBufferSource()
    noise.buffer = this.noiseBuffer
    const filter = ctx.createBiquadFilter()
    const env = ctx.createGain()
    let dur = 0.05

    if (kind === 'S' || kind === 'C') {
      filter.type = 'bandpass'
      filter.frequency.value = kind === 'S' ? 1900 : 1300
      filter.Q.value = kind === 'S' ? 0.9 : 2.4
      dur = kind === 'S' ? 0.16 : 0.1
      if (kind === 'S') {
        // A little body under the crack.
        const tone = ctx.createOscillator()
        tone.type = 'triangle'
        tone.frequency.setValueAtTime(210, at)
        tone.frequency.exponentialRampToValueAtTime(150, at + 0.09)
        const tenv = ctx.createGain()
        tenv.gain.setValueAtTime(gain * 0.6, at)
        tenv.gain.exponentialRampToValueAtTime(0.0001, at + 0.1)
        tone.connect(tenv).connect(dest)
        tone.start(at)
        tone.stop(at + 0.12)
      }
    } else {
      filter.type = 'highpass'
      filter.frequency.value = 7200
      dur = kind === 'O' ? 0.22 : 0.035
    }

    env.gain.setValueAtTime(gain, at)
    env.gain.exponentialRampToValueAtTime(0.0001, at + dur)
    noise.connect(filter).connect(env).connect(dest)
    noise.start(at)
    noise.stop(at + dur + 0.02)
  }

  // ------------------------------------------------------------- sequencer

  playTune(tune: Tune, restart = true) {
    this.ensure()
    if (this.tune === tune && this.timer !== null && !restart) return
    this.stopTune()
    this.tune = tune
    this.step = 0
    this.nextStepTime = this.ctx!.currentTime + 0.08
    this.timer = window.setInterval(() => this.schedule(), 25)
  }

  stopTune() {
    if (this.timer !== null) window.clearInterval(this.timer)
    this.timer = null
    this.tune = null
  }

  get playing() {
    return this.timer !== null
  }

  private schedule() {
    const ctx = this.ctx
    const tune = this.tune
    if (!ctx || !tune) return
    const stepDur = 60 / tune.bpm / tune.stepsPerBeat
    const length = Math.max(...tune.tracks.map((t) => t.notes.length))
    const swing = tune.swing ?? 0

    while (this.nextStepTime < ctx.currentTime + 0.2) {
      // A shuffle pushes every other step late without moving the downbeats.
      const at = this.nextStepTime + (this.step % 2 === 1 ? swing * stepDur : 0)

      for (const track of tune.tracks) {
        const note = track.notes[this.step % track.notes.length]
        if (!note || note === '.' || note === '=') continue

        // A note runs until the next step that is not a sustain marker.
        let held = 1
        for (let i = 1; i < length; i++) {
          if (track.notes[(this.step + i) % track.notes.length] === '=') held++
          else break
        }
        const dur = held * stepDur * (track.gate ?? 0.95)

        if (track.wave === 'noise') {
          this.drum(this.musicBus, note, at, track.gain)
          continue
        }

        for (const part of note.split('/')) {
          const f = noteToFreq(part)
          if (!f) continue
          this.voice(this.musicBus, track.wave, f, at, dur, track.gain, {
            filter: track.filter,
            detune: track.detune,
          })
        }
      }
      this.nextStepTime += stepDur
      this.step = (this.step + 1) % length
    }
  }

  // ------------------------------------------------------------------ sfx

  private seq(notes: [string, number][], wave: Wave = 'pulse25', gain = 0.22) {
    const ctx = this.ensure()
    let t = ctx.currentTime + 0.01
    for (const [note, dur] of notes) {
      if (note !== '.') this.voice(this.sfxBus, wave, noteToFreq(note), t, dur, gain)
      t += dur
    }
  }

  blip() {
    this.seq([['E5', 0.05]], 'pulse12', 0.15)
  }

  /** A quiet register blip, played once per few glasses as the day runs. */
  tick() {
    this.seq([['B5', 0.035]], 'pulse12', 0.09)
  }

  select() {
    this.seq([['C5', 0.05], ['G5', 0.09]], 'pulse25', 0.18)
  }

  reject() {
    this.seq([['A3', 0.09], ['E3', 0.16]], 'saw', 0.2)
  }

  cash() {
    this.seq([['C5', 0.07], ['E5', 0.07], ['G5', 0.07], ['C6', 0.22]], 'pulse25', 0.2)
  }

  sad() {
    this.seq([['G4', 0.12], ['F#4', 0.12], ['F4', 0.12], ['E4', 0.4]], 'triangle', 0.22)
  }

  thunder() {
    const ctx = this.ensure()
    const at = ctx.currentTime + 0.01
    const src = ctx.createBufferSource()
    src.buffer = this.noiseBuffer
    src.loop = true
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(1400, at)
    filter.frequency.exponentialRampToValueAtTime(120, at + 1.4)
    const env = ctx.createGain()
    env.gain.setValueAtTime(0.0001, at)
    env.gain.exponentialRampToValueAtTime(0.35, at + 0.05)
    env.gain.exponentialRampToValueAtTime(0.0001, at + 1.5)
    src.connect(filter).connect(env).connect(this.sfxBus)
    src.start(at)
    src.stop(at + 1.6)
  }

  sunshine() {
    this.seq([['C5', 0.06], ['D5', 0.06], ['E5', 0.06], ['G5', 0.06], ['A5', 0.18]], 'pulse12', 0.16)
  }

  heat() {
    const ctx = this.ensure()
    const at = ctx.currentTime + 0.01
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(300, at)
    osc.frequency.exponentialRampToValueAtTime(900, at + 0.5)
    const env = ctx.createGain()
    env.gain.setValueAtTime(0.0001, at)
    env.gain.exponentialRampToValueAtTime(0.2, at + 0.1)
    env.gain.exponentialRampToValueAtTime(0.0001, at + 0.6)
    osc.connect(env).connect(this.sfxBus)
    osc.start(at)
    osc.stop(at + 0.7)
  }

  /** The Atari's key-click beep. */
  beep() {
    this.seq([['A5', 0.06]], 'pulse50', 0.14)
  }

  /**
   * Cassette load: bandpassed hiss under a square wave flipping between two
   * tones, which is roughly what audio FSK sounded like coming off tape.
   */
  tape(seconds: number): () => void {
    const ctx = this.ensure()
    const at = ctx.currentTime + 0.02
    const until = at + seconds

    const osc = ctx.createOscillator()
    osc.type = 'square'
    for (let t = at, flip = 0; t < until; t += 0.018, flip++) {
      osc.frequency.setValueAtTime(flip % 2 === 0 ? 1300 : 2400, t)
    }
    const oscGain = ctx.createGain()
    oscGain.gain.value = 0.045

    const hiss = ctx.createBufferSource()
    hiss.buffer = this.noiseBuffer
    hiss.loop = true
    const band = ctx.createBiquadFilter()
    band.type = 'bandpass'
    band.frequency.value = 1800
    band.Q.value = 0.7
    const hissGain = ctx.createGain()
    hissGain.gain.value = 0.05

    osc.connect(oscGain).connect(this.sfxBus)
    hiss.connect(band).connect(hissGain).connect(this.sfxBus)
    osc.start(at)
    hiss.start(at)
    osc.stop(until)
    hiss.stop(until)

    return () => {
      try {
        osc.stop()
        hiss.stop()
      } catch {
        // Already stopped; nothing to do.
      }
    }
  }

  fanfare() {
    this.seq(
      [['C5', 0.11], ['E5', 0.11], ['G5', 0.11], ['C6', 0.11], ['G5', 0.11], ['C6', 0.4]],
      'pulse25',
      0.2,
    )
  }
}

export const synth = new Synth()
