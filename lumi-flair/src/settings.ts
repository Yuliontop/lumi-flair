import type { Vault, VaultName } from './persist'

export type SendEffect = 'sparkle' | 'ripple' | 'comet' | 'confetti' | 'none'
export type BurstEffect = Exclude<SendEffect, 'none'>
export type UserEntrance = 'pop' | 'rise' | 'none'
export type CharacterEntrance = 'bloom' | 'none'
export type HoverStyle = 'glow' | 'trace' | 'neon' | 'none'
export type HoverTarget = 'all' | 'character' | 'user'
export type ColorSource = 'theme' | 'custom' | 'character'
/** Restyle Lumiverse itself: off, follow the Flair Pack, or follow the speaking character's aura. */
export type UiTheme = 'off' | 'pack' | 'character'
export type UiThemeDepth = 'accent' | 'full'

/** A user pack (imported .flair.json or "Save my look"). Validated again by packs.ts before use. */
export interface StoredPack {
  id: string
  name: string
  tagline: string
  swatch: [string, string]
  settings: Record<string, unknown>
  theme?: unknown
  source: 'imported' | 'saved'
  at: number
}
export const MAX_CUSTOM_PACKS = 24
export type UserColor = 'match' | 'warm' | 'custom'
export type Scene = 'off' | 'snow' | 'rain' | 'embers' | 'fireflies' | 'petals' | 'stars'
export type ChatScene = Scene | 'auto'
export type SwipeTransition = 'slide' | 'fade' | 'none'
export type TextFxFrequency = 'every' | 'often' | 'sparing'
export type Light = 'none' | 'dawn' | 'day' | 'dusk' | 'night' | 'candle' | 'storm' | 'neon'

export const SEND_EFFECTS: readonly SendEffect[] = ['sparkle', 'ripple', 'comet', 'confetti', 'none']
export const BURST_EFFECTS: readonly BurstEffect[] = ['sparkle', 'ripple', 'comet', 'confetti']
export const SCENES: readonly Scene[] = ['off', 'snow', 'rain', 'embers', 'fireflies', 'petals', 'stars']
export const LIGHTS: readonly Light[] = ['none', 'dawn', 'day', 'dusk', 'night', 'candle', 'storm', 'neon']

export interface FlairSettings {
  enabled: boolean
  respectReducedMotion: boolean

  // Send / entrances
  sendEffect: SendEffect
  sendIntensity: number // 0.25 – 2
  userEntrance: UserEntrance
  characterEntrance: CharacterEntrance

  // Hover / streaming
  hoverStyle: HoverStyle
  hoverTarget: HoverTarget
  hoverStrength: number // 0.25 – 2
  traceSpeed: number // seconds per loop, 1 – 8
  streamingAura: boolean

  // Colour
  colorSource: ColorSource
  customColor: string
  userColor: UserColor
  userCustomColor: string
  timeOfDay: boolean

  // 1. Mood
  moodGlow: boolean
  moodTintUI: boolean
  moodMap: string

  // 2. Text effects
  textEffects: boolean
  textFxFrequency: TextFxFrequency
  /** Text effects the user switched off (shown as plain text, not taught to the AI). */
  textFxOff: TextFx[]
  autoInject: boolean
  aiEffects: boolean

  // 3. Ambient scenes
  ambientScene: Scene
  ambientAuto: boolean
  ambientDensity: number // 0.25 – 2
  ambientOpacity: number // 0.1 – 1
  chatScenes: Record<string, ChatScene>

  // 4. Swipe
  swipeTransition: SwipeTransition

  // 5. Composer
  composerGlow: boolean

  // 6. Per-character profiles (partial overrides of LOOK_KEYS)
  characterProfiles: Record<string, Partial<FlairSettings>>

  // 7. Celebrations
  milestones: boolean
  triggers: string
  celebrated: Record<string, number>

  // 8. Sound
  sound: boolean
  soundVolume: number // 0 – 1

  // 10. Spotlight
  spotlight: boolean

  // v0.3 — Scene Director
  sceneDirector: boolean
  lightDefault: Light

  // v0.3 — Soundscapes
  soundscape: boolean
  soundscapeVolume: number // 0 – 1

