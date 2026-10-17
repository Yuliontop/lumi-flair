/**
 * Book mode: page geometry, page maths and chapter/segment splitting. Pure (no DOM), so it is easy to test.
 *
 * A chapter's text is poured into one tall CSS flow (`column-width` = one page, `column-fill: auto`), so the
 * browser itself splits paragraphs across pages. Page n is that flow shifted left by n columns. A chapter is cut
 * into *segments* of about SEGMENT_CHARS characters, each its own flow, so laying out a 2,000-message chat never
 * means laying out all of it at once (docs/BOOK_MODE.md 3.2; the spike measured ~0.04 ms per paragraph on a
 * desktop and expected 3-6x that on a phone).
 */
import type { Piece } from './source'
import type { Chapter } from './store'

/** Narrowest text column that still gets a two-page spread. */
export const MIN_PAGE = 380
/** Widest text column: past ~66 characters a line is tiring to read. */
export const MAX_PAGE = 620
/** About how much text one segment (one flow) holds. A message is never split between segments. */
export const SEGMENT_CHARS = 40_000

export type Margins = 'narrow' | 'normal' | 'wide'
export const MARGIN_PX: Record<Margins, number> = { narrow: 16, normal: 30, wide: 50 }

export interface Geometry {
  spread: boolean
  /** Width of one page's text. */
  pageW: number
  /** Height of the text area. */
  textH: number
  /** Space between two columns of the flow (a spread's spine, or nothing in a single page). */
  gap: number
  /** Distance from one page to the next inside the flow. */
  step: number
  /** The margin on every side of a page's text. */
  m: number
  /** Top and bottom room inside the paper, for the running header and the page number. */
  vpad: number
  paperW: number
  paperH: number
}

/** Fit a book into `areaW` x `areaH` pixels. Two facing pages when each can have MIN_PAGE of text, else one. `size` scales the margins and the widest page (the type is scaled the same way). */
export function geometry(areaW: number, areaH: number, margins: Margins, size = 1): Geometry {
  const m = Math.round(MARGIN_PX[margins] * size)
  const vpad = m + Math.round(22 * size)
  const minPage = MIN_PAGE * size
  const maxPage = MAX_PAGE * size
  const deskX = 24
  const deskY = 14
  const fitW = Math.max(120, areaW - deskX)
  const paperH = Math.max(160, Math.floor(areaH - deskY))
  const textH = Math.max(80, paperH - vpad * 2)
  const spread = fitW >= 2 * (minPage + 2 * m)
  const pageW = spread
    ? Math.min(maxPage, Math.floor(fitW / 2 - 2 * m))
    : Math.min(maxPage, Math.max(100, Math.floor(fitW - 2 * m)))
  const gap = spread ? 2 * m : 0
  const paperW = spread ? 2 * (pageW + 2 * m) : pageW + 2 * m
  return { spread, pageW, textH, gap, step: pageW + gap, m, vpad, paperW, paperH }
}

/** Pages in a flow whose `scrollWidth` is `sw`. The last column is always full width, so this is exact. */
export const pageCount = (sw: number, g: Geometry) => Math.max(1, Math.round((sw + g.gap) / g.step))
/** What the reader sees at once: a spread (two pages) or one page. */
export const viewCount = (pages: number, g: Geometry) => (g.spread ? Math.ceil(pages / 2) : pages)
/** How far the flow moves left to show a view. */
export const shiftOf = (view: number, g: Geometry) => (g.spread ? view * 2 * g.step : view * g.step)
export const viewOfPage = (page: number, g: Geometry) => (g.spread ? page >> 1 : page)
/** The column a client x-position falls in, given the flow's own left edge. */
export const columnAt = (x: number, flowLeft: number, g: Geometry) => Math.max(0, Math.floor((x - flowLeft + 1) / g.step))

/** Everything that changes where the text breaks. Cached page counts are valid only for the same key. */
export function layoutKey(g: Geometry, parts: Array<string | number>): string {
  return [g.spread ? 2 : 1, g.pageW, g.textH, g.gap, ...parts].join('|')
}

export interface Segment {
  /** Stable while its first piece and chapter stay the same. */
  id: string
  chapter: number
  /** The first segment of its chapter gets the chapter heading. */
  opens: boolean
  pieces: Piece[]
}

/** The stored chapters that still point at a message (not the first one), in reading order. Chapter number n (n >= 1) is `[n - 1]`; chapter 0 is the implicit first. */
export function orderChapters(pieces: Piece[], chapters: Chapter[]): Chapter[] {
  const at = new Map(pieces.map((p, i) => [p.id, i]))
  return chapters
    .filter((c) => (at.get(c.startId) ?? 0) > 0)
    .sort((a, b) => at.get(a.startId)! - at.get(b.startId)!)
}

/**
 * Cut the chat's pieces into chapters (by each chapter's first message), then into segments of ~`budget` characters.
 * `breaks` are message ids that always start a segment: the first message of each batch read from the host, so reading
 * older batches later doesn't move the boundaries of the ones already laid out.
 */
export function segments(pieces: Piece[], chapters: Chapter[], budget = SEGMENT_CHARS, breaks?: Set<string>): Segment[] {
  const starts = new Map<string, number>() // first message id -> chapter number
  orderChapters(pieces, chapters).forEach((c, n) => starts.set(c.startId, n + 1))
  const out: Segment[] = []
  let cur: Segment | null = null
  let size = 0
  let chapter = 0
  pieces.forEach((p, i) => {
    const opens = i === 0 || starts.has(p.id)
    if (opens) chapter = i === 0 ? 0 : starts.get(p.id)!
    if (opens || !cur || size >= budget || breaks?.has(p.id)) {
      cur = { id: `${chapter}:${p.id}`, chapter, opens, pieces: [] }
      out.push(cur)
      size = 0
    }
    cur.pieces.push(p)
    size += p.len
  })
  return out
}

/** Which chapter each segment belongs to, as an index into the *real* chapter list (the implicit first chapter is 0). */
export function chapterCount(segs: Segment[]): number {
  return segs.length ? segs[segs.length - 1].chapter + 1 : 1
}
