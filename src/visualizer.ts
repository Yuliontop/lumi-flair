/**
 * Audio visualizer: frequency bars that react to music, in up to three places at once.
 *   - a floating window you can drag and resize (Lumiverse float widget, needs `ui_panels`);
 *   - a background layer across the whole chat view, above the wallpaper and below the messages;
 *   - a strip on each side of the chat column.
 * All three share one analysis per frame and one look (style, colours, bar shape); each has its own opacity.
 *
 * Where the sound comes from (a browser can't hear other apps unless the user shares them):
 *   flair  Flair's own output: the soundscape master, i.e. ambience and the user's "Always play" track
 *   tab    a tab or the whole screen shared with its audio (getDisplayMedia; Chrome/Edge on a computer)
 *   mic    the microphone, which hears speakers; the way in on a phone
 *   system what the computer is playing, as a spectrum from the Lumiverse desktop app (`ctx.systemAudio`, needs the
 *          optional `system_audio` permission; the host can remember consent and always shows that it is listening)
 *   demo   a made-up signal, for setting the look up in silence
 *
 * Desktop only: nothing is drawn or opened on a touch screen (`pointer: coarse`), whatever the synced setting says.
 *
 * Cost: one frame loop, only while something is audible (silence stops it and a 250 ms check wakes it again),
 * capped at ~30 fps on touch screens and in battery saver, with no filters or blend modes (see DEVELOPMENT.md → Phones).
 */
import type {
  SpindleFrontendContext,
  SpindleSystemAudioEndReason,
  SpindleSystemAudioFrame,
  SpindleSystemAudioSession,
} from 'lumiverse-spindle-types'
import { VIZ_WIN_MAX, VIZ_WIN_MIN, type FlairSettings } from './settings'
import { hexToHsl } from './palette'
import { tr } from './i18n'
import { away, onPresence } from './presence'

type FloatWidget = ReturnType<SpindleFrontendContext['ui']['createFloatWidget']>
export type VizState = 'off' | 'live' | 'quiet' | 'connect' | 'error'

export interface VizDeps {
  settings(): FlairSettings
  update(patch: Partial<FlairSettings>): void
  /** Flair's own output (the soundscape's analyser and the master gain in front of it), null before any sound has run. */
  tap(): { node: AnalyserNode; level: number } | null
  /** The two colours of the current look, from the glow colour and the active Flair Pack. */
  palette(): [string, string]
  motionOk(): boolean
  saver(): boolean
  panels(): boolean
  onState(): void
}

// ── pure helpers (also used by the tests through the mock) ──

/** Bin boundaries for `n` log-spaced bands from 40 Hz up to ~14 kHz: band i is bins [edges[i], edges[i+1]). */
export function bandEdges(n: number, bins: number, sampleRate: number): number[] {
  const nyq = sampleRate / 2
  const lo = 40
  const hi = Math.min(14000, nyq * 0.95)
  const bin = (f: number) => Math.min(bins, Math.max(0, Math.round((f / nyq) * bins)))
  const edges = [bin(lo)]
  for (let i = 1; i <= n; i++) edges.push(Math.min(bins, Math.max(edges[i - 1] + 1, bin(lo * Math.pow(hi / lo, i / n)))))
  return edges
}

/** Loudest bin in each band, tilted up towards the treble (which carries less energy), squared a little for punch. */
export function readBands(data: Uint8Array, edges: number[], out: Float32Array, gain: number) {
  const n = out.length
  for (let i = 0; i < n; i++) {
    let m = 0
    const a = Math.min(edges[i], data.length - 1)
    const b = Math.max(edges[i + 1], a + 1)
    for (let k = a; k < b && k < data.length; k++) if (data[k] > m) m = data[k]
    const v = Math.min(1, (m / 255) * gain * (1 + (i / n) * 0.9))
    out[i] = Math.pow(v, 1.35)
  }
}

/** Bands asked of the host: the most it gives, so every bar count can be filled from them. */
const SYS_BANDS = 64

/**
 * Bars from the desktop app's spectrum (log-spaced 40 Hz – 14 kHz, 0 – 1, lowest first). More bars than bands are
 * interpolated; fewer take the loudest band in their share, so a narrow peak survives. The host's 0 – 1 spans
 * -100…-30 dB while the analyser used for the other sources spans -85…-20 dB, so the level is remapped first and
 * "Sensitivity" feels the same whatever is being listened to. Then the same treble tilt and punch as `readBands`.
 */
export function readSystemBands(src: ArrayLike<number>, out: Float32Array, gain: number) {
  const n = out.length
  const m = src.length
  for (let i = 0; i < n; i++) {
    let x = 0
    if (m >= n) {
      const a = Math.floor((i * m) / n)
      const b = Math.max(a + 1, Math.floor(((i + 1) * m) / n))
      for (let k = a; k < b && k < m; k++) if (src[k] > x) x = src[k]
    } else if (m > 0) {
      const at = n > 1 ? (i * (m - 1)) / (n - 1) : 0
      const lo = Math.floor(at)
      const hi = Math.min(m - 1, lo + 1)
      x = src[lo] * (1 - (at - lo)) + src[hi] * (at - lo)
    }
    const level = Math.min(1, Math.max(0, (70 * (Number.isFinite(x) ? x : 0) - 15) / 65))
    const v = Math.min(1, level * gain * (1 + (i / n) * 0.9))
    out[i] = Math.pow(v, 1.35)
  }
}

/** What to tell the user when the desktop app could not start listening. */
function systemError(err: unknown): string {
  const name = (err as { name?: string })?.name ?? ''
  const msg = typeof err === 'string' ? err : (err as { message?: string })?.message ?? ''
  if (msg === 'sys:disabled') return tr('Tick “Let Extensions Analyse System Audio” in the Lumiverse tray menu first.')
  if (msg === 'sys:unsupported' || name === 'NotSupportedError')
    return tr('System audio needs the Lumiverse desktop app (Windows, macOS 14.2 or later, or Linux with PulseAudio or PipeWire).')
  if (msg === 'sys:denied' || name === 'NotAllowedError' || name === 'AbortError') return tr('Permission wasn’t given.')
  // The desktop app words its own failures (for example how to allow it in macOS settings), so pass them on.
  if (name !== 'TypeError' && msg && msg.length < 260 && !msg.startsWith('PERMISSION_DENIED')) return msg
  return tr('Couldn’t start listening.')
}

