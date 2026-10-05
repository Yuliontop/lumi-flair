/**
 * Cinematic layer: light tint, light rays, vignette, film grain and lightning,
 * living in the same ChatView slot as the ambient scene (above the wallpaper,
 * below the messages). Everything is CSS on our own elements, driven by
 * data attributes, so it costs almost nothing when idle.
 *
 * Kept cheap for phones: nothing here uses a blend mode, a mask or a live filter (each of those makes
 * the browser render a whole screen-sized group offscreen on every frame), and the light rays are a small
 * image painted once instead of a screen-sized conic gradient that is masked and rotated.
 */
import type { Light } from './settings'

/**
 * Where the light rays go, as fractions of the chat area. This is the old CSS laid out by hand: a fan of beams
 * from a point above the top-left corner, faded out by an ellipse. Only the part that can ever be seen gets an
 * image (`box`; it overshoots the chat area a little so the sway never uncovers an edge).
 */
const RAYS = {
  box: { x: -0.06, y: -0.06, w: 0.9, h: 0.52 },
  from: { x: 0.052, y: -0.34 },
  fade: { x: 0.08, y: -0.2, rx: 0.686, ry: 0.588 },
  alpha: 0.1,
  /** The beams repeat every 16°: clear to 6°, ramp up to 7°, lit to 9°, ramp down to 10°, clear to 16°. Rotated by `turn`. */
  turn: 200,
} as const
/** The colours the old filters produced: warm white, and the dusk tone from sepia / saturate / hue-rotate. */
const RAY_DAY: readonly [number, number, number] = [255, 236, 200]
const RAY_DUSK: readonly [number, number, number] = [255, 245, 167]
/** Lights that show rays. */
const RAY_LIGHTS: ReadonlySet<Light> = new Set<Light>(['dawn', 'day', 'dusk'])

/** The rays for a chat area of `w` × `h` px as a PNG data URL (painted at low resolution: they are soft). */
export function raysImage(w: number, h: number, rgb: readonly [number, number, number]): string {
  const k = Math.min(0.5, 320 / (w * RAYS.box.w))
  const bw = Math.max(8, Math.round(w * RAYS.box.w * k))
  const bh = Math.max(8, Math.round(h * RAYS.box.h * k))
  const c = document.createElement('canvas')
  c.width = bw
  c.height = bh
  const g = c.getContext('2d')
  if (!g) return ''
  const img = g.createImageData(bw, bh)
  const d = img.data
  const sx = RAYS.from.x * w
  const sy = RAYS.from.y * h
  const mx = RAYS.fade.x * w
  const my = RAYS.fade.y * h
  const rx = RAYS.fade.rx * w
  const ry = RAYS.fade.ry * h
  for (let j = 0; j < bh; j++) {
    const y = (RAYS.box.y + ((j + 0.5) / bh) * RAYS.box.h) * h
    const ny = (y - my) / ry
    for (let i = 0; i < bw; i++) {
      const x = (RAYS.box.x + ((i + 0.5) / bw) * RAYS.box.w) * w
      const nx = (x - mx) / rx
      const fade = 1 - Math.sqrt(nx * nx + ny * ny)
      if (fade <= 0) continue
      // CSS conic angle: 0° is straight up, clockwise.
      let a = (Math.atan2(x - sx, sy - y) * 180) / Math.PI - RAYS.turn
      a = (((a % 360) + 360) % 360) % 16 // CSS wraps the angle at 360° first, then repeats the 16° pattern
      const beam = a < 6 ? 0 : a < 7 ? a - 6 : a < 9 ? 1 : a < 10 ? 10 - a : 0
      if (beam <= 0) continue
      const p = (j * bw + i) * 4
      d[p] = rgb[0]
      d[p + 1] = rgb[1]
      d[p + 2] = rgb[2]
      d[p + 3] = Math.round(255 * RAYS.alpha * beam * fade)
    }
  }
  g.putImageData(img, 0, 0)
  return c.toDataURL('image/png')
}

const pct = (v: number) => `${+(v * 100).toFixed(3)}%`
// The sway turns the rays about the middle of the chat area, which sits at this spot inside the rays' own box.
const RAYS_ORIGIN = `${pct((0.5 - RAYS.box.x) / RAYS.box.w)} ${pct((0.5 - RAYS.box.y) / RAYS.box.h)}`

