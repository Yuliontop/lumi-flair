/**
 * AI sound effects: short procedural cues (WebAudio, no asset files) played for
 * <flair sfx="…">. Each recipe schedules its own oscillators and noise bursts
 * and returns its length in seconds. Recipes take any BaseAudioContext, so the
 * dev tests can render them offline and measure peak level and length.
 * Any cue can be replaced with one of the user's files (see sound.ts playFile).
 */

type Recipe = (ac: BaseAudioContext, out: AudioNode, t: number) => number

const rnd = (min: number, max: number) => min + Math.random() * (max - min)

const noiseBuffers = new WeakMap<BaseAudioContext, AudioBuffer>()
function noise(ac: BaseAudioContext): AudioBuffer {
  let b = noiseBuffers.get(ac)
  if (!b) {
    b = ac.createBuffer(1, Math.ceil(ac.sampleRate * 1.5), ac.sampleRate)
    const d = b.getChannelData(0)
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
    noiseBuffers.set(ac, b)
  }
  return b
}

interface Tone {
  type?: OscillatorType
  freq: number
  /** Glide to this frequency over `glide` seconds (default: the whole decay). */
  to?: number
  glide?: number
  at: number
  attack?: number
  decay: number
  gain: number
}

function tone(ac: BaseAudioContext, out: AudioNode, o: Tone) {
  const osc = ac.createOscillator()
  const g = ac.createGain()
  const attack = o.attack ?? 0.004
  osc.type = o.type ?? 'sine'
  osc.frequency.setValueAtTime(o.freq, o.at)
  if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, o.at + (o.glide ?? o.decay))
  g.gain.setValueAtTime(0.0001, o.at)
  g.gain.linearRampToValueAtTime(o.gain, o.at + attack)
  g.gain.exponentialRampToValueAtTime(0.0001, o.at + attack + o.decay)
  osc.connect(g).connect(out)
  osc.start(o.at)
  osc.stop(o.at + attack + o.decay + 0.05)
  osc.onended = () => g.disconnect()
}

interface Burst {
  at: number
  dur: number
  gain: number
  type: BiquadFilterType
  freq: number
  /** Sweep the filter to this frequency over the burst. */
  to?: number
  q?: number
  /** Swell up over this many seconds first (default: start at full level). */
  attack?: number
}

function burst(ac: BaseAudioContext, out: AudioNode, o: Burst) {
  const src = ac.createBufferSource()
  src.buffer = noise(ac)
  src.loop = true // a burst can outlast the 1.5 s buffer
  const f = ac.createBiquadFilter()
  f.type = o.type
  f.Q.value = o.q ?? 0.7
  f.frequency.setValueAtTime(o.freq, o.at)
  if (o.to) f.frequency.exponentialRampToValueAtTime(o.to, o.at + o.dur)
  const g = ac.createGain()
  if (o.attack) {
    g.gain.setValueAtTime(0.0001, o.at)
    g.gain.linearRampToValueAtTime(o.gain, o.at + o.attack)
  } else g.gain.setValueAtTime(o.gain, o.at)
  g.gain.exponentialRampToValueAtTime(0.0001, o.at + o.dur)
  src.connect(f).connect(g).connect(out)
  src.start(o.at, rnd(0, 0.5), o.dur + 0.02)
  src.onended = () => g.disconnect()
}

/** A gain stage that levels all of a recipe's layers together. */
function trim(ac: BaseAudioContext, out: AudioNode, level: number): AudioNode {
  const g = ac.createGain()
  g.gain.value = level
  g.connect(out)
  return g
}

/** A soft-clip stage: its input should peak around 1. The added harmonics make low sounds thick and let bass carry on small speakers. */
function saturate(ac: BaseAudioContext, out: AudioNode, drive: number, level: number): AudioNode {
  const curve = new Float32Array(1024)
  for (let i = 0; i < curve.length; i++) curve[i] = Math.tanh(drive * ((i / (curve.length - 1)) * 2 - 1)) / Math.tanh(drive)
  const shaper = ac.createWaveShaper()
  shaper.curve = curve
  shaper.oversample = '2x'
  const g = ac.createGain()
  g.gain.value = level
  shaper.connect(g).connect(out)
  return shaper
}