function systemEnded(reason: SpindleSystemAudioEndReason): string | null {
  switch (reason) {
    case 'revoked':
      return tr('The system audio permission was turned off.')
    case 'source-lost':
      return tr('Lost the sound source (the screen locked, the computer slept or the output changed). Press “Connect audio” to listen again.')
    case 'host-disabled':
      return tr('System audio was turned off in the Lumiverse tray menu.')
    default:
      return null // the user pressed Stop on Lumiverse's own indicator
  }
}

function synth(out: Float32Array, t: number) {
  const n = out.length
  const beat = Math.pow(Math.max(0, Math.sin(t * Math.PI * 3.6)), 6)
  for (let i = 0; i < n; i++) {
    const x = i / n
    const body = 0.5 + 0.5 * Math.sin(t * (1.1 + x * 3.1) + i * 0.9)
    out[i] = Math.min(1, (0.18 + body * 0.5) * (0.85 - x * 0.55) + beat * (1 - x) * 0.45)
  }
}

const rgbOf = (hex: string) => {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
const lerpHex = (a: string, b: string, t: number) => {
  const [r1, g1, b1] = rgbOf(a)
  const [r2, g2, b2] = rgbOf(b)
  return `rgb(${Math.round(r1 + (r2 - r1) * t)},${Math.round(g1 + (g2 - g1) * t)},${Math.round(b1 + (b2 - b1) * t)})`
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100
  l /= 100
  const k = (n: number) => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))))
  return '#' + [f(0), f(8), f(4)].map((v) => v.toString(16).padStart(2, '0')).join('')
}

/** A partner colour for a lone accent: the same colour turned round the wheel. */
export function shiftHue(hex: string, deg: number): string {
  const { h, s, l } = hexToHsl(hex)
  return hslToHex((h + deg + 360) % 360, Math.max(s, 55), Math.min(70, Math.max(l, 48)))
}

/**
 * For `n` bars shown symmetrically about the middle: which band each bar position shows. The lows are in the middle
 * (or on the outside when `flip`), and the two halves are mirror images.
 */
export function centerMap(n: number, flip: boolean): number[] {
  const mid = (n - 1) / 2
  return Array.from({ length: n }, (_, j) => {
    const d = mid > 0 ? Math.abs(j - mid) / mid : 0
    return Math.round((flip ? 1 - d : d) * (n - 1))
  })
}

// ── drawing ──

interface Look {
  style: FlairSettings['vizStyle']
  fill: number
  round: number
  peaks: boolean
  glow: number
  a: string
  b: string
  rainbow: boolean
  up: boolean
}

type Pen = Path2D | CanvasRenderingContext2D

function rect(p: Pen, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2))
  if (rr > 0.5 && 'roundRect' in p) p.roundRect(x, y, w, h, rr)
  else p.rect(x, y, w, h)
}

/**
 * Draw one set of bars in a frame where bars stand on y = T and grow towards y = 0 across a row of length L
 * (the caller rotates the canvas for the side strips). `e` grows every shape by that many px for the glow pass.
 */
function shapes(g: CanvasRenderingContext2D, L: number, T: number, v: Float32Array, pk: Float32Array, look: Look, cols: string[] | null, e: number) {
  const n = v.length
  const step = L / n
  const bw = Math.max(1, step * look.fill)
  const rad = (look.round * bw) / 2
  const across = !!cols

  if (look.style === 'wave') {
    const pt = (i: number) => [step * (i + 0.5), T - v[i] * T] as const
    g.beginPath()
    g.moveTo(0, T)
    g.lineTo(0, pt(0)[1])
    for (let i = 0; i < n - 1; i++) {
      const [x0, y0] = pt(i)
      const [x1, y1] = pt(i + 1)
      g.quadraticCurveTo(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2)
    }
    const [xl, yl] = pt(n - 1)
    g.lineTo(xl, yl)
    g.lineTo(L, yl)
    g.lineTo(L, T)
    g.closePath()
    if (e === 0) g.fill()
    else {
      g.lineWidth = e * 2
      g.lineJoin = 'round'
      g.stroke()
    }
    return
  }

  const mirror = look.style === 'mirror'
  const segs = look.style === 'segments'
  const seg = Math.max(3, bw * 0.6)
  const gap = Math.max(1, seg * 0.3)
  const count = Math.max(2, Math.floor((T + gap) / (seg + gap)))
  const single = across ? null : new Path2D()

  for (let i = 0; i < n; i++) {
    const pen: Pen = single ?? g
    if (across) {
      g.beginPath()
      g.fillStyle = cols![i]
    }
    const x = i * step + (step - bw) / 2 - e
    const w = bw + e * 2
    if (segs) {
      const lit = Math.round(v[i] * count)
      for (let k = 0; k < lit; k++) rect(pen, x, T - (k + 1) * seg - k * gap - e, w, seg + e * 2, Math.min(rad, seg / 2))
    } else if (mirror) {
      const hh = (v[i] * T) / 2
      if (hh >= 0.5) rect(pen, x, T / 2 - hh - e, w, hh * 2 + e * 2, rad)
    } else {
      const h = v[i] * T
      if (h >= 1) rect(pen, x, T - h - e, w, h + e, rad)
    }
    if (across) g.fill()
  }
  if (single) g.fill(single)

  // Peak caps float a little above the bars and fall slowly (not in the glow pass).
  if (look.peaks && !e && !segs) {
    const th = Math.max(2, bw * 0.22)
    for (let i = 0; i < n; i++) {
      if (pk[i] < 0.03) continue
      g.fillStyle = cols ? cols[i] : look.b
      const x = i * step + (step - bw) / 2
      if (mirror) {
        const hh = (pk[i] * T) / 2
        g.fillRect(x, T / 2 - hh - th, bw, th)
        g.fillRect(x, T / 2 + hh, bw, th)
      } else g.fillRect(x, T - pk[i] * T - th - 1, bw, th)
    }
  }
}

// ── the visualizer ──

type Kind = 'win' | 'bg' | 'left' | 'right'
type Channel = 'mono' | 'left' | 'right'
interface Target {
  kind: Kind
  el: HTMLCanvasElement
  g: CanvasRenderingContext2D | null
  w: number
  h: number
  dpr: number
  dirty: boolean
  visible: boolean
  /** bars drawn here */
  n: number
}
interface Lane {
  v: Float32Array
  pk: Float32Array
  tmp: Float32Array
}

const GAP = 6 // px between a side strip and the chat column
const SIDE_MIN = 20