  // v0.3 — Cinematic layer
  cinematic: boolean
  vignette: number // 0 – 1
  grain: boolean
  lightning: boolean
  cameraShake: boolean
  noFlash: boolean

  // v0.3 — Character auras
  auras: boolean

  // v0.3 — Engagement
  choiceChips: boolean
  choiceSend: boolean
  achievements: boolean

  // v0.3 — Packs / onboarding / performance
  activePack: string
  welcomed: boolean
  uiTheme: UiTheme
  customPacks: StoredPack[]
  uiThemeDepth: UiThemeDepth
  perfGovernor: boolean
  tapGlow: boolean
}

/** Keys a per-character profile is allowed to override — the "look", not behaviour. */
/** Every inline text effect, in the order the panel shows them. */
export const TEXT_FX = ['shake', 'glow', 'whisper', 'rainbow', 'pulse', 'big', 'typewriter', 'fade', 'glitch', 'flicker'] as const
export type TextFx = (typeof TEXT_FX)[number]

export const LOOK_KEYS = [
  'sendEffect',
  'sendIntensity',
  'userEntrance',
  'characterEntrance',
  'hoverStyle',
  'hoverTarget',
  'hoverStrength',
  'traceSpeed',
  'streamingAura',
  'colorSource',
  'customColor',
  'userColor',
  'userCustomColor',
  'ambientScene',
  'swipeTransition',
  'lightDefault',
  'textFxOff',
] as const satisfies readonly (keyof FlairSettings)[]

export type LookKey = (typeof LOOK_KEYS)[number]

export const DEFAULT_MOOD_MAP = [
  'happy, joy, excited, laughing, smile, playful, cheerful, triumphant = #ffc94d',
  'sad, crying, lonely, melancholy, wistful, grief = #5b8cff',
  'angry, annoyed, furious, hostile = #ff4d4d',
  'scared, worried, fear, nervous, tense, ominous, eerie, dread = #9b6bff',
  'surprised, shocked, awe = #4dd8ff',
  'embarrassed, blushing, flirty, love, romantic, tender = #ff7eb6',
  'thinking, confused, serious, mysterious, curious = #8fa3b8',
  'smirk, smug, mischievous = #c58bff',
  'calm, peaceful, serene, cozy = #7fd6a8',
].join('\n')

export const DEFAULT_TRIGGERS = [
  'happy birthday => confetti',
  'congratulations => confetti',
  'level up => sparkle',
  'shooting star => comet',
].join('\n')

export const DEFAULT_SETTINGS: FlairSettings = {
  enabled: true,
  respectReducedMotion: true,
  sendEffect: 'sparkle',
  sendIntensity: 1,
  userEntrance: 'pop',
  characterEntrance: 'bloom',
  hoverStyle: 'trace',
  hoverTarget: 'all',
  hoverStrength: 1,
  traceSpeed: 3,
  streamingAura: true,
  colorSource: 'theme',
  customColor: '#a78bfa',
  userColor: 'match',
  userCustomColor: '#f59e0b',
  timeOfDay: false,
  moodGlow: true,
  moodTintUI: false,
  moodMap: DEFAULT_MOOD_MAP,
  textEffects: true,
  textFxFrequency: 'every',
  textFxOff: [],
  autoInject: true,
  aiEffects: true,
  ambientScene: 'off',
  ambientAuto: true,
  ambientDensity: 1,
  ambientOpacity: 0.6,
  chatScenes: {},
  swipeTransition: 'slide',
  composerGlow: true,
  characterProfiles: {},
  milestones: true,
  triggers: DEFAULT_TRIGGERS,
  celebrated: {},
  sound: false,
  soundVolume: 0.4,
  spotlight: false,
  sceneDirector: true,
  lightDefault: 'none',
  soundscape: false,
  soundscapeVolume: 0.35,
  cinematic: true,
  vignette: 0.35,
  grain: false,
  lightning: true,
  cameraShake: true,
  noFlash: false,
  auras: true,
  choiceChips: true,
  choiceSend: false,
  achievements: true,
  activePack: '',
  welcomed: false,
  uiTheme: 'off',
  customPacks: [],
  uiThemeDepth: 'full',
  perfGovernor: true,
  tapGlow: true,
}

