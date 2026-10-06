/**
 * Lumi Flair backend.
 *
 *  - {{flair_tags}} macro: teaches the model the text-effect spans and the
 *    <flair effect="…"> screen-effect tag. The text follows the user's
 *    "How often" setting (every reply / most replies / sparingly).
 *  - Optional auto-injection (needs `interceptor`): adds the same note just
 *    before the latest message on every generation, so effects show up in
 *    nearly every reply without editing presets.
 *  - Command palette entries (Ctrl/Cmd+K) that forward to the frontend.
 *  - Declares the message-tag interceptor capability so <flair> tags never
 *    flash as raw text during a cold chat load.
 *  - Optional whole-UI mood tint via spindle.theme.applyPalette (needs
 *    `app_manipulation`; Lumiverse restores the theme when cleared/disabled).
 *  - AI sound effects note (<flair sfx="…">), when the user turns them on.
 */
import { SFX_CUES } from './sfx-cues'

declare const spindle: import('lumiverse-spindle-types').SpindleAPI

type Frequency = 'every' | 'often' | 'sparing'
interface Prefs {
  frequency: Frequency
  textEffects: boolean
  aiEffects: boolean
  sceneDirector: boolean
  choices: boolean
  /** AI sound effects (<flair sfx="…">). Off until the user turns them on. */
  sfx: boolean
  autoInject: boolean
  /** Effects the user switched off: never taught to the AI. */
  disabledFx: string[]
}
const DEFAULT_PREFS: Prefs = { frequency: 'every', textEffects: true, aiEffects: true, sceneDirector: true, choices: true, sfx: false, autoInject: true, disabledFx: [] }

/** Marker so we never inject twice (e.g. when the user also placed {{flair_tags}}). */
const MARKER = '[Lumi Flair'

const EFFECTS: Array<[string, string]> = [
  ['shake', 'shouting, fear, anger, trembling, impacts'],
  ['whisper', 'whispers, asides, secrets, quiet thoughts'],
  ['glow', 'magic, important names, revelations'],
  ['rainbow', 'joy, wonder, delight, excitement'],
  ['pulse', 'heartbeat, tension, longing, nervousness'],
  ['big', 'loud exclamations, sound effects'],
  ['typewriter', 'slow, deliberate words (short phrases only)'],
  ['fade', 'drifting thoughts, memories, dreams'],
  ['glitch', 'distortion, the uncanny, broken machines, corrupted magic'],
  ['flicker', 'failing lights, ghosts, unstable things'],
]
const KNOWN_FX = new Set(EFFECTS.map(([fx]) => fx))

function effectList(disabled: string[]): string {
  return EFFECTS.filter(([fx]) => !disabled.includes(fx))
    .map(([fx, use]) => `<span data-lf="${fx}">…</span> ${use}`)
    .join('\n')
}

const HOW_OFTEN: Record<Frequency, string> = {
  every:
    'Use them in EVERY reply — aim for 3 to 6 styled phrases per message, especially on spoken dialogue, sound effects and emotional beats. A reply without any styled phrase is incomplete.',
  often: 'Use them in most replies — usually 1 to 3 styled phrases where they fit the emotion.',
  sparing: 'Use them sparingly — at most 2 per reply, only where they add real emphasis.',
}