export const CINEMATIC_CSS = `
.lf-cine { position: absolute; inset: 0; z-index: 2; pointer-events: none; overflow: hidden; }
.lf-cine > div { position: absolute; inset: 0; pointer-events: none; }
.lf-cine .lf-tint { opacity: 0; transition: opacity 2.4s ease, background 2.4s ease; }
.lf-cine .lf-rays { opacity: 0; transition: opacity 3s ease; inset: ${pct(RAYS.box.y)} auto auto ${pct(RAYS.box.x)}; width: ${pct(RAYS.box.w)}; height: ${pct(RAYS.box.h)};
  background: center / 100% 100% no-repeat; transform-origin: ${RAYS_ORIGIN}; }
.lf-cine .lf-vignette { background: radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,calc(var(--lf-vignette, .35) * 1.6)) 100%); transition: background 2s ease; }
.lf-cine .lf-grain { opacity: 0; transition: opacity 1s ease; background-size: 160px 160px; mix-blend-mode: overlay; inset: -80px; }
.lf-cine .lf-flash { opacity: 0; background: radial-gradient(ellipse at 60% 10%, rgba(220,230,255,.9), rgba(180,200,255,.35) 45%, transparent 75%); }
.lf-cine[data-grain="1"] .lf-grain { opacity: .07; animation: lf-grain .6s steps(4) infinite; }

.lf-cine[data-light="dawn"]   .lf-tint { opacity: 1; background: radial-gradient(ellipse at 15% 0%, rgba(255,170,120,.55), transparent 65%), linear-gradient(180deg, rgba(255,190,150,.18), transparent 60%); }
.lf-cine[data-light="day"]    .lf-tint { opacity: 1; background: linear-gradient(180deg, rgba(255,250,235,.16), transparent 55%); }
.lf-cine[data-light="dusk"]   .lf-tint { opacity: 1; background: linear-gradient(180deg, rgba(255,140,70,.35), rgba(170,70,140,.22) 55%, rgba(40,30,90,.25)); }
.lf-cine[data-light="night"]  .lf-tint { opacity: 1; background: radial-gradient(ellipse at 80% 0%, rgba(140,170,255,.25), transparent 55%), linear-gradient(180deg, rgba(10,20,60,.45), rgba(5,8,25,.35)); }
.lf-cine[data-light="candle"] .lf-tint { opacity: 1; background: radial-gradient(ellipse at 50% 110%, rgba(255,150,60,.55), rgba(255,110,40,.15) 50%, transparent 75%); animation: lf-candle 3.2s var(--lf-flicker-ease, ease-in-out) infinite; }
.lf-cine[data-light="storm"]  .lf-tint { opacity: 1; background: linear-gradient(180deg, rgba(40,55,80,.55), rgba(20,25,40,.45)); }
/* Neon drifts between two colourings by cross-fading two layers (a hue-rotate filter animation would be redrawn every frame). */
.lf-cine[data-light="neon"]   .lf-tint { opacity: 1; }
.lf-cine[data-light="neon"]   .lf-tint::before, .lf-cine[data-light="neon"] .lf-tint::after { content: ''; position: absolute; inset: 0; }
.lf-cine[data-light="neon"]   .lf-tint::before { background: radial-gradient(ellipse at 0% 50%, rgba(255,40,200,.35), transparent 55%), radial-gradient(ellipse at 100% 50%, rgba(0,220,255,.35), transparent 55%); animation: lf-neon-out 6s var(--lf-drift-ease, ease-in-out) infinite alternate; }
.lf-cine[data-light="neon"]   .lf-tint::after { opacity: 0; background: radial-gradient(ellipse at 0% 50%, rgba(255,44,75,.35), transparent 55%), radial-gradient(ellipse at 100% 50%, rgba(92,183,255,.35), transparent 55%); animation: lf-neon-in 6s var(--lf-drift-ease, ease-in-out) infinite alternate; }
/* The sway only runs while the rays are showing: an animation on an invisible layer still keeps the browser drawing frames. */
.lf-cine[data-light="dawn"] .lf-rays, .lf-cine[data-light="dusk"] .lf-rays, .lf-cine[data-light="day"] .lf-rays {
  opacity: 1; will-change: transform; animation: lf-rays-sway 18s var(--lf-sway-ease, ease-in-out) infinite alternate; }
.lf-cine[data-light="night"] .lf-vignette, .lf-cine[data-light="storm"] .lf-vignette {
  background: radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,calc(var(--lf-vignette, .35) * 2.1)) 100%); }

.lf-cine[data-saver="1"] .lf-rays, .lf-cine[data-saver="1"] .lf-grain { display: none; }
.lf-cine.lf-flashing .lf-flash { animation: lf-lightning 1.1s ease-out; }
.lf-cine.lf-flashing.lf-soft .lf-flash { animation: lf-lightning-soft 2.4s ease-in-out; }

@keyframes lf-rays-sway { from { transform: rotate(-2deg); } to { transform: rotate(3deg); } }
@keyframes lf-grain { 0% { transform: translate(0, 0); } 25% { transform: translate(-40px, 20px); } 50% { transform: translate(30px, -50px); } 75% { transform: translate(-60px, -10px); } 100% { transform: translate(0, 0); } }
@keyframes lf-candle { 0%, 100% { opacity: 1; } 30% { opacity: .82; } 55% { opacity: .95; } 70% { opacity: .78; } }
@keyframes lf-neon-out { to { opacity: 0; } }
@keyframes lf-neon-in { to { opacity: 1; } }
@keyframes lf-lightning { 0% { opacity: 0; } 4% { opacity: .9; } 9% { opacity: .1; } 14% { opacity: .7; } 40% { opacity: .15; } 100% { opacity: 0; } }
@keyframes lf-lightning-soft { 0% { opacity: 0; } 35% { opacity: .22; } 100% { opacity: 0; } }
@keyframes lf-camshake {
  0%, 100% { transform: translate(0, 0); }
  15% { transform: translate(-3px, 2px) rotate(-.25deg); }
  30% { transform: translate(3px, -2px) rotate(.25deg); }
  45% { transform: translate(-2px, -1px); }
  60% { transform: translate(2px, 1px); }
  80% { transform: translate(-1px, 1px); }
}

/* On a touch screen the slow movements (the rays' sway, neon's drift, the candle's flicker) are taken in small steps
   instead of every frame: each change makes the browser redraw whatever blurs the background behind the messages,
   which is where the cost is on a phone. The steps are far finer than the eye can tell apart. */
@media (pointer: coarse) {
  .lf-cine { --lf-sway-ease: steps(60, end); --lf-drift-ease: steps(30, end); --lf-flicker-ease: steps(6, end); }
}

@media (prefers-reduced-motion: reduce) {
  .lf-cine .lf-rays, .lf-cine .lf-grain, .lf-cine .lf-tint, .lf-cine .lf-tint::before, .lf-cine .lf-tint::after { animation: none !important; }
}
`