export const VIZ_CSS = `
canvas.lf-vz-bg, canvas.lf-vz-side { position: absolute; pointer-events: none; z-index: 2; display: none; }
canvas.lf-vz-bg { left: 0; width: 100%; }
canvas.lf-vz-side { top: 0; height: 100%; }
.lf-vzw,.lf-vzw *{box-sizing:border-box;margin:0;padding:0;text-align:left;line-height:normal;letter-spacing:normal;text-transform:none;text-indent:0;float:none}
.lf-vzw{position:relative;overflow:hidden;border-radius:14px;color:var(--lumiverse-text,#fff);
  background:color-mix(in srgb,var(--lumiverse-bg-elevated,#1a1626) 78%,transparent);
  border:1px solid var(--lumiverse-border,rgba(255,255,255,.12));box-shadow:0 6px 24px rgba(0,0,0,.28);
  font-family:var(--lumiverse-font-family,inherit);font-size:12px;user-select:none;-webkit-user-select:none;touch-action:none;cursor:grab}
.lf-vzw:active{cursor:grabbing}
.lf-vzw .lf-vzw-cv{position:absolute;left:0;top:0;width:100%;height:100%;display:block}
.lf-vzw .lf-vzw-msg{position:absolute;left:10px;right:10px;top:0;bottom:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;
  text-align:center;color:var(--lumiverse-text-muted,#bbb);pointer-events:none}
.lf-vzw .lf-vzw-msg[hidden]{display:none}
.lf-vzw .lf-vzw-msg span{display:block;text-align:center;font-size:11px;line-height:15px;max-width:100%}
.lf-vzw .lf-vzw-tools{position:absolute;top:6px;right:6px;display:flex;gap:4px;opacity:0;transition:opacity .15s}
.lf-vzw:hover .lf-vzw-tools,.lf-vzw:focus-within .lf-vzw-tools{opacity:1}
@media (pointer:coarse){.lf-vzw .lf-vzw-tools{opacity:.85}}
.lf-vzw button{flex:none;min-width:0;min-height:0;max-width:none;border:0;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;
  box-shadow:none;outline:none;font:inherit;background:var(--lumiverse-fill,rgba(255,255,255,.12));color:var(--lumiverse-text,#fff);transition:background .15s}
.lf-vzw .lf-vzw-tools button{width:24px;height:24px}
.lf-vzw button:hover{background:var(--lumiverse-fill-subtle,rgba(255,255,255,.2))}
.lf-vzw button:focus-visible{outline:2px solid var(--lumiverse-primary,#9370db);outline-offset:2px}
.lf-vzw button svg{display:block;width:14px;height:14px;min-width:0}
.lf-vzw .lf-vzw-go{width:auto;height:28px;padding:0 14px;border-radius:14px;pointer-events:auto;font-size:12px;font-weight:600;
  background:var(--lumiverse-primary,#9370db);color:var(--lumiverse-primary-contrast,#fff)}
.lf-vzw .lf-vzw-grip{position:absolute;right:0;bottom:0;width:22px;height:22px;display:flex;align-items:flex-end;justify-content:flex-end;padding:3px;cursor:nwse-resize;
  touch-action:none;color:var(--lumiverse-text-muted,#bbb);opacity:.55}
.lf-vzw .lf-vzw-grip:hover{opacity:1}
.lf-vzw .lf-vzw-grip svg{display:block;width:12px;height:12px}
`

const ICON_CLOSE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>'
const ICON_PLUG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 3v5M15 3v5M7 8h10v3a5 5 0 0 1-10 0zM12 16v5"/></svg>'
const ICON_GRIP = '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="M11 3 3 11M11 7l-4 4"/></svg>'

export class Visualizer {
  /** The background layer and the two side strips, appended by the frontend into the chat view's atmosphere host. */
  readonly els: HTMLCanvasElement[]
  private bg: Target
  private left: Target
  private right: Target
  private win: { w: FloatWidget; el: HTMLElement; t: Target; msg: HTMLElement; text: HTMLElement; go: HTMLButtonElement; tools: HTMLButtonElement; unDrag: () => void; ro: ResizeObserver | null } | null = null
  private lanes = new Map<string, Lane>()
  private edgeCache = new Map<string, number[]>()
  private colCache = { key: '', cols: [] as string[] }
  private centered = new Map<string, { map: number[]; v: Float32Array; pk: Float32Array }>()
  private bytes: Uint8Array<ArrayBuffer> | null = null
  private configured = new WeakSet<AnalyserNode>()
  private feed: { ac: AudioContext; an: AnalyserNode; stream: MediaStream; kind: 'tab' | 'mic' } | null = null
  /** The desktop app's spectra, filled by its frames. `ready` once consent is verified and analysis has begun. */
  private sys: {
    session: SpindleSystemAudioSession | null
    bands: Float32Array
    left: Float32Array | null
    right: Float32Array | null
    hasStereo: boolean
    stereoSetting: boolean
    ready: boolean
  } | null = null
  /** One automatic attempt per activation. Failure or the host's Stop leaves reconnection to the user. */
  private systemAttempted = false
  private destroyed = false
  private error: string | null = null
  private raf = 0
  private poll: ReturnType<typeof setInterval> | undefined
  private last = 0
  private quietFor = 0
  private quiet = false
  private lastLayout = 0
  private lastPal = 0
  private pal: [string, string] = ['#a78bfa', '#38bdf8']
  private t0 = performance.now()
  private lastState: VizState = 'off'
  private active = false
  private coarse = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches
  private ro: ResizeObserver | null
  // The page being hidden re-syncs everything; losing focus only stops the frames (the last one stays), and coming back restarts them.
  private onVis = () => {
    if (document.hidden) this.sync(this.onChat)
    else if (away()) this.stopLoop()
    else if (!this.raf && !this.poll) this.sync(this.onChat)
  }
  private unPresence: (() => void) | null = null
  private onResize = () => {
    this.keepWindowOnScreen()
    this.layout()
  }
  private onChat = false
  private sidesWanted = false

  constructor(private ctx: SpindleFrontendContext, private deps: VizDeps) {
    const mk = (kind: Kind, cls: string): Target => {
      const el = ctx.dom.createElement('canvas', { class: cls }) as HTMLCanvasElement
      return { kind, el, g: el.getContext('2d'), w: 0, h: 0, dpr: 1, dirty: true, visible: false, n: 0 }
    }
    this.bg = mk('bg', 'lf-vz-bg')
    this.left = mk('left', 'lf-vz-side')
    this.right = mk('right', 'lf-vz-side')
    this.els = [this.bg.el, this.left.el, this.right.el]
    this.ro = typeof ResizeObserver === 'function' ? new ResizeObserver((es) => {
      for (const e of es) for (const t of [this.bg, this.left, this.right]) if (t.el === e.target) t.dirty = true
    }) : null
    for (const t of [this.bg, this.left, this.right]) this.ro?.observe(t.el)
    this.unPresence = onPresence(this.onVis)
    window.addEventListener('resize', this.onResize)
  }

