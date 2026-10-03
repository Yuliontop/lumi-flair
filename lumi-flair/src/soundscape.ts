/**
 * Procedural soundscapes — every sound is synthesized with WebAudio
 * (filtered noise, oscillators, scheduled grains). No audio files.
 * Scenes crossfade over ~2.5s; the whole bed fades out when the tab is hidden.
 *
 * Self-healing: browsers can pause or lose an AudioContext on their own
 * (PC sleep, headphones/Bluetooth switching, OS energy saving, tab freezing).
 * A watchdog checks every few seconds and on focus/visibility: it resumes a
 * paused context, rebuilds a closed one, and rebuilds one whose clock has
 * stalled (audio device lost). Any click or key press also resumes it.
 */
import type { Light, Scene } from './settings'

type Layer = { gain: GainNode; stop: () => void }
export type SoundscapeState = 'off' | 'playing' | 'waiting'

export class Soundscape {
  private ac: AudioContext | null = null
  private master: GainNode | null = null
  private current: { key: string; layer: Layer } | null = null
  private noise: { white?: AudioBuffer; pink?: AudioBuffer; brown?: AudioBuffer } = {}
  private volume = 0.35
  private wanted: { scene: Scene; light: Light } = { scene: 'off', light: 'none' }
  private enabled = false
  private lastClock = -1
  private stalls = 0
  private watchdog: ReturnType<typeof setInterval> | undefined
  private lastState: SoundscapeState = 'off'
  /** Called when the playing / waiting state changes (for the panel). */
  onState: ((s: SoundscapeState) => void) | null = null

  private onVisibility = () => {
    this.applyVolume()
    if (!document.hidden) this.heal()
  }
  private onGesture = () => {
    if (this.wantsSound() && this.ac && this.ac.state !== 'running') void this.ac.resume().then(() => this.report()).catch(() => {})
  }
  private onFocus = () => this.heal()

  constructor() {
    document.addEventListener('visibilitychange', this.onVisibility)
    window.addEventListener('focus', this.onFocus)
    // Kept for the whole session (not one-shot): a context can be paused again later.
    window.addEventListener('pointerdown', this.onGesture, true)
    window.addEventListener('keydown', this.onGesture, true)
  }

  private wantsSound(): boolean {
    return this.enabled && !!this.current
  }

  /** What the user should expect to hear right now. */
  get state(): SoundscapeState {
    if (!this.enabled || !this.current) return 'off'
    return this.ac?.state === 'running' ? 'playing' : 'waiting'
  }

  private report() {
    const st = this.state
    if (st === this.lastState) return
    this.lastState = st
    try {
      this.onState?.(st)
    } catch {
      /* ignore */
    }
  }

  private startWatchdog() {
    if (this.watchdog) return
    this.watchdog = setInterval(() => this.heal(), 5000)
  }

  private stopWatchdog() {
    if (this.watchdog) clearInterval(this.watchdog)
    this.watchdog = undefined
  }

  /**
   * Bring the sound back if the browser paused or lost it. Safe to call any time.
   * Exposed for tests and for the frontend to call after the page wakes up.
   */
  heal() {
    const ac = this.ac
    if (!ac || !this.enabled) return this.report()
    if (ac.state === 'closed') {
      this.rebuild('closed')
      return
    }
    if (document.hidden) return this.report()
    if (ac.state !== 'running') {
      // 'suspended' or Safari's 'interrupted'. Works without a new click once
      // the page has had any user interaction; otherwise the next click does it.
      this.lastClock = -1
      this.stalls = 0
      void ac.resume().then(() => this.report()).catch(() => this.report())
      this.report()
      return
    }
    // Running but the clock isn't moving → the output device went away.
    if (this.wantsSound()) {
      if (this.lastClock >= 0 && ac.currentTime <= this.lastClock + 0.05) {
        if (++this.stalls >= 2) {
          this.rebuild('stalled')
          return
        }
      } else this.stalls = 0
      this.lastClock = ac.currentTime
    }
    this.report()
  }

