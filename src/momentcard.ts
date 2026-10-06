/**
 * Moment Cards: turn a message (or the part of it you choose) into a share-ready image: a 1600×1000 card with
 * the avatar and name on the left, the quote on the right, the character's aura glow and a small Lumi Flair
 * mark. It is saved like a macOS window capture: rounded corners, a transparent background and a soft shadow.
 */
import type { SpindleFrontendContext } from 'lumiverse-spindle-types'
import { tr } from './i18n'
import { keepOpenWhileDragging } from './modal'

export interface MomentInput {
  name: string
  text: string
  avatarSrc: string | null
  /** The character's own square crop for the round portrait, if they have one (else the avatar is fitted into the circle). */
  portraitSrc?: string | null
  color: string // glow colour (#hex or any canvas colour)
  date: Date
}

const W = 1600
const H = 1000
/** The saved image: the card plus a transparent margin that holds its shadow (more room below, where the shadow falls). */
const CORNER = 40
const MARGIN = { x: 96, top: 80, bottom: 136 }
export const IMAGE_W = W + MARGIN.x * 2
export const IMAGE_H = H + MARGIN.top + MARGIN.bottom

const images = new Map<string, Promise<HTMLImageElement | null>>()
function loadImage(src: string): Promise<HTMLImageElement | null> {
  let p = images.get(src)
  if (!p) {
    p = new Promise((resolve) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => resolve(null)
      img.src = src
    })
    images.set(src, p)
    if (images.size > 8) images.delete(images.keys().next().value as string)
  }
  return p
}

