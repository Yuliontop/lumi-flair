/**
 * Theater mode (v1.4). One click hides the interface and leaves the story full-screen, with larger type and a
 * gentle auto-scroll. The atmosphere, the lighting and the soundscape are Flair's own layers and carry on.
 *
 * How it works: while the mode is on, `<html>` carries `data-lf-theater` and one stylesheet (written into
 * `hooks.style` only for that time, so it costs nothing otherwise) hides the host's chrome by its stable
 * selectors. Nothing on a host node is touched. A small control bar (our own DOM, in Flair's overlay) lets
 * you leave, pause the scroll, change the speed and the text size, or bring the reply box back.
 *
 * Phones: the bar and the scroll move only with transform / opacity and scrollTop; the scroll loop runs only
 * while something is actually being scrolled (docs/DEVELOPMENT.md -> Phones).
 */

/** Auto-scroll speed levels 1..8, in pixels per second. */
export const SPEED_LEVELS = [8, 14, 22, 32, 46, 64, 90, 130] as const
export const SCALE_MIN = 1
export const SCALE_MAX = 2.2
/** After you scroll or press anything, the auto-scroll waits this long before carrying on. */
const RESUME_MS = 2500
/** The control bar goes away after this long without a touch, a mouse move or a key. */
const BAR_MS = 3200

const R = ':root[data-lf-theater]'
/** The host's interface, hidden while the mode is on (stable data attributes first; the hashed class names are matched by substring). */
const CHROME = [
  '[data-component="DesktopPwaTitlebar"]',
  '[data-component="QuickToolbar"]',
  '[data-component="ChatFindBar"]',
  '[data-component="ScrollToBottom"]',
  '[data-component="MessageSelectBar"]',
  '[data-component="BubbleActions"]',
  '[data-component="SwipeControls"]',
  '[data-spindle-mount="chat_top_dock"]',
  '[data-spindle-mount^="chat_header_"]',
  '[data-spindle-mount="chat_bottom_dock"]',
  '[data-spindle-mount="chat_composer_above"]',
  '[data-spindle-mount="chat_sidebar_left"]',
  '[data-spindle-mount="chat_sidebar_right"]',
  '[data-spindle-mount="message_actions"]',
  '[data-lumiverse-surface="chat-column"] > [class*="_noticeDock_"]',
  '[data-lumiverse-surface="chat-body"] > [class*="_portraitSide_"]',
  // Long replies show in full: no height limit, no fade, no "show more".
  '[class*="_longMessageToggle_"]',
  // The side drawer (its wrapper holds the drawer, whose sidebar is the one stable thing in it), and the dimmer behind it on a phone.
  'div:has(> div > [data-spindle-mount="sidebar"])',
  '[class*="_backdrop_"]:has(+ div > div > [data-spindle-mount="sidebar"])',
]

export function theaterCss(scale: number): string {
  const s = Math.min(SCALE_MAX, Math.max(SCALE_MIN, scale))
  return `
${CHROME.map((c) => `${R} ${c}`).join(',\n')} { display: none !important; }
${R}:not([data-lf-compose]) [data-component="InputArea"] { display: none !important; }
${R} [class*="_longMessageViewportConstrained_"] { max-height: none !important; overflow: visible !important; }
${R} [class*="_longMessageViewportOverflowing_"] { -webkit-mask-image: none !important; mask-image: none !important; }
${R} [data-component="MessageContent"] { font-size: calc(14px * var(--lumiverse-font-scale, 1) * ${s}) !important; line-height: 1.75 !important; }
${R} [data-component="MessageList"] { padding-bottom: calc(96px + env(safe-area-inset-bottom, 0px)) !important; }
`
}

