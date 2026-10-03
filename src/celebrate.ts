import { BURST_EFFECTS, type BurstEffect } from './settings'

/** Message-count milestones worth a celebration. */
export const MILESTONES = [50, 100, 250, 500, 1000, 1500, 2000, 3000, 5000, 7500, 10000]

/** Highest milestone ≤ count (0 if none). */
export function milestoneAtOrBelow(count: number): number {
  let best = 0
  for (const m of MILESTONES) if (m <= count) best = m
  return best
}

export interface Trigger {
  phrase: string
  effect: BurstEffect
}

/** Parse "phrase => effect" lines. Unknown effects fall back to sparkle. */
export function parseTriggers(source: string): Trigger[] {
  const out: Trigger[] = []
  for (const line of source.split(/\r?\n/)) {
    const m = line.match(/^\s*(.+?)\s*=>\s*([a-z]+)\s*$/i)
    if (!m) continue
    const phrase = m[1].trim().toLowerCase()
    if (phrase.length < 2) continue
    const eff = m[2].toLowerCase()
    out.push({ phrase, effect: (BURST_EFFECTS as readonly string[]).includes(eff) ? (eff as BurstEffect) : 'sparkle' })
  }
  return out
}

/** First trigger whose phrase appears in the text (case-insensitive). */
export function matchTrigger(text: string | undefined, triggers: Trigger[]): Trigger | null {
  if (!text || !triggers.length) return null
  const hay = text.toLowerCase()
  return triggers.find((t) => hay.includes(t.phrase)) ?? null
}