/** Three heavy raps on a solid wooden door, a little uneven like a real hand. */
const doorKnock: Recipe = (ac, out, t) => {
  const bus = saturate(ac, out, 2.2, 0.8)
  const offsets = [0, 0.26 + rnd(-0.02, 0.02), 0.5 + rnd(-0.03, 0.03)]
  offsets.forEach((dt, i) => {
    const at = t + dt
    const v = (i === 1 ? 0.9 : 1) * rnd(0.88, 1)
    const p = rnd(0.94, 1.06)
    tone(ac, bus, { freq: 118 * p, to: 56 * p, glide: 0.1, at, attack: 0.003, decay: 0.28, gain: 0.5 * v }) // the weight: a deep thump
    tone(ac, bus, { freq: 175 * p, to: 95 * p, glide: 0.08, at, attack: 0.002, decay: 0.2, gain: 0.5 * v }) // the body of the door
    tone(ac, bus, { type: 'triangle', freq: 250 * p, to: 160 * p, glide: 0.07, at, attack: 0.002, decay: 0.12, gain: 0.28 * v }) // the upper body
    burst(ac, bus, { at, dur: 0.045, gain: 0.55 * v, type: 'lowpass', freq: 1200, q: 0.8 }) // the knuckle: a dull "tuk", not a tick
    burst(ac, bus, { at, dur: 0.12, gain: 0.34 * v, type: 'bandpass', freq: 420 * p, q: 4 }) // the hollow panel
  })
  return 0.5 + 0.35
}

/** Steel on steel. No pitch: a bright snap, a dense inharmonic metallic crash that fades fast, a short irregular ring, a low clank for mass, a second contact and a scrape. */
const swordClash: Recipe = (ac, dest, t) => {
  const out = ac.createGain() // the layers add up hot; trim them together
  out.gain.value = 0.55
  out.connect(dest)
  // A bank of square waves at inharmonic ratios (the cymbal trick): metallic, rough, and nothing like a bell.
  const crash = (at: number, base: number, level: number, decay: number) => {
    const hp = ac.createBiquadFilter()
    hp.type = 'highpass'
    hp.frequency.value = 1500
    const g = ac.createGain()
    g.gain.setValueAtTime(0.0001, at)
    g.gain.linearRampToValueAtTime(level, at + 0.001)
    g.gain.exponentialRampToValueAtTime(level * 0.3, at + 0.06)
    g.gain.exponentialRampToValueAtTime(0.0001, at + decay)
    hp.connect(g).connect(out)
    ;[1, 1.4471, 1.617, 1.9265, 2.5028, 2.6637].forEach((r, i, all) => {
      const osc = ac.createOscillator()
      osc.type = 'square'
      osc.frequency.value = base * r
      osc.connect(hp)
      osc.start(at)
      osc.stop(at + decay + 0.05)
      if (i === all.length - 1) osc.onended = () => g.disconnect()
    })
  }
  // A short, irregular ring: detuned pairs beat against each other, so it shimmers instead of singing.
  const ring = (at: number, pitch: number, level: number) =>
    ([[1, 0.12, 0.28], [1.37, 0.1, 0.24], [2.09, 0.09, 0.2], [2.83, 0.07, 0.15], [3.9, 0.05, 0.12]] as const).forEach(([r, g, d]) => {
      tone(ac, out, { freq: 1900 * pitch * r, at, attack: 0.001, decay: d, gain: g * level })
      tone(ac, out, { freq: 1900 * pitch * r * 1.011, at, attack: 0.001, decay: d, gain: g * level * 0.8 })
    })
  const p = rnd(0.92, 1.1)
  burst(ac, out, { at: t, dur: 0.06, gain: 0.7, type: 'highpass', freq: 3000 }) // the snap
  burst(ac, out, { at: t, dur: 0.18, gain: 0.4, type: 'bandpass', freq: 6500, q: 0.8 }) // the "shing"
  burst(ac, out, { at: t, dur: 0.5, gain: 0.16, type: 'highpass', freq: 1800 }) // the shimmer left behind
  crash(t, 620 * p, 0.07, 0.45)
  ring(t, p, 1)
  tone(ac, out, { freq: 520 * p, to: 230 * p, glide: 0.05, at: t, attack: 0.001, decay: 0.09, gain: 0.35 }) // the clank: steel has weight
  burst(ac, out, { at: t, dur: 0.06, gain: 0.3, type: 'bandpass', freq: 900, q: 1.5 })
  // The blades slide off each other: a quieter second contact, a little higher, and a scrape.
  const t2 = t + 0.075
  burst(ac, out, { at: t2, dur: 0.05, gain: 0.45, type: 'highpass', freq: 3500 })
  crash(t2, 620 * p * 1.13, 0.04, 0.3)
  ring(t2, p * 1.13, 0.5)
  burst(ac, out, { at: t + 0.04, dur: 0.22, gain: 0.1, type: 'bandpass', freq: 2500, to: 8000, q: 3 })
  return 0.8
}

