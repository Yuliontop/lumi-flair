/**
 * Tiny canvas particle engine for the send effects.
 *
 * Everything is drawn in *rendered* pixels (the same space as
 * getBoundingClientRect), and the canvas bitmap is sized from its own
 * rendered rect. That keeps effects lined up with the composer no matter what
 * Lumiverse UI Scale (CSS zoom on <body>) the user has picked.
 */
import type { SendEffect } from './settings'

export interface RGB {
  r: number
  g: number
  b: number
}

export interface Point {
  x: number
  y: number
}

type Kind = 'dot' | 'star' | 'rect' | 'ring' | 'head' | 'text' | 'stream' | 'singularity' | 'petal'

/** One drop of liquid inside a 'stream' particle. */
interface Drop {
  x: number
  y: number
  vx: number
  vy: number
  r: number
  /** emission order — neighbours in the jet are joined into one ribbon */
  i: number
  age: number
  life: number
  splash?: boolean
}

interface Particle {
  kind: Kind
  x: number
  y: number
  vx: number
  vy: number
  age: number
  life: number
  delay: number
  size: number
  gravity: number
  drag: number
  rot: number
  vr: number
  color: string
  /** ring: max radius; head: target point + trail */
  maxR?: number
  from?: Point
  to?: Point
  trail?: Point[]
  /** text: the label to draw */
  label?: string
  /** stream: liquid jet state */
  stream?: StreamState
  /** singularity: black-hole timeline state */
  hole?: HoleState
  /** petal: wind-driven flutter */
  petal?: PetalState
}

interface PetalState {
  tvx: number
  tvy: number
  windK: number
  ramp: number
  freq: number
  amp: number
  phase: number
  flip: number
  color2: string
}

/** A mote of dust with a scheduled spiral into the hole (so every mote is eaten before the collapse). */
interface Dust {
  r0: number
  r: number
  a: number
  start: number
  arrive: number
  color: string
  alive: boolean
}

interface HoleTimeline {
  beam: number
  form: number
  feedEnd: number
  collapseStart: number
  collapseEnd: number
  detonate: number
  total: number
}

interface HoleState {
  cx: number
  cy: number
  R: number
  T: HoleTimeline
  maxR: number
  dust: Dust[]
  eaten: number
  flare: number
  noFlash: boolean
  hot: string
  glow: string
  rim: string
}

interface StreamState {
  drops: Drop[]
  emitted: number
  total: number
  emitFor: number
  speed: number
  baseR: number
  floorY: number
  palette: { body: string; edge: string; shade: string; shine: string }
}

const rand = (a: number, b: number) => a + Math.random() * (b - a)
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)

// ── Colour helpers ────────────────────────────────────────────────────────

/** Parse rgb()/rgba()/color(srgb …) as returned by getComputedStyle. */
export function parseComputedColor(value: string): RGB | null {
  const v = value.trim()
  const srgb = v.match(/^color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/i)
  if (srgb) {
    return { r: +srgb[1] * 255, g: +srgb[2] * 255, b: +srgb[3] * 255 }
  }
  const nums = v.match(/[\d.]+/g)
  if (/^rgba?\(/i.test(v) && nums && nums.length >= 3) {
    return { r: +nums[0], g: +nums[1], b: +nums[2] }
  }
  return null
}

function rgbToHsl({ r, g, b }: RGB): [number, number, number] {
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return [0, 0, l * 100]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h = 0
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0)
  else if (max === g) h = (b - r) / d + 2
  else h = (r - g) / d + 4
  return [h * 60, s * 100, l * 100]
}

const rgba = (c: RGB, a: number) =>
  `rgba(${Math.round(c.r)}, ${Math.round(c.g)}, ${Math.round(c.b)}, ${a})`

function lighten(c: RGB, amt: number): RGB {
  return {
    r: c.r + (255 - c.r) * amt,
    g: c.g + (255 - c.g) * amt,
    b: c.b + (255 - c.b) * amt,
  }
}

/** A small palette of hue-shifted siblings — keeps confetti on-theme. */
function paletteFrom(base: RGB): string[] {
  const [h, s, l] = rgbToHsl(base)
  const sat = Math.max(s, 55)
  const light = Math.min(Math.max(l, 55), 72)
  return [
    `hsl(${h}, ${sat}%, ${light}%)`,
    `hsl(${h + 35}, ${sat}%, ${light}%)`,
    `hsl(${h - 35}, ${sat}%, ${light}%)`,
    `hsl(${h + 180}, ${Math.min(sat, 70)}%, ${light + 6}%)`,
    `hsl(${h}, 30%, 94%)`,
  ]
}

// ── Engine ────────────────────────────────────────────────────────────────

export class FxCanvas {
  private g: CanvasRenderingContext2D | null
  private particles: Particle[] = []
  private raf = 0
  private last = 0
  private rect = { left: 0, top: 0, width: 0, height: 0 }

  constructor(private canvas: HTMLCanvasElement) {
    this.g = canvas.getContext('2d')
  }

  private resize() {
    const r = this.canvas.getBoundingClientRect()
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    this.rect = { left: r.left, top: r.top, width: r.width, height: r.height }
    const w = Math.max(1, Math.round(r.width * dpr))
    const h = Math.max(1, Math.round(r.height * dpr))
    if (this.canvas.width !== w) this.canvas.width = w
    if (this.canvas.height !== h) this.canvas.height = h
    this.g?.setTransform(dpr, 0, 0, dpr, 0, 0)
  }

  /** Convert a viewport (client) point into canvas space. */
  local(p: Point): Point {
    return { x: p.x - this.rect.left, y: p.y - this.rect.top }
  }

  get height() {
    return this.rect.height
  }

  get width() {
    return this.rect.width
  }

