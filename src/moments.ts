/**
 * Pinned moments ("favourite moments"): lines the reader bookmarked, one pin per message, kept per
 * chat. Pure data and helpers. The star button on each message, the reel in the panel and the stars
 * on the heartbeat all work from these.
 */

export interface Pin {
  /** Message id. One pin per message: pinning it again updates it. */
  id: string
  /** Position in the chat when pinned, on the same scale as the heartbeat's points. */
  i: number
  /** The pinned line (the reader's selection), or the start of the message. */
  text: string
  /** True when nothing was selected, so `text` is just the start of the message. */
  whole: boolean
  /** Who said it; blank when the page didn't say (the reel then shows "You" or "Message"). */
  who: string
  /** The reader's own message. */
  user: boolean
  /** The speaker's aura colour, for the reel. */
  color: string | null
  t: number
}

export type PinData = Record<string, Pin[]>

export const PIN_TEXT_MAX = 420
/** What is saved to Lumiverse's memory per pin. The AI sees the latest few facts of an entity, so keep each short. */
export const PIN_MEMORY_MAX = 160
const PINS_PER_CHAT = 120
const CHATS = 60

const clampStr = (v: unknown, max: number) => (typeof v === 'string' ? v.slice(0, max) : '')

/** Collapse whitespace and cut at a word near `max`. */
export function excerpt(text: string, max = PIN_TEXT_MAX): string {
  const t = text.replace(/\s+/g, ' ').trim()
  if (t.length <= max) return t
  const cut = t.slice(0, max)
  const sp = cut.lastIndexOf(' ')
  return `${(sp > max * 0.6 ? cut.slice(0, sp) : cut).replace(/[\s,;:.\-–—]+$/, '')}…`
}

function pinOf(raw: unknown): Pin | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  const id = clampStr(r.id, 200)
  const text = excerpt(clampStr(r.text, PIN_TEXT_MAX * 2))
  if (!id || !text) return null
  const color = clampStr(r.color, 40)
  return {
    id,
    i: typeof r.i === 'number' && Number.isFinite(r.i) ? Math.max(0, Math.round(r.i)) : 0,
    text,
    whole: r.whole === true,
    who: clampStr(r.who, 80),
    user: r.user === true,
    color: color || null,
    t: typeof r.t === 'number' && Number.isFinite(r.t) ? r.t : 0,
  }
}

/** Everything read from storage or a backup goes through here. */
export function normalizePins(raw: unknown): PinData {
  const out: PinData = {}
  if (!raw || typeof raw !== 'object') return out
  for (const [chat, list] of Object.entries(raw as Record<string, unknown>)) {
    if (!chat || !Array.isArray(list)) continue
    const pins: Pin[] = []
    for (const item of list) {
      const p = pinOf(item)
      if (p && !pins.some((x) => x.id === p.id)) pins.push(p)
    }
    if (pins.length) out[chat] = sortPins(pins).slice(-PINS_PER_CHAT)
  }
  return trimChats(out)
}

const sortPins = (list: Pin[]) => [...list].sort((a, b) => a.i - b.i || a.t - b.t)

function trimChats(data: PinData): PinData {
  const chats = Object.keys(data)
  if (chats.length <= CHATS) return data
  const next = { ...data }
  chats
    .sort((a, b) => Math.max(...next[a].map((p) => p.t)) - Math.max(...next[b].map((p) => p.t)))
    .slice(0, chats.length - CHATS)
    .forEach((c) => delete next[c])
  return next
}

export const isPinned = (data: PinData, chatId: string | null, id: string): boolean =>
  !!chatId && !!data[chatId]?.some((p) => p.id === id)

/** Add a pin, or replace the pin already on that message. */
export function setPin(data: PinData, chatId: string, pin: Pin): PinData {
  const list = (data[chatId] ?? []).filter((p) => p.id !== pin.id)
  list.push(pin)
  return trimChats({ ...data, [chatId]: sortPins(list).slice(-PINS_PER_CHAT) })
}

