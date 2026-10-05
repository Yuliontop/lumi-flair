/**
 * AI sound-effect cues: the names the AI may use in <flair sfx="door-knock"></flair>.
 * Pure data, shared by the backend (the prompt note), the settings (file slots)
 * and the frontend (playback). Keep it free of imports and browser APIs.
 */
export interface SfxCue {
  name: string
  /** Panel label (English; goes through tr()). */
  label: string
  /** When the AI should use it; goes into the prompt. */
  use: string
}

export const SFX_CUES: readonly SfxCue[] = [
  { name: 'door-knock', label: 'Door knock', use: 'someone knocks' },
  { name: 'door-creak', label: 'Door creak', use: 'a door or hinge creaks' },
  { name: 'door-slam', label: 'Door slam', use: 'a door slams' },
  { name: 'footsteps', label: 'Footsteps', use: 'someone walks or approaches' },
  { name: 'sword-clash', label: 'Sword clash', use: 'blades meet' },
  { name: 'glass-break', label: 'Glass break', use: 'glass shatters' },
  { name: 'heartbeat', label: 'Heartbeat', use: 'fear, tension, a charged moment' },
  { name: 'thunder', label: 'Thunder', use: 'thunder rolls' },
  { name: 'bell', label: 'Bell', use: 'a bell tolls' },
  { name: 'whoosh', label: 'Whoosh', use: 'something swings or rushes past' },
  { name: 'impact', label: 'Impact', use: 'a punch or heavy blow lands' },
  { name: 'magic', label: 'Magic', use: 'a spell is cast' },
  { name: 'splash', label: 'Splash', use: 'something hits water' },
  { name: 'fire-crackle', label: 'Fire crackle', use: 'a fire crackles' },
]

/** Near-misses the AI is likely to write. */
const ALIASES: Record<string, string> = {
  knock: 'door-knock',
  knocking: 'door-knock',
  'knock-knock': 'door-knock',
  'door-knocking': 'door-knock',
  creak: 'door-creak',
  creaking: 'door-creak',
  'door-creaking': 'door-creak',
  squeak: 'door-creak',
  hinge: 'door-creak',
  'door-open': 'door-creak',
  'door-opens': 'door-creak',
  slam: 'door-slam',
  'door-slams': 'door-slam',
  'door-shut': 'door-slam',
  'door-close': 'door-slam',
  'door-closes': 'door-slam',
  footstep: 'footsteps',
  steps: 'footsteps',
  step: 'footsteps',
  walking: 'footsteps',
  footfalls: 'footsteps',
  sword: 'sword-clash',
  swords: 'sword-clash',
  clash: 'sword-clash',
  'blade-clash': 'sword-clash',
  'steel-clash': 'sword-clash',
  'sword-fight': 'sword-clash',
  'sword-clang': 'sword-clash',
  'glass-breaks': 'glass-break',
  'glass-shatter': 'glass-break',
  'glass-smash': 'glass-break',
  'breaking-glass': 'glass-break',
  shatter: 'glass-break',
  shattering: 'glass-break',
  'heart-beat': 'heartbeat',
  heartbeats: 'heartbeat',
  heart: 'heartbeat',
  'pounding-heart': 'heartbeat',
  'racing-heart': 'heartbeat',
  thunderclap: 'thunder',
  'thunder-clap': 'thunder',
  'thunder-roll': 'thunder',
  rumble: 'thunder',
  bells: 'bell',
  'church-bell': 'bell',
  'bell-toll': 'bell',
  'bell-ring': 'bell',
  toll: 'bell',
  ding: 'bell',
  swoosh: 'whoosh',
  swish: 'whoosh',
  'whoosh-by': 'whoosh',
  swing: 'whoosh',
  punch: 'impact',
  hit: 'impact',
  thud: 'impact',
  thump: 'impact',
  blow: 'impact',
  smack: 'impact',
  'body-hit': 'impact',
  spell: 'magic',
  'spell-cast': 'magic',
  cast: 'magic',
  sparkle: 'magic',
  magical: 'magic',
  enchant: 'magic',
  splashing: 'splash',
  'water-splash': 'splash',
  plunge: 'splash',
  crackle: 'fire-crackle',
  crackling: 'fire-crackle',
  'fire-crackling': 'fire-crackle',
  fire: 'fire-crackle',
  campfire: 'fire-crackle',
  bonfire: 'fire-crackle',
  flames: 'fire-crackle',
}

/** Resolve whatever the AI wrote to a known cue name, or null. Unknown names are ignored on purpose: never play the wrong sound. */
export function cueName(raw: string | undefined | null): string | null {
  if (!raw) return null
  const n = raw
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
  if (!n) return null
  if (SFX_CUES.some((c) => c.name === n)) return n
  return ALIASES[n] ?? null
}