function buildInstructions(p: Prefs): string {
  const parts: string[] = []
  const list = effectList(p.disabledFx)
  if (p.textEffects && list) {
    parts.push(
      `${MARKER} — expressive text] Make the characters' voices feel alive by styling short phrases with these inline effect spans, picking whichever matches the emotion (use ONLY these — no other data-lf values):`,
      list,
      HOW_OFTEN[p.frequency],
      'Rules: wrap a short phrase or a single line of dialogue (keep the quotation marks outside the span), never whole paragraphs; never nest spans; copy the markup exactly; vary the effects instead of repeating one.',
    )
  }
  const intro = (topic: string) => (parts.length ? '' : `${MARKER} — ${topic}] `)
  if (p.sceneDirector) {
    parts.push(
      `${intro('scene direction')}Scene direction: whenever the location, weather, time of day or emotional atmosphere changes — and at the start of a new scene — end the reply with ONE invisible stage direction tag: <flair scene="rain" light="dusk" mood="tense"></flair>. scene: snow, rain, embers, fireflies, petals, stars or clear. light: dawn, day, dusk, night, candle, storm or neon. mood: one word for the emotional tone. Include only the attributes that changed. The reader never sees it; it re-dresses their screen to match the story.`,
    )
  }
  if (p.aiEffects) {
    parts.push(
      `${intro('screen effects')}At a genuinely big moment (a celebration, a revelation, a kiss, a victory, a shooting star) you may also add one screen effect: <flair effect="confetti"></flair> — effect is confetti, sparkle, ripple or comet (it can share the tag with a scene direction). At most once per reply; most replies have none.`,
    )
  }
  if (p.choices) {
    parts.push(
      `${intro('choices')}When the user's character faces a meaningful decision, end the reply with 2 or 3 short options written from the user's point of view, each in its own tag: <flair-choice>Follow her into the forest</flair-choice>. Keep each under 10 words and make them genuinely different. Skip it when there is no real decision. Never decide for the user.`,
    )
  }
  if (p.sfx) {
    const cues = SFX_CUES.map((c) => `${c.name} (${c.use})`).join(', ')
    parts.push(
      `${intro('sound effects')}Sound effects: when something in the scene makes a distinct sound the reader should hear, put a sound cue at the START of the paragraph where it happens: <flair sfx="door-knock"></flair>. Cues: ${cues}. Use only these names, always write the closing tag, and use at most 3 cues per reply; most replies need none. The reader never sees the tag; it plays the sound.`,
    )
  }
  return parts.join('\n')
}

const prefsByUser = new Map<string, Prefs>()
let macroPrefs: Prefs = DEFAULT_PREFS

spindle.registerMacro({
  name: 'flair_tags',
  category: 'extension:lumi_flair',
  description: 'Instructions that let the AI use Lumi Flair text effects and screen effects.',
  returnType: 'string',
  handler: '',
})
spindle.updateMacroValue('flair_tags', buildInstructions(macroPrefs))

try {
  spindle.frontendCapabilities.declare('message_tag_interceptor')
} catch (err) {
  spindle.log.warn(`Lumi Flair: could not declare tag interceptor capability: ${String(err)}`)
}