export function removePins(data: PinData, chatId: string | undefined, ids: ReadonlySet<string>): PinData {
  let changed = false
  const next: PinData = {}
  for (const [chat, list] of Object.entries(data)) {
    if (chatId && chat !== chatId) {
      next[chat] = list
      continue
    }
    const kept = list.filter((p) => !ids.has(p.id))
    if (kept.length !== list.length) changed = true
    if (kept.length) next[chat] = kept
  }
  return changed ? next : data
}

/** A five-pointed star as SVG polygon points, centred on (cx, cy). */
export function starPoints(cx: number, cy: number, r: number): string {
  const pts: string[] = []
  for (let k = 0; k < 10; k++) {
    const a = -Math.PI / 2 + (k * Math.PI) / 5
    const rad = k % 2 ? r * 0.46 : r
    pts.push(`${(cx + Math.cos(a) * rad).toFixed(2)},${(cy + Math.sin(a) * rad).toFixed(2)}`)
  }
  return pts.join(' ')
}

export const STAR_SVG =
  '<svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"><polygon points="12,2.8 14.9,8.9 21.5,9.7 16.6,14.3 17.9,20.9 12,17.6 6.1,20.9 7.4,14.3 2.5,9.7 9.1,8.9"/></svg>'

export const PIN_CSS = `
.lf-pin-btn svg { fill: none; transition: fill .15s ease, color .15s ease, transform .15s ease; }
.lf-pin-btn[data-on="1"] { color: #f2b84b; }
.lf-pin-btn[data-on="1"] svg { fill: currentColor; }
.lf-pin-btn:active svg { transform: scale(.85); }
.lf-pin-list { display: flex; flex-direction: column; gap: 8px; }
.lf-pin { display: flex; flex-direction: column; gap: 6px; padding: 10px 12px; border-radius: var(--lumiverse-radius, 8px);
  background: var(--lumiverse-fill); border: 1px solid var(--lumiverse-border); border-left: 3px solid var(--lf-pin-c, #f2b84b); }
.lf-pin-head { display: flex; align-items: center; gap: 8px; min-width: 0; }
.lf-pin-head > svg { flex: none; width: 13px; height: 13px; fill: #f2b84b; stroke: #f2b84b; stroke-width: 2; stroke-linejoin: round; }
.lf-pin-who { flex: 1; min-width: 0; font-weight: 600; color: var(--lumiverse-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  font-size: calc(13px * var(--lumiverse-font-scale, 1)); }
.lf-pin-n { flex: none; color: var(--lumiverse-text-dim); font-variant-numeric: tabular-nums; font-size: calc(11px * var(--lumiverse-font-scale, 1)); }
.lf-pin-text { margin: 0; color: var(--lumiverse-text-muted); line-height: 1.45; font-size: calc(13px * var(--lumiverse-font-scale, 1));
  display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden; overflow-wrap: anywhere; }
.lf-pin-text[data-whole="1"] { font-style: italic; }
.lf-pin-acts { display: flex; gap: 6px; justify-content: flex-end; }
.lf-pin-acts .lf-btn { flex: 0 0 auto; padding: 5px 10px; font-size: calc(12px * var(--lumiverse-font-scale, 1)); }
.lf-pin-empty { padding: 12px; text-align: center; border-radius: var(--lumiverse-radius, 8px); border: 1px dashed var(--lumiverse-border);
  color: var(--lumiverse-text-dim); font-size: calc(12px * var(--lumiverse-font-scale, 1)); }
.lf-beat-star { fill: #f2b84b; stroke: var(--lumiverse-bg, #000); stroke-width: 1; stroke-linejoin: round; cursor: pointer; transition: transform .15s ease;
  transform-box: fill-box; transform-origin: center; }
.lf-beat-star:hover { transform: scale(1.25); }
`
