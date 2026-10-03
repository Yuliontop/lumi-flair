import type { SpindleFrontendContext, SpindleInputBarActionHandle } from 'lumiverse-spindle-types'
import {
  BURST_EFFECTS,
  MAX_CUSTOM_PACKS,
  SCENES,
  SEND_EFFECTS,
  createJsonStore,
  createSettingsStore,
  type BurstEffect,
  type FlairSettings,
  type Light,
  type Scene,
} from './settings'
import { buildCss, colorVarsCss, composerActiveCss, entranceRule, tapGlowRule, type CardAnimation } from './styles'
import { FxCanvas, HOLE_TIMING, parseComputedColor, playBanner, playSendEffect, viewportCenter, type Point, type RGB } from './effects'
import { AmbientCanvas, sceneFromEntries } from './ambient'
import { SoundBoard, type Chime } from './sound'
import { hexToHsl, moodColorFor, moodPitch, parseMoodMap, timeOfDayTint } from './palette'
import { matchTrigger, milestoneAtOrBelow, parseTriggers } from './celebrate'
import { exportThemePack } from './themepack'
import { DirectorState, parseDirection } from './director'
import { Soundscape } from './soundscape'
import { Cinematic, CINEMATIC_CSS, blackHoleWarpRule, cameraShakeRule } from './cinematic'
import { AuraManager } from './aura'
import { ChoiceManager, CHOICES_CSS } from './choices'
import { addPoint, HEARTBEAT_CSS, valenceForLabel, valenceForText, type BeatPoint, type HeartbeatData } from './heartbeat'
import {
  ACHIEVEMENT_CSS,
  ACHIEVEMENTS,
  EMPTY_ACHIEVEMENTS,
  normalizeAchievements,
  onMood,
  onScene,
  onSent,
  type AchievementData,
} from './achievements'
import { MOMENT_CSS, plainText, showMomentCard } from './momentcard'
import { allPacks, bindCustomPacks, exportPack, importPack, packById, packFromLook, type PackFile, type PackTheme } from './packs'
import { PerfGovernor } from './perf'
import { showWelcome, WELCOME_CSS } from './welcome'
import { setLocale, tr } from './i18n'
import { mountPanel, PANEL_CSS, type PanelStatus } from './panel'
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
  message?: { id?: string; swipe_id?: number }
  action?: string
  swipeId?: number
  previousSwipeId?: number
}
type BackendMessage = { type: 'command'; id: string } | { type: 'tint_result'; ok: boolean; reason?: string }

/** The host implements this on ctx.ui at runtime; it is not in the published types yet. */
type DomDecoratorApi = {
  registerDomDecorator?: (o: {
    mount: string
    render: (root: HTMLElement, rctx: { scope: string }) => void | (() => void)
  }) => () => void
}

