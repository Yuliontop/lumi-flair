/**
 * Synthesized UI sounds (WebAudio, no asset files). Off by default.
 * Pitch shifts with the character's mood so a sad scene sounds softer.
 */
export type Chime = 'send' | 'receive' | 'fanfare' | 'sparkle'

export class SoundBoard {
  private ac: AudioContext | null = null

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
      case 'fanfare': // major arpeggio
        ;[72, 76, 79, 84].forEach((m, i) => this.note(ac, master, f(m), t + i * 0.09, 0.45, 'triangle', 0.5))
        this.note(ac, master, f(88), t + 0.36, 0.7, 'sine', 0.35)
        break
    }
  }

  destroy() {
    void this.ac?.close().catch(() => {})
    this.ac = null
  }
}
