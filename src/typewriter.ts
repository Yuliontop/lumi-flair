/**
 * Typewriter pacing (v1.4): a streaming reply is revealed at a steady pace instead of in bursts, with soft
 * key sounds.
 *
 * Nothing in the host's DOM is touched. The host renders the text as it arrives (and wraps each new chunk
 * in a fading span of its own); we only paint the part not revealed yet as transparent, through the CSS
 * Custom Highlight API: one `Range` from the reveal point to the end of the message, registered as the
 * `lf-typewriter` highlight. While a reply streams, a MutationObserver re-hides new text in the same task the
 * host adds it (before the browser paints, so it never flashes), and a frame loop moves the reveal point
 * along while there is something left to reveal.
 *
 * Pace: `cps` characters a second, but never more than about 1.5 s behind the text that has arrived (so the
 * host's scroll-to-bottom never runs far ahead of what you can read), and once the reply has ended the rest
 * comes out within about 0.6 s. Text inside closed <details> (reasoning blocks) doesn't hold the reveal up.
 */

export const TYPEWRITER_CSS = `
::highlight(lf-typewriter) { color: transparent; text-shadow: none; text-decoration-color: transparent; }
`
const NAME = 'lf-typewriter'
/** The most we lag behind the text that has arrived, in seconds of reading at the chosen pace. */
const MAX_BEHIND_S = 1.5
/** After the reply ends, whatever is left is revealed in this long. */
const FINISH_S = 0.6
/** Anything beyond MAX_BEHIND_S is worked off in about this long (a big burst comes out briskly, then the pace returns). */
const CATCH_UP_S = 0.5
/** Key sounds: never closer together than this, and one every 2-4 characters. */
const KEY_GAP_MS = 55

type HighlightCtor = new (...ranges: Range[]) => unknown
interface HighlightRegistry {
  set(name: string, h: unknown): void
  delete(name: string): void
  has(name: string): boolean
}
const registry = (): HighlightRegistry | null => ((globalThis as { CSS?: { highlights?: HighlightRegistry } }).CSS?.highlights ?? null)
const HighlightClass = (): HighlightCtor | null => ((globalThis as { Highlight?: HighlightCtor }).Highlight ?? null)

/** The browser can do it (Chrome/Edge 105+, Safari 17.2+, Firefox 140+). */
export const typewriterSupported = () => !!registry() && !!HighlightClass()

export interface TypewriterHooks {
  get(): { on: boolean; cps: number }
  /** False when motion should be reduced: the reveal is skipped. */
  motion(): boolean
  /** The message being written right now, or the one with this id. */
  content(id: string | null): HTMLElement | null
  /** The message list, watched while a reply streams. */
  list(): HTMLElement | null
  /** A key was "typed". `space`: it was a space (a softer, lower key). */
  key(space: boolean): void
}

interface Measure {
  nodes: Text[]
  lens: number[]
  total: number
}

/** The visible text nodes of a message (closed <details> are skipped: you can't see them, so they mustn't hold the reveal up). */
function measure(el: HTMLElement): Measure {
  const nodes: Text[] = []
  const lens: number[] = []
  let total = 0
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
  while (walker.nextNode()) {
    const t = walker.currentNode as Text
    const p = t.parentElement
    if (!t.length || !p) continue
    // Only blocks inside the message count (the panel's preview, for one, lives inside a <details> section).
    const closed = p.closest('details:not([open])')
    if (closed && el.contains(closed) && !p.closest('summary')) continue
    const code = p.closest('style, script')
    if (code && el.contains(code)) continue
    nodes.push(t)
    lens.push(t.length)
    total += t.length
  }
  return { nodes, lens, total }
}

export class Typewriter {
  private active = false // a reply is streaming (or still being revealed after it ended)
  private finishing = false
  private finishBy = 0 // when the rest must be out, once the reply has ended
  private id: string | null = null
  private el: HTMLElement | null = null
  private shown = 0
  private base: number | null = null // continue: what was already there is not typed again
  private raf = 0
  private last = 0
  private observer: MutationObserver | null = null
  private nextKeyAt = 0
  private lastKey = 0
  private demo: HTMLElement | null = null
  private safety: ReturnType<typeof setTimeout> | undefined

  constructor(private h: TypewriterHooks) {}

  get supported() {
    return typewriterSupported()
  }

  private enabled() {
    return this.supported && this.h.get().on && this.h.motion()
  }

  /** A reply started. `keepFrom`: a message being continued (its text so far is shown as it is). */
  start(keepFrom?: string | null) {
    this.stop()
    if (!this.enabled()) return
    this.active = true
    this.finishing = false
    this.id = keepFrom ?? null
    const prev = keepFrom ? this.h.content(keepFrom) : null
    this.base = prev ? measure(prev).total : null
    this.shown = 0
    this.nextKeyAt = 0
    const list = this.h.list()
    if (list) {
      this.observer = new MutationObserver(() => this.sync())
      this.observer.observe(list, { childList: true, subtree: true, characterData: true })
    }
    this.armSafety()
    this.sync()
  }

