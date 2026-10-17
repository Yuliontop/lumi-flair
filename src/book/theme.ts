/**
 * What the book's paper looks like: a Flair Pack's optional `book` field (paper, ink, accent, binding, ornament and a
 * texture drawn from CSS gradients and one tiny static noise tile), or one of the fixed papers. Pure data.
 */

export type PaperTexture = 'plain' | 'parchment' | 'case' | 'petals' | 'holo' | 'foxed' | 'terminal'
export const TEXTURES: readonly PaperTexture[] = ['plain', 'parchment', 'case', 'petals', 'holo', 'foxed', 'terminal']

export interface PackBook {
  paper: string
  ink: string
  accent: string
  /** The cover's colour. */
  binding: string
  /** One to three characters: the mark under a chapter title and on the cover. */
  ornament: string
  tex: PaperTexture
}

export type Paper = 'pack' | 'cream' | 'white' | 'night'

const HEX = /^#[0-9a-f]{6}$/i
export const DEFAULT_ORNAMENT = '❦'

/** Anything read from a stored or imported pack goes through here. */
export function sanitizeBook(raw: unknown): PackBook | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const r = raw as Record<string, unknown>
  if (![r.paper, r.ink, r.accent, r.binding].every((v) => typeof v === 'string' && HEX.test(v))) return undefined
  const orn = typeof r.ornament === 'string' ? r.ornament.replace(/[<>&"'\\]/g, '').trim().slice(0, 3) : ''
  return {
    paper: String(r.paper),
    ink: String(r.ink),
    accent: String(r.accent),
    binding: String(r.binding),
    ornament: orn || DEFAULT_ORNAMENT,
    tex: TEXTURES.includes(r.tex as PaperTexture) ? (r.tex as PaperTexture) : 'plain',
  }
}

// A 90 px tile of fractal noise, drawn once by the browser as an image (nothing live).
const NOISE = (r: number, g: number, b: number, a: number) =>
  `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='90' height='90'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 ${r} 0 0 0 0 ${g} 0 0 0 0 ${b} 0 0 0 ${a} 0'/%3E%3C/filter%3E%3Crect width='90' height='90' filter='url(%23n)'/%3E%3C/svg%3E")`

const TEX: Record<PaperTexture, string> = {
  plain: 'none',
  parchment: `radial-gradient(ellipse at 18% 14%, rgba(140,90,30,.13), transparent 55%), radial-gradient(ellipse at 86% 92%, rgba(120,70,20,.15), transparent 50%), ${NOISE(0.35, 0.22, 0.1, 0.16)}`,
  case: `linear-gradient(90deg, transparent 9%, rgba(170,40,40,.2) 9%, rgba(170,40,40,.2) calc(9% + 1px), transparent calc(9% + 1px)), repeating-linear-gradient(0deg, transparent 0 27px, rgba(30,30,30,.07) 27px 28px)`,
  petals: `radial-gradient(circle at 12% 18%, rgba(240,120,170,.18) 0 3%, transparent 4%), radial-gradient(circle at 90% 84%, rgba(240,150,190,.2) 0 5%, transparent 6%), radial-gradient(circle at 72% 10%, rgba(255,255,255,.4) 0 3%, transparent 4%), radial-gradient(circle at 30% 92%, rgba(240,130,175,.14) 0 2%, transparent 3%)`,
  holo: `repeating-linear-gradient(0deg, rgba(124,240,255,.05) 0 1px, transparent 1px 4px), radial-gradient(ellipse at 50% 0%, rgba(124,240,255,.14), transparent 60%)`,
  foxed: `radial-gradient(ellipse at 15% 25%, rgba(120,70,20,.24), transparent 30%), radial-gradient(ellipse at 82% 70%, rgba(90,40,20,.26), transparent 28%), radial-gradient(circle at 60% 12%, rgba(110,20,20,.16), transparent 14%), radial-gradient(circle at 25% 88%, rgba(100,60,20,.18), transparent 12%)`,
  terminal: `repeating-linear-gradient(0deg, rgba(109,255,176,.07) 0 1px, transparent 1px 3px), radial-gradient(ellipse at 50% 50%, rgba(109,255,176,.06), transparent 70%)`,
}

/** WCAG relative luminance and contrast of two #rrggbb colours. */
const lum = (h: string) => {
  const c = [1, 3, 5].map((i) => {
    const v = parseInt(h.slice(i, i + 2), 16) / 255
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
}
const contrast = (a: string, b: string) => {
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m)
  return (x + 0.05) / (y + 0.05)
}
/** The colour of the lettering on the cover: the accent when it can be read on the binding, else the paper or the ink, whichever reads better. */
export function giltFor(book: PackBook): string {
  if (contrast(book.accent, book.binding) >= 3) return book.accent
  return contrast(book.paper, book.binding) >= contrast(book.ink, book.binding) ? book.paper : book.ink
}

export interface PaperTheme {
  vars: Record<string, string>
  tex: string
  ornament: string
  /** The cover's own look. */
  binding: string
  gilt: string
}

const FIXED: Record<Exclude<Paper, 'pack'>, { paper: string; ink: string; dim: string; edge: string }> = {
  cream: { paper: '#f4ecd8', ink: '#2b2418', dim: '#7a6c52', edge: 'rgba(60,40,10,.3)' },
  white: { paper: '#fbfbf9', ink: '#1d1d1d', dim: '#6a6a6a', edge: 'rgba(0,0,0,.25)' },
  night: { paper: '#1c1a17', ink: '#e6d9bf', dim: '#a89878', edge: 'rgba(230,217,191,.3)' },
}

/**
 * The colours for a paper. 'pack' follows the active Flair Pack's `book` field; a pack without one gets cream with the
 * pack's own accent (the aura colour) worked into it.
 */
export function paperTheme(paper: Paper, book: PackBook | null): PaperTheme {
  if (paper === 'pack' && book) {
    return {
      vars: {
        '--bk-paper': book.paper,
        '--bk-ink': book.ink,
        '--bk-dim': `color-mix(in srgb, ${book.ink} 58%, ${book.paper})`,
        '--bk-edge': `color-mix(in srgb, ${book.ink} 32%, transparent)`,
        '--bk-accent': book.accent,
      },
      tex: TEX[book.tex],
      ornament: book.ornament,
      binding: book.binding,
      gilt: giltFor(book),
    }
  }
  const f = FIXED[paper === 'pack' ? 'cream' : paper]
  return {
    vars: {
      '--bk-paper': paper === 'pack' ? 'color-mix(in srgb, var(--lf-c, var(--lumiverse-primary, #9370db)) 7%, #f4ecd8)' : f.paper,
      '--bk-ink': f.ink,
      '--bk-dim': f.dim,
      '--bk-edge': f.edge,
      '--bk-accent': 'var(--lf-c, var(--lumiverse-primary, #9370db))',
    },
    tex: 'none',
    ornament: book?.ornament ?? DEFAULT_ORNAMENT,
    binding: book?.binding ?? 'color-mix(in srgb, var(--lf-c, var(--lumiverse-primary, #9370db)) 45%, #2a1d12)',
    gilt: '#d9b765',
  }
}
