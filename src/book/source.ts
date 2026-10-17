/**
 * Book mode: where the text of each page comes from (docs/BOOK_MODE.md 3.1, decided 2026-10-17).
 *
 *  - A message the host has rendered: its own HTML (`harvest`), cleaned. Exactly what the reader sees (markdown,
 *    display regex, macros, Flair's `data-lf` spans).
 *  - Every other message: the raw text from the free `ctx.chats.getMessages` read, set by `rawToHtml`. Display
 *    regex scripts and macros don't run there, so those pieces are flagged `exact: false` ("text only").
 *  - Interactive content (iframes, HTML islands: they live in a Shadow DOM, so `innerHTML` would drop them anyway)
 *    is never cloned. It becomes a small plate.
 *
 * Everything here returns plain strings of markup we built ourselves from an allow-list, so the book can pour it
 * into the page with `innerHTML` without trusting the chat text.
 */
import { choicesIn } from '../choices'

export interface Piece {
  id: string
  user: boolean
  name: string
  html: string
  /** HTML inserts (styled blocks), each drawn inside a shadow root of its own where the placeholder `.lf-bk-island[data-i]` is. */
  islands: string[]
  /** True when the host rendered it (regex and macros applied); false for raw text set by rawToHtml. */
  exact: boolean
  /** Text length, for deciding where a segment ends. */
  len: number
  /** Changes whenever the visible content does. */
  key: string
  /** The raw text it came from (swipe and hash), so the same text can be told apart from an edit. */
  src: string
  /** Its place in the chat (the host's `index_in_chat`), or -1 when the host didn't say. */
  at: number
  /** The options it offers (`<flair-choice>` tags in its text). */
  choices: string[]
  /** Which draft (swipe) is showing and how many there are; only when there is more than one. */
  draft?: { i: number; n: number }
}

/** The part of Lumiverse's message DTO we read. */
export interface RawMessage {
  id: string
  is_user?: boolean
  name?: string
  content?: string
  swipe_id?: number
  index_in_chat?: number
  /** One per draft; the slots that aren't showing may be null. */
  swipes?: Array<string | null>
  extra?: Record<string, unknown> | null
}

// ── What to leave out ──
let ignoreNames: string[] = []
let ignoreSels: string[] = []
let ignoreSig = ''

/**
 * Set the rules for what the book leaves out (one per line: a plain word names a tag or code block, anything else is a CSS
 * selector). Returns whether they changed.
 */
export function setIgnore(text: string): boolean {
  const names: string[] = []
  const sels: string[] = []
  for (const line of text.split('\n')) {
    let t = line.trim().slice(0, 200)
    if (!t) continue
    // A tag as it is written in the message (`<scenecard>`, `<tracker type="sim">`, `</sim>`) means its name.
    const tag = /^<\/?([a-z][a-z0-9_-]*)\b[^>]*>?$/i.exec(t)
    if (tag) t = tag[1]
    if (/^[a-z][a-z0-9_-]*$/i.test(t)) names.push(t.toLowerCase())
    else {
      try {
        document.createDocumentFragment().querySelector(t)
        sels.push(t)
      } catch {
        /* not a selector: skipped */
      }
    }
  }
  const sig = `${names.join(',')}|${sels.join('\n')}`
  const changed = sig !== ignoreSig
  ignoreNames = names
  ignoreSels = sels
  ignoreSig = sig
  if (changed) rawCache.clear()
  return changed
}

/** Take what the rules name out of a tree. Returns whether anything went. */
function dropIgnored(root: ParentNode): boolean {
  let any = false
  const each = (sel: string, whole?: string) => {
    try {
      root.querySelectorAll(sel).forEach((e) => {
        ;(whole ? (e.closest(whole) ?? e) : e).remove()
        any = true
      })
    } catch {
      /* a selector this browser can't take */
    }
  }
  for (const s of ignoreSels) each(s)
  for (const n of ignoreNames) {
    each(n)
    each(`[data-code-lang="${n}" i]`, 'pre')
    each(`code.language-${n}`, 'pre')
  }
  return any
}