  // ── what the panel shows ──

  state(): VizState {
    const s = this.deps.settings()
    if (!this.active) return 'off'
    if (s.vizSource === 'demo') return 'live'
    if (this.needsConnection(s.vizSource) && !this.connected(s.vizSource)) return this.error ? 'error' : 'connect'
    return this.quiet ? 'quiet' : 'live'
  }
  get lastError() {
    return this.error
  }
  /** Sources that need a capture session; system audio can reuse host-owned consent. */
  private needsConnection(src: FlairSettings['vizSource']) {
    return src === 'tab' || src === 'mic' || src === 'system'
  }
  private connected(src: FlairSettings['vizSource']) {
    return src === 'system' ? !!this.sys?.ready : !!this.feed
  }
  /** A frame loop is running (so the frame-rate governor has something to watch). */
  get animating() {
    return !!this.raf
  }
  /** Close and reopen the window, so it takes its place and size from the settings again. */
  reopenWindow() {
    this.closeWindow()
    this.sync(this.onChat)
  }
  get windowShown() {
    return !!this.win
  }
  /** The browser can share a tab's or the screen's audio. */
  get canShare() {
    return !!navigator.mediaDevices?.getDisplayMedia
  }

  // ── wiring ──

  /**
   * Bring everything in line with the settings. `onChat`: the chat view is on screen (and not being left), which is
   * where the background layer and side strips live. Cheap; called on every settings change.
   */
  sync(onChat: boolean) {
    if (this.destroyed) return
    this.onChat = onChat
    const s = this.deps.settings()
    // Desktop only: on a touch screen it is clutter, and the setting follows the account onto the phone.
    this.active = s.enabled && s.viz && this.deps.motionOk() && !this.coarse
    const on = this.active && !document.hidden // a hidden page keeps its window but draws nothing

    // The shared source: drop a feed that isn't the one asked for.
    if (this.feed && this.feed.kind !== s.vizSource) this.disconnect()
    if (this.sys && s.vizSource !== 'system') this.disconnect()
    if (!this.active && (this.feed || this.sys)) this.disconnect()
    if (!this.active || s.vizSource !== 'system') this.systemAttempted = false

    // The host owns remembered consent. Do not request a new extension permission during an automatic attempt.
    // Claim the attempt before starting: settings changes and pending permission checks must not duplicate it.
    if (on && s.vizSource === 'system' &&
      ((!this.sys && !this.systemAttempted) || (this.sys && this.sys.stereoSetting !== s.vizStereo))) {
      this.systemAttempted = true
      void this.connectSystem(true)
    }

    if (this.active && s.vizWindow && this.deps.panels()) this.openWindow()
    else this.closeWindow()
    this.bg.visible = on && s.vizBg && onChat
    this.sidesWanted = on && s.vizSides && onChat
    if (this.active) {
      this.pal = this.deps.palette() // reads a computed colour, so only while there is something to colour
      this.lastPal = performance.now()
    }
    this.bg.n = Math.min(128, s.vizBars * 2)
    this.left.n = this.right.n = Math.max(6, Math.round(s.vizBars * 0.8))
    if (this.win) this.win.t.n = s.vizBars

    const bgStyle = this.bg.el.style
    bgStyle.display = this.bg.visible ? 'block' : 'none'
    bgStyle.height = `${Math.round(s.vizBgHeight * 100)}%`
    bgStyle.opacity = String(s.vizBgOpacity)
    bgStyle.top = s.vizBgTop ? '0' : 'auto'
    bgStyle.bottom = s.vizBgTop ? 'auto' : '0'
    for (const t of [this.left, this.right]) t.el.style.opacity = String(s.vizSideOpacity)
    if (this.win) {
      this.win.el.style.opacity = String(s.vizWindowOpacity)
      this.syncWindowMsg()
    }
    this.layout()

    const any = on && (this.bg.visible || this.left.visible || this.right.visible || !!this.win)
    if (!any) {
      this.stopLoop()
      this.clearAll()
    } else if (!this.raf && !this.poll) {
      this.quiet = false
      this.quietFor = 0
      this.startLoop()
    } else if (this.poll) this.wake() // a changed look should show at once
    this.report()
  }

  private report() {
    const st = this.state()
    if (st === this.lastState) return
    this.lastState = st
    this.deps.onState()
  }

  // ── the source ──

  /** Start listening to a shared tab/screen or the microphone. Must run inside a click: the browser asks for permission. */
  async connect(): Promise<void> {
    const kind = this.deps.settings().vizSource
    if (kind === 'system') return this.connectSystem()
    if (kind !== 'tab' && kind !== 'mic') return
    this.disconnect()
    this.error = null
    const md = navigator.mediaDevices
    try {
      if (!md || (kind === 'tab' && !md.getDisplayMedia) || !md.getUserMedia) throw new Error('unsupported')
      const raw = { echoCancellation: false, noiseSuppression: false, autoGainControl: false }
      const stream = kind === 'tab' ? await md.getDisplayMedia({ video: true, audio: raw }) : await md.getUserMedia({ audio: raw })
      const audio = stream.getAudioTracks()
      stream.getVideoTracks().forEach((t) => t.stop()) // only the sound is wanted; Chrome insists on asking for the picture too
      if (!audio.length) {
        stream.getTracks().forEach((t) => t.stop())
        throw new Error('noaudio')
      }
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      const ac = new Ctor()
      void ac.resume().catch(() => {})
      const an = ac.createAnalyser()
      // Into the analyser only, never to the speakers: the source is already playing wherever it came from.
      ac.createMediaStreamSource(new MediaStream(audio)).connect(an)
      this.feed = { ac, an, stream, kind }
      audio[0].addEventListener('ended', () => {
        if (this.feed?.stream === stream) {
          this.disconnect()
          this.sync(this.onChat)
        }
      })
    } catch (err) {
      const name = (err as { name?: string; message?: string })?.name ?? ''
      const msg = (err as { message?: string })?.message ?? ''
      this.error =
        msg === 'noaudio'
          ? tr('No sound was shared. Pick a tab and tick “Share tab audio”.')
          : msg === 'unsupported' || name === 'NotSupportedError' || name === 'TypeError'
            ? tr('This browser can’t listen to that here. Try the microphone.')
            : name === 'NotAllowedError' || name === 'AbortError'
              ? tr('Permission wasn’t given.')
              : tr('Couldn’t start listening.')
    }
    this.sync(this.onChat)
    this.deps.onState()
  }

