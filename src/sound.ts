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

  /** Play one of the user's files once (capped at a few seconds, with a soft fade-out). */
  playFile(src: AudioSource, volume: number) {
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
    const end = t + MAX_FILE_SECONDS
    const fadeOut = () => {
      g.gain.setValueAtTime(level, end - 0.6)
      g.gain.linearRampToValueAtTime(0.0001, end)
    }
    if (src.kind === 'buffer') {
      const n = ac.createBufferSource()
      n.buffer = src.buffer
      n.connect(g)
      n.start(t)
      if (src.buffer.duration > MAX_FILE_SECONDS) {
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
    setTimeout(stop, MAX_FILE_SECONDS * 1000 + 100)
    void el.play().catch(stop)
  }

  destroy() {
    void this.ac?.close().catch(() => {})
    this.ac = null
  }
}
