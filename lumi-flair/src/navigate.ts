/**
 * Story navigator — jump to any message in the chat, even one that isn't
 * loaded yet.
 *
 * Lumiverse keeps only a window of recent messages loaded and virtualizes
 * the list (only rows near the viewport exist in the DOM). Its own "load
 * older" fires when the list is scrolled near the top. The navigator drives
 * exactly that native path: it nudges the real scroller to the top so
 * Lumiverse fetches the previous page, repeats until the message is in the
 * store, then homes in on the row until it mounts. While that happens a soft
 * "rewinding" veil covers the chat so the user sees a transition, not a
 * blur of scrolling, and the destination blooms into view at the end.
 */
import type { SpindleFrontendContext } from 'lumiverse-spindle-types'
import { tr } from './i18n'

/** missing = the host confirmed the message is gone; notfound = couldn't reach it this time. */
export type JumpResult = 'ok' | 'missing' | 'notfound' | 'cancelled' | 'unavailable'

const LIST = '[data-component="MessageList"]'
const ROW = '[data-virtual-index][data-message-id]'
const DESKTOP_TOP_THRESHOLD = 96
const MAX_MS = 45_000

export const NAVIGATE_CSS = `
.lf-veil { position: fixed; z-index: 2147483000; display: flex; align-items: center; justify-content: center; pointer-events: auto; cursor: pointer;
  opacity: 0; transition: opacity .28s ease; border-radius: 0;
  background: radial-gradient(ellipse at center, color-mix(in srgb, var(--lf-c, var(--lumiverse-primary)) 16%, transparent), transparent 70%),
              color-mix(in srgb, var(--lumiverse-bg, #0f0c18) 62%, transparent);
  -webkit-backdrop-filter: blur(14px) saturate(1.1); backdrop-filter: blur(14px) saturate(1.1); }
.lf-veil.lf-in { opacity: 1; }
.lf-veil-card { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 18px 22px; border-radius: 16px; min-width: 220px; text-align: center;
  color: var(--lumiverse-text); background: color-mix(in srgb, var(--lumiverse-bg-elevated, #1a1626) 82%, transparent);
  border: 1px solid color-mix(in srgb, var(--lf-c, var(--lumiverse-primary)) 40%, transparent);
  box-shadow: 0 10px 40px rgba(0,0,0,.35), 0 0 24px color-mix(in srgb, var(--lf-c, var(--lumiverse-primary)) 22%, transparent); }
.lf-veil-ico { width: 30px; height: 30px; color: var(--lf-c, var(--lumiverse-primary)); animation: lf-rewind 1.1s linear infinite; }
@keyframes lf-rewind { to { transform: rotate(-360deg); } }
.lf-veil-card b { font-size: calc(14px * var(--lumiverse-font-scale, 1)); }
.lf-veil-card small { font-size: calc(11px * var(--lumiverse-font-scale, 1)); color: var(--lumiverse-text-dim); }
.lf-veil-bar { width: 180px; height: 3px; border-radius: 3px; overflow: hidden; background: var(--lumiverse-fill, rgba(255,255,255,.08)); }
.lf-veil-bar i { display: block; height: 100%; width: 0%; border-radius: inherit; background: var(--lf-c, var(--lumiverse-primary));
  box-shadow: 0 0 10px var(--lf-c, var(--lumiverse-primary)); transition: width .35s ease; }
.lf-veil-bar.lf-indet i { width: 35%; animation: lf-indet 1.2s ease-in-out infinite; }
@keyframes lf-indet { 0% { transform: translateX(-110%); } 100% { transform: translateX(320%); } }
@media (prefers-reduced-motion: reduce) { .lf-veil-ico, .lf-veil-bar.lf-indet i { animation: none; } .lf-veil { transition: none; } }
`

const ICON = `<svg class="lf-veil-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/></svg>`

const frame = () => new Promise<void>((r) => requestAnimationFrame(() => r()))
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

export class StoryNavigator {
  private job: { cancelled: boolean } | null = null
  private veil: HTMLElement | null = null
  private bar: HTMLElement | null = null
  private sub: HTMLElement | null = null

