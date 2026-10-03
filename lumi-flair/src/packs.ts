/**
 * Flair Packs: one-click looks (effects + scene + light + colours + glow),
 * plus import/export as `.flair.json` so the community can share their own.
 * Packs never switch sound on — audio stays the user's choice.
 */
import type { SpindleFrontendContext } from 'lumiverse-spindle-types'
import { normalize, type FlairSettings, type StoredPack } from './settings'

export const PACK_KEYS = [
  'sendEffect', 'sendIntensity', 'userEntrance', 'characterEntrance',
  'hoverStyle', 'hoverStrength', 'traceSpeed', 'streamingAura',
  'colorSource', 'customColor', 'userColor', 'userCustomColor', 'timeOfDay',
  'ambientScene', 'ambientDensity', 'ambientOpacity',
  'lightDefault', 'cinematic', 'vignette', 'grain', 'swipeTransition',
] as const satisfies readonly (keyof FlairSettings)[]

export type PackSettings = Partial<Pick<FlairSettings, (typeof PACK_KEYS)[number]>>

/** Colours Flair hands to Lumiverse's theme engine when "Lumiverse theme" follows the pack. */
export interface PackTheme {
  accent: string
  secondary?: string
  /** Background tint for dark mode / light mode (the engine keeps them readable). */
  bgDark: string
  bgLight: string
  speech?: string
  thoughts?: string
}

export interface FlairPack {
  id: string
  name: string
  tagline: string
  swatch: [string, string]
  settings: PackSettings
  /** Lumiverse theme for this pack; 'character' = follow the speaking character's aura; none = keep the user's theme. */
  theme?: PackTheme | 'character'
  /** Settings outside PACK_KEYS this pack also needs (e.g. auras on). */
  extra?: Partial<FlairSettings>
  /** Set for user packs (imported or saved from the current look). */
  custom?: 'imported' | 'saved'
}

