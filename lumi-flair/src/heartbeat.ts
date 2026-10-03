/**
 * Story heartbeat: the emotional arc of a chat. Each AI reply adds a point —
 * valence (−1 sad/angry … +1 joyful) from the character's expression or the
 * Scene Director mood when available, otherwise from a small sentiment
 * lexicon over the reply text. Rendered as an SVG line in the Flair tab;
 * clicking a point scrolls to that message when it is on screen.
 */

export interface BeatPoint {
  id: string // message id
  i: number // message index
  v: number // valence −1…1
  label: string
  color: string | null
  t: number
}

export type HeartbeatData = Record<string, BeatPoint[]>

const MAX_POINTS = 240
const MAX_CHATS = 60

const MOOD_VALENCE: Array<[RegExp, number]> = [
  [/(ecsta|elat|joy|happ|delight|excit|laugh|love|playful|cheer|smile|warm|tender|hope)/, 0.75],
  [/(calm|content|relax|peace|cozy|serene|fond|amus|smirk|flirt|blush)/, 0.4],
  [/(curious|thinking|surpris|neutral|focus|serious|confus)/, 0],
  [/(worr|nervous|anxious|tense|uneasy|embarrass|lonely|wistful|melanchol)/, -0.35],
  [/(sad|cry|grief|hurt|despair|scared|fear|terrif|dread|horror)/, -0.7],
  [/(angry|anger|furious|rage|annoy|hate|disgust|bitter)/, -0.75],
]

const POS = /\b(smile[sd]?|smiling|laugh(s|ed|ing)?|grin(s|ned)?|happ(y|ily)|joy|warm(ly)?|gentle|soft(ly)?|love[sd]?|kiss(es|ed)?|hug(s|ged)?|delight(ed)?|thank(s|ful)?|beautiful|wonderful|glad|relie(f|ved)|cheer(s|ful)?|chuckle[sd]?|giggle[sd]?|tender|safe|bright)\b/gi
const NEG = /\b(cr(y|ies|ied)|tears?|sob(s|bed)?|scream(s|ed)?|angr(y|ily)|fur(y|ious)|rage|hate[sd]?|blood|pain(ful)?|hurt(s)?|fear|afraid|terrif(ied|ying)|dread|dark(ness)?|cold(ly)?|grim|bitter|sneer(s|ed)?|glare[sd]?|tremble[sd]?|shak(es|ing)|wound(ed)?|dead|death|kill(s|ed)?|alone|lonely|sorrow|grief|panic)\b/gi

export function valenceForLabel(label: string | null | undefined): number | null {
  if (!label) return null
  const l = label.toLowerCase()
  for (const [re, v] of MOOD_VALENCE) if (re.test(l)) return v
  return null
}

export function valenceForText(text: string | undefined): number {
  if (!text) return 0
  const plain = text.replace(/<[^>]*>/g, ' ')
  const pos = plain.match(POS)?.length ?? 0
  const neg = plain.match(NEG)?.length ?? 0
  if (!pos && !neg) return 0
  return Math.max(-1, Math.min(1, (pos - neg) / Math.max(3, pos + neg)))
}

export function addPoint(data: HeartbeatData, chatId: string, p: BeatPoint): HeartbeatData {
  const list = (data[chatId] ?? []).filter((x) => x.id !== p.id)
  list.push(p)
  list.sort((a, b) => a.i - b.i)
  const next: HeartbeatData = { ...data, [chatId]: list.slice(-MAX_POINTS) }
  const chats = Object.keys(next)
  if (chats.length > MAX_CHATS) {
    // Drop the chats whose last point is oldest.
    chats
      .sort((a, b) => (next[a].at(-1)?.t ?? 0) - (next[b].at(-1)?.t ?? 0))
      .slice(0, chats.length - MAX_CHATS)
      .forEach((c) => delete next[c])
  }
  return next
}

const NS = 'http://www.w3.org/2000/svg'

