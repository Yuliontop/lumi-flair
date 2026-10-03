/**
 * Moment Cards: turn a message into a share-ready 1080×1350 image — avatar,
 * name, the quote, the character's aura glow and a small Lumi Flair mark.
 */
import type { SpindleFrontendContext } from 'lumiverse-spindle-types'

export interface MomentInput {
  name: string
  text: string
  avatarSrc: string | null
  color: string // glow colour (#hex or any canvas colour)
  date: Date
}

const W = 1080
const H = 1350

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
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
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function wrapLines(g: CanvasRenderingContext2D, text: string, maxW: number, maxLines: number): string[] {
  const out: string[] = []
  for (const para of text.split('\n')) {
    const words = para.split(/\s+/).filter(Boolean)
    let line = ''
    for (const w of words) {
      const test = line ? `${line} ${w}` : w
      if (g.measureText(test).width > maxW && line) {
        out.push(line)
        line = w
      } else line = test
      if (out.length >= maxLines) break
    }
    if (out.length >= maxLines) break
    out.push(line)
  }
  if (out.length > maxLines) out.length = maxLines
  const joined = out.join(' ')
  if (joined.length < text.replace(/\s+/g, ' ').length && out.length) {
    let last = out[out.length - 1]
    while (last && g.measureText(`${last}…`).width > maxW) last = last.slice(0, -1)
    out[out.length - 1] = `${last.trimEnd()}…`
  }
  return out
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

export async function renderMomentCard(m: MomentInput): Promise<HTMLCanvasElement> {
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const g = c.getContext('2d')!
  const avatar = m.avatarSrc ? await loadImage(m.avatarSrc) : null

  // Backdrop: deep gradient + blurred avatar + colour glows.
  const bg = g.createLinearGradient(0, 0, W, H)
  bg.addColorStop(0, '#0c0a14')
  bg.addColorStop(1, '#171126')
  g.fillStyle = bg
  g.fillRect(0, 0, W, H)
  if (avatar) {
    g.save()
    g.globalAlpha = 0.35
    g.filter = 'blur(48px) saturate(1.3)'
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
  glow(W * 0.15, H * 0.1, 620, 0.45)
  glow(W * 0.9, H * 0.95, 700, 0.35)
  g.fillStyle = 'rgba(8,6,14,0.45)'
  g.fillRect(0, 0, W, H)

  // Glass panel with glowing edge.
  const px = 80, py = 300, pw = W - 160, ph = H - 420
  g.save()
  g.shadowColor = m.color
  g.shadowBlur = 60
  roundRect(g, px, py, pw, ph, 48)
  g.fillStyle = 'rgba(20,16,32,0.72)'
  g.fill()
  g.restore()
  roundRect(g, px, py, pw, ph, 48)
  g.lineWidth = 3
  const edge = g.createLinearGradient(px, py, px + pw, py + ph)
  edge.addColorStop(0, m.color)
  edge.addColorStop(0.5, 'rgba(255,255,255,0.15)')
  edge.addColorStop(1, m.color)
  g.strokeStyle = edge
  g.stroke()

  // Avatar medallion.
  const ax = W / 2, ay = py, ar = 120
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
  if (avatar) {
    const s = Math.max((ar * 2) / avatar.width, (ar * 2) / avatar.height)
    g.drawImage(avatar, ax - (avatar.width * s) / 2, ay - (avatar.height * s) / 3, avatar.width * s, avatar.height * s)
  } else {
    g.fillStyle = '#2a2140'
    g.fillRect(ax - ar, ay - ar, ar * 2, ar * 2)
    g.fillStyle = '#fff'
    g.font = '700 110px system-ui, sans-serif'
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    g.fillText((m.name[0] ?? '✦').toUpperCase(), ax, ay + 6)
  }
  g.restore()

  // Name.
  g.textAlign = 'center'
  g.textBaseline = 'alphabetic'
  g.fillStyle = '#fff'
  g.font = '700 56px system-ui, -apple-system, "Segoe UI", sans-serif'
  g.fillText(m.name, W / 2, py + ar + 90, pw - 80)

  // Quote.
  g.font = 'italic 400 120px Georgia, "Times New Roman", serif'
  g.fillStyle = m.color
  g.globalAlpha = 0.55
  g.fillText('“', px + 80, py + ar + 200)
  g.globalAlpha = 1
  const body = plainText(m.text) || '…'
  const size = body.length > 420 ? 34 : body.length > 220 ? 40 : 46
  g.font = `400 ${size}px Georgia, "Times New Roman", serif`
  g.fillStyle = 'rgba(255,255,255,0.92)'
  const top = py + ar + 170
  const lineH = size * 1.42
  const maxLines = Math.floor((py + ph - 90 - top) / lineH)
  const lines = wrapLines(g, body, pw - 160, maxLines)
  lines.forEach((l, k) => g.fillText(l, W / 2, top + k * lineH + size))

  // Footer.
  g.font = '500 26px system-ui, sans-serif'
  g.fillStyle = 'rgba(255,255,255,0.55)'
  g.fillText(m.date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }), W / 2, py + ph - 44)
  g.font = '600 28px system-ui, sans-serif'
  g.fillStyle = m.color
  g.fillText('✦ made with Lumi Flair', W / 2, H - 48)
  return c
}