export const PACKS: FlairPack[] = [
  {
    id: 'lumi',
    name: 'Lumi Classic',
    tagline: 'Your theme colours, sparkles and an edge trace.',
    swatch: ['#9370db', '#c7b4ff'],
    settings: {
      sendEffect: 'sparkle', sendIntensity: 1, userEntrance: 'pop', characterEntrance: 'bloom',
      hoverStyle: 'trace', hoverStrength: 1, traceSpeed: 3, streamingAura: true,
      colorSource: 'theme', userColor: 'match', ambientScene: 'off', ambientDensity: 1, ambientOpacity: 0.6,
      lightDefault: 'none', cinematic: true, vignette: 0.3, grain: false, swipeTransition: 'slide',
    },
  },
  {
    id: 'cozy',
    name: 'Cozy Fantasy',
    tagline: 'Candlelight, fireflies and warm amber glow.',
    swatch: ['#ffb347', '#ff7a3d'],
    settings: {
      sendEffect: 'sparkle', sendIntensity: 0.9, userEntrance: 'rise', characterEntrance: 'bloom',
      hoverStyle: 'glow', hoverStrength: 1.1, streamingAura: true,
      colorSource: 'custom', customColor: '#ffb347', userColor: 'warm',
      ambientScene: 'fireflies', ambientDensity: 0.8, ambientOpacity: 0.7,
      lightDefault: 'candle', cinematic: true, vignette: 0.45, grain: false, swipeTransition: 'fade',
    },
    theme: { accent: '#ffb347', secondary: '#ff7a3d', bgDark: '#1d150e', bgLight: '#fbf3e8', speech: '#ffd08a', thoughts: '#e3b48c' },
  },
  {
    id: 'cyber',
    name: 'Cyberpunk Neon',
    tagline: 'Neon edges, comets and a city in the rain.',
    swatch: ['#00e5ff', '#ff2bd6'],
    settings: {
      sendEffect: 'comet', sendIntensity: 1.2, userEntrance: 'pop', characterEntrance: 'bloom',
      hoverStyle: 'neon', hoverStrength: 1.3, traceSpeed: 2, streamingAura: true,
      colorSource: 'custom', customColor: '#00e5ff', userColor: 'custom', userCustomColor: '#ff2bd6',
      ambientScene: 'rain', ambientDensity: 1.1, ambientOpacity: 0.55,
      lightDefault: 'neon', cinematic: true, vignette: 0.4, grain: true, swipeTransition: 'slide',
    },
    theme: { accent: '#00e5ff', secondary: '#ff2bd6', bgDark: '#0b0a1a', bgLight: '#eef3fb', speech: '#5cf2ff', thoughts: '#ff7ae6' },
  },
  {
    id: 'horror',
    name: 'Horror',
    tagline: 'Storm light, film grain and a blood-red pulse.',
    swatch: ['#b3001b', '#3a0a10'],
    settings: {
      sendEffect: 'ripple', sendIntensity: 0.8, userEntrance: 'rise', characterEntrance: 'bloom',
      hoverStyle: 'glow', hoverStrength: 1.2, streamingAura: true,
      colorSource: 'custom', customColor: '#c0102a', userColor: 'custom', userCustomColor: '#8f8f8f',
      ambientScene: 'embers', ambientDensity: 0.5, ambientOpacity: 0.45,
      lightDefault: 'storm', cinematic: true, vignette: 0.75, grain: true, swipeTransition: 'fade',
    },
    theme: { accent: '#c0102a', secondary: '#5a0b14', bgDark: '#120708', bgLight: '#f4ecec', speech: '#e05561', thoughts: '#a08f8f' },
  },
  {
    id: 'sakura',
    name: 'Sakura Romance',
    tagline: 'Falling petals, dawn light and soft pink glow.',
    swatch: ['#ff8fc8', '#ffd1e8'],
    settings: {
      sendEffect: 'confetti', sendIntensity: 0.8, userEntrance: 'pop', characterEntrance: 'bloom',
      hoverStyle: 'glow', hoverStrength: 1, streamingAura: true,
      colorSource: 'custom', customColor: '#ff8fc8', userColor: 'custom', userCustomColor: '#ffc2dd',
      ambientScene: 'petals', ambientDensity: 0.9, ambientOpacity: 0.75,
      lightDefault: 'dawn', cinematic: true, vignette: 0.25, grain: false, swipeTransition: 'fade',
    },
    theme: { accent: '#ff8fc8', secondary: '#ffc2dd', bgDark: '#1e1218', bgLight: '#fff1f7', speech: '#ffb3d9', thoughts: '#d9a3c4' },
  },
  {
    id: 'space',
    name: 'Deep Space',
    tagline: 'A starfield, shooting stars and cool indigo light.',
    swatch: ['#7c8cff', '#1b1f4a'],
    settings: {
      sendEffect: 'comet', sendIntensity: 1, userEntrance: 'rise', characterEntrance: 'bloom',
      hoverStyle: 'trace', hoverStrength: 1, traceSpeed: 4, streamingAura: true,
      colorSource: 'custom', customColor: '#7c8cff', userColor: 'custom', userCustomColor: '#9ee7ff',
      ambientScene: 'stars', ambientDensity: 1.2, ambientOpacity: 0.8,
      lightDefault: 'night', cinematic: true, vignette: 0.5, grain: false, swipeTransition: 'slide',
    },
    theme: { accent: '#7c8cff', secondary: '#9ee7ff', bgDark: '#0c0e22', bgLight: '#eef0ff', speech: '#9ee7ff', thoughts: '#b6b0ff' },
  },
  {
    id: 'noir',
    name: 'Noir',
    tagline: 'Rain on the window, grain and silver light.',
    swatch: ['#d9d9d9', '#3b3b3b'],
    settings: {
      sendEffect: 'ripple', sendIntensity: 0.7, userEntrance: 'rise', characterEntrance: 'bloom',
      hoverStyle: 'glow', hoverStrength: 0.7, streamingAura: true,
      colorSource: 'custom', customColor: '#d9d9d9', userColor: 'custom', userCustomColor: '#9a9a9a',
      ambientScene: 'rain', ambientDensity: 0.9, ambientOpacity: 0.5,
      lightDefault: 'storm', cinematic: true, vignette: 0.65, grain: true, swipeTransition: 'fade',
    },
    theme: { accent: '#d9d9d9', secondary: '#8a8a8a', bgDark: '#111111', bgLight: '#f2f2f2', speech: '#ececec', thoughts: '#a5a5a5' },
  },
  {
    id: 'character',
    name: 'Character Aware',
    tagline: 'Glow and theme follow whoever is speaking, from their aura colours.',
    swatch: ['#9370db', '#ff8fc8'],
    settings: {
      sendEffect: 'sparkle', sendIntensity: 1, userEntrance: 'pop', characterEntrance: 'bloom',
      hoverStyle: 'glow', hoverStrength: 1.1, streamingAura: true,
      colorSource: 'character', userColor: 'match', ambientScene: 'off', ambientDensity: 1, ambientOpacity: 0.6,
      lightDefault: 'none', cinematic: true, vignette: 0.3, grain: false, swipeTransition: 'slide',
    },
    theme: 'character',
    extra: { auras: true },
  },
]

// ── User packs (imported / saved) ──
let customSource: () => StoredPack[] = () => []
let customCache: { from: StoredPack[] | null; packs: FlairPack[] } = { from: null, packs: [] }

/** Tell the pack registry where the user's saved packs live (the settings store). */
export function bindCustomPacks(get: () => StoredPack[]) {
  customSource = get
  customCache = { from: null, packs: [] }
}

