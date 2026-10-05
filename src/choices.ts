/**
 * Choice chips: the AI ends a reply with 2–3 options —
 *   <flair-choice>Follow her into the forest</flair-choice>
 * which render as glowing buttons under the latest reply. Clicking one fills
 * the composer (or sends it, if the user enabled that).
 */
import type { SpindleFrontendContext } from 'lumiverse-spindle-types'

export const CHOICES_CSS = `
.lf-choices { display: flex; flex-wrap: wrap; gap: 8px; padding: 10px 14px 12px; }
.lf-choice { position: relative; display: inline-flex; align-items: center; gap: 6px; max-width: 100%;
  padding: 7px 14px; border-radius: 999px; cursor: pointer; font: inherit; font-size: calc(13px * var(--lumiverse-font-scale, 1));
  color: var(--lumiverse-text); text-align: left; line-height: 1.35;
  background: color-mix(in srgb, var(--lf-c, var(--lumiverse-primary)) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--lf-c, var(--lumiverse-primary)) 45%, transparent);
  box-shadow: 0 0 0 0 transparent;
  opacity: 0; transform: translateY(6px);
  animation: lf-choice-in .45s cubic-bezier(.2,.9,.3,1.2) forwards;
  transition: background .2s ease, box-shadow .25s ease, transform .15s ease; }
.lf-choice:nth-child(2) { animation-delay: .08s; }
.lf-choice:nth-child(3) { animation-delay: .16s; }
.lf-choice:nth-child(4) { animation-delay: .24s; }
.lf-choice::before { content: '✦'; font-size: .85em; color: var(--lf-c, var(--lumiverse-primary)); }
.lf-choice:hover { background: color-mix(in srgb, var(--lf-c, var(--lumiverse-primary)) 22%, transparent);
  box-shadow: 0 0 calc(var(--lf-room, 14px) * .8) color-mix(in srgb, var(--lf-c, var(--lumiverse-primary)) 45%, transparent); }
.lf-choice:active { transform: scale(.97); }
.lf-choice:focus-visible { outline: 1.5px solid var(--lumiverse-primary-050); outline-offset: 2px; }
.lf-choices.lf-used .lf-choice:not(.lf-picked) { opacity: .35 !important; }
.lf-choice.lf-picked { background: color-mix(in srgb, var(--lf-c, var(--lumiverse-primary)) 30%, transparent); }
@keyframes lf-choice-in { to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) { .lf-choice { animation: none; opacity: 1; transform: none; } }
`

function setComposer(text: string): boolean {
  const ta = document.querySelector<HTMLTextAreaElement>('[data-component="InputArea"] textarea')
  if (!ta) return false
  // React tracks the value through the native setter; set it that way so the composer state updates.
  const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set
  setter ? setter.call(ta, text) : (ta.value = text)
  ta.dispatchEvent(new Event('input', { bubbles: true }))
  ta.focus()
  ta.setSelectionRange(text.length, text.length)
  return true
}

function clickSend(): boolean {
  const btn = document.querySelector<HTMLButtonElement>('[data-component="InputArea"] button[class*="sendBtn"]:not([disabled])')
  if (!btn) return false
  btn.click()
  return true
}

const MAX_OPTIONS = 4
const TAG_RE = /<flair-choice\b[^>]*>([\s\S]*?)<\/flair-choice>/gi
const cleanOption = (text: string) => text.replace(/<[^>]*>/g, '').trim().slice(0, 160)
const sameOptions = (a: string[], b: string[]) => a.length === b.length && a.every((x, i) => x === b[i])

/** The options written into a message's text: the same ones the tag interceptor delivers for it. */
export function choicesIn(content: string): string[] {
  const out: string[] = []
  for (const m of content.matchAll(TAG_RE)) {
    const clean = cleanOption(m[1] ?? '')
    if (clean && !out.includes(clean)) out.push(clean)
    if (out.length >= MAX_OPTIONS) break
  }
  return out
}