const MAX_MAP_ENTRIES = 300

function clamp(n: unknown, min: number, max: number, fallback: number): number {
  const v = typeof n === 'number' && Number.isFinite(n) ? n : fallback
  return Math.min(max, Math.max(min, v))
}

function pick<T extends string>(v: unknown, allowed: readonly T[], fallback: T): T {
  return typeof v === 'string' && (allowed as readonly string[]).includes(v) ? (v as T) : fallback
}

function bool(v: unknown, fallback: boolean): boolean {
  return typeof v === 'boolean' ? v : fallback
}

function hex(v: unknown, fallback: string): string {
  return typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v) ? v : fallback
}

function text(v: unknown, fallback: string, max = 4000): string {
  return typeof v === 'string' ? v.slice(0, max) : fallback
}

function record<T>(v: unknown, each: (x: unknown) => T | undefined): Record<string, T> {
  const out: Record<string, T> = {}
  if (!v || typeof v !== 'object') return out
  const entries = Object.entries(v as Record<string, unknown>).slice(-MAX_MAP_ENTRIES)
  for (const [k, raw] of entries) {
    const val = each(raw)
    if (val !== undefined) out[k] = val
  }
  return out
}

const HEX6 = /^#[0-9a-f]{6}$/i
function normalizeStoredPacks(v: unknown): StoredPack[] {
  if (!Array.isArray(v)) return []
  const out: StoredPack[] = []
  const seen = new Set<string>()
  for (const raw of v.slice(-MAX_CUSTOM_PACKS)) {
    if (!raw || typeof raw !== 'object') continue
    const r = raw as Record<string, unknown>
    const id = typeof r.id === 'string' && /^custom-[a-z0-9-]{1,40}$/.test(r.id) ? r.id : null
    if (!id || seen.has(id) || !r.settings || typeof r.settings !== 'object') continue
    seen.add(id)
    const sw = Array.isArray(r.swatch) ? r.swatch : []
    out.push({
      id,
      name: typeof r.name === 'string' && r.name.trim() ? r.name.trim().slice(0, 60) : 'Custom pack',
      tagline: typeof r.tagline === 'string' ? r.tagline.slice(0, 120) : '',
      swatch: [HEX6.test(String(sw[0])) ? String(sw[0]) : '#9370db', HEX6.test(String(sw[1])) ? String(sw[1]) : '#c7b4ff'],
      settings: r.settings as Record<string, unknown>,
      theme: r.theme,
      source: r.source === 'saved' ? 'saved' : 'imported',
      at: typeof r.at === 'number' ? r.at : 0,
    })
  }
  return out
}