  spawn(list: Particle[]) {
    this.particles.push(...list)
    if (!this.raf) {
      this.last = performance.now()
      this.raf = requestAnimationFrame(this.tick)
    }
  }

  prepare() {
    this.resize()
  }

  private tick = (now: number) => {
    const g = this.g
    if (!g) return
    // rAF timestamps are frame-start times and can be slightly *earlier* than
    // the performance.now() captured at spawn — clamp so time never runs backwards.
    const dt = Math.min(0.05, Math.max(0, (now - this.last) / 1000))
    this.last = Math.max(this.last, now)
    g.clearRect(0, 0, this.rect.width, this.rect.height)

    const alive: Particle[] = []
    for (const p of this.particles) {
      if (p.delay > 0) {
        p.delay -= dt
        alive.push(p)
        continue
      }
      p.age += dt
      if (p.age >= p.life) continue
      try {
        this.step(p, dt)
        this.draw(g, p)
      } catch {
        // A bad particle must never kill the loop and leave pixels on screen.
        continue
      }
      alive.push(p)
    }
    this.particles = alive

    if (alive.length) {
      this.raf = requestAnimationFrame(this.tick)
    } else {
      this.raf = 0
      g.clearRect(0, 0, this.rect.width, this.rect.height)
    }
  }

  private step(p: Particle, dt: number) {
    if (p.kind === 'stream' && p.stream) return stepStream(p, p.stream, dt)
    if (p.kind === 'singularity' && p.hole) return stepHole(p, p.hole, dt)
    if (p.kind === 'petal' && p.petal) return stepPetal(p, p.petal, dt)
    if (p.kind === 'head' && p.from && p.to) {
      const t = easeOutCubic(Math.min(1, p.age / p.life))
      // Gentle arc: bow sideways in the middle of the flight.
      const bow = Math.sin(t * Math.PI) * p.vx
      p.x = p.from.x + (p.to.x - p.from.x) * t + bow
      p.y = p.from.y + (p.to.y - p.from.y) * t
      p.trail!.unshift({ x: p.x, y: p.y })
      if (p.trail!.length > 18) p.trail!.pop()
      return
    }
    const drag = Math.pow(p.drag, dt)
    p.vx *= drag
    p.vy = p.vy * drag + p.gravity * dt
    p.x += p.vx * dt
    p.y += p.vy * dt
    p.rot += p.vr * dt
  }

  private draw(g: CanvasRenderingContext2D, p: Particle) {
    const t = p.age / p.life
    const fade = t < 0.15 ? t / 0.15 : 1 - Math.max(0, (t - 0.55) / 0.45)

    switch (p.kind) {
      case 'dot': {
        g.globalCompositeOperation = 'lighter'
        g.globalAlpha = fade
        g.fillStyle = p.color
        g.beginPath()
        g.arc(p.x, p.y, p.size * (1 - t * 0.5), 0, Math.PI * 2)
        g.fill()
        break
      }
      case 'star': {
        g.globalCompositeOperation = 'lighter'
        g.globalAlpha = fade * (0.65 + 0.35 * Math.sin(p.age * 30 + p.rot))
        g.fillStyle = p.color
        const s = p.size * (1.2 - t * 0.6)
        g.save()
        g.translate(p.x, p.y)
        g.rotate(p.rot)
        g.beginPath()
        // Four-point sparkle
        for (let i = 0; i < 8; i++) {
          const r = i % 2 === 0 ? s * 2.4 : s * 0.55
          const a = (i * Math.PI) / 4
          g.lineTo(Math.cos(a) * r, Math.sin(a) * r)
        }
        g.closePath()
        g.fill()
        g.restore()
        break
      }
      case 'rect': {
        g.globalCompositeOperation = 'source-over'
        g.globalAlpha = Math.min(1, fade * 1.2)
        g.fillStyle = p.color
        g.save()
        g.translate(p.x, p.y)
        g.rotate(p.rot)
        g.scale(1, Math.cos(p.age * 9 + p.rot)) // paper flip
        g.fillRect(-p.size, -p.size * 0.45, p.size * 2, p.size * 0.9)
        g.restore()
        break
      }
      case 'ring': {
        const r = Math.max(0, (p.maxR ?? 120) * easeOutCubic(Math.max(0, t)))
        g.globalCompositeOperation = 'lighter'
        g.globalAlpha = (1 - t) * 0.9
        g.strokeStyle = p.color
        g.lineWidth = Math.max(0.5, p.size * (1 - t))
        g.beginPath()
        g.ellipse(p.x, p.y, r, r * 0.62, 0, 0, Math.PI * 2)
        g.stroke()
        break
      }
      case 'text': {
        const rise = easeOutCubic(Math.min(1, t * 2.5)) * 18
        g.globalCompositeOperation = 'source-over'
        g.globalAlpha = fade
        g.font = `600 ${p.size}px system-ui, -apple-system, "Segoe UI", sans-serif`
        g.textAlign = 'center'
        g.textBaseline = 'middle'
        g.shadowColor = p.color
        g.shadowBlur = 18
        g.fillStyle = '#fff'
        g.fillText(p.label ?? '', p.x, p.y - rise)
        g.shadowBlur = 0
        break
      }
      case 'stream': {
        if (p.stream) drawStream(g, p, p.stream, fade)
        break
      }
      case 'singularity': {
        if (p.hole) drawHole(g, p, p.hole, this.rect.width, this.rect.height)
        break
      }
      case 'petal': {
        if (p.petal) drawPetal(g, p, p.petal, fade)
        break
      }
      case 'head': {
        g.globalCompositeOperation = 'lighter'
        const trail = p.trail ?? []
        for (let i = trail.length - 1; i > 0; i--) {
          const k = 1 - i / trail.length
          g.globalAlpha = k * 0.55 * fade
          g.strokeStyle = p.color
          g.lineWidth = p.size * k * 1.4
          g.lineCap = 'round'
          g.beginPath()
          g.moveTo(trail[i].x, trail[i].y)
          g.lineTo(trail[i - 1].x, trail[i - 1].y)
          g.stroke()
        }
        const glow = g.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 4)
        glow.addColorStop(0, 'rgba(255,255,255,0.95)')
        glow.addColorStop(0.25, p.color)
        glow.addColorStop(1, 'rgba(0,0,0,0)')
        g.globalAlpha = fade
        g.fillStyle = glow
        g.beginPath()
        g.arc(p.x, p.y, p.size * 4, 0, Math.PI * 2)
        g.fill()
        break
      }
    }
    g.globalAlpha = 1
    g.globalCompositeOperation = 'source-over'
  }

  destroy() {
    if (this.raf) cancelAnimationFrame(this.raf)
    this.raf = 0
    this.particles = []
  }
}

