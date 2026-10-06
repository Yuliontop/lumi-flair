import type { SpindleFrontendContext, SpindleInputBarActionHandle } from 'lumiverse-spindle-types'
import {
  BURST_EFFECTS,
  MAX_CUSTOM_PACKS,
  SCENES,
  SEND_EFFECTS,
  UI_SOUNDS,
  createJsonStore,
  createSettingsStore,
  type BurstEffect,
  type FlairSettings,
  type Light,
  type Scene,
} from './settings'
import { buildCss, colorVarsCss, composerActiveCss, entranceRule, tapGlowRule, type CardAnimation } from './styles'
import { FxCanvas, HOLE_TIMING, parseComputedColor, playBanner, playSendEffect, playTrail, viewportCenter, type Point, type RGB } from './effects'
import { AmbientCanvas, sceneFromEntries } from './ambient'
import { SoundBoard, type Chime } from './sound'
import { SfxBoard } from './sfx'
import { cueName } from './sfx-cues'
import { hexToHsl, moodColorFor, moodPitch, parseMoodMap, timeOfDayTint } from './palette'
import { matchTrigger, milestoneAtOrBelow, parseTriggers } from './celebrate'
import { exportThemePack } from './themepack'
import { DirectorState, parseDirection } from './director'
import { Soundscape, type CustomBed } from './soundscape'
import { SOUND_ACCEPT, SoundLibrary, type AudioSource } from './soundlib'
import { SoundWidget, SOUND_WIDGET_CSS } from './soundwidget'
import { Cinematic, CINEMATIC_CSS, blackHoleWarpRule, cameraShakeRule } from './cinematic'
import { AuraManager } from './aura'
import { INTRO_CSS, IntroCard, SpeakerChip, hashColor } from './intro'
import { THEATER_CSS, THEATER_ICON, Theater } from './theater'
import { TYPEWRITER_CSS, Typewriter } from './typewriter'
import { ChoiceManager, CHOICES_CSS } from './choices'
import { addPoint, HEARTBEAT_CSS, valenceForLabel, valenceForText, type BeatPoint, type HeartbeatData } from './heartbeat'
import {
  ACHIEVEMENT_CSS,
  ACHIEVEMENTS,
  normalizeAchievements,
  onMood,
  onScene,
  onSent,
  type AchievementData,
} from './achievements'
import { MOMENT_CSS, plainText, showMomentCard } from './momentcard'
import { excerpt, isPinned, normalizePins, PIN_CSS, PIN_MEMORY_MAX, removePins, setPin, STAR_SVG, type Pin, type PinData } from './moments'
import { allPacks, bindCustomPacks, exportPack, importPack, packById, packFromLook, type PackFile, type PackTheme } from './packs'
import { PerfGovernor } from './perf'
import { showWelcome, WELCOME_CSS } from './welcome'
import { setLocale, tr } from './i18n'
import { LIGHT_LABEL, mountPanel, PANEL_CSS, SCENE_LABEL, type PanelStatus, type SoundActions } from './panel'
import { NAVIGATE_CSS, StoryNavigator } from './navigate'
import { resolveUiTheme, themeFromColor, themeKey } from './uitheme'
import { Vault, downloadBackup, pickBackup, type VaultName } from './persist'

// ── Event payload shapes (only the fields we read) ──
interface MessageSentPayload {
  chatId?: string
  message?: { id?: string; is_user?: boolean; content?: string }
}
interface GenerationStartedPayload {
  generationId?: string
  chatId?: string
  generationType?: string
  /** The message a continue / swipe / regenerate writes into. */
  targetMessageId?: string
  /** Group chats: who is about to speak. */
  characterId?: string
  characterName?: string
}
interface GroupTurnPayload {
  chatId?: string
  characterId?: string
  characterName?: string
  generationId?: string
  turnIndex?: number
  totalExpected?: number
}
interface StreamTokenPayload {
  generationId?: string
}
interface GenerationEndedPayload {
  generationId?: string
  chatId?: string
  messageId?: string
  content?: string
  error?: string
  generationType?: string
}
interface ExpressionPayload {
  chatId?: string
  characterId?: string
  label?: string
}
interface WorldInfoPayload {
  chatId?: string
  entries?: Array<{ comment?: string; keys?: string[] }>
}
interface SwipePayload {
  chatId?: string
  message?: { id?: string; swipe_id?: number; content?: string }
  action?: string
  swipeId?: number
  previousSwipeId?: number
}
type BackendMessage =
  | { type: 'command'; id: string }
  | { type: 'tint_result'; ok: boolean; reason?: string }
  | { type: 'pin_memory_result'; req: number; ok: boolean; saved: number; reason?: string }

/** The host implements this on ctx.ui at runtime; it is not in the published types yet. */
type DomDecoratorApi = {
  registerDomDecorator?: (o: {
    mount: string
    render: (root: HTMLElement, rctx: { scope: string }) => void | (() => void)
  }) => () => void
}

const AI_FX_WINDOW_MS = 30_000
/** AI sound cues: at most this many per message, and never closer together than the gap. */
const SFX_MAX_PER_MESSAGE = 4
const SFX_GAP_MS = 700
const CARD = ':is([data-component="BubbleMessage"],[data-component="MinimalMessage"])[data-message-id]'

