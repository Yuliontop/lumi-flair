/**
 * Colour pipeline helpers: mood (expression label → colour), time-of-day
 * tint, and small conversions. The final glow colour is composed in CSS:
 *
 *   base (theme accent | custom)  →  time-of-day tint  →  mood colour
 */

export interface MoodRule {
  words: string[]
  color: string
}

/** Parse "happy, joy = #ffc94d" lines. Invalid lines are ignored. */
export function parseMoodMap(source: string): MoodRule[] {
  const rules: MoodRule[] = []
  for (const line of source.split(/\r?\n/)) {
    const m = line.match(/^\s*([^=#]+?)\s*=\s*(#[0-9a-f]{6})\s*$/i)
    if (!m) continue
    const words = m[1]
      .split(',')
      .map((w) => w.trim().toLowerCase())
      .filter(Boolean)
    if (words.length) rules.push({ words, color: m[2].toLowerCase() })
  }
  return rules
}

/** Match an expression label (e.g. "Happy_2", "very-angry") to a colour. */
export function moodColorFor(label: string | undefined | null, rules: MoodRule[]): string | null {
  if (!label) return null
  const l = label.toLowerCase()
  if (/^(neutral|default|idle|calm)$/.test(l)) return null
  for (const rule of rules) {
    if (rule.words.some((w) => l === w || l.includes(w))) return rule.color
  }
  return null
}

export interface TimeTint {
  color: string
  amount: number // 0 – 100 (% of tint mixed into the base colour)
  label: string
}

/** Local-clock tint: peach dawn, neutral day, amber golden hour, indigo night. */
export function timeOfDayTint(date = new Date()): TimeTint | null {
  const h = date.getHours() + date.getMinutes() / 60
  if (h >= 5 && h < 9) return { color: '#ffb38a', amount: 28, label: 'Dawn' }
  if (h >= 9 && h < 17) return null
  if (h >= 17 && h < 20) return { color: '#ffa04d', amount: 32, label: 'Golden hour' }
  return { color: '#6b7cff', amount: 30, label: 'Night' }
}

export function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const n = parseInt(hex.slice(1), 16)
  const r = ((n >> 16) & 255) / 255
  const g = ((n >> 8) & 255) / 255
  const b = (n & 255) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return { h: 0, s: 0, l: Math.round(l * 100) }
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h = 0
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0)
  else if (max === g) h = (b - r) / d + 2
  else h = (r - g) / d + 4
  return { h: Math.round(h * 60), s: Math.round(s * 100), l: Math.round(l * 100) }
}

/** Semitone offset used by the sound module so chimes match the mood. */
export function moodPitch(label: string | null): number {
  if (!label) return 0
  const l = label.toLowerCase()
  if (/(happy|joy|excit|laugh|smile|love|flirt)/.test(l)) return 3
  if (/(sad|cry|lonely|worr|scared|fear)/.test(l)) return -3
  if (/(angry|annoy|furious)/.test(l)) return -5
  return 0
}