export function customPacks(): FlairPack[] {
  const list = customSource()
  if (customCache.from !== list) {
    customCache = {
      from: list,
      packs: list.map((p) => ({
        id: p.id,
        name: p.name,
        tagline: p.tagline,
        swatch: p.swatch,
        settings: sanitizeSettings(p.settings) ?? {},
        theme: sanitizeTheme(p.theme),
        custom: p.source,
      })),
    }
  }
  return customCache.packs
}

/** Built-in packs followed by the user's own. */
export function allPacks(): FlairPack[] {
  return [...PACKS, ...customPacks()]
}

export function packById(id: string): FlairPack | undefined {
  if (!id) return undefined
  return PACKS.find((p) => p.id === id) ?? customPacks().find((p) => p.id === id)
}

/** Current settings → pack-able subset. */
export function capturePack(s: FlairSettings): PackSettings {
  const out: Record<string, unknown> = {}
  for (const k of PACK_KEYS) out[k] = s[k]
  return out as PackSettings
}

const HEX = /^#[0-9a-f]{6}$/i

function sanitizeSettings(src: unknown): PackSettings | null {
  if (!src || typeof src !== 'object') return null
  const raw = src as Record<string, unknown>
  const full = normalize(raw)
  const out: Record<string, unknown> = {}
  for (const k of PACK_KEYS) if (k in raw) out[k] = full[k]
  return Object.keys(out).length ? (out as PackSettings) : null
}

export function sanitizeTheme(raw: unknown): PackTheme | 'character' | undefined {
  if (raw === 'character') return 'character'
  if (!raw || typeof raw !== 'object') return undefined
  const r = raw as Record<string, unknown>
  if (!HEX.test(String(r.accent)) || !HEX.test(String(r.bgDark)) || !HEX.test(String(r.bgLight))) return undefined
  const opt = (v: unknown) => (typeof v === 'string' && HEX.test(v) ? v : undefined)
  return {
    accent: String(r.accent), bgDark: String(r.bgDark), bgLight: String(r.bgLight),
    secondary: opt(r.secondary), speech: opt(r.speech), thoughts: opt(r.thoughts),
  }
}

export interface PackFile {
  name: string
  tagline: string
  swatch: [string, string]
  settings: PackSettings
  theme?: PackTheme | 'character'
}

/** Validate an imported pack blob; returns only safe, normalized pack data. */
export function sanitizePack(raw: unknown): PackFile | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  const settings = sanitizeSettings(r.settings)
  if (!settings) return null
  const name = typeof r.name === 'string' && r.name.trim() ? r.name.trim().slice(0, 60) : 'Imported pack'
  const tagline = typeof r.tagline === 'string' ? r.tagline.trim().slice(0, 120) : ''
  const theme = sanitizeTheme(r.theme)
  const sw = Array.isArray(r.swatch) ? r.swatch : []
  const fallbackA = settings.colorSource === 'custom' && settings.customColor ? settings.customColor : theme && theme !== 'character' ? theme.accent : '#9370db'
  const fallbackB = settings.userColor === 'custom' && settings.userCustomColor ? settings.userCustomColor : theme && theme !== 'character' ? theme.secondary ?? theme.bgDark : '#c7b4ff'
  const swatch: [string, string] = [HEX.test(String(sw[0])) ? String(sw[0]) : fallbackA, HEX.test(String(sw[1])) ? String(sw[1]) : fallbackB]
  return { name, tagline, swatch, settings, theme }
}

/** Turn the current look into a pack (for "Save my look" and export). */
export function packFromLook(name: string, s: FlairSettings, themeFor: (s: FlairSettings) => PackTheme | 'character' | undefined): PackFile {
  const active = packById(s.activePack)
  const settings = capturePack(s)
  const theme = themeFor(s)
  const a = s.colorSource === 'custom' ? s.customColor : active?.swatch[0] ?? (theme && theme !== 'character' ? theme.accent : '#9370db')
  const b = s.userColor === 'custom' ? s.userCustomColor : active?.swatch[1] ?? '#c7b4ff'
  return { name, tagline: active && name === active.name ? active.tagline : '', swatch: [a, b], settings, theme }
}

export function exportPack(pack: PackFile) {
  const blob = new Blob(
    [JSON.stringify({ lumiFlairPack: 2, ...pack }, null, 2)],
    { type: 'application/json' },
  )
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${pack.name.replace(/[^\w-]+/g, '_') || 'my-pack'}.flair.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

export async function importPack(ctx: SpindleFrontendContext) {
  const files = await ctx.uploads.pickFile({ accept: ['.json', 'application/json'], maxSizeBytes: 64 * 1024 })
  const f = files[0]
  if (!f) return null
  try {
    return sanitizePack(JSON.parse(new TextDecoder().decode(f.bytes)))
  } catch {
    return null
  }
}