/** The same rules on raw text: fenced blocks and tags that carry the ignored names. */
function dropIgnoredText(text: string): string {
  // Flair's own stage directions and choices are not story text (the host takes them out of a rendered page).
  for (const n of ['flair', 'flair-choice', ...ignoreNames]) {
    text = text.replace(new RegExp('```[ \\t]*' + n + '\\b[\\s\\S]*?```', 'gi'), '')
    text = text.replace(new RegExp('<' + n + '\\b[^>]*>[\\s\\S]*?</' + n + '\\s*>|<' + n + '\\b[^>]*/>', 'gi'), '')
  }
  return text
}

let plateLabel = 'Interactive content: open in chat'
export const setPlateLabel = (s: string) => {
  plateLabel = s
}
export const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
export const plate = () => `<div class="lf-bk-plate" role="note">${esc(plateLabel)}</div>`

export function hash(s: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0).toString(36)
}

const textLen = (html: string) => html.replace(/<[^>]*>/g, '').length

const SAFE_IMG = /^(https?:\/\/|\/|blob:|data:image\/(png|jpe?g|gif|webp);)/i

/**
 * An inline `style` attribute made safe for a page: null when it can't be (script-like values), else the same style with
 * `position: fixed` and `sticky` taken out (they would escape the page and cover the book) and any `url()` that isn't an
 * image we would show turned to `none`.
 */