// ── Liquid jet ('stream') ─────────────────────────────────────────────────

const STREAM_GRAVITY = 1900

function stepStream(p: Particle, st: StreamState, dt: number) {
  // Emit: a pulsing column that is thick at first and thins out.
  const shouldHave = Math.min(st.total, Math.floor((p.age / st.emitFor) * st.total))
  while (st.emitted < shouldHave) {
    const i = st.emitted++
    const t = i / st.total
    const pulse = 0.86 + 0.14 * Math.sin(t * Math.PI * 7)
    // A whale spout is a V: the cone opens as the blow goes on.
    const spread = 0.06 + 0.26 * Math.min(1, t * 1.6)
    const wobble = Math.sin(t * 23) * 0.03 + rand(-spread, spread)
    // Centre drops fly highest; the edges of the V fall short and arc outward.
    const v = st.speed * pulse * (1 - Math.abs(wobble) * 0.9) * rand(0.9, 1.04)
    st.drops.push({
      x: p.x + rand(-st.baseR * 0.6, st.baseR * 0.6),
      y: p.y,
      vx: Math.sin(wobble) * v,
      vy: -Math.cos(wobble) * v,
      r: st.baseR * (1.2 - t * 0.5) * rand(0.75, 1.2),
      i,
      age: 0,
      life: 99,
    })
    // Fine cream mist around the spout, fanning wider than the main column.
    if (i % 2 === 0) {
      const ma = rand(-1, 1) * (spread + 0.18)
      const mv = st.speed * rand(0.55, 0.9)
      st.drops.push({
        x: p.x + rand(-st.baseR, st.baseR),
        y: p.y - rand(0, 10),
        vx: Math.sin(ma) * mv,
        vy: -Math.cos(ma) * mv,
        r: rand(1.4, 3.2),
        i: -2,
        age: 0,
        life: 99,
      })
    }
  }
  const next: Drop[] = []
  for (const d of st.drops) {
    d.age += dt
    if (d.age >= d.life) continue
    // The plume breaks up near the top: drops slow, spread and wobble apart.
    if (!d.splash && d.vy > -st.speed * 0.25 && d.vy < st.speed * 0.2) d.vx += rand(-140, 140) * dt
    d.vx *= Math.pow(0.7, dt)
    d.vy += STREAM_GRAVITY * dt
    d.x += d.vx * dt
    d.y += d.vy * dt
    // Falling cream lands back on the composer with a little splat.
    if (!d.splash && d.vy > 0 && d.y >= st.floorY) {
      if (d.i < 0) continue // mist just vanishes into the splash
      const n = d.r > 7 ? 2 : 1
      for (let k = 0; k < n; k++) {
        next.push({
          x: d.x,
          y: st.floorY - 1,
          vx: rand(-170, 170),
          vy: rand(-260, -90),
          r: d.r * rand(0.28, 0.45),
          i: -1,
          age: 0,
          life: rand(0.35, 0.6),
          splash: true,
        })
      }
      continue
    }
    next.push(d)
  }
  st.drops = next
}

function drawStream(g: CanvasRenderingContext2D, p: Particle, st: StreamState, fade: number) {
  const pal = st.palette
  // Only the last ~25% of the effect fades, so the cream stays solid while it flies.
  const t = p.age / p.life
  const alpha = Math.min(1, fade * 1.6) * (t > 0.75 ? 1 - (t - 0.75) / 0.25 : 1)
  if (alpha <= 0) return
  const jet = st.drops.filter((d) => d.i >= 0 && d.vy < -st.speed * 0.3).sort((a, b) => a.i - b.i)
  g.globalCompositeOperation = 'source-over'
  g.globalAlpha = alpha
  g.lineCap = 'round'
  g.lineJoin = 'round'

  const ribbon = (extra: number, style: string) => {
    g.strokeStyle = style
    g.fillStyle = style
    for (let k = 1; k < jet.length; k++) {
      const a = jet[k - 1], b = jet[k]
      // Join neighbours that are still close: one continuous rope of cream.
      if (b.i - a.i > 3 || Math.hypot(a.x - b.x, a.y - b.y) > (a.r + b.r) * 2.6) continue
      g.lineWidth = Math.max(1, Math.min(a.r, b.r) * 1.9 + extra)
      g.beginPath()
      g.moveTo(a.x, a.y)
      g.lineTo(b.x, b.y)
      g.stroke()
    }
    for (const d of st.drops) {
      const sp = Math.hypot(d.vx, d.vy)
      const stretch = 1 + Math.min(0.9, sp / 1400) // drops elongate as they fly
      const ang = Math.atan2(d.vy, d.vx)
      g.beginPath()
      g.ellipse(d.x, d.y, Math.max(0.5, d.r * stretch + extra / 2), Math.max(0.5, d.r / Math.sqrt(stretch) + extra / 2), ang, 0, Math.PI * 2)
      g.fill()
    }
  }

  // An offset shade and a darker rim keep white cream visible on light themes.
  // (Offset fills instead of shadowBlur: same look, a fraction of the cost.)
  g.save()
  g.translate(0, 2.5)
  g.globalAlpha = alpha * 0.55
  ribbon(4, pal.shade)
  g.restore()
  g.globalAlpha = alpha
  ribbon(3, pal.edge)
  ribbon(0, pal.body)

  // Glossy highlights.
  g.fillStyle = pal.shine
  for (const d of st.drops) {
    if (d.r < 2.2) continue
    g.globalAlpha = alpha * 0.85
    g.beginPath()
    g.ellipse(d.x - d.r * 0.32, d.y - d.r * 0.38, d.r * 0.34, d.r * 0.22, -0.6, 0, Math.PI * 2)
    g.fill()
  }

  // A foamy cap bubbling on the nozzle while the jet is firing.
  if (p.age < st.emitFor + 0.25) {
    const k = Math.max(0, 1 - Math.max(0, p.age - st.emitFor) / 0.25)
    const r = st.baseR * (1.25 + 0.2 * Math.sin(p.age * 40)) * k
    if (r > 0.5) {
      g.globalAlpha = alpha
      g.fillStyle = pal.edge
      g.beginPath()
      g.ellipse(p.x, p.y + 1, r * 1.5 + 1.5, r * 0.8 + 1.5, 0, 0, Math.PI * 2)
      g.fill()
      g.fillStyle = pal.body
      g.beginPath()
      g.ellipse(p.x, p.y, r * 1.5, r * 0.8, 0, 0, Math.PI * 2)
      g.fill()
    }
  }
  g.globalAlpha = 1
}