export const THEATER_CSS = `
.lf-th-root { position: fixed; inset: 0; z-index: 2147483001; pointer-events: none; }
.lf-th, .lf-th * { margin: 0; padding: 0; box-sizing: border-box; line-height: 1.2; text-align: center; }
.lf-th { position: absolute; left: 0; right: 0; bottom: calc(env(safe-area-inset-bottom, 0px) + 16px); display: flex; flex-direction: column; align-items: center;
  gap: 8px; padding: 0 12px; pointer-events: none; opacity: 0; transform: translateY(10px); visibility: hidden;
  transition: opacity .3s ease, transform .3s ease, visibility 0s .3s; }
.lf-th[data-show="1"] { opacity: 1; transform: none; visibility: visible; transition: opacity .3s ease, transform .3s ease; }
.lf-th[data-compose="1"] { bottom: auto; top: calc(var(--app-interactive-safe-top, env(safe-area-inset-top, 0px)) + 12px); }
.lf-th-hint { font-size: 12px; color: rgba(255,255,255,.82); background: rgba(12,12,20,.72); padding: 5px 12px; border-radius: 999px; max-width: 100%; }
.lf-th-bar { pointer-events: auto; display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: 4px 14px; padding: 6px; max-width: 100%;
  border-radius: 18px; background: rgba(12,12,20,.88); border: 1px solid rgba(255,255,255,.14); box-shadow: 0 6px 28px rgba(0,0,0,.45); }
.lf-th-btn { width: 44px; height: 44px; border-radius: 12px; border: 0; background: transparent; color: #fff; display: inline-flex; align-items: center;
  justify-content: center; cursor: pointer; font: inherit; -webkit-tap-highlight-color: transparent; }
.lf-th-btn:hover { background: rgba(255,255,255,.12); }
.lf-th-btn:focus-visible { outline: 2px solid var(--lf-c, #9370db); outline-offset: -2px; }
.lf-th-btn[aria-pressed="true"] { background: rgba(255,255,255,.2); }
.lf-th-btn:disabled { opacity: .35; cursor: default; }
.lf-th-btn svg { width: 20px; height: 20px; }
.lf-th-val { min-width: 30px; font-size: 13px; font-weight: 600; color: rgba(255,255,255,.88); font-variant-numeric: tabular-nums; }
.lf-th-grp { display: flex; align-items: center; gap: 2px; }
@media (prefers-reduced-motion: reduce) { .lf-th, .lf-th[data-show="1"] { transition: none; transform: none; } }
`