// ── Command palette ──
spindle.commands.register([
  { id: 'open', label: 'Flair: Open settings', description: 'Open the Lumi Flair tab', keywords: ['flair', 'effects', 'glow'], scope: 'global' },
  { id: 'toggle', label: 'Flair: Toggle effects', description: 'Turn all Lumi Flair effects on or off', keywords: ['flair', 'effects', 'animation'], scope: 'global' },
  { id: 'next-effect', label: 'Flair: Next send effect', description: 'Cycle sparkle → ripple → comet → confetti → creamy → splash → black hole → petal storm → none', keywords: ['send', 'effect', 'particles'], scope: 'global' },
  { id: 'preview', label: 'Flair: Preview send effect', description: 'Play the current send effect', keywords: ['preview', 'test'], scope: 'global' },
  { id: 'spotlight', label: 'Flair: Toggle spotlight mode', description: 'Dim other messages while you hover one', keywords: ['focus', 'dim', 'reading'], scope: 'chat' },
  { id: 'next-scene', label: 'Flair: Next ambient scene', description: 'Cycle snow, rain, embers, fireflies, petals, stars', keywords: ['weather', 'ambient', 'snow', 'rain'], scope: 'global' },
  { id: 'scene-off', label: 'Flair: Turn off scene for this chat', description: 'Stop the ambient scene in this chat', keywords: ['weather', 'ambient', 'off'], scope: 'chat' },
  { id: 'sound', label: 'Flair: Toggle sounds', description: 'Turn interface chimes on or off', keywords: ['sound', 'audio', 'chime'], scope: 'global' },
  { id: 'soundscape', label: 'Flair: Toggle soundscapes', description: 'Rain, fire, wind and night ambience that follow the scene', keywords: ['ambience', 'soundscape', 'rain', 'audio'], scope: 'global' },
  { id: 'next-pack', label: 'Flair: Next Flair Pack', description: 'Cycle Classic, Cozy Fantasy, Cyberpunk, Horror, Sakura, Deep Space, Noir', keywords: ['pack', 'theme', 'look', 'preset'], scope: 'global' },
  { id: 'moment', label: 'Flair: Moment Card of latest reply', description: 'Turn the latest message into a share-ready image', keywords: ['share', 'image', 'card', 'screenshot'], scope: 'chat' },
  { id: 'pin', label: 'Flair: Pin the latest message as a favourite moment', description: 'Add the latest message to your favourite moments, or take it off again', keywords: ['favourite', 'favorite', 'bookmark', 'star', 'save', 'pin'], scope: 'chat' },
  { id: 'theater', label: 'Flair: Toggle theater mode', description: 'Hide the interface and read the story full-screen, with larger type and a gentle auto-scroll', keywords: ['theater', 'theatre', 'reading', 'fullscreen', 'focus', 'zen', 'immersive'], scope: 'chat' },
  { id: 'intro', label: 'Flair: Play the character intro', description: 'Show the name card that plays when a chat opens', keywords: ['intro', 'entrance', 'name', 'card', 'character'], scope: 'chat' },
  { id: 'welcome', label: 'Flair: Show welcome', description: 'Pick a Flair Pack and optional extras', keywords: ['setup', 'onboarding', 'welcome'], scope: 'global' },
])

spindle.commands.onInvoked((commandId) => {
  // Command context carries no user id. User-scoped installs deliver to their
  // owner; operator-scoped installs broadcast, and each frontend applies it to
  // its own (per-user) Flair settings.
  spindle.sendToFrontend({ type: 'command', id: commandId })
})

// ── Frontend messages: prefs + mood tint ──
type TintMessage = { type: 'mood_tint'; accent: { h: number; s: number; l: number } | null }
type PrefsMessage = { type: 'prefs' } & Partial<Prefs>

// ── Config files: per-user, outside the extension folder ──
// data/users/<userId>/extensions/lumi_flair/<name>.json — survives reinstalls.
const VAULT_FILES = new Set(['settings', 'achievements', 'heartbeat', 'moments'])
const VERSION = '1.4.12'

async function vaultLoad(req: number, names: unknown, userId: string) {
  const files: Record<string, unknown> = {}
  const list = Array.isArray(names) ? names.filter((n): n is string => typeof n === 'string' && VAULT_FILES.has(n)) : []
  for (const name of list) {
    try {
      if (await spindle.userStorage.exists(`${name}.json`, userId)) {
        files[name] = await spindle.userStorage.getJson<unknown>(`${name}.json`, { fallback: null, userId })
      }
    } catch (err) {
      spindle.log.warn(`[Lumi Flair] could not read ${name}.json: ${String(err)}`)
    }
  }
  spindle.sendToFrontend({ type: 'vault_data', req, files }, userId)
}

// Serialize writes per user+file so a slow write never lands after a newer one.
const writeChains = new Map<string, Promise<void>>()
function vaultSave(name: unknown, data: unknown, userId: string) {
  if (typeof name !== 'string' || !VAULT_FILES.has(name)) return
  const env = data as { at?: unknown; data?: unknown } | null
  if (!env || typeof env !== 'object' || typeof env.at !== 'number' || env.data === undefined) return
  const key = `${userId}:${name}`
  const file = {
    lumiFlair: VERSION,
    savedAt: new Date(env.at).toISOString(),
    at: env.at,
    data: env.data,
  }
  const next = (writeChains.get(key) ?? Promise.resolve())
    .then(async () => {
      await spindle.userStorage.setJson(`${name}.json`, file, { indent: 2, userId })
      spindle.sendToFrontend({ type: 'vault_saved', name, at: env.at }, userId)
    })
    .catch((err) => {
      spindle.sendToFrontend({ type: 'vault_error', name, reason: String(err) }, userId)
    })
  writeChains.set(key, next)
  void next.finally(() => {
    if (writeChains.get(key) === next) writeChains.delete(key)
  })
}