// ── Black hole ('singularity') ────────────────────────────────────────────

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

/** Radius of a mote along its scheduled spiral: slow at first, then accelerating into the horizon. */
function dustRadius(d: Dust, t: number, horizon: number): number {
  if (t <= d.start) return d.r0
  const p = Math.min(1, (t - d.start) / (d.arrive - d.start))
  return horizon + (d.r0 - horizon) * (1 - Math.pow(p, 2.3))
}

/** The hole's radius right now: grows while feeding, implodes to a dot, then is gone. */
function holeRadius(h: HoleState, t: number): number {
  const T = h.T
  const grow = smooth(T.form, T.form + 0.45, t)
  const fed = h.R * (1 + 0.28 * (h.eaten / Math.max(1, h.dust.length)))
  const dotR = Math.max(2.5, h.R * 0.07)
  if (t < T.collapseStart) return fed * grow
  if (t < T.collapseEnd) {
    const u = (t - T.collapseStart) / (T.collapseEnd - T.collapseStart)
    return fed + (dotR - fed) * Math.pow(u, 2.2) // accelerating implosion
  }
  if (t < T.detonate) return dotR * (1 + 0.28 * Math.sin(t * 70)) // trembling
  return 0
}

function stepHole(p: Particle, h: HoleState, dt: number) {
  const t = p.age
  const horizon = Math.max(4, holeRadius(h, t) * 0.55)
  for (const d of h.dust) {
    if (!d.alive) continue
    if (t < h.T.form) continue
    d.r = dustRadius(d, t, horizon)
    // Orbit speeds up as the radius shrinks.
    d.a += (95 / Math.pow(Math.max(d.r, 12), 0.62)) * dt
    if (t >= d.arrive) {
      d.alive = false
      h.eaten++
      h.flare = Math.min(1.6, h.flare + 0.09) // the ring flares with every swallow
    }
  }
  h.flare *= Math.exp(-5 * dt)
}

