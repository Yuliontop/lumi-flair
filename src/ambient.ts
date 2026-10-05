/**
 * Ambient scene layer: slow, low-opacity particles (snow, rain, embers,
 * fireflies, petals, stars) on their own canvas under the burst effects.
 * It pauses while the tab is hidden and stops entirely when the scene is off.
 */
import type { Scene } from './settings'

interface Mote {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  phase: number
  life: number
  age: number
  rot: number
  vr: number
  hue: number
}

const rand = (a: number, b: number) => a + Math.random() * (b - a)

/** Particles alive at density 1 for a 1000×1000 viewport. Scaled by area. */
const BASE_COUNT: Record<Exclude<Scene, 'off'>, number> = {
  snow: 90,
  rain: 140,
  embers: 45,
  fireflies: 28,
  petals: 32,
  stars: 120,
}

export class AmbientCanvas {
  private g: CanvasRenderingContext2D | null
  private motes: Mote[] = []
  private raf = 0
  private last = 0
  /**
   * On a touch screen the scene is drawn at about 30 fps. These are slow, soft particles, and every frame
   * makes the browser redraw whatever blurs the background behind the messages, which is where a phone struggles.
   */
  private minFrameMs = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches ? 28 : 0
  private scene: Scene = 'off'
  private density = 1
  private w = 0
  private h = 0
  private shooting: { x: number; y: number; vx: number; vy: number; age: number } | null = null
  private onVisibility = () => {
    if (document.hidden) this.stopLoop()
    else if (this.scene !== 'off') this.startLoop()
  }

  constructor(private canvas: HTMLCanvasElement) {
    this.g = canvas.getContext('2d')
    document.addEventListener('visibilitychange', this.onVisibility)
  }

  get current(): Scene {
    return this.scene
  }

  set(scene: Scene, density: number) {
    const changed = scene !== this.scene
    this.scene = scene
    this.density = density
    if (scene === 'off') {
      this.stopLoop()
      this.motes = []
      this.g?.clearRect(0, 0, this.canvas.width, this.canvas.height)
      return
    }
    this.resize()
    if (changed) this.motes = []
    this.fill()
    if (!document.hidden) this.startLoop()
  }

  private target(): number {
    if (this.scene === 'off') return 0
    const area = (this.w * this.h) / 1_000_000
    return Math.round(BASE_COUNT[this.scene] * this.density * Math.max(0.4, Math.min(2.2, area)))
  }