  /** The reply ended (or was stopped): reveal the rest briskly, then let go. */
  end() {
    if (!this.active) return
    this.finishing = true
    this.finishBy = performance.now() + FINISH_S * 1000
    this.sync()
    this.kick()
  }

  /** Let go at once: show everything (chat switched, switched off, disposed). */
  stop() {
    this.active = false
    this.finishing = false
    this.observer?.disconnect()
    this.observer = null
    cancelAnimationFrame(this.raf)
    this.raf = 0
    clearTimeout(this.safety)
    this.safety = undefined
    this.el = null
    this.id = null
    this.demo = null
    registry()?.delete(NAME)
  }

  /** Type out the text of `el` (the panel's preview), as if it had just arrived all at once. */
  preview(el: HTMLElement) {
    this.stop()
    if (!this.supported) return
    this.active = true
    // A preview has no "reply ended" to wait for: it is all there, so it runs out at the chosen pace and stops.
    this.finishing = true
    this.demo = el
    this.shown = 0
    this.nextKeyAt = 0
    this.armSafety()
    this.sync()
    this.kick()
  }

  private armSafety() {
    clearTimeout(this.safety)
    // Whatever happens (a lost "ended" event), never leave text hidden for long.
    this.safety = setTimeout(() => this.stop(), 5 * 60_000)
  }

  private target(): HTMLElement | null {
    if (this.demo) return this.demo.isConnected ? this.demo : null
    const el = this.h.content(this.id)
    if (el) {
      const card = el.closest('[data-message-id]') as HTMLElement | null
      if (card?.dataset.messageId) this.id = card.dataset.messageId
    }
    return el
  }

  /** Hide what isn't revealed yet (called whenever the text changes, before it is painted). */
  private sync() {
    if (!this.active) return
    if (!this.demo && !this.enabled()) return this.stop()
    const el = this.target()
    if (!el) {
      if (this.finishing) this.stop()
      return
    }
    if (el !== this.el) {
      this.el = el
      if (this.base !== null) this.shown = Math.max(this.shown, this.base)
    }
    const m = measure(el)
    if (this.shown > m.total) this.shown = m.total // the host re-rendered it shorter
    this.paint(m)
    if (m.total > this.shown) this.kick()
  }

  private paint(m: Measure) {
    const reg = registry()
    const H = HighlightClass()
    if (!reg || !H) return
    let at = Math.floor(this.shown)
    if (at >= m.total || !m.nodes.length) {
      reg.delete(NAME)
      return
    }
    let i = 0
    while (i < m.nodes.length && at >= m.lens[i]) {
      at -= m.lens[i]
      i++
    }
    const last = m.nodes[m.nodes.length - 1]
    const range = document.createRange()
    range.setStart(m.nodes[i], at)
    range.setEnd(last, last.length)
    reg.set(NAME, new H(range))
  }

  private kick() {
    if (this.raf || !this.active) return
    this.last = 0
    this.raf = requestAnimationFrame(this.tick)
  }

  private tick = (now: number) => {
    this.raf = 0
    if (!this.active) return
    if (!this.demo && !this.enabled()) return this.stop()
    const el = this.target()
    if (!el) return this.finishing ? this.stop() : undefined
    this.el = el
    const m = measure(el)
    if (this.shown > m.total) this.shown = m.total
    const backlog = m.total - this.shown
    if (backlog <= 0) {
      this.paint(m)
      // Caught up. Mid-reply the observer wakes us for the next words; after it, we're done.
      if (this.finishing) this.stop()
      return
    }
    if (!this.last) {
      this.last = now
      this.raf = requestAnimationFrame(this.tick)
      return
    }
    const dt = Math.min(0.1, (now - this.last) / 1000)
    this.last = now
    const cps = Math.max(5, this.h.get().cps)
    let rate = cps
    // Further behind than we allow: work the excess off quickly (linearly, so it really gets there).
    const excess = backlog - cps * MAX_BEHIND_S
    if (excess > 0) rate = cps + excess / CATCH_UP_S
    // The reply has ended: everything left is out by the deadline.
    if (this.finishing && !this.demo) rate = Math.max(rate, backlog / Math.max(0.05, (this.finishBy - now) / 1000))
    const before = Math.floor(this.shown)
    this.shown = Math.min(m.total, this.shown + rate * dt)
    const after = Math.floor(this.shown)
    if (after > before) this.keys(m, after, now)
    this.paint(m)
    this.raf = requestAnimationFrame(this.tick)
  }

  /** A soft key every few characters (not faster than the ear likes), a lower one for a space. */
  private keys(m: Measure, at: number, now: number) {
    if (at < this.nextKeyAt || now - this.lastKey < KEY_GAP_MS) return
    this.nextKeyAt = at + 2 + Math.floor(Math.random() * 3)
    this.lastKey = now
    let i = 0
    let off = at - 1
    while (i < m.nodes.length && off >= m.lens[i]) {
      off -= m.lens[i]
      i++
    }
    const ch = m.nodes[i]?.data[off] ?? ''
    try {
      this.h.key(/\s/.test(ch))
    } catch {
      /* sound is a nicety */
    }
  }
}