  constructor(
    private ctx: SpindleFrontendContext,
    private host: () => HTMLElement,
    /** Called when the destination row is centred (play the arrival effect). */
    private onArrive: (messageId: string) => void,
  ) {}

  get busy() {
    return !!this.job
  }

  cancel() {
    if (this.job) this.job.cancelled = true
  }

  private list() {
    return document.querySelector<HTMLElement>(LIST)
  }

  private row(id: string) {
    const list = this.list()
    if (!list) return null
    const sel = `[data-message-id="${CSS.escape(id)}"]`
    return list.querySelector<HTMLElement>(`${ROW}${sel}`) ?? list.querySelector<HTMLElement>(sel)
  }

  private ids(): string[] {
    try {
      return this.ctx.messages.listMessageIds()
    } catch {
      return []
    }
  }

  private topThreshold(el: HTMLElement) {
    const coarse = window.matchMedia?.('(pointer: coarse)').matches
    return coarse ? Math.max(DESKTOP_TOP_THRESHOLD, Math.round(el.clientHeight * 1.15), 420) : DESKTOP_TOP_THRESHOLD
  }

  /** Message index in the full chat, if the host can tell us. null = the message is gone. */
  private async indexOf(id: string): Promise<number | null | undefined> {
    const get = this.ctx.messages.get
    if (!get) return undefined
    try {
      const dto = await get(id)
      return dto ? dto.index_in_chat : null
    } catch {
      return undefined
    }
  }