// ── Lumiverse theme matching (Flair Pack / character aura) ──
// The frontend sends a few colours; Lumiverse's own engine expands them into a
// complete, readable light + dark theme. Layered on top of the user's theme and
// removed with clear() — the saved theme is never touched.
interface ThemeSpec {
  accent: string
  secondary?: string
  bgDark: string
  bgLight: string
  speech?: string
  thoughts?: string
  depth: 'accent' | 'full'
}
const HEX = /^#[0-9a-f]{6}$/i
/** Never override the user's own scale, fonts, corner radius or motion settings. */
const KEEP_USERS = /scale|font-family|font-mono|radius|transition/
const ACCENT_ONLY = /^--lumiverse-(primary|secondary|prose)/

function cleanSpec(raw: unknown): ThemeSpec | null {
  const r = raw as Partial<ThemeSpec> | null
  if (!r || typeof r !== 'object' || !HEX.test(String(r.accent)) || !HEX.test(String(r.bgDark)) || !HEX.test(String(r.bgLight))) return null
  const opt = (v: unknown) => (typeof v === 'string' && HEX.test(v) ? v : undefined)
  return {
    accent: r.accent!, bgDark: r.bgDark!, bgLight: r.bgLight!,
    secondary: opt(r.secondary), speech: opt(r.speech), thoughts: opt(r.thoughts),
    depth: r.depth === 'accent' ? 'accent' : 'full',
  }
}

function hexHsl(hex: string) {
  const n = parseInt(hex.slice(1), 16)
  const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  const l = (max + min) / 2
  let h = 0, s = 0
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4
    h *= 60
  }
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) }
}

async function buildTheme(spec: ThemeSpec, userId: string) {
  let cur: { enableGlass?: boolean; radiusScale?: number; fontScale?: number } = {}
  try {
    cur = await spindle.theme.getCurrent(userId)
  } catch {
    /* defaults */
  }
  const byMode: Record<'dark' | 'light', Record<string, string>> = { dark: {}, light: {} }
  for (const mode of ['dark', 'light'] as const) {
    const baseColors: Record<string, string> = { primary: spec.accent }
    if (spec.secondary) baseColors.secondary = spec.secondary
    if (spec.speech) baseColors.speech = spec.speech
    if (spec.thoughts) baseColors.thoughts = spec.thoughts
    if (spec.depth === 'full') baseColors.background = mode === 'dark' ? spec.bgDark : spec.bgLight
    const vars = await spindle.theme.generateVariables({
      accent: hexHsl(spec.accent),
      mode,
      enableGlass: cur.enableGlass ?? true,
      radiusScale: cur.radiusScale ?? 1,
      fontScale: cur.fontScale ?? 1,
      baseColors,
    })
    for (const [k, v] of Object.entries(vars)) {
      if (KEEP_USERS.test(k)) continue
      if (spec.depth === 'accent' && !ACCENT_ONLY.test(k)) continue
      byMode[mode][k] = v
    }
  }
  return byMode
}

