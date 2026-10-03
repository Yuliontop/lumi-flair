/**
 * Cinematic layer: light tint, light rays, vignette, film grain and lightning,
 * living in the same ChatView slot as the ambient scene (above the wallpaper,
 * below the messages). Everything is CSS on our own elements, driven by
 * data attributes, so it costs almost nothing when idle.
 */
import type { Light } from './settings'

export const CINEMATIC_CSS = `
.lf-cine { position: absolute; inset: 0; z-index: 2; pointer-events: none; overflow: hidden; }
.lf-cine > div { position: absolute; inset: 0; pointer-events: none; }
.lf-cine .lf-tint { opacity: 0; transition: opacity 2.4s ease, background 2.4s ease; mix-blend-mode: screen; }
.lf-cine[data-light="night"] .lf-tint, .lf-cine[data-light="storm"] .lf-tint { mix-blend-mode: normal; }
.lf-cine .lf-rays { opacity: 0; transition: opacity 3s ease; inset: -20%;
  background: repeating-conic-gradient(from 200deg at 18% -10%, rgba(255,240,210,.0) 0deg 6deg, rgba(255,236,200,.10) 7deg 9deg, rgba(255,240,210,0) 10deg 16deg);
  -webkit-mask: radial-gradient(ellipse 70% 60% at 20% 0%, #000 0%, transparent 70%); mask: radial-gradient(ellipse 70% 60% at 20% 0%, #000 0%, transparent 70%);
  animation: lf-rays-sway 18s ease-in-out infinite alternate; }
.lf-cine .lf-vignette { background: radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,calc(var(--lf-vignette, .35) * 1.6)) 100%); transition: background 2s ease; }
.lf-cine .lf-grain { opacity: 0; transition: opacity 1s ease; background-size: 160px 160px; mix-blend-mode: overlay; animation: lf-grain .6s steps(4) infinite; }
.lf-cine .lf-flash { opacity: 0; background: radial-gradient(ellipse at 60% 10%, rgba(220,230,255,.9), rgba(180,200,255,.35) 45%, transparent 75%); }
.lf-cine[data-grain="1"] .lf-grain { opacity: .07; }

.lf-cine[data-light="dawn"]   .lf-tint { opacity: 1; background: radial-gradient(ellipse at 15% 0%, rgba(255,170,120,.55), transparent 65%), linear-gradient(180deg, rgba(255,190,150,.18), transparent 60%); }
.lf-cine[data-light="day"]    .lf-tint { opacity: 1; background: linear-gradient(180deg, rgba(255,250,235,.16), transparent 55%); }
.lf-cine[data-light="dusk"]   .lf-tint { opacity: 1; background: linear-gradient(180deg, rgba(255,140,70,.35), rgba(170,70,140,.22) 55%, rgba(40,30,90,.25)); }
.lf-cine[data-light="night"]  .lf-tint { opacity: 1; background: radial-gradient(ellipse at 80% 0%, rgba(140,170,255,.25), transparent 55%), linear-gradient(180deg, rgba(10,20,60,.45), rgba(5,8,25,.35)); }
.lf-cine[data-light="candle"] .lf-tint { opacity: 1; background: radial-gradient(ellipse at 50% 110%, rgba(255,150,60,.55), rgba(255,110,40,.15) 50%, transparent 75%); animation: lf-candle 3.2s ease-in-out infinite; }
.lf-cine[data-light="storm"]  .lf-tint { opacity: 1; background: linear-gradient(180deg, rgba(40,55,80,.55), rgba(20,25,40,.45)); }
.lf-cine[data-light="neon"]   .lf-tint { opacity: 1; background: radial-gradient(ellipse at 0% 50%, rgba(255,40,200,.35), transparent 55%), radial-gradient(ellipse at 100% 50%, rgba(0,220,255,.35), transparent 55%); animation: lf-neon 6s ease-in-out infinite alternate; }
.lf-cine[data-light="dawn"] .lf-rays, .lf-cine[data-light="dusk"] .lf-rays, .lf-cine[data-light="day"] .lf-rays { opacity: 1; }
.lf-cine[data-light="dusk"] .lf-rays { filter: sepia(1) saturate(3) hue-rotate(-20deg); }
.lf-cine[data-light="night"] .lf-vignette, .lf-cine[data-light="storm"] .lf-vignette {
  background: radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,calc(var(--lf-vignette, .35) * 2.1)) 100%); }

.lf-cine[data-saver="1"] .lf-rays, .lf-cine[data-saver="1"] .lf-grain { display: none; }
.lf-cine.lf-flashing .lf-flash { animation: lf-lightning 1.1s ease-out; }
.lf-cine.lf-flashing.lf-soft .lf-flash { animation: lf-lightning-soft 2.4s ease-in-out; }

@keyframes lf-rays-sway { from { transform: rotate(-2deg); } to { transform: rotate(3deg); } }
@keyframes lf-grain { 0% { background-position: 0 0; } 25% { background-position: -40px 20px; } 50% { background-position: 30px -50px; } 75% { background-position: -60px -10px; } 100% { background-position: 0 0; } }
@keyframes lf-candle { 0%, 100% { opacity: 1; } 30% { opacity: .82; } 55% { opacity: .95; } 70% { opacity: .78; } }
@keyframes lf-neon { from { filter: hue-rotate(0deg); } to { filter: hue-rotate(40deg); } }
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

@media (prefers-reduced-motion: reduce) {
  .lf-cine .lf-rays, .lf-cine .lf-grain, .lf-cine .lf-tint { animation: none !important; }
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
}

export class Cinematic {
  readonly el: HTMLElement
  private flashEl: HTMLElement
  private lightningTimer: ReturnType<typeof setTimeout> | null = null
  private st: CinematicState = { enabled: false, light: 'none', vignette: 0.35, grain: false, lightning: true, noFlash: false, motion: true }
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
    layer('lf-rays')
    layer('lf-vignette')
    const grain = layer('lf-grain')
    grain.style.backgroundImage = `url("${grainTile()}")`
    this.flashEl = layer('lf-flash')
    this.flashEl.addEventListener('animationend', () => this.el.classList.remove('lf-flashing'))
  }

  set(next: CinematicState) {
    this.st = next
    const on = next.enabled
    this.el.style.display = on ? '' : 'none'
    this.el.dataset.light = on ? next.light : 'none'
    this.el.dataset.grain = on && next.grain ? '1' : '0'
    this.el.style.setProperty('--lf-vignette', String(on ? next.vignette : 0))
    this.scheduleLightning()
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
    this.el.remove()
  }
}

/** Brief camera shake on the chat body (respects no-flash / reduced motion at call site). */
export function cameraShakeRule(): string {
  return `:root [data-component="ChatView"] [data-lumiverse-surface="chat-body"] { animation: lf-camshake 420ms ease-out; }`
}