/** Show the card in a Lumiverse modal with Download / Copy buttons. */
export async function showMomentCard(ctx: SpindleFrontendContext, m: MomentInput, onCreated?: () => void) {
  const canvas = await renderMomentCard(m)
  const url = canvas.toDataURL('image/png')
  onCreated?.()
  const modal = ctx.ui.showModal({ title: 'Moment Card', width: 460, maxHeight: 760 })
  const root = modal.root
  root.innerHTML = ''
  const wrap = document.createElement('div')
  wrap.className = 'lf-moment'
  const img = document.createElement('img')
  img.src = url
  img.alt = `Moment card: ${m.name}`
  const btns = document.createElement('div')
  btns.className = 'lf-btns'
  const mk = (label: string, primary: boolean, fn: () => void | Promise<void>) => {
    const b = document.createElement('button')
    b.type = 'button'
    b.className = primary ? 'lf-btn lf-primary' : 'lf-btn'
    b.textContent = label
    b.addEventListener('click', async () => {
      try {
        await fn()
      } catch (err) {
        console.warn('[Lumi Flair] moment card action failed', err)
      }
    })
    btns.appendChild(b)
    return b
  }
  mk('Download PNG', true, () => {
    const a = document.createElement('a')
    a.href = url
    a.download = `${m.name.replace(/[^\w-]+/g, '_') || 'moment'}-lumi-flair.png`
    document.body.appendChild(a)
    a.click()
    a.remove()
  })
  const copyBtn = mk('Copy image', false, async () => {
    const blob: Blob | null = await new Promise((r) => canvas.toBlob(r, 'image/png'))
    if (!blob || !('ClipboardItem' in window)) throw new Error('Clipboard image copy not supported')
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
    copyBtn.textContent = 'Copied ✓'
    setTimeout(() => (copyBtn.textContent = 'Copy image'), 1800)
  })
  wrap.append(img, btns)
  root.appendChild(wrap)
}

export const MOMENT_CSS = `
.lf-moment { display: flex; flex-direction: column; gap: 12px; padding: 4px 2px 8px; }
.lf-moment img { width: 100%; height: auto; border-radius: 14px; box-shadow: 0 10px 30px rgba(0,0,0,.35); }
.lf-moment-btn { display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; padding: 0; border: none; border-radius: 6px;
  background: transparent; color: var(--lumiverse-text-dim); cursor: pointer; }
.lf-moment-btn:hover { color: var(--lumiverse-text); background: var(--lumiverse-fill-subtle); }
.lf-moment-btn svg { width: 15px; height: 15px; }
`