const svg = (d: string) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`
export const THEATER_ICON = svg('<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>')
const ICON = {
  exit: svg('<path d="M6 6l12 12M18 6L6 18"/>'),
  play: svg('<path d="M8 5.5v13l10.5-6.5z" fill="currentColor"/>'),
  pause: svg('<path d="M8 5v14M16 5v14" stroke-width="3"/>'),
  slower: svg('<path d="M5 12h14"/>'),
  faster: svg('<path d="M5 12h14M12 5v14"/>'),
  smaller: svg('<path d="M4 18l5-12 5 12M6 14h6M17 9h4"/>'),
  larger: svg('<path d="M3 19l6-14 6 14M5.5 14h7M18 7v6M15 10h6"/>'),
  reply: svg('<path d="M4 5h16v11H9l-5 4z"/>'),
}

export interface TheaterHooks {
  /** Flair's overlay: the control bar lives in it. */
  root: HTMLElement
  /** Holds the stylesheet while the mode is on. */
  style: HTMLStyleElement
  get(): { scale: number; speed: number; scroll: boolean }
  set(patch: { theaterScale?: number; theaterSpeed?: number }): void
  /** False when the person asked for reduced motion: the auto-scroll then starts paused. */
  motion(): boolean
  /** The element the messages scroll in. */
  list(): HTMLElement | null
  /** The newest message card, if one is on screen. */
  latest(): HTMLElement | null
  /** Ask the host to close its side drawer (best effort). */
  closeDrawer(): void
  tr(s: string): string
  /** The mode switched on or off. */
  changed(on: boolean): void
}

const editable = (el: EventTarget | null) => {
  const e = el as HTMLElement | null
  return !!e && (e.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(e.tagName))
}

export class Theater {
  private on_ = false
  private playing = false
  private bar: HTMLElement | null = null
  private raf = 0
  private timer: ReturnType<typeof setTimeout> | undefined
  private last = 0
  private carry = 0
  private lastInput = 0
  private held = false
  private hideTimer: ReturnType<typeof setTimeout> | undefined
  private barHover = false
  private pokedAt = 0
  private stop: (() => void) | null = null
  private ui: { play: HTMLButtonElement; speed: HTMLElement; scale: HTMLElement; reply: HTMLButtonElement; slower: HTMLButtonElement; faster: HTMLButtonElement; smaller: HTMLButtonElement; larger: HTMLButtonElement; hint: HTMLElement } | null = null

  constructor(private h: TheaterHooks) {}

  get on() {
    return this.on_
  }

  toggle(from?: HTMLElement | null) {
    if (this.on_) this.exit()
    else this.enter(from)
  }

  /** Hide the interface. `from` is a message to start reading at (the one whose button was pressed). */
  enter(from?: HTMLElement | null) {
    const list = this.h.list()
    if (this.on_ || !list) return // nothing to read: no chat on screen
    // (The mode adds a little room under the last message, so whether you were at the end is read now.)
    const atEnd = list.scrollHeight - list.scrollTop - list.clientHeight < 120
    this.on_ = true
    this.h.closeDrawer()
    const root = document.documentElement
    root.setAttribute('data-lf-theater', '1')
    this.paint()
    this.buildBar()
    this.playing = this.h.get().scroll && this.h.motion()
    this.listen()
    this.syncBar()
    this.poke(true)
    // Let the layout settle (the message list just grew), then start where the reading starts.
    requestAnimationFrame(() => requestAnimationFrame(() => this.startAt(from ?? null, atEnd)))
    this.kick()
    this.h.changed(true)
  }

  exit() {
    if (!this.on_) return
    this.on_ = false
    this.stop?.()
    this.stop = null
    cancelAnimationFrame(this.raf)
    this.raf = 0
    clearTimeout(this.timer)
    clearTimeout(this.hideTimer)
    this.timer = this.hideTimer = undefined
    this.bar?.remove()
    this.bar = null
    this.ui = null
    this.h.style.textContent = ''
    const root = document.documentElement
    root.removeAttribute('data-lf-theater')
    root.removeAttribute('data-lf-compose')
    this.h.changed(false)
  }

  destroy() {
    this.exit()
  }

  /** The settings changed (text size, speed): redraw. */
  refresh() {
    if (!this.on_) return
    this.paint()
    this.syncBar()
  }

  private paint() {
    this.h.style.textContent = theaterCss(this.h.get().scale)
  }

  /** Reading starts at the beginning of the message you chose, or, if you were at the end of the chat, of the latest reply when it is a long one. */
  private startAt(from: HTMLElement | null, atEnd: boolean) {
    const list = this.h.list()
    if (!this.on_ || !list) return
    let target = from
    if (!target) {
      const latest = this.h.latest()
      if (atEnd && latest && latest.getBoundingClientRect().height > list.clientHeight * 0.5) target = latest
    }
    if (!target) return
    const gap = target.getBoundingClientRect().top - list.getBoundingClientRect().top
    list.scrollTop += gap - 16
    this.carry = 0
    this.lastInput = performance.now() - RESUME_MS + 600 // a short breath before it starts moving
  }

  // ── The control bar ──
  private buildBar() {
    const t = this.h.tr
    const bar = document.createElement('div')
    bar.className = 'lf-th'
    bar.dataset.show = '0'
    const hint = document.createElement('div')
    hint.className = 'lf-th-hint'
    hint.textContent = matchMedia('(hover: hover)').matches
      ? t('Esc leaves · Space pauses the scroll · + and − change the text size')
      : t('Tap the screen to show these controls')
    const row = document.createElement('div')
    row.className = 'lf-th-bar'
    row.setAttribute('role', 'toolbar')
    row.setAttribute('aria-label', t('Theater mode'))
    const btn = (icon: string, label: string, on: () => void) => {
      const b = document.createElement('button')
      b.type = 'button'
      b.className = 'lf-th-btn'
      b.innerHTML = icon
      b.title = t(label)
      b.setAttribute('aria-label', t(label))
      b.addEventListener('click', (e) => {
        e.stopPropagation()
        on()
        this.poke(true)
      })
      return b
    }
    const val = () => {
      const v = document.createElement('span')
      v.className = 'lf-th-val'
      return v
    }
    // Controls that belong together stay together: on a narrow screen the bar wraps between groups, never inside one.
    const group = (...items: HTMLElement[]) => {
      const g = document.createElement('div')
      g.className = 'lf-th-grp'
      g.append(...items)
      return g
    }
    const exit = btn(ICON.exit, 'Leave theater mode', () => this.exit())
    const play = btn(ICON.play, 'Pause the scroll', () => this.togglePlay())
    const slower = btn(ICON.slower, 'Scroll slower', () => this.nudgeSpeed(-1))
    const speed = val()
    const faster = btn(ICON.faster, 'Scroll faster', () => this.nudgeSpeed(1))
    const smaller = btn(ICON.smaller, 'Smaller text', () => this.nudgeScale(-0.1))
    const scale = val()
    const larger = btn(ICON.larger, 'Larger text', () => this.nudgeScale(0.1))
    const reply = btn(ICON.reply, 'Show the reply box', () => this.toggleReply())
    row.append(group(exit), group(play, slower, speed, faster), group(smaller, scale, larger), group(reply))
    bar.append(hint, row)
    row.addEventListener('pointerenter', () => (this.barHover = true))
    row.addEventListener('pointerleave', () => {
      this.barHover = false
      this.poke(true)
    })
    row.addEventListener('focusin', () => this.poke(true))
    this.h.root.appendChild(bar)
    this.bar = bar
    this.ui = { play, speed, scale, reply, slower, faster, smaller, larger, hint }
  }

  /** Make the labels and states match the settings. */
  private syncBar() {
    const u = this.ui
    if (!u) return
    const t = this.h.tr
    const s = this.h.get()
    const level = this.level(s.speed)
    u.speed.textContent = String(level)
    u.scale.textContent = `${Math.round(s.scale * 100)}%`
    u.slower.disabled = level <= 1
    u.faster.disabled = level >= SPEED_LEVELS.length
    u.smaller.disabled = s.scale <= SCALE_MIN + 0.001
    u.larger.disabled = s.scale >= SCALE_MAX - 0.001
    u.play.innerHTML = this.playing ? ICON.pause : ICON.play
    const pl = this.playing ? t('Pause the scroll') : t('Start the scroll')
    u.play.title = pl
    u.play.setAttribute('aria-label', pl)
    const composing = document.documentElement.hasAttribute('data-lf-compose')
    u.reply.setAttribute('aria-pressed', String(composing))
    const rl = t(composing ? 'Hide the reply box' : 'Show the reply box')
    u.reply.title = rl
    u.reply.setAttribute('aria-label', rl)
    if (this.bar) this.bar.dataset.compose = composing ? '1' : '0'
  }

  private level(speed: number) {
    return Math.min(SPEED_LEVELS.length, Math.max(1, Math.round(speed)))
  }

  private nudgeSpeed(by: number) {
    this.h.set({ theaterSpeed: this.level(this.h.get().speed) + by })
    this.syncBar()
  }

  private nudgeScale(by: number) {
    const next = Math.round((this.h.get().scale + by) * 100) / 100
    this.h.set({ theaterScale: Math.min(SCALE_MAX, Math.max(SCALE_MIN, next)) })
    this.paint()
    this.syncBar()
  }

  private togglePlay() {
    this.playing = !this.playing
    this.lastInput = 0 // pressing play means now
    this.syncBar()
    if (this.playing) this.kick()
  }

  private toggleReply() {
    const root = document.documentElement
    if (root.hasAttribute('data-lf-compose')) root.removeAttribute('data-lf-compose')
    else root.setAttribute('data-lf-compose', '1')
    this.syncBar()
  }

  /** Show the bar, and let it go again after a few quiet seconds (never while the pointer is on it). */
  private poke(force = false) {
    const bar = this.bar
    if (!bar) return
    const now = performance.now()
    if (!force && now - this.pokedAt < 300) return
    this.pokedAt = now
    bar.dataset.show = '1'
    this.armHide()
  }

  private armHide() {
    clearTimeout(this.hideTimer)
    this.hideTimer = setTimeout(() => {
      const bar = this.bar
      if (!bar) return
      // Not while the pointer is on it, or while a key press has put the focus ring on one of its buttons.
      if (this.barHover || bar.querySelector(':focus-visible')) return this.armHide()
      bar.dataset.show = '0'
      if (this.ui) this.ui.hint.style.display = 'none' // the reminder is for the first moments only
    }, BAR_MS)
  }

  // ── Input ──
  private listen() {
    const input = () => (this.lastInput = performance.now())
    const down = () => {
      this.held = true
      input()
      this.poke()
    }
    const up = () => {
      this.held = false
      input()
    }
    const key = (e: KeyboardEvent) => {
      input()
      if (e.key === 'Escape') {
        this.exit()
        return
      }
      this.poke()
      if (editable(e.target) || e.ctrlKey || e.metaKey || e.altKey) return
      if (e.key === ' ' && !(e.target as HTMLElement | null)?.closest?.('button, a, [role="button"]')) {
        e.preventDefault()
        this.togglePlay()
      } else if (e.key === '+' || e.key === '=') this.nudgeScale(0.1)
      else if (e.key === '-' || e.key === '_') this.nudgeScale(-0.1)
    }
    const move = () => this.poke()
    const wheel = () => {
      input()
      this.poke()
    }
    const o = { capture: true, passive: true } as const
    document.addEventListener('pointerdown', down, o)
    document.addEventListener('pointerup', up, o)
    document.addEventListener('pointercancel', up, o)
    document.addEventListener('pointermove', move, o)
    document.addEventListener('wheel', wheel, o)
    document.addEventListener('touchmove', input, o)
    document.addEventListener('keydown', key, { capture: true })
    document.addEventListener('visibilitychange', this.kickSoon)
    this.stop = () => {
      document.removeEventListener('pointerdown', down, o)
      document.removeEventListener('pointerup', up, o)
      document.removeEventListener('pointercancel', up, o)
      document.removeEventListener('pointermove', move, o)
      document.removeEventListener('wheel', wheel, o)
      document.removeEventListener('touchmove', input, o)
      document.removeEventListener('keydown', key, { capture: true })
      document.removeEventListener('visibilitychange', this.kickSoon)
    }
  }

  // ── The scroll ──
  private kickSoon = () => this.kick()

  /** Make sure the scroll is being watched (a frame loop while it is moving, a slow check while it is waiting). */
  private kick() {
    if (!this.on_ || this.raf) return
    clearTimeout(this.timer)
    this.timer = undefined
    this.last = 0
    this.raf = requestAnimationFrame(this.tick)
  }

  private wait(ms: number) {
    this.last = 0
    if (this.timer) clearTimeout(this.timer)
    this.timer = setTimeout(() => {
      this.timer = undefined
      if (this.on_ && !this.raf) this.tick(performance.now())
    }, ms)
  }

  private tick = (now: number) => {
    this.raf = 0
    if (!this.on_) return
    const list = this.h.list()
    // Paused, or the page is hidden: nothing to watch. Pressing play, or coming back to the page, starts it again.
    if (!list || !this.playing || document.hidden) return
    // Waiting for you to finish scrolling, or at the end of the chat: look again soon, without a frame loop.
    if (this.held || performance.now() - this.lastInput < RESUME_MS) return this.wait(250)
    if (list.scrollHeight - list.scrollTop - list.clientHeight <= 2) return this.wait(600)
    if (!this.last) {
      this.last = now
      this.raf = requestAnimationFrame(this.tick)
      return
    }
    const dt = Math.min(0.1, (now - this.last) / 1000)
    this.last = now
    this.carry += SPEED_LEVELS[this.level(this.h.get().speed) - 1] * dt
    const px = Math.floor(this.carry)
    if (px >= 1) {
      this.carry -= px
      list.scrollTop += px
    }
    this.raf = requestAnimationFrame(this.tick)
  }
}
