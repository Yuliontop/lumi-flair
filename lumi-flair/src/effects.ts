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

type Kind = 'dot' | 'star' | 'rect' | 'ring' | 'head' | 'text'

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

export function playSendEffect(
  fx: FxCanvas,
  effect: SendEffect,
  originClient: Point,
  color: RGB,
  intensity: number,
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
  }
}