/** Two beats of "lub-dub". The triangle carries harmonics, so laptop speakers can still play it. */
const heartbeat: Recipe = (ac, out, t) => {
  const thump = (at: number, v: number, f: number) => {
    tone(ac, out, { type: 'triangle', freq: f * 1.5, to: f * 0.7, glide: 0.09, at, attack: 0.008, decay: 0.16, gain: 0.55 * v })
    tone(ac, out, { freq: f, to: f * 0.6, glide: 0.12, at, attack: 0.006, decay: 0.22, gain: 0.7 * v })
    burst(ac, out, { at, dur: 0.07, gain: 0.18 * v, type: 'lowpass', freq: 220 })
  }
  for (let i = 0; i < 2; i++) {
    const at = t + i * 0.86
    thump(at, 1, 62) // lub
    thump(at + 0.25, 0.7, 72) // dub
  }
  return 0.86 + 0.25 + 0.35
}

/**
 * A door nobody has opened in years: a thin, high squeal that wavers and climbs as the hinge
 * catches and gives, with a detuned twin and a faint tritone for unease, a breath of dry wood,
 * and the door's own low groan underneath.
 */
const doorCreak: Recipe = (ac, out, t) => {
  const dur = 1.7 * rnd(0.9, 1.15)
  const bus = trim(ac, out, 1) // levelled against the other cues (the voices and resonances add up hot)
  const base = rnd(300, 360)
  const steps = 24
  // One pitch path for every voice: it climbs, wanders, then sags, jittering as the hinge sticks and slips.
  const path = Array.from({ length: steps }, (_, k) => base * (1 + 0.75 * Math.sin((k / steps) * Math.PI * 0.8) + rnd(-0.08, 0.08)))
  const mix = ac.createGain()
  const vibrato = ac.createOscillator() // a slow waver
  vibrato.frequency.value = rnd(5, 7)
  vibrato.start(t)
  vibrato.stop(t + dur + 0.05)
  const voice = (ratio: number, level: number) => {
    const osc = ac.createOscillator()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(path[0] * ratio, t)
    path.forEach((f, k) => osc.frequency.linearRampToValueAtTime(f * ratio, t + (dur * (k + 1)) / steps))
    const depth = ac.createGain()
    depth.gain.value = base * ratio * 0.02
    vibrato.connect(depth).connect(osc.frequency)
    const g = ac.createGain()
    g.gain.value = level
    osc.connect(g).connect(mix)
    osc.start(t)
    osc.stop(t + dur + 0.05)
    return osc
  }
  voice(1, 1)
  voice(1.011, 0.8) // the detuned twin: the two beat against each other, so the squeal shimmers
  const last = voice(1.414, 0.22) // a tritone, quiet: the unsettling part
  // Two narrow resonances, high and thin: the squeak of dry wood, not the rasp of a hinge.
  const f1 = ac.createBiquadFilter()
  f1.type = 'bandpass'
  f1.Q.value = 9
  f1.frequency.setValueAtTime(1400, t)
  f1.frequency.linearRampToValueAtTime(2300, t + dur * 0.5)
  f1.frequency.linearRampToValueAtTime(1700, t + dur)
  const f2 = ac.createBiquadFilter()
  f2.type = 'bandpass'
  f2.Q.value = 7
  f2.frequency.value = 3100
  const formant2 = ac.createGain()
  formant2.gain.value = 0.5
  // It presses, slips, then gives way: two swells, not one steady note.
  const env = ac.createGain()
  env.gain.setValueAtTime(0.0001, t)
  env.gain.linearRampToValueAtTime(0.55, t + 0.25)
  env.gain.linearRampToValueAtTime(0.3, t + dur * 0.33)
  env.gain.linearRampToValueAtTime(1, t + dur * 0.55)
  env.gain.linearRampToValueAtTime(0.8, t + dur - 0.35)
  env.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  mix.connect(f1).connect(env)
  mix.connect(f2).connect(formant2).connect(env)
  env.connect(bus)
  last.onended = () => env.disconnect()
  const under = trim(ac, out, 0.2) // these two sit well beneath the squeal, so they skip its make-up gain
  burst(ac, under, { at: t + 0.1, dur: dur - 0.15, gain: 0.35, type: 'bandpass', freq: 2600, q: 3, attack: 0.3 }) // dry wood, breathing
  tone(ac, under, { type: 'triangle', freq: 105, to: 92, at: t, attack: 0.3, decay: dur - 0.2, gain: 0.4 }) // the door's own groan
  return dur + 0.15
}

