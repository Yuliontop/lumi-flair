/**
 * Scene Director: the AI ends a reply with an invisible stage direction —
 *   <flair scene="rain" light="dusk" mood="tense"></flair>
 * and Flair re-dresses the room (ambient scene, cinematic lighting, mood
 * colour, soundscape). Directions are kept per chat; the newest message wins,
 * so reopening a chat restores its last direction.
 */
import { LIGHTS, SCENES, type Light, type Scene } from './settings'

export interface Direction {
  scene?: Scene
  light?: Light
  mood?: string
}

const SCENE_ALIASES: Record<string, Scene> = {
  clear: 'off',
  none: 'off',
  sunny: 'off',
  storm: 'rain',
  stormy: 'rain',
  drizzle: 'rain',
  blizzard: 'snow',
  fire: 'embers',
  campfire: 'embers',
  ash: 'embers',
  night: 'fireflies',
  sakura: 'petals',
  blossoms: 'petals',
  space: 'stars',
  starry: 'stars',
}

const LIGHT_ALIASES: Record<string, Light> = {
  morning: 'dawn',
  sunrise: 'dawn',
  noon: 'day',
  daylight: 'day',
  sunset: 'dusk',
  evening: 'dusk',
  'golden hour': 'dusk',
  midnight: 'night',
  dark: 'night',
  moonlight: 'night',
  firelight: 'candle',
  torch: 'candle',
  lantern: 'candle',
  lightning: 'storm',
  thunder: 'storm',
  cyber: 'neon',
  city: 'neon',
}

function norm(v: string | undefined): string {
  return (v ?? '').trim().toLowerCase()
}

/** Read scene/light/mood attributes from a <flair> tag. Unknown values are dropped. */
export function parseDirection(attrs: Record<string, string> | undefined): Direction | null {
  if (!attrs) return null
  const d: Direction = {}
  const sc = norm(attrs.scene ?? attrs.weather)
  if (sc) {
    const scene = (SCENES as readonly string[]).includes(sc) ? (sc as Scene) : SCENE_ALIASES[sc]
    if (scene) d.scene = scene
  }
  const li = norm(attrs.light ?? attrs.lighting)
  if (li) {
    const light = (LIGHTS as readonly string[]).includes(li) ? (li as Light) : LIGHT_ALIASES[li]
    if (light) d.light = light
  }
  const mood = norm(attrs.mood)
  if (mood && mood.length <= 24) d.mood = mood
  return d.scene || d.light || d.mood ? d : null
}

/** Remembers the newest direction per chat (by message position). */
export class DirectorState {
  private byChat = new Map<string, { index: number; dir: Direction }>()

  /** Merge a direction if it is at least as new as what we have. Returns true if anything changed. */
  apply(chatId: string, index: number, dir: Direction): boolean {
    const cur = this.byChat.get(chatId)
    if (cur && index < cur.index) return false
    const merged: Direction = cur && index >= cur.index ? { ...cur.dir, ...dir } : { ...dir }
    const changed = JSON.stringify(merged) !== JSON.stringify(cur?.dir)
    this.byChat.set(chatId, { index, dir: merged })
    return changed
  }

  get(chatId: string | null): Direction | null {
    return chatId ? this.byChat.get(chatId)?.dir ?? null : null
  }
}
