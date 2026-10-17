/**
 * Book mode (v1.7, docs/BOOK_MODE.md): read the chat as a book, two facing pages on a computer, one page on a phone.
 *
 * Like Theater mode it draws on top of the chat. While it is on `<html>` carries `data-lf-book` and one stylesheet
 * (written into `hooks.style` only for that time) hides the host's interface and makes the message list invisible
 * (not `display: none`: the host keeps measuring and streaming into it). Nothing on a host node is touched. The
 * book is our own DOM, set from message content (source.ts), laid out by the browser's CSS columns (flow.ts) and
 * turned by turn.ts. The host's reply box stays where it is, and the book leaves room for it.
 */
import { CHROME } from '../theater'
import type { BeatPoint } from '../heartbeat'
import { type Pin, starPoints } from '../moments'
import {
  type Geometry,
  type Margins,
  type Segment,
  SEGMENT_CHARS,
  columnAt,
  geometry,
  layoutKey,
  orderChapters,
  pageCount,
  segments,
  shiftOf,
  viewCount,
  viewOfPage,
} from './flow'
import { type GetMessages, type Piece, type RawMessage, PAGE, esc, harvest, hash, hydrateIslands, isHidden, pieceOf, readChat, setIgnore, setIgnoreLabel, setPlateLabel } from './source'
import { type BookData, type Chapter, addChapter, dropMessages, renameChapter, setFlag, setRibbon } from './store'
import { DEFAULT_ORNAMENT, type PackBook, paperTheme } from './theme'
import { Leaf, SLIDE_MS, type TurnStyle, resolveStyle } from './turn'

export interface BookSettings {
  scale: number
  lineHeight: number
  margins: Margins
  font: 'serif' | 'sans' | 'readable'
  paper: 'pack' | 'cream' | 'white' | 'night'
  turn: string
  user: 'rule' | 'italic' | 'smallcaps'
  headers: boolean
  autoTurn: boolean
  /** How big the book is (scales the page, the margins and the type). */
  size: number
  /** Write the next message on the book's own line (else the host's reply box stays). */
  writeHere: boolean
  /** Rules for what the book leaves out (see `setIgnore`). */
  ignore: string
  dropCaps: boolean
  cover: 'once' | 'always' | 'never'
  ink: boolean
  light: boolean
}

export interface BookHooks {
  /** Flair's overlay container for the book (fixed, full screen, click-through). */
  root: HTMLElement
  /** Holds the stylesheet that hides the host's interface, only while the book is open. */
  style: HTMLStyleElement
  get(): BookSettings
  /** Change a setting (the size buttons in the book's corner). */
  set(patch: { bookSize?: number }): void
  /** Add a rule to what the book leaves out (the cross on an HTML insert). */
  addIgnore(rule: string): void
  /** Send a message through the host's own reply box. Resolves false when it couldn't be sent. */
  send(text: string): Promise<boolean>
  /** False when the person asked for reduced motion. */
  motion(): boolean
  tr(s: string): string
  chatId(): string | null
  characterName(): string
  /** The free whole-chat read, when the host has it. */
  read: GetMessages | null
  /** The host's rendered `MessageContent` of a message, when it is mounted. */
  mounted(id: string): Element | null
  /** Every mounted message (the fallback when there is no whole-chat read). */
  mountedCards(): Array<{ id: string; user: boolean; name: string; el: Element }>
  /** The `MessageContent` of the reply being written right now. */
  streaming(): Element | null
  group(): boolean
  /** A speaker's aura colour (group chats). */
  colorFor(name: string): string | null
  data(): BookData
  save(next: BookData): void
  closeDrawer(): void
  /** Leaving the book: show this message in the chat. */
  reveal(id: string): void
  lang(): string
  changed(on: boolean): void
  /** The active Flair Pack's paper, if it has one. */
  pack(): PackBook | null
  /** The character's portrait for the cover. */
  portrait(): string | null
  /** The chat's name, when the host can say. */
  chatTitle(): Promise<string>
  /** The reader's name. */
  userName(): string
  /** This chat's pinned moments (the dog-ears are pins). */
  pins(): Pin[]
  /** Fold or unfold a corner: pin the message or take its pin off. */
  togglePin(m: { id: string; text: string; user: boolean; name: string; at: number }): void
  /** The story heartbeat of this chat. */
  beats(): BeatPoint[]
  /** Flip the newest reply to its other draft (the host's own swipe buttons). False when it couldn't. */
  swipe(id: string, dir: -1 | 1): boolean
  /** Whether the AI's options (<flair-choice>) are on, and whether picking one sends it. */
  choices(): { on: boolean; send: boolean }
  /** Put text in the host's reply box (when the book's own writing line is off). */
  fill(text: string): void
  /** The scene's light right now ('candle', 'night', ...). */
  light(): string
  /** A page was turned. */
  turnSound(): void
}

interface Pos {
  /** Index into the segments; `segs.length` is the blank page that starts a new chapter. */
  seg: number
  view: number
}

const FONTS: Record<BookSettings['font'], string> = {
  serif: '"Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif',
  sans: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  readable: '"Atkinson Hyperlegible", Verdana, "Trebuchet MS", system-ui, sans-serif',
}
const MAX_FLOWS = 3
/** At most this many leaf layers get a flow clone, so a huge chapter never stalls a turn (it slides instead). */
const CURL_MAX_CHARS = SEGMENT_CHARS * 2

const svg = (d: string) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`
export const BOOK_ICON = svg('<path d="M4 5.5C4 4.7 4.7 4 5.5 4H11v15H5.5C4.7 19 4 18.3 4 17.5zM20 5.5C20 4.7 19.3 4 18.5 4H13v15h5.5c.8 0 1.5-.7 1.5-1.5z"/>')
const ICON = {
  close: svg('<path d="M6 6l12 12M18 6L6 18"/>'),
  chat: svg('<path d="M4 5h16v11H9l-5 4z"/>'),
  smaller: svg('<path d="M4 18l5-12 5 12M6 14h6M17 9h4"/>'),
  larger: svg('<path d="M3 19l6-14 6 14M5.5 14h7M18 7v6M15 10h6"/>'),
  pen: svg('<path d="M4 20h4L19 9l-4-4L4 16z"/>'),
  list: svg('<path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01"/>'),
  send: svg('<path d="M4 12l16-8-6 16-3-7z"/>'),
}
/** The height of the writing line under the book. */
const WRITE_H = 64

const R = ':root[data-lf-book]'
export function bookHideCss(writeHere: boolean): string {
  return `