export function safeStyle(v: string): string | null {
  if (/expression\s*\(|javascript:|@import|behavior\s*:|-moz-binding/i.test(v)) return null
  return v
    .replace(/position\s*:\s*(?:fixed|sticky)\s*(?:!important)?\s*;?/gi, '')
    .replace(/url\(\s*(['"]?)(?!https?:|data:image\/|\/|blob:)[^)]*\)/gi, 'none')
}

// ── HTML inserts ("islands") ──
// A styled block of HTML in a message (a status card, a table with its own colours) is what the host draws inside a Shadow
// DOM. The book does the same: the block goes into a shadow root of its own, so its styles cannot reach the page or the
// host, after being cleaned of anything that could run or reach out (scripts, frames, forms, event handlers, links).

/** Base rules inside every island: sized to fit a page, ink-coloured unless the author says otherwise. */
export const ISLAND_CSS = `
:host { display: block; margin: .6em 0; text-indent: 0; text-align: left; hyphens: none; color: var(--bk-ink); font-family: var(--bk-font); font-size: .94em; line-height: 1.45; overflow: hidden; max-width: 100%; }
*, *::before, *::after { box-sizing: border-box; }
img, svg, video { max-width: 100%; height: auto; }
img { max-height: calc(var(--bk-th) * .88); object-fit: contain; }
table { max-width: 100%; }
p { text-indent: 0; }
:host { position: relative; }
.lf-bk-x { position: absolute; top: 4px; right: 4px; width: 22px; height: 22px; padding: 0; border: 0; border-radius: 50%; background: rgba(12,12,20,.78); color: #fff; font: 15px/22px system-ui, sans-serif; text-align: center; cursor: pointer; opacity: 0; transition: opacity .15s ease; z-index: 2; }
:host(:hover) .lf-bk-x, .lf-bk-x:focus-visible { opacity: 1; }
@media (pointer: coarse) { .lf-bk-x { opacity: .6; width: 28px; height: 28px; line-height: 28px; } }
`

export function cleanIsland(html: string): string {
  const doc = new DOMParser().parseFromString(`<body>${html}`, 'text/html')
  const dropped = dropIgnored(doc.body)
  for (const el of Array.from(doc.body.querySelectorAll('script,iframe,frame,frameset,object,embed,link,meta,base,form,input,textarea,select,noscript,template,canvas,video,audio,[data-lumi-island-base]'))) el.remove()
  for (const el of Array.from(doc.body.querySelectorAll('*'))) {
    for (const a of Array.from(el.attributes)) {
      const n = a.name.toLowerCase()
      const v = a.value.trim()
      if (n.startsWith('on') || n === 'srcdoc' || n === 'action' || n === 'formaction' || n === 'href' || n === 'xlink:href') el.removeAttribute(a.name)
      else if ((n === 'src' || n === 'poster') && !SAFE_IMG.test(v)) el.removeAttribute(a.name)
      else if (n === 'style') {
        const st = safeStyle(a.value)
        if (st === null) el.removeAttribute(a.name)
        else if (st !== a.value) el.setAttribute(a.name, st)
      }
    }
    // A button in an insert stays as it looks, and does nothing.
    if (el.tagName === 'BUTTON') {
      el.setAttribute('type', 'button')
      el.setAttribute('disabled', '')
      el.setAttribute('tabindex', '-1')
    }
    if (el.tagName === 'STYLE') el.textContent = (el.textContent ?? '').replace(/@import[^;]*;?/gi, '').replace(/expression\s*\(/gi, '(').replace(/javascript:/gi, '')
  }
  // An insert the rules emptied (a tracker card, say) leaves nothing behind.
  if (dropped && !doc.body.textContent?.trim() && !doc.body.querySelector('img,svg,video,canvas,hr')) return ''
  return doc.body.innerHTML
}

let ignoreLabel = 'Leave this out of the book'
export const setIgnoreLabel = (s: string) => {
  ignoreLabel = s
}

// A class from a CSS-module build looks like `_name_x1y2_12`; it changes with every build of the host, so it is no handle.
const HASHED = /^_?[A-Za-z]+_[A-Za-z0-9]{4,}_\d+$/

/** A CSS selector that names an insert, for "leave this out": the class (or id) of its outermost element, else null. */
export function islandRule(html: string): string | null {
  const doc = new DOMParser().parseFromString(`<body>${html}`, 'text/html')
  const top = Array.from(doc.body.children).find((e) => e.tagName !== 'STYLE')
  if (!top) return null
  if (top.id && /^[A-Za-z][\w-]*$/.test(top.id)) return `#${top.id}`
  const cls = Array.from(top.classList).find((c) => /^[A-Za-z][\w-]*$/.test(c) && !HASHED.test(c))
  return cls ? `${top.tagName.toLowerCase() === 'div' || top.tagName.toLowerCase() === 'section' ? '' : top.tagName.toLowerCase()}.${cls}` : null
}

const island = (n: number) => `<div class="lf-bk-island" data-i="${n}"></div>`

/**
 * Give each island placeholder under `root` its shadow root. `find` says which piece a message section belongs to.
 * Clones (the faces of a turning leaf) don't carry shadow roots, so they are filled in the same way. `onLoad` hears about
 * images that arrive late (a load event doesn't leave a shadow root).
 */
export function hydrateIslands(root: Element, find: (id: string) => Piece | undefined, onLoad?: () => void, onIgnore?: (rule: string, island: HTMLElement) => void) {
  for (const ph of Array.from(root.querySelectorAll<HTMLElement>('.lf-bk-island'))) {
    if (ph.shadowRoot) continue
    const id = ph.closest<HTMLElement>('.lf-bk-m')?.dataset.id
    const html = id ? find(id)?.islands[Number(ph.dataset.i)] : undefined
    if (html === undefined) continue
    const sr = ph.attachShadow({ mode: 'open' })
    sr.innerHTML = `<style>${ISLAND_CSS}</style>${html}`
    if (onLoad) sr.addEventListener('load', onLoad, true)
    const rule = onIgnore ? islandRule(html) : null
    if (onIgnore && rule) {
      const x = document.createElement('button')
      x.type = 'button'
      x.className = 'lf-bk-x'
      x.textContent = '\u00d7'
      x.title = x.ariaLabel = ignoreLabel
      x.addEventListener('click', (e) => {
        e.stopPropagation()
        onIgnore(rule, ph)
      })
      sr.appendChild(x)
    }
  }
}

/** Where the element that starts at `start` ends (after its matching closing tag), or -1. */
function elementEnd(text: string, start: number): number {
  const m = /^<([a-z][a-z0-9]*)\b/i.exec(text.slice(start, start + 40))
  if (!m) return -1
  const re = new RegExp(`<(/?)${m[1]}\\b[^>]*?(/?)>`, 'gi')
  re.lastIndex = start
  let depth = 0
  let t: RegExpExecArray | null
  while ((t = re.exec(text))) {
    if (t[1]) {
      if (--depth === 0) return re.lastIndex
    } else if (t[2]) {
      if (depth === 0) return re.lastIndex
    } else depth++
  }
  return -1
}

const ISLAND_BLOCK = 'div|section|table|center|article|aside|main|header|footer|nav|figure|ul|ol|details|blockquote|p'

/** Pull styled HTML blocks (a `<style>` with the element after it, or an element with a style attribute) out of the text. */
function extractIslands(text: string, islands: string[]): string {
  const start = new RegExp(`<style\\b|<(?:${ISLAND_BLOCK})\\b[^>]*\\bstyle\\s*=`, 'gi')
  let out = ''
  let pos = 0
  let m: RegExpExecArray | null
  while ((m = start.exec(text))) {
    const from = m.index
    let to: number
    let styleOnly = false
    if (/^<style/i.test(m[0])) {
      let p = from
      for (;;) {
        const e = /<\/style\s*>/i.exec(text.slice(p))
        if (!e) {
          p = -1
          break
        }
        p += e.index + e[0].length
        const ws = /^\s*/.exec(text.slice(p))![0].length
        if (/^<style\b/i.test(text.slice(p + ws))) {
          p += ws
          continue
        }
        break
      }
      if (p < 0) continue
      const q = p + /^\s*/.exec(text.slice(p))![0].length
      const e = /^<[a-z]/i.test(text.slice(q)) ? elementEnd(text, q) : -1
      styleOnly = e < 0
      to = e < 0 ? p : e
    } else {
      to = elementEnd(text, from)
      if (to < 0) continue
    }
    out += text.slice(pos, from)
    if (!styleOnly) {
      const cleaned = cleanIsland(text.slice(from, to))
      if (cleaned.trim()) {
        out += `\n\n\u0005${islands.length}\u0005\n\n`
        islands.push(cleaned)
      }
    }
    pos = to
    start.lastIndex = to
  }
  return out + text.slice(pos)
}

// ── Raw text → markup ──

function inline(s: string): string {
  let t = esc(s)
  // Flair's text-effect spans and plain emphasis tags survive; every other tag was escaped above.
  t = t.replace(/&lt;span data-lf=&quot;([a-z-]{1,24})&quot;&gt;/g, '<span data-lf="$1">').replace(/&lt;\/span&gt;/g, '</span>')
  t = t.replace(/&lt;(\/?)(b|strong|i|em|u|s|del|sup|sub|small|mark)&gt;/gi, '<$1$2>')
  t = t.replace(/&lt;br\s*\/?&gt;/gi, '<br>')
  t = t.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (_m, alt: string, url: string) => {
    const u = url.replace(/&amp;/g, '&')
    return SAFE_IMG.test(u) ? `<img src="${esc(u)}" alt="${alt}">` : alt
  })
  t = t.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links read as their text on a page
  t = t.replace(/`([^`\n]+)`/g, '<code>$1</code>')
  t = t.replace(/\*\*([^*\n]+?)\*\*/g, '<strong>$1</strong>')
  t = t.replace(/(^|[^*\w])\*([^*\n]+?)\*(?![*\w])/g, '$1<em>$2</em>')
  t = t.replace(/(^|[^_\w])_([^_\n]+?)_(?![_\w])/g, '$1<em>$2</em>')
  t = t.replace(/~~([^~\n]+?)~~/g, '<del>$1</del>')
  return t
}

/** Layout-only HTML that is not an island (a plain div, a list): the tags go, the text and its line breaks stay. */
function flattenTags(text: string): string {
  return text
    .replace(/<\/?p\b[^>]*>/gi, '\n\n')
    .replace(/<h[1-6]\b[^>]*>/gi, '\n\n## ')
    .replace(/<\/h[1-6]\s*>/gi, '\n\n')
    .replace(/<li\b[^>]*>/gi, '\n- ')
    .replace(/<\/?(?:div|section|article|aside|main|header|footer|nav|figure|figcaption|center|table|thead|tbody|tfoot|tr|ul|ol|li)\b[^>]*>/gi, '\n')
    .replace(/<\/?(?:td|th)\b[^>]*>/gi, ' ')
    .replace(/<\/?font\b[^>]*>/gi, '')
    .replace(/<span\b(?![^>]*\bdata-lf=)[^>]*>/gi, '')
}

function convert(raw: string, islands: string[]): string {
  let text = dropIgnoredText(raw.replace(/\r\n?/g, '\n'))
  // Anything that runs or embeds becomes a plate; scripts vanish.
  text = text.replace(/<script\b[\s\S]*?<\/script\s*>/gi, '')
  text = text.replace(/<(iframe|object|embed|form|canvas|video|audio)\b[\s\S]*?<\/\1\s*>|<(iframe|embed)\b[^>]*\/?>/gi, '\n\n\u0001\n\n')
  text = extractIslands(text, islands)
  text = flattenTags(text)
  // <details> (a reasoning block, say): a summary and a body, set as a closed disclosure on a line of its own.
  text = text.replace(/<details\b(?![^>]*\bstyle\s*=)[^>]*>([\s\S]*?)<\/details\s*>/gi, (_m, inner: string) => {
    const sum = /<summary[^>]*>([\s\S]*?)<\/summary\s*>/i.exec(inner)
    const body = inner.replace(/<summary[\s\S]*?<\/summary\s*>/i, '')
    const label = esc((sum?.[1] ?? '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim())
    return `\n\n\u0002<details><summary>${label}</summary>${convert(body, islands).replace(/\n/g, '&#10;')}</details>\u0003\n\n`
  })
  const lines = text.split('\n')
  const out: string[] = []
  let para: string[] = []
  const flush = () => {
    if (para.length) out.push(`<p>${para.map(inline).join('<br>')}</p>`)
    para = []
  }
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const isl = /^\u0005(\d+)\u0005$/.exec(line.trim())
    if (line.startsWith('\u0002') && line.endsWith('\u0003')) {
      flush()
      out.push(line.slice(1, -1))
    } else if (isl) {
      flush()
      out.push(island(Number(isl[1])))
    } else if (line.trim() === '\u0001') {
      flush()
      out.push(plate())
    } else if (/^\s*```/.test(line)) {
      flush()
      const code: string[] = []
      for (i++; i < lines.length && !/^\s*```/.test(lines[i]); i++) code.push(lines[i])
      out.push(`<pre><code>${esc(code.join('\n'))}</code></pre>`)
    } else if (/^\s*(\*\s*){3,}$|^\s*(-\s*){3,}$|^\s*(_\s*){3,}$/.test(line)) {
      flush()
      out.push('<hr>')
    } else if (/^\s{0,3}#{1,6}\s+\S/.test(line)) {
      flush()
      out.push(`<h4>${inline(line.replace(/^\s{0,3}#{1,6}\s+/, ''))}</h4>`)
    } else if (/^\s{0,3}>/.test(line)) {
      flush()
      const q: string[] = []
      for (; i < lines.length && /^\s{0,3}>/.test(lines[i]); i++) q.push(lines[i].replace(/^\s{0,3}>\s?/, ''))
      i--
      out.push(`<blockquote>${q.join('\n').split(/\n{2,}/).map((p) => `<p>${p.split('\n').map(inline).join('<br>')}</p>`).join('')}</blockquote>`)
    } else if (/^\s{0,3}([-+]|\d+[.)])\s+\S/.test(line)) {
      flush()
      const ordered = /^\s{0,3}\d/.test(line)
      const items: string[] = []
      for (; i < lines.length && /^\s{0,3}([-+]|\d+[.)])\s+\S/.test(lines[i]); i++) items.push(lines[i].replace(/^\s{0,3}([-+]|\d+[.)])\s+/, ''))
      i--
      const tag = ordered ? 'ol' : 'ul'
      out.push(`<${tag}>${items.map((x) => `<li>${inline(x)}</li>`).join('')}</${tag}>`)
    } else if (line.trim() === '') flush()
    else para.push(line.trim())
  }
  flush()
  return out.join('')
}

/** A small markdown pass: paragraphs, emphasis, quotes, rules, code, lists, headings, images, Flair's text-effect spans, and HTML inserts as islands. */
export function rawToParts(raw: string): { html: string; islands: string[] } {
  const islands: string[] = []
  return { html: convert(raw, islands), islands }
}
export const rawToHtml = (raw: string) => rawToParts(raw).html

// ── The host's rendered HTML → markup ──

const KEEP = new Set(['P', 'BR', 'EM', 'STRONG', 'B', 'I', 'U', 'S', 'DEL', 'CODE', 'PRE', 'BLOCKQUOTE', 'UL', 'OL', 'LI', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'HR', 'SPAN', 'DIV', 'IMG', 'TABLE', 'THEAD', 'TBODY', 'TR', 'TH', 'TD', 'DETAILS', 'SUMMARY', 'SUP', 'SUB', 'SMALL', 'MARK'])
const DROP = 'script,style,button,input,textarea,select,canvas,video,audio,object,embed,form,[data-spindle-extension-root],[data-lf-skip]'
const ATTRS: Record<string, string[]> = { IMG: ['src', 'alt'], TD: ['colspan', 'rowspan'], TH: ['colspan', 'rowspan'], DETAILS: ['open'], SPAN: ['data-lf'] }
/** A styled block of this kind is an HTML insert: it goes into an island, with its inline styles. */
const BLOCKS = new Set(['DIV', 'TABLE', 'SECTION', 'ARTICLE', 'ASIDE', 'MAIN', 'HEADER', 'FOOTER', 'NAV', 'FIGURE', 'CENTER'])

/** The reader-visible markup of a host-rendered `[data-component="MessageContent"]`, cleaned to the allow-list; HTML islands are returned separately. */
export function harvest(content: Element): { html: string; islands: string[] } {
  const root = content.cloneNode(true) as HTMLElement
  const islands: string[] = []
  // What the rules leave out, and the host's "…is processing this part of the message" notice, which is not the story.
  dropIgnored(root)
  root.querySelectorAll('.spindle-message-tag-pending').forEach((e) => e.remove())
  // The host draws an HTML island in a Shadow DOM, which a clone leaves behind: read it from the original.
  const originals = Array.from(content.querySelectorAll('[data-lumiverse-html-island]'))
  Array.from(root.querySelectorAll('[data-lumiverse-html-island]')).forEach((el, k) => {
    const inner = originals[k]?.shadowRoot?.innerHTML ?? ''
    const cleaned = inner ? cleanIsland(inner) : ''
    if (!cleaned.trim()) return el.remove()
    const ph = document.createElement('div')
    ph.className = 'lf-bk-island'
    ph.dataset.i = String(islands.length)
    islands.push(cleaned)
    el.replaceWith(ph)
  })
  // Without a <style> tag the host draws styled HTML as ordinary markup in the chat, keeping its inline styles. The
  // outermost styled blocks become islands too, so the styles survive and stay in the block.
  for (const el of Array.from(root.querySelectorAll<HTMLElement>('[style]'))) {
    // (the clone is detached, so `isConnected` says nothing; an element already moved into an island has lost its parent)
    if (!el.parentNode || !BLOCKS.has(el.tagName) || el.closest('.lf-bk-island')) continue
    const outer = el.parentElement?.closest('[style]')
    if (outer && outer !== root) continue
    const cleaned = cleanIsland(el.outerHTML)
    if (!cleaned.trim()) continue
    const ph = document.createElement('div')
    ph.className = 'lf-bk-island'
    ph.dataset.i = String(islands.length)
    islands.push(cleaned)
    el.replaceWith(ph)
  }
  for (const el of Array.from(root.querySelectorAll('iframe'))) {
    const p = document.createElement('div')
    p.className = 'lf-bk-plate'
    p.setAttribute('role', 'note')
    p.textContent = plateLabel
    el.replaceWith(p)
  }
  for (const el of Array.from(root.querySelectorAll(DROP))) el.remove()
  // Unknown elements are unwrapped (links read as their text; hashed wrappers vanish), known ones lose every attribute but a few.
  for (const el of Array.from(root.querySelectorAll('*')).reverse() as HTMLElement[]) {
    if (!el.isConnected && el.parentNode === null) continue
    if (el.classList.contains('lf-bk-plate') || el.classList.contains('lf-bk-island')) continue
    if (!KEEP.has(el.tagName)) {
      el.replaceWith(...Array.from(el.childNodes))
      continue
    }
    const keep = ATTRS[el.tagName] ?? []
    const style = el.getAttribute('style')
    for (const a of Array.from(el.attributes)) if (!keep.includes(a.name)) el.removeAttribute(a.name)
    // A colour or a weight on a span or a word survives; the page's own type and layout are not styled by the chat.
    const st = style === null ? null : safeStyle(style)
    if (st) el.setAttribute('style', st)
    if (el.tagName === 'IMG') {
      const src = el.getAttribute('src') ?? ''
      if (!SAFE_IMG.test(src)) el.remove()
      else el.setAttribute('loading', 'eager')
    } else if (el.tagName === 'SPAN' && !el.hasAttribute('data-lf') && !el.hasAttribute('style')) el.replaceWith(...Array.from(el.childNodes))
    else if (el.tagName === 'DIV' && !el.querySelector('p, pre, blockquote, ul, ol, table, img, hr, h1, h2, h3, h4, h5, h6, .lf-bk-plate, .lf-bk-island') && !el.classList.length) {
      // a bare text wrapper: make it a paragraph so the book's paragraph rules apply
      const p = document.createElement('p')
      p.append(...Array.from(el.childNodes))
      el.replaceWith(p)
    }
  }
  const html = root.innerHTML.trim()
  // Loose text straight under the root (no paragraph at all): wrap it.
  return { html: html && !/^<(p|div|pre|blockquote|ul|ol|table|h\d|hr|details)\b/i.test(html) ? `<p>${html}</p>` : html, islands }
}

// ── Pieces ──

const rawCache = new Map<string, { html: string; islands: string[] }>()

/** Skip messages the reader has hidden (they are drafts, left out of the prompt too). */
export const isHidden = (m: RawMessage) => m.extra?.hidden === true

/**
 * One message as a page piece. `rendered` is the host's `MessageContent` element when the message is mounted.
 * An empty message (a reply that is still blank) gives no piece.
 */
export function pieceOf(m: RawMessage, rendered: Element | null): Piece | null {
  const swipe = m.swipe_id ?? 0
  let parts = { html: '', islands: [] as string[] }
  let exact = false
  if (rendered) {
    parts = harvest(rendered)
    exact = true
  }
  const content = m.content ?? ''
  if (!rendered || !parts.html) {
    exact = false
    const ck = `${m.id}|${swipe}|${hash(content)}`
    let r = rawCache.get(ck)
    if (!r) {
      r = rawToParts(content)
      if (rawCache.size > 4000) rawCache.clear()
      rawCache.set(ck, r)
    }
    parts = r
  }
  if (!parts.html.trim()) return null
  const choices = m.is_user ? [] : choicesIn(content)
  const n = Array.isArray(m.swipes) ? m.swipes.length : 0
  const draft = !m.is_user && n > 1 ? { i: Math.min(n - 1, Math.max(0, swipe)), n } : undefined
  const inkLen = parts.islands.reduce((n, h) => n + h.replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<[^>]*>/g, '').length, 0)
  return {
    id: m.id,
    user: !!m.is_user,
    name: m.name ?? '',
    html: parts.html,
    islands: parts.islands,
    exact,
    len: textLen(parts.html) + inkLen + 40,
    key: `${swipe}.${hash(parts.html + parts.islands.join('\u0000') + choices.join('\u0001'))}${exact ? 'x' : ''}${draft ? `d${draft.i}/${draft.n}` : ''}`,
    src: content ? `${swipe}|${hash(content)}` : '',
    at: typeof m.index_in_chat === 'number' ? m.index_in_chat : -1,
    choices,
    ...(draft ? { draft } : {}),
  }
}

// ── Reading the whole chat ──

export interface ChatRead {
  data: RawMessage[]
  total: number
}
export type GetMessages = (chatId: string, options?: { limit?: number; tail?: boolean; offset?: number }) => Promise<ChatRead>

/** The free whole-chat read, if this host has it (it isn't in lumiverse-spindle-types yet). */
export function chatReader(ctx: unknown): GetMessages | null {
  const fn = (ctx as { chats?: { getMessages?: GetMessages } } | null)?.chats?.getMessages
  return typeof fn === 'function' ? (fn as GetMessages).bind((ctx as { chats: object }).chats) : null
}

export const PAGE = 200

/**
 * Read a chat newest-first in pages: `onBatch(messages, oldest)` gets the newest 200 first, then each older 200, oldest
 * last (each batch is itself oldest-first). Stops early when `stop()` is true.
 */
export async function readChat(get: GetMessages, chatId: string, onBatch: (msgs: RawMessage[], oldest: boolean) => void, stop: () => boolean): Promise<void> {
  const first = await get(chatId, { limit: PAGE, tail: true })
  if (stop()) return
  const total = Math.max(first.total ?? 0, first.data.length)
  let end = total - first.data.length // messages before the batch we have
  onBatch(first.data, end <= 0)
  while (end > 0 && !stop()) {
    const start = Math.max(0, end - PAGE)
    const page = await get(chatId, { limit: end - start, offset: start })
    if (stop()) return
    if (!page.data.length) {
      onBatch([], true)
      return
    }
    end = start
    onBatch(page.data, end <= 0)
  }
}
