/**
 * Character intro (v1.4). Opening a chat plays a short name card in the character's aura colour. In a group
 * chat a small chip names whoever is speaking, in their own colour.
 *
 * Both are plain DOM that animate only `transform` and `opacity` (phones: docs/DEVELOPMENT.md → Phones), live
 * inside Flair's own overlay (pointer-events: none) and remove themselves when they are done.
 */

/** How long the name card stays, fade in and out included. */
export const INTRO_MS = 2300
/** A tap or key press this soon after the card appears doesn't dismiss it. */
const GRACE_MS = 500

export const INTRO_CSS = `
.lf-intro, .lf-intro *, .lf-spk, .lf-spk * { margin: 0; padding: 0; box-sizing: border-box; text-align: center; line-height: 1.2; }
.lf-intro { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; opacity: 0; pointer-events: none;
  animation: lf-intro-life var(--lf-intro-ms, 2300ms) ease both; }
.lf-intro-veil { position: absolute; inset: 0; background: radial-gradient(ellipse at 50% 46%, rgba(6,6,12,.68), rgba(6,6,12,.34) 55%, rgba(6,6,12,0) 84%); }
.lf-intro-card { position: relative; display: flex; flex-direction: column; align-items: center; gap: 10px; max-width: min(86vw, 640px);
  animation: lf-intro-rise var(--lf-intro-ms, 2300ms) cubic-bezier(.2,.7,.2,1) both; }
.lf-intro-av { width: 84px; height: 84px; border-radius: 50%; object-fit: cover; margin-bottom: 4px;
  border: 2px solid var(--lf-intro-c); box-shadow: 0 0 34px color-mix(in srgb, var(--lf-intro-c) 70%, transparent); }
.lf-intro-kicker { font-size: 12px; letter-spacing: .28em; text-transform: uppercase; color: rgba(255,255,255,.78); text-shadow: 0 1px 6px rgba(0,0,0,.8); }
.lf-intro-name { font-size: clamp(30px, 8vw, 56px); font-weight: 700; letter-spacing: .02em; color: var(--lf-intro-c); overflow-wrap: anywhere;
  text-shadow: 0 0 28px color-mix(in srgb, var(--lf-intro-c) 75%, transparent), 0 2px 12px rgba(0,0,0,.55); }
.lf-intro-rule { width: min(70vw, 260px); height: 2px; border-radius: 2px; transform-origin: center;
  background: linear-gradient(90deg, transparent, var(--lf-intro-c), transparent); animation: lf-intro-rule var(--lf-intro-ms, 2300ms) ease both; }
.lf-intro[data-motion="0"] .lf-intro-card, .lf-intro[data-motion="0"] .lf-intro-rule { animation: none; }
@keyframes lf-intro-life { 0% { opacity: 0 } 18% { opacity: 1 } 78% { opacity: 1 } 100% { opacity: 0 } }
@keyframes lf-intro-rise { 0% { transform: translateY(10px) scale(.95) } 22% { transform: none } 100% { transform: translateY(-4px) scale(1.02) } }
@keyframes lf-intro-rule { 0%, 12% { transform: scaleX(0) } 38%, 100% { transform: scaleX(1) } }
@media (pointer: coarse) { .lf-intro-veil { background: rgba(6,6,12,.62); } .lf-intro-av { width: 72px; height: 72px; } }

/* Group chats: who is speaking */
.lf-spk { position: absolute; left: 50%; bottom: 120px; width: 0; display: flex; justify-content: center; pointer-events: none; }
.lf-spk-in { flex: none; display: flex; align-items: center; gap: 9px; padding: 7px 14px 7px 11px; border-radius: 999px; white-space: nowrap;
  font-size: 13px; font-weight: 600; color: #fff; background: rgba(12,12,20,.82);
  border: 1px solid color-mix(in srgb, var(--lf-spk-c) 60%, transparent); box-shadow: 0 0 22px color-mix(in srgb, var(--lf-spk-c) 38%, transparent);
  animation: lf-spk-pop .3s cubic-bezier(.2,.7,.2,1) both; }
.lf-spk-dot { width: 10px; height: 10px; border-radius: 50%; flex: none; background: var(--lf-spk-c); box-shadow: 0 0 10px var(--lf-spk-c); }
.lf-spk-name { max-width: min(60vw, 260px); overflow: hidden; text-overflow: ellipsis; }
.lf-spk-n { font-weight: 500; font-size: 11px; color: rgba(255,255,255,.6); font-variant-numeric: tabular-nums; }
.lf-spk[data-motion="0"] .lf-spk-in { animation: none; }
@keyframes lf-spk-pop { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: none } }
`

function hslToHex(h: number, s: number, l: number): string {
  const k = (n: number) => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  return '#' + [f(0), f(8), f(4)].map((v) => Math.round(v * 255).toString(16).padStart(2, '0')).join('')
}

/** A steady colour for a name, for speakers whose avatar has no colour to take. */
export function hashColor(seed: string): string {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return hslToHex((h >>> 0) % 360, 0.72, 0.64)
}

const SAFE_SRC = /^(https?:|data:image\/|blob:|\/)/i

export interface IntroOptions {
  name: string
  /** #rrggbb */
  color: string
  avatar: string | null
  kicker: string
  /** False: no movement, just a fade (reduced motion). */
  motion: boolean
  /** The chat area on screen, so the card sits in the middle of the chat and not of the window (which may have a side panel open). */
  area?: { left: number; top: number; width: number; height: number } | null
}

export class IntroCard {
  private el: HTMLElement | null = null
  private timer: ReturnType<typeof setTimeout> | undefined
  private stopInput: (() => void) | null = null

  constructor(private root: HTMLElement) {}

  get showing() {
    return !!this.el
  }

