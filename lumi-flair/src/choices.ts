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

export class ChoiceManager {
  private pending = new Map<string, string[]>() // messageId → options (collected per render pass)
  private rendered: { messageId: string; el: Element } | null = null
  onPick: ((text: string) => void) | null = null
  enabled = true
  sendOnPick = false

  constructor(private ctx: SpindleFrontendContext) {}

  /** Collect an option from a tag intercept. Rendering is debounced so all options arrive first. */
  add(messageId: string, text: string) {
    const clean = text.replace(/<[^>]*>/g, '').trim().slice(0, 160)
    if (!clean) return
    const list = this.pending.get(messageId) ?? []
    if (!list.includes(clean)) list.push(clean)
    this.pending.set(messageId, list.slice(0, 4))
    queueMicrotask(() => setTimeout(() => this.renderFor(messageId), 30))
  }

  private renderFor(messageId: string) {
    if (!this.enabled) return
    // Only the newest message gets chips.
    if (this.ctx.messages.getLatestMessageId() !== messageId) return
    const options = this.pending.get(messageId)
    if (!options?.length) return
    if (this.rendered?.messageId === messageId && this.rendered.el.isConnected) {
      if (this.rendered.el.querySelectorAll('.lf-choice').length === options.length) return
    }
    // findMessageElement returns the virtual row; put the chips below the card, inside the row,
    // so the host's injection registry replays them when the row remounts.
    const el = this.ctx.dom.findMessageElement(messageId)
    if (!el) return
    const isCard = el.matches(':is([data-component="BubbleMessage"],[data-component="MinimalMessage"])')
    this.clear()
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
    this.rendered = { messageId, el: wrap }
  }

  /** Remove chips (a new message arrived or the user sent something). */
  clear() {
    if (this.rendered) {
      this.ctx.dom.uninject(this.rendered.el)
      this.rendered = null
    }
  }

  forget(messageId: string) {
    this.pending.delete(messageId)
  }
}