function drawHole(g: CanvasRenderingContext2D, p: Particle, h: HoleState, w: number, hgt: number) {
  const t = p.age
  const T = h.T
  const grow = smooth(T.form, T.form + 0.45, t)
  const coreR = holeRadius(h, t)
  const det = T.detonate
  const collapsing = smooth(T.collapseStart, T.collapseEnd, t)
  const white = smooth(T.collapseStart + (T.collapseEnd - T.collapseStart) * 0.45, T.collapseEnd, t)

  // Gravity well: the space around the hole darkens, deepest just before detonation.
  if (t < det + 0.3) {
    const k = grow * (t < det ? 1 + 0.25 * collapsing : 1 - (t - det) / 0.3)
    const wr = h.R * 7
    const well = g.createRadialGradient(h.cx, h.cy, 0, h.cx, h.cy, wr)
    well.addColorStop(0, `rgba(0,0,0,${Math.min(0.8, 0.62 * k)})`)
    well.addColorStop(0.4, `rgba(0,0,0,${Math.min(0.45, 0.3 * k)})`)
    well.addColorStop(1, 'rgba(0,0,0,0)')
    g.globalCompositeOperation = 'source-over'
    g.globalAlpha = 1
    g.fillStyle = well
    g.fillRect(h.cx - wr, h.cy - wr, wr * 2, wr * 2)
  }

  // Dust streaks spiralling in, batched into one path per colour.
  if (t >= T.form && t < T.feedEnd + 0.1) {
    g.globalCompositeOperation = 'lighter'
    g.lineCap = 'round'
    g.globalAlpha = Math.min(1, (t - T.form) * 3) * 0.95
    const horizon = Math.max(4, coreR * 0.55)
    const lag = 0.07
    const byColor = new Map<string, Dust[]>()
    for (const d of h.dust) {
      if (!d.alive) continue
      let list = byColor.get(d.color)
      if (!list) byColor.set(d.color, (list = []))
      list.push(d)
    }
    for (const [color, list] of byColor) {
      g.strokeStyle = color
      g.lineWidth = 2
      g.beginPath()
      for (const d of list) {
        // Motion-blur tail: where this mote was ~70 ms ago on its spiral.
        const om = 95 / Math.pow(Math.max(d.r, 12), 0.62)
        const br = dustRadius(d, t - lag, horizon)
        const ba = d.a - om * lag
        g.moveTo(h.cx + Math.cos(ba) * br, h.cy + Math.sin(ba) * br * 0.78)
        g.lineTo(h.cx + Math.cos(d.a) * d.r, h.cy + Math.sin(d.a) * d.r * 0.78)
      }
      g.stroke()
    }
  }

  if (coreR > 0.5 && t < det) {
    // The disk winds tighter and faster as the hole implodes, then is swallowed.
    const cs = Math.max(0, t - T.collapseStart)
    const spin = t * 7 + cs * cs * 45
    const diskK = grow * (1 - smooth(T.collapseStart, T.collapseEnd - 0.1, t))
    const disk = (front: boolean) => {
      if (diskK <= 0.01) return
      g.save()
      g.translate(h.cx, h.cy)
      g.rotate(-0.32)
      g.scale(1, 0.32)
      g.globalCompositeOperation = 'lighter'
      const from = front ? 0 : Math.PI
      const to = front ? Math.PI : Math.PI * 2
      const bands: Array<[number, string, number]> = [
        [2.6, h.glow, 0.35],
        [2.15, h.rim, 0.6],
        [1.75, h.hot, 0.9],
      ]
      for (const [m, col, a] of bands) {
        g.globalAlpha = a * diskK
        g.strokeStyle = col
        g.lineWidth = coreR * (m > 2.4 ? 1.2 : 0.75)
        g.setLineDash([coreR * 0.9, coreR * 0.35])
        g.lineDashOffset = -spin * coreR * (3.2 - m)
        g.beginPath()
        g.arc(0, 0, coreR * m, from, to)
        g.stroke()
      }
      g.setLineDash([])
      g.restore()
    }
    // Halo of light bent around the hole (turns into a white-hot glow as it implodes).
    const haloR = coreR * (3.4 + 6 * white)
    const halo = g.createRadialGradient(h.cx, h.cy, coreR * 0.9, h.cx, h.cy, haloR)
    // Theme colours while feeding; pure white-hot as it implodes to the dot.
    if (white > 0.02) {
      halo.addColorStop(0, `rgba(255,255,255,${0.85 * white})`)
      halo.addColorStop(0.3, `rgba(255,255,255,${0.32 * white})`)
      halo.addColorStop(0.6, rgbaStr(h.glow, 0.12 * (1 - white)))
    } else {
      halo.addColorStop(0, rgbaStr(h.glow, 0.55 * grow))
      halo.addColorStop(0.35, rgbaStr(h.rim, 0.18 * grow))
    }
    halo.addColorStop(1, 'rgba(0,0,0,0)')
    g.globalCompositeOperation = 'lighter'
    g.globalAlpha = 1
    g.fillStyle = halo
    g.beginPath()
    g.arc(h.cx, h.cy, haloR, 0, Math.PI * 2)
    g.fill()
    disk(false)
    // The event horizon: black while feeding, burning white as it collapses to a dot.
    g.globalCompositeOperation = 'source-over'
    g.globalAlpha = 1
    g.fillStyle = '#000'
    g.beginPath()
    g.arc(h.cx, h.cy, coreR, 0, Math.PI * 2)
    g.fill()
    if (white > 0) {
      g.globalAlpha = white
      g.fillStyle = '#fff'
      g.beginPath()
      g.arc(h.cx, h.cy, coreR, 0, Math.PI * 2)
      g.fill()
    }
    // Photon ring, flaring each time the hole swallows something.
    g.globalCompositeOperation = 'lighter'
    const ringW = Math.max(1.5, coreR * 0.07) * (1 + h.flare * 0.8)
    for (const [mul, a, col] of [[5, 0.12, h.glow], [2.6, 0.3, h.glow], [1, 1, h.hot]] as const) {
      g.globalAlpha = Math.min(1, a * (1 + h.flare)) * (1 - white * 0.6)
      g.strokeStyle = white > 0.5 ? '#ffffff' : col
      g.lineWidth = ringW * mul
      g.beginPath()
      g.arc(h.cx, h.cy, coreR * 1.06, 0, Math.PI * 2)
      g.stroke()
    }
    disk(true)

    // The calm before the blast: rings contract into the white dot.
    if (t >= T.collapseEnd) {
      const hold = (t - T.collapseEnd) / (det - T.collapseEnd)
      for (const off of [0, 0.5]) {
        const q = (hold * 2 + off) % 1
        const rr = h.R * 4.5 * (1 - easeOutCubic(q)) + coreR
        g.globalAlpha = q * 0.7
        g.strokeStyle = '#ffffff'
        g.lineWidth = 1.5 + q * 2
        g.beginPath()
        g.arc(h.cx, h.cy, rr, 0, Math.PI * 2)
        g.stroke()
      }
    }
  }

  // Detonation flash.
  const ft = t - det
  if (ft > -0.02) {
    const dur = h.noFlash ? 0.7 : 0.38
    const peak = h.noFlash ? 0.16 : 0.72
    const k = ft < 0.04 ? Math.max(0, (ft + 0.02) / 0.06) : Math.max(0, 1 - (ft - 0.04) / dur)
    if (k > 0) {
      const R = Math.hypot(w, hgt)
      const flash = g.createRadialGradient(h.cx, h.cy, 0, h.cx, h.cy, R * 0.6)
      flash.addColorStop(0, `rgba(255,255,255,${peak * k})`)
      flash.addColorStop(0.18, rgbaStr(h.glow, peak * 0.55 * k))
      flash.addColorStop(1, 'rgba(0,0,0,0)')
      g.globalCompositeOperation = 'lighter'
      g.globalAlpha = 1
      g.fillStyle = flash
      const fr = R * 0.6
      g.fillRect(Math.max(0, h.cx - fr), Math.max(0, h.cy - fr), Math.min(w, fr * 2), Math.min(hgt, fr * 2))
    }
  }

  // Shockwaves: chromatic rings racing to the screen edges.
  g.globalCompositeOperation = 'lighter'
  for (const [delay, strength] of [[0, 1], [0.15, 0.55]] as const) {
    const u = (t - det - delay) / 1.0
    if (u <= 0 || u >= 1) continue
    const r = easeOutCubic(u) * h.maxR
    const lw = 34 * (1 - u) * strength + 2
    const a = (1 - u) * strength
    const rings: Array<[number, string]> = [
      [-lw * 0.35, 'rgba(70, 220, 255, 1)'],
      [lw * 0.35, 'rgba(255, 70, 190, 1)'],
      [0, h.hot],
    ]
    for (const [off, col] of rings) {
      g.globalAlpha = a * (col === h.hot ? 0.95 : 0.55)
      g.strokeStyle = col
      g.lineWidth = lw * (col === h.hot ? 0.55 : 0.4)
      g.beginPath()
      g.arc(h.cx, h.cy, Math.max(0, r + off), 0, Math.PI * 2)
      g.stroke()
    }
  }
  g.globalAlpha = 1
  g.globalCompositeOperation = 'source-over'
}