  /** Throw the context away and start fresh with whatever should be playing. */
  private rebuild(reason: string) {
    console.info(`[Lumi Flair] soundscape restarted (${reason})`)
    try {
      this.current?.layer.stop()
    } catch {
      /* ignore */
    }
    this.current = null
    const old = this.ac
    this.ac = null
    this.master = null
    this.noise = {}
    this.lastClock = -1
    this.stalls = 0
    if (old && old.state !== 'closed') void old.close().catch(() => {})
    this.set(this.enabled, this.wanted.scene, this.wanted.light, this.volume)
  }

  private ctx(): AudioContext | null {
    if (this.ac) return this.ac
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null
    try {
      this.ac = new Ctor()
      this.master = this.ac.createGain()
      this.master.gain.value = 0
      this.master.connect(this.ac.destination)
    } catch {
      return null
    }
    // Browsers keep audio suspended until a user gesture (onGesture handles it),
    // and can pause it again later — react straight away when that happens.
    const ac = this.ac
    ac.onstatechange = () => {
      if (ac !== this.ac) return
      if (ac.state !== 'running') setTimeout(() => this.heal(), 250)
      this.report()
    }
    return this.ac
  }

  private buffer(kind: 'white' | 'pink' | 'brown'): AudioBuffer {
    const ac = this.ac!
    const cached = this.noise[kind]
    if (cached) return cached
    const len = ac.sampleRate * 3
    const buf = ac.createBuffer(1, len, ac.sampleRate)
    const d = buf.getChannelData(0)
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0, last = 0
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1
      if (kind === 'white') d[i] = w * 0.5
      else if (kind === 'pink') {
        b0 = 0.99886 * b0 + w * 0.0555179
        b1 = 0.99332 * b1 + w * 0.0750759
        b2 = 0.969 * b2 + w * 0.153852
        b3 = 0.8665 * b3 + w * 0.3104856
        b4 = 0.55 * b4 + w * 0.5329522
        b5 = -0.7616 * b5 - w * 0.016898
        d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11
        b6 = w * 0.115926
      } else {
        last = (last + 0.02 * w) / 1.02
        d[i] = last * 3.5
      }
    }
    this.noise[kind] = buf
    return buf
  }

  private noiseSource(kind: 'white' | 'pink' | 'brown'): AudioBufferSourceNode {
    const src = this.ac!.createBufferSource()
    src.buffer = this.buffer(kind)
    src.loop = true
    return src
  }

  private lfo(freq: number, depth: number, target: AudioParam): OscillatorNode {
    const ac = this.ac!
    const osc = ac.createOscillator()
    const g = ac.createGain()
    osc.frequency.value = freq
    g.gain.value = depth
    osc.connect(g).connect(target)
    osc.start()
    return osc
  }

  /** Random short grains (raindrops, crackles, chirps) scheduled on a timer. */
  private grains(out: AudioNode, every: [number, number], play: (t: number) => void): () => void {
    let alive = true
    let timer: ReturnType<typeof setTimeout>
    const tick = () => {
      if (!alive || !this.ac) return
      play(this.ac.currentTime + 0.02)
      timer = setTimeout(tick, every[0] + Math.random() * (every[1] - every[0]))
    }
    timer = setTimeout(tick, every[0])
    void out
    return () => {
      alive = false
      clearTimeout(timer)
    }
  }

  private build(scene: Scene, light: Light): Layer | null {
    const ac = this.ac!
    const out = ac.createGain()
    out.gain.value = 0
    out.connect(this.master!)
    const nodes: Array<AudioScheduledSourceNode> = []
    const cleanups: Array<() => void> = []
    const start = (n: AudioScheduledSourceNode) => {
      n.start()
      nodes.push(n)
    }

    const wind = (level: number, cutoff: number) => {
      const src = this.noiseSource('brown')
      const lp = ac.createBiquadFilter()
      lp.type = 'lowpass'
      lp.frequency.value = cutoff
      const g = ac.createGain()
      g.gain.value = level
      src.connect(lp).connect(g).connect(out)
      nodes.push(this.lfo(0.07, cutoff * 0.4, lp.frequency))
      nodes.push(this.lfo(0.11, level * 0.5, g.gain))
      start(src)
    }

    const click = (t: number, freq: number, q: number, level: number, dur: number) => {
      const src = ac.createBufferSource()
      src.buffer = this.buffer('white')
      const bp = ac.createBiquadFilter()
      bp.type = 'bandpass'
      bp.frequency.value = freq
      bp.Q.value = q
      const g = ac.createGain()
      g.gain.setValueAtTime(level, t)
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
      src.connect(bp).connect(g).connect(out)
      src.start(t, Math.random() * 2, dur + 0.02)
    }

    const chirp = (t: number, f0: number, f1: number, dur: number, level: number) => {
      const o = ac.createOscillator()
      const g = ac.createGain()
      o.type = 'sine'
      o.frequency.setValueAtTime(f0, t)
      o.frequency.exponentialRampToValueAtTime(f1, t + dur)
      g.gain.setValueAtTime(0.0001, t)
      g.gain.exponentialRampToValueAtTime(level, t + 0.01)
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
      o.connect(g).connect(out)
      o.start(t)
      o.stop(t + dur + 0.05)
    }

    switch (scene) {
      case 'rain': {
        const src = this.noiseSource('pink')
        const hp = ac.createBiquadFilter()
        hp.type = 'highpass'
        hp.frequency.value = 500
        const lp = ac.createBiquadFilter()
        lp.type = 'lowpass'
        lp.frequency.value = light === 'storm' ? 5000 : 3800
        const g = ac.createGain()
        g.gain.value = light === 'storm' ? 0.55 : 0.4
        src.connect(hp).connect(lp).connect(g).connect(out)
        start(src)
        cleanups.push(this.grains(out, [40, 160], (t) => click(t, 2500 + Math.random() * 3000, 6, 0.08 + Math.random() * 0.08, 0.04)))
        if (light === 'storm') wind(0.25, 300)
        break
      }
      case 'snow':
        wind(0.5, 420)
        cleanups.push(this.grains(out, [2500, 6000], (t) => chirp(t, 2400, 2350, 1.2, 0.006))) // faint shimmer
        break
      case 'embers': {
        const src = this.noiseSource('brown')
        const lp = ac.createBiquadFilter()
        lp.type = 'lowpass'
        lp.frequency.value = 700
        const g = ac.createGain()
        g.gain.value = 0.35
        src.connect(lp).connect(g).connect(out)
        start(src)
        cleanups.push(this.grains(out, [60, 420], (t) => click(t, 1800 + Math.random() * 3500, 2, 0.12 + Math.random() * 0.25, 0.02 + Math.random() * 0.03)))
        break
      }
      case 'fireflies': // summer night: crickets + soft air
        wind(0.12, 300)
        cleanups.push(
          this.grains(out, [700, 1800], (t) => {
            const f = 4200 + Math.random() * 600
            for (let i = 0; i < 3; i++) chirp(t + i * 0.07, f, f * 0.98, 0.05, 0.03)
          }),
        )
        break
      case 'petals': // spring breeze + birds
        wind(0.18, 600)
        cleanups.push(
          this.grains(out, [1800, 5200], (t) => {
            const base = 2600 + Math.random() * 1600
            chirp(t, base, base * 1.4, 0.12, 0.035)
            chirp(t + 0.16, base * 1.2, base * 0.9, 0.1, 0.03)
          }),
        )
        break
      case 'stars': { // deep-space drone
        const freqs = [55, 82.4, 110.2]
        for (const f of freqs) {
          const o = ac.createOscillator()
          o.type = 'triangle'
          o.frequency.value = f
          o.detune.value = Math.random() * 8 - 4
          const g = ac.createGain()
          g.gain.value = 0.06
          o.connect(g).connect(out)
          nodes.push(this.lfo(0.03 + Math.random() * 0.05, 0.03, g.gain))
          start(o)
        }
        const air = this.noiseSource('pink')
        const bp = ac.createBiquadFilter()
        bp.type = 'bandpass'
        bp.frequency.value = 900
        bp.Q.value = 0.7
        const ag = ac.createGain()
        ag.gain.value = 0.05
        air.connect(bp).connect(ag).connect(out)
        nodes.push(this.lfo(0.02, 500, bp.frequency))
        start(air)
        break
      }
      default:
        // No particle scene, but the light can still carry a bed.
        if (light === 'storm') wind(0.35, 260)
        else if (light === 'candle') {
          wind(0.08, 500)
          cleanups.push(this.grains(out, [300, 1400], (t) => click(t, 2500, 2, 0.05, 0.02)))
        } else if (light === 'neon') {
          const o = ac.createOscillator()
          o.type = 'sawtooth'
          o.frequency.value = 60
          const lp = ac.createBiquadFilter()
          lp.type = 'lowpass'
          lp.frequency.value = 180
          const g = ac.createGain()
          g.gain.value = 0.04
          o.connect(lp).connect(g).connect(out)
          start(o)
        } else {
          out.disconnect()
          return null
        }
    }

    return {
      gain: out,
      stop: () => {
        for (const c of cleanups) c()
        for (const n of nodes) {
          try {
            n.stop()
          } catch {
            /* already stopped */
          }
        }
        setTimeout(() => out.disconnect(), 100)
      },
    }
  }

  private applyVolume() {
    if (!this.ac || !this.master) return
    const target = this.enabled && !document.hidden ? this.volume * 0.6 : 0
    const t = this.ac.currentTime
    this.master.gain.cancelScheduledValues(t)
    this.master.gain.setTargetAtTime(target, t, 0.6)
  }

  /** Set what should be playing. Safe to call often — only changes trigger work. */
  set(enabled: boolean, scene: Scene, light: Light, volume: number) {
    this.enabled = enabled
    this.volume = volume
    this.wanted = { scene, light }
    if (!enabled && !this.ac) return
    const ac = this.ctx()
    if (!ac) return
    this.applyVolume()
    const key = enabled ? `${scene}|${light}` : 'off'
    if (this.current?.key === key) return
    const t = ac.currentTime
    // Crossfade: old layer out, new layer in.
    if (this.current) {
      const old = this.current.layer
      old.gain.gain.cancelScheduledValues(t)
      old.gain.gain.setTargetAtTime(0, t, 0.8)
      setTimeout(() => old.stop(), 3500)
      this.current = null
    }
    if (!enabled) {
      this.stopWatchdog()
      this.report()
      // Let the fade finish, then park the idle engine so it costs no CPU.
      setTimeout(() => {
        if (!this.enabled && this.ac && this.ac.state === 'running') void this.ac.suspend().catch(() => {})
      }, 4000)
      return
    }
    const layer = this.build(scene, light)
    if (!layer) {
      this.stopWatchdog()
      this.report()
      return
    }
    layer.gain.gain.setTargetAtTime(1, t, 0.9)
    this.current = { key, layer }
    this.startWatchdog()
    if (ac.state !== 'running') void ac.resume().catch(() => {})
    this.report()
  }

  /** Low thunder rumble (paired with a lightning flash). */
  thunder(delayMs = 600) {
    if (!this.enabled || !this.ac || document.hidden) return
    setTimeout(() => {
      const ac = this.ac
      if (!ac || !this.master) return
      const src = ac.createBufferSource()
      src.buffer = this.buffer('brown')
      const lp = ac.createBiquadFilter()
      lp.type = 'lowpass'
      lp.frequency.value = 140
      const g = ac.createGain()
      const t = ac.currentTime
      g.gain.setValueAtTime(0.0001, t)
      g.gain.exponentialRampToValueAtTime(1.4, t + 0.25)
      g.gain.exponentialRampToValueAtTime(0.0001, t + 3.2)
      src.connect(lp).connect(g).connect(this.master)
      src.start(t, Math.random(), 3.4)
    }, delayMs)
  }

  get playing(): string {
    return this.current?.key ?? 'off'
  }

  get target() {
    return this.wanted
  }

  destroy() {
    this.stopWatchdog()
    document.removeEventListener('visibilitychange', this.onVisibility)
    window.removeEventListener('focus', this.onFocus)
    window.removeEventListener('pointerdown', this.onGesture, true)
    window.removeEventListener('keydown', this.onGesture, true)
    this.onState = null
    this.current?.layer.stop()
    this.current = null
    void this.ac?.close().catch(() => {})
    this.ac = null
  }
}