  /**
   * Listen to what the computer is playing, through the desktop app. Asks for the optional `system_audio` permission
   * on a manual connection. Automatic starts reuse an existing grant; Lumiverse verifies explicit or remembered
   * consent and shows an indicator while it listens.
   */
  private async connectSystem(automatic = false): Promise<void> {
    if (this.destroyed) return
    this.disconnect()
    this.error = null
    this.systemAttempted = true
    const holder: NonNullable<Visualizer['sys']> = {
      session: null,
      bands: new Float32Array(SYS_BANDS),
      left: null,
      right: null,
      hasStereo: false,
      stereoSetting: this.deps.settings().vizStereo,
      ready: false,
    }
    this.sys = holder // also tracks startup, so disconnect cancels a pending permission check
    try {
      const api = this.ctx.systemAudio
      if (!api || (this.ctx.host?.capabilities?.['system-audio-v1'] ?? 0) < 1) throw new Error('sys:unsupported')
      const status = api.isAvailable()
      if (!status.available) throw new Error(`sys:${status.unavailableReason ?? 'unsupported'}`)
      const permissions = await this.ctx.permissions.getGranted()
      if (this.sys !== holder) return
      if (!permissions.includes('system_audio')) {
        if (automatic) throw new Error('sys:denied')
        const granted = await this.ctx.permissions.request(['system_audio'], {
          reason: tr('Lumi Flair listens to a level and a spectrum of what your computer is playing, to move the visualizer. It never receives the sound itself. Lumiverse can remember your approval on this device and always shows when it is listening.'),
        })
        if (this.sys !== holder) return
        if (!granted.includes('system_audio')) throw new Error('sys:denied')
      }
      const stereo = holder.stereoSetting && (this.ctx.host?.capabilities?.['system-audio-stereo-v1'] ?? 0) >= 1 && status.stereoSupported === true
      if (stereo) {
        holder.left = new Float32Array(SYS_BANDS)
        holder.right = new Float32Array(SYS_BANDS)
      }
      holder.session = api.start({
        bands: SYS_BANDS,
        maxFps: this.deps.saver() ? 15 : 30, // the host does no more work than this asks for
        ...(stereo ? { stereo: true } : {}),
        onFrame: (frame) => this.onSystemFrame(holder, frame),
        onEnd: (reason) => this.onSystemEnd(holder, reason),
      })
      await holder.session.ready
      if (this.sys !== holder) return // disconnected while the prompt was open
      holder.ready = true
    } catch (err) {
      if (this.sys !== holder) return // cancelled or something newer took over
      holder.session?.stop()
      this.sys = null
      this.error = automatic ? null : systemError(err)
    }
    this.sync(this.onChat)
    this.deps.onState()
  }

  private onSystemFrame(holder: NonNullable<Visualizer['sys']>, frame: SpindleSystemAudioFrame) {
    if (this.sys !== holder) return
    let loudest = 0
    const copy = (src: ArrayLike<number>, bands: Float32Array) => {
      for (let i = 0; i < bands.length; i++) {
        const x = i < src.length && Number.isFinite(src[i]) ? Math.max(0, Math.min(1, src[i])) : 0
        bands[i] = x
        if (x > loudest) loudest = x
      }
    }
    copy(frame.frequencies, holder.bands)
    const stereo = frame.stereo
    holder.hasStereo = !!(stereo && holder.left && holder.right)
    if (stereo && holder.left && holder.right) {
      copy(stereo.left.frequencies, holder.left)
      copy(stereo.right.frequencies, holder.right)
    }
    // Check independent channels too: opposite-phase stereo can cancel entirely in the combined spectrum.
    if (this.quiet && loudest > 0.25) this.wake()
  }

  private onSystemEnd(holder: NonNullable<Visualizer['sys']>, reason: SpindleSystemAudioEndReason) {
    if (this.sys !== holder) return
    this.sys = null
    this.error = systemEnded(reason)
    this.sync(this.onChat)
    this.deps.onState()
  }

  disconnect() {
    const sys = this.sys
    this.sys = null
    this.clearAll()
    try {
      sys?.session?.stop()
    } catch {
      /* already ended */
    }
    const f = this.feed
    this.feed = null
    if (!f) return
    f.stream.getTracks().forEach((t) => t.stop())
    void f.ac.close().catch(() => {})
  }

  private analyser(): { node: AnalyserNode; comp: number } | null {
    const src = this.deps.settings().vizSource
    let node: AnalyserNode | null = null
    let comp = 1
    if (src === 'flair') {
      const t = this.deps.tap()
      if (t) {
        node = t.node
        comp = 1 / Math.max(0.08, Math.min(1, t.level)) // the analyser sits behind the volume control
      }
    } else if (this.feed) node = this.feed.an
    if (!node) return null
    if (!this.configured.has(node)) {
      this.configured.add(node)
      node.fftSize = 2048
      node.smoothingTimeConstant = 0.5
      node.minDecibels = -85
      node.maxDecibels = -20
    }
    return { node, comp }
  }

  // ── the loop ──

  private startLoop() {
    if (this.raf || away()) return
    this.last = 0
    this.raf = requestAnimationFrame(this.frame)
  }
  private stopLoop() {
    if (this.raf) cancelAnimationFrame(this.raf)
    this.raf = 0
    if (this.poll) clearInterval(this.poll)
    this.poll = undefined
  }
  private clearAll() {
    for (const t of this.targets()) this.clear(t)
    for (const l of this.lanes.values()) {
      l.v.fill(0)
      l.pk.fill(0)
    }
  }
  private clear(t: Target) {
    t.g?.setTransform(1, 0, 0, 1, 0, 0)
    t.g?.clearRect(0, 0, t.el.width, t.el.height)
  }
  private targets(): Target[] {
    return [this.bg, this.left, this.right, ...(this.win ? [this.win.t] : [])]
  }

