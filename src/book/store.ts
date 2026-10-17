/**
 * Book mode's per-chat data (the `book` vault file): chapters, and the ribbon bookmark. Pure data and helpers.
 * Pins stay in `moments`. Never save this before the vault has loaded (`createJsonStore().whenLoaded`).
 */

export interface Chapter {
  id: string
  /** Id of the chapter's first message. */
  startId: string
  title?: string
  at: number
}

export interface BookChat {
  chapters: Chapter[]
  /** Where the reader left off: a message, and how many pages after the page it starts on. */
  ribbon?: { id: string; off: number }
  /** The cover has been shown for this chat. */
  covered?: boolean
  /** The chat was last read as a book (setting `bookPerChat`). */
  open?: boolean
}

export type BookData = Record<string, BookChat>

const CHATS = 60
const CHAPTERS_PER_CHAT = 400
const clampStr = (v: unknown, max: number) => (typeof v === 'string' ? v.slice(0, max) : '')

export function normalizeBook(raw: unknown): BookData {
  const out: BookData = {}
  if (!raw || typeof raw !== 'object') return out
  const entries = Object.entries(raw as Record<string, unknown>).slice(0, CHATS)
  for (const [chat, v] of entries) {
    if (!chat || !v || typeof v !== 'object') continue
    const r = v as Record<string, unknown>
    const seen = new Set<string>()
    const chapters: Chapter[] = []
    for (const c of Array.isArray(r.chapters) ? r.chapters.slice(0, CHAPTERS_PER_CHAT) : []) {
      if (!c || typeof c !== 'object') continue
      const o = c as Record<string, unknown>
      const startId = clampStr(o.startId, 200)
      if (!startId || seen.has(startId)) continue
      seen.add(startId)
      const title = clampStr(o.title, 120).trim()
      chapters.push({
        id: clampStr(o.id, 80) || `c${chapters.length}`,
        startId,
        ...(title ? { title } : {}),
        at: typeof o.at === 'number' && Number.isFinite(o.at) ? o.at : 0,
      })
    }
    const rb = r.ribbon && typeof r.ribbon === 'object' ? (r.ribbon as Record<string, unknown>) : null
    const id = rb ? clampStr(rb.id, 200) : ''
    const entry: BookChat = { chapters }
    if (r.covered === true) entry.covered = true
    if (r.open === true) entry.open = true
    if (id) entry.ribbon = { id, off: typeof rb!.off === 'number' && rb!.off >= 0 ? Math.min(5000, Math.round(rb!.off)) : 0 }
    if (chapters.length || entry.ribbon || entry.covered || entry.open) out[chat] = entry
  }
  return out
}

/** A new chapter that starts at `startId`. Returns the same object when that message already starts one. */
export function addChapter(data: BookData, chatId: string, startId: string, title?: string, now = Date.now()): BookData {
  const cur = data[chatId] ?? { chapters: [] }
  if (cur.chapters.some((c) => c.startId === startId)) return data
  const t = title?.trim().slice(0, 120)
  const chapter: Chapter = { id: `c${now.toString(36)}${cur.chapters.length}`, startId, ...(t ? { title: t } : {}), at: now }
  return { ...data, [chatId]: { ...cur, chapters: [...cur.chapters, chapter] } }
}

export function renameChapter(data: BookData, chatId: string, id: string, title: string): BookData {
  const cur = data[chatId]
  if (!cur?.chapters.some((c) => c.id === id)) return data
  const t = title.trim().slice(0, 120)
  return {
    ...data,
    [chatId]: { ...cur, chapters: cur.chapters.map((c) => (c.id === id ? { id: c.id, startId: c.startId, at: c.at, ...(t ? { title: t } : {}) } : c)) },
  }
}

export function setRibbon(data: BookData, chatId: string, id: string, off: number): BookData {
  const cur = data[chatId] ?? { chapters: [] }
  if (cur.ribbon?.id === id && cur.ribbon.off === off) return data
  return { ...data, [chatId]: { ...cur, ribbon: { id, off } } }
}

/** Remember that the cover was shown, or that the chat was left open as a book. Returns the same object when nothing changes. */
export function setFlag(data: BookData, chatId: string, flag: 'covered' | 'open', on: boolean): BookData {
  const cur = data[chatId] ?? { chapters: [] }
  if (!!cur[flag] === on) return data
  const { [flag]: _old, ...rest } = cur
  return { ...data, [chatId]: on ? { ...rest, [flag]: true } : rest }
}

/**
 * Messages were deleted: a chapter whose first message is gone starts at the next message that is still there
 * (`order` is the chat's message ids, oldest first, as they were before the delete); with none left it goes.
 */
export function dropMessages(data: BookData, chatId: string, gone: Set<string>, order: string[]): BookData {
  const cur = data[chatId]
  if (!cur) return data
  const next = (id: string) => {
    for (let i = order.indexOf(id) + 1; i > 0 && i < order.length; i++) if (!gone.has(order[i])) return order[i]
    return null
  }
  let changed = false
  const used = new Set<string>()
  const chapters: Chapter[] = []
  for (const c of cur.chapters) {
    let startId: string | null = c.startId
    if (gone.has(c.startId)) {
      changed = true
      startId = next(c.startId)
    }
    if (!startId || used.has(startId)) {
      changed = true
      continue
    }
    used.add(startId)
    chapters.push(startId === c.startId ? c : { ...c, startId })
  }
  let ribbon = cur.ribbon
  if (ribbon && gone.has(ribbon.id)) {
    changed = true
    const n = next(ribbon.id)
    ribbon = n ? { id: n, off: 0 } : undefined
  }
  if (!changed) return data
  const { ribbon: _r, ...rest } = cur
  return { ...data, [chatId]: { ...rest, chapters, ...(ribbon ? { ribbon } : {}) } }
}
