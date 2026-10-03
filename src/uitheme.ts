/**
 * Lumiverse theme matching. Flair works out a small set of colours (accent,
 * background tint, speech/thought colours) and the backend feeds them to
 * Lumiverse's own theme engine (`spindle.theme.generateVariables`), which
 * builds a complete, readable light + dark theme from them. The user's saved
 * theme is never changed — Flair's layer is removed when switched off.
 */
import type { FlairSettings } from './settings'
import { packById, type PackTheme } from './packs'
import { hexToHsl } from './palette'

export interface ThemeSpec extends PackTheme {
  depth: FlairSettings['uiThemeDepth']
  /** What the panel says is driving the theme. */
  source: 'pack' | 'character' | 'custom'
  label: string
}

export function hslToHex(h: number, s: number, l: number): string {
  s /= 100
  l /= 100
  const k = (n: number) => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  return '#' + [f(0), f(8), f(4)].map((x) => Math.round(x * 255).toString(16).padStart(2, '0')).join('')
}

/** A full palette grown from one colour (an aura or a custom glow colour). */
export function themeFromColor(hex: string): PackTheme {
  const { h, s } = hexToHsl(hex)
  const sat = Math.max(30, Math.min(85, s))
  // Near-grey colours: keep backgrounds neutral instead of inventing a hue.
  const tint = s < 12 ? 0 : 1
  return {
    accent: hex,
    secondary: hslToHex((h + 40) % 360, sat * 0.8, 62),
    bgDark: hslToHex(h, 26 * tint, 9),
    bgLight: hslToHex(h, 34 * tint, 96),
    speech: hslToHex(h, Math.min(90, sat + 10), 74),
    thoughts: hslToHex((h + 28) % 360, 38 * tint, 72),
  }
}

/**
 * What Lumiverse should look like right now, or null to leave the user's
 * own theme alone.
 *  - mode 'pack': the active pack's theme; a custom glow colour if no pack;
 *    the Character Aware pack follows the character.
 *  - mode 'character': always the speaking character's aura (falls back to the pack).
 * A mood colour (whole-UI mood tint) replaces the accent but keeps the backdrop.
 */
export function resolveUiTheme(
  s: FlairSettings,
  charAura: { color: string; name: string | null } | null,
  moodColor: string | null,
): ThemeSpec | null {
  if (!s.enabled || s.uiTheme === 'off') return null
  const pack = s.activePack ? packById(s.activePack) : undefined
  let base: Omit<ThemeSpec, 'depth'> | null = null

  const fromCharacter = () =>
    charAura ? { ...themeFromColor(charAura.color), source: 'character' as const, label: charAura.name ?? 'Character' } : null

  const fromPack = () => {
    if (pack?.theme === 'character' || s.colorSource === 'character') return fromCharacter()
    if (pack?.theme) return { ...pack.theme, source: 'pack' as const, label: pack.name }
    if (s.colorSource === 'custom') return { ...themeFromColor(s.customColor), source: 'custom' as const, label: pack?.name ?? 'Custom colour' }
    return null
  }

  base = s.uiTheme === 'character' ? fromCharacter() ?? fromPack() : fromPack()
  if (!base) return null
  if (moodColor && s.moodTintUI) base = { ...base, accent: moodColor, speech: undefined }
  return { ...base, depth: s.uiThemeDepth }
}

/** Stable key so the frontend only messages the backend when something changed. */
export function themeKey(spec: ThemeSpec | null): string {
  return spec ? JSON.stringify([spec.accent, spec.secondary, spec.bgDark, spec.bgLight, spec.speech, spec.thoughts, spec.depth]) : 'none'
}