  private goQuiet() {
    this.quiet = true
    if (this.raf) cancelAnimationFrame(this.raf)
    this.raf = 0
    this.clearAll()
    // The desktop app's frames wake it themselves (they stop while nothing is audible), so there is nothing to poll.
    if (this.deps.settings().vizSource === 'system') {
      this.syncWindowMsg()
      this.report()
      return
    }
    // Looking for sound again costs a small read a few times a second, not a frame loop.
    this.poll = setInterval(() => {
      const a = this.analyser()
      if (!a) return
      const d = this.buffer(a.node)
      a.node.getByteFrequencyData(d)
      let m = 0
      for (let i = 0; i < d.length; i++) if (d[i] > m) m = d[i]
      if (m > 12) this.wake()
    }, 250)
    this.syncWindowMsg()
    this.report()
  }
  private wake() {
    if (this.poll) clearInterval(this.poll)
    this.poll = undefined
    this.quiet = false
    this.quietFor = 0
    this.startLoop()
    this.syncWindowMsg()
    this.report()
  }

  private buffer(node: AnalyserNode): Uint8Array<ArrayBuffer> {
    if (!this.bytes || this.bytes.length !== node.frequencyBinCount) this.bytes = new Uint8Array(node.frequencyBinCount)
    return this.bytes
  }

  private lane(n: number, channel: Channel = 'mono'): Lane {
    const key = `${channel}:${n}`
    let l = this.lanes.get(key)
    if (!l) this.lanes.set(key, (l = { v: new Float32Array(n), pk: new Float32Array(n), tmp: new Float32Array(n) }))
    return l
  }

  private frame = (now: number) => {
    this.raf = 0
    const s = this.deps.settings()
    if (!this.active || away()) return
    const saver = this.deps.saver()
    // About 30 fps unless Smooth motion is on: the desktop app's own frames arrive at 30 at most, and each redraw also makes the
    // browser re-blur whatever frosted glass sits behind the messages. Battery saver halves it again.
    const minMs = saver ? 60 : s.smoothMotion ? 0 : 30
    if (this.last && now - this.last < minMs) {
      this.raf = requestAnimationFrame(this.frame)
      return
    }
    const dt = this.last ? Math.min(0.1, (now - this.last) / 1000) : 1 / 60
    this.last = now

    if (now - this.lastLayout > 1000) this.layout()
    if (now - this.lastPal > 1000) {
      this.lastPal = now
      this.pal = this.deps.palette()
    }

    // One read of the analyser, then each target's own number of bands from it.
    const demo = s.vizSource === 'demo'
    const a = demo ? null : this.analyser()
    const system = s.vizSource === 'system' && this.sys?.ready ? this.sys : null
    const stereo = s.vizStereo && (demo || !!system?.hasStereo)
    let data: Uint8Array<ArrayBuffer> | null = null
    if (a) {
      data = this.buffer(a.node)
      a.node.getByteFrequencyData(data)
    }
    const gain = s.vizSensitivity * (a?.comp ?? 1)
    const noFlash = s.noFlash
    const kA = 1 - Math.pow(1 - (noFlash ? 0.3 : 0.75), dt * 60)
    const kR = 1 - Math.pow(1 - (0.04 + (1 - s.vizSmoothing) * 0.5), dt * 60)
    const t = (now - this.t0) / 1000

    const looks = this.look(s, saver)
    let energy = 0
    // Each channel/bar count is analysed once, even when several targets use it. Smoothing and peaks never cross channels.
    const readings = new Map<Lane, Channel>()
    const targets = this.targets().filter((tg) => tg.visible && tg.n)
    const channels = (tg: Target): Channel[] => !stereo ? ['mono'] :
      tg.kind === 'left' || tg.kind === 'right' ? [tg.kind] : ['left', 'right']
    const count = (tg: Target) => stereo && (tg.kind === 'win' || tg.kind === 'bg') ? Math.max(4, Math.ceil(tg.n / 2)) : tg.n
    for (const tg of targets) for (const channel of channels(tg)) readings.set(this.lane(count(tg), channel), channel)
    for (const [lane, channel] of readings) {
      const n = lane.v.length
      if (demo) synth(lane.tmp, t + (channel === 'right' ? 0.7 : 0))
      else if (system) readSystemBands(channel === 'mono' ? system.bands : system[channel]!, lane.tmp, gain)
      else if (data) readBands(data, this.edges(n, data.length, a!.node.context.sampleRate), lane.tmp, gain)
      else lane.tmp.fill(0)
      for (let i = 0; i < n; i++) {
        const x = lane.tmp[i]
        lane.v[i] += (x - lane.v[i]) * (x > lane.v[i] ? kA : kR)
        lane.pk[i] = Math.max(lane.v[i], lane.pk[i] - dt * 0.4)
        if (lane.v[i] > energy) energy = lane.v[i]
      }
    }

    for (const tg of targets) {
      const [first, second] = channels(tg)
      const n = count(tg)
      this.paint(tg, this.lane(n, first), looks, s, second ? this.lane(n, second) : undefined)
    }

    if (!demo && energy < 0.01) {
      this.quietFor += dt
      if (this.quietFor > 1.2) {
        this.goQuiet()
        return
      }
    } else {
      this.quietFor = 0
      if (this.quiet) {
        this.quiet = false
        this.syncWindowMsg()
        this.report()
      }
    }
    this.raf = requestAnimationFrame(this.frame)
  }

  private edges(n: number, bins: number, sr: number): number[] {
    const key = `${n}:${bins}:${sr}`
    let e = this.edgeCache.get(key)
    if (!e) {
      if (this.edgeCache.size > 12) this.edgeCache.clear()
      this.edgeCache.set(key, (e = bandEdges(n, bins, sr)))
    }
    return e
  }

  private look(s: FlairSettings, saver: boolean): Look {
    const [a, b] = s.vizColor === 'custom' ? [s.vizColorA, s.vizColorB] : this.pal
    return {
      style: s.vizStyle,
      fill: s.vizBarFill,
      round: s.vizRound,
      peaks: s.vizPeaks,
      glow: saver || s.noFlash ? 0 : s.vizGlow,
      a,
      b,
      rainbow: s.vizColor === 'rainbow',
      up: s.vizGradientUp && s.vizStyle !== 'wave',
    }
  }

  /** Per-bar colours when the colour runs across the row (and always for the rainbow). */
  private colours(look: Look, n: number): string[] | null {
    if (look.style === 'wave' || (!look.rainbow && look.up)) return null
    const key = `${look.rainbow ? 'r' : look.a + look.b}:${n}`
    if (this.colCache.key !== key) {
      this.colCache = {
        key,
        cols: Array.from({ length: n }, (_, i) =>
          look.rainbow ? `hsl(${Math.round((i / Math.max(1, n - 1)) * 300)},85%,62%)` : lerpHex(look.a, look.b, i / Math.max(1, n - 1)),
        ),
      }
    }
    return this.colCache.cols
  }