/** A heavy door slammed shut: weight, the crack of wood on the frame, a rattle, the room answering. */
const doorSlam: Recipe = (ac, out, t) => {
  const bus = saturate(ac, out, 2.4, 0.8)
  const p = rnd(0.94, 1.06)
  tone(ac, bus, { freq: 95 * p, to: 42 * p, glide: 0.14, at: t, attack: 0.002, decay: 0.4, gain: 0.5 })
  tone(ac, bus, { freq: 165 * p, to: 80 * p, glide: 0.1, at: t, attack: 0.002, decay: 0.28, gain: 0.6 })
  burst(ac, bus, { at: t, dur: 0.06, gain: 0.6, type: 'lowpass', freq: 2800 }) // wood on the frame
  burst(ac, bus, { at: t + 0.01, dur: 0.02, gain: 0.25, type: 'bandpass', freq: 2500, q: 1.2 }) // the latch
  burst(ac, bus, { at: t, dur: 0.4, gain: 0.4, type: 'bandpass', freq: 320 * p, q: 1.8 }) // door and frame rattling
  burst(ac, out, { at: t + 0.03, dur: 0.7, gain: 0.12, type: 'lowpass', freq: 1100 }) // the room answering
  return 1.0
}

/** Four boot steps on a hard floor, alternating a little left and right. */
const footsteps: Recipe = (ac, out, t) => {
  const bus = saturate(ac, out, 1.6, 1.3)
  const gap = rnd(0.38, 0.44)
  for (let i = 0; i < 4; i++) {
    const at = t + i * gap + (i ? rnd(-0.015, 0.015) : 0) // the first step lands on cue, never before it
    const v = (i % 2 ? 0.8 : 1) * rnd(0.85, 1)
    const p = (i % 2 ? 0.9 : 1) * rnd(0.95, 1.05)
    tone(ac, bus, { freq: 120 * p, to: 62 * p, glide: 0.07, at, attack: 0.002, decay: 0.12, gain: 0.4 * v }) // the heel
    burst(ac, bus, { at, dur: 0.07, gain: 0.6 * v, type: 'lowpass', freq: 650 * p }) // the sole on the floor
    burst(ac, bus, { at, dur: 0.02, gain: 0.45 * v, type: 'bandpass', freq: 1800 * p, q: 1.2 }) // the heel click
    burst(ac, bus, { at: at + 0.06, dur: 0.05, gain: 0.18 * v, type: 'bandpass', freq: 900 * p, q: 1.5 }) // the toe settling
  }
  return 3 * gap + 0.35
}

/** A pane shattering: the crack, the burst, glitter, and shards pinging down. */
const glassBreak: Recipe = (ac, out, t) => {
  const bus = trim(ac, out, 0.62)
  burst(ac, bus, { at: t, dur: 0.04, gain: 0.8, type: 'highpass', freq: 2500 }) // the crack
  tone(ac, bus, { freq: 340, to: 160, glide: 0.05, at: t, attack: 0.001, decay: 0.07, gain: 0.35 }) // the blow itself
  burst(ac, bus, { at: t, dur: 0.3, gain: 0.45, type: 'bandpass', freq: 4200, q: 1.2 }) // the shatter
  burst(ac, bus, { at: t + 0.02, dur: 0.45, gain: 0.1, type: 'highpass', freq: 4500 }) // a little air
  for (let i = 0; i < 26; i++) {
    const at = t + 0.05 + Math.pow(Math.random(), 1.6) * 0.85
    tone(ac, bus, { freq: rnd(2000, 9000), at, attack: 0.001, decay: rnd(0.04, 0.16), gain: rnd(0.08, 0.2) }) // shards pinging
  }
  for (let i = 0; i < 3; i++) {
    tone(ac, bus, { freq: rnd(900, 1700), at: t + 0.04 + i * rnd(0.05, 0.12), attack: 0.001, decay: rnd(0.15, 0.3), gain: rnd(0.1, 0.18) }) // the heavy pieces
  }
  return 1.1
}