let grainUrl: string | null = null
function grainTile(): string {
  if (grainUrl) return grainUrl
  const c = document.createElement('canvas')
  c.width = c.height = 160
  const g = c.getContext('2d')
  if (!g) return ''
  const img = g.createImageData(160, 160)
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.random() * 255
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v
    img.data[i + 3] = 255
  }
  g.putImageData(img, 0, 0)
  grainUrl = c.toDataURL('image/png')
  return grainUrl
}

export interface CinematicState {
  enabled: boolean
  light: Light
  vignette: number
  grain: boolean
  lightning: boolean
  noFlash: boolean
  motion: boolean
  /** Battery saver: the rays and grain are hidden. */
  saver: boolean
}

export class Cinematic {
  readonly el: HTMLElement
  private flashEl: HTMLElement
  private raysEl: HTMLElement
  /** What the rays image was painted for: the chat area's size, and whether it is the dusk colour. */
  private raysFor = { w: 0, h: 0, dusk: false }
  private watch: ResizeObserver | null = null
  private lightningTimer: ReturnType<typeof setTimeout> | null = null
  private st: CinematicState = { enabled: false, light: 'none', vignette: 0.35, grain: false, lightning: true, noFlash: false, motion: true, saver: false }
  onThunder: (() => void) | null = null

  constructor(make: <K extends keyof HTMLElementTagNameMap>(tag: K) => HTMLElementTagNameMap[K]) {
    this.el = make('div')
    this.el.className = 'lf-cine'
    const layer = (cls: string) => {
      const d = make('div')
      d.className = cls
      this.el.appendChild(d)
      return d
    }
    layer('lf-tint')
    this.raysEl = layer('lf-rays')
    layer('lf-vignette')
    const grain = layer('lf-grain')
    grain.style.backgroundImage = `url("${grainTile()}")`
    this.flashEl = layer('lf-flash')
    this.flashEl.addEventListener('animationend', () => this.el.classList.remove('lf-flashing'))
    // The rays are painted for the chat area's shape, so repaint them when it changes (rotating a phone, resizing a window).
    if (typeof ResizeObserver !== 'undefined') {
      this.watch = new ResizeObserver(() => this.paintRays())
      this.watch.observe(this.el)
    }
  }