/** Merge a stored blob over the defaults, dropping anything malformed. */
export function normalize(raw: unknown): FlairSettings {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const d = DEFAULT_SETTINGS
  return {
    enabled: bool(r.enabled, d.enabled),
    respectReducedMotion: bool(r.respectReducedMotion, d.respectReducedMotion),
    sendEffect: pick(r.sendEffect, SEND_EFFECTS, d.sendEffect),
    sendIntensity: clamp(r.sendIntensity, 0.25, 2, d.sendIntensity),
    userEntrance: pick(r.userEntrance, ['pop', 'rise', 'none'], d.userEntrance),
    characterEntrance: pick(r.characterEntrance, ['bloom', 'none'], d.characterEntrance),
    hoverStyle: pick(r.hoverStyle, ['glow', 'trace', 'neon', 'none'], d.hoverStyle),
    hoverTarget: pick(r.hoverTarget, ['all', 'character', 'user'], d.hoverTarget),
    hoverStrength: clamp(r.hoverStrength, 0.25, 2, d.hoverStrength),
    traceSpeed: clamp(r.traceSpeed, 1, 8, d.traceSpeed),
    streamingAura: bool(r.streamingAura, d.streamingAura),
    colorSource: pick(r.colorSource, ['theme', 'custom', 'character'], d.colorSource),
    customColor: hex(r.customColor, d.customColor),
    userColor: pick(r.userColor, ['match', 'warm', 'custom'], d.userColor),
    userCustomColor: hex(r.userCustomColor, d.userCustomColor),
    timeOfDay: bool(r.timeOfDay, d.timeOfDay),
    moodGlow: bool(r.moodGlow, d.moodGlow),
    moodTintUI: bool(r.moodTintUI, d.moodTintUI),
    moodMap: text(r.moodMap, d.moodMap),
    textEffects: bool(r.textEffects, d.textEffects),
    textFxFrequency: pick(r.textFxFrequency, ['every', 'often', 'sparing'], d.textFxFrequency),
    textFxOff: Array.isArray(r.textFxOff) ? TEXT_FX.filter((fx) => (r.textFxOff as unknown[]).includes(fx)) : [...d.textFxOff],
    autoInject: bool(r.autoInject, d.autoInject),
    aiEffects: bool(r.aiEffects, d.aiEffects),
    ambientScene: pick(r.ambientScene, SCENES, d.ambientScene),
    ambientAuto: bool(r.ambientAuto, d.ambientAuto),
    ambientDensity: clamp(r.ambientDensity, 0.25, 2, d.ambientDensity),
    ambientOpacity: clamp(r.ambientOpacity, 0.1, 1, d.ambientOpacity),
    chatScenes: record(r.chatScenes, (x) =>
      typeof x === 'string' && (x === 'auto' || (SCENES as readonly string[]).includes(x)) ? (x as ChatScene) : undefined,
    ),
    swipeTransition: pick(r.swipeTransition, ['slide', 'fade', 'none'], d.swipeTransition),
    composerGlow: bool(r.composerGlow, d.composerGlow),
    characterProfiles: record(r.characterProfiles, normalizeProfile),
    milestones: bool(r.milestones, d.milestones),
    triggers: text(r.triggers, d.triggers),
    celebrated: record(r.celebrated, (x) => (typeof x === 'number' && Number.isFinite(x) ? x : undefined)),
    sound: bool(r.sound, d.sound),
    soundVolume: clamp(r.soundVolume, 0, 1, d.soundVolume),
    spotlight: bool(r.spotlight, d.spotlight),
    sceneDirector: bool(r.sceneDirector, d.sceneDirector),
    lightDefault: pick(r.lightDefault, LIGHTS, d.lightDefault),
    soundscape: bool(r.soundscape, d.soundscape),
    soundscapeVolume: clamp(r.soundscapeVolume, 0, 1, d.soundscapeVolume),
    cinematic: bool(r.cinematic, d.cinematic),
    vignette: clamp(r.vignette, 0, 1, d.vignette),
    grain: bool(r.grain, d.grain),
    lightning: bool(r.lightning, d.lightning),
    cameraShake: bool(r.cameraShake, d.cameraShake),
    noFlash: bool(r.noFlash, d.noFlash),
    auras: bool(r.auras, d.auras),
    choiceChips: bool(r.choiceChips, d.choiceChips),
    choiceSend: bool(r.choiceSend, d.choiceSend),
    achievements: bool(r.achievements, d.achievements),
    activePack: text(r.activePack, d.activePack, 80),
    welcomed: bool(r.welcomed, d.welcomed),
    uiTheme: pick(r.uiTheme, ['off', 'pack', 'character'], d.uiTheme),
    customPacks: normalizeStoredPacks(r.customPacks),
    uiThemeDepth: pick(r.uiThemeDepth, ['accent', 'full'], d.uiThemeDepth),
    perfGovernor: bool(r.perfGovernor, d.perfGovernor),
    tapGlow: bool(r.tapGlow, d.tapGlow),
  }
}

/** Keep only valid LOOK_KEYS from a stored profile. */
function normalizeProfile(raw: unknown): Partial<FlairSettings> | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const src = raw as Record<string, unknown>
  const full = normalize(src)
  const out: Partial<FlairSettings> = {}
  for (const k of LOOK_KEYS) {
    if (k in src) (out as Record<string, unknown>)[k] = full[k]
  }
  return out
}

/**
 * Settings are auto-saved through the Vault (see persist.ts): account
 * settings + a real config file + this browser, newest copy wins on load.
 *
 * Per-character profiles: when the active character has a profile, edits to
 * "look" keys are written into that profile instead of the global settings,
 * and `get()` returns the merged (effective) settings.
 */