// One theme job per user at a time; only the newest request matters.
const themeJobs = new Map<string, { running: boolean; next?: { spec: ThemeSpec | null } ; lastDepth?: string }>()
function queueTheme(userId: string, spec: ThemeSpec | null) {
  const job = themeJobs.get(userId) ?? { running: false }
  themeJobs.set(userId, job)
  job.next = { spec }
  if (job.running) return
  job.running = true
  void (async () => {
    while (job.next) {
      const { spec: want } = job.next
      job.next = undefined
      try {
        if (!spindle.permissions.has('app_manipulation')) throw new Error('app_manipulation not granted')
        if (!want) {
          await spindle.theme.clear(userId)
          job.lastDepth = undefined
        } else {
          const byMode = await buildTheme(want, userId)
          // Switching full → accent would leave stale background tokens behind; start clean.
          if (job.lastDepth && job.lastDepth !== want.depth) await spindle.theme.clear(userId)
          await spindle.theme.apply({ variablesByMode: byMode }, userId)
          job.lastDepth = want.depth
        }
        spindle.sendToFrontend({ type: 'theme_result', ok: true }, userId)
      } catch (err) {
        spindle.sendToFrontend({ type: 'theme_result', ok: false, reason: String(err) }, userId)
      }
    }
    job.running = false
  })()
}

// ── Pinned moments → Lumiverse memory (optional `memories` permission) ──
// Each pin becomes a short fact on the entity of whoever said it, which is how Lumiverse's own memory
// reaches the AI (the Memory Cortex's entity snapshot, when the user has it on). The API can only add
// facts, never remove them, and it skips a fact it already has, so sending a pin twice is harmless.
const MEMORY_BATCH = 60
const MEMORY_TEXT = 200
const clean = (v: unknown, max: number) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').slice(0, max).trim() : '')

async function pinsToMemory(raw: { req?: unknown; chatId?: unknown; items?: unknown }, userId: string) {
  const req = typeof raw.req === 'number' ? raw.req : 0
  const reply = (ok: boolean, saved: number, reason?: string) => spindle.sendToFrontend({ type: 'pin_memory_result', req, ok, saved, reason }, userId)
  const chatId = clean(raw.chatId, 200)
  if (!chatId) return reply(false, 0, 'no chat')
  if (!spindle.permissions.has('memories')) return reply(false, 0, 'memories not granted')
  const byName = new Map<string, string[]>()
  for (const item of (Array.isArray(raw.items) ? raw.items : []).slice(0, MEMORY_BATCH)) {
    const it = item as { who?: unknown; text?: unknown }
    const who = clean(it?.who, 80)
    const text = clean(it?.text, MEMORY_TEXT)
    if (!who || !text) continue
    const facts = byName.get(who) ?? []
    facts.push(`${who} said this, and the reader pinned it as a favourite moment: “${text}”`)
    byName.set(who, facts)
  }
  let saved = 0
  try {
    for (const [who, facts] of byName) {
      // Use the entity Lumiverse already has for them; make one only if there is none yet.
      let entity = await spindle.memories.entities.findByName(chatId, who, userId)
      if (!entity) entity = await spindle.memories.entities.upsert(chatId, { name: who, type: 'character', confidence: 1 }, { userId })
      await spindle.memories.entities.addFacts(entity.id, facts, userId)
      saved += facts.length
    }
    reply(true, saved)
  } catch (err) {
    spindle.log.warn(`[Lumi Flair] could not save pins to memory: ${String(err)}`)
    reply(false, saved, String((err as Error)?.message ?? err).slice(0, 200))
  }
}

