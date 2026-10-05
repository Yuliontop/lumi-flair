/**
 * Floating soundscape widget: a small draggable pill (Lumiverse float widget,
 * needs the `ui_panels` permission) with an on/off button, a volume slider and
 * what's playing. Drag it by the grip or the label; it remembers where it was left.
 *
 * It collapses to a single round button so it doesn't clutter the screen (on a phone that is how it starts):
 * tap the button to open the pill, the chevron at the pill's end to fold it away. The collapsed state is
 * remembered, and so is where each was left.
 */
import type { SpindleFrontendContext } from 'lumiverse-spindle-types'
import type { FlairSettings } from './settings'
import type { SoundscapeState } from './soundscape'
import { tr } from './i18n'

type FloatWidget = ReturnType<SpindleFrontendContext['ui']['createFloatWidget']>

export interface SoundWidgetView {
  state: SoundscapeState
  /** "scene|light" while playing, else "off" */
  key: string
  /** dimmed or muted because Lumiverse is in the background */
  backgrounded: 'dim' | 'mute' | null
  /** the chat view isn't on screen, so ambience is paused */
  offChat: boolean
  /** name of the user's "always play" file while it plays */
  custom: string | null
}

export interface SoundWidgetDeps {
  settings(): FlairSettings
  update(patch: Partial<FlairSettings>): void
  /** Live volume while dragging; the setting is saved on release. */
  preview(volume: number): void
  view(): SoundWidgetView
  sceneLabel(scene: string): string
  lightLabel(light: string): string
}

/** The pill (open) and the round button (collapsed), in px. */
const W = 288
const H = 52
const DOT = 44

const ICON_ON =
  '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H2v6h4l5 4z"/><path class="lf-sw-w1" d="M15.5 8.5a5 5 0 0 1 0 7"/><path class="lf-sw-w2" d="M19 5a10 10 0 0 1 0 14"/></svg>'
const ICON_OFF =
  '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H2v6h4l5 4z"/><path d="m22 9-6 6M16 9l6 6"/></svg>'
const GRIP =
  '<svg viewBox="0 0 8 20" width="8" height="20" fill="currentColor" aria-hidden="true"><circle cx="2" cy="4" r="1.3"/><circle cx="6" cy="4" r="1.3"/><circle cx="2" cy="10" r="1.3"/><circle cx="6" cy="10" r="1.3"/><circle cx="2" cy="16" r="1.3"/><circle cx="6" cy="16" r="1.3"/></svg>'
const FOLD =
  '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>'