  show(o: IntroOptions) {
    this.hide(true)
    const el = document.createElement('div')
    el.className = 'lf-intro'
    el.dataset.motion = o.motion ? '1' : '0'
    el.style.setProperty('--lf-intro-c', o.color)
    el.style.setProperty('--lf-intro-ms', `${INTRO_MS}ms`)
    const a = o.area
    if (a && a.width > 160 && a.height > 160) {
      el.style.right = el.style.bottom = 'auto'
      el.style.left = `${Math.round(a.left)}px`
      el.style.top = `${Math.round(a.top)}px`
      el.style.width = `${Math.round(a.width)}px`
      el.style.height = `${Math.round(a.height)}px`
    }
    const veil = document.createElement('div')
    veil.className = 'lf-intro-veil'
    const card = document.createElement('div')
    card.className = 'lf-intro-card'
    if (o.avatar && SAFE_SRC.test(o.avatar)) {
      const av = document.createElement('img')
      av.className = 'lf-intro-av'
      av.alt = ''
      av.decoding = 'async'
      av.src = o.avatar
      av.addEventListener('error', () => av.remove())
      card.appendChild(av)
    }
    const kicker = document.createElement('div')
    kicker.className = 'lf-intro-kicker'
    kicker.textContent = o.kicker
    const name = document.createElement('div')
    name.className = 'lf-intro-name'
    name.textContent = o.name
    const rule = document.createElement('div')
    rule.className = 'lf-intro-rule'
    card.append(kicker, name, rule)
    el.append(veil, card)
    this.root.appendChild(el)
    this.el = el
    this.timer = setTimeout(() => this.hide(true), INTRO_MS + 120)

    // Any tap or key press (after a short grace) sends it away early. The listeners only watch; they never block the tap.
    const shownAt = performance.now()
    const early = () => {
      if (performance.now() - shownAt > GRACE_MS) this.hide(false)
    }
    document.addEventListener('pointerdown', early, { capture: true, passive: true })
    document.addEventListener('keydown', early, { capture: true, passive: true })
    this.stopInput = () => {
      document.removeEventListener('pointerdown', early, { capture: true })
      document.removeEventListener('keydown', early, { capture: true })
    }
  }

  /** Take the card away: at once, or with a short fade from wherever it is. */
  hide(instant: boolean) {
    const el = this.el
    this.stopInput?.()
    this.stopInput = null
    if (this.timer) clearTimeout(this.timer)
    this.timer = undefined
    if (!el) return
    this.el = null
    if (instant) {
      el.remove()
      return
    }
    const now = getComputedStyle(el).opacity
    el.style.animation = 'none'
    el.style.opacity = now
    void el.offsetWidth
    el.style.transition = 'opacity .25s ease'
    el.style.opacity = '0'
    setTimeout(() => el.remove(), 300)
  }

  destroy() {
    this.hide(true)
  }
}

export interface SpeakerOptions {
  name: string
  color: string
  /** 1-based turn in this round, and how many turns the round has (0: not known). */
  turn: number
  total: number
  motion: boolean
  /** Where it sits: the middle of the chat column, just above the composer. */
  x: number
  bottom: number
}

export class SpeakerChip {
  private el: HTMLElement | null = null
  private fading: HTMLElement | null = null
  private fade: ReturnType<typeof setTimeout> | undefined

  constructor(private root: HTMLElement) {}

  get showing() {
    return !!this.el
  }

  show(o: SpeakerOptions) {
    this.hide(true)
    const wrap = document.createElement('div')
    wrap.className = 'lf-spk'
    wrap.dataset.motion = o.motion ? '1' : '0'
    wrap.style.left = `${Math.round(o.x)}px`
    wrap.style.bottom = `${Math.round(o.bottom)}px`
    wrap.style.setProperty('--lf-spk-c', o.color)
    const chip = document.createElement('div')
    chip.className = 'lf-spk-in'
    const dot = document.createElement('span')
    dot.className = 'lf-spk-dot'
    const name = document.createElement('span')
    name.className = 'lf-spk-name'
    name.textContent = o.name
    chip.append(dot, name)
    if (o.total > 1) {
      const n = document.createElement('span')
      n.className = 'lf-spk-n'
      n.textContent = `${Math.min(o.turn, o.total)}/${o.total}`
      chip.appendChild(n)
    }
    wrap.appendChild(chip)
    this.root.appendChild(wrap)
    this.el = wrap
    this.place(o.x, o.bottom)
  }

  /** Keep the middle of the chip at `x`, but never let it run off either side of the screen. */
  private fit(x: number) {
    const w = this.el?.firstElementChild?.getBoundingClientRect().width ?? 0
    const half = w / 2 + 8
    return Math.max(half, Math.min(window.innerWidth - half, x))
  }

  /** The speaker's colour turned out to be a different one than first guessed. */
  setColor(color: string) {
    this.el?.style.setProperty('--lf-spk-c', color)
  }

  /** Keep it level with the chat column (the composer may have moved). */
  place(x: number, bottom: number) {
    if (!this.el) return
    this.el.style.left = `${Math.round(this.fit(x))}px`
    this.el.style.bottom = `${Math.round(bottom)}px`
  }

  hide(instant: boolean) {
    if (this.fade) {
      // One that was still fading goes now.
      clearTimeout(this.fade)
      this.fade = undefined
      this.fading?.remove()
      this.fading = null
    }
    const el = this.el
    if (!el) return
    this.el = null
    if (instant) {
      el.remove()
      return
    }
    el.style.transition = 'opacity .3s ease'
    el.style.opacity = '0'
    this.fading = el
    this.fade = setTimeout(() => {
      el.remove()
      if (this.fading === el) this.fading = null
      this.fade = undefined
    }, 340)
  }

  destroy() {
    this.hide(true)
  }
}