spindle.onFrontendMessage(async (raw, userId) => {
  const tm = raw as { type?: string; spec?: unknown }
  if (tm?.type === 'ui_theme') return queueTheme(userId, tm.spec ? cleanSpec(tm.spec) : null)
  if (tm?.type === 'pin_memory') return void (await pinsToMemory(raw as { req?: unknown; chatId?: unknown; items?: unknown }, userId))
  const vm = raw as { type?: string; req?: number; names?: unknown; name?: unknown; data?: unknown }
  if (vm?.type === 'vault_load' && typeof vm.req === 'number') return void (await vaultLoad(vm.req, vm.names, userId))
  if (vm?.type === 'vault_save') return vaultSave(vm.name, vm.data, userId)
  const msg = raw as TintMessage | PrefsMessage
  if (msg?.type === 'prefs') {
    const prefs: Prefs = {
      frequency: msg.frequency === 'often' || msg.frequency === 'sparing' ? msg.frequency : 'every',
      textEffects: msg.textEffects !== false,
      aiEffects: msg.aiEffects !== false,
      sceneDirector: msg.sceneDirector !== false,
      choices: msg.choices !== false,
      sfx: msg.sfx === true,
      autoInject: msg.autoInject === true,
      disabledFx: Array.isArray(msg.disabledFx) ? msg.disabledFx.filter((fx): fx is string => typeof fx === 'string' && KNOWN_FX.has(fx)) : [],
    }
    prefsByUser.set(userId, prefs)
    // The macro value is shared; the most recent user's choice wins (single-user instances: always yours).
    macroPrefs = prefs
    spindle.updateMacroValue('flair_tags', buildInstructions(prefs))
    return
  }
  if (msg?.type !== 'mood_tint') return
  if (!spindle.permissions.has('app_manipulation')) {
    spindle.sendToFrontend({ type: 'tint_result', ok: false, reason: 'app_manipulation not granted' }, userId)
    return
  }
  try {
    if (msg.accent) {
      // Keep the tint readable: clamp saturation/lightness into a comfortable band.
      const accent = {
        h: Math.round(msg.accent.h),
        s: Math.min(85, Math.max(35, msg.accent.s)),
        l: Math.min(68, Math.max(48, msg.accent.l)),
      }
      await spindle.theme.applyPalette({ accent }, userId)
    } else {
      await spindle.theme.applyPalette(null, userId)
    }
    spindle.sendToFrontend({ type: 'tint_result', ok: true }, userId)
  } catch (err) {
    spindle.sendToFrontend({ type: 'tint_result', ok: false, reason: String(err) }, userId)
  }
})

// ── Auto-injection (optional `interceptor` permission) ──
function contentText(content: unknown): string {
  if (typeof content === 'string') return content
  if (Array.isArray(content)) return content.map((p) => (p && typeof p === 'object' && 'text' in p ? String((p as { text: unknown }).text) : '')).join(' ')
  return ''
}

let interceptorDisposer: (() => void) | null = null
function syncInterceptor() {
  const want = spindle.permissions.has('interceptor')
  if (want && !interceptorDisposer) {
    interceptorDisposer = spindle.registerInterceptor(async (messages, context) => {
      const prefs = prefsByUser.get(context.userId) ?? (prefsByUser.size === 0 ? DEFAULT_PREFS : null)
      if (!prefs?.autoInject || (!prefs.textEffects && !prefs.aiEffects && !prefs.sceneDirector && !prefs.choices && !prefs.sfx)) return messages
      if (context.generationType === 'impersonate' || context.generationType === 'quiet') return messages
      if (messages.some((m) => contentText(m.content).includes(MARKER))) return messages
      const text = buildInstructions(prefs)
      if (!text) return messages
      const note = { role: 'system' as const, content: text }
      // Depth 1: right before the latest message, where models pay the most attention.
      const at = Math.max(0, messages.length - 1)
      const out = [...messages.slice(0, at), note, ...messages.slice(at)]
      return { messages: out, breakdown: [{ messageIndex: at, name: 'Lumi Flair storytelling' }] }
    }, 150)
    spindle.log.info('Lumi Flair: prompt injection enabled')
  } else if (!want && interceptorDisposer) {
    interceptorDisposer()
    interceptorDisposer = null
  }
}
syncInterceptor()

spindle.permissions.onChanged(({ permission, granted }) => {
  if (permission === 'interceptor') syncInterceptor()
  if (permission === 'app_manipulation' && !granted) {
    spindle.log.info('Lumi Flair: mood UI tint disabled (permission revoked)')
  }
})

spindle.log.info('Lumi Flair backend ready')