export function setup(ctx: SpindleFrontendContext) {
  // Settings load asynchronously; hold back queued startup messages until ready.
  ctx.deferReady()

  try {
    setLocale(ctx.locale?.get())
  } catch {
    /* older host */
  }

  const vault = new Vault(ctx)
  const store = createSettingsStore(vault)
  bindCustomPacks(() => store.getBase().customPacks)
  const beats = createJsonStore<HeartbeatData>(vault, 'heartbeat', {})
  const badges = createJsonStore<AchievementData>(vault, 'achievements', normalizeAchievements(null))
  const pins = createJsonStore<PinData>(vault, 'moments', {})
  const disposers: Array<() => void> = []
  let disposed = false
  const on = (event: string, fn: (payload: unknown) => void) => disposers.push(ctx.events.on(event, fn))

  // ── Runtime state ──
  const state = {
    chatId: null as string | null,
    characterId: null as string | null,
    characterName: null as string | null,
    mood: new Map<string, { label: string; color: string | null; at: number }>(),
    autoScene: new Map<string, Scene>(),
    tintPermission: false,
    injectPermission: false,
    panelsPermission: false,
    memoriesPermission: false,
    memoryNote: null as string | null,
    room: 14,
    saver: false,
    lastPrefsKey: '',
    lastTintKey: '',
    lastThemeKey: '',
    themeLabel: null as string | null,
    charAura: null as string | null,
    lastScene: 'off' as Scene,
    generating: null as null | { id: string; tokens: number; windowStart: number; timer: ReturnType<typeof setInterval> },
    recentGenerated: new Map<string, number>(),
    pendingAiFx: new Map<string, { effect: BurstEffect; at: number }>(),
    firedAiFx: new Set<string>(),
    shaken: new Set<string>(),
    // AI sound cues. `epoch` counts generations: a streaming delivery for a message last seen in an
    // earlier epoch is a regenerate or swipe, so its record starts over. Old messages never replay.
    sfxEpoch: 0,
    sfxFired: new Map<string, { epoch: number; keys: Set<string> }>(),
    pendingSfx: new Map<string, { items: Array<{ cue: string; key: string }>; at: number }>(),
    sfxNextAt: 0,
  }
  const director = new DirectorState()
  const statusListeners = new Set<(s: PanelStatus) => void>()
  const pinListeners = new Set<() => void>() // the star buttons under the messages

  // ── Styles ──
  disposers.push(
    ctx.dom.addStyle(
      [PANEL_CSS, CINEMATIC_CSS, CHOICES_CSS, HEARTBEAT_CSS, ACHIEVEMENT_CSS, MOMENT_CSS, PIN_CSS, INTRO_CSS, THEATER_CSS, TYPEWRITER_CSS, WELCOME_CSS, NAVIGATE_CSS, SOUND_WIDGET_CSS].join('\n'),
    ),
  )
  let removeMainCss: (() => void) | null = null
  disposers.push(() => removeMainCss?.())

  // ── Overlay (bursts, banners, unlock toasts) — pointer-events: none ──
  const overlayWrap = ctx.dom.inject('body', '<div class="lf-overlay" aria-hidden="true"></div>')
  const overlay = overlayWrap.querySelector('.lf-overlay') as HTMLElement
  const storyNav = new StoryNavigator(ctx, () => document.body, (id) => {
    // Arrival: let the scroll settle, then bloom the message.
    setTimeout(() => animateMessage(id, 'bloom', true), 380)
  })
  disposers.push(() => storyNav.destroy())
  const ambientEl = ctx.dom.createElement('canvas', { class: 'lf-ambient' })
  const fxEl = ctx.dom.createElement('canvas', { class: 'lf-fx' })
  overlay.append(fxEl)
  const probe = ctx.dom.createElement('span')
  probe.style.cssText =
    'position:absolute;width:0;height:0;overflow:hidden;color:var(--lf-c-user, var(--lf-c, var(--lumiverse-primary, #9370db)))'
  const probeChar = ctx.dom.createElement('span')
  probeChar.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;color:var(--lf-c, var(--lumiverse-primary, #9370db))'
  overlay.append(probe, probeChar)
  // Small dynamic stylesheets we rewrite often.
  const colorStyle = ctx.dom.createElement('style')
  const composerStyle = ctx.dom.createElement('style')
  const auraStyle = ctx.dom.createElement('style')
  const theaterStyle = ctx.dom.createElement('style')
  overlayWrap.append(colorStyle, composerStyle, auraStyle, theaterStyle)
  const theaterWrap = ctx.dom.inject('body', '<div class="lf-th-root"></div>')
  const introCard = new IntroCard(overlay)
  const speaker = new SpeakerChip(overlay)

  const fx = new FxCanvas(fxEl)
  const ambient = new AmbientCanvas(ambientEl)
  const sound = new SoundBoard()
  const sfx = new SfxBoard(() => sound.context())
  const scape = new Soundscape()
  scape.onState = () => notifyStatus()
  // The user's own sound files (kept in this browser).
  const lib = new SoundLibrary()
  scape.loader = (id, ac) => lib.source(id, ac)
  lib.onChange(() => {
    if (disposed) return
    applySoundscape()
    warmUiSounds()
    notifyStatus()
  })
  /** A slot's file, if it exists in this browser. */
  const customFor = (slot: string) => {
    const id = store.get().customSounds[slot]
    return lib.has(id) ? id : undefined
  }
  /** Decode replaced interface sounds ahead of time so the first one plays instantly. */
  let warmKey = ''
  function warmUiSounds() {
    const s = store.get()
    if (!s.sound) return
    const ids = UI_SOUNDS.map((u) => customFor(`ui:${u}`)).filter((x): x is string => !!x)
    const key = ids.join(',')
    if (key === warmKey) return
    warmKey = key
    const ac = sound.context()
    if (ac) for (const id of ids) void lib.source(id, ac).catch(() => {})
  }
  const chatOnScreen = () => !!document.querySelector('[data-component="ChatView"]')
  // Floating volume widget (needs ui_panels; shown only when the user turns it on).
  const soundWidget = new SoundWidget(ctx, {
    settings: () => store.get(),
    update: (patch) => store.update(patch),
    preview: (v) => scape.setVolume(v),
    view: () => ({
      state: scape.state,
      key: scape.playing,
      backgrounded: scape.backgrounded,
      offChat: !chatOnScreen(),
      custom: scape.alwaysPlaying ? lib.meta(scape.customPlaying[0] ?? '')?.name ?? null : null,
    }),
    sceneLabel: (sc) => tr(SCENE_LABEL[sc] ?? sc),
    lightLabel: (li) => tr(LIGHT_LABEL[li] ?? li),
  })
  scape.onBackground = () => soundWidget.render()
  statusListeners.add(() => soundWidget.render())
  const cine = new Cinematic((t) => ctx.dom.createElement(t))
  cine.onThunder = () => scape.thunder(500 + Math.random() * 900)
  const auras = new AuraManager(auraStyle)
  auras.onChange = () => refreshCharAura()

  /** Aura colour of whoever spoke last — drives the "character" glow colour and Lumiverse theme. */
  function refreshCharAura() {
    const latest = auras.enabled ? auras.latest() : null
    const color = latest?.aura.color ?? null
    if (color === state.charAura) return
    state.charAura = color
    applyColor()
    notifyStatus()
  }
  const choices = new ChoiceManager(ctx)
  disposers.push(() => {
    fx.destroy()
    ambient.destroy()
    sound.destroy()
    soundWidget.destroy()
    scape.destroy()
    lib.destroy()
    cine.destroy()
    choices.clear()
    introCard.destroy()
    speaker.destroy()
    theater.destroy()
    typewriter.stop()
    ctx.dom.uninject(theaterWrap)
    ctx.dom.uninject(overlayWrap)
  })

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
  const motionAllowed = () => !(store.get().respectReducedMotion && reducedMotion.matches)
  const onMotionChange = () => applyAll()
  reducedMotion.addEventListener?.('change', onMotionChange)
  disposers.push(() => reducedMotion.removeEventListener?.('change', onMotionChange))

  /** On a touch screen the light's slow movements are already taken in steps (see cinematic.ts), so only the scene's particles need watching there. */
  const touchScreen = () => typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches
  const lightAnimating = () => cine.animating && !touchScreen()
  const perf = new PerfGovernor(
    // Only watch the frame rate while something is actually animating: a frame-counting loop of its own keeps the screen redrawing.
    () => store.get().perfGovernor && (ambient.current !== 'off' || lightAnimating()),
    (saver) => {
      state.saver = saver
      applyAmbient()
      applyCinematic()
      notifyStatus()
    },
  )
  disposers.push(() => perf.stop())

  // ── Helpers ──
  function rgbOf(el: HTMLElement): RGB {
    return parseComputedColor(getComputedStyle(el).color) ?? { r: 147, g: 112, b: 219 }
  }
  const accentColor = () => rgbOf(probe)
  const charColor = () => rgbOf(probeChar)
  const rgbCss = (c: RGB) => `rgb(${Math.round(c.r)}, ${Math.round(c.g)}, ${Math.round(c.b)})`
  function hexToRgb(hex: string): RGB {
    const n = parseInt(hex.slice(1), 16)
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
  }
  const hexOf = (c: RGB) => '#' + [c.r, c.g, c.b].map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('')

  /** Where the send effect launches from: the send button, else the composer. */
  function sendOrigin(): Point {
    const input = document.querySelector<HTMLElement>('[data-component="InputArea"]')
    if (input) {
      // CSS-module class names are hashed (e.g. `_sendBtn_x1y2_12`), so match by substring.
      const sendBtn = input.querySelector<HTMLElement>('button[class*="sendBtn"]')
      const r = (sendBtn ?? input).getBoundingClientRect()
      if (r.width > 0 && r.height > 0) return { x: r.left + r.width / 2, y: r.top }
    }
    return { x: window.innerWidth / 2, y: window.innerHeight - 90 }
  }

  function cardFor(messageId: string): HTMLElement | null {
    return document.querySelector<HTMLElement>(
      `:is([data-component="BubbleMessage"],[data-component="MinimalMessage"])[data-message-id="${CSS.escape(messageId)}"]`,
    )
  }

  /** Centre-top of a message card if it's on screen, else the viewport centre. */
  function messageOrigin(messageId: string | undefined): Point {
    if (messageId) {
      const r = cardFor(messageId)?.getBoundingClientRect()
      if (r && r.width > 0 && r.bottom > 0 && r.top < window.innerHeight) {
        return { x: r.left + r.width / 2, y: Math.max(40, Math.min(window.innerHeight - 40, r.top + Math.min(r.height / 2, 80))) }
      }
    }
    return viewportCenter()
  }

  function currentMood() {
    return state.chatId ? state.mood.get(state.chatId) ?? null : null
  }

  function playSound(kind: Chime) {
    const s = store.get()
    if (!s.enabled || !s.sound) return
    const id = customFor(`ui:${kind}`)
    const ac = id ? sound.context() : null
    if (id && ac) {
      // The user's own file; fall back to the built-in chime if it can't be played.
      void lib
        .source(id, ac)
        .then((src) => (src ? sound.playFile(src, s.soundVolume) : sound.play(kind, s.soundVolume)))
        .catch(() => sound.play(kind, s.soundVolume))
      return
    }
    sound.play(kind, s.soundVolume, moodPitch(currentMood()?.label ?? null))
  }

  function isActiveChat(chatId?: string | null) {
    return !chatId || !state.chatId || chatId === state.chatId
  }

  /** A CSS rule that removes itself after `ms`. Keyed so repeats restart cleanly. */
  const running = new Map<string, () => void>()
  function tempRule(key: string, css: string, ms: number) {
    running.get(key)?.()
    const remove = ctx.dom.addStyle(css)
    const timer = setTimeout(() => stop(), ms)
    const stop = () => {
      clearTimeout(timer)
      remove()
      running.delete(key)
    }
    running.set(key, stop)
  }
  disposers.push(() => {
    for (const stop of [...running.values()]) stop()
  })

  function animateMessage(messageId: string, kind: CardAnimation, force = false) {
    if (disposed || (!force && !motionAllowed())) return
    const { css, durationMs } = entranceRule(messageId, kind)
    tempRule(`${kind}:${messageId}`, css, durationMs + 400)
  }

  // ── Achievements ──
  /**
   * Update the counters with `track` (which returns the badges it earned) and unlock them. Waits for
   * the saved progress to load first: the host replays old messages through us at startup, and
   * counting against the empty fallback would be lost, or worse, saved over the real thing.
   */
  function earn(track: (data: AchievementData) => string[]) {
    badges.whenLoaded(() => {
      const data = badges.get()
      const ids = track(data)
      const s = store.get()
      let changed = false
      for (const id of ids) {
        if (data.unlocked[id]) continue
        const def = ACHIEVEMENTS.find((a) => a.id === id)
        if (!def) continue
        data.unlocked[id] = Date.now()
        changed = true
        if (s.enabled && s.achievements) showUnlock(def.icon, tr(def.title), tr(def.desc))
      }
      badges.set({ ...data })
      if (changed) notifyStatus()
    })
  }
  function unlock(ids: string[]) {
    earn(() => ids)
  }
  function showUnlock(icon: string, title: string, desc: string) {
    const el = ctx.dom.createElement('div', { class: 'lf-unlock', role: 'status' })
    const ico = ctx.dom.createElement('div', { class: 'lf-unlock-ico' })
    ico.textContent = icon
    const body = ctx.dom.createElement('div')
    const small = ctx.dom.createElement('small')
    small.textContent = tr('Achievement unlocked')
    const b = ctx.dom.createElement('b')
    b.textContent = title
    const d = ctx.dom.createElement('span', { class: 'lf-unlock-desc' })
    d.textContent = desc
    body.append(small, b, d)
    el.append(ico, body)
    // Stack below any toast already showing.
    const existing = overlay.querySelectorAll('.lf-unlock').length
    el.style.setProperty('--lf-slot', String(existing))
    overlay.appendChild(el)
    playSound('achievement')
    setTimeout(() => el.remove(), 5000)
  }

  // ── Appliers ──
  function applyMain(s: FlairSettings) {
    removeMainCss?.()
    removeMainCss = ctx.dom.addStyle(buildCss(s))
  }

  function applyColor() {
    const s = store.get()
    const mood = s.enabled && s.moodGlow ? currentMood() : null
    const tod = s.enabled && s.timeOfDay ? timeOfDayTint() : null
    colorStyle.textContent =
      colorVarsCss(s, mood?.color ?? null, tod) +
      `\n:root { --lf-ambient-opacity: ${s.ambientOpacity}; --lf-room: ${state.room}px;${state.charAura ? ` --lf-char: ${state.charAura};` : ''} }`
    syncTint()
  }

  /** Whole-UI mood tint goes through the backend (spindle.theme.applyPalette). */
  function syncTint() {
    const s = store.get()
    const mood = currentMood()
    // When Flair themes Lumiverse, the mood colour is folded into that theme instead.
    const themed = syncTheme()
    const want = !themed && s.enabled && s.moodTintUI && state.tintPermission && mood?.color ? mood.color : null
    const key = want ?? 'none'
    if (key === state.lastTintKey) return
    // Never send a "clear" before we've ever tinted — avoids touching the theme for users who don't use this.
    if (!want && state.lastTintKey === '') {
      state.lastTintKey = key
      return
    }
    state.lastTintKey = key
    ctx.sendToBackend({ type: 'mood_tint', accent: want ? hexToHsl(want) : null })
  }

  /** Lumiverse theme matching (Flair Pack / character aura) through the backend. Returns true when active. */
  function syncTheme(): boolean {
    const s = store.get()
    const mood = currentMood()
    const group = !!document.querySelector('[data-component="MessageList"][data-group-chat="true"]')
    const spec = state.tintPermission
      ? resolveUiTheme(s, state.charAura ? { color: state.charAura, name: group ? null : state.characterName } : null, s.moodGlow ? mood?.color ?? null : null)
      : null
    state.themeLabel = spec ? spec.label : null
    const key = themeKey(spec)
    if (key !== state.lastThemeKey) {
      // Never send a "clear" before we've ever themed — leaves other users' themes untouched.
      if (spec || state.lastThemeKey !== '') ctx.sendToBackend({ type: 'ui_theme', spec })
      state.lastThemeKey = key
    }
    return !!spec
  }

  /** Tell the backend how the AI should behave (macro text + auto-injection). */
  function syncPrefs(force = false) {
    const s = store.get()
    const prefs = {
      type: 'prefs',
      frequency: s.textFxFrequency,
      textEffects: s.enabled && s.textEffects,
      aiEffects: s.enabled && s.aiEffects,
      sceneDirector: s.enabled && s.sceneDirector,
      choices: s.enabled && s.choiceChips,
      sfx: s.enabled && s.aiSfx,
      autoInject: s.enabled && s.autoInject && (s.textEffects || s.aiEffects || s.sceneDirector || s.choiceChips || s.aiSfx),
      disabledFx: s.textFxOff,
    }
    const key = JSON.stringify(prefs)
    if (!force && key === state.lastPrefsKey) return
    state.lastPrefsKey = key
    ctx.sendToBackend(prefs)
  }

  // ── Atmosphere host: lives inside ChatView, between background layers and the chat body ──
  let ambientHost: Element | null = null
  let ambientChatView: Element | null = null
  /** (Re)attach the ambient canvas + cinematic layer to the current ChatView. False when no chat is on screen. */
  function ensureAmbientHost(): boolean {
    const view = document.querySelector('[data-component="ChatView"]')
    if (!view) {
      if (ambientHost) {
        ctx.dom.uninject(ambientHost)
        ambientHost = null
        ambientChatView = null
      }
      return false
    }
    if (view === ambientChatView && ambientHost?.isConnected && ambientEl.isConnected && cine.el.isConnected) return true
    if (ambientHost) ctx.dom.uninject(ambientHost)
    ambientHost = ctx.dom.inject(view, '<div class="lf-ambient-host"></div>', 'beforeend')
    const host = ambientHost.querySelector('.lf-ambient-host') ?? ambientHost
    host.append(ambientEl, cine.el)
    ambientChatView = view
    return true
  }
  disposers.push(() => {
    if (ambientHost) ctx.dom.uninject(ambientHost)
  })

  /** Measure how much space the chat list leaves around cards before it clips (for --lf-room). */
  function measureRoom() {
    const list = document.querySelector<HTMLElement>('[data-component="MessageList"]')
    if (!list || !list.clientWidth) return
    const lr = list.getBoundingClientRect()
    const scale = lr.width / (list.offsetWidth || lr.width) || 1
    const left = lr.left + list.clientLeft * scale
    const right = left + list.clientWidth * scale
    let gap = Infinity
    const cards = list.querySelectorAll<HTMLElement>(CARD)
    for (let i = 0; i < cards.length && i < 8; i++) {
      const r = cards[i].getBoundingClientRect()
      if (!r.width) continue
      gap = Math.min(gap, r.left - left, right - r.right)
    }
    if (!Number.isFinite(gap)) return
    const room = Math.max(3, Math.min(28, Math.floor(gap / scale) - 1))
    if (room !== state.room) {
      state.room = room
      applyColor()
    }
  }
  const onResize = () => measureRoom()
  window.addEventListener('resize', onResize)
  disposers.push(() => window.removeEventListener('resize', onResize))

  /** Scene ignoring motion settings (soundscapes still play under reduced motion). */
  function sceneRaw(): Scene {
    const s = store.get()
    if (!s.enabled) return 'off'
    const chatOverride = state.chatId ? s.chatScenes[state.chatId] : undefined
    const auto = state.chatId ? state.autoScene.get(state.chatId) ?? null : null
    const directed = s.sceneDirector ? director.get(state.chatId)?.scene : undefined
    if (chatOverride && chatOverride !== 'auto') return chatOverride
    if (directed) return directed
    if (chatOverride === 'auto') return auto ?? 'off'
    if (s.ambientAuto && auto) return auto
    return s.ambientScene
  }

  /**
   * The host is animating the chat away (the home button): its chrome carries this attribute for the ~220 ms before the
   * route changes. iOS can kill a home-screen app that is short of memory in the middle of that, and the atmosphere
   * (a full-screen canvas and several screen-sized layers) is the biggest thing of ours on screen, so it goes first.
   */
  function chatLeaving() {
    return !!document.querySelector('[data-chat-chrome-leaving]')
  }

  function resolveScene(): Scene {
    if (!motionAllowed() || !ensureAmbientHost() || chatLeaving()) return 'off'
    return sceneRaw()
  }

  function resolveLight(): Light {
    const s = store.get()
    const directed = s.sceneDirector ? director.get(state.chatId)?.light : undefined
    return directed ?? s.lightDefault
  }

  function applyAmbient() {
    const s = store.get()
    const scene = resolveScene()
    ambient.set(scene, s.ambientDensity * (state.saver || perf.saving ? 0.5 : 1))
    if (scene !== state.lastScene) {
      state.lastScene = scene
      if (scene !== 'off') earn((d) => onScene(d, scene))
    }
    if (scene !== 'off' && s.perfGovernor) perf.start()
    applySoundscape()
  }

  function applyCinematic() {
    const s = store.get()
    const hostOk = ensureAmbientHost()
    const saving = state.saver || perf.saving
    cine.set({
      enabled: s.enabled && s.cinematic && hostOk && !chatLeaving(),
      light: resolveLight(),
      vignette: s.vignette,
      grain: s.grain && !saving && motionAllowed(),
      lightning: s.lightning,
      noFlash: s.noFlash,
      motion: motionAllowed(),
      saver: saving,
    })
    // Light rays, candle flicker and the like are animating too: watch the frame rate for them as well.
    if (s.perfGovernor && lightAnimating()) perf.start()
  }

  // The home button: drop the atmosphere the moment the host starts leaving the chat (see chatLeaving).
  if (typeof MutationObserver !== 'undefined') {
    let wasLeaving = false
    const leaveWatch = new MutationObserver(() => {
      const leaving = chatLeaving()
      if (leaving === wasLeaving) return
      wasLeaving = leaving
      if (disposed) return
      if (leaving) stopComposer()
      applyAmbient()
      applyCinematic()
    })
    leaveWatch.observe(document.body, { subtree: true, attributes: true, attributeFilter: ['data-chat-chrome-leaving'] })
    disposers.push(() => leaveWatch.disconnect())
  }

  function applySoundscape() {
    const s = store.get()
    scape.setBackground(s.soundUnfocused, s.soundUnfocusedLevel)
    const scene = sceneRaw()
    const light = resolveLight()
    const bed: CustomBed = {
      always: customFor('always'),
      scene: scene !== 'off' ? customFor(`scene:${scene}`) : undefined,
      light: light !== 'none' ? customFor(`light:${light}`) : undefined,
    }
    bed.rev = [bed.always, bed.scene, bed.light].map((id) => (id ? lib.meta(id)?.level ?? 1 : '')).join(',')
    scape.set(s.enabled && s.soundscape && chatOnScreen(), scene, light, s.soundscapeVolume, bed)
    warmUiSounds()
    soundWidget.sync(s.enabled && s.soundWidget && state.panelsPermission)
  }

  function applyAll() {
    const s = store.get()
    applyMain(s)
    applyColor()
    applyAmbient()
    applyCinematic()
    syncInputBar()
    syncPrefs()
    // Sample avatar colours whenever something needs them; only paint per-message glows if auras are on.
    auras.enabled = s.enabled && (s.auras || s.colorSource === 'character' || s.uiTheme === 'character' || packById(s.activePack)?.theme === 'character')
    auras.paint = s.auras
    auras.scan()
    choices.enabled = s.enabled && s.choiceChips
    choices.sendOnPick = s.choiceSend
    if (!choices.enabled) choices.clear()
    if (!s.enabled || !s.composerGlow) stopComposer()
    notifyStatus()
  }

  // ── Status for the panel ──
  function status(): PanelStatus {
    const mood = currentMood()
    const s = store.get()
    const dir = director.get(state.chatId)
    return {
      chatId: state.chatId,
      characterId: state.characterId,
      characterName: state.characterName,
      moodLabel: s.moodGlow && mood?.color ? mood.label : null,
      timeLabel: s.timeOfDay ? timeOfDayTint()?.label ?? 'Day' : null,
      autoScene: state.chatId ? state.autoScene.get(state.chatId) ?? null : null,
      activeScene: ambient.current,
      tintPermission: state.tintPermission,
      injectPermission: state.injectPermission,
      panelsPermission: state.panelsPermission,
      memoriesPermission: state.memoriesPermission,
      memoryNote: state.memoryNote,
      directed: dir ? [dir.scene, dir.light, dir.mood].filter(Boolean).join(' · ') : null,
      light: resolveLight(),
      saver: state.saver || perf.saving,
      auraColors: auras.list().map((a) => a.color),
      beats: state.chatId ? beats.get()[state.chatId] ?? [] : [],
      pins: state.chatId ? pins.get()[state.chatId] ?? [] : [],
      unlocked: badges.get().unlocked,
      soundscape: scape.state,
      uiThemeLabel: state.themeLabel,
      charAura: state.charAura,
      soundscapeKey: scape.playing,
      soundscapeCustom: scape.customPlaying.map((id) => lib.meta(id)?.name ?? '').filter(Boolean),
      soundscapeAlways: scape.alwaysPlaying,
    }
  }
  function notifyStatus() {
    for (const fn of pinListeners) fn()
    const st = status()
    for (const fn of statusListeners) {
      try {
        fn(st)
      } catch (err) {
        console.error('[Lumi Flair] status listener failed', err)
      }
    }
  }

  // ── Theater mode ──
  // The host's own drawer can only be closed by its tab button (no extension call for it), so press that, only when it is open.
  function closeHostDrawer() {
    try {
      if (!ctx.ui.events?.getDrawerState?.().open) return
    } catch {
      return
    }
    const tab = document.querySelector('[data-spindle-mount="sidebar"]')?.parentElement?.parentElement?.firstElementChild
    if (tab instanceof HTMLButtonElement) tab.click()
  }
  const theater = new Theater({
    root: theaterWrap.querySelector('.lf-th-root') as HTMLElement,
    style: theaterStyle,
    get: () => {
      const s = store.get()
      return { scale: s.theaterScale, speed: s.theaterSpeed, scroll: s.theaterScroll }
    },
    set: (patch) => store.update(patch),
    motion: motionAllowed,
    list: () => document.querySelector<HTMLElement>('[data-component="MessageList"]'),
    latest: () => {
      const id = ctx.messages.getLatestMessageId()
      return id ? cardFor(id) : null
    },
    closeDrawer: closeHostDrawer,
    tr,
    changed: () => notifyStatus(),
  })

  // ── Typewriter pacing ──
  // The reply is revealed at a steady pace (see typewriter.ts), with soft keys that follow the mood.
  let keySrc: { id: string; src: AudioSource } | null = null
  function typeKey(space: boolean) {
    const s = store.get()
    if (!s.enabled || !s.sound || !s.typewriterSound || document.hidden) return
    const away = scape.backgrounded
    if (away === 'mute') return
    const volume = s.soundVolume * 0.8 * (away === 'dim' ? s.soundUnfocusedLevel : 1)
    const semis = moodPitch(currentMood()?.label ?? null)
    const id = customFor('ui:key')
    const ac = sound.context()
    if (id && ac && keySrc?.id !== id) {
      // The user's own key sound: decoded once, then every key uses it (the built-in one plays meanwhile).
      void lib.source(id, ac).then((src) => { if (src) keySrc = { id, src } }).catch(() => {})
    }
    sound.key(volume, semis, space, id && keySrc?.id === id ? keySrc.src : undefined)
  }
  const typewriter = new Typewriter({
    get: () => {
      const s = store.get()
      return { on: s.enabled && s.typewriter, cps: s.typewriterCps }
    },
    motion: motionAllowed,
    // The message being written (the newest one, should a finished one still be marked as streaming), else the one we follow.
    content: (id) =>
      [...document.querySelectorAll<HTMLElement>(`${CARD}[data-part="streaming"] [data-component="MessageContent"]`)].at(-1) ??
      (id ? cardFor(id)?.querySelector<HTMLElement>('[data-component="MessageContent"]') ?? null : null),
    list: () => document.querySelector<HTMLElement>('[data-component="MessageList"]'),
    key: typeKey,
  })

  // ── Character intro ──
  // Opening a chat plays a short name card in the character's aura colour, every time a chat is opened.
  // In a group chat there is no one name to show, so a chip names whoever is speaking instead, and the other messages dim.
  let introRun = 0
  const isGroupChat = () => !!document.querySelector('[data-component="MessageList"][data-group-chat]')

  /** The theme sound for the card: needs interface sounds on, honours the window being in the background, and never plays late. */
  async function playIntroSound(id: string) {
    const s = store.get()
    if (!s.enabled || !s.sound || !lib.has(id) || document.hidden) return
    const away = scape.backgrounded
    if (away === 'mute') return
    const ac = sound.context()
    if (!ac) return
    // A page nobody has touched yet can't make sound; a sound that comes late, after the card has gone, is worse than none.
    if (ac.state === 'suspended') await Promise.race([ac.resume().catch(() => {}), new Promise((r) => setTimeout(r, 400))])
    if (disposed || ac.state !== 'running') return
    const src = await lib.source(id, ac).catch(() => null)
    if (src && !disposed) sound.playFile(src, s.soundVolume * (away === 'dim' ? s.soundUnfocusedLevel : 1), 8)
  }

  function showIntro(name: string, color: string, avatar: string | null) {
    // The part of the chat that is on screen.
    const view = document.querySelector<HTMLElement>('[data-component="ChatView"]')?.getBoundingClientRect()
    const left = Math.max(0, view?.left ?? 0)
    const top = Math.max(0, view?.top ?? 0)
    const area = view ? { left, top, width: Math.min(window.innerWidth, view.right) - left, height: Math.min(window.innerHeight, view.bottom) - top } : null
    introCard.show({ name, color, avatar, kicker: tr('A conversation with'), motion: motionAllowed(), area })
    const id = store.get().introSound
    if (id) void playIntroSound(id)
  }

  function startIntro(chatId: string) {
    const run = ++introRun
    const t0 = performance.now()
    const attempt = () => {
      if (disposed || run !== introRun || state.chatId !== chatId) return
      const s = store.get()
      // (While the welcome is still to be seen, the card would only land on top of it.)
      if (!s.enabled || !s.intro || !s.welcomed) return
      const waited = performance.now() - t0
      const retry = () => {
        if (waited < 3200) setTimeout(attempt, 150)
      }
      // Wait for the chat to be on screen: only then can we tell a group chat from a single character.
      if (!document.querySelector('[data-component="MessageList"]')) return retry()
      if (isGroupChat()) return
      const name = state.characterName
      if (!name) return retry()
      const found = auras.enabled ? auras.latest() : null
      // Their colour comes from an avatar on screen; give it a moment, then settle for the theme colour.
      if (!found && auras.enabled && waited < 1800) return retry()
      showIntro(name, found?.aura.color ?? state.charAura ?? hexOf(charColor()), found?.avatar ?? null)
    }
    setTimeout(attempt, 450)
  }

  /** Play it now (the panel's Preview, the command), whatever the settings. */
  function previewIntro() {
    const found = auras.enabled ? auras.latest() : null
    showIntro(state.characterName || tr('Your character'), found?.aura.color ?? state.charAura ?? hexOf(charColor()), found?.avatar ?? null)
  }

  // Group chats: who is speaking.
  const speakerColors = new Map<string, string>() // character id → the colour taken from their avatar
  const SPOT_KEY = 'groupspot'
  let speakerRun = 0
  let speakerGen = '' // generation of the turn on show
  let spotOn = false
  let speakerTurns = 0 // how many turns the round has, as far as the host told us (0: not known)
  let speakerTimer: ReturnType<typeof setTimeout> | undefined
  let speakerHide: ReturnType<typeof setTimeout> | undefined

  function chipPlace() {
    const list = document.querySelector<HTMLElement>('[data-component="MessageList"]')?.getBoundingClientRect()
    const input = document.querySelector<HTMLElement>('[data-component="InputArea"]')?.getBoundingClientRect()
    return {
      x: list && list.width > 0 ? list.left + list.width / 2 : window.innerWidth / 2,
      bottom: input && input.height > 0 ? window.innerHeight - input.top + 12 : 110,
    }
  }

  /** The other messages step back while someone is writing (opacity only, and only the messages on screen). */
  const spotlightRule = (dim: boolean) =>
    `:root [data-component="MessageList"][data-group-chat] ${CARD}:not([data-part="streaming"]) { opacity: ${dim ? '.7' : '1'}; transition: opacity .3s ease; }`

  function speakerStart(p: { chatId?: string; characterId?: string; characterName?: string; generationId?: string; turn?: number; total?: number }) {
    const s = store.get()
    const name = (p.characterName ?? '').trim()
    if (disposed || !s.enabled || !s.introGroup || !name || !isActiveChat(p.chatId) || !isGroupChat()) return
    const gen = p.generationId ?? ''
    const total = p.total && p.total > 1 ? p.total : 0
    // Two events can announce one turn; show it once, unless the second one brings the turn count.
    if (gen && gen === speakerGen && speaker.showing && (!total || total === speakerTurns)) return
    speakerGen = gen
    speakerTurns = total
    const run = ++speakerRun
    const id = p.characterId || name
    const known = speakerColors.get(id)
    speaker.show({ name, color: known ?? hashColor(id), turn: (p.turn ?? 0) + 1, total, motion: motionAllowed(), ...chipPlace() })
    spotOn = true
    tempRule(SPOT_KEY, spotlightRule(true), 120_000)
    // If the end of this turn is never reported, it still goes away.
    clearTimeout(speakerHide)
    speakerHide = setTimeout(speakerFinish, 120_000)
    if (known || !auras.enabled) return
    // A character who hasn't spoken yet has no colour on screen until their message appears.
    const t0 = performance.now()
    const poll = () => {
      if (disposed || run !== speakerRun) return
      auras.scan()
      const waited = performance.now() - t0
      const hit = auras.forSpeaker(name) ?? (waited > 250 ? auras.forStreaming() : null)
      if (hit) {
        speakerColors.set(id, hit.aura.color)
        speaker.setColor(hit.aura.color)
        return
      }
      if (waited < 2400) speakerTimer = setTimeout(poll, 150)
    }
    clearTimeout(speakerTimer)
    poll()
  }

  /** Chip away, and the other messages come back up (smoothly). */
  function speakerFinish() {
    speakerRun++
    speakerGen = ''
    speaker.hide(false)
    if (spotOn) {
      spotOn = false
      tempRule(SPOT_KEY, spotlightRule(false), 450)
    }
  }

  /** The speaker is done: the chip and the dimming leave shortly, unless the next speaker starts first. */
  function speakerEnd(delay = 700) {
    if (!speaker.showing) return
    clearTimeout(speakerHide)
    speakerHide = setTimeout(speakerFinish, delay)
  }

  function speakerReset() {
    clearTimeout(speakerHide)
    clearTimeout(speakerTimer)
    speakerFinish()
    speaker.hide(true)
  }
  disposers.push(() => {
    clearTimeout(speakerHide)
    clearTimeout(speakerTimer)
  })

  function previewSpeaker() {
    const name = state.characterName || tr('Your character')
    const found = auras.enabled ? auras.latest() : null
    const color = found?.aura.color ?? state.charAura ?? hashColor(name)
    speaker.show({ name, color, turn: 1, total: 3, motion: motionAllowed(), ...chipPlace() })
    clearTimeout(speakerHide)
    speakerHide = setTimeout(() => speaker.hide(false), 2600)
  }

  // ── Active chat / character tracking ──
  let nameRequest = 0
  function checkActive() {
    const { chatId, characterId } = ctx.getActiveChat()
    if (chatId === state.chatId && characterId === state.characterId) return
    const charChanged = characterId !== state.characterId
    const chatChanged = chatId !== state.chatId
    state.chatId = chatId
    state.characterId = characterId
    if (chatChanged) {
      choices.clear()
      speakerReset()
      typewriter.stop()
      introRun++ // an intro still waiting on the old chat is off
      introCard.hide(false)
      if (chatId) startIntro(chatId)
    }
    if (charChanged) {
      state.characterName = null
      const req = ++nameRequest
      if (characterId) {
        ctx.characters
          .get(characterId)
          .then((c) => {
            if (req !== nameRequest) return
            const name = (c as { name?: unknown } | null)?.name
            state.characterName = typeof name === 'string' ? name : null
            notifyStatus()
          })
          .catch(() => {})
      }
    }
    store.setActiveCharacter(characterId) // emits → applyAll when a profile is involved
    if (!chatId) {
      theater.exit() // the home screen has the interface theater mode hides
      // Left the chat, so the home screen is being mounted. The atmosphere goes now; the whole-UI colour and
      // theme changes wait until the page change has settled, because restyling everything in the middle of it
      // is what a memory-starved iOS home-screen app can least afford.
      applyAmbient()
      applyCinematic()
      setTimeout(() => {
        if (disposed || state.chatId) return
        applyColor()
        notifyStatus()
      }, 900)
      return
    }
    applyColor()
    applyAmbient()
    applyCinematic()
    notifyStatus()
  }
  const pollTimer = setInterval(() => {
    checkActive()
    measureRoom()
    auras.scan()
    refreshCharAura()
    if (speaker.showing) {
      const at = chipPlace()
      speaker.place(at.x, at.bottom)
    }
    // ChatView remounts on navigation; keep the atmosphere layers attached to the live one.
    const view = document.querySelector('[data-component="ChatView"]')
    if (view !== ambientChatView || (ambientHost && !ambientHost.isConnected)) {
      applyAmbient()
      applyCinematic()
    }
  }, 1500)
  disposers.push(() => clearInterval(pollTimer))
  // Deleted messages leave the heartbeat straight away, so every dot stays jumpable.
  on('MESSAGE_DELETED', (raw) => {
    const p = (raw ?? {}) as { chatId?: string; messageId?: string; messageIds?: string[] }
    const gone = new Set([...(p.messageIds ?? []), ...(p.messageId ? [p.messageId] : [])])
    if (!gone.size) return
    pins.whenLoaded(() => {
      const next = removePins(pins.get(), p.chatId, gone)
      if (next === pins.get()) return
      pins.set(next)
      notifyStatus()
    })
    beats.whenLoaded(() => {
      const all = beats.get()
      let changed = false
      const next: typeof all = {}
      for (const [chat, list] of Object.entries(all)) {
        if (p.chatId && chat !== p.chatId) {
          next[chat] = list
          continue
        }
        const kept = list.filter((x) => !gone.has(x.id))
        if (kept.length !== list.length) changed = true
        next[chat] = kept
      }
      if (changed) {
        beats.set(next)
        notifyStatus()
      }
    })
  })

  on('CHAT_SWITCHED', () => {
    storyNav.cancel()
    setTimeout(checkActive, 0)
  })
  on('CHAT_CHANGED', () => setTimeout(checkActive, 0))

  // Time-of-day tint drifts slowly — recheck every 5 minutes.
  const todTimer = setInterval(() => {
    if (store.get().timeOfDay) {
      applyColor()
      notifyStatus()
    }
  }, 5 * 60_000)
  disposers.push(() => clearInterval(todTimer))

  // ── Bursts ──
  /** Screen-scale effects aim at the middle of the message list, and may warp the chat itself. */
  function screenEffect(effect: BurstEffect) {
    const s = store.get()
    const list = document.querySelector<HTMLElement>('[data-component="MessageList"]')
    const r = list?.getBoundingClientRect()
    const center = r && r.width > 0 ? { x: r.left + r.width / 2, y: r.top + r.height * 0.45 } : undefined
    if (effect === 'blackhole' && s.cameraShake && !s.noFlash && motionAllowed()) {
      const body = document.querySelector<HTMLElement>('[data-component="ChatView"] [data-lumiverse-surface="chat-body"]')
      const b = body?.getBoundingClientRect()
      if (b && center && b.width > 0 && b.height > 0) {
        const ms = HOLE_TIMING.total * 1000
        tempRule('warp', blackHoleWarpRule(((center.x - b.left) / b.width) * 100, ((center.y - b.top) / b.height) * 100, HOLE_TIMING), ms + 60)
      }
    }
    return { center, noFlash: s.noFlash }
  }

  function fireSendEffect(force = false) {
    const s = store.get()
    if (!force && (!s.enabled || s.sendEffect === 'none' || !motionAllowed())) return
    const effect = s.sendEffect === 'none' ? 'sparkle' : s.sendEffect
    playSendEffect(fx, effect, sendOrigin(), accentColor(), s.sendIntensity * (state.saver ? 0.6 : 1), screenEffect(effect))
  }

  function burst(effect: BurstEffect, origin: Point, intensity = 1, color?: RGB) {
    if (!motionAllowed()) return
    playSendEffect(fx, effect, origin, color ?? charColor(), intensity * (state.saver ? 0.6 : 1), screenEffect(effect))
  }

  // ── Celebrations ──
  function checkTriggers(text: string | undefined, origin: Point) {
    const s = store.get()
    if (!s.enabled) return
    const t = matchTrigger(text, parseTriggers(s.triggers))
    if (!t) return
    burst(t.effect, origin, 1.2)
    playSound('sparkle')
  }

  function checkMilestone(chatId: string | undefined) {
    const s = store.get()
    if (!s.enabled || !s.milestones || !chatId || chatId !== state.chatId) return
    // The message list may lag the event by a frame or two.
    setTimeout(() => {
      const count = ctx.messages.listMessageIds().length
      if (!count) return
      const base = store.getBase()
      let celebrated = base.celebrated[chatId]
      if (celebrated === undefined) {
        // First time we see this chat: don't celebrate milestones it passed long ago.
        celebrated = milestoneAtOrBelow(Math.max(0, count - 2))
        store.patchSilently({ celebrated: { ...base.celebrated, [chatId]: celebrated } })
      }
      const m = milestoneAtOrBelow(count)
      if (m > celebrated) {
        store.patchSilently({ celebrated: { ...store.getBase().celebrated, [chatId]: m } })
        if (motionAllowed()) {
          playBanner(fx, `${m.toLocaleString()} ${tr('messages')} ✨`, charColor())
          burst('confetti', { x: window.innerWidth / 2, y: window.innerHeight * 0.9 }, 1.4)
        }
        playSound('fanfare')
        unlock(['milestone'])
      }
    }, 350)
  }

  // ── Composer "thinking" glow ──
  function startComposer(generationId: string) {
    const s = store.get()
    stopComposer()
    if (!s.enabled || !s.composerGlow) return
    const startedAt = performance.now()
    const timer = setInterval(() => {
      const g = state.generating
      if (!g) return
      const now = performance.now()
      const secs = Math.max(0.25, (now - g.windowStart) / 1000)
      const rate = g.tokens / secs
      g.tokens = 0
      g.windowStart = now
      composerStyle.textContent = composerActiveCss(Math.min(1, rate / 40))
      if (now - startedAt > 5 * 60_000) stopComposer() // safety net
    }, 600)
    state.generating = { id: generationId, tokens: 0, windowStart: startedAt, timer }
    composerStyle.textContent = composerActiveCss(0)
  }
  function stopComposer() {
    if (state.generating) clearInterval(state.generating.timer)
    state.generating = null
    composerStyle.textContent = ''
  }
  disposers.push(stopComposer)

  // ── Mood (expressions + Scene Director) ──
  function setMood(chatId: string, label: string) {
    const color = moodColorFor(label, parseMoodMap(store.get().moodMap))
    state.mood.set(chatId, { label, color, at: Date.now() })
    earn((d) => onMood(d, chatId, label))
    if (chatId === state.chatId) {
      applyColor()
      notifyStatus()
    }
  }

  // ── Story heartbeat ──
  function recordBeat(chatId: string, messageId: string, content: string | undefined) {
    const ids = ctx.messages.listMessageIds()
    const i = ids.indexOf(messageId)
    const mood = state.mood.get(chatId)
    const fresh = mood && Date.now() - mood.at < 90_000 ? mood : null
    const lv = valenceForLabel(fresh?.label)
    const tv = valenceForText(content)
    const v = lv === null ? tv : lv * 0.65 + tv * 0.35
    const p: BeatPoint = { id: messageId, i: i < 0 ? ids.length : i, v, label: fresh?.label ?? '', color: fresh?.color ?? null, t: Date.now() }
    beats.whenLoaded(() => {
      beats.set(addPoint(beats.get(), chatId, p))
      notifyStatus()
    })
  }
  /** Expressions arrive just after the reply — refine the latest beat with the real mood. */
  function refineLatestBeat(chatId: string, label: string, color: string | null) {
    beats.whenLoaded(() => {
      const list = beats.get()[chatId]
      const last = list?.at(-1)
      if (!last || Date.now() - last.t > 90_000) return
      const lv = valenceForLabel(label)
      if (lv === null) return
      const updated = { ...last, v: lv * 0.65 + last.v * 0.35, label, color }
      beats.set(addPoint(beats.get(), chatId, updated))
      notifyStatus()
    })
  }

  // ── AI-triggered screen effects & Scene Director: <flair effect=… scene=… light=… mood=…> ──
  function fireAiEffect(messageId: string, effect: BurstEffect) {
    if (state.firedAiFx.has(messageId)) return
    state.firedAiFx.add(messageId)
    state.pendingAiFx.delete(messageId)
    const s = store.get()
    if (!s.enabled || !s.aiEffects) return
    burst(effect, messageOrigin(messageId), 1.2)
    playSound('sparkle')
    unlock(['showstopper'])
  }

  // ── AI sound cues: <flair sfx="door-knock"></flair> ──
  /** Play a cue now: the user's file for it if they assigned one, else the built-in sound. */
  function playCue(cue: string, volume: number) {
    const id = customFor(`sfx:${cue}`)
    const ac = id ? sound.context() : null
    if (id && ac) {
      void lib
        .source(id, ac)
        .then((src) => (src ? sound.playFile(src, volume) : sfx.play(cue, volume)))
        .catch(() => sfx.play(cue, volume))
      return
    }
    sfx.play(cue, volume)
  }

  /** Play a cue that was seen live. Cues that arrive together (a reply that wasn't streamed) are spaced out. */
  function fireSfx(messageId: string, cue: string, key: string) {
    let rec = state.sfxFired.get(messageId)
    if (!rec) {
      rec = { epoch: state.sfxEpoch, keys: new Set() }
      state.sfxFired.set(messageId, rec)
      if (state.sfxFired.size > 200) state.sfxFired.delete(state.sfxFired.keys().next().value as string)
    }
    if (rec.keys.has(key) || rec.keys.size >= SFX_MAX_PER_MESSAGE) return
    rec.keys.add(key)
    const now = Date.now()
    const at = Math.max(now, state.sfxNextAt)
    state.sfxNextAt = at + SFX_GAP_MS
    setTimeout(() => {
      if (disposed) return
      const s = store.get()
      if (!s.enabled || !s.aiSfx) return
      // The background level is read when the cue plays, not when it was queued.
      const volume = s.sfxVolume * scape.focusLevel
      if (volume > 0) playCue(cue, volume)
    }, at - now)
  }

  function handleSfx(messageId: string, cue: string, key: string, streaming: boolean) {
    const s = store.get()
    if (!s.enabled || !s.aiSfx || s.sfxVolume <= 0) return
    let rec = state.sfxFired.get(messageId)
    // A streaming delivery for a message from an earlier generation: it's being regenerated or swiped.
    if (streaming && rec && rec.epoch < state.sfxEpoch) {
      state.sfxFired.delete(messageId)
      rec = undefined
    }
    if (rec?.keys.has(key)) return // already played (the final render after streaming, or a re-render)
    const at = state.recentGenerated.get(messageId)
    if (streaming || (at !== undefined && Date.now() - at < AI_FX_WINDOW_MS)) {
      fireSfx(messageId, cue, key)
      return
    }
    // Not live: an old message being rendered (chat opened, scrolled), or a reply whose
    // GENERATION_ENDED is still on the way. Remember it briefly in case it is the latter.
    const pending = state.pendingSfx.get(messageId) ?? { items: [], at: 0 }
    if (!pending.items.some((i) => i.key === key)) pending.items.push({ cue, key })
    pending.at = Date.now()
    state.pendingSfx.set(messageId, pending)
    if (state.pendingSfx.size > 50) state.pendingSfx.delete(state.pendingSfx.keys().next().value as string)
  }

  function applyDirection(chatId: string, messageId: string, attrs: Record<string, string>) {
    const s = store.get()
    if (!s.enabled || !s.sceneDirector) return
    const dir = parseDirection(attrs)
    if (!dir) return
    const index = ctx.messages.listMessageIds().indexOf(messageId)
    if (!director.apply(chatId, index < 0 ? Number.MAX_SAFE_INTEGER : index, dir)) return
    if (dir.mood) setMood(chatId, dir.mood)
    unlock(['director'])
    if (chatId === state.chatId) {
      applyAmbient()
      applyCinematic()
      notifyStatus()
    }
  }

  try {
    disposers.push(
      ctx.messages.registerTagInterceptor({ tagName: 'flair', removeFromMessage: true }, (p) => {
        if (p.isUser || !p.messageId) return
        // Sound cues play as the reply streams in, so they run before the streaming return below.
        const cue = cueName(p.attrs?.sfx)
        if (cue && isActiveChat(p.chatId)) handleSfx(p.messageId, cue, p.fullMatch || cue, !!p.isStreaming)
        if (p.isStreaming) return
        const chatId = p.chatId ?? state.chatId
        if (chatId) applyDirection(chatId, p.messageId, p.attrs ?? {})
        // A tag that only carries a sound cue has no effect name: don't read its text as one.
        const raw = (p.attrs?.effect || (p.attrs?.sfx !== undefined ? '' : p.content) || '').trim().toLowerCase()
        if (!raw || state.firedAiFx.has(p.messageId)) return
        const effect: BurstEffect = (BURST_EFFECTS as readonly string[]).includes(raw) ? (raw as BurstEffect) : 'sparkle'
        const at = state.recentGenerated.get(p.messageId)
        if (at && Date.now() - at < AI_FX_WINDOW_MS) fireAiEffect(p.messageId, effect)
        // Otherwise it's an old message being rendered (chat opened, scrolled) —
        // remember it briefly in case GENERATION_ENDED for it is still on the way.
        else state.pendingAiFx.set(p.messageId, { effect, at: Date.now() })
      }),
    )
    disposers.push(
      ctx.messages.registerTagInterceptor({ tagName: 'flair-choice', removeFromMessage: true }, (p) => {
        if (p.isStreaming || p.isUser || !p.messageId) return
        if (!store.get().enabled || !store.get().choiceChips) return
        choices.add(p.messageId, p.content ?? '')
      }),
    )
  } catch (err) {
    console.warn('[Lumi Flair] Tag interceptor unavailable', err)
  }
  choices.onPick = () => {
    earn((d) => {
      d.choices += 1
      return d.choices >= 10 ? ['choices_10'] : []
    })
    playSound('send')
  }

  // ── Event wiring ──
  on('MESSAGE_SENT', (raw) => {
    const p = raw as MessageSentPayload
    const s = store.get()
    if (!s.enabled || !p?.message?.is_user || !isActiveChat(p.chatId)) return
    choices.clear()
    fireSendEffect()
    playSound('send')
    if (p.message.id && s.userEntrance !== 'none') animateMessage(p.message.id, s.userEntrance)
    checkTriggers(p.message.content, sendOrigin())
    checkMilestone(p.chatId ?? state.chatId ?? undefined)
    earn((d) => onSent(d))
  })

  on('GENERATION_STARTED', (raw) => {
    const p = raw as GenerationStartedPayload
    state.sfxEpoch++
    if (!isActiveChat(p?.chatId) || p?.generationType === 'impersonate') return
    // A continued reply keeps the options it had; anything else starts fresh.
    if (p?.generationType === 'continue') choices.pause()
    else choices.clear()
    startComposer(p?.generationId ?? 'unknown')
    if (p) speakerStart(p)
    // A continued reply keeps the text it had; only what is added is typed out.
    typewriter.start(p?.generationType === 'continue' ? p.targetMessageId ?? null : null)
  })

  // A host that announces group turns itself also tells us how many speakers the round has.
  on('GROUP_TURN_STARTED', (raw) => {
    const p = raw as GroupTurnPayload
    if (p?.chatId) speakerStart({ ...p, turn: p.turnIndex, total: p.totalExpected })
  })
  on('GROUP_ROUND_COMPLETE', () => speakerEnd(300))

  on('STREAM_TOKEN_RECEIVED', (raw) => {
    const g = state.generating
    if (!g) return
    const p = raw as StreamTokenPayload
    if (!p?.generationId || g.id === 'unknown' || p.generationId === g.id) g.tokens++
  })

  on('GENERATION_STOPPED', () => {
    stopComposer()
    speakerEnd(200)
    typewriter.end()
  })

  on('GENERATION_ENDED', (raw) => {
    const p = raw as GenerationEndedPayload
    if (!p?.generationId || !speakerGen || p.generationId === speakerGen) speakerEnd()
    if (!p?.error && p?.generationType !== 'impersonate') typewriter.end()
    else typewriter.stop()
    if (!state.generating || !p?.generationId || state.generating.id === p.generationId || state.generating.id === 'unknown') {
      stopComposer()
    }
    if (!p?.messageId || p.error || p.generationType === 'impersonate') return
    const now = Date.now()
    state.recentGenerated.set(p.messageId, now)
    for (const [id, t] of state.recentGenerated) if (now - t > AI_FX_WINDOW_MS) state.recentGenerated.delete(id)
    for (const [id, v] of state.pendingAiFx) if (now - v.at > AI_FX_WINDOW_MS) state.pendingAiFx.delete(id)
    for (const [id, v] of state.pendingSfx) if (now - v.at > AI_FX_WINDOW_MS) state.pendingSfx.delete(id)

    if (!isActiveChat(p.chatId)) return
    const s = store.get()
    if (!s.enabled) return
    const messageId = p.messageId
    // Cues from a reply that wasn't streamed: its tags were rendered before this event arrived.
    const pendingCues = state.pendingSfx.get(messageId)
    state.pendingSfx.delete(messageId)
    if (pendingCues && s.aiSfx && s.sfxVolume > 0) for (const i of pendingCues.items) fireSfx(messageId, i.cue, i.key)
    if (s.characterEntrance !== 'none') animateMessage(messageId, 'bloom')
    playSound('receive')
    const pending = state.pendingAiFx.get(messageId)
    if (pending) fireAiEffect(messageId, pending.effect)
    checkTriggers(p.content, messageOrigin(messageId))
    checkMilestone(p.chatId)
    if (p.chatId) recordBeat(p.chatId, messageId, p.content)

    // Camera shake when the reply shouts.
    if (
      s.cameraShake && !s.noFlash && motionAllowed() && !state.shaken.has(messageId) &&
      (['big', 'shake'] as const).some((fx) => !s.textFxOff.includes(fx) && new RegExp(`data-lf=["']${fx}["']`).test(p.content ?? ''))
    ) {
      state.shaken.add(messageId)
      setTimeout(() => tempRule('camshake', cameraShakeRule(), 520), 120)
    }

    // Character aura: re-scan avatars; in group chats, a small signature puff shows who spoke.
    setTimeout(() => {
      auras.scan()
      if (!s.auras || state.firedAiFx.has(messageId)) return
      if (!document.querySelector('[data-component="MessageList"][data-group-chat]')) return
      const aura = auras.forMessage(messageId)
      if (aura) burst(aura.burst, messageOrigin(messageId), 0.45, hexToRgb(aura.color))
    }, 250)
  })

  on('EXPRESSION_CHANGED', (raw) => {
    const p = raw as ExpressionPayload
    if (!p?.chatId || !p.label) return
    setMood(p.chatId, p.label)
    refineLatestBeat(p.chatId, p.label, state.mood.get(p.chatId)?.color ?? null)
  })

  on('WORLD_INFO_ACTIVATED', (raw) => {
    const p = raw as WorldInfoPayload
    if (!p?.chatId || !Array.isArray(p.entries)) return
    const scene = sceneFromEntries(p.entries)
    if (!scene) return // keep the last weather until something new says otherwise
    if (scene === 'off') state.autoScene.delete(p.chatId)
    else state.autoScene.set(p.chatId, scene)
    if (p.chatId === state.chatId) {
      applyAmbient()
      notifyStatus()
    }
  })

  on('MESSAGE_SWIPED', (raw) => {
    const p = raw as SwipePayload
    // Any swipe operation (navigated, added, filled in, edited, deleted): the suggestion chips follow the swipe on screen.
    if (p?.message?.id && isActiveChat(p.chatId)) choices.swiped(p.message.id, p.message.content ?? '')
    const s = store.get()
    if (!s.enabled || s.swipeTransition === 'none' || p?.action !== 'navigated' || !isActiveChat(p.chatId)) return
    const id = p.message?.id
    if (!id) return
    if (s.swipeTransition === 'fade') return animateMessage(id, 'swipe-fade')
    const to = p.swipeId ?? p.message?.swipe_id ?? 0
    const from = p.previousSwipeId ?? to
    animateMessage(id, to >= from ? 'swipe-left' : 'swipe-right')
  })

  // ── Tap-to-glow on touch screens ──
  const coarse = window.matchMedia('(hover: none)')
  const onTap = (e: PointerEvent) => {
    const s = store.get()
    if (e.pointerType !== 'touch' || !s.enabled || !s.tapGlow || s.hoverStyle === 'none' || !coarse.matches) return
    const card = (e.target as Element | null)?.closest?.(CARD)
    const id = card?.getAttribute('data-message-id')
    if (id) tempRule('tapglow', tapGlowRule(id), 1400)
  }
  document.addEventListener('pointerdown', onTap, { capture: true, passive: true })
  disposers.push(() => document.removeEventListener('pointerdown', onTap, { capture: true }))

  // ── Cursor trail (mouse only: a touch screen has no cursor) ──
  let trail = { t: 0, x: 0, y: 0 }
  let trailColor = { at: -1e9, rgb: { r: 0, g: 0, b: 0 } }
  const onTrail = (e: PointerEvent) => {
    const s = store.get()
    if (e.pointerType !== 'mouse' || !s.enabled || s.cursorTrail === 'none' || !motionAllowed()) return
    const dt = e.timeStamp - trail.t
    const dx = e.clientX - trail.x, dy = e.clientY - trail.y
    // At most ~60 puffs a second, and only while the pointer actually moves.
    if (dt < 16 || dx * dx + dy * dy < 16) return
    const v = dt < 120 ? { x: (dx / dt) * 1000, y: (dy / dt) * 1000 } : { x: 0, y: 0 }
    trail = { t: e.timeStamp, x: e.clientX, y: e.clientY }
    // Reading the colour forces a style pass, so take it once a second, not on every move.
    if (e.timeStamp - trailColor.at > 1000) trailColor = { at: e.timeStamp, rgb: accentColor() }
    playTrail(fx, s.cursorTrail, { x: e.clientX, y: e.clientY }, v, trailColor.rgb, state.saver, s.trailLength)
  }
  document.addEventListener('pointermove', onTrail, { capture: true, passive: true })
  disposers.push(() => document.removeEventListener('pointermove', onTrail, { capture: true }))

  // ── Moment Cards ──
  /**
   * The character's own square crop (Lumiverse keeps it as `extensions.avatar_crop_image_id`) for the Moment Card's
   * round portrait. The message may show the full picture (the "full avatar" setting); a circle wants the crop.
   * Only for the open character's own messages, and only when the avatar is one of Lumiverse's stored images.
   */
  async function portraitFor(card: HTMLElement | null, avatarSrc: string | null): Promise<string | null> {
    if (!card || !avatarSrc || card.dataset.part === 'user' || !state.characterId || isGroupChat()) return null
    if (!/\/images\/[^/?#]+/.test(avatarSrc)) return null
    try {
      const c = (await ctx.characters.get(state.characterId)) as { extensions?: Record<string, unknown> } | null
      const crop = c?.extensions?.avatar_crop_image_id
      if (typeof crop !== 'string' || !/^[A-Za-z0-9_-]{1,80}$/.test(crop)) return null
      return avatarSrc.replace(/\/images\/[^/?#]+(\?[^#]*)?/, `/images/${crop}?size=lg`)
    } catch {
      return null
    }
  }

  /** `picked`: what was selected in the message when the button was pressed (the card starts with just that). */
  async function makeMoment(messageId: string | null, picked: string | null = null) {
    if (!messageId) return
    const card = cardFor(messageId)
    let name = ''
    let text = ''
    try {
      const msg = await ctx.messages.get?.(messageId)
      if (msg) {
        name = msg.name
        text = msg.content
      }
    } catch {
      /* fall back to DOM */
    }
    if (!text && card) text = (card.querySelector<HTMLElement>('[data-component="MessageContent"]') ?? card).innerText
    if (!name) name = (card?.querySelector('[class*="_name_"]')?.textContent ?? '').trim() || (state.characterName ?? 'Lumiverse')
    const avatarSrc = card?.querySelector('img[src]')?.getAttribute('src') ?? null
    const portraitSrc = await portraitFor(card, avatarSrc)
    const aura = auras.forMessage(messageId)
    await showMomentCard(
      ctx,
      { name, text: plainText(text), avatarSrc, portraitSrc, color: aura?.color ?? rgbCss(charColor()), date: new Date() },
      () => unlock(['shutterbug']),
      picked,
    )
  }

  // ── Pinned moments ──
  /** What is selected inside one message, as a short line (null when nothing, or it's elsewhere). */
  function selectedIn(messageId: string): string | null {
    const raw = selectionIn(messageId)
    const t = raw ? excerpt(raw) : ''
    return t.length > 1 ? t : null
  }
  /** The selected text inside one message, in full (null when nothing, or it's elsewhere). */
  function selectionIn(messageId: string): string | null {
    const sel = window.getSelection()
    const card = cardFor(messageId)
    if (!sel || sel.isCollapsed || !card || !card.contains(sel.anchorNode) || !card.contains(sel.focusNode)) return null
    const t = sel.toString().trim()
    return t.length > 1 ? t : null
  }
  /**
   * Pin a message, or take its pin off. If the reader selected a line, that line is pinned (and a message
   * that is already pinned takes the new line instead of losing its pin).
   */
  function pinMessage(messageId: string | null, picked: string | null = null) {
    // Before the first load has finished, state.chatId isn't set yet; the pin waits for the load below.
    const chatId = state.chatId ?? ctx.getActiveChat()?.chatId ?? null
    if (!messageId || !chatId) return
    const line = picked ?? selectedIn(messageId)
    const card = cardFor(messageId)
    const user = card?.getAttribute('data-part') === 'user'
    const body = card?.querySelector<HTMLElement>('[data-component="MessageContent"]') ?? card
    const text = line ?? excerpt(body?.innerText ?? '')
    const name = card?.querySelector<HTMLElement>('[class*="_name_"]')?.textContent?.trim()
    const ids = ctx.messages.listMessageIds()
    const at = ids.indexOf(messageId)
    const aura = auras.forMessage(messageId)
    pins.whenLoaded(() => {
      const all = pins.get()
      if (isPinned(all, chatId, messageId) && !line) {
        pins.set(removePins(all, chatId, new Set([messageId])))
      } else {
        if (!text) return
        const pin: Pin = {
          id: messageId,
          i: at < 0 ? ids.length : at,
          text,
          whole: !line,
          who: name || (user ? '' : state.characterName ?? ''),
          user,
          color: aura?.color ?? null,
          t: Date.now(),
        }
        pins.set(setPin(all, chatId, pin))
        if (store.get().pinMemory && state.memoriesPermission) void remember(chatId, [pin])
      }
      notifyStatus()
    })
  }
  // Save pins to Lumiverse's memory through the backend (it adds a short fact on the speaker).
  const memoryWaits = new Map<number, (r: { ok: boolean; saved: number; reason?: string }) => void>()
  let memoryReq = 0
  function sendPinsToMemory(chatId: string, list: readonly Pin[]) {
    const items = list.filter((p) => p.who).map((p) => ({ who: p.who, text: excerpt(p.text, PIN_MEMORY_MAX) }))
    if (!items.length) return Promise.resolve({ ok: true, saved: 0, reason: 'unnamed' })
    const req = ++memoryReq
    return new Promise<{ ok: boolean; saved: number; reason?: string }>((resolve) => {
      const done = (r: { ok: boolean; saved: number; reason?: string }) => {
        clearTimeout(timer)
        memoryWaits.delete(req)
        resolve(r)
      }
      const timer = setTimeout(() => done({ ok: false, saved: 0, reason: 'no answer' }), 15_000)
      memoryWaits.set(req, done)
      ctx.sendToBackend({ type: 'pin_memory', req, chatId, items })
    })
  }
  async function remember(chatId: string, list: readonly Pin[]) {
    const r = await sendPinsToMemory(chatId, list)
    if (!r.ok) console.warn('[Lumi Flair] Saving pins to memory failed:', r.reason)
    state.memoryNote = !r.ok
      ? tr('Couldn’t save to Lumiverse memory.')
      : r.saved
        ? tr('Saved to Lumiverse memory.')
        : list.length
          ? tr('Nothing to save: those pins have no speaker name.')
          : null
    notifyStatus()
  }
  disposers.push(() => memoryWaits.clear())
  async function jumpToPin(pin: { id: string }) {
    const res = await storyNav.jump(pin.id)
    if (res === 'missing' && state.chatId) {
      pins.whenLoaded(() => {
        pins.set(removePins(pins.get(), state.chatId ?? undefined, new Set([pin.id])))
        notifyStatus()
      })
    }
    return res
  }

  // A star and a camera button in each message's action pill (Bubble mode).
  try {
    const ui = ctx.ui as unknown as DomDecoratorApi
    const CAM =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="3.5"/></svg>'
    const off = ui.registerDomDecorator?.({
      mount: 'message_actions',
      render: (root, rctx) => {
        const id = /^message:(.+):actions$/.exec(rctx.scope)?.[1]
        if (!id) return
        const star = document.createElement('button')
        star.type = 'button'
        star.className = 'lf-moment-btn lf-pin-btn'
        star.innerHTML = STAR_SVG
        // Tapping can clear a selection, so read it as the press starts.
        let picked: string | null = null
        const syncStar = () => {
          const on = isPinned(pins.get(), state.chatId, id)
          if (star.dataset.on === (on ? '1' : '0')) return
          star.dataset.on = on ? '1' : '0'
          star.setAttribute('aria-pressed', String(on))
          star.title = tr(on ? 'Unpin this moment' : 'Pin this moment')
          star.setAttribute('aria-label', tr(on ? 'Remove from favourite moments' : 'Pin as a favourite moment'))
        }
        star.addEventListener('pointerdown', () => (picked = selectedIn(id)))
        star.addEventListener('click', (e) => {
          e.stopPropagation()
          pinMessage(id, picked)
          picked = null
        })
        syncStar()
        pinListeners.add(syncStar)
        const b = document.createElement('button')
        b.type = 'button'
        b.className = 'lf-moment-btn'
        b.title = tr('Moment Card')
        b.setAttribute('aria-label', tr('Make a Moment Card'))
        b.innerHTML = CAM
        // Like the star: a selection in the message is read as the press starts (the tap can clear it).
        let shot: string | null = null
        b.addEventListener('pointerdown', () => (shot = selectionIn(id)))
        b.addEventListener('click', (e) => {
          e.stopPropagation()
          void makeMoment(id, shot ?? selectionIn(id))
          shot = null
        })
        const th = document.createElement('button')
        th.type = 'button'
        th.className = 'lf-moment-btn'
        th.title = tr('Read in theater mode')
        th.setAttribute('aria-label', tr('Read from here in theater mode'))
        th.innerHTML = THEATER_ICON
        th.addEventListener('click', (e) => {
          e.stopPropagation()
          theater.enter(cardFor(id))
        })
        root.append(star, b, th)
        return () => {
          pinListeners.delete(syncStar)
          star.remove()
          b.remove()
          th.remove()
        }
      },
    })
    if (off) disposers.push(off)
  } catch (err) {
    console.warn('[Lumi Flair] Message action decorator unavailable', err)
  }

  // ── Packs ──
  /** The Lumiverse theme a pack made from the current look should carry. */
  function lookTheme(s: FlairSettings): PackTheme | 'character' | undefined {
    const active = packById(s.activePack)
    if (active?.theme) return active.theme
    if (s.colorSource === 'character') return 'character'
    if (s.colorSource === 'custom') return themeFromColor(s.customColor)
    return undefined
  }

  /** Add (or replace, by name) a user pack in the library, then wear it. */
  function addCustomPack(pack: PackFile, source: 'imported' | 'saved') {
    const base = store.getBase()
    const same = base.customPacks.find((p) => p.name.toLowerCase() === pack.name.toLowerCase())
    const id = same?.id ?? `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
    const stored = { id, name: pack.name, tagline: pack.tagline, swatch: pack.swatch, settings: pack.settings as Record<string, unknown>, theme: pack.theme, source, at: Date.now() }
    // Updating an existing pack keeps its place in the grid; new ones go at the end.
    const list = same ? base.customPacks.map((p) => (p.id === id ? stored : p)) : [...base.customPacks, stored].slice(-MAX_CUSTOM_PACKS)
    store.update({ customPacks: list })
    applyPack(id)
  }

  function applyPack(id: string) {
    const pack = packById(id)
    if (!pack) return
    store.update({ ...pack.settings, ...pack.extra, activePack: id })
    unlock(['packrat'])
    setTimeout(() => fireSendEffect(true), 150)
  }

  // ── Backend link (commands, mood tint results) ──
  disposers.push(
    ctx.onBackendMessage((raw) => {
      if (vault.handleBackend(raw)) return
      const msg = raw as BackendMessage
      if (msg?.type === 'command') runCommand(msg.id)
      const tr2 = raw as { type?: string; ok?: boolean; reason?: string }
      if (tr2?.type === 'theme_result' && !tr2.ok) console.warn('[Lumi Flair] Lumiverse theme matching unavailable:', tr2.reason)
      if (msg?.type === 'pin_memory_result') memoryWaits.get(msg.req)?.(msg)
      if (msg?.type === 'tint_result' && !msg.ok) {
        console.warn('[Lumi Flair] Mood UI tint unavailable:', msg.reason)
      }
    }),
  )

  function cycle<T extends string>(list: readonly T[], current: T): T {
    return list[(list.indexOf(current) + 1) % list.length]
  }

  let panel: { destroy(): void; activate(): void } | null = null

  function runCommand(id: string) {
    const s = store.get()
    switch (id) {
      case 'toggle':
        return store.update({ enabled: !s.enabled })
      case 'next-effect': {
        const next = cycle(SEND_EFFECTS, s.sendEffect)
        store.update({ sendEffect: next })
        if (next !== 'none') fireSendEffect(true)
        return
      }
      case 'preview':
        return fireSendEffect(true)
      case 'spotlight':
        return store.update({ spotlight: !s.spotlight })
      case 'next-scene':
        return store.update({ ambientScene: cycle(SCENES, s.ambientScene) })
      case 'scene-off':
        if (state.chatId) store.update({ chatScenes: { ...store.getBase().chatScenes, [state.chatId]: 'off' } })
        else store.update({ ambientScene: 'off' })
        return
      case 'sound':
        return store.update({ sound: !s.sound })
      case 'soundscape':
        return store.update({ soundscape: !s.soundscape })
      case 'next-pack': {
        const ids = allPacks().map((p) => p.id)
        return applyPack(cycle(ids, ids.includes(s.activePack) ? s.activePack : ids[ids.length - 1]))
      }
      case 'moment':
        return void makeMoment(ctx.messages.getLatestMessageId())
      case 'pin':
        return pinMessage(ctx.messages.getLatestMessageId())
      case 'intro':
        return previewIntro()
      case 'theater':
        return theater.toggle()
      case 'welcome':
        return openWelcome()
      case 'open':
        return panel?.activate()
    }
  }

  // ── Input bar (Extras) quick toggles ──
  const inputActions: { spotlight?: SpindleInputBarActionHandle; flair?: SpindleInputBarActionHandle; theater?: SpindleInputBarActionHandle } = {}
  const SPOT_ICON =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>'
  const FLAIR_ICON =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9z"/></svg>'
  try {
    inputActions.spotlight = ctx.ui.registerInputBarAction({ id: 'spotlight', label: tr('Spotlight mode'), subtitle: tr('Off'), iconSvg: SPOT_ICON })
    disposers.push(inputActions.spotlight.onClick(() => runCommand('spotlight')))
    inputActions.flair = ctx.ui.registerInputBarAction({ id: 'flair', label: tr('Flair effects'), subtitle: tr('On'), iconSvg: FLAIR_ICON })
    disposers.push(inputActions.flair.onClick(() => runCommand('toggle')))
    inputActions.theater = ctx.ui.registerInputBarAction({ id: 'theater', label: tr('Theater mode'), subtitle: tr('Hide the interface and read'), iconSvg: THEATER_ICON })
    disposers.push(inputActions.theater.onClick(() => runCommand('theater')))
    disposers.push(() => {
      inputActions.spotlight?.destroy()
      inputActions.flair?.destroy()
      inputActions.theater?.destroy()
    })
  } catch (err) {
    console.warn('[Lumi Flair] Input bar actions unavailable', err)
  }
  function syncInputBar() {
    const s = store.get()
    inputActions.spotlight?.setSubtitle(s.spotlight ? tr('On — other messages dim on hover') : tr('Off'))
    inputActions.flair?.setSubtitle(s.enabled ? tr('On') : tr('Off'))
  }

  // ── Permissions ──
  type Perm = 'interceptor' | 'app_manipulation' | 'ui_panels' | 'memories'
  const hasPerm = (perm: Perm) =>
    perm === 'interceptor'
      ? state.injectPermission
      : perm === 'app_manipulation'
        ? state.tintPermission
        : perm === 'memories'
          ? state.memoriesPermission
          : state.panelsPermission
  function adoptGranted(granted: string[]) {
    state.tintPermission = granted.includes('app_manipulation')
    state.injectPermission = granted.includes('interceptor')
    state.panelsPermission = granted.includes('ui_panels')
    state.memoriesPermission = granted.includes('memories')
  }
  async function requestPermission(perm: Perm, reason: string): Promise<boolean> {
    try {
      adoptGranted(await ctx.permissions.request([perm], { reason }))
    } catch {
      /* declined */
    }
    syncPrefs(true)
    syncTint()
    applySoundscape()
    notifyStatus()
    return hasPerm(perm)
  }
  const requestInject = () =>
    requestPermission('interceptor', tr('Lumi Flair adds a short note to each prompt so the AI uses text effects, directs scenes and offers choices.'))
  const requestTint = () =>
    requestPermission('app_manipulation', tr('Lumi Flair restyles Lumiverse’s colours to match your Flair Pack, the speaking character or their mood. Your saved theme is never changed — switching it off restores it.'))
  const requestMemories = () =>
    requestPermission('memories', tr('Lumi Flair adds the moments you pin to Lumiverse’s memory as short facts about whoever said them, so the AI can remember them. It only ever adds, and only while this is switched on in Flair.'))
  const requestPanels = () =>
    requestPermission('ui_panels', tr('Lumi Flair shows a small floating volume control for the ambient soundscape. You can drag it anywhere and turn it off in Flair’s Sound settings.'))

  // ── Your sounds (panel) ──
  let preview: { el: HTMLAudioElement; done: () => void; timer: ReturnType<typeof setTimeout> } | null = null
  function stopPreview() {
    const p = preview
    if (!p) return
    preview = null
    clearTimeout(p.timer)
    p.el.pause()
    p.el.removeAttribute('src')
    p.el.load()
    p.done()
  }
  disposers.push(stopPreview)
  const soundActions: SoundActions = {
    list: () => lib.list(),
    has: (id) => lib.has(id),
    saved: () => lib.saved,
    upload: async () => {
      const added: string[] = []
      const errors: string[] = []
      let files: Awaited<ReturnType<typeof ctx.uploads.pickFile>> = []
      try {
        files = await ctx.uploads.pickFile({ accept: SOUND_ACCEPT, multiple: true })
      } catch (err) {
        errors.push(err instanceof Error ? err.message : String(err))
      }
      for (const f of files) {
        try {
          added.push((await lib.add(f)).name)
        } catch (err) {
          errors.push(err instanceof Error ? err.message : String(err))
        }
      }
      return { added, errors }
    },
    remove: (id) => lib.remove(id),
    setLevel: (id, level) => void lib.update(id, { level }),
    preview: (id, onEnd) => {
      stopPreview()
      void lib.url(id).then((url) => {
        if (!url) return onEnd()
        const el = new Audio(url)
        el.volume = Math.min(1, 0.8 * (lib.meta(id)?.level ?? 1))
        const p = { el, done: onEnd, timer: setTimeout(() => stopPreview(), 20_000) }
        preview = p
        el.onended = () => preview === p && stopPreview()
        void el.play().catch(() => preview === p && stopPreview())
      })
    },
    stopPreview,
    onChange: (fn) => lib.onChange(fn),
  }

  // ── Welcome ──
  let welcomeOpen = false
  function openWelcome() {
    if (welcomeOpen) return
    welcomeOpen = true
    try {
      showWelcome(ctx, {
        applyPack,
        activePack: () => store.get().activePack,
        requestInject,
        requestTint,
        hasInject: () => state.injectPermission,
        themeOn: () => state.tintPermission && store.get().uiTheme !== 'off',
        enableTheme: async () => {
          if (!state.tintPermission && !(await requestTint())) return false
          if (store.get().uiTheme === 'off') store.update({ uiTheme: 'pack' })
          return true
        },
        hasTint: () => state.tintPermission,
        enableSound: () => store.update({ sound: true, soundscape: true }),
        soundOn: () => store.get().sound && store.get().soundscape,
        done: () => {
          welcomeOpen = false
          if (!store.get().welcomed) store.update({ welcomed: true })
        },
      })
    } catch (err) {
      welcomeOpen = false
      console.warn('[Lumi Flair] Welcome modal unavailable', err)
    }
  }

  // ── Boot ──
  ctx.permissions
    .getGranted()
    .then((granted) => {
      adoptGranted(granted)
      syncTint()
      syncPrefs(true)
      applySoundscape()
      notifyStatus()
    })
    .catch(() => {})

  // ── Auto-save: flush pending writes whenever the page may be going away ──
  const flushAll = () => {
    store.flush()
    beats.flush()
    badges.flush()
    pins.flush()
  }
  const onHide = () => document.visibilityState === 'hidden' && flushAll()
  window.addEventListener('pagehide', flushAll)
  document.addEventListener('visibilitychange', onHide)
  disposers.push(() => {
    window.removeEventListener('pagehide', flushAll)
    document.removeEventListener('visibilitychange', onHide)
  })

  function adoptSaved(saved: Partial<Record<VaultName, unknown>>, save: boolean) {
    if (saved.heartbeat) beats.hydrate(saved.heartbeat)
    if (saved.achievements) {
      badges.hydrate(normalizeAchievements(saved.achievements))
      if (save) badges.set(badges.get())
    }
    if (saved.heartbeat && save) beats.set(beats.get())
    if (saved.moments) {
      pins.hydrate(normalizePins(saved.moments))
      if (save) pins.set(pins.get())
    }
    if (saved.settings) store.adopt(saved.settings, save)
    notifyStatus()
  }
  vault.onLateNewer = (name, data) => {
    if (!disposed) adoptSaved({ [name]: data }, false)
  }

  vault
    .loadAll()
    .then((saved) => {
      store.hydrate(saved.settings)
      beats.hydrate(saved.heartbeat)
      badges.hydrate(normalizeAchievements(saved.achievements))
      pins.hydrate(normalizePins(saved.moments))
    })
    .then(() => {
      if (disposed) return
      checkActive()
      applyAll()
      store.subscribe(() => applyAll())
      store.subscribe(() => theater.refresh())
      panel = mountPanel(ctx, store, {
        previewSend: () => fireSendEffect(true),
        previewHover: () => {
          const id = ctx.messages.getLatestMessageId()
          if (!id) return
          // Wait two frames so a repeated click restarts the animation.
          running.get(`bloom:${id}`)?.()
          requestAnimationFrame(() => requestAnimationFrame(() => animateMessage(id, 'bloom', true)))
        },
        previewLightning: () => {
          if (!cine.el.isConnected) applyCinematic()
          cine.flash()
        },
        testSound: () => {
          const s = store.get()
          sound.play('receive', s.soundVolume || 0.4, moodPitch(currentMood()?.label ?? null))
          setTimeout(() => sound.play('send', s.soundVolume || 0.4), 650)
        },
        previewSfx: (cue) => playCue(cue, store.get().sfxVolume || 0.5),
        exportTheme: () => exportThemePack(ctx, store.get()),
        requestTintPermission: requestTint,
        requestInjectPermission: requestInject,
        requestPanelsPermission: requestPanels,
        sounds: soundActions,
        applyPack,
        exportPack: () => {
          const s = store.get()
          exportPack(packFromLook(packById(s.activePack)?.name ?? tr('My Flair Pack'), s, lookTheme))
        },
        importPack: async () => {
          const pack = await importPack(ctx)
          if (!pack) return null
          addCustomPack(pack, 'imported')
          return pack.name
        },
        savePack: (name: string) => {
          const s = store.get()
          addCustomPack(packFromLook(name.trim().slice(0, 60) || tr('My Flair Pack'), s, lookTheme), 'saved')
        },
        deletePack: (id: string) => {
          const s = store.getBase()
          store.update({
            customPacks: s.customPacks.filter((p) => p.id !== id),
            ...(s.activePack === id ? { activePack: '' } : {}),
          })
        },
        momentLatest: () => makeMoment(ctx.messages.getLatestMessageId()),
        pinLatest: () => pinMessage(ctx.messages.getLatestMessageId()),
        previewIntro,
        previewSpeaker,
        enterTheater: () => theater.enter(),
        previewTypewriter: (el) => typewriter.preview(el),
        typewriterSupported: () => typewriter.supported,
        unpin: (id) => {
          const chatId = state.chatId
          if (!chatId) return
          pins.whenLoaded(() => {
            pins.set(removePins(pins.get(), chatId, new Set([id])))
            notifyStatus()
          })
        },
        jumpToPin,
        savePinsToMemory: async () => {
          if (!state.memoriesPermission && !(await requestMemories())) return
          const chatId = state.chatId
          if (chatId) await remember(chatId, pins.get()[chatId] ?? [])
        },
        requestMemoriesPermission: requestMemories,
        jumpTo: async (p) => {
          const res = await storyNav.jump(p.id)
          if (res === 'missing' && state.chatId) {
            // The message was deleted (or never existed): drop its point from the heartbeat.
            const all = beats.get()
            const list = all[state.chatId]
            if (list?.some((x) => x.id === p.id)) {
              beats.set({ ...all, [state.chatId]: list.filter((x) => x.id !== p.id) })
              notifyStatus()
            }
          }
          return res
        },
        openWelcome,
        backupSettings: () => {
          flushAll()
          downloadBackup({ ...vault.snapshot(), settings: store.getBase(), achievements: badges.get(), heartbeat: beats.get(), moments: pins.get() }, ctx.manifest?.version ?? '')
        },
        restoreSettings: async () => {
          const saved = await pickBackup(ctx)
          if (!saved || !Object.keys(saved).length) return false
          adoptSaved(saved, true)
          return true
        },
        vaultStatus: () => vault.status,
        onVaultStatus: (fn) => vault.onStatus(fn),
        status,
        onStatus: (fn) => {
          statusListeners.add(fn)
          return () => statusListeners.delete(fn)
        },
      })
      if (!store.get().welcomed) setTimeout(() => !disposed && openWelcome(), 1200)
    })
    .catch((err) => console.error('[Lumi Flair] setup failed', err))
    .finally(() => ctx.ready())

  return () => {
    disposed = true
    flushAll()
    vault.dispose()
    if (state.lastTintKey && state.lastTintKey !== 'none') ctx.sendToBackend({ type: 'mood_tint', accent: null })
    if (state.lastThemeKey && state.lastThemeKey !== 'none') ctx.sendToBackend({ type: 'ui_theme', spec: null })
    panel?.destroy()
    for (const d of disposers.splice(0).reverse()) {
      try {
        d()
      } catch {
        /* best effort */
      }
    }
  }
}