  private fit(t: Target) {
    const w = t.el.clientWidth
    const h = t.el.clientHeight
    t.dirty = false
    if (!w || !h) {
      t.w = t.h = 0
      return
    }
    // The background layer covers the most pixels and is a soft decoration, so it is drawn at 1x.
    const dpr = Math.min(window.devicePixelRatio || 1, this.coarse || t.kind === 'bg' ? 1 : 1.5)
    const bw = Math.max(1, Math.round(w * dpr))
    const bh = Math.max(1, Math.round(h * dpr))
    if (t.el.width !== bw) t.el.width = bw
    if (t.el.height !== bh) t.el.height = bh
    t.w = w
    t.h = h
    t.dpr = dpr
  }

  private paint(t: Target, lane: Lane, look: Look, s: FlairSettings, right?: Lane) {
    if (t.dirty || !t.w) this.fit(t)
    const g = t.g
    if (!g || !t.w) return
    g.setTransform(1, 0, 0, 1, 0, 0)
    g.clearRect(0, 0, t.el.width, t.el.height)
    g.setTransform(t.dpr, 0, 0, t.dpr, 0, 0)
    // Rotate the frame so bars always stand on a baseline: the strips stand on the chat's edge, bass at the bottom.
    let L = t.w
    let T = t.h
    if (t.kind === 'left') {
      g.transform(0, -1, 1, 0, 0, t.h)
      L = t.h
      T = t.w
    } else if (t.kind === 'right') {
      g.transform(0, -1, -1, 0, t.w, t.h)
      L = t.h
      T = t.w
    } else if (t.kind === 'bg' && s.vizBgTop) g.transform(1, 0, 0, -1, 0, t.h)

    if (right) {
      const gap = 4
      const half = (L - gap) / 2
      g.save()
      this.paintLane(g, half, T, lane, look, s)
      g.restore()
      g.save()
      g.translate(half + gap, 0)
      this.paintLane(g, half, T, right, look, s)
      g.restore()
    } else this.paintLane(g, L, T, lane, look, s)
  }

  private paintLane(g: CanvasRenderingContext2D, L: number, T: number, lane: Lane, look: Look, s: FlairSettings) {
    // Centre mirror: reorder what is drawn (not what is measured), so the colours follow the frequency too.
    let v = lane.v
    let pk = lane.pk
    let cols = this.colours(look, lane.v.length)
    if (s.vizCenter) {
      const n = lane.v.length
      const key = `${n}:${s.vizCenterFlip}`
      let c = this.centered.get(key)
      if (!c) this.centered.set(key, (c = { map: centerMap(n, s.vizCenterFlip), v: new Float32Array(n), pk: new Float32Array(n) }))
      for (let j = 0; j < n; j++) {
        c.v[j] = lane.v[c.map[j]]
        c.pk[j] = lane.pk[c.map[j]]
      }
      v = c.v
      pk = c.pk
      if (cols) cols = c.map.map((i) => cols![i])
    }
    if (look.style === 'wave' && look.rainbow) {
      const grad = g.createLinearGradient(0, 0, L, 0)
      for (let i = 0; i <= 5; i++) grad.addColorStop(i / 5, `hsl(${i * 60},85%,62%)`)
      g.fillStyle = g.strokeStyle = grad
    } else if (!cols) {
      // The second colour is reached at ~70% of the height (~85% of the half-height when mirrored): bars rarely get higher,
      // and a gradient that only finished at the very top would hide it in all but the loudest music.
      const grad = look.style === 'mirror' ? g.createLinearGradient(0, T * 0.15, 0, T * 0.85) : g.createLinearGradient(0, T, 0, T * 0.3)
      if (look.style === 'mirror') {
        grad.addColorStop(0, look.b)
        grad.addColorStop(0.5, look.a)
        grad.addColorStop(1, look.b)
      } else {
        grad.addColorStop(0, look.a)
        grad.addColorStop(1, look.b)
      }
      g.fillStyle = g.strokeStyle = grad
    } else g.strokeStyle = look.rainbow ? 'hsl(190,85%,62%)' : look.b

    const bw = (L / v.length) * look.fill
    if (look.glow > 0) {
      g.globalAlpha = 0.2 * look.glow
      shapes(g, L, T, v, pk, look, cols, 1 + look.glow * Math.min(7, 1 + bw * 0.4))
      g.globalAlpha = 1
    }
    shapes(g, L, T, v, pk, look, cols, 0)
    if (look.style === 'wave') {
      g.lineWidth = 2
      g.stroke()
    }
  }

  // ── side strips ──

  /** Place the strips in the free space beside the chat column. */
  private layout() {
    this.lastLayout = performance.now()
    const view = document.querySelector<HTMLElement>('[data-component="ChatView"]')
    const list = view?.querySelector<HTMLElement>('[data-component="MessageList"]')
    const want = this.deps.settings()
    if (!this.sidesWanted || !view || !list) {
      this.left.el.style.display = this.right.el.style.display = 'none'
      this.left.visible = this.right.visible = false
      return
    }
    const vr = view.getBoundingClientRect()
    const lr = list.getBoundingClientRect()
    const scale = vr.width / (view.offsetWidth || vr.width) || 1
    const place = (t: Target, space: number, side: 'l' | 'r') => {
      const w = Math.min(want.vizSideWidth, Math.floor(space - GAP))
      const show = w >= SIDE_MIN
      t.el.style.display = show ? 'block' : 'none'
      if (!show) {
        t.visible = false
        return
      }
      t.visible = true
      t.el.style.width = `${w}px`
      if (side === 'l') {
        t.el.style.left = `${Math.round(space - GAP - w)}px`
        t.el.style.right = 'auto'
      } else {
        t.el.style.right = `${Math.round(space - GAP - w)}px`
        t.el.style.left = 'auto'
      }
    }
    place(this.left, (lr.left - vr.left) / scale, 'l')
    place(this.right, (vr.right - lr.right) / scale, 'r')
  }

  // ── the floating window ──

  private winSize() {
    const s = this.deps.settings().vizWindowSize
    return s ?? { w: 320, h: 150 }
  }
  private clampWin(p: { x: number; y: number }, d = this.winSize()) {
    const maxX = Math.max(0, window.innerWidth - d.w - 4)
    const maxY = Math.max(0, window.innerHeight - d.h - 4)
    return { x: Math.round(Math.max(4, Math.min(maxX, p.x))), y: Math.round(Math.max(4, Math.min(maxY, p.y))) }
  }
  private keepWindowOnScreen() {
    const w = this.win?.w
    if (!w) return
    const p = w.getPosition()
    const c = this.clampWin(p)
    if (c.x !== p.x || c.y !== p.y) w.moveTo(c.x, c.y)
  }