export const SOUND_WIDGET_CSS = `
.lf-sw,.lf-sw *{box-sizing:border-box;margin:0;padding:0;text-align:left;line-height:normal;letter-spacing:normal;text-transform:none;text-indent:0;float:none}
.lf-sw{position:relative;width:${W}px;height:${H}px;display:flex;flex-direction:row;align-items:center;gap:8px;padding:0 14px 0 8px;
  border-radius:${H / 2}px;color:var(--lumiverse-text,#fff);
  background:linear-gradient(var(--lumiverse-bg-elevated,#1a1626),var(--lumiverse-bg-elevated,#1a1626)),var(--lumiverse-bg,#0f0c18);
  backdrop-filter:blur(14px) saturate(1.2);-webkit-backdrop-filter:blur(14px) saturate(1.2);
  border:1px solid var(--lumiverse-border,rgba(255,255,255,.12));box-shadow:0 6px 24px rgba(0,0,0,.28);
  font-family:var(--lumiverse-font-family,inherit);font-size:12px;user-select:none;-webkit-user-select:none;touch-action:none;cursor:grab;overflow:hidden}
.lf-sw:active{cursor:grabbing}
.lf-sw .lf-sw-grip{display:flex;align-items:center;justify-content:center;flex:none;width:10px;height:20px;color:var(--lumiverse-text-muted,#bbb);opacity:.7}
.lf-sw .lf-sw-grip svg{display:block;width:8px;height:20px;min-width:0}
.lf-sw .lf-sw-btn{flex:none;width:34px;height:34px;min-width:0;min-height:0;max-width:none;padding:0;border:0;border-radius:50%;
  display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:none;outline:none;font:inherit;
  background:var(--lumiverse-fill,rgba(255,255,255,.08));color:var(--lumiverse-text,#fff);transition:background .15s,color .15s,transform .1s}
.lf-sw .lf-sw-btn svg{display:block;flex:none;width:18px;height:18px;min-width:0}
.lf-sw .lf-sw-btn:hover{background:var(--lumiverse-fill-subtle,rgba(255,255,255,.12))}
.lf-sw .lf-sw-btn:active{transform:scale(.94)}
.lf-sw .lf-sw-btn:focus-visible,.lf-sw .lf-sw-slider:focus-visible{outline:2px solid var(--lumiverse-primary,#9370db);outline-offset:2px}
.lf-sw[data-on="1"] .lf-sw-btn{background:var(--lumiverse-primary,#9370db);color:var(--lumiverse-primary-contrast,#fff)}
.lf-sw[data-on="1"][data-state="playing"] .lf-sw-w1,.lf-sw[data-on="1"][data-state="playing"] .lf-sw-w2{animation:lf-sw-wave 1.6s ease-in-out infinite}
.lf-sw[data-on="1"][data-state="playing"] .lf-sw-w2{animation-delay:.2s}
@keyframes lf-sw-wave{0%,100%{opacity:1}50%{opacity:.35}}
@media (prefers-reduced-motion:reduce){.lf-sw .lf-sw-w1,.lf-sw .lf-sw-w2{animation:none!important}}
.lf-sw .lf-sw-mid{flex:1 1 auto;min-width:0;height:34px;display:flex;flex-direction:column;justify-content:center;align-items:stretch;gap:4px}
.lf-sw .lf-sw-label{display:block;height:14px;font-size:11px;line-height:14px;font-weight:500;color:var(--lumiverse-text-dim,#ccc);
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.lf-sw[data-on="0"] .lf-sw-label{color:var(--lumiverse-text-muted,#999)}
.lf-sw .lf-sw-slider{position:relative;display:block;height:14px;width:100%;cursor:pointer;touch-action:none;outline:none;border-radius:7px}
.lf-sw .lf-sw-track{position:absolute;left:0;right:0;top:5px;height:4px;border-radius:2px;background:var(--lumiverse-fill,rgba(255,255,255,.15));overflow:hidden}
.lf-sw .lf-sw-fill{position:absolute;left:0;top:0;bottom:0;width:calc(var(--v,50%) - 14px * var(--vf,0.5) + 7px);border-radius:2px;background:var(--lumiverse-primary,#9370db)}
.lf-sw .lf-sw-thumb{position:absolute;top:0;left:calc(var(--v,50%) - 14px * var(--vf,0.5));width:14px;height:14px;border-radius:50%;
  background:var(--lumiverse-text,#fff);border:2px solid var(--lumiverse-primary,#9370db);box-shadow:0 1px 3px rgba(0,0,0,.3);transition:transform .1s}
.lf-sw .lf-sw-slider:active .lf-sw-thumb{transform:scale(1.15)}
.lf-sw[data-on="0"] .lf-sw-slider{opacity:.55}
.lf-sw .lf-sw-pct{display:block;flex:none;width:36px;text-align:right;font-size:12px;line-height:16px;font-variant-numeric:tabular-nums;color:var(--lumiverse-text-dim,#ccc);white-space:nowrap}
.lf-sw .lf-sw-fold{flex:none;width:28px;height:28px;min-width:0;min-height:0;max-width:none;padding:0;border:0;border-radius:50%;display:flex;align-items:center;justify-content:center;
  cursor:pointer;box-shadow:none;outline:none;font:inherit;background:var(--lumiverse-fill,rgba(255,255,255,.08));color:var(--lumiverse-text-dim,#ccc);transition:background .15s}
.lf-sw .lf-sw-fold svg{display:block;flex:none;width:16px;height:16px;min-width:0}
.lf-sw[data-anchor="l"] .lf-sw-fold svg{transform:scaleX(-1)}
.lf-sw .lf-sw-fold:hover{background:var(--lumiverse-fill-subtle,rgba(255,255,255,.14))}
.lf-sw .lf-sw-fold:focus-visible,.lf-sw .lf-sw-dot:focus-visible{outline:2px solid var(--lumiverse-primary,#9370db);outline-offset:2px}
.lf-sw .lf-sw-dot{display:none}
.lf-sw[data-collapsed="1"]{width:${DOT}px;height:${DOT}px;padding:0;gap:0;border-radius:50%;justify-content:center;cursor:pointer}
.lf-sw[data-collapsed="1"] > :not(.lf-sw-dot){display:none}
.lf-sw[data-collapsed="1"] .lf-sw-dot{display:flex;flex:none;width:100%;height:100%;min-width:0;min-height:0;max-width:none;padding:0;border:0;border-radius:50%;
  align-items:center;justify-content:center;cursor:pointer;box-shadow:none;outline:none;font:inherit;background:transparent;color:var(--lumiverse-text-muted,#bbb)}
.lf-sw[data-collapsed="1"] .lf-sw-dot svg{display:block;flex:none;width:20px;height:20px;min-width:0}
.lf-sw[data-collapsed="1"][data-on="1"]{background:var(--lumiverse-primary,#9370db);border-color:transparent}
.lf-sw[data-collapsed="1"][data-on="1"] .lf-sw-dot{color:var(--lumiverse-primary-contrast,#fff)}
.lf-sw[data-collapsed="1"][data-on="1"][data-state="playing"] .lf-sw-w1,.lf-sw[data-collapsed="1"][data-on="1"][data-state="playing"] .lf-sw-w2{animation:lf-sw-wave 1.6s ease-in-out infinite}
.lf-sw[data-collapsed="1"][data-on="1"][data-state="playing"] .lf-sw-w2{animation-delay:.2s}
`