/** A close crack, then a long low roll with ripples as it travels. */
const thunder: Recipe = (ac, out, t) => {
  const bus = saturate(ac, out, 1.6, 1.0)
  const dur = 2.3
  burst(ac, bus, { at: t, dur: 0.14, gain: 0.5, type: 'bandpass', freq: 1800, q: 0.7 }) // the crack
  burst(ac, bus, { at: t + 0.03, dur, gain: 0.9, type: 'lowpass', freq: 220, to: 70, q: 0.9, attack: 0.25 }) // the roll
  burst(ac, bus, { at: t + 0.08, dur: dur * 0.8, gain: 0.9, type: 'lowpass', freq: 520, to: 140, attack: 0.3 }) // the mid-range of it, which small speakers can play
  for (let i = 0; i < 4; i++) {
    burst(ac, bus, { at: t + 0.35 + i * rnd(0.3, 0.45), dur: 0.5, gain: rnd(0.25, 0.5) * (1 - i * 0.18), type: 'lowpass', freq: rnd(200, 450), attack: 0.08 }) // ripples
  }
  tone(ac, bus, { freq: 52, to: 34, at: t + 0.05, attack: 0.2, decay: 1.8, gain: 0.5 }) // the floor shaking
  return dur + 0.4
}

/** A real bell this time: hum, prime, minor third, fifth and upper partials, the low ones ringing longest. */
const bell: Recipe = (ac, out, t) => {
  const bus = trim(ac, out, 0.22)
  const f = 660 * rnd(0.97, 1.03)
  ;([[0.5, 0.3, 2.4], [1, 0.5, 2.2], [1.183, 0.28, 1.7], [1.506, 0.22, 1.4], [2, 0.3, 1.5], [2.514, 0.14, 1.0], [3.011, 0.12, 0.8], [4.166, 0.08, 0.55]] as const).forEach(([r, g, d]) => {
    tone(ac, bus, { freq: f * r, at: t, attack: 0.002, decay: d, gain: g })
    tone(ac, bus, { freq: f * r * 1.004, at: t, attack: 0.002, decay: d * 0.95, gain: g * 0.5 }) // a slightly flat twin: the bell's slow beating
  })
  burst(ac, bus, { at: t, dur: 0.03, gain: 0.25, type: 'bandpass', freq: 3200 }) // the clapper
  return 2.5
}

/** Air rushing past: filtered noise that swells and sweeps upward. */
const whoosh: Recipe = (ac, out, t) => {
  const bus = trim(ac, out, 1.1)
  burst(ac, bus, { at: t, dur: 0.55, gain: 0.8, type: 'bandpass', freq: 380, to: 2600, q: 1.1, attack: 0.2 })
  burst(ac, bus, { at: t + 0.05, dur: 0.45, gain: 0.35, type: 'bandpass', freq: 1800, to: 4500, q: 0.9, attack: 0.2 }) // the airy top, kept out of the hiss
  return 0.65
}

/** A punch or a heavy blow: a short, deep thud with a dull crack. */
const impact: Recipe = (ac, out, t) => {
  const bus = saturate(ac, out, 2.6, 0.65)
  tone(ac, bus, { freq: 150, to: 48, glide: 0.09, at: t, attack: 0.001, decay: 0.32, gain: 0.55 })
  tone(ac, bus, { freq: 240, to: 110, glide: 0.06, at: t, attack: 0.001, decay: 0.16, gain: 0.5 })
  burst(ac, bus, { at: t, dur: 0.07, gain: 0.7, type: 'lowpass', freq: 900 })
  burst(ac, bus, { at: t, dur: 0.04, gain: 0.3, type: 'bandpass', freq: 1800, q: 1 })
  return 0.45
}

/** A spell: a quick rising run of soft bells, an upward sweep, a shimmering pad and glitter. */
const magic: Recipe = (ac, out, t) => {
  const bus = trim(ac, out, 0.8)
  const root = 700 * rnd(0.97, 1.03)
  ;[1, 1.25, 1.5, 1.875, 2.25, 3].forEach((r, i) => {
    const at = t + i * 0.065
    tone(ac, bus, { type: 'triangle', freq: root * r, at, attack: 0.004, decay: 0.7, gain: 0.2 })
    tone(ac, bus, { freq: root * r * 2.003, at, attack: 0.004, decay: 0.5, gain: 0.1 }) // a slightly sharp octave: the shimmer
  })
  burst(ac, bus, { at: t, dur: 0.6, gain: 0.12, type: 'bandpass', freq: 900, to: 7000, q: 2, attack: 0.25 })
  tone(ac, bus, { freq: root * 2, at: t + 0.2, attack: 0.15, decay: 1.0, gain: 0.12 })
  tone(ac, bus, { freq: root * 2 * 1.006, at: t + 0.2, attack: 0.15, decay: 1.0, gain: 0.1 })
  for (let i = 0; i < 16; i++) tone(ac, bus, { freq: rnd(3000, 9000), at: t + 0.15 + Math.random() * 0.8, attack: 0.001, decay: rnd(0.06, 0.2), gain: rnd(0.04, 0.1) }) // glitter
  return 1.5
}