/** Accepts '#rrggbb' or 'rgba(...)' and returns it with a new alpha. */
function rgbaStr(col: string, a: number): string {
  if (col.startsWith('#')) {
    const n = parseInt(col.slice(1), 16)
    return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`
  }
  const m = col.match(/[\d.]+/g)
  return m && m.length >= 3 ? `rgba(${m[0]}, ${m[1]}, ${m[2]}, ${a})` : col
}

// ── Petals ────────────────────────────────────────────────────────────────

function stepPetal(p: Particle, s: PetalState, dt: number) {
  // Wind takes hold gradually, so burst petals get swept into the gale.
  const k = s.windK * Math.min(1, p.age / s.ramp) * dt
  // Coherent waves across the screen make the gale flow in sweeping ribbons.
  const sway = (Math.sin(p.x * 0.0065 + p.age * 2.4 + s.phase * 0.25) * 0.7 + Math.sin(p.age * s.freq + s.phase) * 0.3) * s.amp
  p.vx += (s.tvx - p.vx) * Math.min(1, k)
  p.vy += (s.tvy + sway - p.vy) * Math.min(1, k)
  p.vy += p.gravity * dt
  p.x += p.vx * dt
  p.y += p.vy * dt
  p.rot += p.vr * dt
  s.flip += dt * s.freq * 0.9
}

function drawPetal(g: CanvasRenderingContext2D, p: Particle, s: PetalState, fade: number) {
  const z = p.size
  g.save()
  g.translate(p.x, p.y)
  g.rotate(p.rot)
  g.scale(1, Math.max(0.12, Math.abs(Math.cos(s.flip))))
  g.globalCompositeOperation = 'source-over'
  g.globalAlpha = Math.min(1, fade * 1.4)
  // A sakura petal: a rounded teardrop with a small notch at the tip.
  g.fillStyle = p.color
  g.beginPath()
  g.moveTo(0, z)
  g.bezierCurveTo(z * 0.95, z * 0.55, z * 0.85, -z * 0.7, z * 0.22, -z)
  g.lineTo(0, -z * 0.78)
  g.lineTo(-z * 0.22, -z)
  g.bezierCurveTo(-z * 0.85, -z * 0.7, -z * 0.95, z * 0.55, 0, z)
  g.fill()
  // Soft blush towards the base and a vein highlight.
  g.globalAlpha *= 0.55
  g.fillStyle = s.color2
  g.beginPath()
  g.ellipse(0, z * 0.45, z * 0.42, z * 0.38, 0, 0, Math.PI * 2)
  g.fill()
  g.globalAlpha = Math.min(1, fade * 1.4) * 0.5
  g.strokeStyle = 'rgba(255,255,255,0.9)'
  g.lineWidth = Math.max(0.6, z * 0.08)
  g.beginPath()
  g.moveTo(0, z * 0.7)
  g.quadraticCurveTo(z * 0.12, 0, 0, -z * 0.6)
  g.stroke()
  g.restore()
  g.globalAlpha = 1
}

// ── Effect recipes ────────────────────────────────────────────────────────

function base(partial: Partial<Particle> & Pick<Particle, 'kind' | 'x' | 'y' | 'color'>): Particle {
  return {
    vx: 0,
    vy: 0,
    age: 0,
    life: 1,
    delay: 0,
    size: 2,
    gravity: 0,
    drag: 1,
    rot: 0,
    vr: 0,
    ...partial,
  }
}

function sparkle(o: Point, c: RGB, k: number): Particle[] {
  const out: Particle[] = []
  const bright = rgba(lighten(c, 0.35), 1)
  const pale = rgba(lighten(c, 0.75), 1)
  const n = Math.round(34 * k)
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + rand(-1.15, 1.15)
    const sp = rand(160, 520) * (0.7 + k * 0.3)
    out.push(
      base({
        kind: Math.random() < 0.45 ? 'star' : 'dot',
        x: o.x + rand(-10, 10),
        y: o.y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life: rand(0.65, 1.15),
        size: rand(1.4, 3.2),
        gravity: 420,
        drag: 0.25,
        rot: rand(0, Math.PI),
        vr: rand(-4, 4),
        color: Math.random() < 0.3 ? pale : bright,
      }),
    )
  }
  out.push(base({ kind: 'ring', x: o.x, y: o.y, life: 0.55, size: 2.5, maxR: 70 * k, color: bright }))
  return out
}

function ripple(o: Point, c: RGB, k: number): Particle[] {
  const col = rgba(lighten(c, 0.25), 1)
  return [0, 0.11, 0.22, 0.33].slice(0, k >= 1 ? 4 : 3).map((delay, i) =>
    base({
      kind: 'ring',
      x: o.x,
      y: o.y,
      delay,
      life: 0.95,
      size: 3 - i * 0.5,
      maxR: (150 + i * 30) * k,
      color: col,
    }),
  )
}

function comet(o: Point, c: RGB, k: number, fx: FxCanvas): Particle[] {
  const to = { x: o.x + rand(-40, 40), y: Math.max(40, o.y - Math.min(fx.height * 0.5, 460) * Math.min(1.3, k)) }
  const col = rgba(lighten(c, 0.2), 1)
  const out: Particle[] = [
    base({
      kind: 'head',
      x: o.x,
      y: o.y,
      from: { ...o },
      to,
      trail: [],
      vx: rand(-60, 60), // bow amount
      life: 0.75,
      size: 4 + k,
      color: col,
    }),
  ]
  // Sparks shed along the path, then a burst where it lands.
  const n = Math.round(14 * k)
  for (let i = 0; i < n; i++) {
    const t = i / n
    out.push(
      base({
        kind: 'dot',
        x: o.x + (to.x - o.x) * t,
        y: o.y + (to.y - o.y) * easeOutCubic(t),
        delay: t * 0.5,
        vx: rand(-60, 60),
        vy: rand(-20, 60),
        life: rand(0.4, 0.7),
        size: rand(1, 2.2),
        gravity: 200,
        drag: 0.4,
        color: col,
      }),
    )
  }
  for (const p of sparkle(to, c, k * 0.5)) {
    p.delay += 0.62
    out.push(p)
  }
  return out
}

function confetti(o: Point, c: RGB, k: number): Particle[] {
  const pal = paletteFrom(c)
  const n = Math.round(60 * k)
  const out: Particle[] = []
  for (let i = 0; i < n; i++) {
    out.push(
      base({
        kind: 'rect',
        x: o.x + rand(-30, 30),
        y: o.y,
        vx: rand(-280, 280),
        vy: rand(-760, -360) * (0.75 + k * 0.25),
        life: rand(1.3, 2),
        size: rand(3, 6),
        gravity: 950,
        drag: 0.35,
        rot: rand(0, Math.PI * 2),
        vr: rand(-10, 10),
        color: pal[i % pal.length],
      }),
    )
  }
  return out
}

/** Creamy: a whale-spout of thick white cream erupts from the button and rains back down. */
function creamy(o: Point, c: RGB, k: number, fx: FxCanvas): Particle[] {
  const apex = Math.min(fx.height * 0.55, 520) * (0.8 + 0.2 * Math.min(k, 1.6))
  const speed = Math.sqrt(2 * STREAM_GRAVITY * apex)
  const emitFor = 0.5 + 0.15 * Math.min(k, 2)
  const flight = (2 * speed) / STREAM_GRAVITY
  // A hint of the theme colour in the shading so it sits in any palette.
  const tint = lighten(c, 0.82)
  const st: StreamState = {
    drops: [],
    emitted: 0,
    total: Math.round(130 * Math.min(2, Math.max(0.5, k))),
    emitFor,
    speed,
    baseR: 8 * (0.85 + 0.15 * Math.min(k, 2)),
    floorY: o.y + 4,
    palette: {
      body: '#fffaf0',
      edge: rgba({ r: (214 + tint.r) / 2, g: (199 + tint.g) / 2, b: (172 + tint.b) / 2 }, 1),
      shade: 'rgba(60, 45, 25, 0.45)',
      shine: 'rgba(255, 255, 255, 0.95)',
    },
  }
  return [
    base({ kind: 'ring', x: o.x, y: o.y, life: 0.45, size: 2.5, maxR: 46 * k, color: 'rgba(255, 250, 240, 0.9)' }),
    base({ kind: 'stream', x: o.x, y: o.y, life: emitFor + flight + 0.7, stream: st, color: '#fffaf0' }),
  ]
}

/** Timeline of the black hole (seconds), shared with the chat-warp CSS in styles.ts. */
export const HOLE_TIMING: HoleTimeline = {
  beam: 0.32,
  form: 0.3,
  feedEnd: 2.7, // the last mote is swallowed
  collapseStart: 2.9, // a beat of stillness, then the implosion
  collapseEnd: 3.6, // a tiny white dot remains
  detonate: 3.95,
  total: 5.15,
}

/** Black Hole: a beam opens a singularity that swallows the screen, then a shockwave blasts out. */
function blackHole(o: Point, c: RGB, k: number, fx: FxCanvas, center: Point, noFlash: boolean): Particle[] {
  const w = fx.width, h = fx.height
  const R = Math.max(30, Math.min(w, h) * 0.085) * (0.85 + 0.15 * Math.min(k, 2))
  const hot = rgba(lighten(c, 0.75), 1)
  const glow = rgba(lighten(c, 0.25), 1)
  const pal = paletteFrom(c)
  const dust: Dust[] = []
  const n = Math.round(240 * Math.min(2, Math.max(0.5, k)))
  const far = Math.hypot(w, h) * 0.6
  const T = HOLE_TIMING
  for (let i = 0; i < n; i++) {
    const r0 = rand(R * 2.2, far)
    // A steady stream: each mote has its own arrival time, the last one exactly at feedEnd.
    const start = T.form + rand(0, 0.5)
    const arrive = i === n - 1 ? T.feedEnd : start + rand(0.8, T.feedEnd - start)
    dust.push({ r0, r: r0, a: rand(0, Math.PI * 2), start, arrive, color: Math.random() < 0.35 ? hot : pal[i % pal.length], alive: true })
  }
  const hole: HoleState = {
    cx: center.x, cy: center.y, R, T,
    maxR: Math.hypot(Math.max(center.x, w - center.x), Math.max(center.y, h - center.y)) + 60,
    dust, eaten: 0, flare: 0, noFlash, hot, glow, rim: pal[1],
  }
  const out: Particle[] = [
    // The send button fires a beam that opens the singularity.
    base({ kind: 'head', x: o.x, y: o.y, from: { ...o }, to: { ...center }, trail: [], vx: rand(-30, 30), life: T.beam, size: 4 + k, color: glow }),
    base({ kind: 'singularity', x: center.x, y: center.y, life: T.total, hole, color: glow }),
  ]
  // Debris flung out by the shockwave.
  const debris = Math.round(70 * Math.min(2, k))
  for (let i = 0; i < debris; i++) {
    const a = rand(0, Math.PI * 2)
    const sp = rand(380, 1250)
    out.push(
      base({
        kind: Math.random() < 0.4 ? 'star' : 'dot',
        x: center.x, y: center.y,
        delay: T.detonate,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        life: rand(0.6, 1.1), size: rand(1.4, 3.4), drag: 0.18, gravity: 120,
        rot: rand(0, Math.PI), vr: rand(-6, 6),
        color: Math.random() < 0.4 ? hot : pal[i % pal.length],
      }),
    )
  }
  return out
}

const SAKURA = ['#ffd6e6', '#ffc2d9', '#ffadc9', '#fff0f6', '#ff9cbf']

/** Petal Storm: a fan of blossoms bursts from the button, then a gale sweeps petals across the whole screen. */
function petalStorm(o: Point, c: RGB, k: number, fx: FxCanvas): Particle[] {
  const w = fx.width, h = fx.height
  const kk = Math.min(2, Math.max(0.5, k))
  const tint = rgba(lighten(c, 0.55), 1)
  const pick = () => (Math.random() < 0.2 ? tint : SAKURA[Math.floor(Math.random() * SAKURA.length)])
  const blush = 'rgba(255, 120, 165, 1)'
  const petal = (x: number, y: number, vx: number, vy: number, delay: number, size: number, tvx: number, tvy: number, ramp: number, life: number) =>
    base({
      kind: 'petal', x, y, vx, vy, delay, size, life, gravity: 60,
      rot: rand(0, Math.PI * 2), vr: rand(-5, 5), color: pick(),
      petal: { tvx, tvy, windK: 2.2, ramp, freq: rand(3, 7), amp: rand(140, 300), phase: rand(0, 6.3), flip: rand(0, 6.3), color2: blush },
    })
  const out: Particle[] = []
  // 1) The burst out of the send button.
  const burstN = Math.round(70 * kk)
  for (let i = 0; i < burstN; i++) {
    const a = -Math.PI / 2 + rand(-1.25, 1.25)
    const sp = rand(380, 900)
    out.push(petal(o.x, o.y, Math.cos(a) * sp, Math.sin(a) * sp, rand(0, 0.12), rand(8, 14), rand(-650, -350), rand(-220, -60), 0.9, rand(2.2, 2.8)))
  }
  // 2) The gale: petals sweep in from the right edge and the bottom, across the whole screen.
  const stormN = Math.round(240 * kk)
  for (let i = 0; i < stormN; i++) {
    const depth = Math.random()
    const near = depth > 0.92
    const size = near ? rand(20, 30) : 6 + depth * 10
    const speed = (520 + depth * 520) * (near ? 1.35 : 1)
    const fromBottom = Math.random() < 0.35
    const x = fromBottom ? rand(w * 0.35, w + 40) : w + rand(10, 80)
    const y = fromBottom ? h + rand(10, 60) : rand(-20, h * 0.95)
    const tvx = -speed
    const tvy = rand(-260, -40)
    const life = (w + 200) / speed + 0.6
    out.push(petal(x, y, tvx * 0.6, tvy, rand(0.15, 1.5), size, tvx, tvy, 0.25, life))
  }
  return out
}

/** Floating celebratory caption (milestones). */
export function playBanner(fx: FxCanvas, label: string, color: RGB) {
  fx.prepare()
  const x = fx.width / 2
  const y = fx.height * 0.42
  fx.spawn([
    base({ kind: 'text', x, y, life: 2.6, size: Math.min(34, Math.max(20, fx.width / 28)), label, color: rgba(lighten(color, 0.2), 1) }),
    ...sparkle({ x, y: y + 24 }, color, 0.8).map((p) => ({ ...p, delay: p.delay + 0.1 })),
  ])
}

/** Viewport centre in client coordinates — used for AI/keyword effects with no better anchor. */
export function viewportCenter(): Point {
  return { x: window.innerWidth / 2, y: window.innerHeight * 0.55 }
}

export interface EffectOptions {
  /** Where screen-scale effects (Black Hole) centre, in client coordinates. */
  center?: Point
  /** Soften flashes for light-sensitive viewers. */
  noFlash?: boolean
}

export function playSendEffect(
  fx: FxCanvas,
  effect: SendEffect,
  originClient: Point,
  color: RGB,
  intensity: number,
  opts: EffectOptions = {},
) {
  if (effect === 'none') return
  fx.prepare()
  const o = fx.local(originClient)
  const k = Math.max(0.25, Math.min(2, intensity))
  switch (effect) {
    case 'sparkle':
      fx.spawn(sparkle(o, color, k))
      break
    case 'ripple':
      fx.spawn(ripple(o, color, k))
      break
    case 'comet':
      fx.spawn(comet(o, color, k, fx))
      break
    case 'confetti':
      fx.spawn(confetti(o, color, k))
      break
    case 'creamy':
      fx.spawn(creamy(o, color, k, fx))
      break
    case 'blackhole': {
      const c = opts.center ? fx.local(opts.center) : { x: fx.width / 2, y: fx.height * 0.42 }
      fx.spawn(blackHole(o, color, k, fx, c, !!opts.noFlash))
      break
    }
    case 'petalstorm':
      fx.spawn(petalStorm(o, color, k, fx))
      break
  }
}