export function createSettingsStore(vault: Vault) {
  let base: FlairSettings = { ...DEFAULT_SETTINGS }
  let activeCharacterId: string | null = null
  let saveTimer: ReturnType<typeof setTimeout> | undefined
  const listeners = new Set<(s: FlairSettings) => void>()

  function effective(): FlairSettings {
    const profile = activeCharacterId ? base.characterProfiles[activeCharacterId] : undefined
    return profile ? { ...base, ...profile } : base
  }

  function persist() {
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(() => {
      saveTimer = undefined
      vault.save('settings', base)
    }, 250)
  }

  function emit() {
    const s = effective()
    for (const fn of listeners) {
      try {
        fn(s)
      } catch (err) {
        console.error('[Lumi Flair] settings listener failed', err)
      }
    }
  }

  function update(patch: Partial<FlairSettings>) {
    const profileId = activeCharacterId && base.characterProfiles[activeCharacterId] ? activeCharacterId : null
    const toBase: Record<string, unknown> = {}
    const toProfile: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(patch)) {
      if (profileId && (LOOK_KEYS as readonly string[]).includes(k)) toProfile[k] = v
      else toBase[k] = v
    }
    let next = normalize({ ...base, ...toBase })
    if (profileId && Object.keys(toProfile).length) {
      const merged = normalize({ ...next, ...next.characterProfiles[profileId], ...toProfile })
      const profile: Partial<FlairSettings> = {}
      for (const k of LOOK_KEYS) (profile as Record<string, unknown>)[k] = merged[k]
      next = { ...next, characterProfiles: { ...next.characterProfiles, [profileId]: profile } }
    }
    base = next
    persist()
    emit()
  }

  return {
    /** Seed from the vault at boot (no save). */
    hydrate(raw: unknown) {
      base = normalize(raw)
      return effective()
    },
    /** Replace everything (restore from backup, or a newer config file arrived). */
    adopt(raw: unknown, save = false) {
      base = normalize(raw)
      if (save) persist()
      emit()
    },
    get: effective,
    getBase: () => base,
    update,
    reset() {
      // Keep bookkeeping (celebrated milestones) but reset everything the user sees.
      base = { ...DEFAULT_SETTINGS, celebrated: base.celebrated, welcomed: base.welcomed }
      persist()
      emit()
    },
    setActiveCharacter(id: string | null) {
      if (id === activeCharacterId) return
      activeCharacterId = id
      emit()
    },
    activeCharacter: () => activeCharacterId,
    hasProfile: (id: string | null) => !!(id && base.characterProfiles[id]),
    createProfile(id: string) {
      const current = effective()
      const profile: Partial<FlairSettings> = {}
      for (const k of LOOK_KEYS) (profile as Record<string, unknown>)[k] = current[k]
      base = { ...base, characterProfiles: { ...base.characterProfiles, [id]: profile } }
      persist()
      emit()
    },
    deleteProfile(id: string) {
      const { [id]: _drop, ...rest } = base.characterProfiles
      base = { ...base, characterProfiles: rest }
      persist()
      emit()
    },
    /** Bookkeeping writes that should not re-render the panel. */
    patchSilently(patch: Partial<FlairSettings>) {
      base = normalize({ ...base, ...patch })
      persist()
    },
    subscribe(fn: (s: FlairSettings) => void) {
      listeners.add(fn)
      return () => listeners.delete(fn)
    },
    flush() {
      if (saveTimer) {
        clearTimeout(saveTimer)
        saveTimer = undefined
        vault.save('settings', base)
      }
    },
  }
}

export type SettingsStore = ReturnType<typeof createSettingsStore>

/**
 * Small auto-saved JSON blob (achievements, heartbeat), kept out of the main
 * config so it stays small and readable.
 */
export function createJsonStore<T>(vault: Vault, name: VaultName, fallback: T) {
  let value: T = fallback
  let timer: ReturnType<typeof setTimeout> | undefined
  return {
    hydrate(raw: unknown) {
      if (raw !== undefined && raw !== null) value = raw as T
      return value
    },
    get: () => value,
    set(next: T) {
      value = next
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        timer = undefined
        vault.save(name, value)
      }, 500)
    },
    flush() {
      if (timer) {
        clearTimeout(timer)
        timer = undefined
        vault.save(name, value)
      }
    },
  }
}