  private resize() {
    const r = this.canvas.getBoundingClientRect()
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5) // ambient doesn't need retina sharpness
    this.w = r.width
    this.h = r.height
    const bw = Math.max(1, Math.round(r.width * dpr))
    const bh = Math.max(1, Math.round(r.height * dpr))
    if (this.canvas.width !== bw) this.canvas.width = bw
    if (this.canvas.height !== bh) this.canvas.height = bh
    this.g?.setTransform(dpr, 0, 0, dpr, 0, 0)
  }

  private spawn(initial: boolean): Mote {
    const W = this.w
    const H = this.h
    const m: Mote = { x: rand(0, W), y: rand(0, H), vx: 0, vy: 0, size: 2, phase: rand(0, Math.PI * 2), life: Infinity, age: 0, rot: rand(0, Math.PI * 2), vr: 0, hue: 0 }
    switch (this.scene) {
      case 'snow':
        m.size = rand(1, 3.2)
        m.vy = rand(18, 48) * (m.size / 2)
        m.vx = rand(-8, 8)
        if (!initial) m.y = -10
        break
      case 'rain':
        m.size = rand(10, 22)
        m.vy = rand(520, 820)
        m.vx = -m.vy * 0.18
        if (!initial) {
          m.y = -30
          m.x = rand(0, W * 1.2)
        }
        break
      case 'embers':
        m.size = rand(1, 2.6)
        m.vy = -rand(20, 55)
        m.vx = rand(-10, 10)
        m.life = rand(5, 11)
        m.hue = rand(14, 42)
        if (!initial) m.y = H + 10
        break
      case 'fireflies':
        m.size = rand(1.5, 3)
        m.vx = rand(-14, 14)
        m.vy = rand(-10, 10)
        m.hue = rand(62, 92)
        break
      case 'petals':
        m.size = rand(4, 7)
        m.vy = rand(24, 50)
        m.vx = rand(10, 36)
        m.vr = rand(-1.5, 1.5)
        m.hue = rand(330, 355)
        if (!initial) {
          m.y = -12
          m.x = rand(-W * 0.2, W)
        }
        break
      case 'stars':
        m.size = rand(0.5, 1.8)
        break
    }
    return m
  }

  private fill() {
    const t = this.target()
    while (this.motes.length < t) this.motes.push(this.spawn(true))
    if (this.motes.length > t) this.motes.length = t
  }

  private startLoop() {
    if (this.raf) return
    this.last = performance.now()
    this.raf = requestAnimationFrame(this.tick)
  }

  private stopLoop() {
    if (this.raf) cancelAnimationFrame(this.raf)
    this.raf = 0
  }

  private tick = (now: number) => {
    const g = this.g
    if (!g || this.scene === 'off') {
      this.raf = 0
      return
    }
    if (now - this.last < this.minFrameMs) {
      this.raf = requestAnimationFrame(this.tick)
      return
    }
    const dt = Math.min(0.05, Math.max(0, (now - this.last) / 1000))
    this.last = Math.max(this.last, now)
    if (Math.abs(this.canvas.getBoundingClientRect().width - this.w) > 1) {
      this.resize()
      this.fill()
    }
    g.clearRect(0, 0, this.w, this.h)

    const W = this.w
    const H = this.h
    for (let i = 0; i < this.motes.length; i++) {
      const m = this.motes[i]
      m.age += dt
      m.phase += dt
      m.rot += m.vr * dt
      let dead = m.age > m.life

      switch (this.scene) {
        case 'snow':
          m.x += (m.vx + Math.sin(m.phase * 0.9) * 12) * dt
          m.y += m.vy * dt
          dead ||= m.y > H + 10
          g.globalAlpha = 0.85
          g.fillStyle = '#fff'
          g.beginPath()
          g.arc(m.x, m.y, m.size, 0, Math.PI * 2)
          g.fill()
          break
        case 'rain':
          m.x += m.vx * dt
          m.y += m.vy * dt
          dead ||= m.y > H + 30
          g.globalAlpha = 0.45
          g.strokeStyle = '#aecbff'
          g.lineWidth = 1
          g.beginPath()
          g.moveTo(m.x, m.y)
          g.lineTo(m.x - m.vx * 0.03, m.y - m.size)
          g.stroke()
          break
        case 'embers': {
          m.x += (m.vx + Math.sin(m.phase * 2) * 10) * dt
          m.y += m.vy * dt
          dead ||= m.y < -10
          const flicker = 0.5 + 0.5 * Math.sin(m.phase * 9 + m.hue)
          const fade = Math.min(1, m.age / 1.5) * (1 - Math.max(0, (m.age - m.life + 2) / 2))
          g.globalCompositeOperation = 'lighter'
          g.globalAlpha = Math.max(0, fade) * (0.5 + flicker * 0.5)
          g.fillStyle = `hsl(${m.hue}, 100%, 60%)`
          g.beginPath()
          g.arc(m.x, m.y, m.size * (1 + flicker * 0.4), 0, Math.PI * 2)
          g.fill()
          g.globalCompositeOperation = 'source-over'
          break
        }
        case 'fireflies': {
          m.vx += rand(-20, 20) * dt
          m.vy += rand(-20, 20) * dt
          m.vx = Math.max(-18, Math.min(18, m.vx))
          m.vy = Math.max(-18, Math.min(18, m.vy))
          m.x = (m.x + m.vx * dt + W) % W
          m.y = (m.y + m.vy * dt + H) % H
          const pulse = Math.max(0, Math.sin(m.phase * 1.3 + m.hue))
          const r = m.size * 4
          const grad = g.createRadialGradient(m.x, m.y, 0, m.x, m.y, r)
          grad.addColorStop(0, `hsla(${m.hue}, 100%, 70%, ${0.9 * pulse})`)
          grad.addColorStop(1, `hsla(${m.hue}, 100%, 50%, 0)`)
          g.globalCompositeOperation = 'lighter'
          g.globalAlpha = 1
          g.fillStyle = grad
          g.beginPath()
          g.arc(m.x, m.y, r, 0, Math.PI * 2)
          g.fill()
          g.globalCompositeOperation = 'source-over'
          break
        }
        case 'petals':
          m.x += (m.vx + Math.sin(m.phase * 1.4) * 18) * dt
          m.y += m.vy * dt
          dead ||= m.y > H + 12 || m.x > W + 20
          g.globalAlpha = 0.8
          g.fillStyle = `hsl(${m.hue}, 80%, 82%)`
          g.save()
          g.translate(m.x, m.y)
          g.rotate(m.rot)
          g.scale(1, 0.55 + 0.45 * Math.cos(m.phase * 2))
          g.beginPath()
          g.ellipse(0, 0, m.size, m.size * 0.6, 0, 0, Math.PI * 2)
          g.fill()
          g.restore()
          break
        case 'stars':
          g.globalAlpha = 0.25 + 0.6 * (0.5 + 0.5 * Math.sin(m.phase * (0.6 + m.size)))
          g.fillStyle = '#fff'
          g.beginPath()
          g.arc(m.x, m.y, m.size, 0, Math.PI * 2)
          g.fill()
          break
      }
      if (dead) this.motes[i] = this.spawn(false)
    }

    if (this.scene === 'stars') this.drawShootingStar(g, dt)

    g.globalAlpha = 1
    this.raf = requestAnimationFrame(this.tick)
  }

  private drawShootingStar(g: CanvasRenderingContext2D, dt: number) {
    if (!this.shooting && Math.random() < dt * 0.06) {
      this.shooting = { x: rand(this.w * 0.2, this.w), y: rand(0, this.h * 0.4), vx: -rand(500, 800), vy: rand(160, 280), age: 0 }
    }
    const s = this.shooting
    if (!s) return
    s.age += dt
    s.x += s.vx * dt
    s.y += s.vy * dt
    const alpha = Math.max(0, 1 - s.age / 0.9)
    const grad = g.createLinearGradient(s.x, s.y, s.x - s.vx * 0.12, s.y - s.vy * 0.12)
    grad.addColorStop(0, `rgba(255,255,255,${alpha})`)
    grad.addColorStop(1, 'rgba(255,255,255,0)')
    g.globalAlpha = 1
    g.strokeStyle = grad
    g.lineWidth = 1.6
    g.beginPath()
    g.moveTo(s.x, s.y)
    g.lineTo(s.x - s.vx * 0.12, s.y - s.vy * 0.12)
    g.stroke()
    if (alpha <= 0) this.shooting = null
  }

  destroy() {
    this.stopLoop()
    document.removeEventListener('visibilitychange', this.onVisibility)
    this.motes = []
  }
}

