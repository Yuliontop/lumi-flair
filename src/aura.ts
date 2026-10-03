/**
 * Character aura signatures: every character gets a signature colour sampled
 * from their avatar (the most vivid, well-lit hue), plus a signature particle
 * style derived from that hue. Character cards glow in their own colour — in
 * group chats you can see who is speaking at a glance.
 */
import type { BurstEffect } from './settings'

const CARD_SEL = ':is([data-component="BubbleMessage"],[data-component="MinimalMessage"])[data-message-id]'

export interface Aura {
  color: string // #rrggbb
  hue: number
  burst: BurstEffect
}

function toHex(r: number, g: number, b: number) {
  return '#' + [r, g, b].map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('')
}

/** Most vivid colour in an image: hue histogram weighted by saturation × mid-lightness. */
function sampleVivid(img: HTMLImageElement): Aura | null {
  const c = document.createElement('canvas')
  c.width = c.height = 32
  const g = c.getContext('2d', { willReadFrequently: true })
  if (!g) return null
  try {
    g.drawImage(img, 0, 0, 32, 32)
    const d = g.getImageData(0, 0, 32, 32).data
    const bins = Array.from({ length: 24 }, () => ({ w: 0, r: 0, g: 0, b: 0 }))
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] < 128) continue
      const r = d[i] / 255, gg = d[i + 1] / 255, b = d[i + 2] / 255
      const max = Math.max(r, gg, b), min = Math.min(r, gg, b)
      const l = (max + min) / 2
      const s = max === min ? 0 : (max - min) / (1 - Math.abs(2 * l - 1))
      if (s < 0.25 || l < 0.18 || l > 0.85) continue
      let h = 0
      if (max === r) h = ((gg - b) / (max - min) + 6) % 6
      else if (max === gg) h = (b - r) / (max - min) + 2
      else h = (r - gg) / (max - min) + 4
      const bin = bins[Math.floor((h * 60) / 15) % 24]
      const w = s * (1 - Math.abs(l - 0.55) * 1.6)
      bin.w += w
      bin.r += d[i] * w
      bin.g += d[i + 1] * w
      bin.b += d[i + 2] * w
    }
    let best = bins[0], bestIdx = 0
    bins.forEach((b, i) => {
      if (b.w > best.w) {
        best = b
        bestIdx = i
      }
    })
    if (best.w <= 0.5) return null
    // Lift towards a glow-friendly brightness.
    let r = best.r / best.w, gg = best.g / best.w, b = best.b / best.w
    const lum = (Math.max(r, gg, b) + Math.min(r, gg, b)) / 510
    const lift = lum < 0.55 ? (0.55 - lum) * 1.4 : 0
    r += (255 - r) * lift
    gg += (255 - gg) * lift
    b += (255 - b) * lift
    const hue = bestIdx * 15 + 7
    return { color: toHex(r, gg, b), hue, burst: burstForHue(hue) }
  } catch {
    return null // tainted canvas (cross-origin avatar) — skip
  }
}

/** Warm hues sparkle, greens get ripples, blues comets, pinks/purples confetti. */
function burstForHue(h: number): BurstEffect {
  if (h < 50 || h >= 330) return 'sparkle'
  if (h < 170) return 'ripple'
  if (h < 260) return 'comet'
  return 'confetti'
}

function cssString(v: string) {
  return v.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

export class AuraManager {
  private bySrc = new Map<string, Aura | 'pending' | 'none'>()
  private style: HTMLStyleElement
  private rulesKey = ''
  enabled = true
  /** Paint per-message aura glows (off = only sample colours, e.g. for the character theme). */
  paint = true
  /** Called when a new avatar colour has been sampled. */
  onChange: (() => void) | null = null

  constructor(style: HTMLStyleElement) {
    this.style = style
  }

  /** Character avatar <img> inside a card (Bubble uses a background avatar img, Minimal an avatar img). */
  private avatarOf(card: Element): HTMLImageElement | null {
    return card.querySelector<HTMLImageElement>('img[src]:not([data-lf-skip])')
  }

  /** Scan mounted character cards, sample any new avatars, and refresh the CSS rules. */
  scan() {
    if (!this.enabled) {
      if (this.rulesKey) {
        this.style.textContent = ''
        this.rulesKey = ''
      }
      return
    }
    const cards = document.querySelectorAll(`${CARD_SEL}:not([data-part="user"])`)
    cards.forEach((card) => {
      const img = this.avatarOf(card)
      const src = img?.getAttribute('src')
      if (!img || !src || this.bySrc.has(src)) return
      this.bySrc.set(src, 'pending')
      const probe = new Image()
      probe.crossOrigin = img.crossOrigin || null
      probe.onload = () => {
        this.bySrc.set(src, sampleVivid(probe) ?? 'none')
        this.render()
      }
      probe.onerror = () => this.bySrc.set(src, 'none')
      probe.src = src
    })
    this.render()
  }

  private render() {
    const rules: string[] = []
    for (const [src, aura] of this.bySrc) {
      if (typeof aura !== 'object' || !this.paint) continue
      rules.push(
        `:root ${CARD_SEL}:not([data-part="user"]):has(img[src="${cssString(src)}"]) { --lf-aura: ${aura.color}; --lf-glow: color-mix(in oklab, ${aura.color} 68%, var(--lf-c)); }`,
      )
    }
    const sampled = [...this.bySrc.values()].filter((a) => typeof a === 'object').length
    const key = rules.join('\n') + `/*${sampled}*/`
    if (key === this.rulesKey) return
    this.rulesKey = key
    this.style.textContent = rules.join('\n')
    try {
      this.onChange?.()
    } catch {
      /* ignore */
    }
  }

  /** Aura of the newest mounted character message (whoever spoke last). */
  latest(): { aura: Aura; messageId: string } | null {
    const cards = document.querySelectorAll<HTMLElement>(`${CARD_SEL}:not([data-part="user"])`)
    for (let i = cards.length - 1; i >= 0; i--) {
      const src = this.avatarOf(cards[i])?.getAttribute('src')
      const a = src ? this.bySrc.get(src) : null
      if (a && typeof a === 'object') return { aura: a, messageId: cards[i].dataset.messageId ?? '' }
    }
    return null
  }

  /** Aura for a mounted message card, if we have sampled its avatar. */
  forMessage(messageId: string): Aura | null {
    const card = document.querySelector(`${CARD_SEL.replace('[data-message-id]', `[data-message-id="${cssString(messageId)}"]`)}`)
    const src = card ? this.avatarOf(card)?.getAttribute('src') : null
    const a = src ? this.bySrc.get(src) : null
    return a && typeof a === 'object' ? a : null
  }

  /** Distinct sampled auras (for the panel preview). */
  list(): Aura[] {
    return [...this.bySrc.values()].filter((a): a is Aura => typeof a === 'object')
  }
}