export class SoundWidget {
  private w: FloatWidget | null = null
  private el: HTMLElement | null = null
  private btn: HTMLButtonElement | null = null
  /** The round button the widget is reduced to when collapsed. */
  private dot: HTMLButtonElement | null = null
  private fold: HTMLButtonElement | null = null
  private collapsed = false
  private label: HTMLElement | null = null
  private range: HTMLElement | null = null
  /** Slider value, 0–100. */
  private value = 0
  private pct: HTMLElement | null = null
  private dragging = false
  private unDrag: (() => void) | null = null
  private onResize = () => this.keepOnScreen()

  constructor(private ctx: SpindleFrontendContext, private deps: SoundWidgetDeps) {}

  get shown() {
    return !!this.w
  }

  /** Create or remove the widget. Returns false if Lumiverse refused (permission missing). */
  sync(show: boolean): boolean {
    if (!show) {
      this.destroy()
      return true
    }
    if (!this.w) {
      try {
        this.create()
      } catch (err) {
        console.warn('[Lumi Flair] Floating sound widget unavailable', err)
        this.destroy()
        return false
      }
    }
    this.render()
    return true
  }

  /** The size of whichever shape it is in. */
  private dims() {
    return this.collapsed ? { w: DOT, h: DOT } : { w: W, h: H }
  }

  /** Collapsed when the user said so; otherwise a touch screen starts with just the button, a desktop with the pill. */
  private wantCollapsed(): boolean {
    const c = this.deps.settings().soundWidgetCollapsed
    if (typeof c === 'boolean') return c
    return typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches
  }

  private defaultPos() {
    // Top-right, clear of the header and the composer.
    const d = this.dims()
    return { x: Math.max(12, window.innerWidth - d.w - (this.collapsed ? 12 : 24)), y: 72 }
  }

  /** Which end of the screen the widget sits nearer, so the chevron points the way it folds. */
  private anchor(p: { x: number; y: number }, d = this.dims()): 'l' | 'r' {
    return p.x + d.w / 2 > window.innerWidth / 2 ? 'r' : 'l'
  }