/** Words that map to a scene when found in an activated lorebook entry. */
const SCENE_WORDS: Array<[Exclude<Scene, 'off'>, RegExp]> = [
  ['snow', /\b(snow|snowing|blizzard|winter|frost)\b/i],
  ['rain', /\b(rain|raining|storm|downpour|drizzle|monsoon)\b/i],
  ['embers', /\b(campfire|bonfire|embers?|forge|burning|inferno|volcan\w*)\b/i],
  ['fireflies', /\b(fireflies|firefly|summer night|meadow at night|glowing forest)\b/i],
  ['petals', /\b(sakura|cherry blossoms?|petals?|blossom\w*|spring garden)\b/i],
  ['stars', /\b(starry|stargazing|night sky|space|galaxy|cosmos|observatory)\b/i],
]

/**
 * Pick a scene from activated lorebook entries. Explicit tags win
 * (`flair:snow`, `weather:rain`, `scene:off` in the entry's keys or comment);
 * otherwise loose keyword matching on the entry comment/title.
 */
export function sceneFromEntries(entries: Array<{ comment?: string; keys?: string[] }>): Scene | null {
  for (const e of entries) {
    const hay = [e.comment ?? '', ...(e.keys ?? [])].join(' ')
    const tag = hay.match(/\b(?:flair|weather|scene):(off|snow|rain|embers|fireflies|petals|stars)\b/i)
    if (tag) return tag[1].toLowerCase() as Scene
  }
  for (const e of entries) {
    const hay = [e.comment ?? '', ...(e.keys ?? [])].join(' ')
    for (const [scene, re] of SCENE_WORDS) if (re.test(hay)) return scene
  }
  return null
}