export class ChoiceManager {
  /**
   * messageId → the options of the variant (swipe) on screen. `fixed` once a swipe event has spelled them out from
   * the swipe's own text: the host delivers a tag only once per message and exact text, so a swipe back to a variant
   * we have already seen would otherwise bring nothing, and a new one would pile its options onto the old ones.
   */
  private pending = new Map<string, { options: string[]; fixed: boolean }>()
  private rendered: { messageId: string; el: Element; options: string[] } | null = null
  onPick: ((text: string) => void) | null = null
  enabled = true
  sendOnPick = false

  constructor(private ctx: SpindleFrontendContext) {}

  /** Collect an option from a tag intercept. Rendering is debounced so all options arrive first. */
  add(messageId: string, text: string) {
    const clean = cleanOption(text)
    if (!clean) return
    const entry = this.pending.get(messageId) ?? { options: [], fixed: false }
    if (entry.fixed) return // a swipe event already told us what this variant offers
    if (!entry.options.includes(clean) && entry.options.length < MAX_OPTIONS) entry.options.push(clean)
    this.pending.set(messageId, entry)
    queueMicrotask(() => setTimeout(() => this.renderFor(messageId), 30))
  }

  /**
   * The active swipe of a message changed (the user navigated to another, one was added, filled in, edited or
   * deleted). Its own text says what the chips are now: they replace the old ones, they don't add to them.
   */
  swiped(messageId: string, content: string) {
    if (!this.enabled) return
    this.pending.set(messageId, { options: choicesIn(content), fixed: true })
    this.renderFor(messageId)
  }

  private renderFor(messageId: string) {
    if (!this.enabled) return
    const shown = this.rendered?.messageId === messageId ? this.rendered : null
    // Only the newest message gets chips.
    if (this.ctx.messages.getLatestMessageId() !== messageId) {
      if (shown) this.hide()
      return
    }
    const options = this.pending.get(messageId)?.options ?? []
    if (!options.length) {
      if (shown) this.hide() // this variant offers nothing: the old chips must not stay
      return
    }
    if (shown && shown.el.isConnected && sameOptions(shown.options, options)) return
    // findMessageElement returns the virtual row; put the chips below the card, inside the row,
    // so the host's injection registry replays them when the row remounts.
    const el = this.ctx.dom.findMessageElement(messageId)
    if (!el) return
    const isCard = el.matches(':is([data-component="BubbleMessage"],[data-component="MinimalMessage"])')
    this.hide()
    const html = `<div class="lf-choices" role="group" aria-label="Suggested replies">${options
      .map((o, i) => `<button type="button" class="lf-choice" data-lf-choice="${i}"></button>`)
      .join('')}</div>`
    const wrap = this.ctx.dom.inject(el, html, isCard ? 'afterend' : 'beforeend')
    wrap.querySelectorAll<HTMLButtonElement>('.lf-choice').forEach((btn, i) => {
      btn.textContent = options[i]
      btn.addEventListener('click', (e) => {
        e.stopPropagation()
        const box = wrap.querySelector('.lf-choices')
        box?.classList.add('lf-used')
        btn.classList.add('lf-picked')
        setComposer(options[i])
        if (this.sendOnPick) setTimeout(() => clickSend(), 60)
        this.onPick?.(options[i])
      })
    })
    this.rendered = { messageId, el: wrap, options: [...options] }
  }

  /**
   * A reply is being continued: take the chips down but keep the options it had. Its new text arrives through the
   * tag interceptor (a continue fires no swipe event), so the options are open to additions again.
   */
  pause() {
    this.hide()
    for (const entry of this.pending.values()) entry.fixed = false
  }

  /** Take the chips down but keep what we know. */
  hide() {
    const r = this.rendered
    if (!r) return
    this.rendered = null
    this.ctx.dom.uninject(r.el)
    // The host remembers injections and puts them back when a row remounts. If one of those replays is already
    // queued it would bring this old set back on top of the new one, so leave nothing in it to show.
    r.el.replaceChildren()
    ;(r.el as HTMLElement).hidden = true
  }

  /** Remove the chips and forget their options (a new message arrived, the user sent something, the chat changed). */
  clear() {
    this.hide()
    this.pending.clear()
  }
}