/** Strip markup to readable prose. */
export function plainText(raw: string): string {
  return raw
    .replace(/<flair[^>]*>[\s\S]*?<\/flair(?:-choice)?>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/[*_~`#]+/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/** Wrap text into at most `maxLines` lines; `cut` is true when it didn't all fit (the last line then ends with "…"). */
function wrapLines(g: CanvasRenderingContext2D, text: string, maxW: number, maxLines: number): { lines: string[]; cut: boolean } {
  const out: string[] = []
  let cut = false
  const paras = text.split('\n')
  outer: for (let p = 0; p < paras.length; p++) {
    const words = paras[p].split(/\s+/).filter(Boolean)
    let line = ''
    for (const w of words) {
      const test = line ? `${line} ${w}` : w
      if (g.measureText(test).width > maxW && line) {
        out.push(line)
        line = w
        if (out.length >= maxLines) {
          cut = true
          break outer
        }
      } else line = test
    }
    if (out.length >= maxLines) {
      cut = !!line || p < paras.length - 1
      break
    }
    out.push(line)
    if (out.length >= maxLines && p < paras.length - 1) {
      cut = paras.slice(p + 1).some((x) => x.trim())
      break
    }
  }
  if (cut && out.length) {
    let last = out[out.length - 1]
    while (last && g.measureText(`${last}…`).width > maxW) last = last.slice(0, -1)
    out[out.length - 1] = `${last.trimEnd()}…`
  }
  return { lines: out, cut }
}

function roundRect(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath()
  g.moveTo(x + r, y)
  g.arcTo(x + w, y, x + w, y + h, r)
  g.arcTo(x + w, y + h, x, y + h, r)
  g.arcTo(x, y + h, x, y, r)
  g.arcTo(x, y, x + w, y, r)
  g.closePath()
}

const SERIF = 'Georgia, "Times New Roman", serif'
const SANS = 'system-ui, -apple-system, "Segoe UI", sans-serif'

/** Draw the card, framed like a window capture. `cut` says whether the quote had to be shortened to fit. */
export async function renderMomentCard(m: MomentInput): Promise<{ canvas: HTMLCanvasElement; cut: boolean }> {
  const card = await drawCard(m)
  const out = document.createElement('canvas')
  out.width = IMAGE_W
  out.height = IMAGE_H
  const g = out.getContext('2d')!
  const x = MARGIN.x, y = MARGIN.top
  // The shadow: a wide soft one and a tighter one close to the edge, both falling a little downwards.
  for (const [blur, dy, alpha] of [[90, 34, 0.5], [24, 8, 0.32]] as const) {
    g.save()
    g.shadowColor = `rgba(0,0,0,${alpha})`
    g.shadowBlur = blur
    g.shadowOffsetY = dy
    roundRect(g, x, y, W, H, CORNER)
    g.fillStyle = '#000'
    g.fill()
    g.restore()
  }
  // The card itself, with rounded corners (this also covers the black the shadows were cast from).
  g.save()
  roundRect(g, x, y, W, H, CORNER)
  g.clip()
  g.drawImage(card.canvas, x, y)
  g.restore()
  // The edge: the character's colour fading through a hint of white, like the card's own glow.
  roundRect(g, x + 1.5, y + 1.5, W - 3, H - 3, CORNER - 1.5)
  g.lineWidth = 3
  const edge = g.createLinearGradient(x, y, x + W, y + H)
  edge.addColorStop(0, m.color)
  edge.addColorStop(0.5, 'rgba(255,255,255,0.18)')
  edge.addColorStop(1, m.color)
  g.strokeStyle = edge
  g.stroke()
  return { canvas: out, cut: card.cut }
}

async function drawCard(m: MomentInput): Promise<{ canvas: HTMLCanvasElement; cut: boolean }> {
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const g = c.getContext('2d')!
  const avatar = m.avatarSrc ? await loadImage(m.avatarSrc) : null
  const portrait = (m.portraitSrc ? await loadImage(m.portraitSrc) : null) ?? avatar

  // Backdrop: deep gradient, the avatar blurred behind everything, and two colour glows.
  const bg = g.createLinearGradient(0, 0, W, H)
  bg.addColorStop(0, '#0c0a14')
  bg.addColorStop(1, '#171126')
  g.fillStyle = bg
  g.fillRect(0, 0, W, H)
  if (avatar) {
    g.save()
    g.globalAlpha = 0.32
    g.filter = 'blur(56px) saturate(1.3)'
    const s = Math.max(W / avatar.width, H / avatar.height) * 1.2
    g.drawImage(avatar, (W - avatar.width * s) / 2, (H - avatar.height * s) / 2, avatar.width * s, avatar.height * s)
    g.restore()
  }
  const glow = (x: number, y: number, r: number, a: number) => {
    const rg = g.createRadialGradient(x, y, 0, x, y, r)
    rg.addColorStop(0, m.color)
    rg.addColorStop(1, 'transparent')
    g.globalAlpha = a
    g.fillStyle = rg
    g.fillRect(0, 0, W, H)
    g.globalAlpha = 1
  }
  glow(W * 0.12, H * 0.2, 640, 0.45)
  glow(W * 0.92, H * 0.95, 760, 0.32)
  g.fillStyle = 'rgba(8,6,14,0.45)'
  g.fillRect(0, 0, W, H)

  // The card is the only shape: no panel inside it. A gentle tint evens the backdrop out, and the content
  // sits in a box just inside the edge (the edge glow is drawn when the card is framed, in renderMomentCard).
  g.fillStyle = 'rgba(20,16,32,0.5)'
  g.fillRect(0, 0, W, H)
  const px = 20, py = 20, pw = W - 40, ph = H - 40

  // Left column: the avatar medallion, the name, the date.
  const colW = 460
  const ax = px + colW / 2, ay = py + ph * 0.42, ar = 150
  g.save()
  g.shadowColor = m.color
  g.shadowBlur = 50
  g.beginPath()
  g.arc(ax, ay, ar + 8, 0, Math.PI * 2)
  g.fillStyle = m.color
  g.fill()
  g.restore()
  g.save()
  g.beginPath()
  g.arc(ax, ay, ar, 0, Math.PI * 2)
  g.clip()
  if (portrait) {
    // Cover the circle completely, whatever the picture's shape: centred across, and on a tall picture a little
    // towards the top, where the face usually is. (It used to shift by a third of the height, which left a gap
    // at the top of the circle for pictures that weren't tall enough.)
    const s = Math.max((ar * 2) / portrait.width, (ar * 2) / portrait.height)
    const dw = portrait.width * s, dh = portrait.height * s
    g.drawImage(portrait, ax - ar - (dw - ar * 2) / 2, ay - ar - (dh - ar * 2) * 0.25, dw, dh)
  } else {
    g.fillStyle = '#2a2140'
    g.fillRect(ax - ar, ay - ar, ar * 2, ar * 2)
    g.fillStyle = '#fff'
    g.font = `700 130px ${SANS}`
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    g.fillText((m.name[0] ?? '✦').toUpperCase(), ax, ay + 6)
  }
  g.restore()
  g.textAlign = 'center'
  g.textBaseline = 'alphabetic'
  g.fillStyle = '#fff'
  g.font = `700 54px ${SANS}`
  g.fillText(m.name, ax, ay + ar + 92, colW - 60)
  g.font = `500 26px ${SANS}`
  g.fillStyle = 'rgba(255,255,255,0.55)'
  g.fillText(m.date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }), ax, ay + ar + 140, colW - 60)

  // A soft divider between the columns.
  const dx = px + colW
  const dv = g.createLinearGradient(0, py + 80, 0, py + ph - 80)
  dv.addColorStop(0, 'transparent')
  dv.addColorStop(0.5, m.color)
  dv.addColorStop(1, 'transparent')
  g.globalAlpha = 0.5
  g.fillStyle = dv
  g.fillRect(dx, py + 80, 2, ph - 160)
  g.globalAlpha = 1

  // Right column: the quote, as large as it can be while it all fits (or the smallest size, shortened).
  const qx = dx + 90, qw = px + pw - 80 - qx
  const qTop = py + 120, qBottom = py + ph - 110
  const body = plainText(m.text) || '…'
  let fit = { lines: [] as string[], cut: true }
  let size = 28
  for (const s of [56, 50, 45, 40, 36, 32, 28]) {
    g.font = `400 ${s}px ${SERIF}`
    const r = wrapLines(g, body, qw, Math.floor((qBottom - qTop) / (s * 1.45)))
    fit = r
    size = s
    if (!r.cut) break
  }
  const lineH = size * 1.45
  const blockH = fit.lines.length * lineH
  const y0 = qTop + Math.max(0, (qBottom - qTop - blockH) / 2)
  g.font = `italic 400 140px ${SERIF}`
  g.fillStyle = m.color
  g.globalAlpha = 0.5
  g.textAlign = 'left'
  g.fillText('“', qx - 70, y0 + 70)
  g.globalAlpha = 1
  g.font = `400 ${size}px ${SERIF}`
  g.fillStyle = 'rgba(255,255,255,0.93)'
  fit.lines.forEach((l, k) => g.fillText(l, qx, y0 + k * lineH + size))

  // Mark.
  g.textAlign = 'right'
  g.font = `600 26px ${SANS}`
  g.fillStyle = m.color
  g.fillText('✦ made with Lumi Flair', px + pw - 50, py + ph - 40)
  return { canvas: c, cut: fit.cut }
}

/**
 * Show the card in a Lumiverse modal: a live preview, the text that goes on it (pick a part of the message,
 * or edit it), and Download / Copy. `start` is what was selected in the message when the button was pressed.
 */
export async function showMomentCard(ctx: SpindleFrontendContext, m: MomentInput, onCreated?: () => void, start?: string | null) {
  const whole = plainText(m.text)
  let text = start?.trim() || whole
  let current = await renderMomentCard({ ...m, text })
  onCreated?.()
  const modal = ctx.ui.showModal({ title: tr('Moment Card'), width: 760, maxHeight: 900 })
  const root = modal.root
  const unguard = keepOpenWhileDragging(root) // selecting text and letting go outside must not close it
  root.innerHTML = ''
  const wrap = document.createElement('div')
  wrap.className = 'lf-moment'
  const img = document.createElement('img')
  img.src = current.canvas.toDataURL('image/png')
  img.alt = `${tr('Moment Card')}: ${m.name}`

  const label = document.createElement('div')
  label.className = 'lf-moment-label'
  label.textContent = tr('Text on the card')
  const slot = document.createElement('div')
  slot.className = 'lf-moment-text'
  const note = document.createElement('p')
  note.className = 'lf-moment-note'

  let timer: ReturnType<typeof setTimeout> | undefined
  let drawn = 0
  const redraw = (next: string) => {
    text = next
    clearTimeout(timer)
    timer = setTimeout(async () => {
      const n = ++drawn
      const r = await renderMomentCard({ ...m, text: text.trim() || whole })
      if (n !== drawn) return // a newer one is on its way
      current = r
      img.src = r.canvas.toDataURL('image/png')
      paintNote()
    }, 220)
  }
  const ta = ctx.components.mountTextArea(slot, { value: text, rows: 5, ariaLabel: tr('Text on the card'), onChange: redraw })
  const field = () => slot.querySelector('textarea')
  const paintNote = () => {
    note.textContent = current.cut
      ? tr('That is more than fits, so the card ends with “…”. Pick a shorter part for the whole of it.')
      : tr('Select part of the text and press “Use selection”, or edit it. The card follows as you go.')
    note.dataset.cut = current.cut ? '1' : '0'
  }
  paintNote()

  const pick = document.createElement('div')
  pick.className = 'lf-btns'
  const btns = document.createElement('div')
  btns.className = 'lf-btns'
  const mk = (parent: HTMLElement, label: string, primary: boolean, fn: () => void | Promise<void>) => {
    const b = document.createElement('button')
    b.type = 'button'
    b.className = primary ? 'lf-btn lf-primary' : 'lf-btn'
    b.textContent = tr(label)
    // Keep the textarea's selection: a press on the button would otherwise clear it before the click.
    b.addEventListener('mousedown', (e) => e.preventDefault())
    b.addEventListener('click', async () => {
      try {
        await fn()
      } catch (err) {
        console.warn('[Lumi Flair] moment card action failed', err)
      }
    })
    parent.appendChild(b)
    return b
  }
  mk(pick, 'Use selection', false, () => {
    const f = field()
    if (!f || f.selectionStart === f.selectionEnd) {
      note.textContent = tr('Select some of the text first, then press “Use selection”.')
      return
    }
    const part = f.value.slice(f.selectionStart, f.selectionEnd).trim()
    if (!part) return
    ta.update({ value: part })
    redraw(part)
  })
  mk(pick, 'Whole message', false, () => {
    ta.update({ value: whole })
    redraw(whole)
  })
  mk(btns, 'Download PNG', true, () => {
    const a = document.createElement('a')
    a.href = current.canvas.toDataURL('image/png')
    a.download = `${m.name.replace(/[^\w-]+/g, '_') || 'moment'}-lumi-flair.png`
    document.body.appendChild(a)
    a.click()
    a.remove()
  })
  const copyBtn = mk(btns, 'Copy image', false, async () => {
    const blob: Blob | null = await new Promise((r) => current.canvas.toBlob(r, 'image/png'))
    if (!blob || !('ClipboardItem' in window)) throw new Error('Clipboard image copy not supported')
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
    copyBtn.textContent = tr('Copied ✓')
    setTimeout(() => (copyBtn.textContent = tr('Copy image')), 1800)
  })
  modal.onDismiss(() => {
    unguard()
    clearTimeout(timer)
    ta.destroy()
  })
  wrap.append(img, label, slot, pick, note, btns)
  root.appendChild(wrap)
}

export const MOMENT_CSS = `
.lf-moment { display: flex; flex-direction: column; gap: 10px; padding: 4px 2px 8px; color: var(--lumiverse-text); }
/* The image already has its rounded corners and shadow (it is saved that way), so the preview shows it as it is. */
.lf-moment img { display: block; width: 100%; height: auto; }
.lf-moment-label { margin-top: 4px; font-size: calc(13px * var(--lumiverse-font-scale, 1)); font-weight: 500; color: var(--lumiverse-text-muted); }
.lf-moment-text > * { width: 100%; }
.lf-moment-note { margin: 0; font-size: calc(11px * var(--lumiverse-font-scale, 1)); line-height: 1.45; color: var(--lumiverse-text-dim); }
.lf-moment-note[data-cut="1"] { color: var(--lumiverse-warning, #e2a03f); }
.lf-moment-btn { display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; padding: 0; border: none; border-radius: 6px;
  background: transparent; color: var(--lumiverse-text-dim); cursor: pointer; }
.lf-moment-btn:hover { color: var(--lumiverse-text); background: var(--lumiverse-fill-subtle); }
.lf-moment-btn svg { width: 15px; height: 15px; }
/* In the host's action pill: sit in its row (the host wraps extension buttons in a plain block div), at its size. */
[data-spindle-extension-root]:has(> .lf-moment-btn) { display: contents; }
[data-component="BubbleActions"] .lf-moment-btn { width: 26px; height: 26px; flex: none; }
[data-component="BubbleActions"] .lf-moment-btn svg { width: 13px; height: 13px; }
`