const AI_FX_WINDOW_MS = 30_000
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
  const badges = createJsonStore<AchievementData>(vault, 'achievements', EMPTY_ACHIEVEMENTS)
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
  }
  const director = new DirectorState()
  const statusListeners = new Set<(s: PanelStatus) => void>()

  // ── Styles ──
  disposers.push(
    ctx.dom.addStyle([PANEL_CSS, CINEMATIC_CSS, CHOICES_CSS, HEARTBEAT_CSS, ACHIEVEMENT_CSS, MOMENT_CSS, WELCOME_CSS, NAVIGATE_CSS].join('\n')),
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
  overlayWrap.append(colorStyle, composerStyle, auraStyle)

  const fx = new FxCanvas(fxEl)
  const ambient = new AmbientCanvas(ambientEl)
  const sound = new SoundBoard()
  const scape = new Soundscape()
  scape.onState = () => notifyStatus()
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
    scape.destroy()
    cine.destroy()
    choices.clear()
    ctx.dom.uninject(overlayWrap)
  })

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
  const motionAllowed = () => !(store.get().respectReducedMotion && reducedMotion.matches)
  const onMotionChange = () => applyAll()
  reducedMotion.addEventListener?.('change', onMotionChange)
  disposers.push(() => reducedMotion.removeEventListener?.('change', onMotionChange))

  const perf = new PerfGovernor(
    () => store.get().perfGovernor && (ambient.current !== 'off' || cine.el.isConnected),
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
  function unlock(ids: string[]) {
    const data = badges.get()
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
    el.style.top = `${18 + existing * 84}px`
    overlay.appendChild(el)
    playSound('sparkle')
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
      autoInject: s.enabled && s.autoInject && (s.textEffects || s.aiEffects || s.sceneDirector || s.choiceChips),
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

  function resolveScene(): Scene {
    if (!motionAllowed() || !ensureAmbientHost()) return 'off'
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
      if (scene !== 'off') unlock(onScene(badges.get(), scene))
    }
    if (scene !== 'off' && s.perfGovernor) perf.start()
    applySoundscape()
  }

  function applyCinematic() {
    const s = store.get()
    const hostOk = ensureAmbientHost()
    const saving = state.saver || perf.saving
    cine.set({
      enabled: s.enabled && s.cinematic && hostOk,
      light: resolveLight(),
      vignette: s.vignette,
      grain: s.grain && !saving && motionAllowed(),
      lightning: s.lightning,
      noFlash: s.noFlash,
      motion: motionAllowed(),
    })
    cine.el.dataset.saver = saving ? '1' : '0'
  }

  function applySoundscape() {
    const s = store.get()
    const onScreen = !!document.querySelector('[data-component="ChatView"]')
    scape.set(s.enabled && s.soundscape && onScreen, sceneRaw(), resolveLight(), s.soundscapeVolume)
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
      directed: dir ? [dir.scene, dir.light, dir.mood].filter(Boolean).join(' · ') : null,
      light: resolveLight(),
      saver: state.saver || perf.saving,
      auraColors: auras.list().map((a) => a.color),
      beats: state.chatId ? beats.get()[state.chatId] ?? [] : [],
      unlocked: badges.get().unlocked,
      soundscape: scape.state,
      uiThemeLabel: state.themeLabel,
      charAura: state.charAura,
      soundscapeKey: scape.playing,
    }
  }
  function notifyStatus() {
    const st = status()
    for (const fn of statusListeners) {
      try {
        fn(st)
      } catch (err) {
        console.error('[Lumi Flair] status listener failed', err)
      }
    }
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
    if (chatChanged) choices.clear()
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
    unlock(onMood(badges.get(), chatId, label))
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
    beats.set(addPoint(beats.get(), chatId, p))
    notifyStatus()
  }
  /** Expressions arrive just after the reply — refine the latest beat with the real mood. */
  function refineLatestBeat(chatId: string, label: string, color: string | null) {
    const list = beats.get()[chatId]
    const last = list?.at(-1)
    if (!last || Date.now() - last.t > 90_000) return
    const lv = valenceForLabel(label)
    if (lv === null) return
    const updated = { ...last, v: lv * 0.65 + last.v * 0.35, label, color }
    beats.set(addPoint(beats.get(), chatId, updated))
    notifyStatus()
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
        if (p.isStreaming || p.isUser || !p.messageId) return
        const chatId = p.chatId ?? state.chatId
        if (chatId) applyDirection(chatId, p.messageId, p.attrs ?? {})
        const raw = (p.attrs?.effect || p.content || '').trim().toLowerCase()
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
    const data = badges.get()
    data.choices += 1
    badges.set({ ...data })
    if (data.choices >= 10) unlock(['choices_10'])
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
    unlock(onSent(badges.get()))
  })

  on('GENERATION_STARTED', (raw) => {
    const p = raw as GenerationStartedPayload
    if (!isActiveChat(p?.chatId) || p?.generationType === 'impersonate') return
    choices.clear()
    startComposer(p?.generationId ?? 'unknown')
  })

  on('STREAM_TOKEN_RECEIVED', (raw) => {
    const g = state.generating
    if (!g) return
    const p = raw as StreamTokenPayload
    if (!p?.generationId || g.id === 'unknown' || p.generationId === g.id) g.tokens++
  })

  on('GENERATION_STOPPED', () => stopComposer())

  on('GENERATION_ENDED', (raw) => {
    const p = raw as GenerationEndedPayload
    if (!state.generating || !p?.generationId || state.generating.id === p.generationId || state.generating.id === 'unknown') {
      stopComposer()
    }
    if (!p?.messageId || p.error || p.generationType === 'impersonate') return
    const now = Date.now()
    state.recentGenerated.set(p.messageId, now)
    for (const [id, t] of state.recentGenerated) if (now - t > AI_FX_WINDOW_MS) state.recentGenerated.delete(id)
    for (const [id, v] of state.pendingAiFx) if (now - v.at > AI_FX_WINDOW_MS) state.pendingAiFx.delete(id)

    if (!isActiveChat(p.chatId)) return
    const s = store.get()
    if (!s.enabled) return
    const messageId = p.messageId
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

  // ── Moment Cards ──
  async function makeMoment(messageId: string | null) {
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
    if (!text && card) text = card.innerText
    if (!name) name = state.characterName ?? 'Lumiverse'
    const avatarSrc = card?.querySelector('img[src]')?.getAttribute('src') ?? null
    const aura = auras.forMessage(messageId)
    await showMomentCard(
      ctx,
      { name, text: plainText(text), avatarSrc, color: aura?.color ?? rgbCss(charColor()), date: new Date() },
      () => unlock(['shutterbug']),
    )
  }
  // A small camera button in each message's action pill (Bubble mode).
  try {
    const ui = ctx.ui as unknown as DomDecoratorApi
    const CAM =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="3.5"/></svg>'
    const off = ui.registerDomDecorator?.({
      mount: 'message_actions',
      render: (root, rctx) => {
        const id = /^message:(.+):actions$/.exec(rctx.scope)?.[1]
        if (!id) return
        const b = document.createElement('button')
        b.type = 'button'
        b.className = 'lf-moment-btn'
        b.title = tr('Moment Card')
        b.setAttribute('aria-label', tr('Make a Moment Card'))
        b.innerHTML = CAM
        b.addEventListener('click', (e) => {
          e.stopPropagation()
          void makeMoment(id)
        })
        root.appendChild(b)
        return () => b.remove()
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
      case 'welcome':
        return openWelcome()
      case 'open':
        return panel?.activate()
    }
  }

  // ── Input bar (Extras) quick toggles ──
  const inputActions: { spotlight?: SpindleInputBarActionHandle; flair?: SpindleInputBarActionHandle } = {}
  const SPOT_ICON =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>'
  const FLAIR_ICON =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9z"/></svg>'
  try {
    inputActions.spotlight = ctx.ui.registerInputBarAction({ id: 'spotlight', label: tr('Spotlight mode'), subtitle: tr('Off'), iconSvg: SPOT_ICON })
    disposers.push(inputActions.spotlight.onClick(() => runCommand('spotlight')))
    inputActions.flair = ctx.ui.registerInputBarAction({ id: 'flair', label: tr('Flair effects'), subtitle: tr('On'), iconSvg: FLAIR_ICON })
    disposers.push(inputActions.flair.onClick(() => runCommand('toggle')))
    disposers.push(() => {
      inputActions.spotlight?.destroy()
      inputActions.flair?.destroy()
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
  async function requestPermission(perm: 'interceptor' | 'app_manipulation', reason: string): Promise<boolean> {
    try {
      const granted = await ctx.permissions.request([perm], { reason })
      if (perm === 'interceptor') state.injectPermission = granted.includes(perm)
      else state.tintPermission = granted.includes(perm)
    } catch {
      /* declined */
    }
    syncPrefs(true)
    syncTint()
    notifyStatus()
    return perm === 'interceptor' ? state.injectPermission : state.tintPermission
  }
  const requestInject = () =>
    requestPermission('interceptor', tr('Lumi Flair adds a short note to each prompt so the AI uses text effects, directs scenes and offers choices.'))
  const requestTint = () =>
    requestPermission('app_manipulation', tr('Lumi Flair restyles Lumiverse’s colours to match your Flair Pack, the speaking character or their mood. Your saved theme is never changed — switching it off restores it.'))

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
      state.tintPermission = granted.includes('app_manipulation')
      state.injectPermission = granted.includes('interceptor')
      syncTint()
      syncPrefs(true)
      notifyStatus()
    })
    .catch(() => {})

  // ── Auto-save: flush pending writes whenever the page may be going away ──
  const flushAll = () => {
    store.flush()
    beats.flush()
    badges.flush()
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
    })
    .then(() => {
      if (disposed) return
      checkActive()
      applyAll()
      store.subscribe(() => applyAll())
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
        exportTheme: () => exportThemePack(ctx, store.get()),
        requestTintPermission: requestTint,
        requestInjectPermission: requestInject,
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
          downloadBackup({ ...vault.snapshot(), settings: store.getBase(), achievements: badges.get(), heartbeat: beats.get() }, ctx.manifest?.version ?? '')
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