  private create() {
    this.collapsed = this.wantCollapsed()
    const saved = this.deps.settings().soundWidgetPos
    const pos = this.clamp(saved ?? this.defaultPos())
    const d = this.dims()
    const w = this.ctx.ui.createFloatWidget({
      width: d.w,
      height: d.h,
      initialPosition: pos,
      snapToEdge: false,
      tooltip: tr('Ambience volume'),
      chromeless: true,
    })
    this.w = w

    const el = document.createElement('div')
    el.className = 'lf-sw'
    el.setAttribute('role', 'group')
    el.setAttribute('aria-label', tr('Ambience volume'))
    const grip = document.createElement('span')
    grip.className = 'lf-sw-grip'
    grip.innerHTML = GRIP
    grip.title = tr('Drag to move')

    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'lf-sw-btn'
    btn.addEventListener('click', () => {
      const s = this.deps.settings()
      // Turning it back on at 0% would be silent, so bring the volume back too.
      this.deps.update(s.soundscape ? { soundscape: false } : { soundscape: true, ...(s.soundscapeVolume < 0.02 ? { soundscapeVolume: 0.35 } : {}) })
    })

    const mid = document.createElement('div')
    mid.className = 'lf-sw-mid'
    const label = document.createElement('span')
    label.className = 'lf-sw-label'
    // A self-drawn slider: Lumiverse styles native range inputs globally, which broke the layout.
    const range = document.createElement('div')
    range.className = 'lf-sw-slider'
    range.tabIndex = 0
    range.setAttribute('role', 'slider')
    range.setAttribute('aria-label', tr('Ambience volume'))
    range.setAttribute('aria-valuemin', '0')
    range.setAttribute('aria-valuemax', '100')
    range.innerHTML = '<span class="lf-sw-track"><span class="lf-sw-fill"></span></span><span class="lf-sw-thumb"></span>'
    const fromPointer = (clientX: number) => {
      const r = range.getBoundingClientRect()
      return Math.max(0, Math.min(100, Math.round(((clientX - r.left) / Math.max(1, r.width)) * 100)))
    }
    range.addEventListener('pointerdown', (e) => {
      e.preventDefault()
      range.focus({ preventScroll: true })
      try {
        range.setPointerCapture(e.pointerId)
      } catch {
        /* ignore */
      }
      this.setValue(fromPointer(e.clientX), false)
    })
    range.addEventListener('pointermove', (e) => {
      if (range.hasPointerCapture?.(e.pointerId)) this.setValue(fromPointer(e.clientX), false)
    })
    const release = (e: PointerEvent) => {
      if (!this.dragging) return
      try {
        range.releasePointerCapture(e.pointerId)
      } catch {
        /* ignore */
      }
      this.setValue(this.value, true)
    }
    range.addEventListener('pointerup', release)
    range.addEventListener('pointercancel', release)
    range.addEventListener('keydown', (e) => {
      const step = { ArrowRight: 5, ArrowUp: 5, ArrowLeft: -5, ArrowDown: -5, PageUp: 10, PageDown: -10 }[e.key]
      const to = e.key === 'Home' ? 0 : e.key === 'End' ? 100 : step !== undefined ? this.value + step : null
      if (to === null) return
      e.preventDefault()
      this.setValue(Math.max(0, Math.min(100, to)), true)
    })
    range.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault()
        this.setValue(Math.max(0, Math.min(100, this.value + (e.deltaY < 0 ? 5 : -5))), true)
      },
      { passive: false },
    )
    mid.append(label, range)

    const pct = document.createElement('span')
    pct.className = 'lf-sw-pct'

    // Folds the pill away into the round button.
    const fold = document.createElement('button')
    fold.type = 'button'
    fold.className = 'lf-sw-fold'
    fold.innerHTML = FOLD
    fold.title = tr('Collapse')
    fold.setAttribute('aria-label', tr('Collapse'))
    fold.setAttribute('aria-expanded', 'true')
    fold.addEventListener('click', (e) => this.setCollapsed(true, e.detail === 0))

    // The collapsed widget: one round button that opens the pill. Unlike the pill's controls it may be dragged
    // (the host drags from a button and then swallows the click that follows a drag), so it isn't shielded below.
    const dot = document.createElement('button')
    dot.type = 'button'
    dot.className = 'lf-sw-dot'
    dot.title = tr('Show ambience volume')
    dot.setAttribute('aria-label', tr('Show ambience volume'))
    dot.setAttribute('aria-expanded', 'false')
    dot.addEventListener('click', (e) => this.setCollapsed(false, e.detail === 0))

    // The buttons and slider handle their own pointer gestures; don't let them drag the widget.
    for (const ctl of [btn, range, fold]) {
      for (const ev of ['pointerdown', 'mousedown', 'touchstart'] as const) ctl.addEventListener(ev, (e) => e.stopPropagation())
    }

    el.dataset.collapsed = this.collapsed ? '1' : '0'
    el.dataset.anchor = this.anchor(pos)
    el.append(grip, btn, mid, pct, fold, dot)
    w.root.appendChild(el)
    this.el = el
    this.dot = dot
    this.fold = fold
    this.btn = btn
    this.label = label
    this.range = range
    this.pct = pct

    this.unDrag = w.onDragEnd((p) => {
      const c = this.clamp(p)
      if (c.x !== p.x || c.y !== p.y) w.moveTo(c.x, c.y)
      el.dataset.anchor = this.anchor(c) // dragged to the other side of the screen: the chevron turns to point the way it folds
      this.deps.update({ soundWidgetPos: c })
    })
    window.addEventListener('resize', this.onResize)
  }

  /** Keep the whole widget inside the window (it may have been left on a bigger screen). */
  private clamp(p: { x: number; y: number }, d = this.dims()) {
    const maxX = Math.max(0, window.innerWidth - d.w - 4)
    const maxY = Math.max(0, window.innerHeight - d.h - 4)
    return { x: Math.round(Math.max(4, Math.min(maxX, p.x))), y: Math.round(Math.max(4, Math.min(maxY, p.y))) }
  }

  private keepOnScreen() {
    if (!this.w) return
    const p = this.w.getPosition()
    const c = this.clamp(p)
    if (c.x !== p.x || c.y !== p.y) this.w.moveTo(c.x, c.y)
    if (this.el) this.el.dataset.anchor = this.anchor(c)
  }

  /**
   * Fold the pill into the round button, or open it again. The end nearer the screen edge stays where it is and the
   * vertical middle too, so the button turns into the pill (and back) on the spot instead of jumping.
   */
  private setCollapsed(next: boolean, keyboard = false) {
    const { w, el } = this
    if (!w || !el || next === this.collapsed) return
    const from = this.dims()
    const p = w.getPosition()
    const side = this.anchor(p, from)
    this.collapsed = next
    const to = this.dims()
    const c = this.clamp({ x: side === 'r' ? p.x + from.w - to.w : p.x, y: p.y + from.h / 2 - to.h / 2 }, to)
    el.dataset.collapsed = next ? '1' : '0'
    el.dataset.anchor = side
    w.setSize(to.w, to.h)
    w.moveTo(c.x, c.y)
    this.deps.update({ soundWidgetCollapsed: next, soundWidgetPos: c })
    this.render()
    // From the keyboard, hand the focus to the control that took over, so it doesn't land on something now hidden.
    // (A tap or click needs none, and would only leave a focus ring behind.)
    if (keyboard) (next ? this.dot : this.fold)?.focus({ preventScroll: true })
  }

  /** Move the slider; `commit` saves the setting, otherwise the volume is only previewed. */
  private setValue(v: number, commit: boolean) {
    this.value = v
    this.paintRange(v / 100)
    const vol = v / 100
    const s = this.deps.settings()
    if (commit) {
      this.dragging = false
      // Pulling the slider up while it's off means "I want to hear it".
      this.deps.update(!s.soundscape && vol > 0 ? { soundscape: true, soundscapeVolume: vol } : { soundscapeVolume: vol })
      return
    }
    this.dragging = true
    if (!s.soundscape && vol > 0) this.deps.update({ soundscape: true, soundscapeVolume: vol })
    else this.deps.preview(vol)
  }

  private paintRange(v: number) {
    if (!this.range || !this.pct) return
    const pc = Math.round(v * 100)
    // The thumb travels inside the track: its centre goes from 7px to (width - 7px).
    this.range.style.setProperty('--v', `${pc}%`)
    this.range.style.setProperty('--vf', String(v))
    this.range.setAttribute('aria-valuenow', String(pc))
    this.range.setAttribute('aria-valuetext', `${pc}%`)
    this.pct.textContent = `${pc}%`
  }

  /** Refresh from settings + soundscape state. Cheap; call on every change. */
  render() {
    const { el, btn, label, range } = this
    if (!el || !btn || !label || !range) return
    const s = this.deps.settings()
    const v = this.deps.view()
    const on = s.soundscape
    el.dataset.on = on ? '1' : '0'
    el.dataset.state = v.state
    btn.innerHTML = on && s.soundscapeVolume > 0 ? ICON_ON : ICON_OFF
    if (this.dot) this.dot.innerHTML = btn.innerHTML
    btn.setAttribute('aria-pressed', String(on))
    btn.title = on ? tr('Turn ambience off') : tr('Turn ambience on')
    btn.setAttribute('aria-label', btn.title)
    if (!this.dragging) {
      this.value = Math.round(s.soundscapeVolume * 100)
      this.paintRange(s.soundscapeVolume)
    }
    label.textContent = this.describe(on, v)
    label.title = label.textContent
  }

  private describe(on: boolean, v: SoundWidgetView): string {
    if (!on) return tr('Ambience off')
    if (v.offChat) return tr('Paused — open a chat')
    if (v.state === 'waiting') return tr('Click anywhere to start')
    const [scene, light] = v.key.split('|')
    const what = v.custom ? `♫ ${v.custom}` : [scene && scene !== 'off' ? this.deps.sceneLabel(scene) : '', light && light !== 'none' ? this.deps.lightLabel(light) : '']
      .filter(Boolean)
      .join(' · ')
    if (!what) return tr('Quiet — no ambience here')
    if (v.backgrounded === 'mute') return tr('Muted in background')
    if (v.backgrounded === 'dim') return tr('Dimmed in background')
    return what
  }

  destroy() {
    window.removeEventListener('resize', this.onResize)
    this.unDrag?.()
    this.unDrag = null
    try {
      this.w?.destroy()
    } catch {
      /* already gone (permission revoked) */
    }
    this.w = null
    this.el = this.btn = this.dot = this.fold = this.label = this.range = this.pct = null
    this.dragging = false
  }
}
