/**
 * Synthesized UI sounds (WebAudio, no asset files). Off by default.
 * Pitch shifts with the character's mood so a sad scene sounds softer.
 * Any of them can be replaced with one of the user's own files.
 */
import type { AudioSource } from './soundlib'

export type Chime = 'send' | 'receive' | 'fanfare' | 'sparkle' | 'achievement'

/** A replaced sound plays for at most this long (someone may pick a whole song). */
const MAX_FILE_SECONDS = 12

export class SoundBoard {
  private ac: AudioContext | null = null

  /** The context sounds play on (created on demand; also used to decode the user's files). */
  context(): AudioContext | null {
    return this.ctx()
  }

  private ctx(): AudioContext | null {
    if (this.ac) return this.ac
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null
    try {
      this.ac = new Ctor()
    } catch {
      return null
    }
    return this.ac
  }

  private note(ac: AudioContext, out: AudioNode, freq: number, start: number, dur: number, type: OscillatorType, gain: number) {
    const osc = ac.createOscillator()
    const g = ac.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, start)
    g.gain.setValueAtTime(0.0001, start)
    g.gain.exponentialRampToValueAtTime(gain, start + 0.012)
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur)
    osc.connect(g).connect(out)
    osc.start(start)
    osc.stop(start + dur + 0.05)
  }

  play(kind: Chime, volume: number, semitones = 0) {
    if (volume <= 0) return
    const ac = this.ctx()
    if (!ac) return
    if (ac.state === 'suspended') void ac.resume().catch(() => {})
    const master = ac.createGain()
    master.gain.value = Math.min(1, volume) * 0.35
    master.connect(ac.destination)
    const t = ac.currentTime + 0.01
    const f = (midi: number) => 440 * Math.pow(2, (midi + semitones - 69) / 12)

    switch (kind) {
      case 'send': // quick rising two-note "pip"
        this.note(ac, master, f(79), t, 0.16, 'sine', 0.6)
        this.note(ac, master, f(86), t + 0.07, 0.22, 'triangle', 0.45)
        break
      case 'receive': // soft falling bell
        this.note(ac, master, f(84), t, 0.5, 'sine', 0.5)
        this.note(ac, master, f(79), t + 0.09, 0.6, 'sine', 0.35)
        this.note(ac, master, f(96), t, 0.25, 'triangle', 0.08)
        break
      case 'sparkle':
        for (let i = 0; i < 4; i++) this.note(ac, master, f(88 + i * 3), t + i * 0.045, 0.18, 'triangle', 0.3)
        break
      case 'achievement': // bright two-bell chime with a sparkle on top
        this.note(ac, master, f(81), t, 0.45, 'sine', 0.5)
        this.note(ac, master, f(88), t + 0.11, 0.6, 'sine', 0.45)
        for (let i = 0; i < 3; i++) this.note(ac, master, f(93 + i * 4), t + 0.2 + i * 0.05, 0.16, 'triangle', 0.18)
        break
      case 'fanfare': // major arpeggio
        ;[72, 76, 79, 84].forEach((m, i) => this.note(ac, master, f(m), t + i * 0.09, 0.45, 'triangle', 0.5))
        this.note(ac, master, f(88), t + 0.36, 0.7, 'sine', 0.35)
        break
    }
  }

  private noise: AudioBuffer | null = null

  /**
   * One soft typewriter key: a short filtered tick with a low body under it. `semitones` follows the mood
   * (lower and duller when sad, brighter when happy); a space is a deeper, softer thunk. Each key varies a
   * little so a run of them doesn't sound like a machine gun. With `src`, the user's own file plays instead
   * (cut short, since keys come quickly).
   */
  key(volume: number, semitones = 0, space = false, src?: AudioSource) {
    if (volume <= 0) return
    const ac = this.ctx()
    if (!ac || ac.state !== 'running') return // a key that plays late is worse than none
    const t = ac.currentTime + 0.005
    const out = ac.createGain()
    out.connect(ac.destination)
    const shift = Math.pow(2, semitones / 12) * (0.94 + Math.random() * 0.12)
    if (src?.kind === 'buffer') {
      const n = ac.createBufferSource()
      n.buffer = src.buffer
      n.playbackRate.value = shift * (space ? 0.85 : 1)
      const level = Math.min(1, volume) * 0.5 * src.level * (space ? 0.7 : 1)
      out.gain.setValueAtTime(level, t)
      out.gain.setValueAtTime(level, t + 0.18)
      out.gain.linearRampToValueAtTime(0.0001, t + 0.25)
      n.connect(out)
      n.start(t)
      n.stop(t + 0.26)
      n.onended = () => out.disconnect()
      return
    }
    if (!this.noise) {
      const len = Math.floor(ac.sampleRate * 0.04)
      this.noise = ac.createBuffer(1, len, ac.sampleRate)
      const d = this.noise.getChannelData(0)
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2)
    }
    const level = Math.min(1, volume) * (space ? 0.16 : 0.22)
    out.gain.setValueAtTime(level, t)
    // The click: a burst of noise through a band-pass, higher for a key than for the space bar.
    const n = ac.createBufferSource()
    n.buffer = this.noise
    const bp = ac.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = (space ? 1300 : 2600) * shift
    bp.Q.value = 1.4
    const ng = ac.createGain()
    ng.gain.setValueAtTime(0.0001, t)
    ng.gain.exponentialRampToValueAtTime(1, t + 0.002)
    ng.gain.exponentialRampToValueAtTime(0.0001, t + (space ? 0.05 : 0.03))
    n.connect(bp).connect(ng).connect(out)
    n.start(t)
    n.stop(t + 0.06)
    // The body: a very short low tone, so it sounds like a key and not static.
    const o = ac.createOscillator()
    o.type = 'sine'
    o.frequency.value = (space ? 120 : 190) * shift
    const og = ac.createGain()
    og.gain.setValueAtTime(0.0001, t)
    og.gain.exponentialRampToValueAtTime(space ? 0.5 : 0.35, t + 0.003)
    og.gain.exponentialRampToValueAtTime(0.0001, t + (space ? 0.07 : 0.04))
    o.connect(og).connect(out)
    o.start(t)
    o.stop(t + 0.08)
    o.onended = () => out.disconnect()
  }

  /** Play one of the user's files once (capped at `maxSeconds`, with a soft fade-out). */
  playFile(src: AudioSource, volume: number, maxSeconds = MAX_FILE_SECONDS) {
    if (volume <= 0) return
    const ac = this.ctx()
    if (!ac) return
    if (ac.state === 'suspended') void ac.resume().catch(() => {})
    const g = ac.createGain()
    // User files are usually mastered loud; sit them near the level of the built-in chimes.
    const level = Math.min(1, volume) * 0.6 * src.level
    const t = ac.currentTime
    g.gain.setValueAtTime(level, t)
    g.connect(ac.destination)
    const end = t + maxSeconds
    const fadeOut = () => {
      g.gain.setValueAtTime(level, end - 0.6)
      g.gain.linearRampToValueAtTime(0.0001, end)
    }
    if (src.kind === 'buffer') {
      const n = ac.createBufferSource()
      n.buffer = src.buffer
      n.connect(g)
      n.start(t)
      if (src.buffer.duration > maxSeconds) {
        fadeOut()
        n.stop(end + 0.05)
      }
      n.onended = () => {
        n.disconnect()
        g.disconnect()
      }
      return
    }
    const el = new Audio()
    el.src = src.url
    const node = ac.createMediaElementSource(el)
    node.connect(g)
    fadeOut()
    const stop = () => {
      el.pause()
      el.removeAttribute('src')
      el.load()
      node.disconnect()
      g.disconnect()
    }
    el.onended = stop
    setTimeout(stop, maxSeconds * 1000 + 100)
    void el.play().catch(stop)
  }

  destroy() {
    void this.ac?.close().catch(() => {})
    this.ac = null
  }
}