  private openWindow() {
    if (this.win) return
    const d = this.winSize()
    const saved = this.deps.settings().vizWindowPos
    const pos = this.clampWin(saved ?? { x: window.innerWidth - d.w - 24, y: window.innerHeight - d.h - 130 }, d)
    let w: FloatWidget
    try {
      w = this.ctx.ui.createFloatWidget({ width: d.w, height: d.h, initialPosition: pos, snapToEdge: false, tooltip: tr('Audio visualizer'), chromeless: true })
    } catch (err) {
      console.warn('[Lumi Flair] Visualizer window unavailable', err)
      return
    }
    const el = document.createElement('div')
    el.className = 'lf-vzw'
    el.setAttribute('role', 'group')
    el.setAttribute('aria-label', tr('Audio visualizer'))
    el.style.width = `${d.w}px`
    el.style.height = `${d.h}px`
    el.innerHTML =
      `<canvas class="lf-vzw-cv" aria-hidden="true"></canvas>` +
      `<div class="lf-vzw-msg" hidden><span></span><button type="button" class="lf-vzw-go"></button></div>` +
      `<div class="lf-vzw-tools"><button type="button" class="lf-vzw-plug"></button><button type="button" class="lf-vzw-x"></button></div>` +
      `<div class="lf-vzw-grip" role="separator">${ICON_GRIP}</div>`
    const cv = el.querySelector('.lf-vzw-cv') as HTMLCanvasElement
    const msg = el.querySelector('.lf-vzw-msg') as HTMLElement
    const text = msg.querySelector('span') as HTMLElement
    const go = msg.querySelector('.lf-vzw-go') as HTMLButtonElement
    const plug = el.querySelector('.lf-vzw-plug') as HTMLButtonElement
    const x = el.querySelector('.lf-vzw-x') as HTMLButtonElement
    const grip = el.querySelector('.lf-vzw-grip') as HTMLElement
    go.textContent = tr('Connect audio')
    go.addEventListener('click', () => void this.connect())
    plug.innerHTML = ICON_PLUG
    plug.title = plug.ariaLabel = tr('Connect audio')
    plug.addEventListener('click', () => void this.connect())
    x.innerHTML = ICON_CLOSE
    x.title = tr('Hide this window')
    x.setAttribute('aria-label', tr('Hide this window'))
    x.addEventListener('click', () => this.deps.update({ vizWindow: false }))
    // The host drags from anywhere that doesn't stop the press; the buttons and the grip handle their own.
    for (const c of [plug, x, grip, go]) for (const ev of ['pointerdown', 'mousedown', 'touchstart'] as const) c.addEventListener(ev, (e) => e.stopPropagation())
    // go sits in a pointer-events:none overlay but is itself clickable.

    // Resize from the corner.
    grip.addEventListener('pointerdown', (e) => {
      e.preventDefault()
      try {
        grip.setPointerCapture(e.pointerId)
      } catch {
        /* ignore */
      }
      const r = el.getBoundingClientRect()
      const k = r.width / (el.offsetWidth || r.width) || 1 // the page may be zoomed
      const start = { x: e.clientX, y: e.clientY, w: el.offsetWidth, h: el.offsetHeight }
      const p = w.getPosition()
      const move = (ev: PointerEvent) => {
        const nw = Math.round(Math.max(VIZ_WIN_MIN.w, Math.min(VIZ_WIN_MAX.w, window.innerWidth - p.x - 4, start.w + (ev.clientX - start.x) / k)))
        const nh = Math.round(Math.max(VIZ_WIN_MIN.h, Math.min(VIZ_WIN_MAX.h, window.innerHeight - p.y - 4, start.h + (ev.clientY - start.y) / k)))
        el.style.width = `${nw}px`
        el.style.height = `${nh}px`
        w.setSize(nw, nh)
      }
      const up = () => {
        grip.removeEventListener('pointermove', move)
        grip.removeEventListener('pointerup', up)
        grip.removeEventListener('pointercancel', up)
        this.deps.update({ vizWindowSize: { w: el.offsetWidth, h: el.offsetHeight } })
      }
      grip.addEventListener('pointermove', move)
      grip.addEventListener('pointerup', up)
      grip.addEventListener('pointercancel', up)
    })

    w.root.appendChild(el)
    const t: Target = { kind: 'win', el: cv, g: cv.getContext('2d'), w: 0, h: 0, dpr: 1, dirty: true, visible: true, n: this.deps.settings().vizBars }
    const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(() => (t.dirty = true)) : null
    ro?.observe(cv)
    const unDrag = w.onDragEnd((p) => {
      const c = this.clampWin(p)
      if (c.x !== p.x || c.y !== p.y) w.moveTo(c.x, c.y)
      this.deps.update({ vizWindowPos: c })
    })
    this.win = { w, el, t, msg, text, go, tools: plug, unDrag, ro }
    this.syncWindowMsg()
  }

  /** Words inside the window when there is nothing to see yet. */
  private syncWindowMsg() {
    const win = this.win
    if (!win) return
    const s = this.deps.settings()
    const st = this.state()
    const share = this.needsConnection(s.vizSource)
    win.tools.style.display = share ? '' : 'none'
    const text =
      st === 'connect' || st === 'error'
        ? this.error ??
          (s.vizSource === 'tab'
            ? tr('Share a tab or your screen with its sound')
            : s.vizSource === 'system'
              ? tr('Listen to your computer’s sound')
              : tr('Listen through the microphone'))
        : st === 'quiet'
          ? s.vizSource === 'flair'
            ? tr('Waiting for Flair sounds — turn on Soundscapes or play an “Always play” track')
            : tr('Listening…')
          : ''
    win.text.textContent = text
    win.go.style.display = st === 'connect' || st === 'error' ? '' : 'none'
    win.msg.hidden = !text
  }

  private closeWindow() {
    const win = this.win
    if (!win) return
    this.win = null
    win.ro?.disconnect()
    win.unDrag()
    try {
      win.w.destroy()
    } catch {
      /* already gone (permission revoked) */
    }
  }

  destroy() {
    this.destroyed = true
    this.stopLoop()
    this.disconnect()
    this.closeWindow()
    this.ro?.disconnect()
    this.unPresence?.()
    window.removeEventListener('resize', this.onResize)
    for (const t of [this.bg, this.left, this.right]) {
      this.clear(t)
      t.el.remove()
    }
  }
}