  set(next: CinematicState) {
    this.st = next
    const on = next.enabled
    this.el.style.display = on ? '' : 'none'
    this.el.dataset.light = on ? next.light : 'none'
    this.el.dataset.grain = on && next.grain ? '1' : '0'
    this.el.dataset.saver = next.saver ? '1' : '0'
    this.el.style.setProperty('--lf-vignette', String(on ? next.vignette : 0))
    this.paintRays()
    this.scheduleLightning()
  }

  /** True while the light, or the grain, moves every frame (the frame-rate governor only needs to watch then). */
  get animating(): boolean {
    const s = this.st
    return s.enabled && s.motion && (s.light === 'candle' || s.light === 'neon' || RAY_LIGHTS.has(s.light) || s.grain)
  }

  /** Paint the rays image when they are about to show, and again when the chat area changes shape. */
  private paintRays() {
    const s = this.st
    if (!s.enabled || s.saver || !RAY_LIGHTS.has(s.light)) return
    const w = this.el.clientWidth
    const h = this.el.clientHeight
    if (w < 60 || h < 60) return
    const dusk = s.light === 'dusk'
    const f = this.raysFor
    if (this.raysEl.style.backgroundImage && dusk === f.dusk && Math.abs(w - f.w) < f.w * 0.04 && Math.abs(h - f.h) < f.h * 0.04) return
    this.raysFor = { w, h, dusk }
    this.raysEl.style.backgroundImage = `url("${raysImage(w, h, dusk ? RAY_DUSK : RAY_DAY)}")`
  }

  private scheduleLightning() {
    if (this.lightningTimer) clearTimeout(this.lightningTimer)
    this.lightningTimer = null
    const s = this.st
    if (!s.enabled || s.light !== 'storm' || !s.lightning || !s.motion) return
    this.lightningTimer = setTimeout(() => {
      if (!document.hidden) this.flash()
      this.scheduleLightning()
    }, 7000 + Math.random() * 14000)
  }

  /** One lightning strike (soft glow instead of a flash in no-flash mode). */
  flash() {
    this.el.classList.toggle('lf-soft', this.st.noFlash)
    this.el.classList.remove('lf-flashing')
    void this.el.offsetWidth // restart the animation
    this.el.classList.add('lf-flashing')
    this.onThunder?.()
  }

  destroy() {
    if (this.lightningTimer) clearTimeout(this.lightningTimer)
    this.watch?.disconnect()
    this.el.remove()
  }
}

/** Brief camera shake on the chat body (respects no-flash / reduced motion at call site). */
/**
 * The chat is pulled toward the black hole while it feeds, squeezed as it
 * implodes, then punched outward by the shockwave. Keyframes are generated
 * from the effect's timeline so the two always stay in sync.
 */
export function blackHoleWarpRule(
  originX: number,
  originY: number,
  T: { form: number; feedEnd: number; collapseEnd: number; detonate: number; total: number },
): string {
  const pct = (x: number) => `${Math.max(0, Math.min(100, (x / T.total) * 100)).toFixed(2)}%`
  const d = T.detonate
  return `@keyframes lf-bh-warp {
  0%, ${pct(T.form)} { transform: none; }
  ${pct(T.feedEnd)} { transform: scale(.975) rotate(-.5deg); }
  ${pct(T.collapseEnd)} { transform: scale(.958) rotate(-.9deg); }
  ${pct(d - 0.03)} { transform: scale(.95) rotate(-1deg); }
  ${pct(d + 0.08)} { transform: scale(1.035) rotate(.3deg); }
  ${pct(d + 0.22)} { transform: scale(.994) translate(-4px, 2px); }
  ${pct(d + 0.36)} { transform: scale(1.006) translate(3px, -2px); }
  ${pct(d + 0.55)} { transform: scale(1) translate(-1px, 1px); }
  100% { transform: none; }
}
:root [data-component="ChatView"] [data-lumiverse-surface="chat-body"] { transform-origin: ${originX.toFixed(1)}% ${originY.toFixed(1)}%; animation: lf-bh-warp ${Math.round(T.total * 1000)}ms linear; }`
}

export function cameraShakeRule(): string {
  return `:root [data-component="ChatView"] [data-lumiverse-surface="chat-body"] { animation: lf-camshake 420ms ease-out; }`
}