/** Render the arc into `host`. `onPick` receives the message id of a clicked point. */
export function renderHeartbeat(host: HTMLElement, points: BeatPoint[], onPick: (p: BeatPoint) => void) {
  host.textContent = ''
  if (points.length < 2) {
    const p = document.createElement('p')
    p.className = 'lf-hint'
    p.style.margin = '0'
    p.textContent = points.length
      ? 'One beat so far — the arc appears after the next reply.'
      : 'No beats yet in this chat. Every AI reply adds a point to the emotional arc.'
    host.appendChild(p)
    return
  }
  const W = 460
  const H = 140
  const pad = 10
  const n = points.length
  const x = (k: number) => pad + (k / (n - 1)) * (W - pad * 2)
  const y = (v: number) => H / 2 - v * (H / 2 - pad)
  const svg = document.createElementNS(NS, 'svg')
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`)
  svg.setAttribute('class', 'lf-beat')
  svg.setAttribute('role', 'img')
  svg.setAttribute('aria-label', 'Emotional arc of this chat')

  const mid = document.createElementNS(NS, 'line')
  mid.setAttribute('x1', String(pad))
  mid.setAttribute('x2', String(W - pad))
  mid.setAttribute('y1', String(H / 2))
  mid.setAttribute('y2', String(H / 2))
  mid.setAttribute('class', 'lf-beat-mid')
  svg.appendChild(mid)

  // Smooth path (Catmull-Rom → Bézier).
  const pts = points.map((p, k) => [x(k), y(p.v)] as const)
  let d = `M${pts[0][0]},${pts[0][1]}`
  for (let k = 0; k < pts.length - 1; k++) {
    const p0 = pts[k - 1] ?? pts[k]
    const p1 = pts[k]
    const p2 = pts[k + 1]
    const p3 = pts[k + 2] ?? p2
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    d += ` C${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${p2[0]},${p2[1]}`
  }
  const area = document.createElementNS(NS, 'path')
  area.setAttribute('d', `${d} L${pts.at(-1)![0]},${H / 2} L${pts[0][0]},${H / 2} Z`)
  area.setAttribute('class', 'lf-beat-area')
  svg.appendChild(area)
  const line = document.createElementNS(NS, 'path')
  line.setAttribute('d', d)
  line.setAttribute('class', 'lf-beat-line')
  svg.appendChild(line)

  points.forEach((p, k) => {
    const c = document.createElementNS(NS, 'circle')
    c.setAttribute('cx', String(x(k)))
    c.setAttribute('cy', String(y(p.v)))
    c.setAttribute('r', n > 80 ? '2.5' : '4')
    c.setAttribute('class', 'lf-beat-dot')
    if (p.color) c.setAttribute('style', `fill:${p.color}`)
    const title = document.createElementNS(NS, 'title')
    title.textContent = `#${p.i + 1}${p.label ? ` · ${p.label}` : ''}`
    c.appendChild(title)
    c.addEventListener('click', () => onPick(p))
    svg.appendChild(c)
  })
  host.appendChild(svg)
}

export const HEARTBEAT_CSS = `
.lf-beat { width: 100%; height: auto; display: block; overflow: visible; }
.lf-beat-mid { stroke: var(--lumiverse-border); stroke-dasharray: 3 4; }
.lf-beat-line { fill: none; stroke: var(--lf-c, var(--lumiverse-primary)); stroke-width: 2; filter: drop-shadow(0 0 4px color-mix(in srgb, var(--lf-c, var(--lumiverse-primary)) 60%, transparent)); }
.lf-beat-area { fill: color-mix(in srgb, var(--lf-c, var(--lumiverse-primary)) 12%, transparent); }
.lf-beat-dot { fill: var(--lf-c, var(--lumiverse-primary)); stroke: var(--lumiverse-bg, #000); stroke-width: 1.5; cursor: pointer; transition: r .15s ease; }
.lf-beat-dot:hover { r: 6; }
.lf-beat-legend { display: flex; justify-content: space-between; font-size: calc(11px * var(--lumiverse-font-scale, 1)); color: var(--lumiverse-text-dim); }
`