  async jump(id: string): Promise<JumpResult> {
    this.cancel()
    const job = { cancelled: false }
    this.job = job
    const started = performance.now()
    let veilTimer: ReturnType<typeof setTimeout> | undefined
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') job.cancelled = true
    }
    window.addEventListener('keydown', onKey, true)
    try {
      const el = this.list()
      if (!el) return 'unavailable'

      // Already on screen (or mounted just off it): a simple glide.
      const mounted = this.row(id)
      if (mounted) {
        this.glide(mounted, true)
        this.onArrive(id)
        return 'ok'
      }

      const targetIndex = await this.indexOf(id)
      if (targetIndex === null) return 'missing'
      if (job.cancelled) return 'cancelled'

      // Only show the veil if this is going to take a moment.
      veilTimer = setTimeout(() => !job.cancelled && this.showVeil(), 180)

      let firstIndexCache: { id: string; index: number | null } | null = null
      const lastId = this.ids().at(-1)
      const latest = lastId ? (await this.indexOf(lastId)) ?? null : null
      const progress = async () => {
        if (targetIndex === undefined || !this.bar) return
        const ids = this.ids()
        const first = ids[0]
        if (!first) return
        if (firstIndexCache?.id !== first) firstIndexCache = { id: first, index: (await this.indexOf(first)) ?? null }
        if (firstIndexCache.index == null || latest == null || latest <= targetIndex) return
        const pct = Math.max(4, Math.min(100, ((latest - firstIndexCache.index) / (latest - targetIndex)) * 100))
        // The veil may have closed while we were waiting on the host.
        const bar = this.bar
        if (!bar || job.cancelled) return
        bar.classList.remove('lf-indet')
        ;(bar.firstElementChild as HTMLElement).style.width = `${pct}%`
      }

      let stalls = 0
      while (!job.cancelled) {
        if (performance.now() - started > MAX_MS) return 'notfound'
        const list = this.list()
        if (!list) return 'unavailable'
        const row = this.row(id)
        if (row) {
          this.glide(row, !this.veil)
          await frame()
          // Virtualized rows re-measure as they mount; settle once more.
          const again = this.row(id)
          if (again) this.glide(again, false)
          this.onArrive(id)
          return 'ok'
        }

        const ids = this.ids()
        const k = ids.indexOf(id)
        if (k >= 0) {
          // Loaded but not mounted: home in using the rows that are mounted.
          const rows = [...list.querySelectorAll<HTMLElement>(ROW)]
          const pos = rows.map((r) => ({ r, k: ids.indexOf(r.dataset.messageId ?? '') })).filter((x) => x.k >= 0)
          if (!pos.length) {
            list.scrollTop = 0
            await this.settle()
            continue
          }
          const avg = pos.reduce((a, x) => a + x.r.getBoundingClientRect().height, 0) / pos.length || 200
          const lo = pos[0], hi = pos[pos.length - 1]
          const before = list.scrollTop
          if (k < lo.k) {
            if (before <= 1) {
              // The row is loaded but not yet revealed by the list's chunking — ask for more.
              if (!(await this.loadOlder(list))) stalls++
            } else list.scrollTop = Math.max(0, before - Math.max(list.clientHeight * 0.5, (lo.k - k) * avg))
          } else if (k > hi.k) {
            list.scrollTop = before + Math.max(list.clientHeight * 0.5, (k - hi.k) * avg)
          } else {
            // Between mounted rows (a gap in virtualization) — nudge towards it.
            list.scrollTop = before + (k - lo.k) * avg * 0.5
          }
          await this.settle()
        } else {
          // Older than everything loaded: go to the top and let Lumiverse fetch the previous page.
          const grew = await this.loadOlder(list)
          if (grew) stalls = 0
          else if (++stalls >= 3) return 'notfound'
          void progress()
        }
      }
      return 'cancelled'
    } finally {
      if (veilTimer) clearTimeout(veilTimer)
      window.removeEventListener('keydown', onKey, true)
      this.hideVeil()
      if (this.job === job) this.job = null
    }
  }

  /** Trigger Lumiverse's own top pagination and wait for the list to grow. */
  private async loadOlder(list: HTMLElement): Promise<boolean> {
    const thr = this.topThreshold(list)
    const countBefore = this.ids().length
    const heightBefore = list.scrollHeight
    const firstRowBefore = list.querySelector<HTMLElement>(ROW)?.dataset.messageId
    // Arm (the list only loads after the user has been below the threshold), then hit the top.
    if (list.scrollTop <= thr) {
      list.scrollTop = Math.min(list.scrollHeight, thr + 60)
      await frame()
      await frame()
    }
    list.scrollTop = 0
    const t0 = performance.now()
    while (performance.now() - t0 < 4000) {
      await sleep(60)
      if (this.ids().length !== countBefore) break
      if (list.scrollHeight !== heightBefore && list.querySelector<HTMLElement>(ROW)?.dataset.messageId !== firstRowBefore) break
    }
    await this.settle()
    return this.ids().length !== countBefore || list.scrollHeight !== heightBefore
  }

  private async settle() {
    await frame()
    await frame()
  }

  /** Centre a row. Smooth when the user can see it happen; instant under the veil. */
  private glide(row: HTMLElement, smooth: boolean) {
    const list = this.list()
    if (!list) return
    const lr = list.getBoundingClientRect()
    const rr = row.getBoundingClientRect()
    const target = list.scrollTop + (rr.top - lr.top) - (lr.height - Math.min(rr.height, lr.height * 0.8)) / 2
    list.scrollTo({ top: Math.max(0, target), behavior: smooth ? 'smooth' : 'auto' })
  }

  private showVeil() {
    const list = this.list()
    if (!list || this.veil) return
    const r = list.getBoundingClientRect()
    const v = document.createElement('div')
    v.className = 'lf-veil'
    v.setAttribute('role', 'status')
    v.setAttribute('aria-live', 'polite')
    Object.assign(v.style, { left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px` })
    const card = document.createElement('div')
    card.className = 'lf-veil-card'
    card.innerHTML = ICON
    const b = document.createElement('b')
    b.textContent = tr('Rewinding the story…')
    const bar = document.createElement('div')
    bar.className = 'lf-veil-bar lf-indet'
    bar.appendChild(document.createElement('i'))
    const sub = document.createElement('small')
    sub.textContent = tr('Click or press Esc to cancel')
    card.append(b, bar, sub)
    v.appendChild(card)
    v.addEventListener('click', () => this.cancel())
    this.host().appendChild(v)
    requestAnimationFrame(() => v.classList.add('lf-in'))
    this.veil = v
    this.bar = bar
    this.sub = sub
  }

  private hideVeil() {
    const v = this.veil
    if (!v) return
    this.veil = this.bar = this.sub = null
    v.classList.remove('lf-in')
    setTimeout(() => v.remove(), 320)
  }

  destroy() {
    this.cancel()
    this.veil?.remove()
    this.veil = null
  }
}