/** Something hitting water: the slap, its volume, the spray, then bubbles. */
const splash: Recipe = (ac, out, t) => {
  const bus = trim(ac, out, 1.15)
  burst(ac, bus, { at: t, dur: 0.18, gain: 0.7, type: 'bandpass', freq: 2200, q: 0.8 })
  burst(ac, bus, { at: t, dur: 0.5, gain: 0.35, type: 'lowpass', freq: 900 })
  burst(ac, bus, { at: t + 0.03, dur: 0.4, gain: 0.25, type: 'highpass', freq: 3500 })
  for (let i = 0; i < 10; i++) {
    const f = rnd(350, 1100) // a bubble: a short blip that rises in pitch
    tone(ac, bus, { freq: f, to: f * rnd(1.6, 2.4), glide: 0.05, at: t + 0.08 + Math.pow(Math.random(), 1.3) * 0.6, attack: 0.003, decay: rnd(0.05, 0.1), gain: rnd(0.1, 0.22) })
  }
  return 0.9
}

/** A fire: a low roar that fades, with clusters of tiny pops and the odd bigger one. */
const fireCrackle: Recipe = (ac, out, t) => {
  // The pops are placed at random and can pile up: a soft clip keeps the loudest take under control, typical pops keep their level.
  const bus = trim(ac, saturate(ac, out, 1.4, 0.85), 1.8)
  const dur = 1.7
  burst(ac, bus, { at: t, dur, gain: 0.06, type: 'bandpass', freq: 300, q: 0.6, attack: 0.15 })
  for (let i = 0; i < 34; i++) {
    const at = t + 0.02 + Math.pow(Math.random(), 1.2) * (dur - 0.2)
    const big = Math.random() < 0.18
    burst(ac, bus, { at, dur: big ? rnd(0.012, 0.02) : rnd(0.004, 0.01), gain: big ? rnd(0.4, 0.65) : rnd(0.1, 0.35), type: 'bandpass', freq: rnd(1200, 4500), q: rnd(0.8, 2) })
    if (big) tone(ac, bus, { freq: rnd(160, 260), to: 70, glide: 0.03, at, attack: 0.001, decay: 0.04, gain: 0.2 })
  }
  return dur + 0.1
}

const RECIPES = new Map<string, Recipe>([
  ['door-knock', doorKnock],
  ['door-creak', doorCreak],
  ['door-slam', doorSlam],
  ['footsteps', footsteps],
  ['sword-clash', swordClash],
  ['glass-break', glassBreak],
  ['heartbeat', heartbeat],
  ['thunder', thunder],
  ['bell', bell],
  ['whoosh', whoosh],
  ['impact', impact],
  ['magic', magic],
  ['splash', splash],
  ['fire-crackle', fireCrackle],
])

export const hasSfx = (cue: string) => RECIPES.has(cue)

/** Schedule a cue on any context starting at `at`. Returns its length in seconds (0 for an unknown cue). */
export function renderCue(ac: BaseAudioContext, out: AudioNode, cue: string, at = 0): number {
  return RECIPES.get(cue)?.(ac, out, at) ?? 0
}

export class SfxBoard {
  /** `context` is the shared interface-sound AudioContext (created on demand). */
  constructor(private context: () => AudioContext | null) {}

  /** Play a cue once. `volume` is 0 – 1 and already includes any background dimming. */
  play(cue: string, volume: number): boolean {
    if (volume <= 0 || !RECIPES.has(cue)) return false
    const ac = this.context()
    if (!ac || ac.state === 'closed') return false
    // A cue that arrives while the context is still locked is dropped rather than retried: a late knock is worse than none.
    if (ac.state === 'suspended') void ac.resume().catch(() => {})
    const master = ac.createGain()
    master.gain.value = Math.min(1, volume) * 0.6
    master.connect(ac.destination)
    try {
      const len = renderCue(ac, master, cue, ac.currentTime + 0.02)
      setTimeout(() => master.disconnect(), (len + 0.4) * 1000)
      return true
    } catch {
      master.disconnect()
      return false
    }
  }
}