${CHROME.map((c) => `${R} ${c}`).join(',\n')} { display: none !important; }
${R} [data-component="MessageList"] { visibility: hidden !important; pointer-events: none !important; }
${writeHere ? `${R}:not([data-lf-compose]) [data-component="InputArea"] { display: none !important; }` : ''}
`
}

export const BOOK_CSS = `
.lf-bk-host { position: fixed; inset: 0; z-index: 2147483000; pointer-events: none; }
:root[data-lf-book] .lf-bk-host { background: radial-gradient(ellipse at 50% 42%, rgba(0,0,0,.08), rgba(0,0,0,.5)); }
.lf-bk-root, .lf-bk-root * { margin: 0; padding: 0; box-sizing: border-box; line-height: 1.2; text-align: left; }
.lf-bk-root { position: absolute; left: 0; right: 0; top: 0; bottom: var(--bk-bottom, 0px); pointer-events: none; overscroll-behavior: none;
  --bk-accent: var(--lf-c, var(--lumiverse-primary, #9370db)); --bk-paper: #f4ecd8; --bk-ink: #2b2418; --bk-dim: #7a6c52; --bk-edge: rgba(60,40,10,.3); }
.lf-bk-desk { position: absolute; left: 0; right: 0; top: var(--bk-top, 48px); bottom: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.lf-bk-write { position: relative; flex: none; width: var(--bk-paperw); height: 64px; margin-top: 8px; display: flex; gap: 8px; align-items: stretch; pointer-events: auto; }
.lf-bk-root[data-write="0"] .lf-bk-write { display: none; }
.lf-bk-write textarea { flex: 1; min-width: 0; resize: none; font-family: var(--bk-font); font-size: calc(15px * var(--bk-z, 1)); line-height: 1.4; color: var(--bk-ink); background: var(--bk-paper); border: 1px solid var(--bk-edge); border-radius: 8px; padding: 8px 12px; outline: none; box-shadow: none; text-align: left; user-select: text; -webkit-user-select: text; }
.lf-bk-write textarea:focus { border-color: var(--bk-accent); }
.lf-bk-write textarea::placeholder { color: var(--bk-dim); opacity: .85; }
.lf-bk-write[data-err="1"] textarea { border-color: #c0392b; }
.lf-bk-send { flex: none; width: 52px; border: 0; border-radius: 8px; background: var(--bk-accent); color: #fff; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; appearance: none; -webkit-tap-highlight-color: transparent; }
.lf-bk-send[disabled] { opacity: .4; cursor: default; }
.lf-bk-send:focus-visible { outline: 2px solid var(--bk-ink); outline-offset: 2px; }
.lf-bk-send svg { width: 22px; height: 22px; }
.lf-bk-island { display: block; margin: .6em 0; overflow: hidden; max-width: 100%; text-indent: 0; }
.lf-bk { position: relative; flex: none; width: var(--bk-paperw); height: var(--bk-paperh); pointer-events: auto; touch-action: pan-y pinch-zoom; user-select: none; -webkit-user-select: none; }
.lf-bk-paper { position: absolute; inset: 0; display: flex; border-radius: 6px; box-shadow: 0 10px 38px rgba(0,0,0,.45); }
.lf-bk-paper i { flex: 1; background-color: var(--bk-paper); background-image: var(--bk-tex, none); }
.lf-bk-paper i.l { border-radius: 6px 0 0 6px; box-shadow: inset -22px 0 18px -16px rgba(0,0,0,.3); }
.lf-bk-paper i.r { border-radius: 0 6px 6px 0; box-shadow: inset 22px 0 18px -16px rgba(0,0,0,.3); }
.lf-bk[data-sp="0"] .lf-bk-paper i.l { border-radius: 6px; box-shadow: none; }
.lf-bk[data-sp="0"] .lf-bk-paper i.r { display: none; }
.lf-bk-text { position: absolute; left: var(--bk-m); top: var(--bk-vp); width: var(--bk-tw); height: var(--bk-th); overflow: hidden; }
.lf-bk-text[data-fade="1"] { opacity: 0; transition: opacity .12s ease; }
.lf-bk-hd, .lf-bk-no, .lf-bk-fh, .lf-bk-fn { position: absolute; width: var(--bk-pw); font: calc(11px * var(--bk-z, 1))/1 var(--bk-font); letter-spacing: .14em; text-transform: uppercase; color: var(--bk-dim);
  text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; pointer-events: none; }
.lf-bk-hd, .lf-bk-fh { top: calc(var(--bk-vp) / 2 - 6px); }
.lf-bk-no, .lf-bk-fn { bottom: calc(var(--bk-vp) / 2 - 6px); }
.lf-bk-hd, .lf-bk-no { left: var(--bk-m); }
.lf-bk-fh, .lf-bk-fn { left: var(--bk-m); }
.lf-bk-hd.r, .lf-bk-no.r { left: var(--bk-rx); }
.lf-bk[data-sp="0"] .lf-bk-hd.r, .lf-bk[data-sp="0"] .lf-bk-no.r { display: none; }
.lf-bk-root[data-headers="0"] .lf-bk-hd, .lf-bk-root[data-headers="0"] .lf-bk-no, .lf-bk-root[data-headers="0"] .lf-bk-fh, .lf-bk-root[data-headers="0"] .lf-bk-fn { display: none; }
.lf-bk-no i { font-style: normal; text-transform: none; letter-spacing: .06em; opacity: .75; margin-left: .8em; }

/* the flow: one segment, poured into columns the width of a page */
.lf-bk-flow { width: var(--bk-tw); height: var(--bk-th); column-width: var(--bk-pw); column-gap: var(--bk-gap); column-fill: auto; overflow: visible;
  font-family: var(--bk-font); font-size: var(--bk-fs); line-height: var(--bk-lh); color: var(--bk-ink); text-align: justify; hyphens: auto; -webkit-hyphens: auto;
  widows: 2; orphans: 2; overflow-wrap: break-word; }
.lf-bk-measure { position: absolute; top: 0; left: -200vw; visibility: hidden; pointer-events: none; }
.lf-bk-flow p { margin: 0; text-indent: 1.4em; text-align: justify; line-height: var(--bk-lh); }
.lf-bk-flow .lf-bk-ch { text-align: center; margin: 0 0 1.1em; padding-top: .5em; break-after: avoid; break-inside: avoid; }
.lf-bk-ch small { display: block; font-size: .7em; letter-spacing: .24em; text-transform: uppercase; color: var(--bk-dim); }
.lf-bk-ch span { display: block; font-size: 1.35em; font-weight: 600; margin-top: .3em; line-height: 1.2; }
.lf-bk-ch small, .lf-bk-ch span, .lf-bk-ch i { text-align: center; }
.lf-bk-ch i { display: block; font-style: normal; font-size: 1.5em; line-height: 1; margin-top: .45em; letter-spacing: .3em; text-indent: .3em; color: var(--bk-accent); opacity: .9; }
.lf-bk-flow .lf-bk-m { display: block; text-align: justify; }
.lf-bk-flow .lf-bk-m + .lf-bk-m { margin-top: .55em; }
.lf-bk-flow .lf-bk-m[data-s] { break-inside: avoid; }
.lf-bk-flow .lf-bk-ch + .lf-bk-m > p:first-child, .lf-bk-flow .lf-bk-m > hr + p, .lf-bk-flow .lf-bk-m > .lf-bk-who + p { text-indent: 0; }
.lf-bk-flow .lf-bk-who { font-variant: small-caps; letter-spacing: .06em; color: var(--who, var(--bk-dim)); text-align: left; break-after: avoid; }
.lf-bk-root[data-user="rule"] .lf-bk-m[data-u="1"] { border-left: 3px solid var(--bk-accent); padding-left: .7em; }
.lf-bk-root[data-user="italic"] .lf-bk-m[data-u="1"] { font-style: italic; }
.lf-bk-root[data-user="smallcaps"] .lf-bk-m[data-u="1"] > p:first-of-type::first-line { font-variant: small-caps; letter-spacing: .04em; }
.lf-bk-flow blockquote { margin: .6em 1.2em; font-style: italic; }
.lf-bk-flow blockquote p { text-indent: 0; }
.lf-bk-flow hr { border: 0; height: 1.2em; margin: .7em 0; text-align: center; break-inside: avoid; }
.lf-bk-flow hr::after { content: "* * *"; letter-spacing: .5em; color: var(--bk-dim); }
.lf-bk-flow pre { white-space: pre-wrap; overflow-wrap: anywhere; font: .82em/1.4 ui-monospace, Menlo, Consolas, monospace; background: rgba(0,0,0,.07); padding: .5em .7em; border-radius: 6px;
  text-align: left; hyphens: none; margin: .5em 0; }
.lf-bk-flow code { font-family: ui-monospace, Menlo, Consolas, monospace; font-size: .9em; }
.lf-bk-flow img { display: block; max-width: 100%; max-height: calc(var(--bk-th) * .88); width: auto; height: auto; margin: .5em auto; object-fit: contain; break-inside: avoid; }
.lf-bk-flow table { width: 100%; table-layout: fixed; border-collapse: collapse; font-size: .9em; word-break: break-word; margin: .5em 0; }
.lf-bk-flow td, .lf-bk-flow th { border: 1px solid var(--bk-edge); padding: .2em .4em; text-align: left; }
.lf-bk-flow ul, .lf-bk-flow ol { margin: .4em 0; padding-left: 1.4em; text-align: left; }
.lf-bk-flow li { padding: 0; }
.lf-bk-flow details { border-left: 2px solid var(--bk-edge); padding-left: .6em; margin: .4em 0; }
.lf-bk-flow summary { font-style: italic; }
.lf-bk-flow h1, .lf-bk-flow h2, .lf-bk-flow h3, .lf-bk-flow h4, .lf-bk-flow h5, .lf-bk-flow h6 { font-size: 1.1em; text-align: left; margin: .6em 0 .3em; break-after: avoid; }
.lf-bk-flow .lf-bk-ch { font-size: inherit; margin: 0 0 1.1em; text-align: center; }
.lf-bk-plate { border: 1px dashed var(--bk-dim); color: var(--bk-dim); font: .78em/1.3 system-ui, sans-serif; text-align: center; padding: .7em; margin: .5em 0; break-inside: avoid; text-indent: 0; border-radius: 6px; }

/* a blank page: the start of a new chapter */
.lf-bk-blank { position: absolute; left: var(--bk-m); top: var(--bk-vp); width: var(--bk-pw); height: var(--bk-th); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px;
  font-family: var(--bk-font); color: var(--bk-ink); text-align: center; }
.lf-bk-blank[hidden] { display: none; }
.lf-bk-blank small { font-size: 12px; letter-spacing: .24em; text-transform: uppercase; color: var(--bk-dim); }
.lf-bk-blank input { width: 90%; max-width: 360px; font: inherit; font-size: 1.3em; text-align: center; color: var(--bk-ink); background: transparent; border: 0; border-bottom: 1px solid var(--bk-edge); border-radius: 0; padding: 6px 4px; outline: none; box-shadow: none; }
.lf-bk-blank input:focus { border-bottom-color: var(--bk-accent); }
.lf-bk-blank input::placeholder { color: var(--bk-dim); opacity: .8; }
.lf-bk-blank p { font-size: 13px; color: var(--bk-dim); max-width: 280px; line-height: 1.4; text-align: center; }

/* page turning */
.lf-bk-stage { position: absolute; inset: 0; perspective: 2400px; pointer-events: none; }
.lf-bk-under { position: absolute; top: 0; pointer-events: none; }
.lf-bk-leaf { position: absolute; top: 0; transform-origin: left center; transform-style: preserve-3d; pointer-events: none; }
.lf-bk-lf { position: absolute; inset: 0; backface-visibility: hidden; -webkit-backface-visibility: hidden; }
.lf-bk-lf-back { transform: rotateY(180deg); }
.lf-bk-face { position: absolute; inset: 0; background-color: var(--bk-paper); background-image: var(--bk-tex, none); overflow: hidden; border-radius: 3px; }
.lf-bk-face[data-h="l"] { box-shadow: inset -22px 0 18px -16px rgba(0,0,0,.3); }
.lf-bk-face[data-h="r"] { box-shadow: inset 22px 0 18px -16px rgba(0,0,0,.3); }
.lf-bk-ft { position: absolute; left: var(--bk-m); top: var(--bk-vp); width: var(--bk-pw); height: var(--bk-th); overflow: hidden; }
.lf-bk-shade { position: absolute; inset: 0; pointer-events: none; background: linear-gradient(to left, rgba(0,0,0,.6), transparent 75%); opacity: 0; }
.lf-bk-lf-back .lf-bk-shade { background: linear-gradient(to right, rgba(0,0,0,.6), transparent 75%); }

.lf-bk-edge { position: absolute; top: 0; bottom: 0; width: 13%; border: 0; background: transparent; cursor: pointer; -webkit-tap-highlight-color: transparent; appearance: none; }
.lf-bk-edge.l { left: 0; cursor: w-resize; }
.lf-bk-edge.r { right: 0; cursor: e-resize; }
.lf-bk-edge[disabled] { cursor: default; }
.lf-bk-edge::after { content: ""; position: absolute; top: 50%; width: 10px; height: 10px; border: solid var(--bk-dim); border-width: 0 2px 2px 0; opacity: 0; transition: opacity .2s ease; }
.lf-bk-edge.r::after { right: 16px; transform: translateY(-50%) rotate(-45deg); }
.lf-bk-edge.l::after { left: 16px; transform: translateY(-50%) rotate(135deg); }
.lf-bk-edge:hover:not([disabled])::after, .lf-bk-edge:focus-visible::after { opacity: .6; }
.lf-bk-edge:focus-visible { outline: 2px solid var(--bk-accent); outline-offset: -3px; }
.lf-bk-bar { position: absolute; top: calc(var(--app-interactive-safe-top, env(safe-area-inset-top, 0px)) / var(--lumiverse-ui-scale, 1) + 6px); right: 10px; display: flex; gap: 6px; pointer-events: auto; }
.lf-bk-btn { width: 40px; height: 40px; border-radius: 12px; border: 1px solid rgba(255,255,255,.14); background: rgba(12,12,20,.72); color: #fff; display: inline-flex; align-items: center; justify-content: center;
  cursor: pointer; appearance: none; font: inherit; -webkit-tap-highlight-color: transparent; }
.lf-bk-btn:hover { background: rgba(12,12,20,.9); }
.lf-bk-btn:focus-visible { outline: 2px solid var(--bk-accent); outline-offset: 1px; }
.lf-bk-btn svg { width: 20px; height: 20px; }
.lf-bk-chip { position: absolute; z-index: 5; left: 50%; bottom: calc(32px * var(--bk-z, 1)); transform: translateX(-50%); max-width: 90%; padding: 7px 14px; border-radius: 999px; border: 1px solid var(--bk-edge); background: var(--bk-ink); color: var(--bk-paper);
  font: 12px/1.2 system-ui, sans-serif; cursor: pointer; appearance: none; white-space: nowrap; }
.lf-bk-chip[hidden] { display: none; }
.lf-bk-live { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
@media (pointer: coarse) { .lf-bk-edge { width: 18%; } }
@media (prefers-reduced-motion: reduce) { .lf-bk-text[data-fade="1"], .lf-bk-edge::after { transition: none; } }

/* drop caps */
.lf-bk-root[data-dropcaps="1"] .lf-bk-flow .lf-bk-m[data-dc] > p:first-of-type { text-indent: 0; }
.lf-bk-root[data-dropcaps="1"] .lf-bk-flow .lf-bk-m[data-dc] > p:first-of-type::first-letter { float: left; font-size: calc(var(--bk-lh) * 2.49em); line-height: .78; padding: 0 .08em 0 0; font-weight: 600; color: var(--dc, var(--bk-accent)); }

/* the cover */
.lf-bk-cvw { position: absolute; inset: 0; z-index: 30; perspective: 2200px; cursor: pointer; pointer-events: auto; }
.lf-bk-cover { position: absolute; inset: -5px; border-radius: 9px; transform-origin: left center; display: flex; align-items: center; justify-content: center; color: var(--bk-gilt, #d9b765);
  background: linear-gradient(135deg, rgba(255,255,255,.07), transparent 40%, rgba(0,0,0,.25)), var(--bk-bind, #3a2a1c); box-shadow: 0 12px 44px rgba(0,0,0,.55), inset 0 0 70px rgba(0,0,0,.4);
  transition: transform .62s cubic-bezier(.5,0,.3,1), opacity .22s linear .42s; backface-visibility: hidden; -webkit-backface-visibility: hidden; }
.lf-bk-cvw[data-open="1"] { pointer-events: none; }
.lf-bk-cvw[data-open="1"] .lf-bk-cover { transform: rotateY(-104deg); opacity: 0; }
.lf-bk-cv-frame { position: absolute; inset: 6%; border: 2px solid var(--bk-gilt, #d9b765); outline: 1px solid color-mix(in srgb, var(--bk-gilt, #d9b765) 45%, transparent); outline-offset: 5px; border-radius: 3px;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: calc(14px * var(--bk-z, 1)); padding: 4%; text-align: center; font-family: var(--bk-font); overflow: hidden; }
.lf-bk-cv-frame > * { text-align: center; max-width: 100%; }
.lf-bk-cv-orn { font-size: calc(22px * var(--bk-z, 1)); letter-spacing: .3em; text-indent: .3em; opacity: .9; }
.lf-bk-cv-portrait { width: min(34%, calc(190px * var(--bk-z, 1))); aspect-ratio: 1; border-radius: 50%; border: 2px solid var(--bk-gilt, #d9b765); object-fit: cover; box-shadow: 0 0 0 4px rgba(0,0,0,.25); }
.lf-bk-cv-title { font-size: calc(28px * var(--bk-z, 1)); font-weight: 600; letter-spacing: .05em; line-height: 1.2; overflow-wrap: anywhere; }
.lf-bk-cv-by { font-size: calc(14px * var(--bk-z, 1)); font-style: italic; opacity: .85; }
.lf-bk-cv-hint { font-size: calc(11px * var(--bk-z, 1)); letter-spacing: .22em; text-transform: uppercase; opacity: .6; }

/* dog-ears: folding a corner marks the page */
.lf-bk-ear { position: absolute; top: 0; z-index: 3; width: calc(36px * var(--bk-z, 1)); height: calc(36px * var(--bk-z, 1)); padding: 0; border: 0; background: transparent; cursor: pointer; appearance: none; -webkit-tap-highlight-color: transparent; }
.lf-bk-ear.l { left: 0; }
.lf-bk-ear.r { right: 0; }
.lf-bk-ear::before { content: ""; position: absolute; inset: 0; background: var(--bk-accent); opacity: 0; transition: opacity .15s ease; }
.lf-bk-ear.r::before { clip-path: polygon(0 0, 100% 100%, 0 100%); }
.lf-bk-ear.l::before { clip-path: polygon(100% 0, 0 100%, 100% 100%); }
.lf-bk-ear:hover:not([disabled])::before, .lf-bk-ear:focus-visible::before { opacity: .38; }
.lf-bk-ear[data-on="1"]::before { opacity: .95; }
.lf-bk-ear:focus-visible { outline: 2px solid var(--bk-accent); outline-offset: -3px; }
.lf-bk-ear[disabled] { cursor: default; }
.lf-bk[data-sp="0"] .lf-bk-ear.l, .lf-bk[data-blank="1"] .lf-bk-ear { display: none; }

/* the heartbeat scrubber along the bottom edge */
.lf-bk-scrub { position: absolute; left: 25%; right: 25%; bottom: 0; height: calc(26px * var(--bk-z, 1)); z-index: 4; touch-action: none; cursor: pointer; }
.lf-bk[data-blank="1"] .lf-bk-scrub { display: none; }
.lf-bk-scrub-panel { position: absolute; left: calc(-50% + var(--bk-m)); right: calc(-50% + var(--bk-m)); bottom: calc(4px * var(--bk-z, 1)); height: calc(62px * var(--bk-z, 1)); border-radius: 10px; overflow: hidden; touch-action: none;
  background: color-mix(in srgb, var(--bk-paper) 92%, var(--bk-ink)); border: 1px solid var(--bk-edge); box-shadow: 0 4px 18px rgba(0,0,0,.35);
  opacity: 0; transform: translateY(8px); pointer-events: none; transition: opacity .16s ease, transform .16s ease; }
.lf-bk-scrub[data-open="1"] .lf-bk-scrub-panel { opacity: 1; transform: none; pointer-events: auto; }
.lf-bk-scrub-panel svg { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
.lf-bk-scrub-tip { position: absolute; left: 10px; top: 5px; right: 10px; font: calc(11px * var(--bk-z, 1))/1.1 var(--bk-font); letter-spacing: .08em; color: var(--bk-dim); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; pointer-events: none; }
.sb-line { fill: none; stroke: var(--bk-accent); stroke-width: 1.6; stroke-linejoin: round; }
.sb-mid { stroke: var(--bk-edge); stroke-dasharray: 2 4; }
.sb-tick { stroke: var(--bk-dim); stroke-width: 1; opacity: .55; }
.sb-star { fill: #f2b84b; stroke: var(--bk-paper); stroke-width: 1; stroke-linejoin: round; }
.sb-head { stroke: var(--bk-ink); stroke-width: 2; }

/* the contents page */
.lf-bk-toc { position: absolute; inset: 0; z-index: 6; border-radius: 6px; overflow: auto; padding: calc(var(--bk-vp) + 6px) var(--bk-m); pointer-events: auto; color: var(--bk-ink); font-family: var(--bk-font); font-size: calc(16px * var(--bk-z, 1));
  background-color: var(--bk-paper); background-image: var(--bk-tex, none); box-shadow: 0 10px 38px rgba(0,0,0,.45); user-select: none; -webkit-user-select: none; }
.lf-bk-toc[hidden] { display: none; }
.lf-bk-toc-in { max-width: 560px; margin: 0 auto; }
.lf-bk-toc h2 { text-align: center; font-size: 1.35em; font-weight: 600; letter-spacing: .08em; margin-bottom: .2em; }
.lf-bk-toc .orn { display: block; text-align: center; color: var(--bk-accent); margin-bottom: .9em; letter-spacing: .3em; text-indent: .3em; }
.lf-bk-toc h3 { font-size: .72em; letter-spacing: .24em; text-transform: uppercase; color: var(--bk-dim); margin: 1.4em 0 .4em; font-weight: 600; }
.lf-bk-toc ol { list-style: none; }
.lf-bk-toc li { display: flex; align-items: baseline; gap: .3em; }
.lf-bk-toc .go { flex: 1; min-width: 0; display: flex; align-items: baseline; gap: .55em; padding: .38em 0; border: 0; background: none; color: inherit; font: inherit; text-align: left; cursor: pointer; appearance: none; }
.lf-bk-toc .go:hover .t, .lf-bk-toc .go:focus-visible .t { text-decoration: underline; }
.lf-bk-toc .go:focus-visible { outline: 2px solid var(--bk-accent); outline-offset: 2px; }
.lf-bk-toc .n { color: var(--bk-dim); font-size: .78em; letter-spacing: .12em; text-transform: uppercase; white-space: nowrap; }
.lf-bk-toc .t { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; }
.lf-bk-toc .lead { flex: 1; min-width: .6em; border-bottom: 1px dotted var(--bk-dim); transform: translateY(-.28em); }
.lf-bk-toc .pg { color: var(--bk-dim); font-variant-numeric: tabular-nums; min-width: 2ch; text-align: right; }
.lf-bk-toc .ed { flex: none; width: 2em; height: 2em; border: 0; border-radius: 50%; background: none; color: var(--bk-dim); cursor: pointer; font: inherit; opacity: .55; appearance: none; }
.lf-bk-toc .ed:hover, .lf-bk-toc .ed:focus-visible { opacity: 1; }
.lf-bk-toc input { flex: 1; min-width: 0; font: inherit; color: var(--bk-ink); background: transparent; border: 0; border-bottom: 1px solid var(--bk-accent); border-radius: 0; padding: .3em 0; outline: none; box-shadow: none; }
.lf-bk-toc .mk { font-style: italic; }
.lf-bk-toc .mk::before { content: "★"; color: #f2b84b; font-style: normal; margin-right: .5em; }

/* the AI's options, set at the foot of the page, and the other drafts of a reply */
.lf-bk-flow .lf-bk-opts { display: block; margin: .9em 0 0; padding-top: .6em; border-top: 1px solid var(--bk-edge); break-inside: avoid; text-indent: 0; text-align: left; }
.lf-bk-opts button { display: flex; width: 100%; align-items: baseline; gap: .5em; padding: .3em 0; border: 0; background: none; color: var(--bk-ink); font: inherit; text-align: left; cursor: pointer; appearance: none; hyphens: none; -webkit-tap-highlight-color: transparent; }
.lf-bk-opts button::before { content: "▸"; color: var(--bk-accent); flex: none; }
.lf-bk-opts button:hover .t, .lf-bk-opts button:focus-visible .t { text-decoration: underline; }
.lf-bk-opts button:focus-visible { outline: 2px solid var(--bk-accent); outline-offset: 2px; }
.lf-bk-opts .lead { flex: 1; min-width: .5em; align-self: end; border-bottom: 1px dotted var(--bk-dim); transform: translateY(-.3em); }
.lf-bk-opts .pg { flex: none; font-size: .78em; color: var(--bk-dim); white-space: nowrap; }
.lf-bk-opts[data-used] button:not([data-picked]) { opacity: .4; }
.lf-bk-flow .lf-bk-draft { display: flex; justify-content: flex-end; align-items: center; gap: .5em; margin-top: .5em; font-size: .78em; font-style: italic; color: var(--bk-dim); break-inside: avoid; text-indent: 0; text-align: right; }
.lf-bk-draft button { width: 2em; height: 2em; padding: 0; border: 1px solid var(--bk-edge); border-radius: 50%; background: none; color: inherit; font: inherit; line-height: 1; cursor: pointer; appearance: none; font-style: normal; }
.lf-bk-draft button:hover:not([disabled]) { color: var(--bk-ink); border-color: var(--bk-dim); }
.lf-bk-draft button[disabled] { opacity: .3; cursor: default; }
.lf-bk-draft button:focus-visible { outline: 2px solid var(--bk-accent); outline-offset: 2px; }

/* the desk: warm light falls on the pages */
.lf-bk-glow { position: absolute; inset: 0; border-radius: 6px; pointer-events: none; opacity: 0; transition: opacity 1.2s ease; background: radial-gradient(ellipse at 50% 108%, var(--bk-glow, rgba(255,170,80,.3)), transparent 72%); }
.lf-bk-glow[data-on="1"] { opacity: 1; }
.lf-bk-glow[data-breathe="1"] { animation: lf-bk-breathe 4.4s ease-in-out infinite; }
@keyframes lf-bk-breathe { 0%, 100% { opacity: 1; } 50% { opacity: .7; } }

/* ink settling into new writing */
.lf-bk-ink { animation: lf-bk-ink .4s ease-out both; }
@keyframes lf-bk-ink { from { opacity: 0; color: var(--bk-dim); } to { opacity: 1; } }
@media (prefers-reduced-motion: reduce) { .lf-bk-ink, .lf-bk-glow[data-breathe="1"], .lf-bk-cover { animation: none; transition: none; } }
`

const TAG = (s: string) => s.replace(/[<>&"]/g, '')
/** The plain words of a piece's markup (parsed inertly: nothing in it loads or runs). */
const plainOf = (html: string) => (new DOMParser().parseFromString(html.replace(/<(style|script)[\s\S]*?<\/\1>/gi, ''), 'text/html').body.textContent ?? '').replace(/\s+/g, ' ').trim()
const SAFE_SRC = /^(https?:|\/|blob:|data:image\/)/i

/** Wrap the text between two character offsets of `root` in `.lf-bk-ink` spans that carry on an animation `delay` ms into its run. */
function inkRange(root: Element, from: number, to: number, delay: number) {
  if (to <= from) return
  const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  const todo: Array<[Text, number, number]> = []
  let pos = 0
  for (let n = tw.nextNode() as Text | null; n; n = tw.nextNode() as Text | null) {
    const a = Math.max(from, pos)
    const b = Math.min(to, pos + n.data.length)
    if (b > a) todo.push([n, a - pos, b - pos])
    pos += n.data.length
    if (pos >= to) break
  }
  for (const [n, a, b] of todo) {
    const mid = a > 0 ? n.splitText(a) : n
    if (b - a < mid.data.length) mid.splitText(b - a)
    const span = document.createElement('span')
    span.className = 'lf-bk-ink'
    span.style.animationDelay = `${Math.round(delay)}ms`
    mid.replaceWith(span)
    span.appendChild(mid)
  }
}
const frame = () => new Promise<void>((r) => requestAnimationFrame(() => r()))
const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))
const editable = (el: EventTarget | null) => {
  const e = el as HTMLElement | null
  return !!e && (e.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(e.tagName))
}

export class Book {
  private on_ = false
  private chatId = ''
  private pieces: Piece[] = []
  private breaks = new Set<string>()
  private segs: Segment[] = []
  private where = new Map<string, number>()
  private byId = new Map<string, Piece>()
  private sending = false
  private g!: Geometry
  private lk = ''
  private pos: Pos = { seg: 0, view: 0 }
  private flows = new Map<string, { el: HTMLElement; sig: string }>()
  private counts = new Map<string, number>()
  private shown: HTMLElement | null = null
  private ready = false
  private busy = false
  private loadToken = 0
  private countToken = 0
  private liveId: string | null = null
  private liveReal: string | null = null
  private livePoll: ReturnType<typeof setInterval> | undefined
  private reloadTimer: ReturnType<typeof setTimeout> | undefined
  private saveTimer: ReturnType<typeof setTimeout> | undefined
  private resizeTimer: ReturnType<typeof setTimeout> | undefined
  private imgTimer: ReturnType<typeof setTimeout> | undefined
  private imgPending = new Set<HTMLElement>()
  private goAfter: string | null = null
  private pendingTitle = ''
  private chipTarget: Pos | null = null
  private stop: (() => void) | null = null
  /** Every older batch has been read, so the first piece really is the first message. */
  private full = false
  private coverEl: HTMLElement | null = null
  private coverTimer: ReturnType<typeof setTimeout> | undefined
  private earIds: { l: string | null; r: string | null } = { l: null, r: null }
  private tocOn = false
  private scrubTimer: ReturnType<typeof setTimeout> | undefined
  private scrubDrag = false
  private scrubFrame = 0
  private inkRuns: Array<{ from: number; to: number; t: number }> = []
  private ornament = DEFAULT_ORNAMENT
  private glowKey = ''
  private ui!: {
    root: HTMLElement
    desk: HTMLElement
    book: HTMLElement
    text: HTMLElement
    blank: HTMLElement
    blankTitle: HTMLInputElement
    stage: HTMLElement
    measure: HTMLElement
    live: HTMLElement
    chip: HTMLButtonElement
    write: HTMLElement
    ta: HTMLTextAreaElement
    send: HTMLButtonElement
    reply: HTMLButtonElement
    smaller: HTMLButtonElement
    larger: HTMLButtonElement
    edgeL: HTMLButtonElement
    edgeR: HTMLButtonElement
    hdL: HTMLElement
    hdR: HTMLElement
    noL: HTMLElement
    noR: HTMLElement
    glow: HTMLElement
    earL: HTMLButtonElement
    earR: HTMLButtonElement
    scrub: HTMLElement
    scrubPanel: HTMLElement
    scrubTip: HTMLElement
    toc: HTMLElement
    contents: HTMLButtonElement
  }

  constructor(private h: BookHooks) {}

  get on() {
    return this.on_
  }

  toggle(from?: string | null) {
    if (this.on_) this.exit()
    else this.enter(from)
  }

  // ── Opening and closing ──

  /** Open the book on the current chat. `from` is a message to open at (else the ribbon, else the newest page). */
  enter(from?: string | null) {
    const chat = this.h.chatId()
    if (this.on_ || !chat) return
    this.on_ = true
    this.chatId = chat
    this.ready = false
    this.h.closeDrawer()
    setPlateLabel(this.h.tr('Interactive content: open in chat'))
    setIgnore(this.h.get().ignore)
    setIgnoreLabel(this.h.tr('Leave this out of the book'))
    document.documentElement.setAttribute('data-lf-book', '1')
    this.h.style.textContent = bookHideCss(this.h.get().writeHere)
    this.build()
    this.maybeCover()
    this.listen()
    this.h.changed(true)
    this.h.save(setFlag(this.h.data(), chat, 'open', true))
    void this.load(from ?? null)
  }

  /** Leave the book. `reveal` shows the message you were reading in the chat; `keep` leaves the chat marked as read-as-a-book (a chat switch, a reopen). */
  exit(reveal = true, keep = false) {
    if (!this.on_) return
    const id = reveal && this.ready ? this.currentId() : null
    this.saveRibbon()
    if (!keep && this.chatId) this.h.save(setFlag(this.h.data(), this.chatId, 'open', false))
    this.on_ = false
    this.ready = false
    this.loadToken++
    this.countToken++
    this.stop?.()
    this.stop = null
    clearInterval(this.livePoll)
    clearTimeout(this.reloadTimer)
    clearTimeout(this.saveTimer)
    clearTimeout(this.resizeTimer)
    clearTimeout(this.imgTimer)
    clearTimeout(this.coverTimer)
    clearTimeout(this.scrubTimer)
    cancelAnimationFrame(this.scrubFrame)
    this.coverEl = null
    this.tocOn = false
    this.scrubDrag = false
    this.inkRuns = []
    this.glowKey = ''
    this.imgPending.clear()
    this.livePoll = undefined
    this.liveId = this.liveReal = null
    this.flows.clear()
    this.counts.clear()
    this.shown = null
    this.pieces = []
    this.segs = []
    this.busy = false
    this.h.root.replaceChildren()
    this.h.root.style.top = this.h.root.style.height = this.h.root.style.bottom = ''
    this.sending = false
    this.h.style.textContent = ''
    document.documentElement.removeAttribute('data-lf-compose')
    document.documentElement.removeAttribute('data-lf-book')
    this.h.changed(false)
    if (id) this.h.reveal(id)
  }

  destroy() {
    this.exit(false, true)
  }

  /** A setting changed (text size, font, paper…). */
  refresh() {
    if (!this.on_ || !this.ready) return
    // New rules for what to leave out mean the pages have to be made again, from the chat.
    if (setIgnore(this.h.get().ignore)) {
      const id = this.currentId()
      this.exit(false, true)
      this.enter(id)
      return
    }
    this.h.style.textContent = bookHideCss(this.h.get().writeHere)
    this.syncBottom(true)
    this.relayout()
    this.syncWrite()
    this.glowKey = ''
    this.glow()
    this.ears()
  }

  // ── Building the page ──

  private build() {
    const t = this.h.tr
    const root = document.createElement('div')
    root.className = 'lf-bk-root'
    root.setAttribute('role', 'region')
    root.setAttribute('aria-label', t('Book mode'))
    root.innerHTML = `
<div class="lf-bk-desk">
  <div class="lf-bk" data-sp="1">
    <div class="lf-bk-paper"><i class="l"></i><i class="r"></i></div>
    <div class="lf-bk-glow"></div>
    <div class="lf-bk-text"></div>
    <div class="lf-bk-blank" hidden><small></small><input type="text" maxlength="120" autocomplete="off" spellcheck="false"><p></p></div>
    <div class="lf-bk-hd l"></div><div class="lf-bk-hd r"></div>
    <div class="lf-bk-no l"></div><div class="lf-bk-no r"></div>
    <div class="lf-bk-stage"></div>
    <button type="button" class="lf-bk-edge l"></button>
    <button type="button" class="lf-bk-edge r"></button>
    <button type="button" class="lf-bk-ear l"></button><button type="button" class="lf-bk-ear r"></button>
    <button type="button" class="lf-bk-chip" hidden></button>
    <div class="lf-bk-scrub" aria-hidden="true"><div class="lf-bk-scrub-panel"><div class="lf-bk-scrub-tip"></div></div></div>
    <div class="lf-bk-toc" hidden role="region"></div>
  </div>
  <div class="lf-bk-write"><textarea rows="2" maxlength="20000"></textarea><button type="button" class="lf-bk-send">${ICON.send}</button></div>
</div>
<div class="lf-bk-bar">
  <button type="button" class="lf-bk-btn" data-act="contents" aria-expanded="false">${ICON.list}</button>
  <button type="button" class="lf-bk-btn" data-act="smaller">${ICON.smaller}</button>
  <button type="button" class="lf-bk-btn" data-act="larger">${ICON.larger}</button>
  <button type="button" class="lf-bk-btn" data-act="reply" aria-pressed="false">${ICON.pen}</button>
  <button type="button" class="lf-bk-btn" data-act="chat">${ICON.chat}</button>
  <button type="button" class="lf-bk-btn" data-act="close">${ICON.close}</button>
</div>
<div class="lf-bk-measure" aria-hidden="true"></div>
<div class="lf-bk-live" aria-live="polite"></div>`
    const q = <T extends HTMLElement>(s: string) => root.querySelector(s) as T
    const chat = q<HTMLButtonElement>('[data-act="chat"]')
    const close = q<HTMLButtonElement>('[data-act="close"]')
    chat.title = chat.ariaLabel = t('Open this page in the chat')
    close.title = close.ariaLabel = t('Close the book')
    chat.addEventListener('click', () => this.exit(true))
    close.addEventListener('click', () => this.exit(true))
    const contents = q<HTMLButtonElement>('[data-act="contents"]')
    contents.title = contents.ariaLabel = t('Contents')
    contents.addEventListener('click', () => this.toggleToc())
    const toc = q('.lf-bk-toc')
    toc.ariaLabel = t('Contents')
    toc.addEventListener('click', (e) => this.tocClick(e))
    const earL = q<HTMLButtonElement>('.lf-bk-ear.l')
    const earR = q<HTMLButtonElement>('.lf-bk-ear.r')
    earL.addEventListener('click', () => this.toggleEar('l'))
    earR.addEventListener('click', () => this.toggleEar('r'))
    const smaller = q<HTMLButtonElement>('[data-act="smaller"]')
    const larger = q<HTMLButtonElement>('[data-act="larger"]')
    smaller.title = smaller.ariaLabel = t('Smaller book')
    larger.title = larger.ariaLabel = t('Larger book')
    smaller.addEventListener('click', () => this.nudgeSize(-0.1))
    larger.addEventListener('click', () => this.nudgeSize(0.1))
    const reply = q<HTMLButtonElement>('[data-act="reply"]')
    reply.addEventListener('click', () => this.toggleHostReply())
    const write = q('.lf-bk-write')
    const ta = write.querySelector('textarea') as HTMLTextAreaElement
    const sendBtn = write.querySelector('.lf-bk-send') as HTMLButtonElement
    sendBtn.title = sendBtn.ariaLabel = t('Send')
    ta.setAttribute('aria-label', t('Write your next line'))
    ta.addEventListener('input', () => write.removeAttribute('data-err'))
    ta.addEventListener('keydown', (e) => {
      // Enter sends on a computer; on a phone it is a new line and the button sends.
      if (e.key === 'Enter' && !e.shiftKey && !e.isComposing && !window.matchMedia('(pointer: coarse)').matches) {
        e.preventDefault()
        void this.submit()
      }
    })
    sendBtn.addEventListener('click', () => void this.submit())
    const edgeL = q<HTMLButtonElement>('.lf-bk-edge.l')
    const edgeR = q<HTMLButtonElement>('.lf-bk-edge.r')
    edgeL.ariaLabel = t('Previous page')
    edgeR.ariaLabel = t('Next page')
    this.edgeDrag(edgeL, -1)
    this.edgeDrag(edgeR, 1)
    const blank = q('.lf-bk-blank')
    const blankTitle = blank.querySelector('input') as HTMLInputElement
    blankTitle.placeholder = t('Chapter title (optional)')
    blankTitle.setAttribute('aria-label', t('Chapter title (optional)'))
    blankTitle.addEventListener('input', () => (this.pendingTitle = blankTitle.value))
    ;(blank.querySelector('p') as HTMLElement).textContent = t('Write in the box below to begin this chapter. Turn back to leave it blank.')
    const chip = q<HTMLButtonElement>('.lf-bk-chip')
    chip.addEventListener('click', () => {
      const to = this.chipTarget
      this.hideChip()
      if (to) void this.jump(to)
    })
    this.h.root.replaceChildren(root)
    this.ui = {
      root,
      desk: q('.lf-bk-desk'),
      book: q('.lf-bk'),
      text: q('.lf-bk-text'),
      blank,
      blankTitle,
      stage: q('.lf-bk-stage'),
      measure: q('.lf-bk-measure'),
      live: q('.lf-bk-live'),
      chip,
      write,
      ta,
      send: sendBtn,
      reply,
      smaller,
      larger,
      edgeL,
      edgeR,
      hdL: q('.lf-bk-hd.l'),
      hdR: q('.lf-bk-hd.r'),
      noL: q('.lf-bk-no.l'),
      noR: q('.lf-bk-no.r'),
      glow: q('.lf-bk-glow'),
      earL,
      earR,
      scrub: q('.lf-bk-scrub'),
      scrubPanel: q('.lf-bk-scrub-panel'),
      scrubTip: q('.lf-bk-scrub-tip'),
      toc,
      contents,
    }
    this.scrubWire()
    this.applyVars()
  }

  /** Geometry and the CSS variables that depend on it and on the settings. Returns whether the layout changed. */
  private applyVars(): boolean {
    const u = this.ui
    const s = this.h.get()
    u.root.style.setProperty('--bk-top', 'calc(48px + var(--app-interactive-safe-top, env(safe-area-inset-top, 0px)) / var(--lumiverse-ui-scale, 1))')
    const areaW = u.desk.clientWidth || u.root.clientWidth || window.innerWidth
    // The writing line takes its room under the book.
    const areaH = (u.desk.clientHeight || Math.max(300, window.innerHeight - 160)) - (s.writeHere ? WRITE_H + 8 : 0)
    // On a phone the page is the width of the screen, so the same size would only mean a few words a line.
    const z = s.size * (areaW < 600 ? 0.85 : 1)
    const g = geometry(areaW, areaH, s.margins, z)
    const st = u.root.style
    st.setProperty('--bk-pw', `${g.pageW}px`)
    st.setProperty('--bk-tw', `${g.spread ? 2 * g.pageW + g.gap : g.pageW}px`)
    st.setProperty('--bk-th', `${g.textH}px`)
    st.setProperty('--bk-gap', `${g.gap}px`)
    st.setProperty('--bk-m', `${g.m}px`)
    st.setProperty('--bk-vp', `${g.vpad}px`)
    st.setProperty('--bk-rx', `${g.paperW / 2 + g.m}px`)
    st.setProperty('--bk-paperw', `${g.paperW}px`)
    st.setProperty('--bk-paperh', `${g.paperH}px`)
    st.setProperty('--bk-fs', `calc(17px * var(--lumiverse-font-scale, 1) * ${s.scale * z})`)
    st.setProperty('--bk-z', String(z))
    u.root.dataset.write = s.writeHere ? '1' : '0'
    const th = paperTheme(s.paper, this.h.pack())
    for (const [k, v] of Object.entries(th.vars)) st.setProperty(k, v)
    st.setProperty('--bk-tex', th.tex)
    st.setProperty('--bk-bind', th.binding)
    st.setProperty('--bk-gilt', th.gilt)
    this.ornament = th.ornament
    u.root.dataset.dropcaps = s.dropCaps ? '1' : '0'
    u.smaller.disabled = s.size <= 0.8 + 0.001
    u.larger.disabled = s.size >= 2 - 0.001
    st.setProperty('--bk-lh', String(s.lineHeight))
    st.setProperty('--bk-font', FONTS[s.font])
    u.root.dataset.paper = s.paper
    u.root.dataset.user = s.user
    u.root.dataset.headers = s.headers ? '1' : '0'
    u.book.dataset.sp = g.spread ? '1' : '0'
    // The blank page is the left page (or the only page) of the spread.
    const lk = layoutKey(g, [s.scale, z, s.lineHeight, s.font, s.margins, this.h.lang(), s.dropCaps ? 1 : 0, th.ornament])
    const changed = lk !== this.lk
    this.g = g
    this.lk = lk
    return changed
  }

  /** The room under the book: the host's reply box stays where it is. */
  private syncBottom(quiet = false) {
    if (!this.on_) return
    const input = document.querySelector<HTMLElement>('[data-component="InputArea"]')
    // Measured against the full-screen host, not the root: the root is the part that shrinks to leave this room.
    const hr = this.h.root.getBoundingClientRect()
    let bottom = 0
    if (input && hr.height) {
      const r = input.getBoundingClientRect()
      const zoom = hr.height / (this.h.root.offsetHeight || hr.height) || 1
      if (r.height > 0 && r.top < hr.bottom) bottom = Math.max(0, (hr.bottom - r.top) / zoom)
    }
    const prev = this.ui.root.style.getPropertyValue('--bk-bottom')
    if (prev !== `${Math.round(bottom)}px`) {
      this.ui.root.style.setProperty('--bk-bottom', `${Math.round(bottom)}px`)
      if (!quiet) this.scheduleRelayout()
    }
  }

  private scheduleRelayout() {
    clearTimeout(this.resizeTimer)
    this.resizeTimer = setTimeout(() => this.relayout(), 120)
  }

  /** The window or the settings changed: lay the pages out again, keeping the reading position. */
  private relayout() {
    if (!this.on_ || !this.ready) return
    // Where the reader is has to be read before the new sizes reach the page.
    const a = this.anchor()
    const changed = this.applyVars()
    if (!changed) return
    for (const e of this.flows.values()) e.el.remove()
    this.flows.clear()
    this.shown = null
    this.rebuild(a)
  }

  // ── Loading the chat ──

  private chapterList(): Chapter[] {
    return this.h.data()[this.chatId]?.chapters ?? []
  }

  private toPieces(msgs: RawMessage[]): Piece[] {
    const out: Piece[] = []
    for (const m of msgs) {
      if (isHidden(m)) continue
      const p = pieceOf(m, this.h.mounted(m.id))
      if (p) out.push(p)
    }
    return out
  }

  private fromMounted(): Piece[] {
    const out: Piece[] = []
    for (const c of this.h.mountedCards()) {
      const p = pieceOf({ id: c.id, is_user: c.user, name: c.name, content: '' }, c.el)
      if (p) out.push(p)
    }
    return out
  }

  private async load(from: string | null) {
    const token = ++this.loadToken
    const chat = this.chatId
    this.pieces = []
    this.full = false
    this.breaks.clear()
    const dead = () => token !== this.loadToken || !this.on_
    // Where to open: a message the reader chose, else where they left off. It may be further back than the newest 200.
    const want = from ?? this.h.data()[chat]?.ribbon?.id ?? null
    let first = true
    let held: Piece[] = []
    const begin = (list: Piece[]) => {
      first = false
      this.pieces = list
      this.ready = true
      this.initial(from)
    }
    if (this.h.read) {
      try {
        await readChat(
          this.h.read,
          chat,
          (msgs, oldest) => {
            if (oldest) this.full = true
            const batch = this.toPieces(msgs)
            // Each batch starts a segment, so reading older ones later doesn't move the pages already laid out.
            if (batch[0]) this.breaks.add(batch[0].id)
            if (first) {
              const all = batch.concat(held)
              if (want && !oldest && !all.some((p) => p.id === want)) {
                held = all // keep reading back until the place to open at is here
                return
              }
              begin(all)
            } else if (batch.length) {
              const a = this.anchor()
              this.pieces = batch.concat(this.pieces)
              this.rebuild(a)
            }
          },
          dead,
        )
        return
      } catch (err) {
        console.warn('[Lumi Flair] Book mode: reading the whole chat failed, using the messages on screen', err)
        if (dead()) return
        if (!first) return
      }
    }
    if (!dead() && first) {
      const list = this.fromMounted()
      if (list[0]) this.breaks.add(list[0].id)
      begin(list)
    }
  }

  /** Lay out for the first time and open at the right place. */
  private initial(from: string | null) {
    this.syncBottom(true)
    this.applyVars()
    this.segs = segments(this.pieces, this.chapterList(), SEGMENT_CHARS, this.breaks)
    this.indexSegs()
    this.pos = this.startPos(from)
    this.paint()
    this.announce()
    this.startCount()
    this.syncBottom()
    this.armCover()
    if (this.h.streaming() && !this.liveId) this.startLive(null)
  }

  private startPos(from: string | null): Pos {
    const rb = this.h.data()[this.chatId]?.ribbon
    const want = from ? { id: from, off: 0 } : rb
    const p = want && this.where.has(want.id) ? this.locate(want.id, want.off) : null
    if (p) return p
    const last = this.segs.length - 1
    return last < 0 ? { seg: 0, view: 0 } : { seg: last, view: this.viewsOf(last) - 1 }
  }

  private indexSegs() {
    this.byId.clear()
    for (const p of this.pieces) this.byId.set(p.id, p)
    this.where.clear()
    this.segs.forEach((s, i) => s.pieces.forEach((p) => this.where.set(p.id, i)))
  }

  // ── Segments, flows and pages ──

  private chapterTitle(n: number): string {
    // The first chapter can be titled too: a stored chapter at the very first message (only once the whole chat is read).
    if (n === 0) return this.full && this.pieces[0] ? this.chapterList().find((c) => c.startId === this.pieces[0].id)?.title ?? '' : ''
    const c = orderChapters(this.pieces, this.chapterList())[n - 1]
    return c?.title ?? ''
  }

  private chapterLabel(n: number): string {
    return `${this.h.tr('Chapter')} ${n + 1}`
  }

  private segSig(s: Segment): string {
    const last = s === this.segs[this.segs.length - 1]
    const tail = last ? `${this.liveId ? 'L' : ''}${this.h.choices().on ? 'c' : ''}` : ''
    return hash(`${s.id}|${s.opens ? 1 : 0}|${s.chapter}|${this.chapterTitle(s.chapter)}|${tail}|${s.pieces.map((p) => p.key).join(',')}`)
  }

  private sectionHtml(p: Piece, dc = false): string {
    const who = this.h.group() && !p.user && p.name ? `<div class="lf-bk-who"${this.whoStyle(p.name)}>${esc(p.name)}</div>` : ''
    const c = dc ? this.h.colorFor(p.name || this.h.characterName()) : null
    const cap = dc ? ` data-dc="1"${c && /^[#a-z0-9(),.\s%-]+$/i.test(c) ? ` style="--dc:${TAG(c)}"` : ''}` : ''
    return `<section class="lf-bk-m" data-id="${esc(p.id)}"${p.user ? ' data-u="1"' : ''}${p.exact ? '' : ' data-raw="1"'}${p.len < 260 ? ' data-s="1"' : ''}${cap}>${who}${p.html}</section>`
  }

  /** The piece that gets the chapter's drop cap: the first reply of a chapter (else its first piece). */
  private dcPiece(s: Segment): string | null {
    if (!s.opens) return null
    return (s.pieces.slice(0, 3).find((p) => !p.user) ?? s.pieces[0])?.id ?? null
  }

  /** What follows the newest reply: the other drafts of it, and the options it offers. */
  private tailHtml(s: Segment): string {
    if (s !== this.segs[this.segs.length - 1] || this.liveId) return ''
    const last = s.pieces[s.pieces.length - 1]
    if (!last || last.user || last.id === 'live') return ''
    const t = this.h.tr
    let out = ''
    const d = last.draft
    if (d && d.n > 1) {
      out += `<div class="lf-bk-draft"><button type="button" data-draft="-1" aria-label="${esc(t('Previous draft'))}"${d.i <= 0 ? ' disabled' : ''}>‹</button><span>${esc(t('draft'))} ${d.i + 1} ${esc(t('of'))} ${d.n}</span><button type="button" data-draft="1" aria-label="${esc(t('Next draft'))}"${d.i >= d.n - 1 ? ' disabled' : ''}>›</button></div>`
    }
    if (this.h.choices().on && last.choices.length) {
      const go = esc(t('turn the page'))
      out += `<nav class="lf-bk-opts" aria-label="${esc(t('Ways the story could go'))}">${last.choices.map((o, i) => `<button type="button" data-opt="${i}"><span class="t">${esc(o)}</span><i class="lead"></i><span class="pg">${go}</span></button>`).join('')}</nav>`
    }
    return out
  }

  private whoStyle(name: string): string {
    const c = this.h.colorFor(name)
    return c && /^[#a-z0-9(),.\s%-]+$/i.test(c) ? ` style="--who:${TAG(c)}"` : ''
  }

  private segHtml(s: Segment): string {
    let head = ''
    if (s.opens) {
      const title = this.chapterTitle(s.chapter)
      head = `<h2 class="lf-bk-ch"><small>${esc(this.chapterLabel(s.chapter))}</small>${title ? `<span>${esc(title)}</span>` : ''}<i aria-hidden="true">${esc(this.ornament)}</i></h2>`
    }
    const dc = this.dcPiece(s)
    return head + s.pieces.map((p) => this.sectionHtml(p, p.id === dc)).join('') + this.tailHtml(s)
  }

  private buildFlow(s: Segment): HTMLElement {
    const el = document.createElement('div')
    el.className = 'lf-bk-flow'
    el.lang = this.h.lang()
    el.innerHTML = this.segHtml(s)
    hydrateIslands(el, (id) => this.byId.get(id), () => this.imgLoaded(el), (rule) => this.h.addIgnore(rule))
    // An image that arrives late changes where the pages break.
    el.addEventListener('load', () => this.imgLoaded(el), true)
    el.addEventListener('click', (e) => this.flowClick(e))
    return el
  }

  /**
   * An image that arrives late changes where the pages break: count that segment again. (A flow that was only built to
   * count pages is gone by then; it is counted again when it is shown. Nothing is rebuilt, so this cannot loop.)
   */
  private imgLoaded(el: HTMLElement) {
    this.imgPending.add(el)
    clearTimeout(this.imgTimer)
    this.imgTimer = setTimeout(() => {
      if (!this.on_ || !this.ready) return
      if (this.busy) return this.imgLoaded(el)
      const hit = [...this.imgPending]
      this.imgPending.clear()
      let again = false
      for (const f of hit) {
        const e = [...this.flows.values()].find((x) => x.el === f)
        if (!e) continue
        this.counts.delete(`${e.sig}|${this.lk}`)
        again = true
        if (f === this.shown) this.paint()
      }
      if (again) this.startCount()
    }, 200)
  }

  /** The laid-out flow of a segment: cached, and at most MAX_FLOWS are kept. */
  private flowFor(i: number): HTMLElement {
    const s = this.segs[i]
    const sig = this.segSig(s)
    let e = this.flows.get(s.id)
    if (!e || e.sig !== sig) {
      e?.el.remove()
      e = { el: this.buildFlow(s), sig }
      this.ui.measure.appendChild(e.el)
    }
    this.flows.delete(s.id)
    this.flows.set(s.id, e)
    while (this.flows.size > MAX_FLOWS) {
      const k = this.flows.keys().next().value as string
      const old = this.flows.get(k)!
      if (old.el === this.shown) {
        this.flows.delete(k)
        this.flows.set(k, old)
        continue
      }
      old.el.remove()
      this.flows.delete(k)
    }
    return e.el
  }

  private cachedPages(i: number): number | undefined {
    return this.counts.get(`${this.segSig(this.segs[i])}|${this.lk}`)
  }

  private pagesOf(i: number): number {
    const key = `${this.segSig(this.segs[i])}|${this.lk}`
    let n = this.counts.get(key)
    if (n === undefined) {
      n = pageCount(this.flowFor(i).scrollWidth, this.g)
      this.counts.set(key, n)
    }
    return n
  }

  /** Count the pages of a segment without keeping its flow (used for the page numbers). */
  private countOnly(i: number) {
    if (this.cachedPages(i) !== undefined) return
    const s = this.segs[i]
    const live = this.flows.get(s.id)
    const el = live && live.sig === this.segSig(s) ? live.el : this.buildFlow(s)
    if (el !== live?.el) this.ui.measure.appendChild(el)
    this.counts.set(`${this.segSig(s)}|${this.lk}`, pageCount(el.scrollWidth, this.g))
    if (el !== live?.el) el.remove()
  }

  private startCount() {
    const token = ++this.countToken
    let i = 0
    const step = () => {
      if (token !== this.countToken || !this.on_) return
      const t0 = performance.now()
      while (i < this.segs.length && performance.now() - t0 < 8) this.countOnly(i++)
      this.chrome()
      if (i < this.segs.length) setTimeout(step, 0)
    }
    setTimeout(step, 0)
  }

  private viewsOf(i: number) {
    return viewCount(this.pagesOf(i), this.g)
  }

  private get blank() {
    return this.pos.seg >= this.segs.length
  }

  private nextPos(p: Pos): Pos | null {
    if (p.seg >= this.segs.length) return null
    if (p.view < this.viewsOf(p.seg) - 1) return { seg: p.seg, view: p.view + 1 }
    return p.seg < this.segs.length - 1 ? { seg: p.seg + 1, view: 0 } : { seg: this.segs.length, view: 0 }
  }

  private prevPos(p: Pos): Pos | null {
    if (p.seg >= this.segs.length) return this.segs.length ? { seg: this.segs.length - 1, view: this.viewsOf(this.segs.length - 1) - 1 } : null
    if (p.view > 0) return { seg: p.seg, view: p.view - 1 }
    return p.seg > 0 ? { seg: p.seg - 1, view: this.viewsOf(p.seg - 1) - 1 } : null
  }

  // ── Anchors: where in the story the reader is, independent of how the pages break ──

  private fragments(sec: Element) {
    return Array.from(sec.getClientRects()).filter((r) => r.width > 1 && r.height > 1)
  }

  /** The message at the top of the left page, and how many pages into it. */
  private anchor(): { id: string; off: number } | null {
    if (!this.ready || this.blank || !this.shown) return this.pieces.length ? { id: this.pieces[this.pieces.length - 1].id, off: 0 } : null
    const flow = this.shown
    const fl = flow.getBoundingClientRect().left
    const left = this.g.spread ? this.pos.view * 2 : this.pos.view
    let last: { id: string; off: number } | null = null
    for (const sec of Array.from(flow.querySelectorAll<HTMLElement>(':scope > .lf-bk-m'))) {
      const fr = this.fragments(sec)
      if (!fr.length) continue
      const first = columnAt(fr[0].left, fl, this.g)
      const end = columnAt(fr[fr.length - 1].left, fl, this.g)
      last = { id: sec.dataset.id ?? '', off: Math.max(0, left - first) }
      if (end >= left) return last
    }
    return last
  }

  /** The view where a message begins (plus `off` pages), or null when it isn't in the book. */
  private locate(id: string, off: number): Pos | null {
    const si = this.where.get(id)
    if (si === undefined) return null
    const flow = this.flowFor(si)
    const sec = flow.querySelector<HTMLElement>(`:scope > .lf-bk-m[data-id="${CSS.escape(id)}"]`)
    const pages = this.pagesOf(si)
    if (!sec) return { seg: si, view: 0 }
    const fr = this.fragments(sec)
    const first = fr.length ? columnAt(fr[0].left, flow.getBoundingClientRect().left, this.g) : 0
    return { seg: si, view: viewOfPage(Math.min(pages - 1, first + off), this.g) }
  }

  private currentId(): string | null {
    const a = this.anchor()
    return a?.id && a.id !== 'live' ? a.id : this.liveReal
  }

  /** Re-cut the segments after the pieces or chapters changed, and stay on the same story position. */
  private rebuild(a: { id: string; off: number } | null | undefined, keepView = false) {
    const anchor = a === undefined ? this.anchor() : a
    const wasBlank = this.blank && this.ready
    this.segs = segments(this.pieces, this.chapterList(), SEGMENT_CHARS, this.breaks)
    this.indexSegs()
    const live = new Set(this.segs.map((s) => s.id))
    for (const [k, e] of this.flows) {
      const seg = this.segs.find((s) => s.id === k)
      if (!live.has(k) || !seg || e.sig !== this.segSig(seg)) {
        if (e.el === this.shown) this.shown = null
        e.el.remove()
        this.flows.delete(k)
      }
    }
    let p: Pos | null = null
    if (this.goAfter && this.where.has(this.goAfter)) {
      p = this.locate(this.goAfter, 0)
      this.goAfter = null
    } else if (wasBlank && !keepView) p = { seg: this.segs.length, view: 0 }
    else if (anchor) {
      const id = anchor.id === 'live' && this.liveReal ? this.liveReal : anchor.id
      p = this.locate(id, anchor.off)
    }
    this.pos = p ?? (this.segs.length ? { seg: this.segs.length - 1, view: this.viewsOf(this.segs.length - 1) - 1 } : { seg: 0, view: 0 })
    this.shown = null
    this.paint()
    this.startCount()
  }

  // ── Painting ──

  private shiftFor(view: number) {
    return `translateX(${-shiftOf(view, this.g)}px)`
  }

  private paint() {
    const u = this.ui
    const blank = this.blank
    u.blank.hidden = !blank
    u.book.dataset.blank = blank ? '1' : '0'
    if (blank) {
      if (this.shown) this.park(this.shown)
      this.shown = null
      u.text.replaceChildren()
      const n = this.segs.length ? this.segs[this.segs.length - 1].chapter + 2 : 1
      ;(u.blank.querySelector('small') as HTMLElement).textContent = `${this.h.tr('Chapter')} ${n}`
      u.blankTitle.value = this.pendingTitle
    } else {
      const flow = this.flowFor(this.pos.seg)
      const views = this.viewsOf(this.pos.seg)
      this.pos.view = Math.min(this.pos.view, views - 1)
      if (this.shown && this.shown !== flow) this.park(this.shown)
      if (flow.parentElement !== u.text) u.text.replaceChildren(flow)
      this.shown = flow
      flow.style.transition = ''
      flow.style.transform = this.shiftFor(this.pos.view)
    }
    this.chrome()
    this.edges()
    this.syncWrite()
    this.ears()
  }

  /** Put a flow that is leaving the page back with the others, so it can still be measured. */
  private park(el: HTMLElement) {
    el.style.transition = ''
    el.style.transform = ''
    this.ui.measure.appendChild(el)
  }

  /** Pages before a segment, when every earlier one has been counted. */
  private offsetOf(i: number): number | null {
    let n = 0
    for (let k = 0; k < i; k++) {
      const c = this.cachedPages(k)
      if (c === undefined) return null
      n += c
    }
    return n
  }

  private chrome() {
    if (!this.on_ || !this.ready) return
    const u = this.ui
    const g = this.g
    this.glow()
    if (this.tocOn) this.tocPages()
    u.book.dataset.seg = String(this.pos.seg)
    u.book.dataset.view = String(this.pos.view)
    if (this.blank) {
      for (const el of [u.hdL, u.hdR, u.noL, u.noR]) el.textContent = ''
      u.book.dataset.pages = '0'
      return
    }
    const s = this.segs[this.pos.seg]
    const pages = this.pagesOf(this.pos.seg)
    const off = this.offsetOf(this.pos.seg)
    const total = off === null ? null : this.offsetOf(this.segs.length)
    const lp = g.spread ? this.pos.view * 2 : this.pos.view
    const no = (page: number) => (page >= pages ? '' : off === null ? '' : String(off + page + 1))
    const title = this.chapterTitle(s.chapter) || this.chapterLabel(s.chapter)
    u.hdL.textContent = title
    u.hdR.textContent = this.h.characterName()
    const raw = this.viewHasRaw()
    const mark = raw ? `<i>${esc(this.h.tr('text only'))}</i>` : ''
    u.noL.innerHTML = esc(no(lp))
    u.noR.innerHTML = esc(no(lp + 1)) + (g.spread ? mark : '')
    if (!g.spread) u.noL.innerHTML = esc(no(lp)) + mark
    u.book.dataset.pages = String(pages)
    u.book.dataset.page = String(off === null ? lp + 1 : off + lp + 1)
    if (total !== null) u.book.dataset.total = String(total)
    else delete u.book.dataset.total
  }

  /** Does the view on screen include text that the host didn't render (so regex and macros weren't applied)? */
  private viewHasRaw(): boolean {
    const flow = this.shown
    if (!flow) return false
    const secs = flow.querySelectorAll<HTMLElement>(':scope > .lf-bk-m[data-raw]')
    if (!secs.length) return false
    const fl = flow.getBoundingClientRect().left
    const lo = this.g.spread ? this.pos.view * 2 : this.pos.view
    const hi = lo + (this.g.spread ? 1 : 0)
    for (const sec of Array.from(secs)) {
      for (const r of this.fragments(sec)) {
        const c = columnAt(r.left, fl, this.g)
        if (c >= lo && c <= hi) return true
      }
    }
    return false
  }

  private edges() {
    const u = this.ui
    u.edgeL.disabled = !this.prevPos(this.pos)
    u.edgeR.disabled = !this.nextPos(this.pos)
  }

  private announce() {
    const d = this.ui.book.dataset
    const t = this.h.tr
    this.ui.live.textContent = this.blank ? t('A new chapter begins on this page') : d.total ? `${t('Page')} ${d.page} ${t('of')} ${d.total}` : `${t('Page')} ${d.page ?? ''}`
  }

  // ── Turning ──

  private styleNow(): TurnStyle {
    return resolveStyle({ setting: this.h.get().turn, motion: this.h.motion(), coarse: window.matchMedia('(pointer: coarse)').matches, width: window.innerWidth })
  }

  /** Turn to the next (1) or previous (-1) page. */
  async turn(dir: 1 | -1) {
    if (!this.on_ || !this.ready || this.busy) return
    const to = dir > 0 ? this.nextPos(this.pos) : this.prevPos(this.pos)
    if (to) await this.moveTo(to, dir)
  }

  /** Go straight to a view, with no animation. */
  async jump(to: Pos) {
    if (!this.on_ || !this.ready || this.busy) return
    this.pos = to
    this.paint()
    this.after()
  }

  private after() {
    this.hideChip()
    this.announce()
    this.queueRibbon()
  }

  private async moveTo(to: Pos, dir: 1 | -1) {
    this.busy = true
    this.hideChip()
    this.h.turnSound()
    try {
      const style = this.styleNow()
      const bigChars = [this.pos.seg, to.seg].some((i) => i < this.segs.length && this.segs[i].pieces.reduce((n, p) => n + p.len, 0) > CURL_MAX_CHARS)
      if (style === 'curl' && !bigChars) await this.curl(this.pos, to, dir)
      else if (style !== 'instant') await this.slide(this.pos, to)
      this.pos = to
      this.paint()
    } finally {
      this.busy = false
    }
    this.after()
  }

  /** The flat turn: the flow slides to the next page in place; another chapter or the blank page fades through. */
  private async slide(from: Pos, to: Pos) {
    if (from.seg === to.seg && !this.blank && this.shown) {
      const f = this.shown
      f.style.transition = `transform ${SLIDE_MS}ms ease`
      f.style.transform = this.shiftFor(to.view)
      await wait(SLIDE_MS + 40)
      f.style.transition = ''
      return
    }
    const t = this.ui.text
    t.dataset.fade = '1'
    await wait(130)
    this.pos = to
    this.paint()
    delete t.dataset.fade
    await wait(130)
  }

  /** A face of the leaf: one page of a view (paper, running header, page number, and the text, from a clone of the flow). */
  private face(p: Pos, half: 'l' | 'r'): HTMLElement {
    const g = this.g
    const f = document.createElement('div')
    f.className = 'lf-bk-face'
    f.dataset.h = g.spread ? half : 'l'
    if (p.seg >= this.segs.length) {
      if (half === 'l') {
        const n = this.segs.length ? this.segs[this.segs.length - 1].chapter + 2 : 1
        f.innerHTML = `<div class="lf-bk-blank" style="left:var(--bk-m);top:var(--bk-vp)"><small>${esc(this.h.tr('Chapter'))} ${n}</small></div>`
      }
      return f
    }
    const s = this.segs[p.seg]
    const pages = this.pagesOf(p.seg)
    const page = (g.spread ? p.view * 2 : p.view) + (half === 'r' ? 1 : 0)
    if (page < pages) {
      const ft = document.createElement('div')
      ft.className = 'lf-bk-ft'
      const clone = this.flowFor(p.seg).cloneNode(true) as HTMLElement
      hydrateIslands(clone, (id) => this.byId.get(id))
      clone.style.transform = `translateX(${-(shiftOf(p.view, g) + (half === 'r' ? g.step : 0))}px)`
      ft.appendChild(clone)
      const off = this.offsetOf(p.seg)
      const hd = document.createElement('div')
      hd.className = 'lf-bk-fh'
      hd.textContent = half === 'l' || !g.spread ? this.chapterTitle(s.chapter) || this.chapterLabel(s.chapter) : this.h.characterName()
      const no = document.createElement('div')
      no.className = 'lf-bk-fn'
      no.textContent = off === null ? '' : String(off + page + 1)
      f.append(ft, hd, no)
    }
    return f
  }

  /** Lay the layers of a turn from `a` to `b` (a before b) over the page; the caller plays or scrubs the leaf. */
  private layers(a: Pos, b: Pos, dir: 1 | -1) {
    const g = this.g
    const stage = this.ui.stage
    const halfW = g.spread ? g.paperW / 2 : g.paperW
    const place = (left: number, face: HTMLElement) => {
      const u = document.createElement('div')
      u.className = 'lf-bk-under'
      Object.assign(u.style, { left: `${left}px`, width: `${halfW}px`, height: `${g.paperH}px` })
      u.appendChild(face)
      stage.appendChild(u)
    }
    const spineX = g.spread ? halfW : 0
    let front: HTMLElement
    let back: HTMLElement
    if (g.spread) {
      if (dir > 0) place(spineX, this.face(b, 'r'))
      else place(0, this.face(a, 'l'))
      front = this.face(a, 'r')
      back = this.face(b, 'l')
    } else {
      if (dir > 0) place(0, this.face(b, 'l'))
      front = this.face(a, 'l')
      back = document.createElement('div')
      back.className = 'lf-bk-face'
    }
    return new Leaf(stage, { left: spineX, width: halfW, height: g.paperH }, front, back)
  }

  private clearStage() {
    this.ui.stage.replaceChildren()
  }

  private async curl(from: Pos, to: Pos, dir: 1 | -1) {
    const [a, b] = dir > 0 ? [from, to] : [to, from]
    const leaf = this.layers(a, b, dir)
    try {
      if (dir > 0) {
        leaf.set(0)
        await frame()
        await leaf.play(1)
      } else {
        leaf.set(1)
        await frame()
        await leaf.play(0)
      }
      // Land the new view under the leaf before it goes.
      this.pos = to
      this.paint()
      await frame()
    } finally {
      this.clearStage()
    }
  }

  /** Dragging a page edge scrubs the leaf (curl, on a computer); a plain click just turns. */
  private edgeDrag(btn: HTMLButtonElement, dir: 1 | -1) {
    let x0 = 0
    let id = -1
    let leaf: Leaf | null = null
    let target: Pos | null = null
    let started = false
    const half = () => (this.g.spread ? this.g.paperW / 2 : this.g.paperW)
    const progress = (x: number) => {
      const d = dir > 0 ? x0 - x : x - x0 // how far the pointer has pulled the page
      const p = Math.min(1, Math.max(0, d / half()))
      return dir > 0 ? p : 1 - p
    }
    btn.addEventListener('pointerdown', (e) => {
      if (btn.disabled || this.busy || e.button !== 0) return
      x0 = e.clientX / this.zoom()
      id = e.pointerId
      started = false
      btn.setPointerCapture(e.pointerId)
    })
    btn.addEventListener('pointermove', (e) => {
      if (e.pointerId !== id) return
      const x = e.clientX / this.zoom()
      if (!started && Math.abs(x - x0) > 6 && e.pointerType !== 'touch' && this.styleNow() === 'curl') {
        target = dir > 0 ? this.nextPos(this.pos) : this.prevPos(this.pos)
        if (!target) return
        started = true
        this.busy = true
        const [a, b] = dir > 0 ? [this.pos, target] : [target, this.pos]
        leaf = this.layers(a, b, dir)
      }
      if (started && leaf) leaf.set(progress(x))
    })
    const end = async (e: PointerEvent, cancel: boolean) => {
      if (e.pointerId !== id) return
      id = -1
      if (!started) {
        if (!cancel && Math.abs(e.clientX / this.zoom() - x0) <= 6) void this.turn(dir)
        return
      }
      started = false
      const l = leaf
      const to = target
      leaf = null
      target = null
      if (!l || !to) return
      const forward = dir > 0 ? l.p > 0.4 : l.p < 0.6
      const done = forward && !cancel
      if (done) this.h.turnSound()
      await l.play(dir > 0 ? (done ? 1 : 0) : done ? 0 : 1)
      if (done) this.pos = to
      this.paint()
      await frame()
      this.clearStage()
      this.busy = false
      if (done) this.after()
    }
    // A keyboard press on the focused edge button (no pointer involved).
    btn.addEventListener('click', (e) => {
      if (e.detail === 0) void this.turn(dir)
    })
    btn.addEventListener('pointerup', (e) => void end(e, false))
    btn.addEventListener('pointercancel', (e) => void end(e, true))
  }

  private zoom() {
    const r = this.ui.root.getBoundingClientRect()
    return r.width / (this.ui.root.offsetWidth || r.width) || 1
  }

  // ── Input ──

  private listen() {
    let sx = 0
    let sy = 0
    let sid = -1
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const tgt = e.target as HTMLElement | null
        if (tgt?.closest?.('.lf-bk-toc input')) {
          // Leaving a chapter title alone: the input's blur sees this and keeps the old title.
          ;(tgt as HTMLInputElement).dataset.cancel = '1'
          tgt.blur()
          e.preventDefault()
          e.stopPropagation()
          return
        }
        if (tgt?.closest?.('.lf-bk-blank, .lf-bk-write')) {
          tgt.blur()
          return
        }
        e.preventDefault()
        e.stopPropagation()
        if (this.tocOn) this.toggleToc(false)
        else this.exit(true)
        return
      }
      if (editable(e.target) || e.ctrlKey || e.metaKey || e.altKey) return
      // Any key opens the cover; the contents page keeps the keys that would turn the page under it.
      if (this.coverEl) {
        this.openCover()
        e.preventDefault()
        return
      }
      if (this.tocOn) return
      const k = e.key
      const btn = (e.target as HTMLElement | null)?.closest?.('button, a, [role="button"]')
      if (k === 'ArrowRight' || k === 'PageDown' || (k === ' ' && !btn)) void this.turn(1)
      else if (k === 'ArrowLeft' || k === 'PageUp') void this.turn(-1)
      else if (k === 'Home') void this.jump(this.segs.length ? { seg: 0, view: 0 } : this.pos)
      else if (k === 'End') void this.jump(this.segs.length ? { seg: this.segs.length - 1, view: this.viewsOf(this.segs.length - 1) - 1 } : this.pos)
      else return
      e.preventDefault()
    }
    const down = (e: PointerEvent) => {
      if (e.pointerType !== 'touch') return
      sid = e.pointerId
      sx = e.clientX
      sy = e.clientY
    }
    const up = (e: PointerEvent) => {
      if (e.pointerId !== sid) return
      sid = -1
      const dx = e.clientX - sx
      const dy = e.clientY - sy
      if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.5) void this.turn(dx < 0 ? 1 : -1)
    }
    const resize = () => {
      this.syncViewport()
      this.syncBottom()
      this.scheduleRelayout()
    }
    const book = this.ui.book
    document.addEventListener('keydown', key, true)
    book.addEventListener('pointerdown', down)
    book.addEventListener('pointerup', up)
    window.addEventListener('resize', resize)
    const vv = window.visualViewport
    vv?.addEventListener('resize', resize)
    vv?.addEventListener('scroll', resize)
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null
    ro?.observe(this.ui.desk)
    const input = document.querySelector('[data-component="InputArea"]')
    if (input) ro?.observe(input)
    this.stop = () => {
      document.removeEventListener('keydown', key, true)
      window.removeEventListener('resize', resize)
      vv?.removeEventListener('resize', resize)
      vv?.removeEventListener('scroll', resize)
      ro?.disconnect()
    }
  }

  // ── Writing in the book ──

  private nudgeSize(by: number) {
    const next = Math.round((this.h.get().size + by) * 100) / 100
    this.h.set({ bookSize: Math.min(2, Math.max(0.8, next)) })
  }

  /** The host's own reply box, for what the writing line can't do (attachments, commands). */
  private toggleHostReply() {
    const root = document.documentElement
    if (root.hasAttribute('data-lf-compose')) root.removeAttribute('data-lf-compose')
    else root.setAttribute('data-lf-compose', '1')
    this.ui.reply.setAttribute('aria-pressed', String(root.hasAttribute('data-lf-compose')))
    const shown = root.hasAttribute('data-lf-compose')
    this.ui.reply.title = this.ui.reply.ariaLabel = this.h.tr(shown ? 'Hide the host reply box' : 'Show the host reply box')
    // The room under the book follows the box on the next frame, once it has appeared or gone.
    requestAnimationFrame(() => this.syncBottom())
  }

  private syncWrite() {
    if (!this.on_ || !this.ui) return
    const u = this.ui
    const t = this.h.tr
    u.send.disabled = this.sending || !!this.liveId
    u.ta.placeholder = this.liveId ? t('A reply is being written…') : this.blank ? t('Begin this chapter…') : t('Write your next line…')
    const shown = document.documentElement.hasAttribute('data-lf-compose')
    u.reply.title = u.reply.ariaLabel = t(shown ? 'Hide the host reply box' : 'Show the host reply box')
  }

  /** Send what was written through the host's reply box. The page follows from the host's own events (the message, then the reply). */
  private async submit() {
    const u = this.ui
    const text = u.ta.value.trim()
    if (!text || this.sending || this.liveId) return
    this.sending = true
    this.syncWrite()
    let ok = false
    try {
      ok = await this.h.send(text)
    } catch {
      ok = false
    }
    if (!this.on_) return
    this.sending = false
    if (ok) {
      u.ta.value = ''
      u.write.removeAttribute('data-err')
      if (window.matchMedia('(pointer: coarse)').matches) u.ta.blur() // put the keyboard away so the reply can be read
    } else {
      u.write.dataset.err = '1'
      u.ta.title = this.h.tr('It could not be sent. Try the host reply box.')
    }
    this.syncWrite()
  }

  /** With the keyboard up, the book shrinks to the part of the screen that is still visible, so neither it nor the writing line is covered. */
  private syncViewport() {
    const vv = window.visualViewport
    const host = this.h.root
    if (!vv) return
    if (window.innerHeight - vv.height > 120) {
      host.style.top = `${vv.offsetTop}px`
      host.style.height = `${vv.height}px`
      host.style.bottom = 'auto'
    } else host.style.top = host.style.height = host.style.bottom = ''
  }

  // ── The ribbon (where the reader left off) ──

  private queueRibbon() {
    clearTimeout(this.saveTimer)
    this.saveTimer = setTimeout(() => this.saveRibbon(), 700)
  }

  private saveRibbon() {
    if (!this.ready || !this.chatId) return
    const a = this.anchor()
    if (!a || a.id === 'live') return
    const next = setRibbon(this.h.data(), this.chatId, a.id, a.off)
    if (next !== this.h.data()) this.h.save(next)
  }

  // ── Writing: new messages, live replies, edits ──

  private showChip(to: Pos, text: string) {
    this.chipTarget = to
    this.ui.chip.textContent = text
    this.ui.chip.hidden = false
  }

  private hideChip() {
    this.chipTarget = null
    if (this.on_) this.ui.chip.hidden = true
  }

  /** Feed the host's events here. */
  event(name: string, raw: unknown) {
    if (!this.on_) return
    const p = (raw ?? {}) as { chatId?: string; generationType?: string; targetMessageId?: string; messageId?: string; messageIds?: string[]; message?: RawMessage }
    if (name === 'CHAT_SWITCHED' || name === 'CHAT_CHANGED') {
      // The orchestrator learns the new chat id a tick after the event.
      setTimeout(() => {
        if (this.on_ && this.h.chatId() !== this.chatId) this.exit(false, true)
      }, 60)
      return
    }
    if (p.chatId && p.chatId !== this.chatId) return
    if (!this.ready) return
    switch (name) {
      case 'GENERATION_STARTED':
        if (p.generationType !== 'impersonate') this.startLive(p.generationType === 'continue' ? p.targetMessageId ?? null : null)
        break
      case 'GENERATION_ENDED':
        this.liveReal = p.messageId ?? this.liveReal
        if (!this.endLive()) this.reloadSoon(300)
        break
      case 'GENERATION_STOPPED':
        if (!this.endLive()) this.reloadSoon(300)
        break
      case 'MESSAGE_SENT':
        this.sent(p.message)
        break
      case 'MESSAGE_DELETED':
        this.deleted(new Set([...(p.messageIds ?? []), ...(p.messageId ? [p.messageId] : [])]))
        break
      case 'MESSAGE_EDITED':
      case 'MESSAGE_SWIPED':
        this.changed(p.message)
        this.reloadSoon()
        break
      case 'CHARACTER_MESSAGE_RENDERED':
      case 'USER_MESSAGE_RENDERED':
        this.reloadSoon()
        break
    }
  }

  /** A message was edited or swiped: its new text is in the event, so a message older than the newest 200 is covered too. */
  private changed(m: RawMessage | undefined) {
    if (!m?.id || typeof m.content !== 'string') return
    const i = this.pieces.findIndex((p) => p.id === m.id)
    if (i < 0) return
    const old = this.pieces[i]
    const piece = pieceOf({ ...m, is_user: m.is_user ?? old.user, name: m.name ?? old.name }, this.h.mounted(m.id))
    if (!piece || piece.key === old.key) return
    const a = this.anchor()
    this.pieces[i] = piece
    this.rebuild(a)
  }

  private sent(m: RawMessage | undefined) {
    if (!m?.id) return
    if (this.blank) {
      // Writing on the blank page commits the chapter: it starts at this message.
      const title = this.pendingTitle.trim()
      this.pendingTitle = ''
      this.h.save(addChapter(this.h.data(), this.chatId, m.id, title))
    }
    if (!this.pieces.some((p) => p.id === m.id)) {
      const piece = pieceOf({ ...m, is_user: m.is_user ?? true }, this.h.mounted(m.id))
      if (piece) {
        this.pieces.push(piece)
        this.rebuildAt(m.id)
      }
    }
    this.goAfter = m.id
    this.reloadSoon(200, 3)
  }

  private rebuildAt(id: string) {
    this.goAfter = id
    this.rebuild(null)
  }

  private deleted(gone: Set<string>) {
    if (!gone.size) return
    const order = this.pieces.map((p) => p.id)
    const a = this.anchor()
    this.pieces = this.pieces.filter((p) => !gone.has(p.id))
    const next = dropMessages(this.h.data(), this.chatId, gone, order)
    if (next !== this.h.data()) this.h.save(next)
    let anchor = a
    if (a && gone.has(a.id)) {
      // The message under the reader went: carry on from the next one that is left.
      let id = ''
      for (let i = order.indexOf(a.id) + 1; i > 0 && i < order.length; i++) if (!gone.has(order[i])) { id = order[i]; break }
      anchor = id ? { id, off: 0 } : this.pieces.length ? { id: this.pieces[this.pieces.length - 1].id, off: 0 } : null
    }
    this.rebuild(anchor)
  }

  private reloadSoon(ms = 260, tries = 1) {
    clearTimeout(this.reloadTimer)
    this.reloadTimer = setTimeout(() => void this.reload(tries), ms)
  }

  /** Read the newest messages again and re-lay out only what changed. */
  private async reload(tries = 1) {
    if (!this.on_ || !this.ready || this.liveId) return
    const chat = this.chatId
    let fresh: Piece[]
    let msgs: RawMessage[] = []
    try {
      if (this.h.read) {
        msgs = (await this.h.read(chat, { limit: PAGE, tail: true })).data
        fresh = this.toPieces(msgs)
      } else fresh = this.fromMounted()
    } catch {
      return
    }
    if (!this.on_ || chat !== this.chatId || this.liveId) return
    if (this.goAfter && !fresh.some((p) => p.id === this.goAfter) && tries > 1) return this.reloadSoon(500, tries - 1)
    // A message the host rendered when the book opened stays as it was drawn, even if it isn't mounted now.
    const known = new Map(this.pieces.map((p) => [p.id, p]))
    fresh = fresh.map((f) => {
      const old = known.get(f.id)
      return old && old.exact && !f.exact && old.src && old.src === f.src ? old : f
    })
    const firstFresh = fresh[0]?.id
    const at = firstFresh ? this.pieces.findIndex((p) => p.id === firstFresh) : -1
    const head = at >= 0 ? this.pieces.slice(0, at) : this.pieces.filter((p) => p.id !== 'live' && !fresh.some((f) => f.id === p.id))
    const next = head.concat(fresh)
    const same = next.length === this.pieces.length && next.every((p, i) => p.id === this.pieces[i].id && p.key === this.pieces[i].key)
    if (same && !this.goAfter) return
    const a = this.anchor()
    this.pieces = next
    this.rebuild(a)
    this.goAfter = null
  }

  private startLive(target: string | null) {
    if (this.liveId) return
    const id = target && this.pieces.some((p) => p.id === target) ? target : 'live'
    this.liveId = id
    this.liveReal = target
    if (id === 'live') {
      this.inkRuns = []
      this.pieces.push({ id: 'live', user: false, name: this.h.characterName(), html: '', islands: [], exact: true, len: 40, key: 'live', src: '', at: -1, choices: [] })
      const a = this.anchor()
      this.rebuild(a)
    }
    clearInterval(this.livePoll)
    this.livePoll = setInterval(() => this.pollLive(), 125)
    this.syncWrite()
  }

  private pollLive() {
    if (!this.on_ || !this.liveId) return
    const el = this.h.streaming()
    if (el) this.updateLive(harvest(el))
  }

  /** The page the end of a message's text falls on. */
  private endPage(sec: Element, flow: HTMLElement): number {
    const fr = this.fragments(sec)
    const r = fr.length ? fr[fr.length - 1] : sec.getBoundingClientRect()
    return columnAt(r.left, flow.getBoundingClientRect().left, this.g)
  }

  private updateLive(h: { html: string; islands: string[] }) {
    const id = this.liveId
    const p = id ? this.pieces.find((x) => x.id === id) : null
    if (!p || (p.html === h.html && JSON.stringify(p.islands) === JSON.stringify(h.islands))) return
    const si = this.where.get(p.id)
    p.html = h.html
    p.islands = h.islands
    p.len = h.html.replace(/<[^>]*>/g, '').length + 40
    p.key = `l${hash(h.html + JSON.stringify(h.islands))}`
    if (si === undefined) return
    const seg = this.segs[si]
    const entry = this.flows.get(seg.id)
    const flow = this.shown
    const sec = flow && entry?.el === flow ? flow.querySelector<HTMLElement>(`:scope > .lf-bk-m[data-id="${CSS.escape(p.id)}"]`) : null
    if (!flow || !sec || this.blank || this.pos.seg !== si) {
      // The reader is somewhere else: a live reply will be on a page, whenever they get there.
      if (entry) {
        entry.el.remove()
        this.flows.delete(seg.id)
      }
      if (this.shown && !this.shown.isConnected) this.shown = null
      if (this.pos.seg !== si && !this.busy) this.showChip({ seg: si, view: this.liveView(si) }, this.h.tr('New writing'))
      return
    }
    const before = this.endPage(sec, flow)
    const wasFollowing = viewOfPage(before, this.g) === this.pos.view
    const prevLen = sec.textContent?.length ?? 0
    const body = this.sectionHtml(p, this.dcPiece(seg) === p.id)
    const tmp = document.createElement('template')
    tmp.innerHTML = body
    sec.replaceChildren(...Array.from((tmp.content.firstElementChild as Element).childNodes))
    hydrateIslands(sec, (i) => this.byId.get(i), () => this.imgLoaded(flow), (rule) => this.h.addIgnore(rule))
    this.ink(sec, prevLen)
    if (p.len >= 260) sec.removeAttribute('data-s')
    entry!.sig = this.segSig(seg)
    const pages = pageCount(flow.scrollWidth, this.g)
    this.counts.set(`${entry!.sig}|${this.lk}`, pages)
    const after = this.endPage(sec, flow)
    const toView = viewOfPage(after, this.g)
    if (toView > this.pos.view && !this.busy) {
      if (this.h.get().autoTurn && wasFollowing) void this.moveTo({ seg: si, view: toView }, 1)
      else this.showChip({ seg: si, view: toView }, `${this.h.tr('New writing on page')} ${this.pageNumber(si, after)}`)
    }
    this.chrome()
    this.edges()
  }

  private liveView(si: number): number {
    return Math.max(0, this.viewsOf(si) - 1)
  }

  private pageNumber(si: number, page: number): string {
    const off = this.offsetOf(si)
    return String(off === null ? page + 1 : off + page + 1)
  }

  /** The reply is over. Returns whether a live reply was being followed. */
  private endLive(): boolean {
    clearInterval(this.livePoll)
    this.livePoll = undefined
    if (!this.liveId) return false
    // The host finishes rendering a moment after the event; then the real message replaces the live one.
    const id = this.liveId
    this.liveId = null
    this.inkRuns = []
    if (id === 'live') this.pieces = this.pieces.filter((p) => p.id !== 'live')
    this.reloadSoon(300)
    this.syncWrite()
    return true
  }

  // ── Ink: new writing settles onto the page ──

  /** The text a poll of the live reply added fades in; runs from the last few polls carry on where they were. */
  private ink(sec: HTMLElement, prevLen: number) {
    if (!this.h.get().ink || !this.h.motion()) return
    const now = performance.now()
    const len = sec.textContent?.length ?? 0
    this.inkRuns = this.inkRuns.filter((r) => now - r.t < 420)
    if (len > prevLen) this.inkRuns.push({ from: prevLen, to: len, t: now })
    for (const r of this.inkRuns) inkRange(sec, r.from, r.to, r.t - now)
  }

  // ── The desk: warm light on the pages ──

  private glow() {
    if (!this.on_ || !this.ui) return
    const s = this.h.get()
    const light = s.light ? this.h.light() : 'none'
    const map: Record<string, string> = {
      candle: 'rgba(255,160,70,.34)',
      night: 'rgba(255,200,130,.2)',
      dusk: 'rgba(255,150,90,.22)',
      dawn: 'rgba(255,190,170,.22)',
      neon: 'color-mix(in srgb, var(--bk-accent) 24%, transparent)',
    }
    const c = map[light]
    const breathe = !!c && light === 'candle' && this.h.motion()
    const key = `${c ?? ''}|${breathe ? 1 : 0}`
    if (key === this.glowKey) return
    this.glowKey = key
    const g = this.ui.glow
    if (c) g.style.setProperty('--bk-glow', c)
    g.dataset.on = c ? '1' : '0'
    g.dataset.breathe = breathe ? '1' : '0'
  }

  // ── The cover ──

  private maybeCover() {
    const s = this.h.get()
    if (s.cover === 'never' || !this.h.motion()) return
    const seen = !!this.h.data()[this.chatId]?.covered
    if (s.cover === 'once' && seen) return
    const t = this.h.tr
    const el = document.createElement('div')
    el.className = 'lf-bk-cvw'
    const cover = document.createElement('div')
    cover.className = 'lf-bk-cover'
    const frame = document.createElement('div')
    frame.className = 'lf-bk-cv-frame'
    const mk = (cls: string, text: string) => {
      const d = document.createElement('div')
      d.className = cls
      d.textContent = text
      return d
    }
    const name = this.h.characterName()
    const title = mk('lf-bk-cv-title', name || t('Our story'))
    frame.append(mk('lf-bk-cv-orn', this.ornament))
    const src = this.h.portrait()
    if (src && SAFE_SRC.test(src)) {
      const img = document.createElement('img')
      img.className = 'lf-bk-cv-portrait'
      img.alt = ''
      img.src = src
      frame.append(img)
    }
    frame.append(
      title,
      mk('lf-bk-cv-by', t('by {user} & {character}').replace('{user}', this.h.userName() || t('You')).replace('{character}', name || t('Character'))),
      mk('lf-bk-cv-orn', this.ornament),
      mk('lf-bk-cv-hint', t('Click to open')),
    )
    cover.append(frame)
    el.append(cover)
    el.addEventListener('click', () => this.openCover())
    this.ui.book.appendChild(el)
    this.coverEl = el
    void this.h.chatTitle().then((n) => {
      if (n && this.coverEl === el) title.textContent = n
    })
    if (!seen) this.h.save(setFlag(this.h.data(), this.chatId, 'covered', true))
  }

  /** The cover opens by itself a moment after the first page is ready. */
  private armCover() {
    clearTimeout(this.coverTimer)
    if (this.coverEl) this.coverTimer = setTimeout(() => this.openCover(), 1500)
  }

  private openCover() {
    const el = this.coverEl
    if (!el) return
    this.coverEl = null
    clearTimeout(this.coverTimer)
    el.dataset.open = '1'
    setTimeout(() => el.remove(), 800)
  }

  // ── Dog-ears: a folded corner marks the page ──

  /** The message at the top of a page (by column) of the flow on screen. */
  private idAtColumn(col: number): string | null {
    const flow = this.shown
    if (!flow) return null
    const fl = flow.getBoundingClientRect().left
    for (const sec of Array.from(flow.querySelectorAll<HTMLElement>(':scope > .lf-bk-m'))) {
      const fr = this.fragments(sec)
      if (!fr.length) continue
      if (columnAt(fr[fr.length - 1].left, fl, this.g) < col) continue
      const id = sec.dataset.id ?? ''
      return columnAt(fr[0].left, fl, this.g) <= col && id !== 'live' ? id : null
    }
    return null
  }

  private ears() {
    if (!this.on_ || !this.ready || !this.ui) return
    const u = this.ui
    let ids: { l: string | null; r: string | null } = { l: null, r: null }
    if (!this.blank && this.shown) {
      const pages = this.pagesOf(this.pos.seg)
      const lp = this.g.spread ? this.pos.view * 2 : this.pos.view
      const at = (page: number) => (page < pages ? this.idAtColumn(page) : null)
      ids = this.g.spread ? { l: at(lp), r: at(lp + 1) } : { l: null, r: at(lp) }
    }
    this.earIds = ids
    const pinned = new Set(this.h.pins().map((p) => p.id))
    for (const [btn, id] of [[u.earL, ids.l], [u.earR, ids.r]] as const) {
      const on = !!id && pinned.has(id)
      btn.disabled = !id
      btn.dataset.on = on ? '1' : '0'
      btn.setAttribute('aria-pressed', String(on))
      btn.title = btn.ariaLabel = this.h.tr(on ? 'Unfold the corner' : 'Fold the corner to mark this page')
    }
  }

  private toggleEar(side: 'l' | 'r') {
    const id = this.earIds[side]
    const p = id ? this.byId.get(id) : null
    if (!p) return
    this.h.togglePin({ id: p.id, text: plainOf(p.html), user: p.user, name: p.name, at: p.at })
    this.ears()
    if (this.tocOn) this.renderToc()
  }

  // ── The contents page ──

  private toggleToc(force?: boolean) {
    const on = force ?? !this.tocOn
    if (on && !this.ready) return
    this.tocOn = on
    this.ui.toc.hidden = !on
    this.ui.contents.setAttribute('aria-expanded', String(on))
    if (on) {
      this.renderToc()
      this.ui.toc.querySelector<HTMLElement>('.go')?.focus()
    }
  }

  private renderToc() {
    const t = this.h.tr
    const rows = this.segs.map((s, i) => ({ s, i })).filter((x) => x.s.opens)
    const items = rows
      .map(({ s, i }) => {
        const n = s.chapter
        const edit = n > 0 || this.full
        return `<li data-ch="${n}"><button type="button" class="go" data-seg="${i}"><span class="n">${esc(this.chapterLabel(n))}</span><span class="t">${esc(this.chapterTitle(n))}</span><i class="lead"></i><span class="pg"></span></button>${edit ? `<button type="button" class="ed" aria-label="${esc(t('Rename chapter'))}" title="${esc(t('Rename chapter'))}">✎</button>` : ''}</li>`
      })
      .join('')
    const marks = this.h
      .pins()
      .filter((p) => this.byId.has(p.id))
      .slice(0, 40)
      .map((p) => `<li><button type="button" class="go mk" data-pin="${esc(p.id)}"><span class="t">${esc(p.text.slice(0, 120))}</span></button></li>`)
      .join('')
    this.ui.toc.innerHTML = `<div class="lf-bk-toc-in"><h2>${esc(t('Contents'))}</h2><i class="orn" aria-hidden="true">${esc(this.ornament)}</i><ol>${items}</ol>${marks ? `<h3>${esc(t('Marked pages'))}</h3><ol>${marks}</ol>` : ''}</div>`
    this.tocPages()
  }

  /** Page numbers on the contents page, as far as the chapters before have been counted. */
  private tocPages() {
    for (const go of Array.from(this.ui.toc.querySelectorAll<HTMLElement>('.go[data-seg]'))) {
      const off = this.offsetOf(+(go.dataset.seg ?? 0))
      const pg = go.querySelector('.pg')
      if (pg) pg.textContent = off === null ? '…' : String(off + 1)
    }
  }

  private tocClick(e: Event) {
    const b = (e.target as Element | null)?.closest?.<HTMLButtonElement>('button')
    if (!b) return
    if (b.classList.contains('ed')) return this.renameRow(b.closest('li') as HTMLElement)
    if (b.dataset.seg !== undefined) {
      const seg = +b.dataset.seg
      this.toggleToc(false)
      void this.jump({ seg, view: 0 })
    } else if (b.dataset.pin) {
      const p = this.locate(b.dataset.pin, 0)
      this.toggleToc(false)
      if (p) void this.jump(p)
    }
  }

  /** Rename a chapter where it stands in the list. */
  private renameRow(li: HTMLElement) {
    const n = +(li.dataset.ch ?? 0)
    const go = li.querySelector('.go')
    if (!go) return
    const input = document.createElement('input')
    input.type = 'text'
    input.maxLength = 120
    input.value = this.chapterTitle(n)
    input.setAttribute('aria-label', this.h.tr('Chapter title (optional)'))
    go.replaceWith(input)
    input.focus()
    input.select()
    let done = false
    const finish = (save: boolean) => {
      if (done) return
      done = true
      if (save) this.setTitle(n, input.value)
      if (this.tocOn) this.renderToc()
    }
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.isComposing) {
        e.preventDefault()
        finish(true)
      }
    })
    input.addEventListener('blur', () => finish(input.dataset.cancel !== '1'))
  }

  private setTitle(n: number, title: string) {
    const data = this.h.data()
    let next = data
    if (n === 0) {
      const first = this.pieces[0]
      if (!first) return
      const stored = this.chapterList().find((c) => c.startId === first.id)
      next = stored ? renameChapter(data, this.chatId, stored.id, title) : title.trim() ? addChapter(data, this.chatId, first.id, title) : data
    } else {
      const c = orderChapters(this.pieces, this.chapterList())[n - 1]
      if (!c) return
      next = renameChapter(data, this.chatId, c.id, title)
    }
    if (next === data) return
    this.h.save(next)
    this.rebuild(undefined)
  }

  // ── The options and the other drafts at the foot of the newest reply ──

  private flowClick(e: Event) {
    const el = (e.target as Element | null)?.closest?.<HTMLElement>('[data-opt], [data-draft]')
    if (!el || (el as HTMLButtonElement).disabled) return
    if (el.dataset.opt !== undefined) this.pickOption(+el.dataset.opt, el)
    else this.flipDraft(+(el.dataset.draft ?? 0) < 0 ? -1 : 1)
  }

  private pickOption(i: number, btn: HTMLElement) {
    const last = this.pieces[this.pieces.length - 1]
    const text = last && !last.user ? last.choices[i] : undefined
    if (!text) return
    const nav = btn.closest('.lf-bk-opts')
    nav?.setAttribute('data-used', '1')
    btn.setAttribute('data-picked', '1')
    const c = this.h.choices()
    if (this.h.get().writeHere) {
      this.ui.ta.value = text
      if (c.send) void this.submit()
      else this.ui.ta.focus()
    } else {
      this.h.fill(text)
      if (c.send) void this.h.send(text)
    }
  }

  /** Flip the newest reply to another draft, through the host's own swipe buttons (so the chat stays the source of truth). */
  private flipDraft(dir: -1 | 1) {
    const last = this.pieces[this.pieces.length - 1]
    if (!last || last.user || last.id === 'live') return
    this.h.swipe(last.id, dir)
  }

  // ── The heartbeat scrubber ──

  private scrubWire() {
    const { scrub, scrubPanel } = this.ui
    const open = (on: boolean) => {
      clearTimeout(this.scrubTimer)
      if (on) {
        this.drawScrub()
        scrub.dataset.open = '1'
      } else delete scrub.dataset.open
    }
    const later = (ms: number) => {
      clearTimeout(this.scrubTimer)
      this.scrubTimer = setTimeout(() => !this.scrubDrag && open(false), ms)
    }
    scrub.addEventListener('pointerenter', (e) => {
      if (e.pointerType === 'mouse') open(true)
    })
    scrub.addEventListener('pointerleave', (e) => {
      if (e.pointerType === 'mouse' && !this.scrubDrag) later(350)
    })
    scrub.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return
      if (!scrub.dataset.open) {
        open(true)
        if (e.pointerType !== 'mouse') later(3000)
        return
      }
      this.scrubDrag = true
      clearTimeout(this.scrubTimer)
      scrub.setPointerCapture(e.pointerId)
      this.scrubTo(e.clientX)
    })
    scrub.addEventListener('pointermove', (e) => {
      if (this.scrubDrag) this.scrubTo(e.clientX)
    })
    const end = (e: PointerEvent) => {
      if (!this.scrubDrag) return
      this.scrubDrag = false
      if (scrub.hasPointerCapture(e.pointerId)) scrub.releasePointerCapture(e.pointerId)
      this.announce()
      later(e.pointerType === 'mouse' ? 1200 : 2500)
    }
    scrub.addEventListener('pointerup', end)
    scrub.addEventListener('pointercancel', end)
    void scrubPanel
  }

  private scrubList() {
    return this.pieces.filter((p) => p.id !== 'live')
  }

  /** Jump to the message under a pointer on the scrubber (one jump per frame). */
  private scrubTo(clientX: number) {
    const r = this.ui.scrubPanel.getBoundingClientRect()
    const list = this.scrubList()
    if (!list.length || !r.width) return
    const f = Math.min(1, Math.max(0, (clientX - r.left) / r.width))
    const id = list[Math.round(f * (list.length - 1))].id
    cancelAnimationFrame(this.scrubFrame)
    this.scrubFrame = requestAnimationFrame(() => {
      if (!this.on_ || !this.ready || this.busy) return
      const p = this.locate(id, 0)
      if (!p) return
      this.pos = p
      this.paint()
      this.queueRibbon()
      this.drawScrub()
    })
  }

  /** The arc of the story along the bottom edge: the heartbeat, chapter ticks, folded pages and where you are. */
  private drawScrub() {
    if (!this.on_ || !this.ready) return
    const panel = this.ui.scrubPanel
    const W = Math.max(80, Math.round(panel.clientWidth))
    const H = Math.max(40, Math.round(panel.clientHeight))
    const list = this.scrubList()
    const n = list.length
    panel.querySelector('svg')?.remove()
    if (n < 1) return
    const idx = new Map(list.map((p, i) => [p.id, i]))
    const x = (i: number) => (n < 2 ? W / 2 : 12 + (i / (n - 1)) * (W - 24))
    const mid = H * 0.64
    const amp = H * 0.24
    let svg = `<line class="sb-mid" x1="12" x2="${W - 12}" y1="${mid}" y2="${mid}"/>`
    for (const c of orderChapters(this.pieces, this.chapterList())) {
      const i = idx.get(c.startId)
      if (i !== undefined) svg += `<line class="sb-tick" x1="${x(i).toFixed(1)}" x2="${x(i).toFixed(1)}" y1="${(H * 0.38).toFixed(1)}" y2="${(H - 4).toFixed(1)}"/>`
    }
    const pts = this.h
      .beats()
      .filter((b) => idx.has(b.id))
      .map((b) => [x(idx.get(b.id)!), mid - Math.max(-1, Math.min(1, b.v)) * amp] as const)
    if (pts.length > 1) svg += `<polyline class="sb-line" points="${pts.map((q) => `${q[0].toFixed(1)},${q[1].toFixed(1)}`).join(' ')}"/>`
    for (const pin of this.h.pins()) {
      const i = idx.get(pin.id)
      if (i !== undefined) svg += `<polygon class="sb-star" points="${starPoints(x(i), H * 0.5, 5.5)}"/>`
    }
    const cur = this.currentId()
    const ci = cur ? idx.get(cur) : undefined
    if (ci !== undefined) svg += `<line class="sb-head" x1="${x(ci).toFixed(1)}" x2="${x(ci).toFixed(1)}" y1="0" y2="${H}"/>`
    panel.insertAdjacentHTML('afterbegin', `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" aria-hidden="true">${svg}</svg>`)
    const t = this.h.tr
    const d = this.ui.book.dataset
    const title = this.blank || !this.segs[this.pos.seg] ? '' : this.chapterTitle(this.segs[this.pos.seg].chapter) || this.chapterLabel(this.segs[this.pos.seg].chapter)
    this.ui.scrubTip.textContent = [title, d.page ? `${t('Page')} ${d.page}` : ''].filter(Boolean).join(' · ')
  }
}
