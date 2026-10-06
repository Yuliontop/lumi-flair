// src/sfx-cues.ts
var SFX_CUES = [
  { name: "door-knock", label: "Door knock", use: "someone knocks" },
  { name: "door-creak", label: "Door creak", use: "a door or hinge creaks" },
  { name: "door-slam", label: "Door slam", use: "a door slams" },
  { name: "footsteps", label: "Footsteps", use: "someone walks or approaches" },
  { name: "sword-clash", label: "Sword clash", use: "blades meet" },
  { name: "glass-break", label: "Glass break", use: "glass shatters" },
  { name: "heartbeat", label: "Heartbeat", use: "fear, tension, a charged moment" },
  { name: "thunder", label: "Thunder", use: "thunder rolls" },
  { name: "bell", label: "Bell", use: "a bell tolls" },
  { name: "whoosh", label: "Whoosh", use: "something swings or rushes past" },
  { name: "impact", label: "Impact", use: "a punch or heavy blow lands" },
  { name: "magic", label: "Magic", use: "a spell is cast" },
  { name: "splash", label: "Splash", use: "something hits water" },
  { name: "fire-crackle", label: "Fire crackle", use: "a fire crackles" }
];
var ALIASES = {
  knock: "door-knock",
  knocking: "door-knock",
  "knock-knock": "door-knock",
  "door-knocking": "door-knock",
  creak: "door-creak",
  creaking: "door-creak",
  "door-creaking": "door-creak",
  squeak: "door-creak",
  hinge: "door-creak",
  "door-open": "door-creak",
  "door-opens": "door-creak",
  slam: "door-slam",
  "door-slams": "door-slam",
  "door-shut": "door-slam",
  "door-close": "door-slam",
  "door-closes": "door-slam",
  footstep: "footsteps",
  steps: "footsteps",
  step: "footsteps",
  walking: "footsteps",
  footfalls: "footsteps",
  sword: "sword-clash",
  swords: "sword-clash",
  clash: "sword-clash",
  "blade-clash": "sword-clash",
  "steel-clash": "sword-clash",
  "sword-fight": "sword-clash",
  "sword-clang": "sword-clash",
  "glass-breaks": "glass-break",
  "glass-shatter": "glass-break",
  "glass-smash": "glass-break",
  "breaking-glass": "glass-break",
  shatter: "glass-break",
  shattering: "glass-break",
  "heart-beat": "heartbeat",
  heartbeats: "heartbeat",
  heart: "heartbeat",
  "pounding-heart": "heartbeat",
  "racing-heart": "heartbeat",
  thunderclap: "thunder",
  "thunder-clap": "thunder",
  "thunder-roll": "thunder",
  rumble: "thunder",
  bells: "bell",
  "church-bell": "bell",
  "bell-toll": "bell",
  "bell-ring": "bell",
  toll: "bell",
  ding: "bell",
  swoosh: "whoosh",
  swish: "whoosh",
  "whoosh-by": "whoosh",
  swing: "whoosh",
  punch: "impact",
  hit: "impact",
  thud: "impact",
  thump: "impact",
  blow: "impact",
  smack: "impact",
  "body-hit": "impact",
  spell: "magic",
  "spell-cast": "magic",
  cast: "magic",
  sparkle: "magic",
  magical: "magic",
  enchant: "magic",
  splashing: "splash",
  "water-splash": "splash",
  plunge: "splash",
  crackle: "fire-crackle",
  crackling: "fire-crackle",
  "fire-crackling": "fire-crackle",
  fire: "fire-crackle",
  campfire: "fire-crackle",
  bonfire: "fire-crackle",
  flames: "fire-crackle"
};
function cueName(raw) {
  if (!raw)
    return null;
  const n = raw.trim().toLowerCase().replace(/[\s_]+/g, "-").replace(/[^a-z0-9-]/g, "");
  if (!n)
    return null;
  if (SFX_CUES.some((c) => c.name === n))
    return n;
  return ALIASES[n] ?? null;
}

// src/settings.ts
var MAX_CUSTOM_PACKS = 24;
var SEND_EFFECTS = ["sparkle", "ripple", "comet", "confetti", "creamy", "splash", "blackhole", "petalstorm", "none"];
var CURSOR_TRAILS = ["splash", "creamy", "petalstorm", "blackhole", "comet", "confetti", "none"];
var BURST_EFFECTS = ["sparkle", "ripple", "comet", "confetti", "creamy", "splash", "blackhole", "petalstorm"];
var SCENES = ["off", "snow", "rain", "embers", "fireflies", "petals", "stars"];
var LIGHTS = ["none", "dawn", "day", "dusk", "night", "candle", "storm", "neon"];
var UI_SOUNDS = ["send", "receive", "fanfare", "achievement", "sparkle", "key"];
var SOUND_SLOTS = [
  "always",
  ...SCENES.filter((s) => s !== "off").map((s) => `scene:${s}`),
  ...LIGHTS.filter((l) => l !== "none").map((l) => `light:${l}`),
  ...UI_SOUNDS.map((u) => `ui:${u}`),
  ...SFX_CUES.map((c) => `sfx:${c.name}`)
];
var TEXT_FX = ["shake", "glow", "whisper", "rainbow", "pulse", "big", "typewriter", "fade", "glitch", "flicker"];
var LOOK_KEYS = [
  "sendEffect",
  "sendIntensity",
  "userEntrance",
  "characterEntrance",
  "hoverStyle",
  "hoverTarget",
  "hoverStrength",
  "traceSpeed",
  "streamingAura",
  "colorSource",
  "customColor",
  "userColor",
  "userCustomColor",
  "ambientScene",
  "swipeTransition",
  "lightDefault",
  "textFxOff",
  "introSound"
];
var DEFAULT_MOOD_MAP = [
  "happy, joy, excited, laughing, smile, playful, cheerful, triumphant = #ffc94d",
  "sad, crying, lonely, melancholy, wistful, grief = #5b8cff",
  "angry, annoyed, furious, hostile = #ff4d4d",
  "scared, worried, fear, nervous, tense, ominous, eerie, dread = #9b6bff",
  "surprised, shocked, awe = #4dd8ff",
  "embarrassed, blushing, flirty, love, romantic, tender = #ff7eb6",
  "thinking, confused, serious, mysterious, curious = #8fa3b8",
  "smirk, smug, mischievous = #c58bff",
  "calm, peaceful, serene, cozy = #7fd6a8"
].join(`
`);
var DEFAULT_TRIGGERS = [
  "happy birthday => confetti",
  "congratulations => confetti",
  "level up => sparkle",
  "shooting star => comet"
].join(`
`);
var DEFAULT_SETTINGS = {
  enabled: true,
  respectReducedMotion: true,
  sendEffect: "sparkle",
  sendIntensity: 1,
  cursorTrail: "none",
  trailLength: 1,
  userEntrance: "pop",
  characterEntrance: "bloom",
  hoverStyle: "trace",
  hoverTarget: "all",
  hoverStrength: 1,
  traceSpeed: 3,
  streamingAura: true,
  colorSource: "theme",
  customColor: "#a78bfa",
  userColor: "match",
  userCustomColor: "#f59e0b",
  timeOfDay: false,
  moodGlow: true,
  moodTintUI: false,
  moodMap: DEFAULT_MOOD_MAP,
  textEffects: true,
  textFxFrequency: "every",
  textFxOff: [],
  autoInject: true,
  aiEffects: true,
  ambientScene: "off",
  ambientAuto: true,
  ambientDensity: 1,
  ambientOpacity: 0.6,
  chatScenes: {},
  swipeTransition: "slide",
  composerGlow: true,
  characterProfiles: {},
  milestones: true,
  triggers: DEFAULT_TRIGGERS,
  celebrated: {},
  sound: false,
  soundVolume: 0.4,
  spotlight: false,
  sceneDirector: true,
  lightDefault: "none",
  soundscape: false,
  soundscapeVolume: 0.35,
  soundWidget: false,
  soundWidgetPos: null,
  soundWidgetCollapsed: null,
  pinMemory: false,
  typewriter: false,
  typewriterCps: 40,
  typewriterSound: true,
  theaterScale: 1.35,
  theaterSpeed: 3,
  theaterScroll: true,
  intro: true,
  introGroup: true,
  introSound: "",
  soundUnfocused: "keep",
  soundUnfocusedLevel: 0.3,
  customSounds: {},
  aiSfx: false,
  sfxVolume: 0.5,
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
  activePack: "",
  welcomed: false,
  uiTheme: "off",
  customPacks: [],
  uiThemeDepth: "full",
  perfGovernor: true,
  tapGlow: true
};
var MAX_MAP_ENTRIES = 300;
function clamp(n, min, max, fallback) {
  const v = typeof n === "number" && Number.isFinite(n) ? n : fallback;
  return Math.min(max, Math.max(min, v));
}
function pick(v, allowed, fallback) {
  return typeof v === "string" && allowed.includes(v) ? v : fallback;
}
var SOUND_ID = /^snd_[a-z0-9]{4,40}$/;
function soundSlots(v) {
  const out = {};
  if (!v || typeof v !== "object")
    return out;
  for (const [k, id] of Object.entries(v)) {
    if (SOUND_SLOTS.includes(k) && typeof id === "string" && SOUND_ID.test(id))
      out[k] = id;
  }
  return out;
}
function point(v) {
  if (!v || typeof v !== "object")
    return null;
  const { x, y } = v;
  if (typeof x !== "number" || typeof y !== "number" || !Number.isFinite(x) || !Number.isFinite(y))
    return null;
  return { x: Math.round(Math.max(-4000, Math.min(20000, x))), y: Math.round(Math.max(-4000, Math.min(20000, y))) };
}
function bool(v, fallback) {
  return typeof v === "boolean" ? v : fallback;
}
function hex(v, fallback) {
  return typeof v === "string" && /^#[0-9a-f]{6}$/i.test(v) ? v : fallback;
}
function text(v, fallback, max = 4000) {
  return typeof v === "string" ? v.slice(0, max) : fallback;
}
function record(v, each) {
  const out = {};
  if (!v || typeof v !== "object")
    return out;
  const entries = Object.entries(v).slice(-MAX_MAP_ENTRIES);
  for (const [k, raw] of entries) {
    const val = each(raw);
    if (val !== undefined)
      out[k] = val;
  }
  return out;
}
var HEX6 = /^#[0-9a-f]{6}$/i;
function normalizeStoredPacks(v) {
  if (!Array.isArray(v))
    return [];
  const out = [];
  const seen = new Set;
  for (const raw of v.slice(-MAX_CUSTOM_PACKS)) {
    if (!raw || typeof raw !== "object")
      continue;
    const r = raw;
    const id = typeof r.id === "string" && /^custom-[a-z0-9-]{1,40}$/.test(r.id) ? r.id : null;
    if (!id || seen.has(id) || !r.settings || typeof r.settings !== "object")
      continue;
    seen.add(id);
    const sw = Array.isArray(r.swatch) ? r.swatch : [];
    out.push({
      id,
      name: typeof r.name === "string" && r.name.trim() ? r.name.trim().slice(0, 60) : "Custom pack",
      tagline: typeof r.tagline === "string" ? r.tagline.slice(0, 120) : "",
      swatch: [HEX6.test(String(sw[0])) ? String(sw[0]) : "#9370db", HEX6.test(String(sw[1])) ? String(sw[1]) : "#c7b4ff"],
      settings: r.settings,
      theme: r.theme,
      source: r.source === "saved" ? "saved" : "imported",
      at: typeof r.at === "number" ? r.at : 0
    });
  }
  return out;
}
function normalize(raw) {
  const r = raw && typeof raw === "object" ? raw : {};
  const d = DEFAULT_SETTINGS;
  return {
    enabled: bool(r.enabled, d.enabled),
    respectReducedMotion: bool(r.respectReducedMotion, d.respectReducedMotion),
    sendEffect: pick(r.sendEffect, SEND_EFFECTS, d.sendEffect),
    sendIntensity: clamp(r.sendIntensity, 0.25, 2, d.sendIntensity),
    cursorTrail: pick(r.cursorTrail, CURSOR_TRAILS, d.cursorTrail),
    trailLength: clamp(r.trailLength, 0.25, 2, d.trailLength),
    userEntrance: pick(r.userEntrance, ["pop", "rise", "none"], d.userEntrance),
    characterEntrance: pick(r.characterEntrance, ["bloom", "none"], d.characterEntrance),
    hoverStyle: pick(r.hoverStyle, ["glow", "trace", "neon", "none"], d.hoverStyle),
    hoverTarget: pick(r.hoverTarget, ["all", "character", "user"], d.hoverTarget),
    hoverStrength: clamp(r.hoverStrength, 0.25, 2, d.hoverStrength),
    traceSpeed: clamp(r.traceSpeed, 1, 8, d.traceSpeed),
    streamingAura: bool(r.streamingAura, d.streamingAura),
    colorSource: pick(r.colorSource, ["theme", "custom", "character"], d.colorSource),
    customColor: hex(r.customColor, d.customColor),
    userColor: pick(r.userColor, ["match", "warm", "custom"], d.userColor),
    userCustomColor: hex(r.userCustomColor, d.userCustomColor),
    timeOfDay: bool(r.timeOfDay, d.timeOfDay),
    moodGlow: bool(r.moodGlow, d.moodGlow),
    moodTintUI: bool(r.moodTintUI, d.moodTintUI),
    moodMap: text(r.moodMap, d.moodMap),
    textEffects: bool(r.textEffects, d.textEffects),
    textFxFrequency: pick(r.textFxFrequency, ["every", "often", "sparing"], d.textFxFrequency),
    textFxOff: Array.isArray(r.textFxOff) ? TEXT_FX.filter((fx) => r.textFxOff.includes(fx)) : [...d.textFxOff],
    autoInject: bool(r.autoInject, d.autoInject),
    aiEffects: bool(r.aiEffects, d.aiEffects),
    ambientScene: pick(r.ambientScene, SCENES, d.ambientScene),
    ambientAuto: bool(r.ambientAuto, d.ambientAuto),
    ambientDensity: clamp(r.ambientDensity, 0.25, 2, d.ambientDensity),
    ambientOpacity: clamp(r.ambientOpacity, 0.1, 1, d.ambientOpacity),
    chatScenes: record(r.chatScenes, (x) => typeof x === "string" && (x === "auto" || SCENES.includes(x)) ? x : undefined),
    swipeTransition: pick(r.swipeTransition, ["slide", "fade", "none"], d.swipeTransition),
    composerGlow: bool(r.composerGlow, d.composerGlow),
    characterProfiles: record(r.characterProfiles, normalizeProfile),
    milestones: bool(r.milestones, d.milestones),
    triggers: text(r.triggers, d.triggers),
    celebrated: record(r.celebrated, (x) => typeof x === "number" && Number.isFinite(x) ? x : undefined),
    sound: bool(r.sound, d.sound),
    soundVolume: clamp(r.soundVolume, 0, 1, d.soundVolume),
    spotlight: bool(r.spotlight, d.spotlight),
    sceneDirector: bool(r.sceneDirector, d.sceneDirector),
    lightDefault: pick(r.lightDefault, LIGHTS, d.lightDefault),
    soundscape: bool(r.soundscape, d.soundscape),
    soundscapeVolume: clamp(r.soundscapeVolume, 0, 1, d.soundscapeVolume),
    soundWidget: bool(r.soundWidget, d.soundWidget),
    soundWidgetPos: point(r.soundWidgetPos),
    soundWidgetCollapsed: typeof r.soundWidgetCollapsed === "boolean" ? r.soundWidgetCollapsed : null,
    pinMemory: bool(r.pinMemory, d.pinMemory),
    typewriter: bool(r.typewriter, d.typewriter),
    typewriterCps: Math.round(clamp(r.typewriterCps, 10, 120, d.typewriterCps)),
    typewriterSound: bool(r.typewriterSound, d.typewriterSound),
    theaterScale: clamp(r.theaterScale, 1, 2.2, d.theaterScale),
    theaterSpeed: Math.round(clamp(r.theaterSpeed, 1, 8, d.theaterSpeed)),
    theaterScroll: bool(r.theaterScroll, d.theaterScroll),
    intro: bool(r.intro, d.intro),
    introGroup: bool(r.introGroup, d.introGroup),
    introSound: typeof r.introSound === "string" && SOUND_ID.test(r.introSound) ? r.introSound : "",
    soundUnfocused: pick(r.soundUnfocused, ["keep", "dim", "mute"], d.soundUnfocused),
    soundUnfocusedLevel: clamp(r.soundUnfocusedLevel, 0.05, 0.8, d.soundUnfocusedLevel),
    customSounds: soundSlots(r.customSounds),
    aiSfx: bool(r.aiSfx, d.aiSfx),
    sfxVolume: clamp(r.sfxVolume, 0, 1, d.sfxVolume),
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
    uiTheme: pick(r.uiTheme, ["off", "pack", "character"], d.uiTheme),
    customPacks: normalizeStoredPacks(r.customPacks),
    uiThemeDepth: pick(r.uiThemeDepth, ["accent", "full"], d.uiThemeDepth),
    perfGovernor: bool(r.perfGovernor, d.perfGovernor),
    tapGlow: bool(r.tapGlow, d.tapGlow)
  };
}
function normalizeProfile(raw) {
  if (!raw || typeof raw !== "object")
    return;
  const src = raw;
  const full = normalize(src);
  const out = {};
  for (const k of LOOK_KEYS) {
    if (k in src)
      out[k] = full[k];
  }
  return out;
}
function createSettingsStore(vault) {
  let base = { ...DEFAULT_SETTINGS };
  let activeCharacterId = null;
  let saveTimer;
  let loaded = false;
  const listeners = new Set;
  function effective() {
    const profile = activeCharacterId ? base.characterProfiles[activeCharacterId] : undefined;
    return profile ? { ...base, ...profile } : base;
  }
  function persist() {
    if (!loaded)
      return;
    if (saveTimer)
      clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      saveTimer = undefined;
      vault.save("settings", base);
    }, 250);
  }
  function emit() {
    const s = effective();
    for (const fn of listeners) {
      try {
        fn(s);
      } catch (err) {
        console.error("[Lumi Flair] settings listener failed", err);
      }
    }
  }
  function update(patch) {
    const profileId = activeCharacterId && base.characterProfiles[activeCharacterId] ? activeCharacterId : null;
    const toBase = {};
    const toProfile = {};
    for (const [k, v] of Object.entries(patch)) {
      if (profileId && LOOK_KEYS.includes(k))
        toProfile[k] = v;
      else
        toBase[k] = v;
    }
    let next = normalize({ ...base, ...toBase });
    if (profileId && Object.keys(toProfile).length) {
      const merged = normalize({ ...next, ...next.characterProfiles[profileId], ...toProfile });
      const profile = {};
      for (const k of LOOK_KEYS)
        profile[k] = merged[k];
      next = { ...next, characterProfiles: { ...next.characterProfiles, [profileId]: profile } };
    }
    base = next;
    persist();
    emit();
  }
  return {
    hydrate(raw) {
      base = normalize(raw);
      loaded = true;
      return effective();
    },
    adopt(raw, save = false) {
      base = normalize(raw);
      if (save)
        persist();
      emit();
    },
    get: effective,
    getBase: () => base,
    update,
    reset() {
      base = { ...DEFAULT_SETTINGS, celebrated: base.celebrated, welcomed: base.welcomed };
      persist();
      emit();
    },
    setActiveCharacter(id) {
      if (id === activeCharacterId)
        return;
      const involved = !!(activeCharacterId && base.characterProfiles[activeCharacterId]) || !!(id && base.characterProfiles[id]);
      activeCharacterId = id;
      if (involved)
        emit();
    },
    activeCharacter: () => activeCharacterId,
    hasProfile: (id) => !!(id && base.characterProfiles[id]),
    createProfile(id) {
      const current = effective();
      const profile = {};
      for (const k of LOOK_KEYS)
        profile[k] = current[k];
      base = { ...base, characterProfiles: { ...base.characterProfiles, [id]: profile } };
      persist();
      emit();
    },
    deleteProfile(id) {
      const { [id]: _drop, ...rest } = base.characterProfiles;
      base = { ...base, characterProfiles: rest };
      persist();
      emit();
    },
    patchSilently(patch) {
      base = normalize({ ...base, ...patch });
      persist();
    },
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    flush() {
      if (saveTimer) {
        clearTimeout(saveTimer);
        saveTimer = undefined;
        vault.save("settings", base);
      }
    }
  };
}
function createJsonStore(vault, name, fallback) {
  let value = fallback;
  let loaded = false;
  let timer;
  const waiting = [];
  return {
    hydrate(raw) {
      if (raw !== undefined && raw !== null)
        value = raw;
      loaded = true;
      for (const fn of waiting.splice(0)) {
        try {
          fn();
        } catch (err) {
          console.error("[Lumi Flair] queued update failed", err);
        }
      }
      return value;
    },
    get: () => value,
    whenLoaded(fn) {
      if (loaded)
        fn();
      else
        waiting.push(fn);
    },
    set(next) {
      value = next;
      if (!loaded)
        return;
      if (timer)
        clearTimeout(timer);
      timer = setTimeout(() => {
        timer = undefined;
        vault.save(name, value);
      }, 500);
    },
    flush() {
      if (timer) {
        clearTimeout(timer);
        timer = undefined;
        vault.save(name, value);
      }
    }
  };
}

// src/styles.ts
var CARD = ':is([data-component="BubbleMessage"],[data-component="MinimalMessage"])[data-message-id]';
var MSG = ':is([data-component="BubbleMessage"],[data-component="MinimalMessage"])';
var WARM = "#f5a524";
function mix(pct, color = "var(--lf-glow)") {
  return `color-mix(in srgb, ${color} ${typeof pct === "number" ? `${pct}%` : pct}, transparent)`;
}
var R = (f) => `calc(var(--lf-room, 14px) * ${f})`;
function colorVarsCss(s, moodColor, tod) {
  const base = s.colorSource === "custom" ? s.customColor : s.colorSource === "character" ? "var(--lf-char, var(--lumiverse-primary, #9370db))" : "var(--lumiverse-primary, #9370db)";
  const tinted = tod ? `color-mix(in oklab, var(--lf-base), ${tod.color} ${tod.amount}%)` : "var(--lf-base)";
  const final = moodColor ? `color-mix(in oklab, var(--lf-tod) 25%, ${moodColor})` : "var(--lf-tod)";
  const user = s.userColor === "warm" ? WARM : s.userColor === "custom" ? s.userCustomColor : "var(--lf-c)";
  return `
:root {
  --lf-base: ${base};
  --lf-tod: ${tinted};
  --lf-c: ${final};
  --lf-c-user: ${user};
  --lf-speed: ${s.traceSpeed}s;
  transition: --lf-c 1.4s ease, --lf-gen .6s ease;
}
:root ${CARD} { --lf-glow: var(--lf-c); }
:root ${CARD}[data-part="user"] { --lf-glow: var(--lf-c-user); }
`;
}
var KEYFRAMES = `
@property --lf-angle { syntax: '<angle>'; inherits: false; initial-value: 0deg; }
@property --lf-c { syntax: '<color>'; inherits: true; initial-value: #9370db; }
@property --lf-gen { syntax: '<number>'; inherits: true; initial-value: 0; }
@property --lf-breath { syntax: '<number>'; inherits: false; initial-value: .5; }

@keyframes lf-spin { to { --lf-angle: 360deg; } }
@keyframes lf-breathe { 0%, 100% { opacity: .35; } 50% { opacity: 1; } }
@keyframes lf-pop {
  0%   { transform: translateY(14px) scale(.965); opacity: 0; }
  55%  { transform: translateY(-2px) scale(1.008); opacity: 1;
         box-shadow: 0 0 0 1px ${mix(65)}, 0 0 ${R(1)} 0 ${mix(50)}, 0 0 ${R(1.8)} ${R(-0.8)} ${mix(30)}, inset 0 0 ${R(1.4)} ${mix(22)}; }
  100% { transform: none; opacity: 1; }
}
@keyframes lf-rise {
  0%   { transform: translateY(24px); opacity: 0; }
  100% { transform: none; opacity: 1; }
}
@keyframes lf-bloom {
  0%   { }
  25%  { box-shadow: 0 0 0 1px ${mix(70)}, 0 0 ${R(1)} 0 ${mix(55)}, 0 0 ${R(1.8)} ${R(-0.8)} ${mix(35)}, inset 0 0 ${R(1.6)} ${mix(25)}; }
  100% { }
}
@keyframes lf-swipe-left  { from { transform: translateX(32px);  opacity: 0; } to { transform: none; opacity: 1; } }
@keyframes lf-swipe-right { from { transform: translateX(-32px); opacity: 0; } to { transform: none; opacity: 1; } }
@keyframes lf-swipe-fade  { from { opacity: 0; filter: blur(4px); } to { opacity: 1; filter: none; } }
@keyframes lf-composer { 0%, 100% { --lf-breath: .35; } 50% { --lf-breath: 1; } }

@keyframes lf-shake {
  0%, 100% { transform: translate(0, 0) rotate(0); }
  20% { transform: translate(-.7px, .5px) rotate(-.7deg); }
  40% { transform: translate(.6px, -.6px) rotate(.6deg); }
  60% { transform: translate(-.5px, -.3px) rotate(-.4deg); }
  80% { transform: translate(.7px, .4px) rotate(.5deg); }
}
@keyframes lf-glowtext { 0%, 100% { text-shadow: 0 0 4px ${mix(45, "var(--lf-fx)")}; } 50% { text-shadow: 0 0 10px ${mix(75, "var(--lf-fx)")}, 0 0 22px ${mix(35, "var(--lf-fx)")}; } }
@keyframes lf-rainbow { to { background-position: 200% 0; } }
@keyframes lf-type { to { clip-path: inset(0 0 0 0); } }
@keyframes lf-fadein { from { opacity: 0; filter: blur(3px); } to { opacity: 1; filter: none; } }
@keyframes lf-glitch {
  0%, 86%, 100% { transform: none; clip-path: none; }
  88% { transform: translate(-1px, 1px) skewX(-6deg); clip-path: inset(10% 0 55% 0); }
  90% { transform: translate(2px, -1px); clip-path: inset(60% 0 8% 0); }
  92% { transform: translate(-1px, 0) skewX(4deg); clip-path: inset(30% 0 30% 0); }
  94% { transform: none; clip-path: none; }
}
@keyframes lf-flicker { 0%, 100% { opacity: 1; } 8% { opacity: .55; } 10% { opacity: 1; } 47% { opacity: .9; } 49% { opacity: .35; } 52% { opacity: 1; } 80% { opacity: .8; } }
@keyframes lf-pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.08); } }
`;
function ringDeclarations() {
  return `
  content: '';
  position: absolute;
  inset: 0; top: 0; right: 0; bottom: 0; left: 0;
  width: auto; height: auto;
  border-radius: inherit;
  padding: 1.5px;
  box-sizing: border-box;
  background: conic-gradient(from var(--lf-angle),
    transparent 0deg 190deg,
    ${mix(45)} 250deg,
    var(--lf-glow) 315deg,
    color-mix(in srgb, var(--lf-glow) 40%, #fff) 338deg,
    var(--lf-glow) 348deg,
    transparent 360deg);
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  mask-composite: exclude;
  pointer-events: none;
  z-index: 3;
  display: block;`;
}
function cardTransitionCss() {
  return `
:root ${CARD} {
  transition: box-shadow .25s ease, background var(--lcs-transition-fast, 120ms ease), opacity .35s ease, filter .35s ease;
}
`;
}
function hoverCss(s) {
  if (s.hoverStyle === "none")
    return "";
  const k = s.hoverStrength;
  const filter = s.hoverTarget === "character" ? ':not([data-part="user"])' : s.hoverTarget === "user" ? '[data-part="user"]' : "";
  const sel = `:root ${CARD}${filter}:not([data-part="streaming"])`;
  const p = (n) => Math.min(100, Math.round(n * k));
  const shadows = {
    glow: [
      `0 0 0 1px ${mix(p(50))}`,
      `0 0 ${R(1)} 0 ${mix(p(40))}`,
      `0 0 ${R(1.8)} ${R(-0.8)} ${mix(p(30))}`,
      `inset 0 0 ${R(1.2)} ${mix(p(14))}`
    ].join(", "),
    trace: [`0 0 ${R(1)} 0 ${mix(p(26))}`, `inset 0 0 ${R(1)} ${mix(p(10))}`].join(", "),
    neon: [
      `0 0 0 1.5px ${mix(p(85))}`,
      `0 0 ${R(0.45)} 0 ${mix(p(70))}`,
      `0 0 ${R(1)} 0 ${mix(p(45))}`,
      `0 0 ${R(1.8)} ${R(-0.8)} ${mix(p(35))}`,
      `inset 0 0 ${R(1.1)} ${mix(p(24))}`
    ].join(", ")
  };
  let css = `
@media (hover: hover) {
  ${sel}:hover { box-shadow: ${shadows[s.hoverStyle]}; }
}
`;
  if (s.hoverStyle === "trace") {
    css += `
${sel}::after {${ringDeclarations()}
  opacity: 0;
  transition: opacity .3s ease;
  animation: lf-spin var(--lf-speed) linear infinite;
  animation-play-state: paused;
}
:root [data-component="MinimalMessage"][data-message-id]${filter}:not([data-part="streaming"])::after { inset: -1px; }
@media (hover: hover) {
  ${sel}:hover::after { opacity: 1; animation-play-state: running; }
}
`;
  }
  return css;
}
function streamingCss(s) {
  if (!s.streamingAura)
    return "";
  return `
:root ${CARD}[data-part="streaming"]::after {${ringDeclarations()}
  animation: lf-spin calc(var(--lf-speed) * .8) linear infinite, lf-breathe 2.4s ease-in-out infinite;
}
:root [data-component="MinimalMessage"][data-message-id][data-part="streaming"]::after { inset: -1px; }
`;
}
function textFxRules(s, scope, only) {
  const T = (fx) => `:root ${scope} [data-lf="${fx}"]`;
  const rules = {
    shake: `${T("shake")} { display: inline-block; animation: lf-shake .45s linear infinite; }`,
    glow: `${T("glow")} { color: color-mix(in srgb, var(--lf-fx) 40%, var(--lumiverse-text, #fff)); animation: lf-glowtext 2.4s ease-in-out infinite; }`,
    whisper: `${T("whisper")} { font-size: .88em; font-style: italic; opacity: .68; letter-spacing: .04em; }`,
    rainbow: `${T("rainbow")} {
  background: linear-gradient(90deg, #ff5f6d, #ffc371, #7dffb0, #5bc8ff, #b18cff, #ff5f6d);
  background-size: 200% 100%;
  -webkit-background-clip: text; background-clip: text;
  -webkit-text-fill-color: transparent; color: transparent;
  animation: lf-rainbow 3s linear infinite;
}`,
    typewriter: `${T("typewriter")} { display: inline-block; vertical-align: bottom; clip-path: inset(0 100% 0 0); animation: lf-type 1.6s steps(28, end) .15s forwards; }`,
    fade: `${T("fade")} { animation: lf-fadein 1.6s ease both; }`,
    pulse: `${T("pulse")} { display: inline-block; animation: lf-pulse 1.4s ease-in-out infinite; }`,
    big: `${T("big")} { font-size: 1.3em; font-weight: 700; }`,
    glitch: `${T("glitch")} { position: relative; display: inline-block; animation: lf-glitch 2.6s steps(1) infinite;
  text-shadow: .06em 0 rgba(255,0,80,.55), -.06em 0 rgba(0,220,255,.55); }`,
    flicker: `${T("flicker")} { animation: ${s.noFlash ? "none" : "lf-flicker 3.4s linear infinite"}; opacity: ${s.noFlash ? ".75" : "1"}; }`
  };
  return `:root ${scope} [data-lf] { --lf-fx: var(--lf-c, var(--lumiverse-primary)); }
` + only.map((fx) => rules[fx] ?? "").join(`
`);
}
function textFxCss(s) {
  const picker = textFxRules(s, ".lf-fx-pick", TEXT_FX);
  if (!s.textEffects)
    return picker;
  const on = TEXT_FX.filter((fx) => !s.textFxOff.includes(fx));
  return picker + `
` + textFxRules(s, ':is([data-component="BubbleMessage"],[data-component="MinimalMessage"],.lf-fx-demo)', on);
}
function spotlightCss(s) {
  if (!s.spotlight)
    return "";
  return `
@media (hover: hover) {
  :root [data-component="MessageList"]:hover ${CARD}:not(:hover) { opacity: .38; filter: saturate(.55); }
}
`;
}
function reducedMotionCss(s) {
  if (!s.respectReducedMotion)
    return "";
  return `
@media (prefers-reduced-motion: reduce) {
  :root ${CARD}::after { animation: none !important; }
  :root ${CARD}[data-part="streaming"]::after { opacity: .8; }
  :root ${MSG} [data-lf] { animation: none !important; clip-path: none !important; }
  :root [data-component="InputArea"] { animation: none !important; }
}
`;
}
var OVERLAY_CSS = `
.lf-overlay {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 2147483000;
}
.lf-overlay canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
}
/* Ambient scene: injected into ChatView between the wallpaper/scene layers
   (z 0–2) and the chat body (z 3) — behind messages and UI, above the background. */
.lf-ambient-host { display: contents; }
canvas.lf-ambient {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 2;
  pointer-events: none;
  display: block;
  opacity: var(--lf-ambient-opacity, .6);
}
`;
function buildCss(s) {
  if (!s.enabled)
    return [OVERLAY_CSS, KEYFRAMES].join(`
`);
  return [
    OVERLAY_CSS,
    KEYFRAMES,
    cardTransitionCss(),
    hoverCss(s),
    streamingCss(s),
    textFxCss(s),
    spotlightCss(s),
    reducedMotionCss(s)
  ].join(`
`);
}
function composerActiveCss(level) {
  return `
:root { --lf-gen: ${Math.max(0, Math.min(1, level)).toFixed(2)}; }
:root [data-component="InputArea"] {
  box-shadow:
    0 0 0 1px color-mix(in srgb, var(--lf-c) calc(var(--lf-breath) * 70%), transparent),
    0 0 calc(6px + 10px * var(--lf-gen)) color-mix(in srgb, var(--lf-c) calc(var(--lf-breath) * 45%), transparent);
  animation: lf-composer 1.8s ease-in-out infinite;
}
`;
}
function entranceRule(messageId, kind) {
  const id = typeof CSS !== "undefined" && CSS.escape ? CSS.escape(messageId) : messageId.replace(/"/g, "\\\"");
  const sel = `:root ${MSG}[data-message-id="${id}"]`;
  const spec = {
    pop: { anim: "lf-pop 560ms cubic-bezier(.2, 1.25, .4, 1) both", ms: 560 },
    rise: { anim: "lf-rise 420ms cubic-bezier(.2, .8, .2, 1) both", ms: 420 },
    bloom: { anim: "lf-bloom 1400ms ease-out both", ms: 1400 },
    "swipe-left": { anim: "lf-swipe-left 320ms cubic-bezier(.2, .8, .2, 1) both", ms: 320 },
    "swipe-right": { anim: "lf-swipe-right 320ms cubic-bezier(.2, .8, .2, 1) both", ms: 320 },
    "swipe-fade": { anim: "lf-swipe-fade 360ms ease-out both", ms: 360 }
  };
  const { anim, ms } = spec[kind];
  return { css: `${sel} { animation: ${anim}; }`, durationMs: ms };
}
function exportableCss(s) {
  const solid = { ...s, enabled: true, textEffects: false, spotlight: false };
  const base = s.colorSource === "custom" ? s.customColor : s.colorSource === "character" ? "var(--lf-char, var(--lumiverse-primary, #9370db))" : "var(--lumiverse-primary, #9370db)";
  const user = s.userColor === "warm" ? WARM : s.userColor === "custom" ? s.userCustomColor : base;
  return [
    "/* Generated by Lumi Flair — hover glow + streaming aura */",
    `:root { --lf-c: ${base}; --lf-c-user: ${user}; --lf-speed: ${s.traceSpeed}s; }`,
    `:root ${CARD} { --lf-glow: var(--lf-c); }`,
    `:root ${CARD}[data-part="user"] { --lf-glow: var(--lf-c-user); }`,
    "@property --lf-angle { syntax: '<angle>'; inherits: false; initial-value: 0deg; }",
    "@keyframes lf-spin { to { --lf-angle: 360deg; } }",
    "@keyframes lf-breathe { 0%, 100% { opacity: .35; } 50% { opacity: 1; } }",
    cardTransitionCss(),
    hoverCss(solid),
    streamingCss(solid),
    reducedMotionCss(solid)
  ].join(`
`);
}
function tapGlowRule(messageId) {
  const id = typeof CSS !== "undefined" && CSS.escape ? CSS.escape(messageId) : messageId.replace(/"/g, "\\\"");
  return `:root ${MSG}[data-message-id="${id}"] { box-shadow: 0 0 0 1px ${mix(55)}, 0 0 ${R(1)} 0 ${mix(42)}, inset 0 0 ${R(1.2)} ${mix(16)}; }`;
}

// src/effects.ts
var rand = (a, b) => a + Math.random() * (b - a);
var easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
function parseComputedColor(value) {
  const v = value.trim();
  const srgb = v.match(/^color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/i);
  if (srgb) {
    return { r: +srgb[1] * 255, g: +srgb[2] * 255, b: +srgb[3] * 255 };
  }
  const nums = v.match(/[\d.]+/g);
  if (/^rgba?\(/i.test(v) && nums && nums.length >= 3) {
    return { r: +nums[0], g: +nums[1], b: +nums[2] };
  }
  return null;
}
function rgbToHsl({ r, g, b }) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min)
    return [0, 0, l * 100];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r)
    h = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g)
    h = (b - r) / d + 2;
  else
    h = (r - g) / d + 4;
  return [h * 60, s * 100, l * 100];
}
var rgba = (c, a) => `rgba(${Math.round(c.r)}, ${Math.round(c.g)}, ${Math.round(c.b)}, ${a})`;
function lighten(c, amt) {
  return {
    r: c.r + (255 - c.r) * amt,
    g: c.g + (255 - c.g) * amt,
    b: c.b + (255 - c.b) * amt
  };
}
function paletteFrom(base) {
  const [h, s, l] = rgbToHsl(base);
  const sat = Math.max(s, 55);
  const light = Math.min(Math.max(l, 55), 72);
  return [
    `hsl(${h}, ${sat}%, ${light}%)`,
    `hsl(${h + 35}, ${sat}%, ${light}%)`,
    `hsl(${h - 35}, ${sat}%, ${light}%)`,
    `hsl(${h + 180}, ${Math.min(sat, 70)}%, ${light + 6}%)`,
    `hsl(${h}, 30%, 94%)`
  ];
}

class FxCanvas {
  canvas;
  g;
  particles = [];
  raf = 0;
  last = 0;
  rect = { left: 0, top: 0, width: 0, height: 0 };
  constructor(canvas) {
    this.canvas = canvas;
    this.g = canvas.getContext("2d");
  }
  resize() {
    const r = this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.rect = { left: r.left, top: r.top, width: r.width, height: r.height };
    const w = Math.max(1, Math.round(r.width * dpr));
    const h = Math.max(1, Math.round(r.height * dpr));
    if (this.canvas.width !== w)
      this.canvas.width = w;
    if (this.canvas.height !== h)
      this.canvas.height = h;
    this.g?.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  local(p) {
    return { x: p.x - this.rect.left, y: p.y - this.rect.top };
  }
  get height() {
    return this.rect.height;
  }
  get width() {
    return this.rect.width;
  }
  get idle() {
    return !this.raf;
  }
  spawn(list) {
    this.particles.push(...list);
    if (!this.raf) {
      this.last = performance.now();
      this.raf = requestAnimationFrame(this.tick);
    }
  }
  prepare() {
    this.resize();
  }
  tick = (now) => {
    const g = this.g;
    if (!g)
      return;
    const dt = Math.min(0.05, Math.max(0, (now - this.last) / 1000));
    this.last = Math.max(this.last, now);
    g.clearRect(0, 0, this.rect.width, this.rect.height);
    const alive = [];
    for (const p of this.particles) {
      if (p.delay > 0) {
        p.delay -= dt;
        alive.push(p);
        continue;
      }
      p.age += dt;
      if (p.age >= p.life)
        continue;
      try {
        this.step(p, dt);
        this.draw(g, p);
      } catch {
        continue;
      }
      alive.push(p);
    }
    this.particles = alive;
    if (alive.length) {
      this.raf = requestAnimationFrame(this.tick);
    } else {
      this.raf = 0;
      g.clearRect(0, 0, this.rect.width, this.rect.height);
    }
  };
  step(p, dt) {
    if (p.kind === "stream" && p.stream)
      return stepStream(p, p.stream, dt);
    if (p.kind === "singularity" && p.hole)
      return stepHole(p, p.hole, dt);
    if (p.kind === "petal" && p.petal)
      return stepPetal(p, p.petal, dt);
    if (p.kind === "mote" && p.to) {
      const r = (p.maxR ?? 0) * Math.pow(1 - p.age / p.life, 1.5);
      const a = p.rot + p.vr * p.age;
      p.x = p.to.x + Math.cos(a) * r;
      p.y = p.to.y + Math.sin(a) * r;
      return;
    }
    if (p.kind === "head" && p.from && p.to) {
      const t = easeOutCubic(Math.min(1, p.age / p.life));
      const bow = Math.sin(t * Math.PI) * p.vx;
      p.x = p.from.x + (p.to.x - p.from.x) * t + bow;
      p.y = p.from.y + (p.to.y - p.from.y) * t;
      p.trail.unshift({ x: p.x, y: p.y });
      if (p.trail.length > 18)
        p.trail.pop();
      return;
    }
    const drag = Math.pow(p.drag, dt);
    p.vx *= drag;
    p.vy = p.vy * drag + p.gravity * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.rot += p.vr * dt;
  }
  draw(g, p) {
    const t = p.age / p.life;
    const fade = t < 0.15 ? t / 0.15 : 1 - Math.max(0, (t - 0.55) / 0.45);
    switch (p.kind) {
      case "dot":
      case "mote": {
        g.globalCompositeOperation = "lighter";
        g.globalAlpha = fade;
        g.fillStyle = p.color;
        g.beginPath();
        g.arc(p.x, p.y, p.size * (1 - t * 0.5), 0, Math.PI * 2);
        g.fill();
        break;
      }
      case "star": {
        g.globalCompositeOperation = "lighter";
        g.globalAlpha = fade * (0.65 + 0.35 * Math.sin(p.age * 30 + p.rot));
        g.fillStyle = p.color;
        const s = p.size * (1.2 - t * 0.6);
        g.save();
        g.translate(p.x, p.y);
        g.rotate(p.rot);
        g.beginPath();
        for (let i = 0;i < 8; i++) {
          const r = i % 2 === 0 ? s * 2.4 : s * 0.55;
          const a = i * Math.PI / 4;
          g.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        g.closePath();
        g.fill();
        g.restore();
        break;
      }
      case "rect": {
        g.globalCompositeOperation = "source-over";
        g.globalAlpha = Math.min(1, fade * 1.2);
        g.fillStyle = p.color;
        g.save();
        g.translate(p.x, p.y);
        g.rotate(p.rot);
        g.scale(1, Math.cos(p.age * 9 + p.rot));
        g.fillRect(-p.size, -p.size * 0.45, p.size * 2, p.size * 0.9);
        g.restore();
        break;
      }
      case "ring": {
        const r = Math.max(0, (p.maxR ?? 120) * easeOutCubic(Math.max(0, t)));
        g.globalCompositeOperation = "lighter";
        g.globalAlpha = (1 - t) * 0.9;
        g.strokeStyle = p.color;
        g.lineWidth = Math.max(0.5, p.size * (1 - t));
        g.beginPath();
        g.ellipse(p.x, p.y, r, r * 0.62, 0, 0, Math.PI * 2);
        g.stroke();
        break;
      }
      case "text": {
        const rise = easeOutCubic(Math.min(1, t * 2.5)) * 18;
        g.globalCompositeOperation = "source-over";
        g.globalAlpha = fade;
        g.font = `600 ${p.size}px system-ui, -apple-system, "Segoe UI", sans-serif`;
        g.textAlign = "center";
        g.textBaseline = "middle";
        g.shadowColor = p.color;
        g.shadowBlur = 18;
        g.fillStyle = "#fff";
        g.fillText(p.label ?? "", p.x, p.y - rise);
        g.shadowBlur = 0;
        break;
      }
      case "stream": {
        if (p.stream)
          drawStream(g, p, p.stream, fade);
        break;
      }
      case "singularity": {
        if (p.hole)
          drawHole(g, p, p.hole, this.rect.width, this.rect.height);
        break;
      }
      case "petal": {
        if (p.petal)
          drawPetal(g, p, p.petal, fade);
        break;
      }
      case "head": {
        g.globalCompositeOperation = "lighter";
        const trail = p.trail ?? [];
        for (let i = trail.length - 1;i > 0; i--) {
          const k = 1 - i / trail.length;
          g.globalAlpha = k * 0.55 * fade;
          g.strokeStyle = p.color;
          g.lineWidth = p.size * k * 1.4;
          g.lineCap = "round";
          g.beginPath();
          g.moveTo(trail[i].x, trail[i].y);
          g.lineTo(trail[i - 1].x, trail[i - 1].y);
          g.stroke();
        }
        const glow = g.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 4);
        glow.addColorStop(0, "rgba(255,255,255,0.95)");
        glow.addColorStop(0.25, p.color);
        glow.addColorStop(1, "rgba(0,0,0,0)");
        g.globalAlpha = fade;
        g.fillStyle = glow;
        g.beginPath();
        g.arc(p.x, p.y, p.size * 4, 0, Math.PI * 2);
        g.fill();
        break;
      }
    }
    g.globalAlpha = 1;
    g.globalCompositeOperation = "source-over";
  }
  destroy() {
    if (this.raf)
      cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.particles = [];
  }
}
var STREAM_GRAVITY = 1900;
function stepStream(p, st, dt) {
  if (st.water)
    return stepWater(p, st, dt);
  const shouldHave = Math.min(st.total, Math.floor(p.age / st.emitFor * st.total));
  while (st.emitted < shouldHave) {
    const i = st.emitted++;
    const t = i / st.total;
    const pulse = 0.86 + 0.14 * Math.sin(t * Math.PI * 7);
    const spread = 0.06 + 0.26 * Math.min(1, t * 1.6);
    const wobble = Math.sin(t * 23) * 0.03 + rand(-spread, spread);
    const v = st.speed * pulse * (1 - Math.abs(wobble) * 0.9) * rand(0.9, 1.04);
    st.drops.push({
      x: p.x + rand(-st.baseR * 0.6, st.baseR * 0.6),
      y: p.y,
      vx: Math.sin(wobble) * v,
      vy: -Math.cos(wobble) * v,
      r: st.baseR * (1.2 - t * 0.5) * rand(0.75, 1.2),
      i,
      age: 0,
      life: 99
    });
    if (i % 2 === 0) {
      const ma = rand(-1, 1) * (spread + 0.18);
      const mv = st.speed * rand(0.55, 0.9);
      st.drops.push({
        x: p.x + rand(-st.baseR, st.baseR),
        y: p.y - rand(0, 10),
        vx: Math.sin(ma) * mv,
        vy: -Math.cos(ma) * mv,
        r: rand(1.4, 3.2),
        i: -2,
        age: 0,
        life: 99
      });
    }
  }
  const next = [];
  for (const d of st.drops) {
    d.age += dt;
    if (d.age >= d.life)
      continue;
    if (!d.splash && d.vy > -st.speed * 0.25 && d.vy < st.speed * 0.2)
      d.vx += rand(-140, 140) * dt;
    d.vx *= Math.pow(0.7, dt);
    d.vy += STREAM_GRAVITY * dt;
    d.x += d.vx * dt;
    d.y += d.vy * dt;
    if (!d.splash && d.vy > 0 && d.y >= st.floorY) {
      if (d.i < 0)
        continue;
      const n = d.r > 7 ? 2 : 1;
      for (let k = 0;k < n; k++) {
        next.push({
          x: d.x,
          y: st.floorY - 1,
          vx: rand(-170, 170),
          vy: rand(-260, -90),
          r: d.r * rand(0.28, 0.45),
          i: -1,
          age: 0,
          life: rand(0.35, 0.6),
          splash: true
        });
      }
      continue;
    }
    next.push(d);
  }
  st.drops = next;
}
function drawStream(g, p, st, fade) {
  if (st.water)
    return drawWater(g, p, st, fade);
  const pal = st.palette;
  const t = p.age / p.life;
  const alpha = Math.min(1, fade * 1.6) * (t > 0.75 ? 1 - (t - 0.75) / 0.25 : 1);
  if (alpha <= 0)
    return;
  const jet = st.drops.filter((d) => d.i >= 0 && d.vy < -st.speed * 0.3).sort((a, b) => a.i - b.i);
  g.globalCompositeOperation = "source-over";
  g.globalAlpha = alpha;
  g.lineCap = "round";
  g.lineJoin = "round";
  const ribbon = (extra, style) => {
    g.strokeStyle = style;
    g.fillStyle = style;
    for (let k = 1;k < jet.length; k++) {
      const a = jet[k - 1], b = jet[k];
      if (b.i - a.i > 3 || Math.hypot(a.x - b.x, a.y - b.y) > (a.r + b.r) * 2.6)
        continue;
      g.lineWidth = Math.max(1, Math.min(a.r, b.r) * 1.9 + extra);
      g.beginPath();
      g.moveTo(a.x, a.y);
      g.lineTo(b.x, b.y);
      g.stroke();
    }
    for (const d of st.drops) {
      const sp = Math.hypot(d.vx, d.vy);
      const stretch = 1 + Math.min(0.9, sp / 1400);
      const ang = Math.atan2(d.vy, d.vx);
      g.beginPath();
      g.ellipse(d.x, d.y, Math.max(0.5, d.r * stretch + extra / 2), Math.max(0.5, d.r / Math.sqrt(stretch) + extra / 2), ang, 0, Math.PI * 2);
      g.fill();
    }
  };
  g.save();
  g.translate(0, 2.5);
  g.globalAlpha = alpha * 0.55;
  ribbon(4, pal.shade);
  g.restore();
  g.globalAlpha = alpha;
  ribbon(3, pal.edge);
  ribbon(0, pal.body);
  g.fillStyle = pal.shine;
  g.globalAlpha = alpha * 0.85;
  for (const d of st.drops) {
    if (d.r < 2.2)
      continue;
    g.beginPath();
    g.ellipse(d.x - d.r * 0.32, d.y - d.r * 0.38, d.r * 0.34, d.r * 0.22, -0.6, 0, Math.PI * 2);
    g.fill();
  }
  g.globalAlpha = alpha;
  if (p.age < st.emitFor + 0.25) {
    const k = Math.max(0, 1 - Math.max(0, p.age - st.emitFor) / 0.25);
    const r = st.baseR * (1.25 + 0.2 * Math.sin(p.age * 40)) * k;
    if (r > 0.5) {
      g.globalAlpha = alpha;
      g.fillStyle = pal.edge;
      g.beginPath();
      g.ellipse(p.x, p.y + 1, r * 1.5 + 1.5, r * 0.8 + 1.5, 0, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = pal.body;
      g.beginPath();
      g.ellipse(p.x, p.y, r * 1.5, r * 0.8, 0, 0, Math.PI * 2);
      g.fill();
    }
  }
  g.globalAlpha = 1;
}
var waterDrag = (r) => 2.6 / Math.max(0.8, r);
function waterChild(d, scale, side, kick, gen) {
  const sp = Math.hypot(d.vx, d.vy) || 1;
  const nx = -d.vy / sp;
  const ny = d.vx / sp;
  const f = rand(0.93, 1.03);
  const off = d.r * 0.35 * side;
  return {
    x: d.x + nx * off,
    y: d.y + ny * off,
    vx: d.vx * f + nx * kick * side,
    vy: d.vy * f + ny * kick * side,
    r: d.r * scale,
    i: d.i,
    age: 0,
    life: 99,
    gen,
    splitAt: rand(0.2, 0.36) * (1 + gen * 0.4)
  };
}
function stepWater(p, st, dt) {
  const tilt = st.tilt ?? 0;
  const shouldHave = Math.min(st.total, Math.floor(p.age / st.emitFor * st.total));
  while (st.emitted < shouldHave) {
    const i = st.emitted++;
    const t = i / st.total;
    const born = t * st.emitFor;
    const late = Math.max(0, p.age - born);
    const surge = 0.86 + 0.14 * Math.min(1, t / 0.08);
    const close = t > 0.72 ? 1 - 0.5 * Math.pow((t - 0.72) / 0.28, 1.4) : 1;
    const pulse = 0.95 + 0.05 * Math.sin(t * Math.PI * 9);
    const v = st.speed * surge * close * pulse * rand(0.995, 1.005);
    const a = tilt + Math.sin(born * 6.5) * 0.06 + rand(-0.005, 0.005);
    const vx = Math.sin(a) * v;
    const vy = -Math.cos(a) * v;
    st.drops.push({
      x: p.x + vx * late,
      y: p.y + vy * late + 0.5 * STREAM_GRAVITY * late * late,
      vx,
      vy: vy + STREAM_GRAVITY * late,
      r: st.baseR * rand(0.97, 1.03) * (close * 0.6 + 0.4),
      i,
      age: late,
      life: 99,
      gen: 0,
      splitAt: rand(0.16, 0.3)
    });
  }
  const next = [];
  for (const d of st.drops) {
    d.age += dt;
    if (d.age >= d.life) {
      d.dead = true;
      continue;
    }
    if (d.ripple) {
      next.push(d);
      continue;
    }
    const gen = d.gen ?? 3;
    if (!d.splash && gen < 2 && d.splitAt !== undefined && d.age >= d.splitAt && d.r > 3 && (gen === 0 || (d.i & 1) === 0)) {
      d.dead = true;
      if (gen === 0 && d.i % 3 !== 0) {
        if (d.i % 3 === 1) {
          const sp = waterChild(d, rand(0.18, 0.3), Math.random() < 0.5 ? 1 : -1, rand(110, 240), 3);
          sp.i = -2;
          next.push(sp);
        }
        continue;
      }
      const big = gen === 0 ? 1.4 : 1;
      const kick = rand(30, 90) * (1 + gen * 0.8);
      const side = Math.random() < 0.5 ? 1 : -1;
      const a = waterChild(d, rand(0.72, 0.82) * big, side, kick, gen + 1);
      const b = waterChild(d, rand(0.52, 0.64) * big, -side, kick * rand(0.8, 1.4), gen + 1);
      a.link = b;
      next.push(a, b);
      if (gen === 0) {
        const sp = waterChild(d, rand(0.18, 0.3), Math.random() < 0.5 ? 1 : -1, rand(110, 240), 3);
        sp.i = -2;
        next.push(sp);
      }
      continue;
    }
    const drag = Math.exp(-waterDrag(d.r) * dt);
    d.vx *= drag;
    d.vy = d.vy * drag + STREAM_GRAVITY * dt;
    d.x += d.vx * dt;
    d.y += d.vy * dt;
    if (!d.splash && d.vy > 0 && d.y >= st.floorY) {
      d.dead = true;
      if (d.r < 2.6)
        continue;
      next.push({ x: d.x, y: st.floorY, vx: 0, vy: 0, r: Math.max(2, d.r), i: -1, age: 0, life: rand(0.4, 0.65), splash: true, ripple: true });
      const n = d.r > 5 ? 2 : 1;
      for (let k = 0;k < n; k++) {
        next.push({ x: d.x, y: st.floorY - 1, vx: rand(-220, 220), vy: rand(-330, -110), r: d.r * rand(0.25, 0.45), i: -1, age: 0, life: rand(0.35, 0.6), splash: true, gen: 3 });
      }
      continue;
    }
    next.push(d);
  }
  st.drops = next;
}
function addEllipse(path, x, y, rx, ry, rot) {
  path.moveTo(x + Math.cos(rot) * rx, y + Math.sin(rot) * rx);
  path.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2, true);
}
function addRibbon(path, pts) {
  const n = pts.length;
  const nx = [], ny = [];
  for (let k = 0;k < n; k++) {
    const a = pts[Math.max(0, k - 1)], b = pts[Math.min(n - 1, k + 1)];
    const dx = b.x - a.x, dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    nx.push(-dy / len);
    ny.push(dx / len);
  }
  const r = pts.map((_, k) => (pts[Math.max(0, k - 1)].r + pts[k].r * 2 + pts[Math.min(n - 1, k + 1)].r) / 4);
  path.moveTo(pts[0].x + nx[0] * r[0], pts[0].y + ny[0] * r[0]);
  for (let k = 1;k < n; k++)
    path.lineTo(pts[k].x + nx[k] * r[k], pts[k].y + ny[k] * r[k]);
  const e = pts[n - 1], ea = Math.atan2(ny[n - 1], nx[n - 1]);
  path.arc(e.x, e.y, r[n - 1], ea, ea - Math.PI, true);
  for (let k = n - 2;k >= 0; k--)
    path.lineTo(pts[k].x - nx[k] * r[k], pts[k].y - ny[k] * r[k]);
  const s0 = pts[0], sa = Math.atan2(ny[0], nx[0]);
  path.arc(s0.x, s0.y, r[0], sa + Math.PI, sa, true);
  path.closePath();
}
function drawWater(g, p, st, fade) {
  const pal = st.palette;
  const t = p.age / p.life;
  const alpha = Math.min(1, fade * 1.6) * (t > 0.75 ? 1 - (t - 0.75) / 0.25 : 1);
  if (alpha <= 0)
    return;
  const drops = st.drops.filter((d) => !d.ripple);
  const col = drops.filter((d) => d.gen === 0).sort((a, b) => a.i - b.i);
  const chains = [];
  let chain = [];
  for (let k = 0;k < col.length; k++) {
    const a = col[k - 1], b = col[k];
    if (a && b.i - a.i <= 2 && Math.hypot(a.x - b.x, a.y - b.y) < (a.r + b.r) * 1.6) {
      chain.push(b);
    } else {
      if (chain.length)
        chains.push(chain);
      chain = [b];
    }
  }
  if (chain.length)
    chains.push(chain);
  const body = new Path2D;
  const spray = new Path2D;
  for (const c of chains) {
    if (c.length > 1)
      addRibbon(body, c);
    else
      addEllipse(body, c[0].x, c[0].y, c[0].r, c[0].r, 0);
  }
  for (const d of drops) {
    if (d.gen === 0)
      continue;
    const sp = Math.hypot(d.vx, d.vy);
    const stretch = 1 + Math.min(0.8, sp / 1600);
    const ang = Math.atan2(d.vy, d.vx);
    if (d.r < 2.6) {
      const r = d.r * 0.85 + 0.3;
      addEllipse(spray, d.x, d.y, r * stretch, r / Math.sqrt(stretch), ang);
      continue;
    }
    const wob = d.r > 3.5 ? 1 + 0.14 * Math.sin(d.age * 34 + d.i) : 1;
    addEllipse(body, d.x, d.y, d.r * stretch * wob, d.r / Math.sqrt(stretch) / wob, ang);
    const l = d.link;
    if (l && !l.dead && d.age < 0.07) {
      const len = Math.hypot(l.x - d.x, l.y - d.y);
      const w = Math.max(0.6, Math.min(d.r, l.r) * 0.45 * (1 - d.age / 0.07));
      if (len > 1)
        addEllipse(body, (d.x + l.x) / 2, (d.y + l.y) / 2, len / 2, w, Math.atan2(l.y - d.y, l.x - d.x));
    }
  }
  if (p.age < st.emitFor + 0.2) {
    const k = Math.max(0, 1 - Math.max(0, p.age - st.emitFor) / 0.2);
    const r = st.baseR * (1.15 + 0.15 * Math.sin(p.age * 38)) * k;
    if (r > 0.5)
      addEllipse(body, p.x, p.y, r * 1.3, r * 0.75, 0);
  }
  g.globalCompositeOperation = "source-over";
  g.lineCap = "round";
  g.lineJoin = "round";
  g.fillStyle = pal.body;
  g.globalAlpha = alpha * 0.22;
  g.fill(body);
  g.strokeStyle = pal.edge;
  g.fillStyle = pal.edge;
  g.lineWidth = 1.6;
  g.globalAlpha = alpha * 0.9;
  g.stroke(body);
  g.fill(spray);
  g.strokeStyle = pal.shine;
  g.globalAlpha = alpha * 0.75;
  g.lineWidth = Math.max(1, st.baseR * 0.3);
  g.beginPath();
  for (const c of chains) {
    if (c.length < 3)
      continue;
    for (let k = 0;k < c.length; k++) {
      const pa = c[Math.max(0, k - 1)], pb = c[Math.min(c.length - 1, k + 1)];
      const len = Math.hypot(pb.x - pa.x, pb.y - pa.y) || 1;
      let nx = -(pb.y - pa.y) / len, ny = (pb.x - pa.x) / len;
      if (nx > 0 || nx === 0 && ny > 0)
        nx = -nx, ny = -ny;
      const o = c[k].r * 0.45;
      if (k === 0)
        g.moveTo(c[k].x + nx * o, c[k].y + ny * o);
      else
        g.lineTo(c[k].x + nx * o, c[k].y + ny * o);
    }
  }
  g.stroke();
  g.strokeStyle = pal.edge;
  g.lineWidth = 1.4;
  for (const [lo, hi, a] of [[0, 0.5, 0.75], [0.5, 1, 0.3]]) {
    g.globalAlpha = alpha * a;
    g.beginPath();
    for (const d of st.drops) {
      if (!d.ripple)
        continue;
      const q = d.age / d.life;
      if (q < lo || q >= hi)
        continue;
      const rx = d.r * (1.2 + q * 5);
      g.moveTo(d.x + rx, d.y);
      g.ellipse(d.x, d.y, rx, rx * 0.28, 0, 0, Math.PI * 2);
    }
    g.stroke();
  }
  g.fillStyle = pal.shine;
  for (const d of drops) {
    if (d.r < 2.6 || d.gen === 0)
      continue;
    g.globalAlpha = alpha * 0.9;
    g.beginPath();
    g.ellipse(d.x - d.r * 0.36, d.y - d.r * 0.36, d.r * 0.36, d.r * 0.2, -0.75, 0, Math.PI * 2);
    g.fill();
    if (d.r < 4)
      continue;
    g.globalAlpha = alpha * 0.4;
    g.beginPath();
    g.ellipse(d.x + d.r * 0.4, d.y + d.r * 0.38, d.r * 0.24, d.r * 0.1, -0.75, 0, Math.PI * 2);
    g.fill();
  }
  g.globalCompositeOperation = "lighter";
  g.fillStyle = "#ffffff";
  g.globalAlpha = alpha * 0.9;
  g.beginPath();
  for (const d of drops) {
    if (d.r < 1.8 || d.gen === 0 || (d.i * 7 + 3 & 7) !== 0)
      continue;
    const tw = Math.max(0, Math.sin(d.age * 22 + d.i));
    if (tw < 0.4)
      continue;
    const sz = Math.min(d.r, 5) * 1.5 * tw;
    for (let n = 0;n < 8; n++) {
      const rr = n % 2 === 0 ? sz : sz * 0.22;
      const a = n * Math.PI / 4;
      if (n === 0)
        g.moveTo(d.x + rr, d.y);
      else
        g.lineTo(d.x + Math.cos(a) * rr, d.y + Math.sin(a) * rr);
    }
    g.closePath();
  }
  g.fill();
  g.globalCompositeOperation = "source-over";
  g.globalAlpha = 1;
}
var smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
function dustRadius(d, t, horizon) {
  if (t <= d.start)
    return d.r0;
  const p = Math.min(1, (t - d.start) / (d.arrive - d.start));
  return horizon + (d.r0 - horizon) * (1 - Math.pow(p, 2.3));
}
function holeRadius(h, t) {
  const T = h.T;
  const grow = smooth(T.form, T.form + 0.45, t);
  const fed = h.R * (1 + 0.28 * (h.eaten / Math.max(1, h.dust.length)));
  const dotR = Math.max(2.5, h.R * 0.07);
  if (t < T.collapseStart)
    return fed * grow;
  if (t < T.collapseEnd) {
    const u = (t - T.collapseStart) / (T.collapseEnd - T.collapseStart);
    return fed + (dotR - fed) * Math.pow(u, 2.2);
  }
  if (t < T.detonate)
    return dotR * (1 + 0.28 * Math.sin(t * 70));
  return 0;
}
function stepHole(p, h, dt) {
  const t = p.age;
  const horizon = Math.max(4, holeRadius(h, t) * 0.55);
  for (const d of h.dust) {
    if (!d.alive)
      continue;
    if (t < h.T.form)
      continue;
    d.r = dustRadius(d, t, horizon);
    d.a += 95 / Math.pow(Math.max(d.r, 12), 0.62) * dt;
    if (t >= d.arrive) {
      d.alive = false;
      h.eaten++;
      h.flare = Math.min(1.6, h.flare + 0.09);
    }
  }
  h.flare *= Math.exp(-5 * dt);
}
function drawHole(g, p, h, w, hgt) {
  const t = p.age;
  const T = h.T;
  const grow = smooth(T.form, T.form + 0.45, t);
  const coreR = holeRadius(h, t);
  const det = T.detonate;
  const collapsing = smooth(T.collapseStart, T.collapseEnd, t);
  const white = smooth(T.collapseStart + (T.collapseEnd - T.collapseStart) * 0.45, T.collapseEnd, t);
  if (t < det + 0.3) {
    const k = grow * (t < det ? 1 + 0.25 * collapsing : 1 - (t - det) / 0.3);
    const wr = h.R * 7;
    const well = g.createRadialGradient(h.cx, h.cy, 0, h.cx, h.cy, wr);
    well.addColorStop(0, `rgba(0,0,0,${Math.min(0.8, 0.62 * k)})`);
    well.addColorStop(0.4, `rgba(0,0,0,${Math.min(0.45, 0.3 * k)})`);
    well.addColorStop(1, "rgba(0,0,0,0)");
    g.globalCompositeOperation = "source-over";
    g.globalAlpha = 1;
    g.fillStyle = well;
    g.fillRect(h.cx - wr, h.cy - wr, wr * 2, wr * 2);
  }
  if (t >= T.form && t < T.feedEnd + 0.1) {
    g.globalCompositeOperation = "lighter";
    g.lineCap = "round";
    g.globalAlpha = Math.min(1, (t - T.form) * 3) * 0.95;
    const horizon = Math.max(4, coreR * 0.55);
    const lag = 0.07;
    const byColor = new Map;
    for (const d of h.dust) {
      if (!d.alive)
        continue;
      let list = byColor.get(d.color);
      if (!list)
        byColor.set(d.color, list = []);
      list.push(d);
    }
    for (const [color, list] of byColor) {
      g.strokeStyle = color;
      g.lineWidth = 2;
      g.beginPath();
      for (const d of list) {
        const om = 95 / Math.pow(Math.max(d.r, 12), 0.62);
        const br = dustRadius(d, t - lag, horizon);
        const ba = d.a - om * lag;
        g.moveTo(h.cx + Math.cos(ba) * br, h.cy + Math.sin(ba) * br * 0.78);
        g.lineTo(h.cx + Math.cos(d.a) * d.r, h.cy + Math.sin(d.a) * d.r * 0.78);
      }
      g.stroke();
    }
  }
  if (coreR > 0.5 && t < det) {
    const cs = Math.max(0, t - T.collapseStart);
    const spin = t * 7 + cs * cs * 45;
    const diskK = grow * (1 - smooth(T.collapseStart, T.collapseEnd - 0.1, t));
    const disk = (front) => {
      if (diskK <= 0.01)
        return;
      g.save();
      g.translate(h.cx, h.cy);
      g.rotate(-0.32);
      g.scale(1, 0.32);
      g.globalCompositeOperation = "lighter";
      const from = front ? 0 : Math.PI;
      const to = front ? Math.PI : Math.PI * 2;
      const bands = [
        [2.6, h.glow, 0.35],
        [2.15, h.rim, 0.6],
        [1.75, h.hot, 0.9]
      ];
      for (const [m, col, a] of bands) {
        g.globalAlpha = a * diskK;
        g.strokeStyle = col;
        g.lineWidth = coreR * (m > 2.4 ? 1.2 : 0.75);
        g.setLineDash([coreR * 0.9, coreR * 0.35]);
        g.lineDashOffset = -spin * coreR * (3.2 - m);
        g.beginPath();
        g.arc(0, 0, coreR * m, from, to);
        g.stroke();
      }
      g.setLineDash([]);
      g.restore();
    };
    const haloR = coreR * (3.4 + 6 * white);
    const halo = g.createRadialGradient(h.cx, h.cy, coreR * 0.9, h.cx, h.cy, haloR);
    if (white > 0.02) {
      halo.addColorStop(0, `rgba(255,255,255,${0.85 * white})`);
      halo.addColorStop(0.3, `rgba(255,255,255,${0.32 * white})`);
      halo.addColorStop(0.6, rgbaStr(h.glow, 0.12 * (1 - white)));
    } else {
      halo.addColorStop(0, rgbaStr(h.glow, 0.55 * grow));
      halo.addColorStop(0.35, rgbaStr(h.rim, 0.18 * grow));
    }
    halo.addColorStop(1, "rgba(0,0,0,0)");
    g.globalCompositeOperation = "lighter";
    g.globalAlpha = 1;
    g.fillStyle = halo;
    g.beginPath();
    g.arc(h.cx, h.cy, haloR, 0, Math.PI * 2);
    g.fill();
    disk(false);
    g.globalCompositeOperation = "source-over";
    g.globalAlpha = 1;
    g.fillStyle = "#000";
    g.beginPath();
    g.arc(h.cx, h.cy, coreR, 0, Math.PI * 2);
    g.fill();
    if (white > 0) {
      g.globalAlpha = white;
      g.fillStyle = "#fff";
      g.beginPath();
      g.arc(h.cx, h.cy, coreR, 0, Math.PI * 2);
      g.fill();
    }
    g.globalCompositeOperation = "lighter";
    const ringW = Math.max(1.5, coreR * 0.07) * (1 + h.flare * 0.8);
    for (const [mul, a, col] of [[5, 0.12, h.glow], [2.6, 0.3, h.glow], [1, 1, h.hot]]) {
      g.globalAlpha = Math.min(1, a * (1 + h.flare)) * (1 - white * 0.6);
      g.strokeStyle = white > 0.5 ? "#ffffff" : col;
      g.lineWidth = ringW * mul;
      g.beginPath();
      g.arc(h.cx, h.cy, coreR * 1.06, 0, Math.PI * 2);
      g.stroke();
    }
    disk(true);
    if (t >= T.collapseEnd) {
      const hold = (t - T.collapseEnd) / (det - T.collapseEnd);
      for (const off of [0, 0.5]) {
        const q = (hold * 2 + off) % 1;
        const rr = h.R * 4.5 * (1 - easeOutCubic(q)) + coreR;
        g.globalAlpha = q * 0.7;
        g.strokeStyle = "#ffffff";
        g.lineWidth = 1.5 + q * 2;
        g.beginPath();
        g.arc(h.cx, h.cy, rr, 0, Math.PI * 2);
        g.stroke();
      }
    }
  }
  const ft = t - det;
  if (ft > -0.02) {
    const dur = h.noFlash ? 0.7 : 0.38;
    const peak = h.noFlash ? 0.16 : 0.72;
    const k = ft < 0.04 ? Math.max(0, (ft + 0.02) / 0.06) : Math.max(0, 1 - (ft - 0.04) / dur);
    if (k > 0) {
      const R = Math.hypot(w, hgt);
      const flash = g.createRadialGradient(h.cx, h.cy, 0, h.cx, h.cy, R * 0.6);
      flash.addColorStop(0, `rgba(255,255,255,${peak * k})`);
      flash.addColorStop(0.18, rgbaStr(h.glow, peak * 0.55 * k));
      flash.addColorStop(1, "rgba(0,0,0,0)");
      g.globalCompositeOperation = "lighter";
      g.globalAlpha = 1;
      g.fillStyle = flash;
      const fr = R * 0.6;
      g.fillRect(Math.max(0, h.cx - fr), Math.max(0, h.cy - fr), Math.min(w, fr * 2), Math.min(hgt, fr * 2));
    }
  }
  g.globalCompositeOperation = "lighter";
  for (const [delay, strength] of [[0, 1], [0.15, 0.55]]) {
    const u = (t - det - delay) / 1;
    if (u <= 0 || u >= 1)
      continue;
    const r = easeOutCubic(u) * h.maxR;
    const lw = 34 * (1 - u) * strength + 2;
    const a = (1 - u) * strength;
    const rings = [
      [-lw * 0.35, "rgba(70, 220, 255, 1)"],
      [lw * 0.35, "rgba(255, 70, 190, 1)"],
      [0, h.hot]
    ];
    for (const [off, col] of rings) {
      g.globalAlpha = a * (col === h.hot ? 0.95 : 0.55);
      g.strokeStyle = col;
      g.lineWidth = lw * (col === h.hot ? 0.55 : 0.4);
      g.beginPath();
      g.arc(h.cx, h.cy, Math.max(0, r + off), 0, Math.PI * 2);
      g.stroke();
    }
  }
  g.globalAlpha = 1;
  g.globalCompositeOperation = "source-over";
}
function rgbaStr(col, a) {
  if (col.startsWith("#")) {
    const n = parseInt(col.slice(1), 16);
    return `rgba(${n >> 16 & 255}, ${n >> 8 & 255}, ${n & 255}, ${a})`;
  }
  const m = col.match(/[\d.]+/g);
  return m && m.length >= 3 ? `rgba(${m[0]}, ${m[1]}, ${m[2]}, ${a})` : col;
}
function stepPetal(p, s, dt) {
  const k = s.windK * Math.min(1, p.age / s.ramp) * dt;
  const sway = (Math.sin(p.x * 0.0065 + p.age * 2.4 + s.phase * 0.25) * 0.7 + Math.sin(p.age * s.freq + s.phase) * 0.3) * s.amp;
  p.vx += (s.tvx - p.vx) * Math.min(1, k);
  p.vy += (s.tvy + sway - p.vy) * Math.min(1, k);
  p.vy += p.gravity * dt;
  p.x += p.vx * dt;
  p.y += p.vy * dt;
  p.rot += p.vr * dt;
  s.flip += dt * s.freq * 0.9;
}
function drawPetal(g, p, s, fade) {
  const z = p.size;
  g.save();
  g.translate(p.x, p.y);
  g.rotate(p.rot);
  g.scale(1, Math.max(0.12, Math.abs(Math.cos(s.flip))));
  g.globalCompositeOperation = "source-over";
  g.globalAlpha = Math.min(1, fade * 1.4);
  g.fillStyle = p.color;
  g.beginPath();
  g.moveTo(0, z);
  g.bezierCurveTo(z * 0.95, z * 0.55, z * 0.85, -z * 0.7, z * 0.22, -z);
  g.lineTo(0, -z * 0.78);
  g.lineTo(-z * 0.22, -z);
  g.bezierCurveTo(-z * 0.85, -z * 0.7, -z * 0.95, z * 0.55, 0, z);
  g.fill();
  g.globalAlpha *= 0.55;
  g.fillStyle = s.color2;
  g.beginPath();
  g.ellipse(0, z * 0.45, z * 0.42, z * 0.38, 0, 0, Math.PI * 2);
  g.fill();
  g.globalAlpha = Math.min(1, fade * 1.4) * 0.5;
  g.strokeStyle = "rgba(255,255,255,0.9)";
  g.lineWidth = Math.max(0.6, z * 0.08);
  g.beginPath();
  g.moveTo(0, z * 0.7);
  g.quadraticCurveTo(z * 0.12, 0, 0, -z * 0.6);
  g.stroke();
  g.restore();
  g.globalAlpha = 1;
}
function base(partial) {
  return {
    vx: 0,
    vy: 0,
    age: 0,
    life: 1,
    delay: 0,
    size: 2,
    gravity: 0,
    drag: 1,
    rot: 0,
    vr: 0,
    ...partial
  };
}
function sparkle(o, c, k) {
  const out = [];
  const bright = rgba(lighten(c, 0.35), 1);
  const pale = rgba(lighten(c, 0.75), 1);
  const n = Math.round(34 * k);
  for (let i = 0;i < n; i++) {
    const a = -Math.PI / 2 + rand(-1.15, 1.15);
    const sp = rand(160, 520) * (0.7 + k * 0.3);
    out.push(base({
      kind: Math.random() < 0.45 ? "star" : "dot",
      x: o.x + rand(-10, 10),
      y: o.y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp,
      life: rand(0.65, 1.15),
      size: rand(1.4, 3.2),
      gravity: 420,
      drag: 0.25,
      rot: rand(0, Math.PI),
      vr: rand(-4, 4),
      color: Math.random() < 0.3 ? pale : bright
    }));
  }
  out.push(base({ kind: "ring", x: o.x, y: o.y, life: 0.55, size: 2.5, maxR: 70 * k, color: bright }));
  return out;
}
function ripple(o, c, k) {
  const col = rgba(lighten(c, 0.25), 1);
  return [0, 0.11, 0.22, 0.33].slice(0, k >= 1 ? 4 : 3).map((delay, i) => base({
    kind: "ring",
    x: o.x,
    y: o.y,
    delay,
    life: 0.95,
    size: 3 - i * 0.5,
    maxR: (150 + i * 30) * k,
    color: col
  }));
}
function comet(o, c, k, fx) {
  const to = { x: o.x + rand(-40, 40), y: Math.max(40, o.y - Math.min(fx.height * 0.5, 460) * Math.min(1.3, k)) };
  const col = rgba(lighten(c, 0.2), 1);
  const out = [
    base({
      kind: "head",
      x: o.x,
      y: o.y,
      from: { ...o },
      to,
      trail: [],
      vx: rand(-60, 60),
      life: 0.75,
      size: 4 + k,
      color: col
    })
  ];
  const n = Math.round(14 * k);
  for (let i = 0;i < n; i++) {
    const t = i / n;
    out.push(base({
      kind: "dot",
      x: o.x + (to.x - o.x) * t,
      y: o.y + (to.y - o.y) * easeOutCubic(t),
      delay: t * 0.5,
      vx: rand(-60, 60),
      vy: rand(-20, 60),
      life: rand(0.4, 0.7),
      size: rand(1, 2.2),
      gravity: 200,
      drag: 0.4,
      color: col
    }));
  }
  for (const p of sparkle(to, c, k * 0.5)) {
    p.delay += 0.62;
    out.push(p);
  }
  return out;
}
function confetti(o, c, k) {
  const pal = paletteFrom(c);
  const n = Math.round(60 * k);
  const out = [];
  for (let i = 0;i < n; i++) {
    out.push(base({
      kind: "rect",
      x: o.x + rand(-30, 30),
      y: o.y,
      vx: rand(-280, 280),
      vy: rand(-760, -360) * (0.75 + k * 0.25),
      life: rand(1.3, 2),
      size: rand(3, 6),
      gravity: 950,
      drag: 0.35,
      rot: rand(0, Math.PI * 2),
      vr: rand(-10, 10),
      color: pal[i % pal.length]
    }));
  }
  return out;
}
function creamy(o, c, k, fx) {
  const apex = Math.min(fx.height * 0.55, 520) * (0.8 + 0.2 * Math.min(k, 1.6));
  const speed = Math.sqrt(2 * STREAM_GRAVITY * apex);
  const emitFor = 0.5 + 0.15 * Math.min(k, 2);
  const flight = 2 * speed / STREAM_GRAVITY;
  const tint = lighten(c, 0.82);
  const st = {
    drops: [],
    emitted: 0,
    total: Math.round(130 * Math.min(2, Math.max(0.5, k))),
    emitFor,
    speed,
    baseR: 8 * (0.85 + 0.15 * Math.min(k, 2)),
    floorY: o.y + 4,
    palette: {
      body: "#fffaf0",
      edge: rgba({ r: (214 + tint.r) / 2, g: (199 + tint.g) / 2, b: (172 + tint.b) / 2 }, 1),
      shade: "rgba(60, 45, 25, 0.45)",
      shine: "rgba(255, 255, 255, 0.95)"
    }
  };
  return [
    base({ kind: "ring", x: o.x, y: o.y, life: 0.45, size: 2.5, maxR: 46 * k, color: "rgba(255, 250, 240, 0.9)" }),
    base({ kind: "stream", x: o.x, y: o.y, life: emitFor + flight + 0.7, stream: st, color: "#fffaf0" })
  ];
}
function splash(o, c, k, fx) {
  const apex = Math.min(fx.height * 0.6, 560) * (0.8 + 0.2 * Math.min(k, 1.6));
  const speed = Math.sqrt(2 * STREAM_GRAVITY * apex);
  const emitFor = 0.6 + 0.15 * Math.min(k, 2);
  const flight = 2 * speed / STREAM_GRAVITY;
  const tilt = (o.x > fx.width / 2 ? -1 : 1) * 0.36;
  const st = {
    drops: [],
    emitted: 0,
    total: Math.round(120 * Math.min(2, Math.max(0.5, k))),
    emitFor,
    speed,
    baseR: 10 * (0.85 + 0.15 * Math.min(k, 2)),
    floorY: o.y + 4,
    water: true,
    tilt,
    palette: {
      body: "rgb(100, 180, 250)",
      edge: "rgb(74, 160, 232)",
      shade: "rgba(20, 60, 110, 0.35)",
      shine: "rgba(255, 255, 255, 1)"
    }
  };
  return [
    base({ kind: "ring", x: o.x, y: o.y, life: 0.45, size: 2.5, maxR: 52 * k, color: "rgba(150, 210, 255, 0.95)" }),
    base({ kind: "stream", x: o.x, y: o.y, life: emitFor + flight + 0.9, stream: st, color: "#e2f5ff" })
  ];
}
var HOLE_TIMING = {
  beam: 0.32,
  form: 0.3,
  feedEnd: 2.7,
  collapseStart: 2.9,
  collapseEnd: 3.6,
  detonate: 3.95,
  total: 5.15
};
function blackHole(o, c, k, fx, center, noFlash) {
  const { width: w, height: h } = fx;
  const R = Math.max(30, Math.min(w, h) * 0.085) * (0.85 + 0.15 * Math.min(k, 2));
  const hot = rgba(lighten(c, 0.75), 1);
  const glow = rgba(lighten(c, 0.25), 1);
  const pal = paletteFrom(c);
  const dust = [];
  const n = Math.round(240 * Math.min(2, Math.max(0.5, k)));
  const far = Math.hypot(w, h) * 0.6;
  const T = HOLE_TIMING;
  for (let i = 0;i < n; i++) {
    const r0 = rand(R * 2.2, far);
    const start = T.form + rand(0, 0.5);
    const arrive = i === n - 1 ? T.feedEnd : start + rand(0.8, T.feedEnd - start);
    dust.push({ r0, r: r0, a: rand(0, Math.PI * 2), start, arrive, color: Math.random() < 0.35 ? hot : pal[i % pal.length], alive: true });
  }
  const hole = {
    cx: center.x,
    cy: center.y,
    R,
    T,
    maxR: Math.hypot(Math.max(center.x, w - center.x), Math.max(center.y, h - center.y)) + 60,
    dust,
    eaten: 0,
    flare: 0,
    noFlash,
    hot,
    glow,
    rim: pal[1]
  };
  const out = [
    base({ kind: "head", x: o.x, y: o.y, from: { ...o }, to: { ...center }, trail: [], vx: rand(-30, 30), life: T.beam, size: 4 + k, color: glow }),
    base({ kind: "singularity", x: center.x, y: center.y, life: T.total, hole, color: glow })
  ];
  const debris = Math.round(70 * Math.min(2, k));
  for (let i = 0;i < debris; i++) {
    const a = rand(0, Math.PI * 2);
    const sp = rand(380, 1250);
    out.push(base({
      kind: Math.random() < 0.4 ? "star" : "dot",
      x: center.x,
      y: center.y,
      delay: T.detonate,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp,
      life: rand(0.6, 1.1),
      size: rand(1.4, 3.4),
      drag: 0.18,
      gravity: 120,
      rot: rand(0, Math.PI),
      vr: rand(-6, 6),
      color: Math.random() < 0.4 ? hot : pal[i % pal.length]
    }));
  }
  return out;
}
var SAKURA = ["#ffd6e6", "#ffc2d9", "#ffadc9", "#fff0f6", "#ff9cbf"];
function petalStorm(o, c, k, fx) {
  const { width: w, height: h } = fx;
  const kk = Math.min(2, Math.max(0.5, k));
  const tint = rgba(lighten(c, 0.55), 1);
  const pick = () => Math.random() < 0.2 ? tint : SAKURA[Math.floor(Math.random() * SAKURA.length)];
  const blush = "rgba(255, 120, 165, 1)";
  const petal = (x, y, vx, vy, delay, size, tvx, tvy, ramp, life) => base({
    kind: "petal",
    x,
    y,
    vx,
    vy,
    delay,
    size,
    life,
    gravity: 60,
    rot: rand(0, Math.PI * 2),
    vr: rand(-5, 5),
    color: pick(),
    petal: { tvx, tvy, windK: 2.2, ramp, freq: rand(3, 7), amp: rand(140, 300), phase: rand(0, 6.3), flip: rand(0, 6.3), color2: blush }
  });
  const out = [];
  const burstN = Math.round(70 * kk);
  for (let i = 0;i < burstN; i++) {
    const a = -Math.PI / 2 + rand(-1.25, 1.25);
    const sp = rand(380, 900);
    out.push(petal(o.x, o.y, Math.cos(a) * sp, Math.sin(a) * sp, rand(0, 0.12), rand(8, 14), rand(-650, -350), rand(-220, -60), 0.9, rand(2.2, 2.8)));
  }
  const stormN = Math.round(240 * kk);
  for (let i = 0;i < stormN; i++) {
    const depth = Math.random();
    const near = depth > 0.92;
    const size = near ? rand(20, 30) : 6 + depth * 10;
    const speed = (520 + depth * 520) * (near ? 1.35 : 1);
    const fromBottom = Math.random() < 0.35;
    const x = fromBottom ? rand(w * 0.35, w + 40) : w + rand(10, 80);
    const y = fromBottom ? h + rand(10, 60) : rand(-20, h * 0.95);
    const tvx = -speed;
    const tvy = rand(-260, -40);
    const life = (w + 200) / speed + 0.6;
    out.push(petal(x, y, tvx * 0.6, tvy, rand(0.15, 1.5), size, tvx, tvy, 0.25, life));
  }
  return out;
}
function playBanner(fx, label, color) {
  fx.prepare();
  const x = fx.width / 2;
  const y = fx.height * 0.42;
  fx.spawn([
    base({ kind: "text", x, y, life: 2.6, size: Math.min(34, Math.max(20, fx.width / 28)), label, color: rgba(lighten(color, 0.2), 1) }),
    ...sparkle({ x, y: y + 24 }, color, 0.8).map((p) => ({ ...p, delay: p.delay + 0.1 }))
  ]);
}
function viewportCenter() {
  return { x: window.innerWidth / 2, y: window.innerHeight * 0.55 };
}
function playSendEffect(fx, effect, originClient, color, intensity, opts = {}) {
  if (effect === "none")
    return;
  fx.prepare();
  const o = fx.local(originClient);
  const k = Math.max(0.25, Math.min(2, intensity));
  switch (effect) {
    case "sparkle":
      fx.spawn(sparkle(o, color, k));
      break;
    case "ripple":
      fx.spawn(ripple(o, color, k));
      break;
    case "comet":
      fx.spawn(comet(o, color, k, fx));
      break;
    case "confetti":
      fx.spawn(confetti(o, color, k));
      break;
    case "creamy":
      fx.spawn(creamy(o, color, k, fx));
      break;
    case "splash":
      fx.spawn(splash(o, color, k, fx));
      break;
    case "blackhole": {
      const c = opts.center ? fx.local(opts.center) : { x: fx.width / 2, y: fx.height * 0.42 };
      fx.spawn(blackHole(o, color, k, fx, c, !!opts.noFlash));
      break;
    }
    case "petalstorm":
      fx.spawn(petalStorm(o, color, k, fx));
      break;
  }
}
var WATER = ["rgb(150, 210, 255)", "rgb(100, 180, 250)", "#e2f5ff"];
function playTrail(fx, trail, client, v, color, saver, length = 1) {
  if (trail === "none")
    return;
  if (fx.idle)
    fx.prepare();
  const o = fx.local(client);
  const n = saver ? 1 : 2;
  const out = [];
  for (let i = 0;i < n; i++) {
    const x = o.x + rand(-3, 3), y = o.y + rand(-3, 3);
    switch (trail) {
      case "splash":
        out.push(base({ kind: "dot", x, y, vx: -v.x * 0.1 + rand(-50, 50), vy: rand(-140, -30), gravity: 900, drag: 0.5, life: rand(0.4, 0.7), size: rand(2, 3.4), color: WATER[i % WATER.length] }));
        break;
      case "creamy":
        out.push(base({ kind: "dot", x, y, vx: rand(-15, 15), vy: rand(0, 40), gravity: 520, drag: 0.3, life: rand(0.6, 0.9), size: rand(2.5, 4.5), color: Math.random() < 0.7 ? "#fffaf0" : rgba(lighten(color, 0.82), 1) }));
        break;
      case "comet":
        out.push(base({ kind: "dot", x, y, vx: -v.x * 0.15 + rand(-20, 20), vy: -v.y * 0.15 + rand(-20, 20), gravity: 60, drag: 0.3, life: rand(0.45, 0.75), size: rand(1.8, 3.4), color: i ? "rgba(255, 255, 255, 0.95)" : rgba(lighten(color, 0.2), 1) }));
        break;
      case "confetti": {
        const pal = paletteFrom(color);
        out.push(base({ kind: "rect", x, y, vx: rand(-80, 80), vy: rand(-160, -60), gravity: 700, drag: 0.4, life: rand(0.9, 1.3), size: rand(2, 3.5), rot: rand(0, Math.PI * 2), vr: rand(-10, 10), color: pal[Math.floor(Math.random() * pal.length)] }));
        break;
      }
      case "petalstorm":
        out.push(base({
          kind: "petal",
          x,
          y,
          vx: rand(-40, 40),
          vy: rand(-30, 10),
          gravity: 40,
          life: rand(1.2, 1.8),
          size: rand(4, 7),
          rot: rand(0, Math.PI * 2),
          vr: rand(-4, 4),
          color: Math.random() < 0.2 ? rgba(lighten(color, 0.55), 1) : SAKURA[Math.floor(Math.random() * SAKURA.length)],
          petal: { tvx: rand(-140, -60), tvy: rand(20, 60), windK: 1.5, ramp: 0.4, freq: rand(3, 6), amp: rand(30, 60), phase: rand(0, 6.3), flip: rand(0, 6.3), color2: "rgba(255, 120, 165, 1)" }
        }));
        break;
      case "blackhole": {
        const pal = paletteFrom(color);
        out.push(base({ kind: "mote", x, y, to: { ...o }, maxR: rand(14, 28), rot: rand(0, Math.PI * 2), vr: rand(5, 8), life: rand(0.5, 0.8), size: rand(1.6, 3), color: Math.random() < 0.35 ? rgba(lighten(color, 0.75), 1) : pal[i % pal.length] }));
        break;
      }
    }
  }
  for (const p of out)
    p.life *= length;
  fx.spawn(out);
}

// src/ambient.ts
var rand2 = (a, b) => a + Math.random() * (b - a);
var BASE_COUNT = {
  snow: 90,
  rain: 140,
  embers: 45,
  fireflies: 28,
  petals: 32,
  stars: 120
};

class AmbientCanvas {
  canvas;
  g;
  motes = [];
  raf = 0;
  last = 0;
  minFrameMs = typeof matchMedia === "function" && matchMedia("(pointer: coarse)").matches ? 28 : 0;
  scene = "off";
  density = 1;
  w = 0;
  h = 0;
  shooting = null;
  onVisibility = () => {
    if (document.hidden)
      this.stopLoop();
    else if (this.scene !== "off")
      this.startLoop();
  };
  constructor(canvas) {
    this.canvas = canvas;
    this.g = canvas.getContext("2d");
    document.addEventListener("visibilitychange", this.onVisibility);
  }
  get current() {
    return this.scene;
  }
  set(scene, density) {
    const changed = scene !== this.scene;
    this.scene = scene;
    this.density = density;
    if (scene === "off") {
      this.stopLoop();
      this.motes = [];
      this.g?.clearRect(0, 0, this.canvas.width, this.canvas.height);
      return;
    }
    this.resize();
    if (changed)
      this.motes = [];
    this.fill();
    if (!document.hidden)
      this.startLoop();
  }
  target() {
    if (this.scene === "off")
      return 0;
    const area = this.w * this.h / 1e6;
    return Math.round(BASE_COUNT[this.scene] * this.density * Math.max(0.4, Math.min(2.2, area)));
  }
  resize() {
    const r = this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    this.w = r.width;
    this.h = r.height;
    const bw = Math.max(1, Math.round(r.width * dpr));
    const bh = Math.max(1, Math.round(r.height * dpr));
    if (this.canvas.width !== bw)
      this.canvas.width = bw;
    if (this.canvas.height !== bh)
      this.canvas.height = bh;
    this.g?.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  spawn(initial) {
    const W = this.w;
    const H = this.h;
    const m = { x: rand2(0, W), y: rand2(0, H), vx: 0, vy: 0, size: 2, phase: rand2(0, Math.PI * 2), life: Infinity, age: 0, rot: rand2(0, Math.PI * 2), vr: 0, hue: 0 };
    switch (this.scene) {
      case "snow":
        m.size = rand2(1, 3.2);
        m.vy = rand2(18, 48) * (m.size / 2);
        m.vx = rand2(-8, 8);
        if (!initial)
          m.y = -10;
        break;
      case "rain":
        m.size = rand2(10, 22);
        m.vy = rand2(520, 820);
        m.vx = -m.vy * 0.18;
        if (!initial) {
          m.y = -30;
          m.x = rand2(0, W * 1.2);
        }
        break;
      case "embers":
        m.size = rand2(1, 2.6);
        m.vy = -rand2(20, 55);
        m.vx = rand2(-10, 10);
        m.life = rand2(5, 11);
        m.hue = rand2(14, 42);
        if (!initial)
          m.y = H + 10;
        break;
      case "fireflies":
        m.size = rand2(1.5, 3);
        m.vx = rand2(-14, 14);
        m.vy = rand2(-10, 10);
        m.hue = rand2(62, 92);
        break;
      case "petals":
        m.size = rand2(4, 7);
        m.vy = rand2(24, 50);
        m.vx = rand2(10, 36);
        m.vr = rand2(-1.5, 1.5);
        m.hue = rand2(330, 355);
        if (!initial) {
          m.y = -12;
          m.x = rand2(-W * 0.2, W);
        }
        break;
      case "stars":
        m.size = rand2(0.5, 1.8);
        break;
    }
    return m;
  }
  fill() {
    const t = this.target();
    while (this.motes.length < t)
      this.motes.push(this.spawn(true));
    if (this.motes.length > t)
      this.motes.length = t;
  }
  startLoop() {
    if (this.raf)
      return;
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.tick);
  }
  stopLoop() {
    if (this.raf)
      cancelAnimationFrame(this.raf);
    this.raf = 0;
  }
  tick = (now) => {
    const g = this.g;
    if (!g || this.scene === "off") {
      this.raf = 0;
      return;
    }
    if (now - this.last < this.minFrameMs) {
      this.raf = requestAnimationFrame(this.tick);
      return;
    }
    const dt = Math.min(0.05, Math.max(0, (now - this.last) / 1000));
    this.last = Math.max(this.last, now);
    if (Math.abs(this.canvas.getBoundingClientRect().width - this.w) > 1) {
      this.resize();
      this.fill();
    }
    g.clearRect(0, 0, this.w, this.h);
    const W = this.w;
    const H = this.h;
    for (let i = 0;i < this.motes.length; i++) {
      const m = this.motes[i];
      m.age += dt;
      m.phase += dt;
      m.rot += m.vr * dt;
      let dead = m.age > m.life;
      switch (this.scene) {
        case "snow":
          m.x += (m.vx + Math.sin(m.phase * 0.9) * 12) * dt;
          m.y += m.vy * dt;
          dead ||= m.y > H + 10;
          g.globalAlpha = 0.85;
          g.fillStyle = "#fff";
          g.beginPath();
          g.arc(m.x, m.y, m.size, 0, Math.PI * 2);
          g.fill();
          break;
        case "rain":
          m.x += m.vx * dt;
          m.y += m.vy * dt;
          dead ||= m.y > H + 30;
          g.globalAlpha = 0.45;
          g.strokeStyle = "#aecbff";
          g.lineWidth = 1;
          g.beginPath();
          g.moveTo(m.x, m.y);
          g.lineTo(m.x - m.vx * 0.03, m.y - m.size);
          g.stroke();
          break;
        case "embers": {
          m.x += (m.vx + Math.sin(m.phase * 2) * 10) * dt;
          m.y += m.vy * dt;
          dead ||= m.y < -10;
          const flicker = 0.5 + 0.5 * Math.sin(m.phase * 9 + m.hue);
          const fade = Math.min(1, m.age / 1.5) * (1 - Math.max(0, (m.age - m.life + 2) / 2));
          g.globalCompositeOperation = "lighter";
          g.globalAlpha = Math.max(0, fade) * (0.5 + flicker * 0.5);
          g.fillStyle = `hsl(${m.hue}, 100%, 60%)`;
          g.beginPath();
          g.arc(m.x, m.y, m.size * (1 + flicker * 0.4), 0, Math.PI * 2);
          g.fill();
          g.globalCompositeOperation = "source-over";
          break;
        }
        case "fireflies": {
          m.vx += rand2(-20, 20) * dt;
          m.vy += rand2(-20, 20) * dt;
          m.vx = Math.max(-18, Math.min(18, m.vx));
          m.vy = Math.max(-18, Math.min(18, m.vy));
          m.x = (m.x + m.vx * dt + W) % W;
          m.y = (m.y + m.vy * dt + H) % H;
          const pulse = Math.max(0, Math.sin(m.phase * 1.3 + m.hue));
          const r = m.size * 4;
          const grad = g.createRadialGradient(m.x, m.y, 0, m.x, m.y, r);
          grad.addColorStop(0, `hsla(${m.hue}, 100%, 70%, ${0.9 * pulse})`);
          grad.addColorStop(1, `hsla(${m.hue}, 100%, 50%, 0)`);
          g.globalCompositeOperation = "lighter";
          g.globalAlpha = 1;
          g.fillStyle = grad;
          g.beginPath();
          g.arc(m.x, m.y, r, 0, Math.PI * 2);
          g.fill();
          g.globalCompositeOperation = "source-over";
          break;
        }
        case "petals":
          m.x += (m.vx + Math.sin(m.phase * 1.4) * 18) * dt;
          m.y += m.vy * dt;
          dead ||= m.y > H + 12 || m.x > W + 20;
          g.globalAlpha = 0.8;
          g.fillStyle = `hsl(${m.hue}, 80%, 82%)`;
          g.save();
          g.translate(m.x, m.y);
          g.rotate(m.rot);
          g.scale(1, 0.55 + 0.45 * Math.cos(m.phase * 2));
          g.beginPath();
          g.ellipse(0, 0, m.size, m.size * 0.6, 0, 0, Math.PI * 2);
          g.fill();
          g.restore();
          break;
        case "stars":
          g.globalAlpha = 0.25 + 0.6 * (0.5 + 0.5 * Math.sin(m.phase * (0.6 + m.size)));
          g.fillStyle = "#fff";
          g.beginPath();
          g.arc(m.x, m.y, m.size, 0, Math.PI * 2);
          g.fill();
          break;
      }
      if (dead)
        this.motes[i] = this.spawn(false);
    }
    if (this.scene === "stars")
      this.drawShootingStar(g, dt);
    g.globalAlpha = 1;
    this.raf = requestAnimationFrame(this.tick);
  };
  drawShootingStar(g, dt) {
    if (!this.shooting && Math.random() < dt * 0.06) {
      this.shooting = { x: rand2(this.w * 0.2, this.w), y: rand2(0, this.h * 0.4), vx: -rand2(500, 800), vy: rand2(160, 280), age: 0 };
    }
    const s = this.shooting;
    if (!s)
      return;
    s.age += dt;
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    const alpha = Math.max(0, 1 - s.age / 0.9);
    const grad = g.createLinearGradient(s.x, s.y, s.x - s.vx * 0.12, s.y - s.vy * 0.12);
    grad.addColorStop(0, `rgba(255,255,255,${alpha})`);
    grad.addColorStop(1, "rgba(255,255,255,0)");
    g.globalAlpha = 1;
    g.strokeStyle = grad;
    g.lineWidth = 1.6;
    g.beginPath();
    g.moveTo(s.x, s.y);
    g.lineTo(s.x - s.vx * 0.12, s.y - s.vy * 0.12);
    g.stroke();
    if (alpha <= 0)
      this.shooting = null;
  }
  destroy() {
    this.stopLoop();
    document.removeEventListener("visibilitychange", this.onVisibility);
    this.motes = [];
  }
}
var SCENE_WORDS = [
  ["snow", /\b(snow|snowing|blizzard|winter|frost)\b/i],
  ["rain", /\b(rain|raining|storm|downpour|drizzle|monsoon)\b/i],
  ["embers", /\b(campfire|bonfire|embers?|forge|burning|inferno|volcan\w*)\b/i],
  ["fireflies", /\b(fireflies|firefly|summer night|meadow at night|glowing forest)\b/i],
  ["petals", /\b(sakura|cherry blossoms?|petals?|blossom\w*|spring garden)\b/i],
  ["stars", /\b(starry|stargazing|night sky|space|galaxy|cosmos|observatory)\b/i]
];
function sceneFromEntries(entries) {
  for (const e of entries) {
    const hay = [e.comment ?? "", ...e.keys ?? []].join(" ");
    const tag = hay.match(/\b(?:flair|weather|scene):(off|snow|rain|embers|fireflies|petals|stars)\b/i);
    if (tag)
      return tag[1].toLowerCase();
  }
  for (const e of entries) {
    const hay = [e.comment ?? "", ...e.keys ?? []].join(" ");
    for (const [scene, re] of SCENE_WORDS)
      if (re.test(hay))
        return scene;
  }
  return null;
}

// src/sound.ts
var MAX_FILE_SECONDS = 12;

class SoundBoard {
  ac = null;
  context() {
    return this.ctx();
  }
  ctx() {
    if (this.ac)
      return this.ac;
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor)
      return null;
    try {
      this.ac = new Ctor;
    } catch {
      return null;
    }
    return this.ac;
  }
  note(ac, out, freq, start, dur, type, gain) {
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(gain, start + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    osc.connect(g).connect(out);
    osc.start(start);
    osc.stop(start + dur + 0.05);
  }
  play(kind, volume, semitones = 0) {
    if (volume <= 0)
      return;
    const ac = this.ctx();
    if (!ac)
      return;
    if (ac.state === "suspended")
      ac.resume().catch(() => {});
    const master = ac.createGain();
    master.gain.value = Math.min(1, volume) * 0.35;
    master.connect(ac.destination);
    const t = ac.currentTime + 0.01;
    const f = (midi) => 440 * Math.pow(2, (midi + semitones - 69) / 12);
    switch (kind) {
      case "send":
        this.note(ac, master, f(79), t, 0.16, "sine", 0.6);
        this.note(ac, master, f(86), t + 0.07, 0.22, "triangle", 0.45);
        break;
      case "receive":
        this.note(ac, master, f(84), t, 0.5, "sine", 0.5);
        this.note(ac, master, f(79), t + 0.09, 0.6, "sine", 0.35);
        this.note(ac, master, f(96), t, 0.25, "triangle", 0.08);
        break;
      case "sparkle":
        for (let i = 0;i < 4; i++)
          this.note(ac, master, f(88 + i * 3), t + i * 0.045, 0.18, "triangle", 0.3);
        break;
      case "achievement":
        this.note(ac, master, f(81), t, 0.45, "sine", 0.5);
        this.note(ac, master, f(88), t + 0.11, 0.6, "sine", 0.45);
        for (let i = 0;i < 3; i++)
          this.note(ac, master, f(93 + i * 4), t + 0.2 + i * 0.05, 0.16, "triangle", 0.18);
        break;
      case "fanfare":
        ;
        [72, 76, 79, 84].forEach((m, i) => this.note(ac, master, f(m), t + i * 0.09, 0.45, "triangle", 0.5));
        this.note(ac, master, f(88), t + 0.36, 0.7, "sine", 0.35);
        break;
    }
  }
  noise = null;
  key(volume, semitones = 0, space = false, src) {
    if (volume <= 0)
      return;
    const ac = this.ctx();
    if (!ac || ac.state !== "running")
      return;
    const t = ac.currentTime + 0.005;
    const out = ac.createGain();
    out.connect(ac.destination);
    const shift = Math.pow(2, semitones / 12) * (0.94 + Math.random() * 0.12);
    if (src?.kind === "buffer") {
      const n = ac.createBufferSource();
      n.buffer = src.buffer;
      n.playbackRate.value = shift * (space ? 0.85 : 1);
      const level = Math.min(1, volume) * 0.5 * src.level * (space ? 0.7 : 1);
      out.gain.setValueAtTime(level, t);
      out.gain.setValueAtTime(level, t + 0.18);
      out.gain.linearRampToValueAtTime(0.0001, t + 0.25);
      n.connect(out);
      n.start(t);
      n.stop(t + 0.26);
      n.onended = () => out.disconnect();
      return;
    }
    if (!this.noise) {
      const len = Math.floor(ac.sampleRate * 0.04);
      this.noise = ac.createBuffer(1, len, ac.sampleRate);
      const d = this.noise.getChannelData(0);
      for (let i = 0;i < len; i++)
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2);
    }
    const level = Math.min(1, volume) * (space ? 0.16 : 0.22);
    out.gain.setValueAtTime(level, t);
    const n = ac.createBufferSource();
    n.buffer = this.noise;
    const bp = ac.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = (space ? 1300 : 2600) * shift;
    bp.Q.value = 1.4;
    const ng = ac.createGain();
    ng.gain.setValueAtTime(0.0001, t);
    ng.gain.exponentialRampToValueAtTime(1, t + 0.002);
    ng.gain.exponentialRampToValueAtTime(0.0001, t + (space ? 0.05 : 0.03));
    n.connect(bp).connect(ng).connect(out);
    n.start(t);
    n.stop(t + 0.06);
    const o = ac.createOscillator();
    o.type = "sine";
    o.frequency.value = (space ? 120 : 190) * shift;
    const og = ac.createGain();
    og.gain.setValueAtTime(0.0001, t);
    og.gain.exponentialRampToValueAtTime(space ? 0.5 : 0.35, t + 0.003);
    og.gain.exponentialRampToValueAtTime(0.0001, t + (space ? 0.07 : 0.04));
    o.connect(og).connect(out);
    o.start(t);
    o.stop(t + 0.08);
    o.onended = () => out.disconnect();
  }
  playFile(src, volume, maxSeconds = MAX_FILE_SECONDS) {
    if (volume <= 0)
      return;
    const ac = this.ctx();
    if (!ac)
      return;
    if (ac.state === "suspended")
      ac.resume().catch(() => {});
    const g = ac.createGain();
    const level = Math.min(1, volume) * 0.6 * src.level;
    const t = ac.currentTime;
    g.gain.setValueAtTime(level, t);
    g.connect(ac.destination);
    const end = t + maxSeconds;
    const fadeOut = () => {
      g.gain.setValueAtTime(level, end - 0.6);
      g.gain.linearRampToValueAtTime(0.0001, end);
    };
    if (src.kind === "buffer") {
      const n = ac.createBufferSource();
      n.buffer = src.buffer;
      n.connect(g);
      n.start(t);
      if (src.buffer.duration > maxSeconds) {
        fadeOut();
        n.stop(end + 0.05);
      }
      n.onended = () => {
        n.disconnect();
        g.disconnect();
      };
      return;
    }
    const el = new Audio;
    el.src = src.url;
    const node = ac.createMediaElementSource(el);
    node.connect(g);
    fadeOut();
    const stop = () => {
      el.pause();
      el.removeAttribute("src");
      el.load();
      node.disconnect();
      g.disconnect();
    };
    el.onended = stop;
    setTimeout(stop, maxSeconds * 1000 + 100);
    el.play().catch(stop);
  }
  destroy() {
    this.ac?.close().catch(() => {});
    this.ac = null;
  }
}

// src/sfx.ts
var rnd = (min, max) => min + Math.random() * (max - min);
var noiseBuffers = new WeakMap;
function noise(ac) {
  let b = noiseBuffers.get(ac);
  if (!b) {
    b = ac.createBuffer(1, Math.ceil(ac.sampleRate * 1.5), ac.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0;i < d.length; i++)
      d[i] = Math.random() * 2 - 1;
    noiseBuffers.set(ac, b);
  }
  return b;
}
function tone(ac, out, o) {
  const osc = ac.createOscillator();
  const g = ac.createGain();
  const attack = o.attack ?? 0.004;
  osc.type = o.type ?? "sine";
  osc.frequency.setValueAtTime(o.freq, o.at);
  if (o.to)
    osc.frequency.exponentialRampToValueAtTime(o.to, o.at + (o.glide ?? o.decay));
  g.gain.setValueAtTime(0.0001, o.at);
  g.gain.linearRampToValueAtTime(o.gain, o.at + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, o.at + attack + o.decay);
  osc.connect(g).connect(out);
  osc.start(o.at);
  osc.stop(o.at + attack + o.decay + 0.05);
  osc.onended = () => g.disconnect();
}
function burst(ac, out, o) {
  const src = ac.createBufferSource();
  src.buffer = noise(ac);
  src.loop = true;
  const f = ac.createBiquadFilter();
  f.type = o.type;
  f.Q.value = o.q ?? 0.7;
  f.frequency.setValueAtTime(o.freq, o.at);
  if (o.to)
    f.frequency.exponentialRampToValueAtTime(o.to, o.at + o.dur);
  const g = ac.createGain();
  if (o.attack) {
    g.gain.setValueAtTime(0.0001, o.at);
    g.gain.linearRampToValueAtTime(o.gain, o.at + o.attack);
  } else
    g.gain.setValueAtTime(o.gain, o.at);
  g.gain.exponentialRampToValueAtTime(0.0001, o.at + o.dur);
  src.connect(f).connect(g).connect(out);
  src.start(o.at, rnd(0, 0.5), o.dur + 0.02);
  src.onended = () => g.disconnect();
}
function trim(ac, out, level) {
  const g = ac.createGain();
  g.gain.value = level;
  g.connect(out);
  return g;
}
function saturate(ac, out, drive, level) {
  const curve = new Float32Array(1024);
  for (let i = 0;i < curve.length; i++)
    curve[i] = Math.tanh(drive * (i / (curve.length - 1) * 2 - 1)) / Math.tanh(drive);
  const shaper = ac.createWaveShaper();
  shaper.curve = curve;
  shaper.oversample = "2x";
  const g = ac.createGain();
  g.gain.value = level;
  shaper.connect(g).connect(out);
  return shaper;
}
var doorKnock = (ac, out, t) => {
  const bus = saturate(ac, out, 2.2, 0.8);
  const offsets = [0, 0.26 + rnd(-0.02, 0.02), 0.5 + rnd(-0.03, 0.03)];
  offsets.forEach((dt, i) => {
    const at = t + dt;
    const v = (i === 1 ? 0.9 : 1) * rnd(0.88, 1);
    const p = rnd(0.94, 1.06);
    tone(ac, bus, { freq: 118 * p, to: 56 * p, glide: 0.1, at, attack: 0.003, decay: 0.28, gain: 0.5 * v });
    tone(ac, bus, { freq: 175 * p, to: 95 * p, glide: 0.08, at, attack: 0.002, decay: 0.2, gain: 0.5 * v });
    tone(ac, bus, { type: "triangle", freq: 250 * p, to: 160 * p, glide: 0.07, at, attack: 0.002, decay: 0.12, gain: 0.28 * v });
    burst(ac, bus, { at, dur: 0.045, gain: 0.55 * v, type: "lowpass", freq: 1200, q: 0.8 });
    burst(ac, bus, { at, dur: 0.12, gain: 0.34 * v, type: "bandpass", freq: 420 * p, q: 4 });
  });
  return 0.5 + 0.35;
};
var swordClash = (ac, dest, t) => {
  const out = ac.createGain();
  out.gain.value = 0.55;
  out.connect(dest);
  const crash = (at, base, level, decay) => {
    const hp = ac.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 1500;
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, at);
    g.gain.linearRampToValueAtTime(level, at + 0.001);
    g.gain.exponentialRampToValueAtTime(level * 0.3, at + 0.06);
    g.gain.exponentialRampToValueAtTime(0.0001, at + decay);
    hp.connect(g).connect(out);
    [1, 1.4471, 1.617, 1.9265, 2.5028, 2.6637].forEach((r, i, all) => {
      const osc = ac.createOscillator();
      osc.type = "square";
      osc.frequency.value = base * r;
      osc.connect(hp);
      osc.start(at);
      osc.stop(at + decay + 0.05);
      if (i === all.length - 1)
        osc.onended = () => g.disconnect();
    });
  };
  const ring = (at, pitch, level) => [[1, 0.12, 0.28], [1.37, 0.1, 0.24], [2.09, 0.09, 0.2], [2.83, 0.07, 0.15], [3.9, 0.05, 0.12]].forEach(([r, g, d]) => {
    tone(ac, out, { freq: 1900 * pitch * r, at, attack: 0.001, decay: d, gain: g * level });
    tone(ac, out, { freq: 1900 * pitch * r * 1.011, at, attack: 0.001, decay: d, gain: g * level * 0.8 });
  });
  const p = rnd(0.92, 1.1);
  burst(ac, out, { at: t, dur: 0.06, gain: 0.7, type: "highpass", freq: 3000 });
  burst(ac, out, { at: t, dur: 0.18, gain: 0.4, type: "bandpass", freq: 6500, q: 0.8 });
  burst(ac, out, { at: t, dur: 0.5, gain: 0.16, type: "highpass", freq: 1800 });
  crash(t, 620 * p, 0.07, 0.45);
  ring(t, p, 1);
  tone(ac, out, { freq: 520 * p, to: 230 * p, glide: 0.05, at: t, attack: 0.001, decay: 0.09, gain: 0.35 });
  burst(ac, out, { at: t, dur: 0.06, gain: 0.3, type: "bandpass", freq: 900, q: 1.5 });
  const t2 = t + 0.075;
  burst(ac, out, { at: t2, dur: 0.05, gain: 0.45, type: "highpass", freq: 3500 });
  crash(t2, 620 * p * 1.13, 0.04, 0.3);
  ring(t2, p * 1.13, 0.5);
  burst(ac, out, { at: t + 0.04, dur: 0.22, gain: 0.1, type: "bandpass", freq: 2500, to: 8000, q: 3 });
  return 0.8;
};
var heartbeat = (ac, out, t) => {
  const thump = (at, v, f) => {
    tone(ac, out, { type: "triangle", freq: f * 1.5, to: f * 0.7, glide: 0.09, at, attack: 0.008, decay: 0.16, gain: 0.55 * v });
    tone(ac, out, { freq: f, to: f * 0.6, glide: 0.12, at, attack: 0.006, decay: 0.22, gain: 0.7 * v });
    burst(ac, out, { at, dur: 0.07, gain: 0.18 * v, type: "lowpass", freq: 220 });
  };
  for (let i = 0;i < 2; i++) {
    const at = t + i * 0.86;
    thump(at, 1, 62);
    thump(at + 0.25, 0.7, 72);
  }
  return 0.86 + 0.25 + 0.35;
};
var doorCreak = (ac, out, t) => {
  const dur = 1.7 * rnd(0.9, 1.15);
  const bus = trim(ac, out, 1);
  const base = rnd(300, 360);
  const steps = 24;
  const path = Array.from({ length: steps }, (_, k) => base * (1 + 0.75 * Math.sin(k / steps * Math.PI * 0.8) + rnd(-0.08, 0.08)));
  const mix = ac.createGain();
  const vibrato = ac.createOscillator();
  vibrato.frequency.value = rnd(5, 7);
  vibrato.start(t);
  vibrato.stop(t + dur + 0.05);
  const voice = (ratio, level) => {
    const osc = ac.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(path[0] * ratio, t);
    path.forEach((f, k) => osc.frequency.linearRampToValueAtTime(f * ratio, t + dur * (k + 1) / steps));
    const depth = ac.createGain();
    depth.gain.value = base * ratio * 0.02;
    vibrato.connect(depth).connect(osc.frequency);
    const g = ac.createGain();
    g.gain.value = level;
    osc.connect(g).connect(mix);
    osc.start(t);
    osc.stop(t + dur + 0.05);
    return osc;
  };
  voice(1, 1);
  voice(1.011, 0.8);
  const last = voice(1.414, 0.22);
  const f1 = ac.createBiquadFilter();
  f1.type = "bandpass";
  f1.Q.value = 9;
  f1.frequency.setValueAtTime(1400, t);
  f1.frequency.linearRampToValueAtTime(2300, t + dur * 0.5);
  f1.frequency.linearRampToValueAtTime(1700, t + dur);
  const f2 = ac.createBiquadFilter();
  f2.type = "bandpass";
  f2.Q.value = 7;
  f2.frequency.value = 3100;
  const formant2 = ac.createGain();
  formant2.gain.value = 0.5;
  const env = ac.createGain();
  env.gain.setValueAtTime(0.0001, t);
  env.gain.linearRampToValueAtTime(0.55, t + 0.25);
  env.gain.linearRampToValueAtTime(0.3, t + dur * 0.33);
  env.gain.linearRampToValueAtTime(1, t + dur * 0.55);
  env.gain.linearRampToValueAtTime(0.8, t + dur - 0.35);
  env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  mix.connect(f1).connect(env);
  mix.connect(f2).connect(formant2).connect(env);
  env.connect(bus);
  last.onended = () => env.disconnect();
  const under = trim(ac, out, 0.2);
  burst(ac, under, { at: t + 0.1, dur: dur - 0.15, gain: 0.35, type: "bandpass", freq: 2600, q: 3, attack: 0.3 });
  tone(ac, under, { type: "triangle", freq: 105, to: 92, at: t, attack: 0.3, decay: dur - 0.2, gain: 0.4 });
  return dur + 0.15;
};
var doorSlam = (ac, out, t) => {
  const bus = saturate(ac, out, 2.4, 0.8);
  const p = rnd(0.94, 1.06);
  tone(ac, bus, { freq: 95 * p, to: 42 * p, glide: 0.14, at: t, attack: 0.002, decay: 0.4, gain: 0.5 });
  tone(ac, bus, { freq: 165 * p, to: 80 * p, glide: 0.1, at: t, attack: 0.002, decay: 0.28, gain: 0.6 });
  burst(ac, bus, { at: t, dur: 0.06, gain: 0.6, type: "lowpass", freq: 2800 });
  burst(ac, bus, { at: t + 0.01, dur: 0.02, gain: 0.25, type: "bandpass", freq: 2500, q: 1.2 });
  burst(ac, bus, { at: t, dur: 0.4, gain: 0.4, type: "bandpass", freq: 320 * p, q: 1.8 });
  burst(ac, out, { at: t + 0.03, dur: 0.7, gain: 0.12, type: "lowpass", freq: 1100 });
  return 1;
};
var footsteps = (ac, out, t) => {
  const bus = saturate(ac, out, 1.6, 1.3);
  const gap = rnd(0.38, 0.44);
  for (let i = 0;i < 4; i++) {
    const at = t + i * gap + (i ? rnd(-0.015, 0.015) : 0);
    const v = (i % 2 ? 0.8 : 1) * rnd(0.85, 1);
    const p = (i % 2 ? 0.9 : 1) * rnd(0.95, 1.05);
    tone(ac, bus, { freq: 120 * p, to: 62 * p, glide: 0.07, at, attack: 0.002, decay: 0.12, gain: 0.4 * v });
    burst(ac, bus, { at, dur: 0.07, gain: 0.6 * v, type: "lowpass", freq: 650 * p });
    burst(ac, bus, { at, dur: 0.02, gain: 0.45 * v, type: "bandpass", freq: 1800 * p, q: 1.2 });
    burst(ac, bus, { at: at + 0.06, dur: 0.05, gain: 0.18 * v, type: "bandpass", freq: 900 * p, q: 1.5 });
  }
  return 3 * gap + 0.35;
};
var glassBreak = (ac, out, t) => {
  const bus = trim(ac, out, 0.62);
  burst(ac, bus, { at: t, dur: 0.04, gain: 0.8, type: "highpass", freq: 2500 });
  tone(ac, bus, { freq: 340, to: 160, glide: 0.05, at: t, attack: 0.001, decay: 0.07, gain: 0.35 });
  burst(ac, bus, { at: t, dur: 0.3, gain: 0.45, type: "bandpass", freq: 4200, q: 1.2 });
  burst(ac, bus, { at: t + 0.02, dur: 0.45, gain: 0.1, type: "highpass", freq: 4500 });
  for (let i = 0;i < 26; i++) {
    const at = t + 0.05 + Math.pow(Math.random(), 1.6) * 0.85;
    tone(ac, bus, { freq: rnd(2000, 9000), at, attack: 0.001, decay: rnd(0.04, 0.16), gain: rnd(0.08, 0.2) });
  }
  for (let i = 0;i < 3; i++) {
    tone(ac, bus, { freq: rnd(900, 1700), at: t + 0.04 + i * rnd(0.05, 0.12), attack: 0.001, decay: rnd(0.15, 0.3), gain: rnd(0.1, 0.18) });
  }
  return 1.1;
};
var thunder = (ac, out, t) => {
  const bus = saturate(ac, out, 1.6, 1);
  const dur = 2.3;
  burst(ac, bus, { at: t, dur: 0.14, gain: 0.5, type: "bandpass", freq: 1800, q: 0.7 });
  burst(ac, bus, { at: t + 0.03, dur, gain: 0.9, type: "lowpass", freq: 220, to: 70, q: 0.9, attack: 0.25 });
  burst(ac, bus, { at: t + 0.08, dur: dur * 0.8, gain: 0.9, type: "lowpass", freq: 520, to: 140, attack: 0.3 });
  for (let i = 0;i < 4; i++) {
    burst(ac, bus, { at: t + 0.35 + i * rnd(0.3, 0.45), dur: 0.5, gain: rnd(0.25, 0.5) * (1 - i * 0.18), type: "lowpass", freq: rnd(200, 450), attack: 0.08 });
  }
  tone(ac, bus, { freq: 52, to: 34, at: t + 0.05, attack: 0.2, decay: 1.8, gain: 0.5 });
  return dur + 0.4;
};
var bell = (ac, out, t) => {
  const bus = trim(ac, out, 0.22);
  const f = 660 * rnd(0.97, 1.03);
  [[0.5, 0.3, 2.4], [1, 0.5, 2.2], [1.183, 0.28, 1.7], [1.506, 0.22, 1.4], [2, 0.3, 1.5], [2.514, 0.14, 1], [3.011, 0.12, 0.8], [4.166, 0.08, 0.55]].forEach(([r, g, d]) => {
    tone(ac, bus, { freq: f * r, at: t, attack: 0.002, decay: d, gain: g });
    tone(ac, bus, { freq: f * r * 1.004, at: t, attack: 0.002, decay: d * 0.95, gain: g * 0.5 });
  });
  burst(ac, bus, { at: t, dur: 0.03, gain: 0.25, type: "bandpass", freq: 3200 });
  return 2.5;
};
var whoosh = (ac, out, t) => {
  const bus = trim(ac, out, 1.1);
  burst(ac, bus, { at: t, dur: 0.55, gain: 0.8, type: "bandpass", freq: 380, to: 2600, q: 1.1, attack: 0.2 });
  burst(ac, bus, { at: t + 0.05, dur: 0.45, gain: 0.35, type: "bandpass", freq: 1800, to: 4500, q: 0.9, attack: 0.2 });
  return 0.65;
};
var impact = (ac, out, t) => {
  const bus = saturate(ac, out, 2.6, 0.65);
  tone(ac, bus, { freq: 150, to: 48, glide: 0.09, at: t, attack: 0.001, decay: 0.32, gain: 0.55 });
  tone(ac, bus, { freq: 240, to: 110, glide: 0.06, at: t, attack: 0.001, decay: 0.16, gain: 0.5 });
  burst(ac, bus, { at: t, dur: 0.07, gain: 0.7, type: "lowpass", freq: 900 });
  burst(ac, bus, { at: t, dur: 0.04, gain: 0.3, type: "bandpass", freq: 1800, q: 1 });
  return 0.45;
};
var magic = (ac, out, t) => {
  const bus = trim(ac, out, 0.8);
  const root = 700 * rnd(0.97, 1.03);
  [1, 1.25, 1.5, 1.875, 2.25, 3].forEach((r, i) => {
    const at = t + i * 0.065;
    tone(ac, bus, { type: "triangle", freq: root * r, at, attack: 0.004, decay: 0.7, gain: 0.2 });
    tone(ac, bus, { freq: root * r * 2.003, at, attack: 0.004, decay: 0.5, gain: 0.1 });
  });
  burst(ac, bus, { at: t, dur: 0.6, gain: 0.12, type: "bandpass", freq: 900, to: 7000, q: 2, attack: 0.25 });
  tone(ac, bus, { freq: root * 2, at: t + 0.2, attack: 0.15, decay: 1, gain: 0.12 });
  tone(ac, bus, { freq: root * 2 * 1.006, at: t + 0.2, attack: 0.15, decay: 1, gain: 0.1 });
  for (let i = 0;i < 16; i++)
    tone(ac, bus, { freq: rnd(3000, 9000), at: t + 0.15 + Math.random() * 0.8, attack: 0.001, decay: rnd(0.06, 0.2), gain: rnd(0.04, 0.1) });
  return 1.5;
};
var splash2 = (ac, out, t) => {
  const bus = trim(ac, out, 1.15);
  burst(ac, bus, { at: t, dur: 0.18, gain: 0.7, type: "bandpass", freq: 2200, q: 0.8 });
  burst(ac, bus, { at: t, dur: 0.5, gain: 0.35, type: "lowpass", freq: 900 });
  burst(ac, bus, { at: t + 0.03, dur: 0.4, gain: 0.25, type: "highpass", freq: 3500 });
  for (let i = 0;i < 10; i++) {
    const f = rnd(350, 1100);
    tone(ac, bus, { freq: f, to: f * rnd(1.6, 2.4), glide: 0.05, at: t + 0.08 + Math.pow(Math.random(), 1.3) * 0.6, attack: 0.003, decay: rnd(0.05, 0.1), gain: rnd(0.1, 0.22) });
  }
  return 0.9;
};
var fireCrackle = (ac, out, t) => {
  const bus = trim(ac, saturate(ac, out, 1.4, 0.85), 1.8);
  const dur = 1.7;
  burst(ac, bus, { at: t, dur, gain: 0.06, type: "bandpass", freq: 300, q: 0.6, attack: 0.15 });
  for (let i = 0;i < 34; i++) {
    const at = t + 0.02 + Math.pow(Math.random(), 1.2) * (dur - 0.2);
    const big = Math.random() < 0.18;
    burst(ac, bus, { at, dur: big ? rnd(0.012, 0.02) : rnd(0.004, 0.01), gain: big ? rnd(0.4, 0.65) : rnd(0.1, 0.35), type: "bandpass", freq: rnd(1200, 4500), q: rnd(0.8, 2) });
    if (big)
      tone(ac, bus, { freq: rnd(160, 260), to: 70, glide: 0.03, at, attack: 0.001, decay: 0.04, gain: 0.2 });
  }
  return dur + 0.1;
};
var RECIPES = new Map([
  ["door-knock", doorKnock],
  ["door-creak", doorCreak],
  ["door-slam", doorSlam],
  ["footsteps", footsteps],
  ["sword-clash", swordClash],
  ["glass-break", glassBreak],
  ["heartbeat", heartbeat],
  ["thunder", thunder],
  ["bell", bell],
  ["whoosh", whoosh],
  ["impact", impact],
  ["magic", magic],
  ["splash", splash2],
  ["fire-crackle", fireCrackle]
]);
function renderCue(ac, out, cue, at = 0) {
  return RECIPES.get(cue)?.(ac, out, at) ?? 0;
}

class SfxBoard {
  context;
  constructor(context) {
    this.context = context;
  }
  play(cue, volume) {
    if (volume <= 0 || !RECIPES.has(cue))
      return false;
    const ac = this.context();
    if (!ac || ac.state === "closed")
      return false;
    if (ac.state === "suspended")
      ac.resume().catch(() => {});
    const master = ac.createGain();
    master.gain.value = Math.min(1, volume) * 0.6;
    master.connect(ac.destination);
    try {
      const len = renderCue(ac, master, cue, ac.currentTime + 0.02);
      setTimeout(() => master.disconnect(), (len + 0.4) * 1000);
      return true;
    } catch {
      master.disconnect();
      return false;
    }
  }
}

// src/palette.ts
function parseMoodMap(source) {
  const rules = [];
  for (const line of source.split(/\r?\n/)) {
    const m = line.match(/^\s*([^=#]+?)\s*=\s*(#[0-9a-f]{6})\s*$/i);
    if (!m)
      continue;
    const words = m[1].split(",").map((w) => w.trim().toLowerCase()).filter(Boolean);
    if (words.length)
      rules.push({ words, color: m[2].toLowerCase() });
  }
  return rules;
}
function moodColorFor(label, rules) {
  if (!label)
    return null;
  const l = label.toLowerCase();
  if (/^(neutral|default|idle|calm)$/.test(l))
    return null;
  for (const rule of rules) {
    if (rule.words.some((w) => l === w || l.includes(w)))
      return rule.color;
  }
  return null;
}
function timeOfDayTint(date = new Date) {
  const h = date.getHours() + date.getMinutes() / 60;
  if (h >= 5 && h < 9)
    return { color: "#ffb38a", amount: 28, label: "Dawn" };
  if (h >= 9 && h < 17)
    return null;
  if (h >= 17 && h < 20)
    return { color: "#ffa04d", amount: 32, label: "Golden hour" };
  return { color: "#6b7cff", amount: 30, label: "Night" };
}
function hexToHsl(hex) {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16 & 255) / 255;
  const g = (n >> 8 & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min)
    return { h: 0, s: 0, l: Math.round(l * 100) };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r)
    h = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g)
    h = (b - r) / d + 2;
  else
    h = (r - g) / d + 4;
  return { h: Math.round(h * 60), s: Math.round(s * 100), l: Math.round(l * 100) };
}
function moodPitch(label) {
  if (!label)
    return 0;
  const l = label.toLowerCase();
  if (/(happy|joy|excit|laugh|smile|love|flirt)/.test(l))
    return 3;
  if (/(sad|cry|lonely|worr|scared|fear)/.test(l))
    return -3;
  if (/(angry|annoy|furious)/.test(l))
    return -5;
  return 0;
}

// src/celebrate.ts
var MILESTONES = [50, 100, 250, 500, 1000, 1500, 2000, 3000, 5000, 7500, 1e4];
function milestoneAtOrBelow(count) {
  let best = 0;
  for (const m of MILESTONES)
    if (m <= count)
      best = m;
  return best;
}
function parseTriggers(source) {
  const out = [];
  for (const line of source.split(/\r?\n/)) {
    const m = line.match(/^\s*(.+?)\s*=>\s*([a-z]+)\s*$/i);
    if (!m)
      continue;
    const phrase = m[1].trim().toLowerCase();
    if (phrase.length < 2)
      continue;
    const eff = m[2].toLowerCase();
    out.push({ phrase, effect: BURST_EFFECTS.includes(eff) ? eff : "sparkle" });
  }
  return out;
}
function matchTrigger(text, triggers) {
  if (!text || !triggers.length)
    return null;
  const hay = text.toLowerCase();
  return triggers.find((t) => hay.includes(t.phrase)) ?? null;
}

// src/themepack.ts
function download(bytes, filename, type) {
  const blob = new Blob([bytes], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1e4);
}
async function exportThemePack(ctx, s) {
  const css = exportableCss(s);
  const canPack = (ctx.host?.capabilities?.["theme-packs-v1"] ?? 0) >= 1 && !!ctx.theme?.packs;
  if (canPack) {
    try {
      const bytes = await ctx.theme.packs.exportDraft({
        name: "Lumi Flair Glow",
        author: "Lumi Flair",
        description: `Hover ${s.hoverStyle} glow${s.streamingAura ? " + streaming aura" : ""}, exported from Lumi Flair.`,
        globalCSS: css
      });
      download(bytes, "lumi-flair-glow.lumitheme", "application/octet-stream");
      return "pack";
    } catch (err) {
      console.warn("[Lumi Flair] Theme pack export failed, falling back to CSS", err);
    }
  }
  download(css, "lumi-flair-glow.css", "text/css");
  return "css";
}

// src/director.ts
var SCENE_ALIASES = {
  clear: "off",
  none: "off",
  sunny: "off",
  storm: "rain",
  stormy: "rain",
  drizzle: "rain",
  blizzard: "snow",
  fire: "embers",
  campfire: "embers",
  ash: "embers",
  night: "fireflies",
  sakura: "petals",
  blossoms: "petals",
  space: "stars",
  starry: "stars"
};
var LIGHT_ALIASES = {
  morning: "dawn",
  sunrise: "dawn",
  noon: "day",
  daylight: "day",
  sunset: "dusk",
  evening: "dusk",
  "golden hour": "dusk",
  midnight: "night",
  dark: "night",
  moonlight: "night",
  firelight: "candle",
  torch: "candle",
  lantern: "candle",
  lightning: "storm",
  thunder: "storm",
  cyber: "neon",
  city: "neon"
};
function norm(v) {
  return (v ?? "").trim().toLowerCase();
}
function parseDirection(attrs) {
  if (!attrs)
    return null;
  const d = {};
  const sc = norm(attrs.scene ?? attrs.weather);
  if (sc) {
    const scene = SCENES.includes(sc) ? sc : SCENE_ALIASES[sc];
    if (scene)
      d.scene = scene;
  }
  const li = norm(attrs.light ?? attrs.lighting);
  if (li) {
    const light = LIGHTS.includes(li) ? li : LIGHT_ALIASES[li];
    if (light)
      d.light = light;
  }
  const mood = norm(attrs.mood);
  if (mood && mood.length <= 24)
    d.mood = mood;
  return d.scene || d.light || d.mood ? d : null;
}

class DirectorState {
  byChat = new Map;
  apply(chatId, index, dir) {
    const cur = this.byChat.get(chatId);
    if (cur && index < cur.index)
      return false;
    const merged = cur && index >= cur.index ? { ...cur.dir, ...dir } : { ...dir };
    const changed = JSON.stringify(merged) !== JSON.stringify(cur?.dir);
    this.byChat.set(chatId, { index, dir: merged });
    return changed;
  }
  get(chatId) {
    return chatId ? this.byChat.get(chatId)?.dir ?? null : null;
  }
}

// src/soundscape.ts
class Soundscape {
  ac = null;
  master = null;
  current = null;
  noise = {};
  volume = 0.35;
  wanted = { scene: "off", light: "none" };
  enabled = false;
  lastClock = -1;
  stalls = 0;
  watchdog;
  lastState = "off";
  unfocused = "keep";
  dimLevel = 0.3;
  focused = typeof document.hasFocus === "function" ? document.hasFocus() : true;
  onState = null;
  onBackground = null;
  loader = null;
  custom = {};
  customIds = [];
  blockedMedia = new Set;
  onVisibility = () => {
    this.applyVolume();
    if (!document.hidden)
      this.heal();
  };
  onGesture = () => {
    if (this.wantsSound() && this.ac && this.ac.state !== "running")
      this.ac.resume().then(() => this.report()).catch(() => {});
    for (const el of this.blockedMedia)
      el.play().then(() => this.blockedMedia.delete(el)).catch(() => {});
  };
  onFocus = () => {
    this.syncFocus();
    this.heal();
  };
  onBlur = () => setTimeout(() => this.syncFocus(), 0);
  syncFocus() {
    const f = typeof document.hasFocus === "function" ? document.hasFocus() : true;
    if (f === this.focused)
      return;
    this.focused = f;
    this.applyVolume();
    try {
      this.onBackground?.();
    } catch {}
  }
  constructor() {
    document.addEventListener("visibilitychange", this.onVisibility);
    window.addEventListener("focus", this.onFocus);
    window.addEventListener("blur", this.onBlur);
    window.addEventListener("pointerdown", this.onGesture, true);
    window.addEventListener("keydown", this.onGesture, true);
  }
  wantsSound() {
    return this.enabled && !!this.current;
  }
  get state() {
    if (!this.enabled || !this.current)
      return "off";
    return this.ac?.state === "running" ? "playing" : "waiting";
  }
  report() {
    const st = this.state;
    if (st === this.lastState)
      return;
    this.lastState = st;
    try {
      this.onState?.(st);
    } catch {}
  }
  startWatchdog() {
    if (this.watchdog)
      return;
    this.watchdog = setInterval(() => this.heal(), 5000);
  }
  stopWatchdog() {
    if (this.watchdog)
      clearInterval(this.watchdog);
    this.watchdog = undefined;
  }
  heal() {
    this.syncFocus();
    const ac = this.ac;
    if (!ac || !this.enabled)
      return this.report();
    if (ac.state === "closed") {
      this.rebuild("closed");
      return;
    }
    if (document.hidden)
      return this.report();
    if (ac.state !== "running") {
      this.lastClock = -1;
      this.stalls = 0;
      ac.resume().then(() => this.report()).catch(() => this.report());
      this.report();
      return;
    }
    if (this.wantsSound()) {
      if (this.lastClock >= 0 && ac.currentTime <= this.lastClock + 0.05) {
        if (++this.stalls >= 2) {
          this.rebuild("stalled");
          return;
        }
      } else
        this.stalls = 0;
      this.lastClock = ac.currentTime;
    }
    this.report();
  }
  rebuild(reason) {
    console.info(`[Lumi Flair] soundscape restarted (${reason})`);
    try {
      this.current?.layer.stop();
    } catch {}
    this.current = null;
    const old = this.ac;
    this.ac = null;
    this.master = null;
    this.noise = {};
    this.lastClock = -1;
    this.stalls = 0;
    if (old && old.state !== "closed")
      old.close().catch(() => {});
    this.set(this.enabled, this.wanted.scene, this.wanted.light, this.volume, this.custom);
  }
  ctx() {
    if (this.ac)
      return this.ac;
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor)
      return null;
    try {
      this.ac = new Ctor;
      this.master = this.ac.createGain();
      this.master.gain.value = 0;
      this.master.connect(this.ac.destination);
    } catch {
      return null;
    }
    const ac = this.ac;
    ac.onstatechange = () => {
      if (ac !== this.ac)
        return;
      if (ac.state !== "running")
        setTimeout(() => this.heal(), 250);
      this.report();
    };
    return this.ac;
  }
  buffer(kind) {
    const ac = this.ac;
    const cached = this.noise[kind];
    if (cached)
      return cached;
    const len = ac.sampleRate * 3;
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const d = buf.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0, last = 0;
    for (let i = 0;i < len; i++) {
      const w = Math.random() * 2 - 1;
      if (kind === "white")
        d[i] = w * 0.5;
      else if (kind === "pink") {
        b0 = 0.99886 * b0 + w * 0.0555179;
        b1 = 0.99332 * b1 + w * 0.0750759;
        b2 = 0.969 * b2 + w * 0.153852;
        b3 = 0.8665 * b3 + w * 0.3104856;
        b4 = 0.55 * b4 + w * 0.5329522;
        b5 = -0.7616 * b5 - w * 0.016898;
        d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
        b6 = w * 0.115926;
      } else {
        last = (last + 0.02 * w) / 1.02;
        d[i] = last * 3.5;
      }
    }
    this.noise[kind] = buf;
    return buf;
  }
  noiseSource(kind) {
    const src = this.ac.createBufferSource();
    src.buffer = this.buffer(kind);
    src.loop = true;
    return src;
  }
  lfo(freq, depth, target) {
    const ac = this.ac;
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.frequency.value = freq;
    g.gain.value = depth;
    osc.connect(g).connect(target);
    osc.start();
    return osc;
  }
  grains(out, every, play) {
    let alive = true;
    let timer;
    const tick = () => {
      if (!alive || !this.ac)
        return;
      play(this.ac.currentTime + 0.02);
      timer = setTimeout(tick, every[0] + Math.random() * (every[1] - every[0]));
    };
    timer = setTimeout(tick, every[0]);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }
  compose(scene, light, c) {
    if (c.always)
      return this.fileLayer([c.always], this.master);
    if (!c.scene && !c.light)
      return this.build(scene, light, this.master);
    const ac = this.ac;
    const out = ac.createGain();
    out.gain.value = 0;
    out.connect(this.master);
    const parts = [];
    const gen = this.build(c.scene ? "off" : scene, c.light ? "none" : light, out);
    if (gen)
      parts.push(gen);
    parts.push(this.fileLayer([c.scene, c.light].filter((x) => !!x), out));
    for (const l of parts)
      l.gain.gain.value = 1;
    return {
      gain: out,
      stop: () => {
        for (const l of parts)
          l.stop();
        setTimeout(() => out.disconnect(), 150);
      }
    };
  }
  fileLayer(ids, dest) {
    const ac = this.ac;
    const out = ac.createGain();
    out.gain.value = 0;
    out.connect(dest);
    let alive = true;
    const stops = [];
    for (const id of ids) {
      const load = this.loader?.(id, ac);
      if (!load)
        continue;
      load.then((src) => {
        if (!alive || !src || this.ac !== ac)
          return;
        const g = ac.createGain();
        const t = ac.currentTime;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.setTargetAtTime(Math.max(0.0001, src.level), t, 0.5);
        g.connect(out);
        if (src.kind === "buffer") {
          const n = ac.createBufferSource();
          n.buffer = src.buffer;
          n.loop = true;
          n.connect(g);
          n.start();
          stops.push(() => {
            try {
              n.stop();
            } catch {}
            n.disconnect();
            g.disconnect();
          });
        } else {
          const el = new Audio;
          el.src = src.url;
          el.loop = true;
          el.preload = "auto";
          const node = ac.createMediaElementSource(el);
          node.connect(g);
          el.play().catch(() => this.blockedMedia.add(el));
          stops.push(() => {
            this.blockedMedia.delete(el);
            el.pause();
            el.removeAttribute("src");
            el.load();
            node.disconnect();
            g.disconnect();
          });
        }
      }).catch(() => {});
    }
    return {
      gain: out,
      stop: () => {
        alive = false;
        for (const f of stops)
          f();
        setTimeout(() => out.disconnect(), 150);
      }
    };
  }
  build(scene, light, dest) {
    const ac = this.ac;
    const out = ac.createGain();
    out.gain.value = 0;
    out.connect(dest);
    const nodes = [];
    const cleanups = [];
    const start = (n) => {
      n.start();
      nodes.push(n);
    };
    const wind = (level, cutoff) => {
      const src = this.noiseSource("brown");
      const lp = ac.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = cutoff;
      const g = ac.createGain();
      g.gain.value = level;
      src.connect(lp).connect(g).connect(out);
      nodes.push(this.lfo(0.07, cutoff * 0.4, lp.frequency));
      nodes.push(this.lfo(0.11, level * 0.5, g.gain));
      start(src);
    };
    const click = (t, freq, q, level, dur) => {
      const src = ac.createBufferSource();
      src.buffer = this.buffer("white");
      const bp = ac.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = freq;
      bp.Q.value = q;
      const g = ac.createGain();
      g.gain.setValueAtTime(level, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(bp).connect(g).connect(out);
      src.start(t, Math.random() * 2, dur + 0.02);
    };
    const chirp = (t, f0, f1, dur, level) => {
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = "sine";
      o.frequency.setValueAtTime(f0, t);
      o.frequency.exponentialRampToValueAtTime(f1, t + dur);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(level, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(out);
      o.start(t);
      o.stop(t + dur + 0.05);
    };
    switch (scene) {
      case "rain": {
        const src = this.noiseSource("pink");
        const hp = ac.createBiquadFilter();
        hp.type = "highpass";
        hp.frequency.value = 500;
        const lp = ac.createBiquadFilter();
        lp.type = "lowpass";
        lp.frequency.value = light === "storm" ? 5000 : 3800;
        const g = ac.createGain();
        g.gain.value = light === "storm" ? 0.55 : 0.4;
        src.connect(hp).connect(lp).connect(g).connect(out);
        start(src);
        cleanups.push(this.grains(out, [40, 160], (t) => click(t, 2500 + Math.random() * 3000, 6, 0.08 + Math.random() * 0.08, 0.04)));
        if (light === "storm")
          wind(0.25, 300);
        break;
      }
      case "snow":
        wind(0.5, 420);
        cleanups.push(this.grains(out, [2500, 6000], (t) => chirp(t, 2400, 2350, 1.2, 0.006)));
        break;
      case "embers": {
        const src = this.noiseSource("brown");
        const lp = ac.createBiquadFilter();
        lp.type = "lowpass";
        lp.frequency.value = 700;
        const g = ac.createGain();
        g.gain.value = 0.35;
        src.connect(lp).connect(g).connect(out);
        start(src);
        cleanups.push(this.grains(out, [60, 420], (t) => click(t, 1800 + Math.random() * 3500, 2, 0.12 + Math.random() * 0.25, 0.02 + Math.random() * 0.03)));
        break;
      }
      case "fireflies":
        wind(0.12, 300);
        cleanups.push(this.grains(out, [700, 1800], (t) => {
          const f = 4200 + Math.random() * 600;
          for (let i = 0;i < 3; i++)
            chirp(t + i * 0.07, f, f * 0.98, 0.05, 0.03);
        }));
        break;
      case "petals":
        wind(0.18, 600);
        cleanups.push(this.grains(out, [1800, 5200], (t) => {
          const base = 2600 + Math.random() * 1600;
          chirp(t, base, base * 1.4, 0.12, 0.035);
          chirp(t + 0.16, base * 1.2, base * 0.9, 0.1, 0.03);
        }));
        break;
      case "stars": {
        const freqs = [55, 82.4, 110.2];
        for (const f of freqs) {
          const o = ac.createOscillator();
          o.type = "triangle";
          o.frequency.value = f;
          o.detune.value = Math.random() * 8 - 4;
          const g = ac.createGain();
          g.gain.value = 0.06;
          o.connect(g).connect(out);
          nodes.push(this.lfo(0.03 + Math.random() * 0.05, 0.03, g.gain));
          start(o);
        }
        const air = this.noiseSource("pink");
        const bp = ac.createBiquadFilter();
        bp.type = "bandpass";
        bp.frequency.value = 900;
        bp.Q.value = 0.7;
        const ag = ac.createGain();
        ag.gain.value = 0.05;
        air.connect(bp).connect(ag).connect(out);
        nodes.push(this.lfo(0.02, 500, bp.frequency));
        start(air);
        break;
      }
      default:
        if (light === "storm")
          wind(0.35, 260);
        else if (light === "candle") {
          wind(0.08, 500);
          cleanups.push(this.grains(out, [300, 1400], (t) => click(t, 2500, 2, 0.05, 0.02)));
        } else if (light === "neon") {
          const o = ac.createOscillator();
          o.type = "sawtooth";
          o.frequency.value = 60;
          const lp = ac.createBiquadFilter();
          lp.type = "lowpass";
          lp.frequency.value = 180;
          const g = ac.createGain();
          g.gain.value = 0.04;
          o.connect(lp).connect(g).connect(out);
          start(o);
        } else {
          out.disconnect();
          return null;
        }
    }
    return {
      gain: out,
      stop: () => {
        for (const c of cleanups)
          c();
        for (const n of nodes) {
          try {
            n.stop();
          } catch {}
        }
        setTimeout(() => out.disconnect(), 100);
      }
    };
  }
  focusFactor() {
    if (this.focused || this.unfocused === "keep")
      return 1;
    return this.unfocused === "mute" ? 0 : this.dimLevel;
  }
  get focusLevel() {
    return document.hidden ? 0 : this.focusFactor();
  }
  applyVolume(fast = false) {
    if (!this.ac || !this.master)
      return;
    const target = this.enabled && !document.hidden ? this.volume * 0.6 * this.focusFactor() : 0;
    const t = this.ac.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setTargetAtTime(target, t, fast ? 0.05 : 0.35);
  }
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    this.applyVolume(true);
  }
  setBackground(mode, dimLevel) {
    if (mode === this.unfocused && dimLevel === this.dimLevel)
      return;
    this.unfocused = mode;
    this.dimLevel = dimLevel;
    this.syncFocus();
    this.applyVolume();
  }
  get backgrounded() {
    return this.focused || this.unfocused === "keep" ? null : this.unfocused;
  }
  set(enabled, scene, light, volume, custom = {}) {
    this.enabled = enabled;
    this.volume = volume;
    this.wanted = { scene, light };
    this.custom = custom;
    if (!enabled && !this.ac)
      return;
    const ac = this.ctx();
    if (!ac)
      return;
    this.applyVolume();
    const key = enabled ? `${scene}|${light}|${custom.always ?? ""}|${custom.scene ?? ""}|${custom.light ?? ""}|${custom.rev ?? ""}` : "off";
    if (this.current?.key === key)
      return;
    const t = ac.currentTime;
    if (this.current) {
      const old = this.current.layer;
      old.gain.gain.cancelScheduledValues(t);
      old.gain.gain.setTargetAtTime(0, t, 0.8);
      setTimeout(() => old.stop(), 3500);
      this.current = null;
    }
    if (!enabled) {
      this.stopWatchdog();
      this.report();
      setTimeout(() => {
        if (!this.enabled && this.ac && this.ac.state === "running")
          this.ac.suspend().catch(() => {});
      }, 4000);
      return;
    }
    const layer = this.compose(scene, light, custom);
    this.customIds = custom.always ? [custom.always] : [custom.scene, custom.light].filter((x) => !!x);
    if (!layer) {
      this.stopWatchdog();
      this.report();
      return;
    }
    layer.gain.gain.setTargetAtTime(1, t, 0.9);
    this.current = { key, layer };
    this.startWatchdog();
    if (ac.state !== "running")
      ac.resume().catch(() => {});
    this.report();
  }
  thunder(delayMs = 600) {
    if (!this.enabled || !this.ac || document.hidden)
      return;
    setTimeout(() => {
      const ac = this.ac;
      if (!ac || !this.master)
        return;
      const src = ac.createBufferSource();
      src.buffer = this.buffer("brown");
      const lp = ac.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 140;
      const g = ac.createGain();
      const t = ac.currentTime;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(1.4, t + 0.25);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 3.2);
      src.connect(lp).connect(g).connect(this.master);
      src.start(t, Math.random(), 3.4);
    }, delayMs);
  }
  get playing() {
    return this.current?.key ?? "off";
  }
  get customPlaying() {
    return this.current ? this.customIds : [];
  }
  get alwaysPlaying() {
    return !!this.current && !!this.custom.always;
  }
  get target() {
    return this.wanted;
  }
  destroy() {
    this.stopWatchdog();
    document.removeEventListener("visibilitychange", this.onVisibility);
    window.removeEventListener("focus", this.onFocus);
    window.removeEventListener("blur", this.onBlur);
    window.removeEventListener("pointerdown", this.onGesture, true);
    window.removeEventListener("keydown", this.onGesture, true);
    this.onState = null;
    this.onBackground = null;
    this.loader = null;
    this.blockedMedia.clear();
    this.current?.layer.stop();
    this.current = null;
    this.ac?.close().catch(() => {});
    this.ac = null;
  }
}

// src/soundlib.ts
var MAX_SOUND_BYTES = 40 * 1024 * 1024;
var MAX_SOUNDS = 40;
var SOUND_ACCEPT = ["audio/*", ".mp3", ".ogg", ".oga", ".opus", ".wav", ".m4a", ".aac", ".flac", ".webm"];
var DECODE_SECONDS = 90;
var DECODED_BUDGET = 160 * 1024 * 1024;
var DB_NAME = "lumi_flair_sounds";
var META = "meta";
var DATA = "data";
function req(r) {
  return new Promise((resolve, reject) => {
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}
function done(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error ?? new Error("aborted"));
  });
}
function newId() {
  return "snd_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
function soundName(file) {
  const base = file.replace(/\.[a-z0-9]{2,5}$/i, "").replace(/[_]+/g, " ").trim();
  return (base || "Sound").slice(0, 60);
}

class SoundLibrary {
  db = null;
  items = new Map;
  memory = new Map;
  persistent = true;
  urls = new Map;
  buffers = new Map;
  listeners = new Set;
  ready;
  constructor() {
    this.ready = this.open().catch((err) => {
      console.warn("[Lumi Flair] Sound library is session-only (browser storage unavailable)", err);
      this.persistent = false;
    });
  }
  get saved() {
    return this.persistent;
  }
  async open() {
    if (typeof indexedDB === "undefined")
      throw new Error("no indexedDB");
    const open = indexedDB.open(DB_NAME, 1);
    open.onupgradeneeded = () => {
      const db = open.result;
      if (!db.objectStoreNames.contains(META))
        db.createObjectStore(META, { keyPath: "id" });
      if (!db.objectStoreNames.contains(DATA))
        db.createObjectStore(DATA);
    };
    this.db = await req(open);
    const all = await req(this.db.transaction(META).objectStore(META).getAll());
    for (const m of all)
      if (m && typeof m.id === "string")
        this.items.set(m.id, m);
    this.emit();
  }
  onChange(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
  emit() {
    for (const fn of this.listeners) {
      try {
        fn();
      } catch (err) {
        console.error("[Lumi Flair] sound library listener failed", err);
      }
    }
  }
  list() {
    return [...this.items.values()].sort((a, b) => a.at - b.at);
  }
  has(id) {
    return !!id && this.items.has(id);
  }
  meta(id) {
    return this.items.get(id);
  }
  get count() {
    return this.items.size;
  }
  async probe(bytes) {
    const Ctor = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    if (!Ctor)
      return 0;
    const ac = new Ctor(1, 1, 22050);
    const copy = bytes.slice().buffer;
    const buf = await ac.decodeAudioData(copy);
    return buf.duration;
  }
  async add(file) {
    await this.ready;
    if (this.items.size >= MAX_SOUNDS)
      throw new Error(`You can keep up to ${MAX_SOUNDS} sounds — delete one first.`);
    const size = file.sizeBytes ?? file.bytes.byteLength;
    if (size > MAX_SOUND_BYTES)
      throw new Error(`“${file.name}” is larger than ${MAX_SOUND_BYTES / 1024 / 1024} MB.`);
    let duration = 0;
    try {
      duration = await this.probe(file.bytes);
    } catch {
      throw new Error(`“${file.name}” isn't an audio file this browser can play.`);
    }
    const mime = file.mimeType && file.mimeType !== "application/octet-stream" ? file.mimeType : "audio/mpeg";
    const meta = { id: newId(), name: soundName(file.name), mime, size, duration: Math.round(duration * 10) / 10, level: 1, at: Date.now() };
    const blob = new Blob([file.bytes.slice().buffer], { type: mime });
    if (this.db) {
      try {
        const tx = this.db.transaction([META, DATA], "readwrite");
        tx.objectStore(DATA).put(blob, meta.id);
        tx.objectStore(META).put(meta);
        await done(tx);
      } catch (err) {
        const quota = err instanceof DOMException && err.name === "QuotaExceededError";
        throw new Error(quota ? "The browser is out of storage space for sounds — delete some first." : `Couldn't save “${file.name}”.`);
      }
    } else
      this.memory.set(meta.id, blob);
    this.items.set(meta.id, meta);
    this.emit();
    return meta;
  }
  async remove(id) {
    await this.ready;
    if (this.db) {
      const tx = this.db.transaction([META, DATA], "readwrite");
      tx.objectStore(DATA).delete(id);
      tx.objectStore(META).delete(id);
      await done(tx).catch(() => {});
    }
    this.memory.delete(id);
    this.items.delete(id);
    this.buffers.delete(id);
    const url = this.urls.get(id);
    if (url)
      URL.revokeObjectURL(url);
    this.urls.delete(id);
    this.emit();
  }
  async update(id, patch) {
    const m = this.items.get(id);
    if (!m)
      return;
    const next = {
      ...m,
      ...patch.name !== undefined ? { name: patch.name.trim().slice(0, 60) || m.name } : {},
      ...patch.level !== undefined ? { level: Math.max(0, Math.min(1.5, patch.level)) } : {}
    };
    this.items.set(id, next);
    if (this.db) {
      const tx = this.db.transaction(META, "readwrite");
      tx.objectStore(META).put(next);
      await done(tx).catch(() => {});
    }
    this.emit();
  }
  async blob(id) {
    await this.ready;
    const mem = this.memory.get(id);
    if (mem)
      return mem;
    if (!this.db)
      return null;
    const b = await req(this.db.transaction(DATA).objectStore(DATA).get(id)).catch(() => null);
    return b ?? null;
  }
  async url(id) {
    const have = this.urls.get(id);
    if (have)
      return have;
    const b = await this.blob(id);
    if (!b)
      return null;
    const u = URL.createObjectURL(b);
    this.urls.set(id, u);
    return u;
  }
  async source(id, ac) {
    const m = this.items.get(id);
    if (!m)
      return null;
    const cached = this.buffers.get(id);
    if (cached)
      return { kind: "buffer", buffer: cached, level: m.level };
    if (m.duration > 0 && m.duration <= DECODE_SECONDS) {
      const b = await this.blob(id);
      if (!b)
        return null;
      try {
        const buffer = await ac.decodeAudioData(await b.arrayBuffer());
        this.remember(id, buffer);
        return { kind: "buffer", buffer, level: m.level };
      } catch {
        return null;
      }
    }
    const url = await this.url(id);
    return url ? { kind: "url", url, level: m.level } : null;
  }
  remember(id, buffer) {
    this.buffers.delete(id);
    this.buffers.set(id, buffer);
    const bytes = (b) => b.length * b.numberOfChannels * 4;
    let total = 0;
    for (const b of this.buffers.values())
      total += bytes(b);
    while (total > DECODED_BUDGET && this.buffers.size > 1) {
      const oldest = this.buffers.keys().next().value;
      if (oldest === undefined)
        break;
      total -= bytes(this.buffers.get(oldest));
      this.buffers.delete(oldest);
    }
  }
  destroy() {
    for (const u of this.urls.values())
      URL.revokeObjectURL(u);
    this.urls.clear();
    this.buffers.clear();
    this.listeners.clear();
    this.db?.close();
    this.db = null;
  }
}

// src/i18n-dict.ts
var T = {
  General: ["常规", "一般", "一般", "Général", "Generale"],
  "Flair Packs": ["Flair 风格包", "Flair 風格包", "Flair パック", "Packs Flair", "Pacchetti Flair"],
  "Character profile": ["角色专属配置", "角色專屬設定", "キャラクター設定", "Profil du personnage", "Profilo personaggio"],
  "When you send": ["发送时", "傳送時", "送信時", "À l’envoi", "All’invio"],
  "Message glow": ["消息光晕", "訊息光暈", "メッセージの光", "Halo des messages", "Bagliore messaggi"],
  "Colour & mood": ["颜色与情绪", "顏色與情緒", "色と気分", "Couleur et humeur", "Colore e umore"],
  "Ambient scene": ["环境场景", "環境場景", "環境シーン", "Ambiance", "Scena ambientale"],
  "Scene Director & lighting": ["场景导演与灯光", "場景導演與燈光", "シーン演出と照明", "Mise en scène et lumière", "Regia e luci"],
  "Text & AI effects": ["文字与 AI 特效", "文字與 AI 特效", "テキストと AI 演出", "Texte et effets IA", "Testo ed effetti IA"],
  "Story heartbeat": ["故事心电图", "故事心電圖", "ストーリーの鼓動", "Pouls de l’histoire", "Battito della storia"],
  Celebrations: ["庆祝", "慶祝", "お祝い", "Célébrations", "Celebrazioni"],
  Achievements: ["成就", "成就", "実績", "Succès", "Obiettivi"],
  Sound: ["声音", "聲音", "サウンド", "Son", "Suono"],
  Share: ["分享", "分享", "共有", "Partager", "Condividi"],
  "Enable Lumi Flair": ["启用 Lumi Flair", "啟用 Lumi Flair", "Lumi Flair を有効化", "Activer Lumi Flair", "Attiva Lumi Flair"],
  "Respect “reduce motion”": ["遵循“减少动态效果”", "遵循「減少動態效果」", "「視差効果を減らす」に従う", "Respecter « réduire les animations »", "Rispetta «riduci movimento»"],
  "Spotlight mode": ["聚光模式", "聚光模式", "スポットライト", "Mode projecteur", "Modalità riflettore"],
  "No flashing": ["无闪烁", "無閃爍", "点滅なし", "Sans flashs", "Nessun lampeggio"],
  "Battery saver when needed": ["按需省电", "按需省電", "必要時に省電力", "Économie d’énergie si besoin", "Risparmio energetico se serve"],
  "Tap to glow (touch screens)": ["点按发光（触屏）", "點按發光（觸控螢幕）", "タップで光る（タッチ画面）", "Toucher pour illuminer (tactile)", "Tocca per illuminare (touch)"],
  "Import pack": ["导入风格包", "匯入風格包", "パックを読み込む", "Importer un pack", "Importa pacchetto"],
  "Export my look": ["导出我的风格", "匯出我的風格", "自分の見た目を書き出す", "Exporter mon style", "Esporta il mio stile"],
  "Imported ✓": ["已导入 ✓", "已匯入 ✓", "読み込み完了 ✓", "Importé ✓", "Importato ✓"],
  "Not a Flair pack": ["不是 Flair 风格包", "不是 Flair 風格包", "Flair パックではありません", "Pas un pack Flair", "Non è un pacchetto Flair"],
  "Give this character their own look": ["为该角色设置专属外观", "為此角色設定專屬外觀", "このキャラ専用の見た目にする", "Donner son propre style à ce personnage", "Dai a questo personaggio il suo stile"],
  "Remove profile": ["移除配置", "移除設定", "設定を削除", "Supprimer le profil", "Rimuovi profilo"],
  "This character": ["该角色", "此角色", "このキャラクター", "Ce personnage", "Questo personaggio"],
  "No character open": ["未打开角色", "未開啟角色", "キャラクター未選択", "Aucun personnage ouvert", "Nessun personaggio aperto"],
  "using their own Flair profile": ["正在使用专属配置", "正在使用專屬設定", "専用設定を使用中", "utilise son propre profil Flair", "usa il proprio profilo Flair"],
  "using your global settings": ["正在使用全局设置", "正在使用全域設定", "共通設定を使用中", "utilise vos réglages globaux", "usa le impostazioni globali"],
  "Profile active": ["配置已启用", "設定已啟用", "設定使用中", "Profil actif", "Profilo attivo"],
  "Remove character profile?": ["移除角色配置？", "移除角色設定？", "キャラクター設定を削除しますか？", "Supprimer le profil du personnage ?", "Rimuovere il profilo del personaggio?"],
  "This character goes back to your global Flair settings.": ["该角色将恢复使用全局 Flair 设置。", "此角色將恢復使用全域 Flair 設定。", "このキャラクターは共通の Flair 設定に戻ります。", "Ce personnage reprend vos réglages Flair globaux.", "Questo personaggio torna alle impostazioni Flair globali."],
  Remove: ["移除", "移除", "削除", "Supprimer", "Rimuovi"],
  "Screen effect": ["屏幕特效", "螢幕特效", "画面エフェクト", "Effet à l’écran", "Effetto a schermo"],
  Intensity: ["强度", "強度", "強さ", "Intensité", "Intensità"],
  "Your new message": ["你的新消息", "你的新訊息", "自分の新しいメッセージ", "Votre nouveau message", "Il tuo nuovo messaggio"],
  "AI reply finishes": ["AI 回复完成时", "AI 回覆完成時", "AI の返信完了時", "Fin de la réponse IA", "Fine risposta IA"],
  "Swipe transition": ["滑动切换效果", "滑動切換效果", "スワイプ時の切り替え", "Transition de swipe", "Transizione swipe"],
  "Composer glows while the AI thinks": ["AI 思考时输入框发光", "AI 思考時輸入框發光", "AI 考え中は入力欄が光る", "La zone de saisie brille pendant que l’IA réfléchit", "Il campo di testo brilla mentre l’IA pensa"],
  "Preview send effect": ["预览发送特效", "預覽傳送特效", "送信エフェクトを試す", "Aperçu de l’effet d’envoi", "Anteprima effetto invio"],
  "Sparkle burst": ["星光迸发", "星光迸發", "きらめき", "Gerbe d’étincelles", "Esplosione di scintille"],
  "Stars fan out from the composer": ["星星从输入框散开", "星星從輸入框散開", "入力欄から星が広がる", "Des étoiles jaillissent de la zone de saisie", "Stelle si aprono dal campo di testo"],
  Ripple: ["涟漪", "漣漪", "波紋", "Ondulation", "Increspatura"],
  "Rings pulse outward": ["光环向外扩散", "光環向外擴散", "輪が外へ広がる", "Des anneaux se propagent", "Anelli che si espandono"],
  Comet: ["彗星", "彗星", "彗星", "Comète", "Cometa"],
  "A streak flies up into the chat": ["一道光划入聊天", "一道光劃入聊天", "光の筋がチャットへ飛ぶ", "Une traînée s’envole dans le chat", "Una scia vola nella chat"],
  Confetti: ["彩纸", "彩紙", "紙吹雪", "Confettis", "Coriandoli"],
  "Theme-coloured paper pop": ["主题色彩纸", "主題色彩紙", "テーマ色の紙吹雪", "Confettis aux couleurs du thème", "Coriandoli nei colori del tema"],
  None: ["无", "無", "なし", "Aucun", "Nessuno"],
  "Pop + glow flash": ["弹出 + 光闪", "彈出 + 光閃", "ポップ＋光", "Apparition + éclat", "Pop + lampo di luce"],
  "Rise in": ["上浮进入", "上浮進入", "浮かび上がる", "Montée", "Comparsa dal basso"],
  "Glow bloom": ["光晕绽放", "光暈綻放", "光が広がる", "Halo qui s’épanouit", "Fioritura di luce"],
  Slide: ["滑入", "滑入", "スライド", "Glissement", "Scorrimento"],
  "Follows the swipe direction": ["跟随滑动方向", "跟隨滑動方向", "スワイプ方向に合わせる", "Suit le sens du swipe", "Segue la direzione dello swipe"],
  "Soft fade": ["柔和淡入", "柔和淡入", "ふんわりフェード", "Fondu doux", "Dissolvenza morbida"],
  "Hover style": ["悬停样式", "懸停樣式", "ホバー時のスタイル", "Style au survol", "Stile al passaggio"],
  "Applies to": ["应用于", "套用於", "対象", "S’applique à", "Si applica a"],
  "Glow strength": ["光晕强度", "光暈強度", "光の強さ", "Intensité du halo", "Intensità bagliore"],
  "Trace loop time": ["流光循环时间", "流光循環時間", "トレース周期", "Durée de la boucle", "Durata del ciclo"],
  "Aura while the AI is writing": ["AI 书写时的光环", "AI 書寫時的光環", "AI 執筆中のオーラ", "Aura pendant que l’IA écrit", "Aura mentre l’IA scrive"],
  "Flash latest message": ["闪亮最新消息", "閃亮最新訊息", "最新メッセージを光らせる", "Illuminer le dernier message", "Illumina l’ultimo messaggio"],
  "Edge trace": ["边缘流光", "邊緣流光", "縁を走る光", "Lumière de contour", "Luce sul bordo"],
  "A light runs around the border": ["一道光沿边框流动", "一道光沿邊框流動", "光が枠に沿って流れる", "Une lumière parcourt le contour", "Una luce percorre il bordo"],
  "Soft glow": ["柔光", "柔光", "やわらかな光", "Halo doux", "Bagliore morbido"],
  Neon: ["霓虹", "霓虹", "ネオン", "Néon", "Neon"],
  "Off (Lumiverse default)": ["关闭（Lumiverse 默认）", "關閉（Lumiverse 預設）", "オフ（Lumiverse 標準）", "Désactivé (défaut Lumiverse)", "Disattivato (predefinito Lumiverse)"],
  "All messages": ["所有消息", "所有訊息", "すべてのメッセージ", "Tous les messages", "Tutti i messaggi"],
  "Character messages": ["角色消息", "角色訊息", "キャラクターのメッセージ", "Messages du personnage", "Messaggi del personaggio"],
  "My messages": ["我的消息", "我的訊息", "自分のメッセージ", "Mes messages", "I miei messaggi"],
  "Glow colour": ["光晕颜色", "光暈顏色", "光の色", "Couleur du halo", "Colore del bagliore"],
  "Custom colour": ["自定义颜色", "自訂顏色", "カスタム色", "Couleur personnalisée", "Colore personalizzato"],
  "My messages use": ["我的消息使用", "我的訊息使用", "自分のメッセージの色", "Mes messages utilisent", "I miei messaggi usano"],
  "My colour": ["我的颜色", "我的顏色", "自分の色", "Ma couleur", "Il mio colore"],
  "Time-of-day tint": ["昼夜色调", "晝夜色調", "時間帯の色合い", "Teinte selon l’heure", "Tinta in base all’ora"],
  "Mood-reactive glow": ["随情绪变化的光晕", "隨情緒變化的光暈", "気分に反応する光", "Halo selon l’humeur", "Bagliore in base all’umore"],
  "Tint the whole UI with the mood": ["整个界面随情绪着色", "整個介面隨情緒著色", "画面全体を気分の色に", "Teinter toute l’interface selon l’humeur", "Colora tutta l’interfaccia con l’umore"],
  "Mood colours (labels = #hex, one rule per line)": ["情绪颜色（标签 = #颜色，每行一条）", "情緒顏色（標籤 = #顏色，每行一條）", "気分の色（ラベル = #色、1行に1つ）", "Couleurs d’humeur (étiquettes = #hex, une règle par ligne)", "Colori dell’umore (etichette = #hex, una regola per riga)"],
  "Character aura signatures": ["角色专属光环", "角色專屬光環", "キャラクター固有のオーラ", "Aura signature des personnages", "Aura distintiva dei personaggi"],
  "Follow my theme": ["跟随我的主题", "跟隨我的主題", "テーマに合わせる", "Suivre mon thème", "Segui il mio tema"],
  "Uses the accent, incl. character-aware tint": ["使用强调色，含角色色调", "使用強調色，含角色色調", "アクセント色（キャラ連動含む）", "Utilise l’accent, y compris la teinte du personnage", "Usa l’accento, inclusa la tinta del personaggio"],
  "Same colour": ["相同颜色", "相同顏色", "同じ色", "Même couleur", "Stesso colore"],
  "Warm amber": ["暖琥珀色", "暖琥珀色", "暖かい琥珀色", "Ambre chaud", "Ambra calda"],
  "Matches Minimal mode’s user bar": ["与简约模式的用户条一致", "與簡約模式的使用者條一致", "ミニマル表示のユーザー線と同じ", "Comme la barre utilisateur du mode Minimal", "Come la barra utente della modalità Minimal"],
  "Their own colour": ["单独颜色", "單獨顏色", "専用の色", "Leur propre couleur", "Un colore proprio"],
  mood: ["情绪", "情緒", "気分", "humeur", "umore"],
  time: ["时段", "時段", "時間帯", "heure", "ora"],
  Dawn: ["黎明", "黎明", "夜明け", "Aube", "Alba"],
  Day: ["白天", "白天", "昼", "Jour", "Giorno"],
  "Golden hour": ["黄金时刻", "黃金時刻", "ゴールデンアワー", "Heure dorée", "Ora d’oro"],
  Night: ["夜晚", "夜晚", "夜", "Nuit", "Notte"],
  "Default scene": ["默认场景", "預設場景", "標準シーン", "Ambiance par défaut", "Scena predefinita"],
  "This chat": ["当前聊天", "目前聊天", "このチャット", "Ce chat", "Questa chat"],
  "Follow the lorebook": ["跟随世界书", "跟隨世界書", "ロアブックに従う", "Suivre le lorebook", "Segui il lorebook"],
  Density: ["密度", "密度", "密度", "Densité", "Densità"],
  Opacity: ["不透明度", "不透明度", "不透明度", "Opacité", "Opacità"],
  "Use default / lorebook": ["使用默认 / 世界书", "使用預設 / 世界書", "標準 / ロアブック", "Défaut / lorebook", "Predefinito / lorebook"],
  "Lorebook only": ["仅世界书", "僅世界書", "ロアブックのみ", "Lorebook uniquement", "Solo lorebook"],
  "Now showing": ["当前显示", "目前顯示", "表示中", "Actuellement", "Ora in scena"],
  "lorebook suggests": ["世界书建议", "世界書建議", "ロアブックの提案", "le lorebook suggère", "il lorebook suggerisce"],
  Off: ["关闭", "關閉", "オフ", "Désactivé", "Disattivato"],
  Snow: ["雪", "雪", "雪", "Neige", "Neve"],
  Rain: ["雨", "雨", "雨", "Pluie", "Pioggia"],
  Embers: ["余烬", "餘燼", "火の粉", "Braises", "Braci"],
  Fireflies: ["萤火虫", "螢火蟲", "ホタル", "Lucioles", "Lucciole"],
  Petals: ["花瓣", "花瓣", "花びら", "Pétales", "Petali"],
  Starfield: ["星空", "星空", "星空", "Ciel étoilé", "Cielo stellato"],
  "Let the AI direct the scene": ["让 AI 导演场景", "讓 AI 導演場景", "AI にシーンを演出させる", "Laisser l’IA mettre en scène", "Lascia che l’IA diriga la scena"],
  "Default lighting": ["默认灯光", "預設燈光", "標準の照明", "Éclairage par défaut", "Illuminazione predefinita"],
  "Cinematic layer": ["电影感图层", "電影感圖層", "シネマティック効果", "Couche cinématique", "Livello cinematografico"],
  Vignette: ["暗角", "暗角", "ビネット", "Vignettage", "Vignettatura"],
  "Film grain": ["胶片颗粒", "膠片顆粒", "フィルムグレイン", "Grain de film", "Grana pellicola"],
  "Lightning in storms": ["暴风雨闪电", "暴風雨閃電", "嵐の稲妻", "Éclairs pendant l’orage", "Fulmini durante il temporale"],
  "Camera shake on shouts": ["大喊时镜头震动", "大喊時鏡頭震動", "叫び声で画面が揺れる", "Tremblement lors des cris", "Scossa della camera sulle urla"],
  "Preview lightning": ["预览闪电", "預覽閃電", "稲妻を試す", "Aperçu de l’éclair", "Anteprima fulmine"],
  "No direction yet": ["尚无导演指令", "尚無導演指令", "演出指示なし", "Pas encore de direction", "Nessuna regia per ora"],
  "AI direction": ["AI 导演", "AI 導演", "AI の演出", "Direction IA", "Regia IA"],
  light: ["灯光", "燈光", "照明", "lumière", "luce"],
  Daylight: ["日光", "日光", "昼の光", "Lumière du jour", "Luce del giorno"],
  "Dusk / golden hour": ["黄昏 / 黄金时刻", "黃昏 / 黃金時刻", "夕暮れ", "Crépuscule / heure dorée", "Tramonto / ora d’oro"],
  Candlelight: ["烛光", "燭光", "ろうそくの灯", "Bougie", "Lume di candela"],
  Storm: ["暴风雨", "暴風雨", "嵐", "Orage", "Tempesta"],
  "Neon city": ["霓虹都市", "霓虹都市", "ネオン街", "Ville néon", "Città al neon"],
  "Animated text effects": ["动态文字特效", "動態文字特效", "アニメーション文字", "Effets de texte animés", "Effetti di testo animati"],
  "How often the AI uses them": ["AI 使用频率", "AI 使用頻率", "AI が使う頻度", "Fréquence d’utilisation par l’IA", "Frequenza d’uso da parte dell’IA"],
  "Add the instructions to every prompt": ["在每次提示中加入说明", "在每次提示中加入說明", "毎回のプロンプトに指示を追加", "Ajouter les instructions à chaque prompt", "Aggiungi le istruzioni a ogni prompt"],
  "Allow prompt injection": ["允许注入提示", "允許注入提示", "プロンプト追加を許可", "Autoriser l’ajout au prompt", "Consenti l’aggiunta al prompt"],
  "Let the AI trigger screen effects": ["允许 AI 触发屏幕特效", "允許 AI 觸發螢幕特效", "AI に画面効果を許可", "Laisser l’IA déclencher des effets", "Lascia che l’IA attivi effetti a schermo"],
  "Choice chips": ["选项按钮", "選項按鈕", "選択肢ボタン", "Choix proposés", "Pulsanti di scelta"],
  "Send a choice immediately": ["点击选项后立即发送", "點擊選項後立即傳送", "選択肢をすぐ送信", "Envoyer le choix immédiatement", "Invia subito la scelta"],
  "Copy {{flair_tags}}": ["复制 {{flair_tags}}", "複製 {{flair_tags}}", "{{flair_tags}} をコピー", "Copier {{flair_tags}}", "Copia {{flair_tags}}"],
  "Copied ✓": ["已复制 ✓", "已複製 ✓", "コピーしました ✓", "Copié ✓", "Copiato ✓"],
  "Every reply": ["每次回复", "每次回覆", "毎回", "Chaque réponse", "Ogni risposta"],
  "3–6 styled phrases in each message": ["每条消息 3–6 处特效", "每則訊息 3–6 處特效", "各メッセージに3〜6か所", "3 à 6 passages stylisés par message", "3–6 frasi stilizzate per messaggio"],
  "Most replies": ["大部分回复", "大部分回覆", "ほとんどの返信", "La plupart des réponses", "Quasi tutte le risposte"],
  "1–3 where they fit": ["合适时 1–3 处", "合適時 1–3 處", "合う所に1〜3か所", "1 à 3 quand ça s’y prête", "1–3 quando servono"],
  Sparingly: ["少量使用", "少量使用", "控えめに", "Avec parcimonie", "Con parsimonia"],
  "Only for real emphasis": ["仅用于真正的强调", "僅用於真正的強調", "本当に強調したい時だけ", "Seulement pour insister", "Solo per vera enfasi"],
  "↑ joyful": ["↑ 喜悦", "↑ 喜悅", "↑ 喜び", "↑ joyeux", "↑ gioioso"],
  "↓ dark": ["↓ 阴暗", "↓ 陰暗", "↓ 暗い", "↓ sombre", "↓ cupo"],
  "That message is not loaded right now — scroll up to it and click again.": ["该消息当前未加载——请向上滚动后再点击。", "該訊息目前未載入——請向上捲動後再點擊。", "そのメッセージは未読込です。上にスクロールしてからもう一度クリックしてください。", "Ce message n’est pas chargé — remontez jusqu’à lui puis recliquez.", "Il messaggio non è caricato: scorri fino a lì e clicca di nuovo."],
  "Message milestones": ["消息里程碑", "訊息里程碑", "メッセージの節目", "Paliers de messages", "Traguardi di messaggi"],
  "Keyword triggers (phrase => sparkle | ripple | comet | confetti)": ["关键词触发（短语 => sparkle | ripple | comet | confetti）", "關鍵字觸發（短語 => sparkle | ripple | comet | confetti）", "キーワード演出（語句 => sparkle | ripple | comet | confetti）", "Déclencheurs (phrase => sparkle | ripple | comet | confetti)", "Parole chiave (frase => sparkle | ripple | comet | confetti)"],
  "Show unlock cards": ["显示解锁卡片", "顯示解鎖卡片", "解除カードを表示", "Afficher les cartes de succès", "Mostra le schede di sblocco"],
  "Achievement unlocked": ["成就解锁", "成就解鎖", "実績解除", "Succès débloqué", "Obiettivo sbloccato"],
  messages: ["条消息", "則訊息", "メッセージ", "messages", "messaggi"],
  "Interface sounds": ["界面音效", "介面音效", "インターフェース音", "Sons de l’interface", "Suoni dell’interfaccia"],
  Volume: ["音量", "音量", "音量", "Volume", "Volume"],
  "Test sound": ["测试声音", "測試聲音", "音を試す", "Tester le son", "Prova suono"],
  Soundscapes: ["环境音景", "環境音景", "環境音", "Ambiances sonores", "Paesaggi sonori"],
  "Soundscape volume": ["音景音量", "音景音量", "環境音の音量", "Volume de l’ambiance", "Volume del paesaggio sonoro"],
  "Moment Card of the latest reply": ["为最新回复生成瞬间卡片", "為最新回覆生成瞬間卡片", "最新の返信をモーメントカードに", "Carte Moment de la dernière réponse", "Scheda Momento dell’ultima risposta"],
  "Moment Card": ["瞬间卡片", "瞬間卡片", "モーメントカード", "Carte Moment", "Scheda Momento"],
  "Make a Moment Card": ["生成瞬间卡片", "生成瞬間卡片", "モーメントカードを作る", "Créer une carte Moment", "Crea una scheda Momento"],
  "Export theme pack": ["导出主题包", "匯出主題包", "テーマパックを書き出す", "Exporter le pack de thème", "Esporta pacchetto tema"],
  "Show welcome": ["显示欢迎页", "顯示歡迎頁", "ようこそ画面を表示", "Afficher l’accueil", "Mostra benvenuto"],
  "Reset to defaults": ["恢复默认", "恢復預設", "初期設定に戻す", "Réinitialiser", "Ripristina predefiniti"],
  "Reset Lumi Flair?": ["重置 Lumi Flair？", "重設 Lumi Flair？", "Lumi Flair をリセットしますか？", "Réinitialiser Lumi Flair ?", "Ripristinare Lumi Flair?"],
  "All Flair settings go back to their defaults, and character profiles are removed.": ["所有 Flair 设置将恢复默认，角色配置将被移除。", "所有 Flair 設定將恢復預設，角色設定將被移除。", "すべての Flair 設定が初期値に戻り、キャラクター設定は削除されます。", "Tous les réglages Flair reviennent par défaut et les profils de personnages sont supprimés.", "Tutte le impostazioni Flair tornano predefinite e i profili dei personaggi vengono rimossi."],
  Reset: ["重置", "重設", "リセット", "Réinitialiser", "Ripristina"],
  "Spotlight mode ": ["聚光模式", "聚光模式", "スポットライト", "Mode projecteur", "Modalità riflettore"],
  "Flair effects": ["Flair 特效", "Flair 特效", "Flair エフェクト", "Effets Flair", "Effetti Flair"],
  On: ["开启", "開啟", "オン", "Activé", "Attivo"],
  "On — other messages dim on hover": ["开启——悬停时其他消息变暗", "開啟——懸停時其他訊息變暗", "オン — ホバー中は他が暗くなる", "Activé — les autres messages s’assombrissent", "Attivo — gli altri messaggi si attenuano"],
  "Welcome to Lumi Flair": ["欢迎使用 Lumi Flair", "歡迎使用 Lumi Flair", "Lumi Flair へようこそ", "Bienvenue dans Lumi Flair", "Benvenuto in Lumi Flair"],
  "The story controls the room: glow, weather, light and sound that react to your chat. Pick a look to start — you can change everything later in the Flair tab.": [
    "故事掌控整个房间：光晕、天气、灯光与声音都会随聊天变化。先选一个风格开始——之后可在 Flair 标签页中随时更改。",
    "故事掌控整個房間：光暈、天氣、燈光與聲音都會隨聊天變化。先選一個風格開始——之後可在 Flair 分頁中隨時更改。",
    "物語が部屋を動かす——光、天気、照明、音がチャットに反応します。まずは見た目を選びましょう。あとから Flair タブでいつでも変更できます。",
    "L’histoire pilote la pièce : halo, météo, lumière et son réagissent à votre conversation. Choisissez un style pour commencer — tout se modifie ensuite dans l’onglet Flair.",
    "La storia controlla la stanza: luce, meteo, illuminazione e suono reagiscono alla chat. Scegli uno stile per iniziare: potrai cambiare tutto dalla scheda Flair."
  ],
  "Choose a Flair Pack": ["选择一个 Flair 风格包", "選擇一個 Flair 風格包", "Flair パックを選ぶ", "Choisissez un pack Flair", "Scegli un pacchetto Flair"],
  "Optional extras": ["可选附加功能", "可選附加功能", "オプション", "Options facultatives", "Extra facoltativi"],
  Enabled: ["已启用", "已啟用", "有効", "Activé", "Attivo"],
  "AI storytelling": ["AI 叙事", "AI 敘事", "AI ストーリーテリング", "Narration IA", "Narrazione IA"],
  "Lets Flair add a short note to each prompt so the AI uses text effects, directs scenes and offers choices. (interceptor permission)": [
    "允许 Flair 在每次提示中加入简短说明，让 AI 使用文字特效、导演场景并提供选项。（interceptor 权限）",
    "允許 Flair 在每次提示中加入簡短說明，讓 AI 使用文字特效、導演場景並提供選項。（interceptor 權限）",
    "Flair が各プロンプトに短い指示を追加し、AI が文字演出・シーン演出・選択肢を使えるようにします。（interceptor 権限）",
    "Flair ajoute une courte note à chaque prompt pour que l’IA utilise les effets de texte, mette en scène et propose des choix. (permission interceptor)",
    "Flair aggiunge una breve nota a ogni prompt così l’IA usa effetti di testo, dirige le scene e propone scelte. (permesso interceptor)"
  ],
  Allow: ["允许", "允許", "許可", "Autoriser", "Consenti"],
  "Mood-tinted interface": ["情绪着色界面", "情緒著色介面", "気分で色づくUI", "Interface teintée par l’humeur", "Interfaccia colorata dall’umore"],
  "Re-tints Lumiverse’s accent to the character’s mood, then restores your theme. (app_manipulation permission)": [
    "根据角色情绪重新着色 Lumiverse 强调色，之后恢复你的主题。（app_manipulation 权限）",
    "依角色情緒重新著色 Lumiverse 強調色，之後恢復你的主題。（app_manipulation 權限）",
    "キャラクターの気分に合わせて Lumiverse のアクセント色を変え、その後テーマを戻します。（app_manipulation 権限）",
    "Recolore l’accent de Lumiverse selon l’humeur du personnage, puis restaure votre thème. (permission app_manipulation)",
    "Ricolora l’accento di Lumiverse in base all’umore del personaggio, poi ripristina il tema. (permesso app_manipulation)"
  ],
  "Sound & soundscapes": ["音效与音景", "音效與音景", "サウンドと環境音", "Sons et ambiances", "Suoni e paesaggi sonori"],
  "Soft chimes plus rain, fire, wind and night ambience generated live — no audio files.": [
    "柔和提示音，以及实时生成的雨声、火焰、风声和夜晚环境音——无需音频文件。",
    "柔和提示音，以及即時生成的雨聲、火焰、風聲和夜晚環境音——無需音訊檔。",
    "やさしいチャイムと、リアルタイム生成の雨・炎・風・夜の環境音。音声ファイルは不要です。",
    "Carillons doux et ambiances de pluie, feu, vent et nuit générées en direct — sans fichiers audio.",
    "Rintocchi delicati e atmosfere di pioggia, fuoco, vento e notte generate dal vivo — nessun file audio."
  ],
  "Turn on": ["开启", "開啟", "オンにする", "Activer", "Attiva"],
  "Start chatting ✦": ["开始聊天 ✦", "開始聊天 ✦", "チャットを始める ✦", "Commencer à discuter ✦", "Inizia a chattare ✦"],
  "Lumi Flair adds a short note to each prompt so the AI uses text effects, directs scenes and offers choices.": [
    "Lumi Flair 会在每次提示中加入简短说明，让 AI 使用文字特效、导演场景并提供选项。",
    "Lumi Flair 會在每次提示中加入簡短說明，讓 AI 使用文字特效、導演場景並提供選項。",
    "Lumi Flair が各プロンプトに短い指示を追加し、AI が文字演出・シーン演出・選択肢を使えるようにします。",
    "Lumi Flair ajoute une courte note à chaque prompt pour que l’IA utilise les effets de texte, mette en scène et propose des choix.",
    "Lumi Flair aggiunge una breve nota a ogni prompt così l’IA usa effetti di testo, dirige le scene e propone scelte."
  ],
  "Lumi Flair restyles Lumiverse’s colours to match your Flair Pack, the speaking character or their mood. Your saved theme is never changed — switching it off restores it.": [
    "Lumi Flair 会根据你的 Flair 风格包、正在说话的角色或其情绪调整 Lumiverse 的配色。你保存的主题不会被修改——关闭即可恢复。",
    "Lumi Flair 會依你的 Flair 風格包、正在說話的角色或其情緒調整 Lumiverse 的配色。你儲存的主題不會被修改——關閉即可還原。",
    "Lumi Flair は Flair パック、話しているキャラクター、その気分に合わせて Lumiverse の色を変えます。保存したテーマは変更されず、オフにすれば元に戻ります。",
    "Lumi Flair adapte les couleurs de Lumiverse à votre pack Flair, au personnage qui parle ou à son humeur. Votre thème enregistré n’est jamais modifié — désactivez pour le retrouver.",
    "Lumi Flair adatta i colori di Lumiverse al tuo pacchetto Flair, al personaggio che parla o al suo umore. Il tuo tema salvato non viene mai modificato — disattiva per ripristinarlo."
  ],
  "Lumi Classic": ["Lumi 经典", "Lumi 經典", "Lumi クラシック", "Lumi Classique", "Lumi Classico"],
  "Your theme colours, sparkles and an edge trace.": ["你的主题色、星光与边缘流光。", "你的主題色、星光與邊緣流光。", "テーマ色、きらめき、縁を走る光。", "Les couleurs de votre thème, des étincelles et un contour lumineux.", "I colori del tuo tema, scintille e una luce sul bordo."],
  "Cozy Fantasy": ["温馨奇幻", "溫馨奇幻", "ほっこりファンタジー", "Fantasy douillette", "Fantasy accogliente"],
  "Candlelight, fireflies and warm amber glow.": ["烛光、萤火虫与温暖琥珀光。", "燭光、螢火蟲與溫暖琥珀光。", "ろうそくの灯、ホタル、暖かな琥珀色の光。", "Bougies, lucioles et halo ambré.", "Lume di candela, lucciole e un caldo bagliore ambrato."],
  "Cyberpunk Neon": ["赛博朋克霓虹", "賽博龐克霓虹", "サイバーパンク・ネオン", "Néon cyberpunk", "Neon cyberpunk"],
  "Neon edges, comets and a city in the rain.": ["霓虹边框、彗星与雨中城市。", "霓虹邊框、彗星與雨中城市。", "ネオンの縁、彗星、雨の街。", "Contours néon, comètes et une ville sous la pluie.", "Bordi al neon, comete e una città sotto la pioggia."],
  Horror: ["恐怖", "恐怖", "ホラー", "Horreur", "Horror"],
  "Storm light, film grain and a blood-red pulse.": ["暴风光线、胶片颗粒与血红脉动。", "暴風光線、膠片顆粒與血紅脈動。", "嵐の光、フィルムグレイン、血のように赤い脈動。", "Lumière d’orage, grain de film et pulsation rouge sang.", "Luce di tempesta, grana e un battito rosso sangue."],
  "Sakura Romance": ["樱花浪漫", "櫻花浪漫", "桜ロマンス", "Romance sakura", "Romanticismo sakura"],
  "Falling petals, dawn light and soft pink glow.": ["飘落的花瓣、黎明光线与柔粉光晕。", "飄落的花瓣、黎明光線與柔粉光暈。", "舞う花びら、夜明けの光、やわらかなピンクの光。", "Pétales qui tombent, lumière d’aube et halo rose.", "Petali che cadono, luce dell’alba e un tenue bagliore rosa."],
  "Deep Space": ["深空", "深空", "ディープスペース", "Espace lointain", "Spazio profondo"],
  "A starfield, shooting stars and cool indigo light.": ["星空、流星与清冷靛蓝光。", "星空、流星與清冷靛藍光。", "星空、流れ星、冷たい藍色の光。", "Un ciel étoilé, des étoiles filantes et une lumière indigo.", "Un cielo stellato, stelle cadenti e una fredda luce indaco."],
  Noir: ["黑色电影", "黑色電影", "ノワール", "Noir", "Noir"],
  "Rain on the window, grain and silver light.": ["窗上的雨、颗粒与银色光线。", "窗上的雨、顆粒與銀色光線。", "窓を打つ雨、粒子、銀色の光。", "La pluie sur la vitre, du grain et une lumière argentée.", "Pioggia sul vetro, grana e luce argentata."],
  "First Spark": ["第一缕火花", "第一縷火花", "最初のきらめき", "Première étincelle", "Prima scintilla"],
  "Send your first message with Lumi Flair.": ["使用 Lumi Flair 发送第一条消息。", "使用 Lumi Flair 傳送第一則訊息。", "Lumi Flair で最初のメッセージを送る。", "Envoyez votre premier message avec Lumi Flair.", "Invia il tuo primo messaggio con Lumi Flair."],
  Storyteller: ["讲述者", "講述者", "語り手", "Conteur", "Narratore"],
  "Send 100 messages.": ["发送 100 条消息。", "傳送 100 則訊息。", "100件のメッセージを送る。", "Envoyez 100 messages.", "Invia 100 messaggi."],
  "Saga Weaver": ["史诗编织者", "史詩編織者", "物語の紡ぎ手", "Tisseur de sagas", "Tessitore di saghe"],
  "Send 1,000 messages.": ["发送 1,000 条消息。", "傳送 1,000 則訊息。", "1,000件のメッセージを送る。", "Envoyez 1 000 messages.", "Invia 1.000 messaggi."],
  Milestone: ["里程碑", "里程碑", "節目", "Palier", "Traguardo"],
  "Reach a message milestone in a chat.": ["在一个聊天中达到消息里程碑。", "在一個聊天中達到訊息里程碑。", "チャットでメッセージの節目に到達する。", "Atteignez un palier de messages dans un chat.", "Raggiungi un traguardo di messaggi in una chat."],
  "Night Owl": ["夜猫子", "夜貓子", "夜ふかし", "Oiseau de nuit", "Nottambulo"],
  "Chat between midnight and 4 AM.": ["在午夜到凌晨 4 点之间聊天。", "在午夜到凌晨 4 點之間聊天。", "深夜0時〜4時にチャットする。", "Discutez entre minuit et 4 h.", "Chatta tra mezzanotte e le 4."],
  "Early Bird": ["早起鸟", "早起鳥", "早起き", "Lève-tôt", "Mattiniero"],
  "Chat between 5 and 7 AM.": ["在早上 5 点到 7 点之间聊天。", "在早上 5 點到 7 點之間聊天。", "朝5時〜7時にチャットする。", "Discutez entre 5 h et 7 h.", "Chatta tra le 5 e le 7."],
  Kindled: ["初燃", "初燃", "灯がともる", "Étincelle allumée", "Fiamma accesa"],
  "Chat on 3 days in a row.": ["连续 3 天聊天。", "連續 3 天聊天。", "3日連続でチャットする。", "Discutez 3 jours d’affilée.", "Chatta per 3 giorni di fila."],
  Devoted: ["忠实", "忠實", "献身", "Dévoué", "Devoto"],
  "Chat on 7 days in a row.": ["连续 7 天聊天。", "連續 7 天聊天。", "7日連続でチャットする。", "Discutez 7 jours d’affilée.", "Chatta per 7 giorni di fila."],
  "Action!": ["开拍！", "開拍！", "アクション！", "Action !", "Azione!"],
  "The AI directs its first scene.": ["AI 导演了第一个场景。", "AI 導演了第一個場景。", "AI が初めてシーンを演出する。", "L’IA met en scène pour la première fois.", "L’IA dirige la sua prima scena."],
  "Weather Watcher": ["天气观察者", "天氣觀察者", "お天気ウォッチャー", "Observateur du ciel", "Osservatore del meteo"],
  "Experience 4 different ambient scenes.": ["体验 4 种不同的环境场景。", "體驗 4 種不同的環境場景。", "4種類の環境シーンを体験する。", "Vivez 4 ambiances différentes.", "Vivi 4 scene ambientali diverse."],
  "Emotional Range": ["情绪万千", "情緒萬千", "感情の幅", "Palette d’émotions", "Gamma emotiva"],
  "See 5 different moods in one chat.": ["在一个聊天中看到 5 种不同情绪。", "在一個聊天中看到 5 種不同情緒。", "1つのチャットで5種類の気分を見る。", "Voyez 5 humeurs différentes dans un chat.", "Vedi 5 umori diversi in una chat."],
  Showstopper: ["全场焦点", "全場焦點", "ショーストッパー", "Clou du spectacle", "Colpo di scena"],
  "The AI triggers a screen effect.": ["AI 触发了屏幕特效。", "AI 觸發了螢幕特效。", "AI が画面効果を起こす。", "L’IA déclenche un effet à l’écran.", "L’IA attiva un effetto a schermo."],
  Pathfinder: ["探路者", "探路者", "道を選ぶ者", "Éclaireur", "Esploratore"],
  "Pick 10 suggested choices.": ["选择 10 个建议选项。", "選擇 10 個建議選項。", "提案された選択肢を10回選ぶ。", "Choisissez 10 options proposées.", "Scegli 10 opzioni suggerite."],
  Shutterbug: ["摄影迷", "攝影迷", "カメラ好き", "Photographe", "Fotoamatore"],
  "Create a Moment Card.": ["创建一张瞬间卡片。", "建立一張瞬間卡片。", "モーメントカードを作る。", "Créez une carte Moment.", "Crea una scheda Momento."],
  "Set Dresser": ["布景师", "佈景師", "美術スタッフ", "Décorateur", "Scenografo"],
  "Apply a Flair Pack.": ["应用一个 Flair 风格包。", "套用一個 Flair 風格包。", "Flair パックを適用する。", "Appliquez un pack Flair.", "Applica un pacchetto Flair."],
  "Back up settings": ["备份设置", "備份設定", "設定をバックアップ", "Sauvegarder les réglages", "Backup impostazioni"],
  "Restore from file": ["从文件恢复", "從檔案還原", "ファイルから復元", "Restaurer depuis un fichier", "Ripristina da file"],
  "Restored ✓": ["已恢复 ✓", "已還原 ✓", "復元しました ✓", "Restauré ✓", "Ripristinato ✓"],
  "Not a Flair backup": ["不是 Flair 备份", "不是 Flair 備份", "Flair のバックアップではありません", "Pas une sauvegarde Flair", "Non è un backup Flair"],
  "Saving…": ["正在保存…", "正在儲存…", "保存中…", "Enregistrement…", "Salvataggio…"],
  "Auto-saved": ["已自动保存", "已自動儲存", "自動保存済み", "Enregistré automatiquement", "Salvato automaticamente"],
  "Not saved — check the console": ["未保存——请查看控制台", "未儲存——請查看主控台", "未保存 — コンソールを確認", "Non enregistré — voir la console", "Non salvato — controlla la console"],
  Account: ["账户", "帳戶", "アカウント", "Compte", "Account"],
  "Config file": ["配置文件", "設定檔", "設定ファイル", "Fichier de config", "File di configurazione"],
  "This browser": ["此浏览器", "此瀏覽器", "このブラウザ", "Ce navigateur", "Questo browser"],
  "just now": ["刚刚", "剛剛", "たった今", "à l’instant", "proprio ora"],
  ago: ["前", "前", "前", "", "fa"],
  "not saved yet": ["尚未保存", "尚未儲存", "未保存", "pas encore enregistré", "non ancora salvato"],
  "Effects in use": ["启用的效果", "啟用的效果", "使用するエフェクト", "Effets utilisés", "Effetti attivi"],
  "Turn all on": ["全部开启", "全部開啟", "すべてオン", "Tout activer", "Attiva tutti"],
  "On — click to turn off": ["已开启——点击关闭", "已開啟——點擊關閉", "オン — クリックでオフ", "Activé — cliquer pour désactiver", "Attivo — clic per spegnere"],
  "Off — click to turn on": ["已关闭——点击开启", "已關閉——點擊開啟", "オフ — クリックでオン", "Désactivé — cliquer pour activer", "Spento — clic per attivare"],
  Shake: ["震动", "震動", "揺れ", "Tremblement", "Tremolio"],
  Glow: ["发光", "發光", "発光", "Lueur", "Bagliore"],
  Whisper: ["低语", "低語", "ささやき", "Murmure", "Sussurro"],
  Rainbow: ["彩虹", "彩虹", "虹色", "Arc-en-ciel", "Arcobaleno"],
  Pulse: ["脉动", "脈動", "鼓動", "Pulsation", "Pulsazione"],
  Big: ["放大", "放大", "大きく", "Grand", "Grande"],
  Typewriter: ["打字机", "打字機", "タイプライター", "Machine à écrire", "Macchina da scrivere"],
  Fade: ["淡入", "淡入", "フェード", "Fondu", "Dissolvenza"],
  Glitch: ["故障", "故障", "グリッチ", "Glitch", "Glitch"],
  Flicker: ["闪烁", "閃爍", "ちらつき", "Scintillement", "Sfarfallio"],
  Playing: ["正在播放", "正在播放", "再生中", "Lecture", "In riproduzione"],
  "Paused by the browser — click anywhere to resume": ["浏览器已暂停——点击任意处继续", "瀏覽器已暫停——點擊任意處繼續", "ブラウザが一時停止 — どこかをクリックで再開", "Mis en pause par le navigateur — cliquez n’importe où pour reprendre", "Messo in pausa dal browser — clicca ovunque per riprendere"],
  "Silent — this scene and lighting have no ambience": ["静音——此场景和灯光没有环境音", "靜音——此場景和燈光沒有環境音", "無音 — このシーンと照明には環境音がありません", "Silence — cette scène et cet éclairage n’ont pas d’ambiance", "Silenzio — questa scena e luce non hanno ambiente"],
  "Lumiverse theme": ["Lumiverse 主题", "Lumiverse 主題", "Lumiverse テーマ", "Thème Lumiverse", "Tema Lumiverse"],
  "Keep my theme": ["保留我的主题", "保留我的主題", "自分のテーマのまま", "Garder mon thème", "Mantieni il mio tema"],
  "Flair only styles its own effects": ["Flair 只调整自身特效", "Flair 只調整自身特效", "Flair は自身の演出だけを装飾", "Flair ne stylise que ses effets", "Flair stilizza solo i suoi effetti"],
  "Match the Flair Pack": ["匹配 Flair 风格包", "配合 Flair 風格包", "Flair パックに合わせる", "Assortir au pack Flair", "Abbina al pacchetto Flair"],
  "Accent, backgrounds and dialogue colours follow the pack": ["强调色、背景和对话颜色跟随风格包", "強調色、背景與對話顏色跟隨風格包", "アクセント・背景・台詞の色がパックに合わせて変化", "Accent, fonds et dialogues suivent le pack", "Accento, sfondi e dialoghi seguono il pacchetto"],
  "Character aware": ["角色感知", "角色感知", "キャラクター連動", "Selon le personnage", "In base al personaggio"],
  "Follows the aura colour of whoever is speaking": ["跟随正在说话角色的气场颜色", "跟隨正在說話角色的氣場顏色", "話しているキャラクターのオーラ色に追従", "Suit la couleur d’aura du personnage qui parle", "Segue il colore aura di chi sta parlando"],
  "Theme strength": ["主题强度", "主題強度", "テーマの強さ", "Intensité du thème", "Intensità del tema"],
  "Accent + backgrounds": ["强调色 + 背景", "強調色 + 背景", "アクセント + 背景", "Accent + fonds", "Accento + sfondi"],
  "The whole interface takes on the mood": ["整个界面融入氛围", "整個介面融入氛圍", "インターフェース全体が雰囲気に染まる", "Toute l’interface prend l’ambiance", "Tutta l’interfaccia prende l’atmosfera"],
  "Accent colours only": ["仅强调色", "僅強調色", "アクセント色のみ", "Couleurs d’accent seulement", "Solo colori d’accento"],
  "Buttons, highlights and dialogue; your backgrounds stay": ["按钮、高亮与对话；背景保持不变", "按鈕、強調與對話；背景保持不變", "ボタン・強調・台詞のみ。背景はそのまま", "Boutons, surlignages et dialogues ; vos fonds restent", "Pulsanti, evidenziazioni e dialoghi; gli sfondi restano"],
  "Theming Lumiverse": ["正在为 Lumiverse 配色", "正在為 Lumiverse 配色", "Lumiverse に適用中", "Thème Lumiverse", "Tema Lumiverse"],
  "Needs permission to restyle Lumiverse — pick the option again to allow it.": ["需要权限才能调整 Lumiverse——重新选择该选项以授权。", "需要權限才能調整 Lumiverse——重新選擇該選項以授權。", "Lumiverse の装飾には許可が必要です — もう一度選んで許可してください。", "Autorisation nécessaire — choisissez à nouveau l’option pour l’accorder.", "Serve un permesso — scegli di nuovo l’opzione per concederlo."],
  "Waiting for a character message to read their aura colour…": ["等待角色消息以读取其气场颜色…", "等待角色訊息以讀取其氣場顏色…", "キャラクターのメッセージからオーラ色を読み取り中…", "En attente d’un message du personnage pour lire son aura…", "In attesa di un messaggio del personaggio per leggere la sua aura…"],
  "This pack uses your own theme, so Lumiverse is unchanged.": ["此风格包使用你自己的主题，Lumiverse 保持不变。", "此風格包使用你自己的主題，Lumiverse 保持不變。", "このパックは自分のテーマを使うため Lumiverse は変わりません。", "Ce pack utilise votre thème : Lumiverse reste inchangé.", "Questo pacchetto usa il tuo tema: Lumiverse resta invariato."],
  "Character aura": ["角色气场", "角色氣場", "キャラクターのオーラ", "Aura du personnage", "Aura del personaggio"],
  "The aura colour of whoever is speaking": ["正在说话角色的气场颜色", "正在說話角色的氣場顏色", "話しているキャラクターのオーラ色", "La couleur d’aura du personnage qui parle", "Il colore aura di chi sta parlando"],
  "Character Aware": ["角色感知", "角色感知", "キャラクター連動", "Selon le personnage", "In base al personaggio"],
  "Glow and theme follow whoever is speaking, from their aura colours.": ["光晕与主题跟随正在说话的角色，取自其气场颜色。", "光暈與主題跟隨正在說話的角色，取自其氣場顏色。", "光とテーマが話しているキャラクターのオーラ色に追従。", "Halo et thème suivent le personnage qui parle, d’après son aura.", "Bagliore e tema seguono chi parla, dai colori della sua aura."],
  "Match Lumiverse to your pack": ["让 Lumiverse 匹配你的风格包", "讓 Lumiverse 配合你的風格包", "Lumiverse をパックに合わせる", "Assortir Lumiverse à votre pack", "Abbina Lumiverse al tuo pacchetto"],
  "Save my look": ["保存我的外观", "儲存我的外觀", "今の見た目を保存", "Enregistrer mon style", "Salva il mio stile"],
  "Save my look as a pack": ["将当前外观保存为风格包", "將目前外觀儲存為風格包", "今の見た目をパックとして保存", "Enregistrer mon style comme pack", "Salva il mio stile come pacchetto"],
  "Pack name": ["风格包名称", "風格包名稱", "パック名", "Nom du pack", "Nome del pacchetto"],
  "My Flair Pack": ["我的 Flair 风格包", "我的 Flair 風格包", "マイ Flair パック", "Mon pack Flair", "Il mio pacchetto Flair"],
  "Save pack": ["保存风格包", "儲存風格包", "パックを保存", "Enregistrer", "Salva"],
  Cancel: ["取消", "取消", "キャンセル", "Annuler", "Annulla"],
  Imported: ["已导入", "已匯入", "インポート", "Importé", "Importato"],
  Yours: ["自定义", "自訂", "マイパック", "Perso", "Tuo"],
  "Imported pack": ["导入的风格包", "匯入的風格包", "インポートしたパック", "Pack importé", "Pacchetto importato"],
  "Saved from your look": ["从你的外观保存", "從你的外觀儲存", "自分の見た目から保存", "Enregistré depuis votre style", "Salvato dal tuo stile"],
  "Remove pack": ["移除风格包", "移除風格包", "パックを削除", "Retirer le pack", "Rimuovi pacchetto"],
  "Remove pack?": ["移除风格包？", "移除風格包？", "パックを削除しますか？", "Retirer ce pack ?", "Rimuovere il pacchetto?"],
  "Rewinding the story…": ["正在回溯故事…", "正在回溯故事…", "ストーリーを巻き戻し中…", "Retour dans l’histoire…", "Riavvolgo la storia…"],
  "Click or press Esc to cancel": ["点击或按 Esc 取消", "點擊或按 Esc 取消", "クリックまたは Esc でキャンセル", "Cliquez ou Échap pour annuler", "Clicca o premi Esc per annullare"],
  "That message no longer exists, so its point was removed.": ["该消息已不存在，已移除对应的点。", "該訊息已不存在，已移除對應的點。", "そのメッセージは存在しないため、点を削除しました。", "Ce message n’existe plus : son point a été retiré.", "Quel messaggio non esiste più: il punto è stato rimosso."],
  "Couldn’t reach that message just now — try again in a moment.": ["暂时无法到达该消息——请稍后再试。", "暫時無法到達該訊息——請稍後再試。", "今はそのメッセージへ移動できません — 少し待って再試行してください。", "Impossible d’atteindre ce message pour l’instant — réessayez dans un moment.", "Impossibile raggiungere il messaggio ora — riprova tra poco."],
  "Open the chat to jump to its messages.": ["打开聊天以跳转到其消息。", "開啟聊天以跳轉到其訊息。", "チャットを開くとメッセージへ移動できます。", "Ouvrez la discussion pour y accéder.", "Apri la chat per saltare ai messaggi."],
  Creamy: ["奶油喷泉", "奶油噴泉", "クリーミー", "Crémeux", "Cremoso"],
  "A whale-spout of thick white cream erupts and rains back down": ["一股浓稠的白色奶油像鲸鱼喷水般喷出，再洒落下来", "一股濃稠的白色奶油像鯨魚噴水般噴出，再灑落下來", "濃厚な白いクリームがクジラの潮吹きのように噴き上がり、降り注ぐ", "Un jet de crème blanche épaisse jaillit comme une baleine et retombe en pluie", "Uno zampillo di densa crema bianca erutta come una balena e ricade"],
  "Black Hole ✦": ["黑洞 ✦", "黑洞 ✦", "ブラックホール ✦", "Trou noir ✦", "Buco nero ✦"],
  "Overkill: a singularity swallows everything, collapses to a white dot, then detonates": ["极致特效：奇点吞噬一切，坍缩成一个白点，然后爆炸", "極致特效：奇點吞噬一切，坍縮成一個白點，然後爆炸", "派手モード：特異点がすべてを飲み込み、白い点に縮んでから爆発する", "Démesuré : une singularité avale tout, s’effondre en un point blanc, puis explose", "Esagerato: una singolarità inghiotte tutto, collassa in un punto bianco, poi esplode"],
  "Petal Storm ✦": ["花瓣风暴 ✦", "花瓣風暴 ✦", "花吹雪 ✦", "Tempête de pétales ✦", "Tempesta di petali ✦"],
  "Overkill: blossoms burst from the button and a gale sweeps them across the screen": ["极致特效：花瓣从按钮迸出，狂风将它们卷过整个屏幕", "極致特效：花瓣從按鈕迸出，狂風將它們捲過整個螢幕", "派手モード：ボタンから花びらが舞い上がり、突風が画面いっぱいに吹き抜ける", "Démesuré : des pétales jaillissent du bouton et une rafale les emporte sur tout l’écran", "Esagerato: i petali esplodono dal pulsante e una raffica li spazza su tutto lo schermo"],
  "Trail length": ["拖尾长度", "拖尾長度", "軌跡の長さ", "Longueur de la traînée", "Lunghezza della scia"],
  "Cursor trail": ["光标拖尾", "游標拖尾", "カーソルの軌跡", "Traînée du curseur", "Scia del cursore"],
  "Black Hole": ["黑洞", "黑洞", "ブラックホール", "Trou noir", "Buco nero"],
  "Petal Storm": ["花瓣风暴", "花瓣風暴", "花吹雪", "Tempête de pétales", "Tempesta di petali"],
  "The trail follows your mouse pointer, so it doesn’t show on a touch screen.": ["拖尾跟随鼠标指针，因此在触摸屏上不会显示。", "拖尾跟隨滑鼠指標，因此在觸控螢幕上不會顯示。", "軌跡はマウスポインターを追うため、タッチ画面では表示されません。", "La traînée suit le pointeur de la souris : elle n’apparaît pas sur un écran tactile.", "La scia segue il puntatore del mouse, quindi non appare su un touch screen."],
  Splash: ["水花", "水花", "スプラッシュ", "Éclaboussure", "Spruzzo"],
  "A hose-like gush of clear water bursts out and breaks into spray": ["一股如水管般的清水喷涌而出，散成水雾", "一股如水管般的清水噴湧而出，散成水霧", "ホースのような澄んだ水が勢いよく噴き出し、しぶきになって散る", "Un jet d’eau claire jaillit comme d’un tuyau et se brise en embruns", "Un getto d’acqua limpida sgorga come da un tubo e si rompe in spruzzi"],
  "Floating volume widget": ["悬浮音量小组件", "懸浮音量小工具", "フローティング音量ウィジェット", "Widget de volume flottant", "Widget volume fluttuante"],
  "Allow the floating widget": ["允许悬浮小组件", "允許懸浮小工具", "ウィジェットを許可", "Autoriser le widget flottant", "Consenti il widget fluttuante"],
  "When in the background": ["在后台时", "在背景時", "バックグラウンド時", "En arrière-plan", "In background"],
  "Keep playing": ["继续播放", "繼續播放", "再生を続ける", "Continuer", "Continua a suonare"],
  "Ambience plays at full volume when you switch windows": ["切换窗口时环境音保持原音量", "切換視窗時環境音維持原音量", "ウィンドウを切り替えても同じ音量で再生", "L’ambiance garde son volume quand vous changez de fenêtre", "L’ambiente resta allo stesso volume quando cambi finestra"],
  Dim: ["调低", "調低", "小さくする", "Baisser", "Abbassa"],
  "Turns the ambience down while another window is in front": ["其他窗口在前台时调低环境音", "其他視窗在前景時調低環境音", "別のウィンドウが前面にある間は音量を下げる", "Baisse l’ambiance quand une autre fenêtre est au premier plan", "Abbassa l’ambiente mentre un’altra finestra è in primo piano"],
  Mute: ["静音", "靜音", "ミュート", "Couper le son", "Silenzia"],
  "Silences the ambience until you come back": ["静音，直到你回来", "靜音，直到你回來", "戻るまで消音する", "Coupe l’ambiance jusqu’à votre retour", "Silenzia l’ambiente finché non torni"],
  "Dim to": ["调低至", "調低至", "下げる音量", "Baisser à", "Abbassa al"],
  "Ambience volume": ["环境音量", "環境音量", "環境音の音量", "Volume de l’ambiance", "Volume ambiente"],
  "Drag to move": ["拖动以移动", "拖曳以移動", "ドラッグで移動", "Glisser pour déplacer", "Trascina per spostare"],
  "Show ambience volume": ["显示环境音量", "顯示環境音量", "環境音の音量を表示", "Afficher le volume de l’ambiance", "Mostra il volume ambiente"],
  Collapse: ["收起", "收合", "折りたたむ", "Réduire", "Comprimi"],
  "Turn ambience off": ["关闭环境音", "關閉環境音", "環境音をオフ", "Couper l’ambiance", "Disattiva l’ambiente"],
  "Turn ambience on": ["开启环境音", "開啟環境音", "環境音をオン", "Activer l’ambiance", "Attiva l’ambiente"],
  "Ambience off": ["环境音已关闭", "環境音已關閉", "環境音オフ", "Ambiance coupée", "Ambiente disattivato"],
  "Paused — open a chat": ["已暂停 — 打开一个聊天", "已暫停 — 開啟一個聊天", "一時停止中 — チャットを開いてください", "En pause — ouvrez une discussion", "In pausa — apri una chat"],
  "Click anywhere to start": ["点击任意位置开始", "點擊任意位置開始", "どこかをクリックして開始", "Cliquez n’importe où pour démarrer", "Fai clic ovunque per iniziare"],
  "Quiet — no ambience here": ["安静 — 此处没有环境音", "安靜 — 此處沒有環境音", "静か — ここには環境音なし", "Calme — pas d’ambiance ici", "Silenzio — nessun ambiente qui"],
  "Muted in background": ["后台时已静音", "背景時已靜音", "バックグラウンド中は消音", "Coupé en arrière-plan", "Silenziato in background"],
  "Dimmed in background": ["后台时已调低", "背景時已調低", "バックグラウンド中は小さく", "Baissé en arrière-plan", "Abbassato in background"],
  "Lumi Flair shows a small floating volume control for the ambient soundscape. You can drag it anywhere and turn it off in Flair’s Sound settings.": ["Lumi Flair 会显示一个小巧的悬浮音量控件，用于调节环境音景。你可以把它拖到任意位置，也可以在 Flair 的声音设置中关闭它。", "Lumi Flair 會顯示一個小巧的懸浮音量控制項，用於調整環境音景。你可以把它拖到任何位置，也可以在 Flair 的聲音設定中關閉它。", "Lumi Flair が環境サウンドスケープ用の小さなフローティング音量コントロールを表示します。好きな場所へドラッグでき、Flair のサウンド設定でオフにできます。", "Lumi Flair affiche une petite commande de volume flottante pour l’ambiance sonore. Vous pouvez la déplacer n’importe où et la désactiver dans les réglages Son de Flair.", "Lumi Flair mostra un piccolo controllo del volume fluttuante per il paesaggio sonoro. Puoi trascinarlo ovunque e disattivarlo nelle impostazioni Suono di Flair."],
  "Your sounds": ["你的声音", "你的聲音", "マイサウンド", "Vos sons", "I tuoi suoni"],
  "Upload sounds": ["上传声音", "上傳聲音", "サウンドをアップロード", "Importer des sons", "Carica suoni"],
  "Adding…": ["正在添加…", "正在新增…", "追加中…", "Ajout…", "Aggiunta…"],
  Added: ["已添加", "已新增", "追加しました", "Ajouté", "Aggiunto"],
  "Use a sound": ["使用声音", "使用聲音", "サウンドを使う", "Utiliser un son", "Usa un suono"],
  For: ["用于", "用於", "用途", "Pour", "Per"],
  "Built-in sound": ["内置声音", "內建聲音", "内蔵サウンド", "Son intégré", "Suono integrato"],
  "Generated by Lumi Flair": ["由 Lumi Flair 生成", "由 Lumi Flair 生成", "Lumi Flair が生成", "Généré par Lumi Flair", "Generato da Lumi Flair"],
  "No sounds yet — upload MP3, OGG, WAV, M4A or FLAC files.": ["还没有声音 — 上传 MP3、OGG、WAV、M4A 或 FLAC 文件。", "還沒有聲音 — 上傳 MP3、OGG、WAV、M4A 或 FLAC 檔案。", "まだサウンドがありません — MP3・OGG・WAV・M4A・FLAC をアップロードしてください。", "Aucun son pour l’instant — importez des fichiers MP3, OGG, WAV, M4A ou FLAC.", "Nessun suono — carica file MP3, OGG, WAV, M4A o FLAC."],
  Play: ["播放", "播放", "再生", "Écouter", "Riproduci"],
  Stop: ["停止", "停止", "停止", "Arrêter", "Ferma"],
  "Used for": ["用于", "用於", "使用先", "Utilisé pour", "Usato per"],
  "Not used yet": ["尚未使用", "尚未使用", "未使用", "Pas encore utilisé", "Non ancora usato"],
  Delete: ["删除", "刪除", "削除", "Supprimer", "Elimina"],
  "Delete this sound?": ["删除这个声音？", "刪除這個聲音？", "このサウンドを削除しますか？", "Supprimer ce son ?", "Eliminare questo suono?"],
  Level: ["音量", "音量", "レベル", "Niveau", "Livello"],
  "not in this browser": ["不在此浏览器中", "不在此瀏覽器中", "このブラウザーにありません", "absent de ce navigateur", "non in questo browser"],
  "Use the built-in sound": ["改用内置声音", "改用內建聲音", "内蔵サウンドに戻す", "Revenir au son intégré", "Usa il suono integrato"],
  "Always play (replaces scene sounds)": ["始终播放（替代场景声音）", "始終播放（取代場景聲音）", "常に再生（シーンの音を置き換え）", "Toujours jouer (remplace les sons de scène)", "Riproduci sempre (sostituisce i suoni di scena)"],
  Ambience: ["环境音", "環境音", "環境音", "Ambiance", "Ambiente"],
  Lighting: ["灯光", "燈光", "照明", "Lumière", "Luci"],
  Interface: ["界面", "介面", "インターフェース", "Interface", "Interfaccia"],
  "Message sent": ["消息已发送", "訊息已傳送", "メッセージ送信", "Message envoyé", "Messaggio inviato"],
  "Reply received": ["收到回复", "收到回覆", "返信を受信", "Réponse reçue", "Risposta ricevuta"],
  "Milestone celebration": ["里程碑庆祝", "里程碑慶祝", "マイルストーンのお祝い", "Célébration d’étape", "Celebrazione traguardo"],
  "Screen effect / keyword": ["屏幕特效 / 关键词", "螢幕特效 / 關鍵字", "画面エフェクト／キーワード", "Effet d’écran / mot-clé", "Effetto schermo / parola chiave"],
  "AI sound effects": ["AI 音效", "AI 音效", "AI 効果音", "Effets sonores de l’IA", "Effetti sonori dell’IA"],
  "Effects volume": ["音效音量", "音效音量", "効果音の音量", "Volume des effets", "Volume effetti"],
  "Sound effects": ["音效", "音效", "効果音", "Effets sonores", "Effetti sonori"],
  "Door knock": ["敲门声", "敲門聲", "ドアをノック", "Coups à la porte", "Bussare alla porta"],
  "Sword clash": ["剑刃相击", "劍刃相擊", "剣のぶつかり合い", "Choc d’épées", "Scontro di spade"],
  Heartbeat: ["心跳", "心跳", "心臓の鼓動", "Battement de cœur", "Battito cardiaco"],
  "Door creak": ["门吱呀声", "門吱呀聲", "ドアのきしみ", "Grincement de porte", "Cigolio della porta"],
  "Door slam": ["摔门声", "摔門聲", "ドアをバタンと閉める", "Porte qui claque", "Porta sbattuta"],
  Footsteps: ["脚步声", "腳步聲", "足音", "Bruits de pas", "Passi"],
  "Glass break": ["玻璃碎裂", "玻璃碎裂", "ガラスの割れる音", "Verre brisé", "Vetro che si rompe"],
  Thunder: ["雷声", "雷聲", "雷鳴", "Tonnerre", "Tuono"],
  Bell: ["钟声", "鐘聲", "鐘の音", "Cloche", "Campana"],
  Whoosh: ["呼啸声", "呼嘯聲", "ヒュッという音", "Sifflement", "Sibilo"],
  Impact: ["撞击声", "撞擊聲", "衝撃音", "Impact", "Impatto"],
  Magic: ["魔法", "魔法", "魔法", "Magie", "Magia"],
  "Fire crackle": ["火焰噼啪声", "火焰劈啪聲", "焚き火のパチパチ", "Crépitement du feu", "Crepitio del fuoco"],
  "Favourite moments": ["收藏的瞬间", "收藏的瞬間", "お気に入りの瞬間", "Moments favoris", "Momenti preferiti"],
  "Pin the latest message": ["收藏最新消息", "收藏最新訊息", "最新のメッセージをピン留め", "Épingler le dernier message", "Fissa l’ultimo messaggio"],
  "Jump to it": ["跳转到此处", "跳轉到此處", "そこへ移動", "Y aller", "Vai lì"],
  Message: ["消息", "訊息", "メッセージ", "Message", "Messaggio"],
  You: ["你", "你", "あなた", "Vous", "Tu"],
  "Pin this moment": ["收藏这一刻", "收藏這一刻", "この瞬間をピン留め", "Épingler ce moment", "Fissa questo momento"],
  "Unpin this moment": ["取消收藏这一刻", "取消收藏這一刻", "この瞬間のピンを外す", "Désépingler ce moment", "Rimuovi questo momento"],
  "Pin as a favourite moment": ["收藏为喜爱的瞬间", "收藏為喜愛的瞬間", "お気に入りの瞬間としてピン留め", "Épingler comme moment favori", "Fissa come momento preferito"],
  "Remove from favourite moments": ["从收藏的瞬间中移除", "從收藏的瞬間中移除", "お気に入りの瞬間から外す", "Retirer des moments favoris", "Rimuovi dai momenti preferiti"],
  "No pinned moments in this chat yet.": ["这个聊天里还没有收藏的瞬间。", "這個聊天裡還沒有收藏的瞬間。", "このチャットにはまだピン留めした瞬間がありません。", "Aucun moment épinglé dans cette discussion pour l’instant.", "Nessun momento fissato in questa chat per ora."],
  "Open a chat to pin its moments.": ["打开一个聊天来收藏其中的瞬间。", "開啟一個聊天來收藏其中的瞬間。", "チャットを開いて瞬間をピン留めしましょう。", "Ouvrez une discussion pour épingler ses moments.", "Apri una chat per fissarne i momenti."],
  "That message no longer exists, so its pin was removed.": ["该消息已不存在，已移除对应的收藏。", "該訊息已不存在，已移除對應的收藏。", "そのメッセージは存在しないため、ピンを削除しました。", "Ce message n’existe plus, son épingle a été retirée.", "Quel messaggio non esiste più, quindi il segnaposto è stato rimosso."],
  "Save pins to Lumiverse memory": ["将收藏保存到 Lumiverse 记忆", "將收藏儲存到 Lumiverse 記憶", "ピンを Lumiverse のメモリに保存", "Enregistrer les épingles dans la mémoire de Lumiverse", "Salva i segnaposto nella memoria di Lumiverse"],
  "Allow memory access": ["允许访问记忆", "允許存取記憶", "メモリへのアクセスを許可", "Autoriser l’accès à la mémoire", "Consenti l’accesso alla memoria"],
  "Save this chat’s pins to memory": ["将此聊天的收藏保存到记忆", "將此聊天的收藏儲存到記憶", "このチャットのピンをメモリに保存", "Enregistrer les épingles de cette discussion en mémoire", "Salva in memoria i segnaposto di questa chat"],
  "Saved to Lumiverse memory.": ["已保存到 Lumiverse 记忆。", "已儲存到 Lumiverse 記憶。", "Lumiverse のメモリに保存しました。", "Enregistré dans la mémoire de Lumiverse.", "Salvato nella memoria di Lumiverse."],
  "Couldn’t save to Lumiverse memory.": ["无法保存到 Lumiverse 记忆。", "無法儲存到 Lumiverse 記憶。", "Lumiverse のメモリに保存できませんでした。", "Impossible d’enregistrer dans la mémoire de Lumiverse.", "Impossibile salvare nella memoria di Lumiverse."],
  "Nothing to save: those pins have no speaker name.": ["没有可保存的内容：这些收藏没有发言者名称。", "沒有可儲存的內容：這些收藏沒有發言者名稱。", "保存するものがありません：これらのピンには発言者名がありません。", "Rien à enregistrer : ces épingles n’ont pas de nom d’interlocuteur.", "Niente da salvare: questi segnaposto non hanno il nome di chi parla."],
  "Character intro": ["角色登场", "角色登場", "キャラクター紹介", "Entrée du personnage", "Ingresso del personaggio"],
  "Name card when a chat opens": ["打开聊天时显示名牌", "開啟聊天時顯示名牌", "チャットを開くとき名前カードを表示", "Carte de nom à l’ouverture d’une discussion", "Cartellino col nome all’apertura di una chat"],
  "Theme sound": ["主题音效", "主題音效", "テーマサウンド", "Son thème", "Suono tema"],
  "Group chats: show who is speaking": ["群聊：显示谁在发言", "群聊：顯示誰在發言", "グループチャット：発言者を表示", "Discussions de groupe : montrer qui parle", "Chat di gruppo: mostra chi parla"],
  "Preview intro": ["预览登场", "預覽登場", "紹介をプレビュー", "Aperçu de l’entrée", "Anteprima ingresso"],
  "Preview speaker chip": ["预览发言标签", "預覽發言標籤", "発言者チップをプレビュー", "Aperçu de l’étiquette", "Anteprima etichetta"],
  "A conversation with": ["对话对象", "對話對象", "会話の相手", "Une conversation avec", "Una conversazione con"],
  "Your character": ["你的角色", "你的角色", "あなたのキャラクター", "Votre personnage", "Il tuo personaggio"],
  "Theater mode": ["剧场模式", "劇場模式", "シアターモード", "Mode théâtre", "Modalità teatro"],
  "Hide the interface and read": ["隐藏界面，专心阅读", "隱藏介面，專心閱讀", "インターフェースを隠して読む", "Masquer l’interface et lire", "Nascondi l’interfaccia e leggi"],
  "Read in theater mode": ["用剧场模式阅读", "用劇場模式閱讀", "シアターモードで読む", "Lire en mode théâtre", "Leggi in modalità teatro"],
  "Read from here in theater mode": ["从这里开始用剧场模式阅读", "從這裡開始用劇場模式閱讀", "ここからシアターモードで読む", "Lire à partir d’ici en mode théâtre", "Leggi da qui in modalità teatro"],
  "Enter theater mode": ["进入剧场模式", "進入劇場模式", "シアターモードに入る", "Entrer en mode théâtre", "Entra in modalità teatro"],
  "Text size": ["文字大小", "文字大小", "文字サイズ", "Taille du texte", "Dimensione del testo"],
  "Scroll speed": ["滚动速度", "捲動速度", "スクロール速度", "Vitesse de défilement", "Velocità di scorrimento"],
  "Start the gentle auto-scroll": ["启动轻柔自动滚动", "啟動輕柔自動捲動", "やさしい自動スクロールを開始", "Lancer le défilement automatique doux", "Avvia lo scorrimento automatico delicato"],
  "Leave theater mode": ["退出剧场模式", "退出劇場模式", "シアターモードを終了", "Quitter le mode théâtre", "Esci dalla modalità teatro"],
  "Pause the scroll": ["暂停滚动", "暫停捲動", "スクロールを一時停止", "Mettre le défilement en pause", "Metti in pausa lo scorrimento"],
  "Start the scroll": ["开始滚动", "開始捲動", "スクロールを開始", "Lancer le défilement", "Avvia lo scorrimento"],
  "Scroll slower": ["滚动慢一点", "捲動慢一點", "もっとゆっくり", "Défiler plus lentement", "Scorri più lentamente"],
  "Scroll faster": ["滚动快一点", "捲動快一點", "もっと速く", "Défiler plus vite", "Scorri più velocemente"],
  "Smaller text": ["文字调小", "文字調小", "文字を小さく", "Texte plus petit", "Testo più piccolo"],
  "Larger text": ["文字调大", "文字調大", "文字を大きく", "Texte plus grand", "Testo più grande"],
  "Show the reply box": ["显示回复框", "顯示回覆框", "返信欄を表示", "Afficher la zone de réponse", "Mostra la casella di risposta"],
  "Hide the reply box": ["隐藏回复框", "隱藏回覆框", "返信欄を隠す", "Masquer la zone de réponse", "Nascondi la casella di risposta"],
  "Tap the screen to show these controls": ["点按屏幕以显示这些控件", "點按螢幕以顯示這些控制項", "画面をタップするとコントロールが表示されます", "Touchez l’écran pour afficher ces commandes", "Tocca lo schermo per mostrare questi comandi"],
  "Download PNG": ["下载 PNG", "下載 PNG", "PNG をダウンロード", "Télécharger le PNG", "Scarica PNG"],
  "Copy image": ["复制图片", "複製圖片", "画像をコピー", "Copier l’image", "Copia immagine"],
  "Text on the card": ["卡片上的文字", "卡片上的文字", "カードの文字", "Texte de la carte", "Testo della scheda"],
  "Use selection": ["使用选中部分", "使用選取部分", "選択部分を使う", "Utiliser la sélection", "Usa la selezione"],
  "Whole message": ["整条消息", "整則訊息", "メッセージ全体", "Message entier", "Messaggio intero"],
  "Select part of the text and press “Use selection”, or edit it. The card follows as you go.": ["选中部分文字后点“使用选中部分”，或直接编辑。卡片会随之更新。", "選取部分文字後點「使用選取部分」，或直接編輯。卡片會隨之更新。", "文字の一部を選んで「選択部分を使う」を押すか、直接編集してください。カードはその都度更新されます。", "Sélectionnez une partie du texte puis « Utiliser la sélection », ou modifiez-le. La carte suit au fur et à mesure.", "Seleziona una parte del testo e premi «Usa la selezione», oppure modificalo. La scheda si aggiorna man mano."],
  "Select some of the text first, then press “Use selection”.": ["请先选中一些文字，再点“使用选中部分”。", "請先選取一些文字，再點「使用選取部分」。", "先に文字を選んでから「選択部分を使う」を押してください。", "Sélectionnez d’abord du texte, puis « Utiliser la sélection ».", "Seleziona prima del testo, poi premi «Usa la selezione»."],
  "That is more than fits, so the card ends with “…”. Pick a shorter part for the whole of it.": ["文字太多放不下，卡片会以“…”结尾。选一段更短的即可完整显示。", "文字太多放不下，卡片會以「…」結尾。選一段更短的即可完整顯示。", "収まりきらないため、カードは「…」で終わります。全文を載せるには短い部分を選んでください。", "C’est plus que ce qui tient : la carte se termine par « … ». Choisissez un passage plus court pour l’avoir en entier.", "È più di quanto ci stia, quindi la scheda finisce con «…». Scegli una parte più breve per averla intera."],
  "Typewriter pacing": ["打字机节奏", "打字機節奏", "タイプライター表示", "Rythme machine à écrire", "Ritmo macchina da scrivere"],
  "Typewriter reveal": ["打字机式显示", "打字機式顯示", "タイプライター風に表示", "Affichage machine à écrire", "Comparsa a macchina da scrivere"],
  "Typing speed": ["打字速度", "打字速度", "タイピング速度", "Vitesse de frappe", "Velocità di battitura"],
  "Key sounds": ["按键音", "按鍵音", "キー音", "Bruit des touches", "Suono dei tasti"],
  "Preview typewriter": ["预览打字机效果", "預覽打字機效果", "タイプライターをプレビュー", "Aperçu machine à écrire", "Anteprima macchina da scrivere"],
  "Typewriter key": ["打字机按键", "打字機按鍵", "タイプライターのキー", "Touche de machine à écrire", "Tasto della macchina da scrivere"]
};
var LOCALES = ["zh", "zh-TW", "ja", "fr", "it"];
var DICT = Object.fromEntries(LOCALES.map((loc, i) => [loc, Object.fromEntries(Object.entries(T).map(([en, row]) => [en, row[i]]))]));

// src/i18n.ts
var current = "en";
function setLocale(l) {
  current = ["zh", "zh-TW", "ja", "fr", "it"].includes(l) ? l : "en";
}
function tr(en) {
  if (current === "en")
    return en;
  return DICT[current]?.[en] ?? en;
}

// src/soundwidget.ts
var W = 288;
var H = 52;
var DOT = 44;
var ICON_ON = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H2v6h4l5 4z"/><path class="lf-sw-w1" d="M15.5 8.5a5 5 0 0 1 0 7"/><path class="lf-sw-w2" d="M19 5a10 10 0 0 1 0 14"/></svg>';
var ICON_OFF = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H2v6h4l5 4z"/><path d="m22 9-6 6M16 9l6 6"/></svg>';
var GRIP = '<svg viewBox="0 0 8 20" width="8" height="20" fill="currentColor" aria-hidden="true"><circle cx="2" cy="4" r="1.3"/><circle cx="6" cy="4" r="1.3"/><circle cx="2" cy="10" r="1.3"/><circle cx="6" cy="10" r="1.3"/><circle cx="2" cy="16" r="1.3"/><circle cx="6" cy="16" r="1.3"/></svg>';
var FOLD = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>';
var SOUND_WIDGET_CSS = `
.lf-sw,.lf-sw *{box-sizing:border-box;margin:0;padding:0;text-align:left;line-height:normal;letter-spacing:normal;text-transform:none;text-indent:0;float:none}
.lf-sw{position:relative;width:${W}px;height:${H}px;display:flex;flex-direction:row;align-items:center;gap:8px;padding:0 14px 0 8px;
  border-radius:${H / 2}px;color:var(--lumiverse-text,#fff);
  background:linear-gradient(var(--lumiverse-bg-elevated,#1a1626),var(--lumiverse-bg-elevated,#1a1626)),var(--lumiverse-bg,#0f0c18);
  backdrop-filter:blur(14px) saturate(1.2);-webkit-backdrop-filter:blur(14px) saturate(1.2);
  border:1px solid var(--lumiverse-border,rgba(255,255,255,.12));box-shadow:0 6px 24px rgba(0,0,0,.28);
  font-family:var(--lumiverse-font-family,inherit);font-size:12px;user-select:none;-webkit-user-select:none;touch-action:none;cursor:grab;overflow:hidden}
.lf-sw:active{cursor:grabbing}
.lf-sw .lf-sw-grip{display:flex;align-items:center;justify-content:center;flex:none;width:10px;height:20px;color:var(--lumiverse-text-muted,#bbb);opacity:.7}
.lf-sw .lf-sw-grip svg{display:block;width:8px;height:20px;min-width:0}
.lf-sw .lf-sw-btn{flex:none;width:34px;height:34px;min-width:0;min-height:0;max-width:none;padding:0;border:0;border-radius:50%;
  display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:none;outline:none;font:inherit;
  background:var(--lumiverse-fill,rgba(255,255,255,.08));color:var(--lumiverse-text,#fff);transition:background .15s,color .15s,transform .1s}
.lf-sw .lf-sw-btn svg{display:block;flex:none;width:18px;height:18px;min-width:0}
.lf-sw .lf-sw-btn:hover{background:var(--lumiverse-fill-subtle,rgba(255,255,255,.12))}
.lf-sw .lf-sw-btn:active{transform:scale(.94)}
.lf-sw .lf-sw-btn:focus-visible,.lf-sw .lf-sw-slider:focus-visible{outline:2px solid var(--lumiverse-primary,#9370db);outline-offset:2px}
.lf-sw[data-on="1"] .lf-sw-btn{background:var(--lumiverse-primary,#9370db);color:var(--lumiverse-primary-contrast,#fff)}
.lf-sw[data-on="1"][data-state="playing"] .lf-sw-w1,.lf-sw[data-on="1"][data-state="playing"] .lf-sw-w2{animation:lf-sw-wave 1.6s ease-in-out infinite}
.lf-sw[data-on="1"][data-state="playing"] .lf-sw-w2{animation-delay:.2s}
@keyframes lf-sw-wave{0%,100%{opacity:1}50%{opacity:.35}}
@media (prefers-reduced-motion:reduce){.lf-sw .lf-sw-w1,.lf-sw .lf-sw-w2{animation:none!important}}
.lf-sw .lf-sw-mid{flex:1 1 auto;min-width:0;height:34px;display:flex;flex-direction:column;justify-content:center;align-items:stretch;gap:4px}
.lf-sw .lf-sw-label{display:block;height:14px;font-size:11px;line-height:14px;font-weight:500;color:var(--lumiverse-text-dim,#ccc);
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.lf-sw[data-on="0"] .lf-sw-label{color:var(--lumiverse-text-muted,#999)}
.lf-sw .lf-sw-slider{position:relative;display:block;height:14px;width:100%;cursor:pointer;touch-action:none;outline:none;border-radius:7px}
.lf-sw .lf-sw-track{position:absolute;left:0;right:0;top:5px;height:4px;border-radius:2px;background:var(--lumiverse-fill,rgba(255,255,255,.15));overflow:hidden}
.lf-sw .lf-sw-fill{position:absolute;left:0;top:0;bottom:0;width:calc(var(--v,50%) - 14px * var(--vf,0.5) + 7px);border-radius:2px;background:var(--lumiverse-primary,#9370db)}
.lf-sw .lf-sw-thumb{position:absolute;top:0;left:calc(var(--v,50%) - 14px * var(--vf,0.5));width:14px;height:14px;border-radius:50%;
  background:var(--lumiverse-text,#fff);border:2px solid var(--lumiverse-primary,#9370db);box-shadow:0 1px 3px rgba(0,0,0,.3);transition:transform .1s}
.lf-sw .lf-sw-slider:active .lf-sw-thumb{transform:scale(1.15)}
.lf-sw[data-on="0"] .lf-sw-slider{opacity:.55}
.lf-sw .lf-sw-pct{display:block;flex:none;width:36px;text-align:right;font-size:12px;line-height:16px;font-variant-numeric:tabular-nums;color:var(--lumiverse-text-dim,#ccc);white-space:nowrap}
.lf-sw .lf-sw-fold{flex:none;width:28px;height:28px;min-width:0;min-height:0;max-width:none;padding:0;border:0;border-radius:50%;display:flex;align-items:center;justify-content:center;
  cursor:pointer;box-shadow:none;outline:none;font:inherit;background:var(--lumiverse-fill,rgba(255,255,255,.08));color:var(--lumiverse-text-dim,#ccc);transition:background .15s}
.lf-sw .lf-sw-fold svg{display:block;flex:none;width:16px;height:16px;min-width:0}
.lf-sw[data-anchor="l"] .lf-sw-fold svg{transform:scaleX(-1)}
.lf-sw .lf-sw-fold:hover{background:var(--lumiverse-fill-subtle,rgba(255,255,255,.14))}
.lf-sw .lf-sw-fold:focus-visible,.lf-sw .lf-sw-dot:focus-visible{outline:2px solid var(--lumiverse-primary,#9370db);outline-offset:2px}
.lf-sw .lf-sw-dot{display:none}
.lf-sw[data-collapsed="1"]{width:${DOT}px;height:${DOT}px;padding:0;gap:0;border-radius:50%;justify-content:center;cursor:pointer}
.lf-sw[data-collapsed="1"] > :not(.lf-sw-dot){display:none}
.lf-sw[data-collapsed="1"] .lf-sw-dot{display:flex;flex:none;width:100%;height:100%;min-width:0;min-height:0;max-width:none;padding:0;border:0;border-radius:50%;
  align-items:center;justify-content:center;cursor:pointer;box-shadow:none;outline:none;font:inherit;background:transparent;color:var(--lumiverse-text-muted,#bbb)}
.lf-sw[data-collapsed="1"] .lf-sw-dot svg{display:block;flex:none;width:20px;height:20px;min-width:0}
.lf-sw[data-collapsed="1"][data-on="1"]{background:var(--lumiverse-primary,#9370db);border-color:transparent}
.lf-sw[data-collapsed="1"][data-on="1"] .lf-sw-dot{color:var(--lumiverse-primary-contrast,#fff)}
.lf-sw[data-collapsed="1"][data-on="1"][data-state="playing"] .lf-sw-w1,.lf-sw[data-collapsed="1"][data-on="1"][data-state="playing"] .lf-sw-w2{animation:lf-sw-wave 1.6s ease-in-out infinite}
.lf-sw[data-collapsed="1"][data-on="1"][data-state="playing"] .lf-sw-w2{animation-delay:.2s}
`;

class SoundWidget {
  ctx;
  deps;
  w = null;
  el = null;
  btn = null;
  dot = null;
  fold = null;
  collapsed = false;
  label = null;
  range = null;
  value = 0;
  pct = null;
  dragging = false;
  unDrag = null;
  onResize = () => this.keepOnScreen();
  constructor(ctx, deps) {
    this.ctx = ctx;
    this.deps = deps;
  }
  get shown() {
    return !!this.w;
  }
  sync(show) {
    if (!show) {
      this.destroy();
      return true;
    }
    if (!this.w) {
      try {
        this.create();
      } catch (err) {
        console.warn("[Lumi Flair] Floating sound widget unavailable", err);
        this.destroy();
        return false;
      }
    }
    this.render();
    return true;
  }
  dims() {
    return this.collapsed ? { w: DOT, h: DOT } : { w: W, h: H };
  }
  wantCollapsed() {
    const c = this.deps.settings().soundWidgetCollapsed;
    if (typeof c === "boolean")
      return c;
    return typeof matchMedia === "function" && matchMedia("(pointer: coarse)").matches;
  }
  defaultPos() {
    const d = this.dims();
    return { x: Math.max(12, window.innerWidth - d.w - (this.collapsed ? 12 : 24)), y: 72 };
  }
  anchor(p, d = this.dims()) {
    return p.x + d.w / 2 > window.innerWidth / 2 ? "r" : "l";
  }
  create() {
    this.collapsed = this.wantCollapsed();
    const saved = this.deps.settings().soundWidgetPos;
    const pos = this.clamp(saved ?? this.defaultPos());
    const d = this.dims();
    const w = this.ctx.ui.createFloatWidget({
      width: d.w,
      height: d.h,
      initialPosition: pos,
      snapToEdge: false,
      tooltip: tr("Ambience volume"),
      chromeless: true
    });
    this.w = w;
    const el = document.createElement("div");
    el.className = "lf-sw";
    el.setAttribute("role", "group");
    el.setAttribute("aria-label", tr("Ambience volume"));
    const grip = document.createElement("span");
    grip.className = "lf-sw-grip";
    grip.innerHTML = GRIP;
    grip.title = tr("Drag to move");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "lf-sw-btn";
    btn.addEventListener("click", () => {
      const s = this.deps.settings();
      this.deps.update(s.soundscape ? { soundscape: false } : { soundscape: true, ...s.soundscapeVolume < 0.02 ? { soundscapeVolume: 0.35 } : {} });
    });
    const mid = document.createElement("div");
    mid.className = "lf-sw-mid";
    const label = document.createElement("span");
    label.className = "lf-sw-label";
    const range = document.createElement("div");
    range.className = "lf-sw-slider";
    range.tabIndex = 0;
    range.setAttribute("role", "slider");
    range.setAttribute("aria-label", tr("Ambience volume"));
    range.setAttribute("aria-valuemin", "0");
    range.setAttribute("aria-valuemax", "100");
    range.innerHTML = '<span class="lf-sw-track"><span class="lf-sw-fill"></span></span><span class="lf-sw-thumb"></span>';
    const fromPointer = (clientX) => {
      const r = range.getBoundingClientRect();
      return Math.max(0, Math.min(100, Math.round((clientX - r.left) / Math.max(1, r.width) * 100)));
    };
    range.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      range.focus({ preventScroll: true });
      try {
        range.setPointerCapture(e.pointerId);
      } catch {}
      this.setValue(fromPointer(e.clientX), false);
    });
    range.addEventListener("pointermove", (e) => {
      if (range.hasPointerCapture?.(e.pointerId))
        this.setValue(fromPointer(e.clientX), false);
    });
    const release = (e) => {
      if (!this.dragging)
        return;
      try {
        range.releasePointerCapture(e.pointerId);
      } catch {}
      this.setValue(this.value, true);
    };
    range.addEventListener("pointerup", release);
    range.addEventListener("pointercancel", release);
    range.addEventListener("keydown", (e) => {
      const step = { ArrowRight: 5, ArrowUp: 5, ArrowLeft: -5, ArrowDown: -5, PageUp: 10, PageDown: -10 }[e.key];
      const to = e.key === "Home" ? 0 : e.key === "End" ? 100 : step !== undefined ? this.value + step : null;
      if (to === null)
        return;
      e.preventDefault();
      this.setValue(Math.max(0, Math.min(100, to)), true);
    });
    range.addEventListener("wheel", (e) => {
      e.preventDefault();
      this.setValue(Math.max(0, Math.min(100, this.value + (e.deltaY < 0 ? 5 : -5))), true);
    }, { passive: false });
    mid.append(label, range);
    const pct = document.createElement("span");
    pct.className = "lf-sw-pct";
    const fold = document.createElement("button");
    fold.type = "button";
    fold.className = "lf-sw-fold";
    fold.innerHTML = FOLD;
    fold.title = tr("Collapse");
    fold.setAttribute("aria-label", tr("Collapse"));
    fold.setAttribute("aria-expanded", "true");
    fold.addEventListener("click", (e) => this.setCollapsed(true, e.detail === 0));
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "lf-sw-dot";
    dot.title = tr("Show ambience volume");
    dot.setAttribute("aria-label", tr("Show ambience volume"));
    dot.setAttribute("aria-expanded", "false");
    dot.addEventListener("click", (e) => this.setCollapsed(false, e.detail === 0));
    for (const ctl of [btn, range, fold]) {
      for (const ev of ["pointerdown", "mousedown", "touchstart"])
        ctl.addEventListener(ev, (e) => e.stopPropagation());
    }
    el.dataset.collapsed = this.collapsed ? "1" : "0";
    el.dataset.anchor = this.anchor(pos);
    el.append(grip, btn, mid, pct, fold, dot);
    w.root.appendChild(el);
    this.el = el;
    this.dot = dot;
    this.fold = fold;
    this.btn = btn;
    this.label = label;
    this.range = range;
    this.pct = pct;
    this.unDrag = w.onDragEnd((p) => {
      const c = this.clamp(p);
      if (c.x !== p.x || c.y !== p.y)
        w.moveTo(c.x, c.y);
      el.dataset.anchor = this.anchor(c);
      this.deps.update({ soundWidgetPos: c });
    });
    window.addEventListener("resize", this.onResize);
  }
  clamp(p, d = this.dims()) {
    const maxX = Math.max(0, window.innerWidth - d.w - 4);
    const maxY = Math.max(0, window.innerHeight - d.h - 4);
    return { x: Math.round(Math.max(4, Math.min(maxX, p.x))), y: Math.round(Math.max(4, Math.min(maxY, p.y))) };
  }
  keepOnScreen() {
    if (!this.w)
      return;
    const p = this.w.getPosition();
    const c = this.clamp(p);
    if (c.x !== p.x || c.y !== p.y)
      this.w.moveTo(c.x, c.y);
    if (this.el)
      this.el.dataset.anchor = this.anchor(c);
  }
  setCollapsed(next, keyboard = false) {
    const { w, el } = this;
    if (!w || !el || next === this.collapsed)
      return;
    const from = this.dims();
    const p = w.getPosition();
    const side = this.anchor(p, from);
    this.collapsed = next;
    const to = this.dims();
    const c = this.clamp({ x: side === "r" ? p.x + from.w - to.w : p.x, y: p.y + from.h / 2 - to.h / 2 }, to);
    el.dataset.collapsed = next ? "1" : "0";
    el.dataset.anchor = side;
    w.setSize(to.w, to.h);
    w.moveTo(c.x, c.y);
    this.deps.update({ soundWidgetCollapsed: next, soundWidgetPos: c });
    this.render();
    if (keyboard)
      (next ? this.dot : this.fold)?.focus({ preventScroll: true });
  }
  setValue(v, commit) {
    this.value = v;
    this.paintRange(v / 100);
    const vol = v / 100;
    const s = this.deps.settings();
    if (commit) {
      this.dragging = false;
      this.deps.update(!s.soundscape && vol > 0 ? { soundscape: true, soundscapeVolume: vol } : { soundscapeVolume: vol });
      return;
    }
    this.dragging = true;
    if (!s.soundscape && vol > 0)
      this.deps.update({ soundscape: true, soundscapeVolume: vol });
    else
      this.deps.preview(vol);
  }
  paintRange(v) {
    if (!this.range || !this.pct)
      return;
    const pc = Math.round(v * 100);
    this.range.style.setProperty("--v", `${pc}%`);
    this.range.style.setProperty("--vf", String(v));
    this.range.setAttribute("aria-valuenow", String(pc));
    this.range.setAttribute("aria-valuetext", `${pc}%`);
    this.pct.textContent = `${pc}%`;
  }
  render() {
    const { el, btn, label, range } = this;
    if (!el || !btn || !label || !range)
      return;
    const s = this.deps.settings();
    const v = this.deps.view();
    const on = s.soundscape;
    el.dataset.on = on ? "1" : "0";
    el.dataset.state = v.state;
    btn.innerHTML = on && s.soundscapeVolume > 0 ? ICON_ON : ICON_OFF;
    if (this.dot)
      this.dot.innerHTML = btn.innerHTML;
    btn.setAttribute("aria-pressed", String(on));
    btn.title = on ? tr("Turn ambience off") : tr("Turn ambience on");
    btn.setAttribute("aria-label", btn.title);
    if (!this.dragging) {
      this.value = Math.round(s.soundscapeVolume * 100);
      this.paintRange(s.soundscapeVolume);
    }
    label.textContent = this.describe(on, v);
    label.title = label.textContent;
  }
  describe(on, v) {
    if (!on)
      return tr("Ambience off");
    if (v.offChat)
      return tr("Paused — open a chat");
    if (v.state === "waiting")
      return tr("Click anywhere to start");
    const [scene, light] = v.key.split("|");
    const what = v.custom ? `♫ ${v.custom}` : [scene && scene !== "off" ? this.deps.sceneLabel(scene) : "", light && light !== "none" ? this.deps.lightLabel(light) : ""].filter(Boolean).join(" · ");
    if (!what)
      return tr("Quiet — no ambience here");
    if (v.backgrounded === "mute")
      return tr("Muted in background");
    if (v.backgrounded === "dim")
      return tr("Dimmed in background");
    return what;
  }
  destroy() {
    window.removeEventListener("resize", this.onResize);
    this.unDrag?.();
    this.unDrag = null;
    try {
      this.w?.destroy();
    } catch {}
    this.w = null;
    this.el = this.btn = this.dot = this.fold = this.label = this.range = this.pct = null;
    this.dragging = false;
  }
}

// src/cinematic.ts
var RAYS = {
  box: { x: -0.06, y: -0.06, w: 0.9, h: 0.52 },
  from: { x: 0.052, y: -0.34 },
  fade: { x: 0.08, y: -0.2, rx: 0.686, ry: 0.588 },
  alpha: 0.1,
  turn: 200
};
var RAY_DAY = [255, 236, 200];
var RAY_DUSK = [255, 245, 167];
var RAY_LIGHTS = new Set(["dawn", "day", "dusk"]);
function raysImage(w, h, rgb) {
  const k = Math.min(0.5, 320 / (w * RAYS.box.w));
  const bw = Math.max(8, Math.round(w * RAYS.box.w * k));
  const bh = Math.max(8, Math.round(h * RAYS.box.h * k));
  const c = document.createElement("canvas");
  c.width = bw;
  c.height = bh;
  const g = c.getContext("2d");
  if (!g)
    return "";
  const img = g.createImageData(bw, bh);
  const d = img.data;
  const sx = RAYS.from.x * w;
  const sy = RAYS.from.y * h;
  const mx = RAYS.fade.x * w;
  const my = RAYS.fade.y * h;
  const rx = RAYS.fade.rx * w;
  const ry = RAYS.fade.ry * h;
  for (let j = 0;j < bh; j++) {
    const y = (RAYS.box.y + (j + 0.5) / bh * RAYS.box.h) * h;
    const ny = (y - my) / ry;
    for (let i = 0;i < bw; i++) {
      const x = (RAYS.box.x + (i + 0.5) / bw * RAYS.box.w) * w;
      const nx = (x - mx) / rx;
      const fade = 1 - Math.sqrt(nx * nx + ny * ny);
      if (fade <= 0)
        continue;
      let a = Math.atan2(x - sx, sy - y) * 180 / Math.PI - RAYS.turn;
      a = (a % 360 + 360) % 360 % 16;
      const beam = a < 6 ? 0 : a < 7 ? a - 6 : a < 9 ? 1 : a < 10 ? 10 - a : 0;
      if (beam <= 0)
        continue;
      const p = (j * bw + i) * 4;
      d[p] = rgb[0];
      d[p + 1] = rgb[1];
      d[p + 2] = rgb[2];
      d[p + 3] = Math.round(255 * RAYS.alpha * beam * fade);
    }
  }
  g.putImageData(img, 0, 0);
  return c.toDataURL("image/png");
}
var pct = (v) => `${+(v * 100).toFixed(3)}%`;
var RAYS_ORIGIN = `${pct((0.5 - RAYS.box.x) / RAYS.box.w)} ${pct((0.5 - RAYS.box.y) / RAYS.box.h)}`;
var CINEMATIC_CSS = `
.lf-cine { position: absolute; inset: 0; z-index: 2; pointer-events: none; overflow: hidden; }
.lf-cine > div { position: absolute; inset: 0; pointer-events: none; }
.lf-cine .lf-tint { opacity: 0; transition: opacity 2.4s ease, background 2.4s ease; }
.lf-cine .lf-rays { opacity: 0; transition: opacity 3s ease; inset: ${pct(RAYS.box.y)} auto auto ${pct(RAYS.box.x)}; width: ${pct(RAYS.box.w)}; height: ${pct(RAYS.box.h)};
  background: center / 100% 100% no-repeat; transform-origin: ${RAYS_ORIGIN}; }
.lf-cine .lf-vignette { background: radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,calc(var(--lf-vignette, .35) * 1.6)) 100%); transition: background 2s ease; }
.lf-cine .lf-grain { opacity: 0; transition: opacity 1s ease; background-size: 160px 160px; mix-blend-mode: overlay; inset: -80px; }
.lf-cine .lf-flash { opacity: 0; background: radial-gradient(ellipse at 60% 10%, rgba(220,230,255,.9), rgba(180,200,255,.35) 45%, transparent 75%); }
.lf-cine[data-grain="1"] .lf-grain { opacity: .07; animation: lf-grain .6s steps(4) infinite; }

.lf-cine[data-light="dawn"]   .lf-tint { opacity: 1; background: radial-gradient(ellipse at 15% 0%, rgba(255,170,120,.55), transparent 65%), linear-gradient(180deg, rgba(255,190,150,.18), transparent 60%); }
.lf-cine[data-light="day"]    .lf-tint { opacity: 1; background: linear-gradient(180deg, rgba(255,250,235,.16), transparent 55%); }
.lf-cine[data-light="dusk"]   .lf-tint { opacity: 1; background: linear-gradient(180deg, rgba(255,140,70,.35), rgba(170,70,140,.22) 55%, rgba(40,30,90,.25)); }
.lf-cine[data-light="night"]  .lf-tint { opacity: 1; background: radial-gradient(ellipse at 80% 0%, rgba(140,170,255,.25), transparent 55%), linear-gradient(180deg, rgba(10,20,60,.45), rgba(5,8,25,.35)); }
.lf-cine[data-light="candle"] .lf-tint { opacity: 1; background: radial-gradient(ellipse at 50% 110%, rgba(255,150,60,.55), rgba(255,110,40,.15) 50%, transparent 75%); animation: lf-candle 3.2s var(--lf-flicker-ease, ease-in-out) infinite; }
.lf-cine[data-light="storm"]  .lf-tint { opacity: 1; background: linear-gradient(180deg, rgba(40,55,80,.55), rgba(20,25,40,.45)); }
/* Neon drifts between two colourings by cross-fading two layers (a hue-rotate filter animation would be redrawn every frame). */
.lf-cine[data-light="neon"]   .lf-tint { opacity: 1; }
.lf-cine[data-light="neon"]   .lf-tint::before, .lf-cine[data-light="neon"] .lf-tint::after { content: ''; position: absolute; inset: 0; }
.lf-cine[data-light="neon"]   .lf-tint::before { background: radial-gradient(ellipse at 0% 50%, rgba(255,40,200,.35), transparent 55%), radial-gradient(ellipse at 100% 50%, rgba(0,220,255,.35), transparent 55%); animation: lf-neon-out 6s var(--lf-drift-ease, ease-in-out) infinite alternate; }
.lf-cine[data-light="neon"]   .lf-tint::after { opacity: 0; background: radial-gradient(ellipse at 0% 50%, rgba(255,44,75,.35), transparent 55%), radial-gradient(ellipse at 100% 50%, rgba(92,183,255,.35), transparent 55%); animation: lf-neon-in 6s var(--lf-drift-ease, ease-in-out) infinite alternate; }
/* The sway only runs while the rays are showing: an animation on an invisible layer still keeps the browser drawing frames. */
.lf-cine[data-light="dawn"] .lf-rays, .lf-cine[data-light="dusk"] .lf-rays, .lf-cine[data-light="day"] .lf-rays {
  opacity: 1; will-change: transform; animation: lf-rays-sway 18s var(--lf-sway-ease, ease-in-out) infinite alternate; }
.lf-cine[data-light="night"] .lf-vignette, .lf-cine[data-light="storm"] .lf-vignette {
  background: radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,calc(var(--lf-vignette, .35) * 2.1)) 100%); }

.lf-cine[data-saver="1"] .lf-rays, .lf-cine[data-saver="1"] .lf-grain { display: none; }
.lf-cine.lf-flashing .lf-flash { animation: lf-lightning 1.1s ease-out; }
.lf-cine.lf-flashing.lf-soft .lf-flash { animation: lf-lightning-soft 2.4s ease-in-out; }

@keyframes lf-rays-sway { from { transform: rotate(-2deg); } to { transform: rotate(3deg); } }
@keyframes lf-grain { 0% { transform: translate(0, 0); } 25% { transform: translate(-40px, 20px); } 50% { transform: translate(30px, -50px); } 75% { transform: translate(-60px, -10px); } 100% { transform: translate(0, 0); } }
@keyframes lf-candle { 0%, 100% { opacity: 1; } 30% { opacity: .82; } 55% { opacity: .95; } 70% { opacity: .78; } }
@keyframes lf-neon-out { to { opacity: 0; } }
@keyframes lf-neon-in { to { opacity: 1; } }
@keyframes lf-lightning { 0% { opacity: 0; } 4% { opacity: .9; } 9% { opacity: .1; } 14% { opacity: .7; } 40% { opacity: .15; } 100% { opacity: 0; } }
@keyframes lf-lightning-soft { 0% { opacity: 0; } 35% { opacity: .22; } 100% { opacity: 0; } }
@keyframes lf-camshake {
  0%, 100% { transform: translate(0, 0); }
  15% { transform: translate(-3px, 2px) rotate(-.25deg); }
  30% { transform: translate(3px, -2px) rotate(.25deg); }
  45% { transform: translate(-2px, -1px); }
  60% { transform: translate(2px, 1px); }
  80% { transform: translate(-1px, 1px); }
}

/* On a touch screen the slow movements (the rays' sway, neon's drift, the candle's flicker) are taken in small steps
   instead of every frame: each change makes the browser redraw whatever blurs the background behind the messages,
   which is where the cost is on a phone. The steps are far finer than the eye can tell apart. */
@media (pointer: coarse) {
  .lf-cine { --lf-sway-ease: steps(60, end); --lf-drift-ease: steps(30, end); --lf-flicker-ease: steps(6, end); }
}

@media (prefers-reduced-motion: reduce) {
  .lf-cine .lf-rays, .lf-cine .lf-grain, .lf-cine .lf-tint, .lf-cine .lf-tint::before, .lf-cine .lf-tint::after { animation: none !important; }
}
`;
var grainUrl = null;
function grainTile() {
  if (grainUrl)
    return grainUrl;
  const c = document.createElement("canvas");
  c.width = c.height = 160;
  const g = c.getContext("2d");
  if (!g)
    return "";
  const img = g.createImageData(160, 160);
  for (let i = 0;i < img.data.length; i += 4) {
    const v = Math.random() * 255;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  grainUrl = c.toDataURL("image/png");
  return grainUrl;
}

class Cinematic {
  el;
  flashEl;
  raysEl;
  raysFor = { w: 0, h: 0, dusk: false };
  watch = null;
  lightningTimer = null;
  st = { enabled: false, light: "none", vignette: 0.35, grain: false, lightning: true, noFlash: false, motion: true, saver: false };
  onThunder = null;
  constructor(make) {
    this.el = make("div");
    this.el.className = "lf-cine";
    const layer = (cls) => {
      const d = make("div");
      d.className = cls;
      this.el.appendChild(d);
      return d;
    };
    layer("lf-tint");
    this.raysEl = layer("lf-rays");
    layer("lf-vignette");
    const grain = layer("lf-grain");
    grain.style.backgroundImage = `url("${grainTile()}")`;
    this.flashEl = layer("lf-flash");
    this.flashEl.addEventListener("animationend", () => this.el.classList.remove("lf-flashing"));
    if (typeof ResizeObserver !== "undefined") {
      this.watch = new ResizeObserver(() => this.paintRays());
      this.watch.observe(this.el);
    }
  }
  set(next) {
    this.st = next;
    const on = next.enabled;
    this.el.style.display = on ? "" : "none";
    this.el.dataset.light = on ? next.light : "none";
    this.el.dataset.grain = on && next.grain ? "1" : "0";
    this.el.dataset.saver = next.saver ? "1" : "0";
    this.el.style.setProperty("--lf-vignette", String(on ? next.vignette : 0));
    this.paintRays();
    this.scheduleLightning();
  }
  get animating() {
    const s = this.st;
    return s.enabled && s.motion && (s.light === "candle" || s.light === "neon" || RAY_LIGHTS.has(s.light) || s.grain);
  }
  paintRays() {
    const s = this.st;
    if (!s.enabled || s.saver || !RAY_LIGHTS.has(s.light))
      return;
    const w = this.el.clientWidth;
    const h = this.el.clientHeight;
    if (w < 60 || h < 60)
      return;
    const dusk = s.light === "dusk";
    const f = this.raysFor;
    if (this.raysEl.style.backgroundImage && dusk === f.dusk && Math.abs(w - f.w) < f.w * 0.04 && Math.abs(h - f.h) < f.h * 0.04)
      return;
    this.raysFor = { w, h, dusk };
    this.raysEl.style.backgroundImage = `url("${raysImage(w, h, dusk ? RAY_DUSK : RAY_DAY)}")`;
  }
  scheduleLightning() {
    if (this.lightningTimer)
      clearTimeout(this.lightningTimer);
    this.lightningTimer = null;
    const s = this.st;
    if (!s.enabled || s.light !== "storm" || !s.lightning || !s.motion)
      return;
    this.lightningTimer = setTimeout(() => {
      if (!document.hidden)
        this.flash();
      this.scheduleLightning();
    }, 7000 + Math.random() * 14000);
  }
  flash() {
    this.el.classList.toggle("lf-soft", this.st.noFlash);
    this.el.classList.remove("lf-flashing");
    this.el.offsetWidth;
    this.el.classList.add("lf-flashing");
    this.onThunder?.();
  }
  destroy() {
    if (this.lightningTimer)
      clearTimeout(this.lightningTimer);
    this.watch?.disconnect();
    this.el.remove();
  }
}
function blackHoleWarpRule(originX, originY, T) {
  const pct = (x) => `${Math.max(0, Math.min(100, x / T.total * 100)).toFixed(2)}%`;
  const d = T.detonate;
  return `@keyframes lf-bh-warp {
  0%, ${pct(T.form)} { transform: none; }
  ${pct(T.feedEnd)} { transform: scale(.975) rotate(-.5deg); }
  ${pct(T.collapseEnd)} { transform: scale(.958) rotate(-.9deg); }
  ${pct(d - 0.03)} { transform: scale(.95) rotate(-1deg); }
  ${pct(d + 0.08)} { transform: scale(1.035) rotate(.3deg); }
  ${pct(d + 0.22)} { transform: scale(.994) translate(-4px, 2px); }
  ${pct(d + 0.36)} { transform: scale(1.006) translate(3px, -2px); }
  ${pct(d + 0.55)} { transform: scale(1) translate(-1px, 1px); }
  100% { transform: none; }
}
:root [data-component="ChatView"] [data-lumiverse-surface="chat-body"] { transform-origin: ${originX.toFixed(1)}% ${originY.toFixed(1)}%; animation: lf-bh-warp ${Math.round(T.total * 1000)}ms linear; }`;
}
function cameraShakeRule() {
  return `:root [data-component="ChatView"] [data-lumiverse-surface="chat-body"] { animation: lf-camshake 420ms ease-out; }`;
}

// src/aura.ts
var CARD_SEL = ':is([data-component="BubbleMessage"],[data-component="MinimalMessage"])[data-message-id]';
function toHex(r, g, b) {
  return "#" + [r, g, b].map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("");
}
function sampleVivid(img) {
  const c = document.createElement("canvas");
  c.width = c.height = 32;
  const g = c.getContext("2d", { willReadFrequently: true });
  if (!g)
    return null;
  try {
    g.drawImage(img, 0, 0, 32, 32);
    const d = g.getImageData(0, 0, 32, 32).data;
    const bins = Array.from({ length: 24 }, () => ({ w: 0, r: 0, g: 0, b: 0 }));
    for (let i = 0;i < d.length; i += 4) {
      if (d[i + 3] < 128)
        continue;
      const r = d[i] / 255, gg = d[i + 1] / 255, b = d[i + 2] / 255;
      const max = Math.max(r, gg, b), min = Math.min(r, gg, b);
      const l = (max + min) / 2;
      const s = max === min ? 0 : (max - min) / (1 - Math.abs(2 * l - 1));
      if (s < 0.25 || l < 0.18 || l > 0.85)
        continue;
      let h = 0;
      if (max === r)
        h = ((gg - b) / (max - min) + 6) % 6;
      else if (max === gg)
        h = (b - r) / (max - min) + 2;
      else
        h = (r - gg) / (max - min) + 4;
      const bin = bins[Math.floor(h * 60 / 15) % 24];
      const w = s * (1 - Math.abs(l - 0.55) * 1.6);
      bin.w += w;
      bin.r += d[i] * w;
      bin.g += d[i + 1] * w;
      bin.b += d[i + 2] * w;
    }
    let best = bins[0], bestIdx = 0;
    bins.forEach((b, i) => {
      if (b.w > best.w) {
        best = b;
        bestIdx = i;
      }
    });
    if (best.w <= 0.5)
      return null;
    let r = best.r / best.w, gg = best.g / best.w, b = best.b / best.w;
    const lum = (Math.max(r, gg, b) + Math.min(r, gg, b)) / 510;
    const lift = lum < 0.55 ? (0.55 - lum) * 1.4 : 0;
    r += (255 - r) * lift;
    gg += (255 - gg) * lift;
    b += (255 - b) * lift;
    const hue = bestIdx * 15 + 7;
    return { color: toHex(r, gg, b), hue, burst: burstForHue(hue) };
  } catch {
    return null;
  }
}
function burstForHue(h) {
  if (h < 50 || h >= 330)
    return "sparkle";
  if (h < 170)
    return "ripple";
  if (h < 260)
    return "comet";
  return "confetti";
}
function cssString(v) {
  return v.replace(/\\/g, "\\\\").replace(/"/g, "\\\"");
}

class AuraManager {
  bySrc = new Map;
  style;
  rulesKey = "";
  enabled = true;
  paint = true;
  onChange = null;
  constructor(style) {
    this.style = style;
  }
  avatarOf(card) {
    return card.querySelector("img[src]:not([data-lf-skip])");
  }
  scan() {
    if (!this.enabled) {
      if (this.rulesKey) {
        this.style.textContent = "";
        this.rulesKey = "";
      }
      return;
    }
    const cards = document.querySelectorAll(`${CARD_SEL}:not([data-part="user"])`);
    cards.forEach((card) => {
      const img = this.avatarOf(card);
      const src = img?.getAttribute("src");
      if (!img || !src || this.bySrc.has(src))
        return;
      this.bySrc.set(src, "pending");
      const probe = new Image;
      probe.crossOrigin = img.crossOrigin || null;
      probe.onload = () => {
        this.bySrc.set(src, sampleVivid(probe) ?? "none");
        this.render();
      };
      probe.onerror = () => this.bySrc.set(src, "none");
      probe.src = src;
    });
    this.render();
  }
  render() {
    const rules = [];
    for (const [src, aura] of this.bySrc) {
      if (typeof aura !== "object" || !this.paint)
        continue;
      rules.push(`:root ${CARD_SEL}:not([data-part="user"]):has(img[src="${cssString(src)}"]) { --lf-aura: ${aura.color}; --lf-glow: color-mix(in oklab, ${aura.color} 68%, var(--lf-c)); }`);
    }
    const sampled = [...this.bySrc.values()].filter((a) => typeof a === "object").length;
    const key = rules.join(`
`) + `/*${sampled}*/`;
    if (key === this.rulesKey)
      return;
    this.rulesKey = key;
    this.style.textContent = rules.join(`
`);
    try {
      this.onChange?.();
    } catch {}
  }
  latest() {
    const cards = document.querySelectorAll(`${CARD_SEL}:not([data-part="user"])`);
    for (let i = cards.length - 1;i >= 0; i--) {
      const found = this.of(cards[i]);
      if (found)
        return { ...found, messageId: cards[i].dataset.messageId ?? "" };
    }
    return null;
  }
  of(card) {
    const src = this.avatarOf(card)?.getAttribute("src");
    const a = src ? this.bySrc.get(src) : null;
    return src && a && typeof a === "object" ? { aura: a, avatar: src } : null;
  }
  forSpeaker(name) {
    const want = name.trim().toLowerCase();
    if (!want)
      return null;
    const cards = document.querySelectorAll(`${CARD_SEL}:not([data-part="user"])`);
    for (let i = cards.length - 1;i >= 0; i--) {
      const label = cards[i].querySelector('[class*="_name_"]')?.textContent?.trim().toLowerCase();
      if (label !== want)
        continue;
      const found = this.of(cards[i]);
      if (found)
        return found;
    }
    return null;
  }
  forStreaming() {
    const card = document.querySelector(`${CARD_SEL}[data-part="streaming"]`);
    return card ? this.of(card) : null;
  }
  forMessage(messageId) {
    const card = document.querySelector(`${CARD_SEL.replace("[data-message-id]", `[data-message-id="${cssString(messageId)}"]`)}`);
    const src = card ? this.avatarOf(card)?.getAttribute("src") : null;
    const a = src ? this.bySrc.get(src) : null;
    return a && typeof a === "object" ? a : null;
  }
  list() {
    return [...this.bySrc.values()].filter((a) => typeof a === "object");
  }
}

// src/intro.ts
var INTRO_MS = 2300;
var GRACE_MS = 500;
var INTRO_CSS = `
.lf-intro, .lf-intro *, .lf-spk, .lf-spk * { margin: 0; padding: 0; box-sizing: border-box; text-align: center; line-height: 1.2; }
.lf-intro { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; opacity: 0; pointer-events: none;
  animation: lf-intro-life var(--lf-intro-ms, 2300ms) ease both; }
.lf-intro-veil { position: absolute; inset: 0; background: radial-gradient(ellipse at 50% 46%, rgba(6,6,12,.68), rgba(6,6,12,.34) 55%, rgba(6,6,12,0) 84%); }
.lf-intro-card { position: relative; display: flex; flex-direction: column; align-items: center; gap: 10px; max-width: min(86vw, 640px);
  animation: lf-intro-rise var(--lf-intro-ms, 2300ms) cubic-bezier(.2,.7,.2,1) both; }
.lf-intro-av { width: 84px; height: 84px; border-radius: 50%; object-fit: cover; margin-bottom: 4px;
  border: 2px solid var(--lf-intro-c); box-shadow: 0 0 34px color-mix(in srgb, var(--lf-intro-c) 70%, transparent); }
.lf-intro-kicker { font-size: 12px; letter-spacing: .28em; text-transform: uppercase; color: rgba(255,255,255,.78); text-shadow: 0 1px 6px rgba(0,0,0,.8); }
.lf-intro-name { font-size: clamp(30px, 8vw, 56px); font-weight: 700; letter-spacing: .02em; color: var(--lf-intro-c); overflow-wrap: anywhere;
  text-shadow: 0 0 28px color-mix(in srgb, var(--lf-intro-c) 75%, transparent), 0 2px 12px rgba(0,0,0,.55); }
.lf-intro-rule { width: min(70vw, 260px); height: 2px; border-radius: 2px; transform-origin: center;
  background: linear-gradient(90deg, transparent, var(--lf-intro-c), transparent); animation: lf-intro-rule var(--lf-intro-ms, 2300ms) ease both; }
.lf-intro[data-motion="0"] .lf-intro-card, .lf-intro[data-motion="0"] .lf-intro-rule { animation: none; }
@keyframes lf-intro-life { 0% { opacity: 0 } 18% { opacity: 1 } 78% { opacity: 1 } 100% { opacity: 0 } }
@keyframes lf-intro-rise { 0% { transform: translateY(10px) scale(.95) } 22% { transform: none } 100% { transform: translateY(-4px) scale(1.02) } }
@keyframes lf-intro-rule { 0%, 12% { transform: scaleX(0) } 38%, 100% { transform: scaleX(1) } }
@media (pointer: coarse) { .lf-intro-veil { background: rgba(6,6,12,.62); } .lf-intro-av { width: 72px; height: 72px; } }

/* Group chats: who is speaking */
.lf-spk { position: absolute; left: 50%; bottom: 120px; width: 0; display: flex; justify-content: center; pointer-events: none; }
.lf-spk-in { flex: none; display: flex; align-items: center; gap: 9px; padding: 7px 14px 7px 11px; border-radius: 999px; white-space: nowrap;
  font-size: 13px; font-weight: 600; color: #fff; background: rgba(12,12,20,.82);
  border: 1px solid color-mix(in srgb, var(--lf-spk-c) 60%, transparent); box-shadow: 0 0 22px color-mix(in srgb, var(--lf-spk-c) 38%, transparent);
  animation: lf-spk-pop .3s cubic-bezier(.2,.7,.2,1) both; }
.lf-spk-dot { width: 10px; height: 10px; border-radius: 50%; flex: none; background: var(--lf-spk-c); box-shadow: 0 0 10px var(--lf-spk-c); }
.lf-spk-name { max-width: min(60vw, 260px); overflow: hidden; text-overflow: ellipsis; }
.lf-spk-n { font-weight: 500; font-size: 11px; color: rgba(255,255,255,.6); font-variant-numeric: tabular-nums; }
.lf-spk[data-motion="0"] .lf-spk-in { animation: none; }
@keyframes lf-spk-pop { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: none } }
`;
function hslToHex(h, s, l) {
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return "#" + [f(0), f(8), f(4)].map((v) => Math.round(v * 255).toString(16).padStart(2, "0")).join("");
}
function hashColor(seed) {
  let h = 2166136261;
  for (let i = 0;i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return hslToHex((h >>> 0) % 360, 0.72, 0.64);
}
var SAFE_SRC = /^(https?:|data:image\/|blob:|\/)/i;

class IntroCard {
  root;
  el = null;
  timer;
  stopInput = null;
  constructor(root) {
    this.root = root;
  }
  get showing() {
    return !!this.el;
  }
  show(o) {
    this.hide(true);
    const el = document.createElement("div");
    el.className = "lf-intro";
    el.dataset.motion = o.motion ? "1" : "0";
    el.style.setProperty("--lf-intro-c", o.color);
    el.style.setProperty("--lf-intro-ms", `${INTRO_MS}ms`);
    const a = o.area;
    if (a && a.width > 160 && a.height > 160) {
      el.style.right = el.style.bottom = "auto";
      el.style.left = `${Math.round(a.left)}px`;
      el.style.top = `${Math.round(a.top)}px`;
      el.style.width = `${Math.round(a.width)}px`;
      el.style.height = `${Math.round(a.height)}px`;
    }
    const veil = document.createElement("div");
    veil.className = "lf-intro-veil";
    const card = document.createElement("div");
    card.className = "lf-intro-card";
    if (o.avatar && SAFE_SRC.test(o.avatar)) {
      const av = document.createElement("img");
      av.className = "lf-intro-av";
      av.alt = "";
      av.decoding = "async";
      av.src = o.avatar;
      av.addEventListener("error", () => av.remove());
      card.appendChild(av);
    }
    const kicker = document.createElement("div");
    kicker.className = "lf-intro-kicker";
    kicker.textContent = o.kicker;
    const name = document.createElement("div");
    name.className = "lf-intro-name";
    name.textContent = o.name;
    const rule = document.createElement("div");
    rule.className = "lf-intro-rule";
    card.append(kicker, name, rule);
    el.append(veil, card);
    this.root.appendChild(el);
    this.el = el;
    this.timer = setTimeout(() => this.hide(true), INTRO_MS + 120);
    const shownAt = performance.now();
    const early = () => {
      if (performance.now() - shownAt > GRACE_MS)
        this.hide(false);
    };
    document.addEventListener("pointerdown", early, { capture: true, passive: true });
    document.addEventListener("keydown", early, { capture: true, passive: true });
    this.stopInput = () => {
      document.removeEventListener("pointerdown", early, { capture: true });
      document.removeEventListener("keydown", early, { capture: true });
    };
  }
  hide(instant) {
    const el = this.el;
    this.stopInput?.();
    this.stopInput = null;
    if (this.timer)
      clearTimeout(this.timer);
    this.timer = undefined;
    if (!el)
      return;
    this.el = null;
    if (instant) {
      el.remove();
      return;
    }
    const now = getComputedStyle(el).opacity;
    el.style.animation = "none";
    el.style.opacity = now;
    el.offsetWidth;
    el.style.transition = "opacity .25s ease";
    el.style.opacity = "0";
    setTimeout(() => el.remove(), 300);
  }
  destroy() {
    this.hide(true);
  }
}

class SpeakerChip {
  root;
  el = null;
  fading = null;
  fade;
  constructor(root) {
    this.root = root;
  }
  get showing() {
    return !!this.el;
  }
  show(o) {
    this.hide(true);
    const wrap = document.createElement("div");
    wrap.className = "lf-spk";
    wrap.dataset.motion = o.motion ? "1" : "0";
    wrap.style.left = `${Math.round(o.x)}px`;
    wrap.style.bottom = `${Math.round(o.bottom)}px`;
    wrap.style.setProperty("--lf-spk-c", o.color);
    const chip = document.createElement("div");
    chip.className = "lf-spk-in";
    const dot = document.createElement("span");
    dot.className = "lf-spk-dot";
    const name = document.createElement("span");
    name.className = "lf-spk-name";
    name.textContent = o.name;
    chip.append(dot, name);
    if (o.total > 1) {
      const n = document.createElement("span");
      n.className = "lf-spk-n";
      n.textContent = `${Math.min(o.turn, o.total)}/${o.total}`;
      chip.appendChild(n);
    }
    wrap.appendChild(chip);
    this.root.appendChild(wrap);
    this.el = wrap;
    this.place(o.x, o.bottom);
  }
  fit(x) {
    const w = this.el?.firstElementChild?.getBoundingClientRect().width ?? 0;
    const half = w / 2 + 8;
    return Math.max(half, Math.min(window.innerWidth - half, x));
  }
  setColor(color) {
    this.el?.style.setProperty("--lf-spk-c", color);
  }
  place(x, bottom) {
    if (!this.el)
      return;
    this.el.style.left = `${Math.round(this.fit(x))}px`;
    this.el.style.bottom = `${Math.round(bottom)}px`;
  }
  hide(instant) {
    if (this.fade) {
      clearTimeout(this.fade);
      this.fade = undefined;
      this.fading?.remove();
      this.fading = null;
    }
    const el = this.el;
    if (!el)
      return;
    this.el = null;
    if (instant) {
      el.remove();
      return;
    }
    el.style.transition = "opacity .3s ease";
    el.style.opacity = "0";
    this.fading = el;
    this.fade = setTimeout(() => {
      el.remove();
      if (this.fading === el)
        this.fading = null;
      this.fade = undefined;
    }, 340);
  }
  destroy() {
    this.hide(true);
  }
}

// src/theater.ts
var SPEED_LEVELS = [8, 14, 22, 32, 46, 64, 90, 130];
var SCALE_MIN = 1;
var SCALE_MAX = 2.2;
var RESUME_MS = 2500;
var BAR_MS = 3200;
var R2 = ":root[data-lf-theater]";
var CHROME = [
  '[data-component="DesktopPwaTitlebar"]',
  '[data-component="QuickToolbar"]',
  '[data-component="ChatFindBar"]',
  '[data-component="ScrollToBottom"]',
  '[data-component="MessageSelectBar"]',
  '[data-component="BubbleActions"]',
  '[data-component="SwipeControls"]',
  '[data-spindle-mount="chat_top_dock"]',
  '[data-spindle-mount^="chat_header_"]',
  '[data-spindle-mount="chat_bottom_dock"]',
  '[data-spindle-mount="chat_composer_above"]',
  '[data-spindle-mount="chat_sidebar_left"]',
  '[data-spindle-mount="chat_sidebar_right"]',
  '[data-spindle-mount="message_actions"]',
  '[data-lumiverse-surface="chat-column"] > [class*="_noticeDock_"]',
  '[data-lumiverse-surface="chat-body"] > [class*="_portraitSide_"]',
  '[class*="_longMessageToggle_"]',
  'div:has(> div > [data-spindle-mount="sidebar"])',
  '[class*="_backdrop_"]:has(+ div > div > [data-spindle-mount="sidebar"])'
];
function theaterCss(scale) {
  const s = Math.min(SCALE_MAX, Math.max(SCALE_MIN, scale));
  return `
${CHROME.map((c) => `${R2} ${c}`).join(`,
`)} { display: none !important; }
${R2}:not([data-lf-compose]) [data-component="InputArea"] { display: none !important; }
${R2} [class*="_longMessageViewportConstrained_"] { max-height: none !important; overflow: visible !important; }
${R2} [class*="_longMessageViewportOverflowing_"] { -webkit-mask-image: none !important; mask-image: none !important; }
${R2} [data-component="MessageContent"] { font-size: calc(14px * var(--lumiverse-font-scale, 1) * ${s}) !important; line-height: 1.75 !important; }
${R2} [data-component="MessageList"] { padding-bottom: calc(96px + env(safe-area-inset-bottom, 0px)) !important; }
`;
}
var THEATER_CSS = `
.lf-th-root { position: fixed; inset: 0; z-index: 2147483001; pointer-events: none; }
.lf-th, .lf-th * { margin: 0; padding: 0; box-sizing: border-box; line-height: 1.2; text-align: center; }
.lf-th { position: absolute; left: 0; right: 0; bottom: calc(env(safe-area-inset-bottom, 0px) + 16px); display: flex; flex-direction: column; align-items: center;
  gap: 8px; padding: 0 12px; pointer-events: none; opacity: 0; transform: translateY(10px); visibility: hidden;
  transition: opacity .3s ease, transform .3s ease, visibility 0s .3s; }
.lf-th[data-show="1"] { opacity: 1; transform: none; visibility: visible; transition: opacity .3s ease, transform .3s ease; }
.lf-th[data-compose="1"] { bottom: auto; top: calc(var(--app-interactive-safe-top, env(safe-area-inset-top, 0px)) + 12px); }
.lf-th-hint { font-size: 12px; color: rgba(255,255,255,.82); background: rgba(12,12,20,.72); padding: 5px 12px; border-radius: 999px; max-width: 100%; }
.lf-th-bar { pointer-events: auto; display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: 4px 14px; padding: 6px; max-width: 100%;
  border-radius: 18px; background: rgba(12,12,20,.88); border: 1px solid rgba(255,255,255,.14); box-shadow: 0 6px 28px rgba(0,0,0,.45); }
.lf-th-btn { width: 44px; height: 44px; border-radius: 12px; border: 0; background: transparent; color: #fff; display: inline-flex; align-items: center;
  justify-content: center; cursor: pointer; font: inherit; -webkit-tap-highlight-color: transparent; }
.lf-th-btn:hover { background: rgba(255,255,255,.12); }
.lf-th-btn:focus-visible { outline: 2px solid var(--lf-c, #9370db); outline-offset: -2px; }
.lf-th-btn[aria-pressed="true"] { background: rgba(255,255,255,.2); }
.lf-th-btn:disabled { opacity: .35; cursor: default; }
.lf-th-btn svg { width: 20px; height: 20px; }
.lf-th-val { min-width: 30px; font-size: 13px; font-weight: 600; color: rgba(255,255,255,.88); font-variant-numeric: tabular-nums; }
.lf-th-grp { display: flex; align-items: center; gap: 2px; }
@media (prefers-reduced-motion: reduce) { .lf-th, .lf-th[data-show="1"] { transition: none; transform: none; } }
`;
var svg = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
var THEATER_ICON = svg('<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>');
var ICON = {
  exit: svg('<path d="M6 6l12 12M18 6L6 18"/>'),
  play: svg('<path d="M8 5.5v13l10.5-6.5z" fill="currentColor"/>'),
  pause: svg('<path d="M8 5v14M16 5v14" stroke-width="3"/>'),
  slower: svg('<path d="M5 12h14"/>'),
  faster: svg('<path d="M5 12h14M12 5v14"/>'),
  smaller: svg('<path d="M4 18l5-12 5 12M6 14h6M17 9h4"/>'),
  larger: svg('<path d="M3 19l6-14 6 14M5.5 14h7M18 7v6M15 10h6"/>'),
  reply: svg('<path d="M4 5h16v11H9l-5 4z"/>')
};
var editable = (el) => {
  const e = el;
  return !!e && (e.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(e.tagName));
};

class Theater {
  h;
  on_ = false;
  playing = false;
  bar = null;
  raf = 0;
  timer;
  last = 0;
  carry = 0;
  lastInput = 0;
  held = false;
  hideTimer;
  barHover = false;
  pokedAt = 0;
  stop = null;
  ui = null;
  constructor(h) {
    this.h = h;
  }
  get on() {
    return this.on_;
  }
  toggle(from) {
    if (this.on_)
      this.exit();
    else
      this.enter(from);
  }
  enter(from) {
    const list = this.h.list();
    if (this.on_ || !list)
      return;
    const atEnd = list.scrollHeight - list.scrollTop - list.clientHeight < 120;
    this.on_ = true;
    this.h.closeDrawer();
    const root = document.documentElement;
    root.setAttribute("data-lf-theater", "1");
    this.paint();
    this.buildBar();
    this.playing = this.h.get().scroll && this.h.motion();
    this.listen();
    this.syncBar();
    this.poke(true);
    requestAnimationFrame(() => requestAnimationFrame(() => this.startAt(from ?? null, atEnd)));
    this.kick();
    this.h.changed(true);
  }
  exit() {
    if (!this.on_)
      return;
    this.on_ = false;
    this.stop?.();
    this.stop = null;
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    clearTimeout(this.timer);
    clearTimeout(this.hideTimer);
    this.timer = this.hideTimer = undefined;
    this.bar?.remove();
    this.bar = null;
    this.ui = null;
    this.h.style.textContent = "";
    const root = document.documentElement;
    root.removeAttribute("data-lf-theater");
    root.removeAttribute("data-lf-compose");
    this.h.changed(false);
  }
  destroy() {
    this.exit();
  }
  refresh() {
    if (!this.on_)
      return;
    this.paint();
    this.syncBar();
  }
  paint() {
    this.h.style.textContent = theaterCss(this.h.get().scale);
  }
  startAt(from, atEnd) {
    const list = this.h.list();
    if (!this.on_ || !list)
      return;
    let target = from;
    if (!target) {
      const latest = this.h.latest();
      if (atEnd && latest && latest.getBoundingClientRect().height > list.clientHeight * 0.5)
        target = latest;
    }
    if (!target)
      return;
    const gap = target.getBoundingClientRect().top - list.getBoundingClientRect().top;
    list.scrollTop += gap - 16;
    this.carry = 0;
    this.lastInput = performance.now() - RESUME_MS + 600;
  }
  buildBar() {
    const t = this.h.tr;
    const bar = document.createElement("div");
    bar.className = "lf-th";
    bar.dataset.show = "0";
    const hint = document.createElement("div");
    hint.className = "lf-th-hint";
    hint.textContent = matchMedia("(hover: hover)").matches ? t("Esc leaves · Space pauses the scroll · + and − change the text size") : t("Tap the screen to show these controls");
    const row = document.createElement("div");
    row.className = "lf-th-bar";
    row.setAttribute("role", "toolbar");
    row.setAttribute("aria-label", t("Theater mode"));
    const btn = (icon, label, on) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "lf-th-btn";
      b.innerHTML = icon;
      b.title = t(label);
      b.setAttribute("aria-label", t(label));
      b.addEventListener("click", (e) => {
        e.stopPropagation();
        on();
        this.poke(true);
      });
      return b;
    };
    const val = () => {
      const v = document.createElement("span");
      v.className = "lf-th-val";
      return v;
    };
    const group = (...items) => {
      const g = document.createElement("div");
      g.className = "lf-th-grp";
      g.append(...items);
      return g;
    };
    const exit = btn(ICON.exit, "Leave theater mode", () => this.exit());
    const play = btn(ICON.play, "Pause the scroll", () => this.togglePlay());
    const slower = btn(ICON.slower, "Scroll slower", () => this.nudgeSpeed(-1));
    const speed = val();
    const faster = btn(ICON.faster, "Scroll faster", () => this.nudgeSpeed(1));
    const smaller = btn(ICON.smaller, "Smaller text", () => this.nudgeScale(-0.1));
    const scale = val();
    const larger = btn(ICON.larger, "Larger text", () => this.nudgeScale(0.1));
    const reply = btn(ICON.reply, "Show the reply box", () => this.toggleReply());
    row.append(group(exit), group(play, slower, speed, faster), group(smaller, scale, larger), group(reply));
    bar.append(hint, row);
    row.addEventListener("pointerenter", () => this.barHover = true);
    row.addEventListener("pointerleave", () => {
      this.barHover = false;
      this.poke(true);
    });
    row.addEventListener("focusin", () => this.poke(true));
    this.h.root.appendChild(bar);
    this.bar = bar;
    this.ui = { play, speed, scale, reply, slower, faster, smaller, larger, hint };
  }
  syncBar() {
    const u = this.ui;
    if (!u)
      return;
    const t = this.h.tr;
    const s = this.h.get();
    const level = this.level(s.speed);
    u.speed.textContent = String(level);
    u.scale.textContent = `${Math.round(s.scale * 100)}%`;
    u.slower.disabled = level <= 1;
    u.faster.disabled = level >= SPEED_LEVELS.length;
    u.smaller.disabled = s.scale <= SCALE_MIN + 0.001;
    u.larger.disabled = s.scale >= SCALE_MAX - 0.001;
    u.play.innerHTML = this.playing ? ICON.pause : ICON.play;
    const pl = this.playing ? t("Pause the scroll") : t("Start the scroll");
    u.play.title = pl;
    u.play.setAttribute("aria-label", pl);
    const composing = document.documentElement.hasAttribute("data-lf-compose");
    u.reply.setAttribute("aria-pressed", String(composing));
    const rl = t(composing ? "Hide the reply box" : "Show the reply box");
    u.reply.title = rl;
    u.reply.setAttribute("aria-label", rl);
    if (this.bar)
      this.bar.dataset.compose = composing ? "1" : "0";
  }
  level(speed) {
    return Math.min(SPEED_LEVELS.length, Math.max(1, Math.round(speed)));
  }
  nudgeSpeed(by) {
    this.h.set({ theaterSpeed: this.level(this.h.get().speed) + by });
    this.syncBar();
  }
  nudgeScale(by) {
    const next = Math.round((this.h.get().scale + by) * 100) / 100;
    this.h.set({ theaterScale: Math.min(SCALE_MAX, Math.max(SCALE_MIN, next)) });
    this.paint();
    this.syncBar();
  }
  togglePlay() {
    this.playing = !this.playing;
    this.lastInput = 0;
    this.syncBar();
    if (this.playing)
      this.kick();
  }
  toggleReply() {
    const root = document.documentElement;
    if (root.hasAttribute("data-lf-compose"))
      root.removeAttribute("data-lf-compose");
    else
      root.setAttribute("data-lf-compose", "1");
    this.syncBar();
  }
  poke(force = false) {
    const bar = this.bar;
    if (!bar)
      return;
    const now = performance.now();
    if (!force && now - this.pokedAt < 300)
      return;
    this.pokedAt = now;
    bar.dataset.show = "1";
    this.armHide();
  }
  armHide() {
    clearTimeout(this.hideTimer);
    this.hideTimer = setTimeout(() => {
      const bar = this.bar;
      if (!bar)
        return;
      if (this.barHover || bar.querySelector(":focus-visible"))
        return this.armHide();
      bar.dataset.show = "0";
      if (this.ui)
        this.ui.hint.style.display = "none";
    }, BAR_MS);
  }
  listen() {
    const input = () => this.lastInput = performance.now();
    const down = () => {
      this.held = true;
      input();
      this.poke();
    };
    const up = () => {
      this.held = false;
      input();
    };
    const key = (e) => {
      input();
      if (e.key === "Escape") {
        this.exit();
        return;
      }
      this.poke();
      if (editable(e.target) || e.ctrlKey || e.metaKey || e.altKey)
        return;
      if (e.key === " " && !e.target?.closest?.('button, a, [role="button"]')) {
        e.preventDefault();
        this.togglePlay();
      } else if (e.key === "+" || e.key === "=")
        this.nudgeScale(0.1);
      else if (e.key === "-" || e.key === "_")
        this.nudgeScale(-0.1);
    };
    const move = () => this.poke();
    const wheel = () => {
      input();
      this.poke();
    };
    const o = { capture: true, passive: true };
    document.addEventListener("pointerdown", down, o);
    document.addEventListener("pointerup", up, o);
    document.addEventListener("pointercancel", up, o);
    document.addEventListener("pointermove", move, o);
    document.addEventListener("wheel", wheel, o);
    document.addEventListener("touchmove", input, o);
    document.addEventListener("keydown", key, { capture: true });
    document.addEventListener("visibilitychange", this.kickSoon);
    this.stop = () => {
      document.removeEventListener("pointerdown", down, o);
      document.removeEventListener("pointerup", up, o);
      document.removeEventListener("pointercancel", up, o);
      document.removeEventListener("pointermove", move, o);
      document.removeEventListener("wheel", wheel, o);
      document.removeEventListener("touchmove", input, o);
      document.removeEventListener("keydown", key, { capture: true });
      document.removeEventListener("visibilitychange", this.kickSoon);
    };
  }
  kickSoon = () => this.kick();
  kick() {
    if (!this.on_ || this.raf)
      return;
    clearTimeout(this.timer);
    this.timer = undefined;
    this.last = 0;
    this.raf = requestAnimationFrame(this.tick);
  }
  wait(ms) {
    this.last = 0;
    if (this.timer)
      clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.timer = undefined;
      if (this.on_ && !this.raf)
        this.tick(performance.now());
    }, ms);
  }
  tick = (now) => {
    this.raf = 0;
    if (!this.on_)
      return;
    const list = this.h.list();
    if (!list || !this.playing || document.hidden)
      return;
    if (this.held || performance.now() - this.lastInput < RESUME_MS)
      return this.wait(250);
    if (list.scrollHeight - list.scrollTop - list.clientHeight <= 2)
      return this.wait(600);
    if (!this.last) {
      this.last = now;
      this.raf = requestAnimationFrame(this.tick);
      return;
    }
    const dt = Math.min(0.1, (now - this.last) / 1000);
    this.last = now;
    this.carry += SPEED_LEVELS[this.level(this.h.get().speed) - 1] * dt;
    const px = Math.floor(this.carry);
    if (px >= 1) {
      this.carry -= px;
      list.scrollTop += px;
    }
    this.raf = requestAnimationFrame(this.tick);
  };
}

// src/typewriter.ts
var TYPEWRITER_CSS = `
::highlight(lf-typewriter) { color: transparent; text-shadow: none; text-decoration-color: transparent; }
`;
var NAME = "lf-typewriter";
var MAX_BEHIND_S = 1.5;
var FINISH_S = 0.6;
var CATCH_UP_S = 0.5;
var KEY_GAP_MS = 55;
var registry = () => globalThis.CSS?.highlights ?? null;
var HighlightClass = () => globalThis.Highlight ?? null;
var typewriterSupported = () => !!registry() && !!HighlightClass();
function measure(el) {
  const nodes = [];
  const lens = [];
  let total = 0;
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const t = walker.currentNode;
    const p = t.parentElement;
    if (!t.length || !p)
      continue;
    const closed = p.closest("details:not([open])");
    if (closed && el.contains(closed) && !p.closest("summary"))
      continue;
    const code = p.closest("style, script");
    if (code && el.contains(code))
      continue;
    nodes.push(t);
    lens.push(t.length);
    total += t.length;
  }
  return { nodes, lens, total };
}

class Typewriter {
  h;
  active = false;
  finishing = false;
  finishBy = 0;
  id = null;
  el = null;
  shown = 0;
  base = null;
  raf = 0;
  last = 0;
  observer = null;
  nextKeyAt = 0;
  lastKey = 0;
  demo = null;
  safety;
  constructor(h) {
    this.h = h;
  }
  get supported() {
    return typewriterSupported();
  }
  enabled() {
    return this.supported && this.h.get().on && this.h.motion();
  }
  start(keepFrom) {
    this.stop();
    if (!this.enabled())
      return;
    this.active = true;
    this.finishing = false;
    this.id = keepFrom ?? null;
    const prev = keepFrom ? this.h.content(keepFrom) : null;
    this.base = prev ? measure(prev).total : null;
    this.shown = 0;
    this.nextKeyAt = 0;
    const list = this.h.list();
    if (list) {
      this.observer = new MutationObserver(() => this.sync());
      this.observer.observe(list, { childList: true, subtree: true, characterData: true });
    }
    this.armSafety();
    this.sync();
  }
  end() {
    if (!this.active)
      return;
    this.finishing = true;
    this.finishBy = performance.now() + FINISH_S * 1000;
    this.sync();
    this.kick();
  }
  stop() {
    this.active = false;
    this.finishing = false;
    this.observer?.disconnect();
    this.observer = null;
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    clearTimeout(this.safety);
    this.safety = undefined;
    this.el = null;
    this.id = null;
    this.demo = null;
    registry()?.delete(NAME);
  }
  preview(el) {
    this.stop();
    if (!this.supported)
      return;
    this.active = true;
    this.finishing = true;
    this.demo = el;
    this.shown = 0;
    this.nextKeyAt = 0;
    this.armSafety();
    this.sync();
    this.kick();
  }
  armSafety() {
    clearTimeout(this.safety);
    this.safety = setTimeout(() => this.stop(), 5 * 60000);
  }
  target() {
    if (this.demo)
      return this.demo.isConnected ? this.demo : null;
    const el = this.h.content(this.id);
    if (el) {
      const card = el.closest("[data-message-id]");
      if (card?.dataset.messageId)
        this.id = card.dataset.messageId;
    }
    return el;
  }
  sync() {
    if (!this.active)
      return;
    if (!this.demo && !this.enabled())
      return this.stop();
    const el = this.target();
    if (!el) {
      if (this.finishing)
        this.stop();
      return;
    }
    if (el !== this.el) {
      this.el = el;
      if (this.base !== null)
        this.shown = Math.max(this.shown, this.base);
    }
    const m = measure(el);
    if (this.shown > m.total)
      this.shown = m.total;
    this.paint(m);
    if (m.total > this.shown)
      this.kick();
  }
  paint(m) {
    const reg = registry();
    const H = HighlightClass();
    if (!reg || !H)
      return;
    let at = Math.floor(this.shown);
    if (at >= m.total || !m.nodes.length) {
      reg.delete(NAME);
      return;
    }
    let i = 0;
    while (i < m.nodes.length && at >= m.lens[i]) {
      at -= m.lens[i];
      i++;
    }
    const last = m.nodes[m.nodes.length - 1];
    const range = document.createRange();
    range.setStart(m.nodes[i], at);
    range.setEnd(last, last.length);
    reg.set(NAME, new H(range));
  }
  kick() {
    if (this.raf || !this.active)
      return;
    this.last = 0;
    this.raf = requestAnimationFrame(this.tick);
  }
  tick = (now) => {
    this.raf = 0;
    if (!this.active)
      return;
    if (!this.demo && !this.enabled())
      return this.stop();
    const el = this.target();
    if (!el)
      return this.finishing ? this.stop() : undefined;
    this.el = el;
    const m = measure(el);
    if (this.shown > m.total)
      this.shown = m.total;
    const backlog = m.total - this.shown;
    if (backlog <= 0) {
      this.paint(m);
      if (this.finishing)
        this.stop();
      return;
    }
    if (!this.last) {
      this.last = now;
      this.raf = requestAnimationFrame(this.tick);
      return;
    }
    const dt = Math.min(0.1, (now - this.last) / 1000);
    this.last = now;
    const cps = Math.max(5, this.h.get().cps);
    let rate = cps;
    const excess = backlog - cps * MAX_BEHIND_S;
    if (excess > 0)
      rate = cps + excess / CATCH_UP_S;
    if (this.finishing && !this.demo)
      rate = Math.max(rate, backlog / Math.max(0.05, (this.finishBy - now) / 1000));
    const before = Math.floor(this.shown);
    this.shown = Math.min(m.total, this.shown + rate * dt);
    const after = Math.floor(this.shown);
    if (after > before)
      this.keys(m, after, now);
    this.paint(m);
    this.raf = requestAnimationFrame(this.tick);
  };
  keys(m, at, now) {
    if (at < this.nextKeyAt || now - this.lastKey < KEY_GAP_MS)
      return;
    this.nextKeyAt = at + 2 + Math.floor(Math.random() * 3);
    this.lastKey = now;
    let i = 0;
    let off = at - 1;
    while (i < m.nodes.length && off >= m.lens[i]) {
      off -= m.lens[i];
      i++;
    }
    const ch = m.nodes[i]?.data[off] ?? "";
    try {
      this.h.key(/\s/.test(ch));
    } catch {}
  }
}

// src/choices.ts
var CHOICES_CSS = `
.lf-choices { display: flex; flex-wrap: wrap; gap: 8px; padding: 10px 14px 12px; }
.lf-choice { position: relative; display: inline-flex; align-items: center; gap: 6px; max-width: 100%;
  padding: 7px 14px; border-radius: 999px; cursor: pointer; font: inherit; font-size: calc(13px * var(--lumiverse-font-scale, 1));
  color: var(--lumiverse-text); text-align: left; line-height: 1.35;
  background: color-mix(in srgb, var(--lf-c, var(--lumiverse-primary)) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--lf-c, var(--lumiverse-primary)) 45%, transparent);
  box-shadow: 0 0 0 0 transparent;
  opacity: 0; transform: translateY(6px);
  animation: lf-choice-in .45s cubic-bezier(.2,.9,.3,1.2) forwards;
  transition: background .2s ease, box-shadow .25s ease, transform .15s ease; }
.lf-choice:nth-child(2) { animation-delay: .08s; }
.lf-choice:nth-child(3) { animation-delay: .16s; }
.lf-choice:nth-child(4) { animation-delay: .24s; }
.lf-choice::before { content: '✦'; font-size: .85em; color: var(--lf-c, var(--lumiverse-primary)); }
.lf-choice:hover { background: color-mix(in srgb, var(--lf-c, var(--lumiverse-primary)) 22%, transparent);
  box-shadow: 0 0 calc(var(--lf-room, 14px) * .8) color-mix(in srgb, var(--lf-c, var(--lumiverse-primary)) 45%, transparent); }
.lf-choice:active { transform: scale(.97); }
.lf-choice:focus-visible { outline: 1.5px solid var(--lumiverse-primary-050); outline-offset: 2px; }
.lf-choices.lf-used .lf-choice:not(.lf-picked) { opacity: .35 !important; }
.lf-choice.lf-picked { background: color-mix(in srgb, var(--lf-c, var(--lumiverse-primary)) 30%, transparent); }
@keyframes lf-choice-in { to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) { .lf-choice { animation: none; opacity: 1; transform: none; } }
`;
function setComposer(text) {
  const ta = document.querySelector('[data-component="InputArea"] textarea');
  if (!ta)
    return false;
  const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set;
  setter ? setter.call(ta, text) : ta.value = text;
  ta.dispatchEvent(new Event("input", { bubbles: true }));
  ta.focus();
  ta.setSelectionRange(text.length, text.length);
  return true;
}
function clickSend() {
  const btn = document.querySelector('[data-component="InputArea"] button[class*="sendBtn"]:not([disabled])');
  if (!btn)
    return false;
  btn.click();
  return true;
}
var MAX_OPTIONS = 4;
var TAG_RE = /<flair-choice\b[^>]*>([\s\S]*?)<\/flair-choice>/gi;
var cleanOption = (text) => text.replace(/<[^>]*>/g, "").trim().slice(0, 160);
var sameOptions = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
function choicesIn(content) {
  const out = [];
  for (const m of content.matchAll(TAG_RE)) {
    const clean = cleanOption(m[1] ?? "");
    if (clean && !out.includes(clean))
      out.push(clean);
    if (out.length >= MAX_OPTIONS)
      break;
  }
  return out;
}

class ChoiceManager {
  ctx;
  pending = new Map;
  rendered = null;
  onPick = null;
  enabled = true;
  sendOnPick = false;
  constructor(ctx) {
    this.ctx = ctx;
  }
  add(messageId, text) {
    const clean = cleanOption(text);
    if (!clean)
      return;
    const entry = this.pending.get(messageId) ?? { options: [], fixed: false };
    if (entry.fixed)
      return;
    if (!entry.options.includes(clean) && entry.options.length < MAX_OPTIONS)
      entry.options.push(clean);
    this.pending.set(messageId, entry);
    queueMicrotask(() => setTimeout(() => this.renderFor(messageId), 30));
  }
  swiped(messageId, content) {
    if (!this.enabled)
      return;
    this.pending.set(messageId, { options: choicesIn(content), fixed: true });
    this.renderFor(messageId);
  }
  renderFor(messageId) {
    if (!this.enabled)
      return;
    const shown = this.rendered?.messageId === messageId ? this.rendered : null;
    if (this.ctx.messages.getLatestMessageId() !== messageId) {
      if (shown)
        this.hide();
      return;
    }
    const options = this.pending.get(messageId)?.options ?? [];
    if (!options.length) {
      if (shown)
        this.hide();
      return;
    }
    if (shown && shown.el.isConnected && sameOptions(shown.options, options))
      return;
    const el = this.ctx.dom.findMessageElement(messageId);
    if (!el)
      return;
    const isCard = el.matches(':is([data-component="BubbleMessage"],[data-component="MinimalMessage"])');
    this.hide();
    const html = `<div class="lf-choices" role="group" aria-label="Suggested replies">${options.map((o, i) => `<button type="button" class="lf-choice" data-lf-choice="${i}"></button>`).join("")}</div>`;
    const wrap = this.ctx.dom.inject(el, html, isCard ? "afterend" : "beforeend");
    wrap.querySelectorAll(".lf-choice").forEach((btn, i) => {
      btn.textContent = options[i];
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const box = wrap.querySelector(".lf-choices");
        box?.classList.add("lf-used");
        btn.classList.add("lf-picked");
        setComposer(options[i]);
        if (this.sendOnPick)
          setTimeout(() => clickSend(), 60);
        this.onPick?.(options[i]);
      });
    });
    this.rendered = { messageId, el: wrap, options: [...options] };
  }
  pause() {
    this.hide();
    for (const entry of this.pending.values())
      entry.fixed = false;
  }
  hide() {
    const r = this.rendered;
    if (!r)
      return;
    this.rendered = null;
    this.ctx.dom.uninject(r.el);
    r.el.replaceChildren();
    r.el.hidden = true;
  }
  clear() {
    this.hide();
    this.pending.clear();
  }
}

// src/moments.ts
var PIN_TEXT_MAX = 420;
var PIN_MEMORY_MAX = 160;
var PINS_PER_CHAT = 120;
var CHATS = 60;
var clampStr = (v, max) => typeof v === "string" ? v.slice(0, max) : "";
function excerpt(text, max = PIN_TEXT_MAX) {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max)
    return t;
  const cut = t.slice(0, max);
  const sp = cut.lastIndexOf(" ");
  return `${(sp > max * 0.6 ? cut.slice(0, sp) : cut).replace(/[\s,;:.\-–—]+$/, "")}…`;
}
function pinOf(raw) {
  if (!raw || typeof raw !== "object")
    return null;
  const r = raw;
  const id = clampStr(r.id, 200);
  const text = excerpt(clampStr(r.text, PIN_TEXT_MAX * 2));
  if (!id || !text)
    return null;
  const color = clampStr(r.color, 40);
  return {
    id,
    i: typeof r.i === "number" && Number.isFinite(r.i) ? Math.max(0, Math.round(r.i)) : 0,
    text,
    whole: r.whole === true,
    who: clampStr(r.who, 80),
    user: r.user === true,
    color: color || null,
    t: typeof r.t === "number" && Number.isFinite(r.t) ? r.t : 0
  };
}
function normalizePins(raw) {
  const out = {};
  if (!raw || typeof raw !== "object")
    return out;
  for (const [chat, list] of Object.entries(raw)) {
    if (!chat || !Array.isArray(list))
      continue;
    const pins = [];
    for (const item of list) {
      const p = pinOf(item);
      if (p && !pins.some((x) => x.id === p.id))
        pins.push(p);
    }
    if (pins.length)
      out[chat] = sortPins(pins).slice(-PINS_PER_CHAT);
  }
  return trimChats(out);
}
var sortPins = (list) => [...list].sort((a, b) => a.i - b.i || a.t - b.t);
function trimChats(data) {
  const chats = Object.keys(data);
  if (chats.length <= CHATS)
    return data;
  const next = { ...data };
  chats.sort((a, b) => Math.max(...next[a].map((p) => p.t)) - Math.max(...next[b].map((p) => p.t))).slice(0, chats.length - CHATS).forEach((c) => delete next[c]);
  return next;
}
var isPinned = (data, chatId, id) => !!chatId && !!data[chatId]?.some((p) => p.id === id);
function setPin(data, chatId, pin) {
  const list = (data[chatId] ?? []).filter((p) => p.id !== pin.id);
  list.push(pin);
  return trimChats({ ...data, [chatId]: sortPins(list).slice(-PINS_PER_CHAT) });
}
function removePins(data, chatId, ids) {
  let changed = false;
  const next = {};
  for (const [chat, list] of Object.entries(data)) {
    if (chatId && chat !== chatId) {
      next[chat] = list;
      continue;
    }
    const kept = list.filter((p) => !ids.has(p.id));
    if (kept.length !== list.length)
      changed = true;
    if (kept.length)
      next[chat] = kept;
  }
  return changed ? next : data;
}
function starPoints(cx, cy, r) {
  const pts = [];
  for (let k = 0;k < 10; k++) {
    const a = -Math.PI / 2 + k * Math.PI / 5;
    const rad = k % 2 ? r * 0.46 : r;
    pts.push(`${(cx + Math.cos(a) * rad).toFixed(2)},${(cy + Math.sin(a) * rad).toFixed(2)}`);
  }
  return pts.join(" ");
}
var STAR_SVG = '<svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"><polygon points="12,2.8 14.9,8.9 21.5,9.7 16.6,14.3 17.9,20.9 12,17.6 6.1,20.9 7.4,14.3 2.5,9.7 9.1,8.9"/></svg>';
var PIN_CSS = `
.lf-pin-btn svg { fill: none; transition: fill .15s ease, color .15s ease, transform .15s ease; }
.lf-pin-btn[data-on="1"] { color: #f2b84b; }
.lf-pin-btn[data-on="1"] svg { fill: currentColor; }
.lf-pin-btn:active svg { transform: scale(.85); }
.lf-pin-list { display: flex; flex-direction: column; gap: 8px; }
.lf-pin { display: flex; flex-direction: column; gap: 6px; padding: 10px 12px; border-radius: var(--lumiverse-radius, 8px);
  background: var(--lumiverse-fill); border: 1px solid var(--lumiverse-border); border-left: 3px solid var(--lf-pin-c, #f2b84b); }
.lf-pin-head { display: flex; align-items: center; gap: 8px; min-width: 0; }
.lf-pin-head > svg { flex: none; width: 13px; height: 13px; fill: #f2b84b; stroke: #f2b84b; stroke-width: 2; stroke-linejoin: round; }
.lf-pin-who { flex: 1; min-width: 0; font-weight: 600; color: var(--lumiverse-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  font-size: calc(13px * var(--lumiverse-font-scale, 1)); }
.lf-pin-n { flex: none; color: var(--lumiverse-text-dim); font-variant-numeric: tabular-nums; font-size: calc(11px * var(--lumiverse-font-scale, 1)); }
.lf-pin-text { margin: 0; color: var(--lumiverse-text-muted); line-height: 1.45; font-size: calc(13px * var(--lumiverse-font-scale, 1));
  display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden; overflow-wrap: anywhere; }
.lf-pin-text[data-whole="1"] { font-style: italic; }
.lf-pin-acts { display: flex; gap: 6px; justify-content: flex-end; }
.lf-pin-acts .lf-btn { flex: 0 0 auto; padding: 5px 10px; font-size: calc(12px * var(--lumiverse-font-scale, 1)); }
.lf-pin-empty { padding: 12px; text-align: center; border-radius: var(--lumiverse-radius, 8px); border: 1px dashed var(--lumiverse-border);
  color: var(--lumiverse-text-dim); font-size: calc(12px * var(--lumiverse-font-scale, 1)); }
.lf-beat-star { fill: #f2b84b; stroke: var(--lumiverse-bg, #000); stroke-width: 1; stroke-linejoin: round; cursor: pointer; transition: transform .15s ease;
  transform-box: fill-box; transform-origin: center; }
.lf-beat-star:hover { transform: scale(1.25); }
`;

// src/heartbeat.ts
var MAX_POINTS = 240;
var MAX_CHATS = 60;
var MOOD_VALENCE = [
  [/(ecsta|elat|joy|happ|delight|excit|laugh|love|playful|cheer|smile|warm|tender|hope)/, 0.75],
  [/(calm|content|relax|peace|cozy|serene|fond|amus|smirk|flirt|blush)/, 0.4],
  [/(curious|thinking|surpris|neutral|focus|serious|confus)/, 0],
  [/(worr|nervous|anxious|tense|uneasy|embarrass|lonely|wistful|melanchol)/, -0.35],
  [/(sad|cry|grief|hurt|despair|scared|fear|terrif|dread|horror)/, -0.7],
  [/(angry|anger|furious|rage|annoy|hate|disgust|bitter)/, -0.75]
];
var POS = /\b(smile[sd]?|smiling|laugh(s|ed|ing)?|grin(s|ned)?|happ(y|ily)|joy|warm(ly)?|gentle|soft(ly)?|love[sd]?|kiss(es|ed)?|hug(s|ged)?|delight(ed)?|thank(s|ful)?|beautiful|wonderful|glad|relie(f|ved)|cheer(s|ful)?|chuckle[sd]?|giggle[sd]?|tender|safe|bright)\b/gi;
var NEG = /\b(cr(y|ies|ied)|tears?|sob(s|bed)?|scream(s|ed)?|angr(y|ily)|fur(y|ious)|rage|hate[sd]?|blood|pain(ful)?|hurt(s)?|fear|afraid|terrif(ied|ying)|dread|dark(ness)?|cold(ly)?|grim|bitter|sneer(s|ed)?|glare[sd]?|tremble[sd]?|shak(es|ing)|wound(ed)?|dead|death|kill(s|ed)?|alone|lonely|sorrow|grief|panic)\b/gi;
function valenceForLabel(label) {
  if (!label)
    return null;
  const l = label.toLowerCase();
  for (const [re, v] of MOOD_VALENCE)
    if (re.test(l))
      return v;
  return null;
}
function valenceForText(text) {
  if (!text)
    return 0;
  const plain = text.replace(/<[^>]*>/g, " ");
  const pos = plain.match(POS)?.length ?? 0;
  const neg = plain.match(NEG)?.length ?? 0;
  if (!pos && !neg)
    return 0;
  return Math.max(-1, Math.min(1, (pos - neg) / Math.max(3, pos + neg)));
}
function addPoint(data, chatId, p) {
  const list = (data[chatId] ?? []).filter((x) => x.id !== p.id);
  list.push(p);
  list.sort((a, b) => a.i - b.i);
  const next = { ...data, [chatId]: list.slice(-MAX_POINTS) };
  const chats = Object.keys(next);
  if (chats.length > MAX_CHATS) {
    chats.sort((a, b) => (next[a].at(-1)?.t ?? 0) - (next[b].at(-1)?.t ?? 0)).slice(0, chats.length - MAX_CHATS).forEach((c) => delete next[c]);
  }
  return next;
}
var NS = "http://www.w3.org/2000/svg";
function beatFor(points, pin) {
  const exact = points.findIndex((p) => p.id === pin.id);
  if (exact >= 0)
    return exact;
  let best = 0;
  let gap = Infinity;
  points.forEach((p, k) => {
    const d = Math.abs(p.i - pin.i);
    if (d < gap) {
      gap = d;
      best = k;
    }
  });
  return best;
}
function renderHeartbeat(host, points, onPick, pins = [], onPickPin) {
  host.textContent = "";
  if (points.length < 2) {
    const p = document.createElement("p");
    p.className = "lf-hint";
    p.style.margin = "0";
    p.textContent = points.length ? "One beat so far — the arc appears after the next reply." : "No beats yet in this chat. Every AI reply adds a point to the emotional arc.";
    host.appendChild(p);
    return;
  }
  const W = 460;
  const H = 140;
  const pad = 10;
  const n = points.length;
  const x = (k) => pad + k / (n - 1) * (W - pad * 2);
  const y = (v) => H / 2 - v * (H / 2 - pad);
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.setAttribute("class", "lf-beat");
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", "Emotional arc of this chat");
  const mid = document.createElementNS(NS, "line");
  mid.setAttribute("x1", String(pad));
  mid.setAttribute("x2", String(W - pad));
  mid.setAttribute("y1", String(H / 2));
  mid.setAttribute("y2", String(H / 2));
  mid.setAttribute("class", "lf-beat-mid");
  svg.appendChild(mid);
  const pts = points.map((p, k) => [x(k), y(p.v)]);
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let k = 0;k < pts.length - 1; k++) {
    const p0 = pts[k - 1] ?? pts[k];
    const p1 = pts[k];
    const p2 = pts[k + 1];
    const p3 = pts[k + 2] ?? p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${p2[0]},${p2[1]}`;
  }
  const area = document.createElementNS(NS, "path");
  area.setAttribute("d", `${d} L${pts.at(-1)[0]},${H / 2} L${pts[0][0]},${H / 2} Z`);
  area.setAttribute("class", "lf-beat-area");
  svg.appendChild(area);
  const line = document.createElementNS(NS, "path");
  line.setAttribute("d", d);
  line.setAttribute("class", "lf-beat-line");
  svg.appendChild(line);
  points.forEach((p, k) => {
    const c = document.createElementNS(NS, "circle");
    c.setAttribute("cx", String(x(k)));
    c.setAttribute("cy", String(y(p.v)));
    c.setAttribute("r", n > 80 ? "2.5" : "4");
    c.setAttribute("class", "lf-beat-dot");
    if (p.color)
      c.setAttribute("style", `fill:${p.color}`);
    const title = document.createElementNS(NS, "title");
    title.textContent = `#${p.i + 1}${p.label ? ` · ${p.label}` : ""}`;
    c.appendChild(title);
    c.addEventListener("click", () => onPick(p));
    svg.appendChild(c);
  });
  const stacked = new Map;
  const R = n > 80 ? 5 : 7;
  for (const pin of pins) {
    const k = beatFor(points, pin);
    const level = stacked.get(k) ?? 0;
    stacked.set(k, level + 1);
    const star = document.createElementNS(NS, "polygon");
    star.setAttribute("points", starPoints(x(k), y(points[k].v) - level * (R * 2 + 1), R));
    star.setAttribute("class", "lf-beat-star");
    const title = document.createElementNS(NS, "title");
    title.textContent = `★ ${pin.who ? pin.who + ": " : ""}${pin.text.slice(0, 90)}`;
    star.appendChild(title);
    star.addEventListener("click", () => onPickPin?.(pin));
    svg.appendChild(star);
  }
  host.appendChild(svg);
}
var HEARTBEAT_CSS = `
.lf-beat { width: 100%; height: auto; display: block; overflow: visible; }
.lf-beat-mid { stroke: var(--lumiverse-border); stroke-dasharray: 3 4; }
.lf-beat-line { fill: none; stroke: var(--lf-c, var(--lumiverse-primary)); stroke-width: 2; filter: drop-shadow(0 0 4px color-mix(in srgb, var(--lf-c, var(--lumiverse-primary)) 60%, transparent)); }
.lf-beat-area { fill: color-mix(in srgb, var(--lf-c, var(--lumiverse-primary)) 12%, transparent); }
.lf-beat-dot { fill: var(--lf-c, var(--lumiverse-primary)); stroke: var(--lumiverse-bg, #000); stroke-width: 1.5; cursor: pointer; transition: r .15s ease; }
.lf-beat-dot:hover { r: 6; }
.lf-beat-legend { display: flex; justify-content: space-between; font-size: calc(11px * var(--lumiverse-font-scale, 1)); color: var(--lumiverse-text-dim); }
`;

// src/achievements.ts
var ACHIEVEMENTS = [
  { id: "first_spark", icon: "✨", title: "First Spark", desc: "Send your first message with Lumi Flair." },
  { id: "storyteller_100", icon: "\uD83D\uDCDC", title: "Storyteller", desc: "Send 100 messages." },
  { id: "saga_1000", icon: "\uD83D\uDCDA", title: "Saga Weaver", desc: "Send 1,000 messages." },
  { id: "milestone", icon: "\uD83C\uDF89", title: "Milestone", desc: "Reach a message milestone in a chat." },
  { id: "night_owl", icon: "\uD83E\uDD89", title: "Night Owl", desc: "Chat between midnight and 4 AM." },
  { id: "early_bird", icon: "\uD83C\uDF05", title: "Early Bird", desc: "Chat between 5 and 7 AM." },
  { id: "streak_3", icon: "\uD83D\uDD25", title: "Kindled", desc: "Chat on 3 days in a row." },
  { id: "streak_7", icon: "☄️", title: "Devoted", desc: "Chat on 7 days in a row." },
  { id: "director", icon: "\uD83C\uDFAC", title: "Action!", desc: "The AI directs its first scene." },
  { id: "weather", icon: "\uD83C\uDF26️", title: "Weather Watcher", desc: "Experience 4 different ambient scenes." },
  { id: "moods", icon: "\uD83C\uDFAD", title: "Emotional Range", desc: "See 5 different moods in one chat." },
  { id: "showstopper", icon: "\uD83C\uDF86", title: "Showstopper", desc: "The AI triggers a screen effect." },
  { id: "choices_10", icon: "\uD83E\uDDED", title: "Pathfinder", desc: "Pick 10 suggested choices." },
  { id: "shutterbug", icon: "\uD83D\uDCF8", title: "Shutterbug", desc: "Create a Moment Card." },
  { id: "packrat", icon: "\uD83C\uDFA8", title: "Set Dresser", desc: "Apply a Flair Pack." }
];
function normalizeAchievements(raw) {
  const r = raw && typeof raw === "object" ? raw : {};
  return {
    unlocked: r.unlocked && typeof r.unlocked === "object" ? { ...r.unlocked } : {},
    sent: typeof r.sent === "number" ? r.sent : 0,
    choices: typeof r.choices === "number" ? r.choices : 0,
    scenes: Array.isArray(r.scenes) ? r.scenes.slice(0, 20) : [],
    lastDay: typeof r.lastDay === "string" ? r.lastDay : "",
    streak: typeof r.streak === "number" ? r.streak : 0,
    moodsByChat: r.moodsByChat && typeof r.moodsByChat === "object" ? { ...r.moodsByChat } : {}
  };
}
function dayKey(d) {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}
function onSent(data, now = new Date) {
  const earned = ["first_spark"];
  data.sent += 1;
  if (data.sent >= 100)
    earned.push("storyteller_100");
  if (data.sent >= 1000)
    earned.push("saga_1000");
  const h = now.getHours();
  if (h < 4)
    earned.push("night_owl");
  if (h >= 5 && h < 7)
    earned.push("early_bird");
  const today = dayKey(now);
  if (data.lastDay !== today) {
    const y = new Date(now);
    y.setDate(y.getDate() - 1);
    data.streak = data.lastDay === dayKey(y) ? data.streak + 1 : 1;
    data.lastDay = today;
  }
  if (data.streak >= 3)
    earned.push("streak_3");
  if (data.streak >= 7)
    earned.push("streak_7");
  return earned;
}
function onScene(data, scene) {
  if (scene && scene !== "off" && !data.scenes.includes(scene))
    data.scenes.push(scene);
  return data.scenes.length >= 4 ? ["weather"] : [];
}
function onMood(data, chatId, label) {
  if (!label)
    return [];
  const list = data.moodsByChat[chatId] ?? [];
  if (!list.includes(label))
    list.push(label);
  data.moodsByChat[chatId] = list.slice(-12);
  const chats = Object.keys(data.moodsByChat);
  if (chats.length > 40)
    delete data.moodsByChat[chats[0]];
  return list.length >= 5 ? ["moods"] : [];
}
var ACHIEVEMENT_CSS = `
/* Below the notch / status bar on a phone: the host's own toasts use the same variable. Safe-area insets are
   physical pixels, and this sits in the UI-scale zoom layer, so they are divided by the scale (like the host's viewport sizes). */
.lf-unlock { position: fixed; z-index: 2147483001; pointer-events: none;
  top: calc(18px + var(--app-interactive-safe-top, env(safe-area-inset-top, 0px)) / var(--lumiverse-ui-scale, 1) + var(--lf-slot, 0) * 84px);
  right: calc(18px + env(safe-area-inset-right, 0px) / var(--lumiverse-ui-scale, 1));
  display: flex; align-items: center; gap: 12px; padding: 12px 16px 12px 12px; min-width: 240px; max-width: min(340px, calc(var(--app-scaled-viewport-width, 100vw) - 36px));
  border-radius: 14px; color: var(--lumiverse-text, #fff);
  background: color-mix(in srgb, var(--lumiverse-bg-elevated, #231e30) 92%, transparent);
  border: 1px solid color-mix(in srgb, var(--lf-c, #9370db) 55%, transparent);
  box-shadow: 0 10px 30px rgba(0,0,0,.35), 0 0 22px color-mix(in srgb, var(--lf-c, #9370db) 35%, transparent);
  backdrop-filter: blur(10px);
  animation: lf-unlock-in .6s cubic-bezier(.2,1.3,.4,1) both, lf-unlock-out .5s ease 4.2s forwards; }
.lf-unlock .lf-unlock-ico { font-size: 28px; width: 44px; height: 44px; display: grid; place-items: center; border-radius: 12px;
  background: color-mix(in srgb, var(--lf-c, #9370db) 18%, transparent); box-shadow: inset 0 0 12px color-mix(in srgb, var(--lf-c, #9370db) 30%, transparent); }
.lf-unlock small { display: block; font-size: 10px; letter-spacing: .1em; text-transform: uppercase; color: var(--lf-c, #9370db); font-weight: 700; }
.lf-unlock b { display: block; font-size: 14px; }
.lf-unlock span.lf-unlock-desc { display: block; font-size: 12px; color: var(--lumiverse-text-muted, #bbb); }
@keyframes lf-unlock-in { from { opacity: 0; transform: translateX(30px) scale(.95); } to { opacity: 1; transform: none; } }
@keyframes lf-unlock-out { to { opacity: 0; transform: translateY(-10px); } }

.lf-badges { display: grid; grid-template-columns: repeat(auto-fill, minmax(118px, 1fr)); gap: 8px; }
.lf-badge-card { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 10px 8px; border-radius: 10px; text-align: center;
  background: var(--lumiverse-fill); border: 1px solid var(--lumiverse-border); font-size: calc(11px * var(--lumiverse-font-scale, 1)); color: var(--lumiverse-text-dim); }
.lf-badge-card .lf-badge-ico { font-size: 22px; filter: grayscale(1) opacity(.35); }
.lf-badge-card b { font-size: calc(12px * var(--lumiverse-font-scale, 1)); color: var(--lumiverse-text-muted); }
.lf-badge-card.lf-got { border-color: color-mix(in srgb, var(--lf-c, #9370db) 45%, transparent);
  box-shadow: inset 0 0 14px color-mix(in srgb, var(--lf-c, #9370db) 14%, transparent); }
.lf-badge-card.lf-got .lf-badge-ico { filter: none; }
.lf-badge-card.lf-got b { color: var(--lumiverse-text); }
`;

// src/modal.ts
function keepOpenWhileDragging(root) {
  let pressedInside = false;
  const down = (e) => {
    pressedInside = root.contains(e.target);
  };
  const click = (e) => {
    if (!pressedInside)
      return;
    pressedInside = false;
    if (!root.contains(e.target))
      e.stopPropagation();
  };
  window.addEventListener("pointerdown", down, true);
  window.addEventListener("click", click, true);
  return () => {
    window.removeEventListener("pointerdown", down, true);
    window.removeEventListener("click", click, true);
  };
}

// src/momentcard.ts
var W2 = 1600;
var H2 = 1000;
var CORNER = 40;
var MARGIN = { x: 96, top: 80, bottom: 136 };
var IMAGE_W = W2 + MARGIN.x * 2;
var IMAGE_H = H2 + MARGIN.top + MARGIN.bottom;
var images = new Map;
function loadImage(src) {
  let p = images.get(src);
  if (!p) {
    p = new Promise((resolve) => {
      const img = new Image;
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    });
    images.set(src, p);
    if (images.size > 8)
      images.delete(images.keys().next().value);
  }
  return p;
}
function plainText(raw) {
  return raw.replace(/<flair[^>]*>[\s\S]*?<\/flair(?:-choice)?>/gi, "").replace(/<br\s*\/?>/gi, `
`).replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/[*_~`#]+/g, "").replace(/[ \t]+\n/g, `
`).replace(/\n{3,}/g, `

`).trim();
}
function wrapLines(g, text, maxW, maxLines) {
  const out = [];
  let cut = false;
  const paras = text.split(`
`);
  outer:
    for (let p = 0;p < paras.length; p++) {
      const words = paras[p].split(/\s+/).filter(Boolean);
      let line = "";
      for (const w of words) {
        const test = line ? `${line} ${w}` : w;
        if (g.measureText(test).width > maxW && line) {
          out.push(line);
          line = w;
          if (out.length >= maxLines) {
            cut = true;
            break outer;
          }
        } else
          line = test;
      }
      if (out.length >= maxLines) {
        cut = !!line || p < paras.length - 1;
        break;
      }
      out.push(line);
      if (out.length >= maxLines && p < paras.length - 1) {
        cut = paras.slice(p + 1).some((x) => x.trim());
        break;
      }
    }
  if (cut && out.length) {
    let last = out[out.length - 1];
    while (last && g.measureText(`${last}…`).width > maxW)
      last = last.slice(0, -1);
    out[out.length - 1] = `${last.trimEnd()}…`;
  }
  return { lines: out, cut };
}
function roundRect(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}
var SERIF = 'Georgia, "Times New Roman", serif';
var SANS = 'system-ui, -apple-system, "Segoe UI", sans-serif';
async function renderMomentCard(m) {
  const card = await drawCard(m);
  const out = document.createElement("canvas");
  out.width = IMAGE_W;
  out.height = IMAGE_H;
  const g = out.getContext("2d");
  const { x, top: y } = MARGIN;
  for (const [blur, dy, alpha] of [[90, 34, 0.5], [24, 8, 0.32]]) {
    g.save();
    g.shadowColor = `rgba(0,0,0,${alpha})`;
    g.shadowBlur = blur;
    g.shadowOffsetY = dy;
    roundRect(g, x, y, W2, H2, CORNER);
    g.fillStyle = "#000";
    g.fill();
    g.restore();
  }
  g.save();
  roundRect(g, x, y, W2, H2, CORNER);
  g.clip();
  g.drawImage(card.canvas, x, y);
  g.restore();
  roundRect(g, x + 1.5, y + 1.5, W2 - 3, H2 - 3, CORNER - 1.5);
  g.lineWidth = 3;
  const edge = g.createLinearGradient(x, y, x + W2, y + H2);
  edge.addColorStop(0, m.color);
  edge.addColorStop(0.5, "rgba(255,255,255,0.18)");
  edge.addColorStop(1, m.color);
  g.strokeStyle = edge;
  g.stroke();
  return { canvas: out, cut: card.cut };
}
async function drawCard(m) {
  const c = document.createElement("canvas");
  c.width = W2;
  c.height = H2;
  const g = c.getContext("2d");
  const avatar = m.avatarSrc ? await loadImage(m.avatarSrc) : null;
  const portrait = (m.portraitSrc ? await loadImage(m.portraitSrc) : null) ?? avatar;
  const bg = g.createLinearGradient(0, 0, W2, H2);
  bg.addColorStop(0, "#0c0a14");
  bg.addColorStop(1, "#171126");
  g.fillStyle = bg;
  g.fillRect(0, 0, W2, H2);
  if (avatar) {
    g.save();
    g.globalAlpha = 0.32;
    g.filter = "blur(56px) saturate(1.3)";
    const s = Math.max(W2 / avatar.width, H2 / avatar.height) * 1.2;
    g.drawImage(avatar, (W2 - avatar.width * s) / 2, (H2 - avatar.height * s) / 2, avatar.width * s, avatar.height * s);
    g.restore();
  }
  const glow = (x, y, r, a) => {
    const rg = g.createRadialGradient(x, y, 0, x, y, r);
    rg.addColorStop(0, m.color);
    rg.addColorStop(1, "transparent");
    g.globalAlpha = a;
    g.fillStyle = rg;
    g.fillRect(0, 0, W2, H2);
    g.globalAlpha = 1;
  };
  glow(W2 * 0.12, H2 * 0.2, 640, 0.45);
  glow(W2 * 0.92, H2 * 0.95, 760, 0.32);
  g.fillStyle = "rgba(8,6,14,0.45)";
  g.fillRect(0, 0, W2, H2);
  g.fillStyle = "rgba(20,16,32,0.5)";
  g.fillRect(0, 0, W2, H2);
  const px = 20, py = 20, pw = W2 - 40, ph = H2 - 40;
  const colW = 460;
  const ax = px + colW / 2, ay = py + ph * 0.42, ar = 150;
  g.save();
  g.shadowColor = m.color;
  g.shadowBlur = 50;
  g.beginPath();
  g.arc(ax, ay, ar + 8, 0, Math.PI * 2);
  g.fillStyle = m.color;
  g.fill();
  g.restore();
  g.save();
  g.beginPath();
  g.arc(ax, ay, ar, 0, Math.PI * 2);
  g.clip();
  if (portrait) {
    const s = Math.max(ar * 2 / portrait.width, ar * 2 / portrait.height);
    const dw = portrait.width * s, dh = portrait.height * s;
    g.drawImage(portrait, ax - ar - (dw - ar * 2) / 2, ay - ar - (dh - ar * 2) * 0.25, dw, dh);
  } else {
    g.fillStyle = "#2a2140";
    g.fillRect(ax - ar, ay - ar, ar * 2, ar * 2);
    g.fillStyle = "#fff";
    g.font = `700 130px ${SANS}`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText((m.name[0] ?? "✦").toUpperCase(), ax, ay + 6);
  }
  g.restore();
  g.textAlign = "center";
  g.textBaseline = "alphabetic";
  g.fillStyle = "#fff";
  g.font = `700 54px ${SANS}`;
  g.fillText(m.name, ax, ay + ar + 92, colW - 60);
  g.font = `500 26px ${SANS}`;
  g.fillStyle = "rgba(255,255,255,0.55)";
  g.fillText(m.date.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }), ax, ay + ar + 140, colW - 60);
  const dx = px + colW;
  const dv = g.createLinearGradient(0, py + 80, 0, py + ph - 80);
  dv.addColorStop(0, "transparent");
  dv.addColorStop(0.5, m.color);
  dv.addColorStop(1, "transparent");
  g.globalAlpha = 0.5;
  g.fillStyle = dv;
  g.fillRect(dx, py + 80, 2, ph - 160);
  g.globalAlpha = 1;
  const qx = dx + 90, qw = px + pw - 80 - qx;
  const qTop = py + 120, qBottom = py + ph - 110;
  const body = plainText(m.text) || "…";
  let fit = { lines: [], cut: true };
  let size = 28;
  for (const s of [56, 50, 45, 40, 36, 32, 28]) {
    g.font = `400 ${s}px ${SERIF}`;
    const r = wrapLines(g, body, qw, Math.floor((qBottom - qTop) / (s * 1.45)));
    fit = r;
    size = s;
    if (!r.cut)
      break;
  }
  const lineH = size * 1.45;
  const blockH = fit.lines.length * lineH;
  const y0 = qTop + Math.max(0, (qBottom - qTop - blockH) / 2);
  g.font = `italic 400 140px ${SERIF}`;
  g.fillStyle = m.color;
  g.globalAlpha = 0.5;
  g.textAlign = "left";
  g.fillText("“", qx - 70, y0 + 70);
  g.globalAlpha = 1;
  g.font = `400 ${size}px ${SERIF}`;
  g.fillStyle = "rgba(255,255,255,0.93)";
  fit.lines.forEach((l, k) => g.fillText(l, qx, y0 + k * lineH + size));
  g.textAlign = "right";
  g.font = `600 26px ${SANS}`;
  g.fillStyle = m.color;
  g.fillText("✦ made with Lumi Flair", px + pw - 50, py + ph - 40);
  return { canvas: c, cut: fit.cut };
}
async function showMomentCard(ctx, m, onCreated, start) {
  const whole = plainText(m.text);
  let text = start?.trim() || whole;
  let current = await renderMomentCard({ ...m, text });
  onCreated?.();
  const modal = ctx.ui.showModal({ title: tr("Moment Card"), width: 760, maxHeight: 900 });
  const root = modal.root;
  const unguard = keepOpenWhileDragging(root);
  root.innerHTML = "";
  const wrap = document.createElement("div");
  wrap.className = "lf-moment";
  const img = document.createElement("img");
  img.src = current.canvas.toDataURL("image/png");
  img.alt = `${tr("Moment Card")}: ${m.name}`;
  const label = document.createElement("div");
  label.className = "lf-moment-label";
  label.textContent = tr("Text on the card");
  const slot = document.createElement("div");
  slot.className = "lf-moment-text";
  const note = document.createElement("p");
  note.className = "lf-moment-note";
  let timer;
  let drawn = 0;
  const redraw = (next) => {
    text = next;
    clearTimeout(timer);
    timer = setTimeout(async () => {
      const n = ++drawn;
      const r = await renderMomentCard({ ...m, text: text.trim() || whole });
      if (n !== drawn)
        return;
      current = r;
      img.src = r.canvas.toDataURL("image/png");
      paintNote();
    }, 220);
  };
  const ta = ctx.components.mountTextArea(slot, { value: text, rows: 5, ariaLabel: tr("Text on the card"), onChange: redraw });
  const field = () => slot.querySelector("textarea");
  const paintNote = () => {
    note.textContent = current.cut ? tr("That is more than fits, so the card ends with “…”. Pick a shorter part for the whole of it.") : tr("Select part of the text and press “Use selection”, or edit it. The card follows as you go.");
    note.dataset.cut = current.cut ? "1" : "0";
  };
  paintNote();
  const pick = document.createElement("div");
  pick.className = "lf-btns";
  const btns = document.createElement("div");
  btns.className = "lf-btns";
  const mk = (parent, label, primary, fn) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = primary ? "lf-btn lf-primary" : "lf-btn";
    b.textContent = tr(label);
    b.addEventListener("mousedown", (e) => e.preventDefault());
    b.addEventListener("click", async () => {
      try {
        await fn();
      } catch (err) {
        console.warn("[Lumi Flair] moment card action failed", err);
      }
    });
    parent.appendChild(b);
    return b;
  };
  mk(pick, "Use selection", false, () => {
    const f = field();
    if (!f || f.selectionStart === f.selectionEnd) {
      note.textContent = tr("Select some of the text first, then press “Use selection”.");
      return;
    }
    const part = f.value.slice(f.selectionStart, f.selectionEnd).trim();
    if (!part)
      return;
    ta.update({ value: part });
    redraw(part);
  });
  mk(pick, "Whole message", false, () => {
    ta.update({ value: whole });
    redraw(whole);
  });
  mk(btns, "Download PNG", true, () => {
    const a = document.createElement("a");
    a.href = current.canvas.toDataURL("image/png");
    a.download = `${m.name.replace(/[^\w-]+/g, "_") || "moment"}-lumi-flair.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  });
  const copyBtn = mk(btns, "Copy image", false, async () => {
    const blob = await new Promise((r) => current.canvas.toBlob(r, "image/png"));
    if (!blob || !("ClipboardItem" in window))
      throw new Error("Clipboard image copy not supported");
    await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
    copyBtn.textContent = tr("Copied ✓");
    setTimeout(() => copyBtn.textContent = tr("Copy image"), 1800);
  });
  modal.onDismiss(() => {
    unguard();
    clearTimeout(timer);
    ta.destroy();
  });
  wrap.append(img, label, slot, pick, note, btns);
  root.appendChild(wrap);
}
var MOMENT_CSS = `
.lf-moment { display: flex; flex-direction: column; gap: 10px; padding: 4px 2px 8px; color: var(--lumiverse-text); }
/* The image already has its rounded corners and shadow (it is saved that way), so the preview shows it as it is. */
.lf-moment img { display: block; width: 100%; height: auto; }
.lf-moment-label { margin-top: 4px; font-size: calc(13px * var(--lumiverse-font-scale, 1)); font-weight: 500; color: var(--lumiverse-text-muted); }
.lf-moment-text > * { width: 100%; }
.lf-moment-note { margin: 0; font-size: calc(11px * var(--lumiverse-font-scale, 1)); line-height: 1.45; color: var(--lumiverse-text-dim); }
.lf-moment-note[data-cut="1"] { color: var(--lumiverse-warning, #e2a03f); }
.lf-moment-btn { display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; padding: 0; border: none; border-radius: 6px;
  background: transparent; color: var(--lumiverse-text-dim); cursor: pointer; }
.lf-moment-btn:hover { color: var(--lumiverse-text); background: var(--lumiverse-fill-subtle); }
.lf-moment-btn svg { width: 15px; height: 15px; }
/* In the host's action pill: sit in its row (the host wraps extension buttons in a plain block div), at its size. */
[data-spindle-extension-root]:has(> .lf-moment-btn) { display: contents; }
[data-component="BubbleActions"] .lf-moment-btn { width: 26px; height: 26px; flex: none; }
[data-component="BubbleActions"] .lf-moment-btn svg { width: 13px; height: 13px; }
`;

// src/packs.ts
var PACK_KEYS = [
  "sendEffect",
  "sendIntensity",
  "userEntrance",
  "characterEntrance",
  "hoverStyle",
  "hoverStrength",
  "traceSpeed",
  "streamingAura",
  "colorSource",
  "customColor",
  "userColor",
  "userCustomColor",
  "timeOfDay",
  "ambientScene",
  "ambientDensity",
  "ambientOpacity",
  "lightDefault",
  "cinematic",
  "vignette",
  "grain",
  "swipeTransition"
];
var PACKS = [
  {
    id: "lumi",
    name: "Lumi Classic",
    tagline: "Your theme colours, sparkles and an edge trace.",
    swatch: ["#9370db", "#c7b4ff"],
    settings: {
      sendEffect: "sparkle",
      sendIntensity: 1,
      userEntrance: "pop",
      characterEntrance: "bloom",
      hoverStyle: "trace",
      hoverStrength: 1,
      traceSpeed: 3,
      streamingAura: true,
      colorSource: "theme",
      userColor: "match",
      ambientScene: "off",
      ambientDensity: 1,
      ambientOpacity: 0.6,
      lightDefault: "none",
      cinematic: true,
      vignette: 0.3,
      grain: false,
      swipeTransition: "slide"
    }
  },
  {
    id: "cozy",
    name: "Cozy Fantasy",
    tagline: "Candlelight, fireflies and warm amber glow.",
    swatch: ["#ffb347", "#ff7a3d"],
    settings: {
      sendEffect: "sparkle",
      sendIntensity: 0.9,
      userEntrance: "rise",
      characterEntrance: "bloom",
      hoverStyle: "glow",
      hoverStrength: 1.1,
      streamingAura: true,
      colorSource: "custom",
      customColor: "#ffb347",
      userColor: "warm",
      ambientScene: "fireflies",
      ambientDensity: 0.8,
      ambientOpacity: 0.7,
      lightDefault: "candle",
      cinematic: true,
      vignette: 0.45,
      grain: false,
      swipeTransition: "fade"
    },
    theme: { accent: "#ffb347", secondary: "#ff7a3d", bgDark: "#1d150e", bgLight: "#fbf3e8", speech: "#ffd08a", thoughts: "#e3b48c" }
  },
  {
    id: "cyber",
    name: "Cyberpunk Neon",
    tagline: "Neon edges, comets and a city in the rain.",
    swatch: ["#00e5ff", "#ff2bd6"],
    settings: {
      sendEffect: "comet",
      sendIntensity: 1.2,
      userEntrance: "pop",
      characterEntrance: "bloom",
      hoverStyle: "neon",
      hoverStrength: 1.3,
      traceSpeed: 2,
      streamingAura: true,
      colorSource: "custom",
      customColor: "#00e5ff",
      userColor: "custom",
      userCustomColor: "#ff2bd6",
      ambientScene: "rain",
      ambientDensity: 1.1,
      ambientOpacity: 0.55,
      lightDefault: "neon",
      cinematic: true,
      vignette: 0.4,
      grain: true,
      swipeTransition: "slide"
    },
    theme: { accent: "#00e5ff", secondary: "#ff2bd6", bgDark: "#0b0a1a", bgLight: "#eef3fb", speech: "#5cf2ff", thoughts: "#ff7ae6" }
  },
  {
    id: "horror",
    name: "Horror",
    tagline: "Storm light, film grain and a blood-red pulse.",
    swatch: ["#b3001b", "#3a0a10"],
    settings: {
      sendEffect: "ripple",
      sendIntensity: 0.8,
      userEntrance: "rise",
      characterEntrance: "bloom",
      hoverStyle: "glow",
      hoverStrength: 1.2,
      streamingAura: true,
      colorSource: "custom",
      customColor: "#c0102a",
      userColor: "custom",
      userCustomColor: "#8f8f8f",
      ambientScene: "embers",
      ambientDensity: 0.5,
      ambientOpacity: 0.45,
      lightDefault: "storm",
      cinematic: true,
      vignette: 0.75,
      grain: true,
      swipeTransition: "fade"
    },
    theme: { accent: "#c0102a", secondary: "#5a0b14", bgDark: "#120708", bgLight: "#f4ecec", speech: "#e05561", thoughts: "#a08f8f" }
  },
  {
    id: "sakura",
    name: "Sakura Romance",
    tagline: "Falling petals, dawn light and soft pink glow.",
    swatch: ["#ff8fc8", "#ffd1e8"],
    settings: {
      sendEffect: "confetti",
      sendIntensity: 0.8,
      userEntrance: "pop",
      characterEntrance: "bloom",
      hoverStyle: "glow",
      hoverStrength: 1,
      streamingAura: true,
      colorSource: "custom",
      customColor: "#ff8fc8",
      userColor: "custom",
      userCustomColor: "#ffc2dd",
      ambientScene: "petals",
      ambientDensity: 0.9,
      ambientOpacity: 0.75,
      lightDefault: "dawn",
      cinematic: true,
      vignette: 0.25,
      grain: false,
      swipeTransition: "fade"
    },
    theme: { accent: "#ff8fc8", secondary: "#ffc2dd", bgDark: "#1e1218", bgLight: "#fff1f7", speech: "#ffb3d9", thoughts: "#d9a3c4" }
  },
  {
    id: "space",
    name: "Deep Space",
    tagline: "A starfield, shooting stars and cool indigo light.",
    swatch: ["#7c8cff", "#1b1f4a"],
    settings: {
      sendEffect: "comet",
      sendIntensity: 1,
      userEntrance: "rise",
      characterEntrance: "bloom",
      hoverStyle: "trace",
      hoverStrength: 1,
      traceSpeed: 4,
      streamingAura: true,
      colorSource: "custom",
      customColor: "#7c8cff",
      userColor: "custom",
      userCustomColor: "#9ee7ff",
      ambientScene: "stars",
      ambientDensity: 1.2,
      ambientOpacity: 0.8,
      lightDefault: "night",
      cinematic: true,
      vignette: 0.5,
      grain: false,
      swipeTransition: "slide"
    },
    theme: { accent: "#7c8cff", secondary: "#9ee7ff", bgDark: "#0c0e22", bgLight: "#eef0ff", speech: "#9ee7ff", thoughts: "#b6b0ff" }
  },
  {
    id: "noir",
    name: "Noir",
    tagline: "Rain on the window, grain and silver light.",
    swatch: ["#d9d9d9", "#3b3b3b"],
    settings: {
      sendEffect: "ripple",
      sendIntensity: 0.7,
      userEntrance: "rise",
      characterEntrance: "bloom",
      hoverStyle: "glow",
      hoverStrength: 0.7,
      streamingAura: true,
      colorSource: "custom",
      customColor: "#d9d9d9",
      userColor: "custom",
      userCustomColor: "#9a9a9a",
      ambientScene: "rain",
      ambientDensity: 0.9,
      ambientOpacity: 0.5,
      lightDefault: "storm",
      cinematic: true,
      vignette: 0.65,
      grain: true,
      swipeTransition: "fade"
    },
    theme: { accent: "#d9d9d9", secondary: "#8a8a8a", bgDark: "#111111", bgLight: "#f2f2f2", speech: "#ececec", thoughts: "#a5a5a5" }
  },
  {
    id: "character",
    name: "Character Aware",
    tagline: "Glow and theme follow whoever is speaking, from their aura colours.",
    swatch: ["#9370db", "#ff8fc8"],
    settings: {
      sendEffect: "sparkle",
      sendIntensity: 1,
      userEntrance: "pop",
      characterEntrance: "bloom",
      hoverStyle: "glow",
      hoverStrength: 1.1,
      streamingAura: true,
      colorSource: "character",
      userColor: "match",
      ambientScene: "off",
      ambientDensity: 1,
      ambientOpacity: 0.6,
      lightDefault: "none",
      cinematic: true,
      vignette: 0.3,
      grain: false,
      swipeTransition: "slide"
    },
    theme: "character",
    extra: { auras: true }
  }
];
var customSource = () => [];
var customCache = { from: null, packs: [] };
function bindCustomPacks(get) {
  customSource = get;
  customCache = { from: null, packs: [] };
}
function customPacks() {
  const list = customSource();
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
        custom: p.source
      }))
    };
  }
  return customCache.packs;
}
function allPacks() {
  return [...PACKS, ...customPacks()];
}
function packById(id) {
  if (!id)
    return;
  return PACKS.find((p) => p.id === id) ?? customPacks().find((p) => p.id === id);
}
function capturePack(s) {
  const out = {};
  for (const k of PACK_KEYS)
    out[k] = s[k];
  return out;
}
var HEX = /^#[0-9a-f]{6}$/i;
function sanitizeSettings(src) {
  if (!src || typeof src !== "object")
    return null;
  const raw = src;
  const full = normalize(raw);
  const out = {};
  for (const k of PACK_KEYS)
    if (k in raw)
      out[k] = full[k];
  return Object.keys(out).length ? out : null;
}
function sanitizeTheme(raw) {
  if (raw === "character")
    return "character";
  if (!raw || typeof raw !== "object")
    return;
  const r = raw;
  if (!HEX.test(String(r.accent)) || !HEX.test(String(r.bgDark)) || !HEX.test(String(r.bgLight)))
    return;
  const opt = (v) => typeof v === "string" && HEX.test(v) ? v : undefined;
  return {
    accent: String(r.accent),
    bgDark: String(r.bgDark),
    bgLight: String(r.bgLight),
    secondary: opt(r.secondary),
    speech: opt(r.speech),
    thoughts: opt(r.thoughts)
  };
}
function sanitizePack(raw) {
  if (!raw || typeof raw !== "object")
    return null;
  const r = raw;
  const settings = sanitizeSettings(r.settings);
  if (!settings)
    return null;
  const name = typeof r.name === "string" && r.name.trim() ? r.name.trim().slice(0, 60) : "Imported pack";
  const tagline = typeof r.tagline === "string" ? r.tagline.trim().slice(0, 120) : "";
  const theme = sanitizeTheme(r.theme);
  const sw = Array.isArray(r.swatch) ? r.swatch : [];
  const fallbackA = settings.colorSource === "custom" && settings.customColor ? settings.customColor : theme && theme !== "character" ? theme.accent : "#9370db";
  const fallbackB = settings.userColor === "custom" && settings.userCustomColor ? settings.userCustomColor : theme && theme !== "character" ? theme.secondary ?? theme.bgDark : "#c7b4ff";
  const swatch = [HEX.test(String(sw[0])) ? String(sw[0]) : fallbackA, HEX.test(String(sw[1])) ? String(sw[1]) : fallbackB];
  return { name, tagline, swatch, settings, theme };
}
function packFromLook(name, s, themeFor) {
  const active = packById(s.activePack);
  const settings = capturePack(s);
  const theme = themeFor(s);
  const a = s.colorSource === "custom" ? s.customColor : active?.swatch[0] ?? (theme && theme !== "character" ? theme.accent : "#9370db");
  const b = s.userColor === "custom" ? s.userCustomColor : active?.swatch[1] ?? "#c7b4ff";
  return { name, tagline: active && name === active.name ? active.tagline : "", swatch: [a, b], settings, theme };
}
function exportPack(pack) {
  const blob = new Blob([JSON.stringify({ lumiFlairPack: 2, ...pack }, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${pack.name.replace(/[^\w-]+/g, "_") || "my-pack"}.flair.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1e4);
}
async function importPack(ctx) {
  const files = await ctx.uploads.pickFile({ accept: [".json", "application/json"], maxSizeBytes: 64 * 1024 });
  const f = files[0];
  if (!f)
    return null;
  try {
    return sanitizePack(JSON.parse(new TextDecoder().decode(f.bytes)));
  } catch {
    return null;
  }
}

// src/perf.ts
class PerfGovernor {
  isActive;
  onChange;
  raf = 0;
  frames = 0;
  windowStart = 0;
  low = 0;
  high = 0;
  saver = false;
  relapses = 0;
  recoveredAt = 0;
  fps = 60;
  constructor(isActive, onChange) {
    this.isActive = isActive;
    this.onChange = onChange;
  }
  get saving() {
    return this.saver || document.documentElement.getAttribute("data-rendering-mode") === "efficiency";
  }
  start() {
    if (this.raf)
      return;
    this.windowStart = performance.now();
    this.frames = 0;
    const tick = (now) => {
      if (!this.isActive() || document.hidden) {
        this.raf = 0;
        return;
      }
      this.frames++;
      const dt = now - this.windowStart;
      if (dt >= 2000) {
        this.fps = this.frames * 1000 / dt;
        this.frames = 0;
        this.windowStart = now;
        if (this.fps < 38) {
          this.low++;
          this.high = 0;
        } else if (this.fps > 52) {
          this.high++;
          this.low = 0;
        }
        if (!this.saver && this.low >= 2)
          this.set(true);
        if (this.saver && this.high >= Math.min(64, 4 * 2 ** this.relapses))
          this.set(false);
      }
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }
  set(v) {
    if (v && this.recoveredAt && performance.now() - this.recoveredAt < 60000)
      this.relapses++;
    if (!v)
      this.recoveredAt = performance.now();
    this.saver = v;
    this.low = this.high = 0;
    this.onChange(this.saving);
  }
  reset() {
    this.relapses = 0;
    if (this.saver)
      this.set(false);
  }
  stop() {
    if (this.raf)
      cancelAnimationFrame(this.raf);
    this.raf = 0;
  }
}

// src/welcome.ts
var WELCOME_CSS = `
.lf-welcome { display: flex; flex-direction: column; gap: 14px; padding: 2px 2px 10px; color: var(--lumiverse-text); }
.lf-welcome-hero { position: relative; padding: 18px 16px; border-radius: 14px; overflow: hidden; text-align: center;
  background: radial-gradient(ellipse at 20% 0%, color-mix(in srgb, var(--lf-c, var(--lumiverse-primary)) 35%, transparent), transparent 60%),
              radial-gradient(ellipse at 90% 100%, color-mix(in srgb, var(--lf-c, var(--lumiverse-primary)) 25%, transparent), transparent 60%),
              var(--lumiverse-fill-subtle);
  border: 1px solid color-mix(in srgb, var(--lf-c, var(--lumiverse-primary)) 35%, transparent); }
.lf-welcome-hero h2 { margin: 0 0 4px; font-size: calc(20px * var(--lumiverse-font-scale, 1)); }
.lf-welcome-hero p { margin: 0; color: var(--lumiverse-text-muted); font-size: calc(13px * var(--lumiverse-font-scale, 1)); line-height: 1.45; }
.lf-welcome h3 { margin: 4px 0 0; font-size: calc(11px * var(--lumiverse-font-scale, 1)); letter-spacing: .08em; text-transform: uppercase; color: var(--lumiverse-text-dim); }
.lf-packs { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 8px; }
.lf-pack { display: flex; flex-direction: column; gap: 6px; padding: 10px; border-radius: 12px; cursor: pointer; text-align: left; font: inherit;
  color: var(--lumiverse-text); background: var(--lumiverse-fill); border: 1px solid var(--lumiverse-border);
  transition: border-color .2s ease, box-shadow .25s ease, transform .15s ease; }
.lf-pack:hover { transform: translateY(-1px); border-color: var(--lumiverse-border-hover); }
.lf-pack.lf-on { border-color: var(--lf-c, var(--lumiverse-primary)); box-shadow: 0 0 14px color-mix(in srgb, var(--lf-c, var(--lumiverse-primary)) 35%, transparent); }
.lf-pack-sw { height: 34px; border-radius: 8px; }
.lf-pack b { font-size: calc(13px * var(--lumiverse-font-scale, 1)); }
.lf-pack span { font-size: calc(11px * var(--lumiverse-font-scale, 1)); color: var(--lumiverse-text-dim); line-height: 1.35; }
.lf-perm { display: flex; align-items: center; gap: 12px; padding: 10px 12px; border-radius: 10px; background: var(--lumiverse-fill); }
.lf-perm div { flex: 1; font-size: calc(12px * var(--lumiverse-font-scale, 1)); color: var(--lumiverse-text-muted); line-height: 1.4; }
.lf-perm div b { display: block; color: var(--lumiverse-text); font-size: calc(13px * var(--lumiverse-font-scale, 1)); }
.lf-perm .lf-btn { flex: 0 0 auto; }
`;
function showWelcome(ctx, a) {
  const modal = ctx.ui.showModal({ title: tr("Welcome to Lumi Flair"), width: 560, maxHeight: 760 });
  const root = modal.root;
  const unguard = keepOpenWhileDragging(root);
  modal.onDismiss(() => {
    unguard();
    a.done();
  });
  root.innerHTML = "";
  const w = document.createElement("div");
  w.className = "lf-welcome";
  const hero = document.createElement("div");
  hero.className = "lf-welcome-hero";
  const h2 = document.createElement("h2");
  h2.textContent = "✦ Lumi Flair";
  const p = document.createElement("p");
  p.textContent = tr("The story controls the room: glow, weather, light and sound that react to your chat. Pick a look to start — you can change everything later in the Flair tab.");
  hero.append(h2, p);
  w.appendChild(hero);
  const h3a = document.createElement("h3");
  h3a.textContent = tr("Choose a Flair Pack");
  w.appendChild(h3a);
  const grid = document.createElement("div");
  grid.className = "lf-packs";
  const paint = () => grid.querySelectorAll(".lf-pack").forEach((el) => el.classList.toggle("lf-on", el.dataset.pack === a.activePack()));
  for (const pack of allPacks()) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "lf-pack";
    b.dataset.pack = pack.id;
    const sw = document.createElement("div");
    sw.className = "lf-pack-sw";
    sw.style.background = `linear-gradient(135deg, ${pack.swatch[0]}, ${pack.swatch[1]})`;
    const name = document.createElement("b");
    name.textContent = tr(pack.name);
    const tag = document.createElement("span");
    tag.textContent = tr(pack.tagline);
    b.append(sw, name, tag);
    b.addEventListener("click", () => {
      a.applyPack(pack.id);
      paint();
    });
    grid.appendChild(b);
  }
  w.appendChild(grid);
  paint();
  const h3b = document.createElement("h3");
  h3b.textContent = tr("Optional extras");
  w.appendChild(h3b);
  const perm = (title, body, has, ask, label) => {
    const row = document.createElement("div");
    row.className = "lf-perm";
    const text = document.createElement("div");
    const b = document.createElement("b");
    b.textContent = title;
    text.append(b, document.createTextNode(body));
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "lf-btn lf-primary";
    const sync = () => {
      btn.textContent = has() ? `${tr("Enabled")} ✓` : label;
      btn.disabled = has();
    };
    sync();
    btn.addEventListener("click", async () => {
      await ask();
      sync();
    });
    row.append(text, btn);
    w.appendChild(row);
  };
  perm(tr("AI storytelling"), tr("Lets Flair add a short note to each prompt so the AI uses text effects, directs scenes and offers choices. (interceptor permission)"), a.hasInject, a.requestInject, tr("Allow"));
  perm(tr("Match Lumiverse to your pack"), tr("Restyles Lumiverse’s accent, backgrounds and dialogue colours to fit the pack — or the speaking character with Character Aware. Your saved theme is never changed. (app_manipulation permission)"), a.themeOn, a.enableTheme, tr("Turn on"));
  perm(tr("Mood-tinted interface"), tr("Re-tints Lumiverse’s accent to the character’s mood, then restores your theme. (app_manipulation permission)"), a.hasTint, a.requestTint, tr("Allow"));
  perm(tr("Sound & soundscapes"), tr("Soft chimes plus rain, fire, wind and night ambience generated live — no audio files."), a.soundOn, a.enableSound, tr("Turn on"));
  const go = document.createElement("div");
  go.className = "lf-btns";
  const start = document.createElement("button");
  start.type = "button";
  start.className = "lf-btn lf-primary";
  start.textContent = tr("Start chatting ✦");
  start.addEventListener("click", () => modal.dismiss());
  go.appendChild(start);
  w.appendChild(go);
  root.appendChild(w);
  return modal;
}

// src/panel.ts
var ICON2 = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9z"/><path d="M19 15l.8 1.9 1.9.8-1.9.8L19 20.4l-.8-1.9-1.9-.8 1.9-.8z"/><path d="M5 16l.6 1.4 1.4.6-1.4.6L5 20l-.6-1.4L3 18l1.4-.6z"/></svg>`;
var FS = (px) => `calc(${px}px * var(--lumiverse-font-scale, 1))`;
var PANEL_CSS = `
.lf-panel { display: flex; flex-direction: column; gap: 10px; padding: 12px; color: var(--lumiverse-text); font-size: ${FS(13)}; }

/* Collapsible sections (native <details>, styled like Lumiverse editor sections) */
.lf-sec { border-radius: var(--lumiverse-radius-lg, 12px); background: var(--lumiverse-fill-subtle); border: 1px solid var(--lumiverse-border); }
.lf-sec > summary { list-style: none; display: flex; align-items: center; gap: 10px; padding: 12px 14px; cursor: pointer; user-select: none;
  font-size: ${FS(13)}; font-weight: 600; color: var(--lumiverse-text); }
.lf-sec > summary::-webkit-details-marker { display: none; }
.lf-sec > summary .lf-sec-ico { display: flex; align-items: center; justify-content: center; width: var(--lumiverse-btn-icon-sm, 28px);
  height: var(--lumiverse-btn-icon-sm, 28px); border-radius: 6px; background: var(--lumiverse-primary-010); color: var(--lumiverse-primary); flex-shrink: 0; }
.lf-sec > summary .lf-sec-ico svg { width: 15px; height: 15px; }
.lf-sec > summary .lf-sec-title { flex: 1; }
.lf-sec > summary .lf-badge { font-size: ${FS(11)}; font-weight: 500; color: var(--lumiverse-text-dim); }
.lf-sec > summary .lf-chev { display: flex; color: var(--lumiverse-text-dim); transition: transform var(--lumiverse-transition-fast, 150ms ease); }
.lf-sec > summary .lf-chev svg { width: 14px; height: 14px; }
.lf-sec[open] > summary .lf-chev { transform: rotate(90deg); }
.lf-sec[open] > summary { border-bottom: 1px solid var(--lumiverse-border); }
.lf-body { display: flex; flex-direction: column; gap: 12px; padding: 12px 14px 14px; }

/* Label + control rows */
.lf-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 36px; }
.lf-row > .lf-label { flex: 1 1 auto; min-width: 0; font-size: ${FS(13)}; font-weight: 500; color: var(--lumiverse-text-muted); }
.lf-row > .lf-ctl { flex: 0 0 55%; min-width: 0; }
/* Only stretch controls that are meant to fill (selects). Switches and
   colour pickers keep their intrinsic size — stretching the host switch
   collapses its track and leaves just the white knob visible. */
.lf-row > .lf-ctl.lf-fill > * { width: 100%; }
.lf-row > .lf-ctl.lf-fit { flex: 0 0 auto; display: flex; align-items: center; justify-content: flex-end; }
.lf-row.lf-toggle { cursor: pointer; }
.lf-row.lf-toggle:hover > .lf-label { color: var(--lumiverse-text); }
.lf-stack { display: flex; flex-direction: column; gap: 6px; }
.lf-stack > .lf-label { font-size: ${FS(13)}; font-weight: 500; color: var(--lumiverse-text-muted); }

.lf-hint { margin: -6px 0 0; color: var(--lumiverse-text-dim); font-size: ${FS(11)}; line-height: 1.45; }
.lf-hint code { font-family: var(--lumiverse-font-mono, monospace); font-size: .95em; padding: 1px 5px; border-radius: 4px;
  background: var(--lumiverse-fill); color: var(--lumiverse-text-muted); }
.lf-status { display: flex; align-items: center; gap: 8px; padding: 8px 10px; border-radius: var(--lumiverse-radius, 8px);
  background: var(--lumiverse-fill); color: var(--lumiverse-text-muted); font-size: ${FS(12)}; }
.lf-status b { color: var(--lumiverse-text); font-weight: 600; }
.lf-color { appearance: none; -webkit-appearance: none; display: block; width: 44px; height: 28px; padding: 0; margin: 0;
  border: 1px solid var(--lumiverse-border); border-radius: var(--lumiverse-radius, 8px); background: none; cursor: pointer; }
.lf-color::-webkit-color-swatch-wrapper { padding: 3px; }
.lf-color::-webkit-color-swatch { border: none; border-radius: 5px; }
.lf-color::-moz-color-swatch { border: none; border-radius: 5px; }

/* Buttons — same recipe as Lumiverse's shared Button (secondary / primary). */
.lf-btns { display: flex; gap: 8px; flex-wrap: wrap; }
.lf-theme-status { gap: 6px; }
.lf-pack-wrap { position: relative; display: flex; }
.lf-pack-wrap > .lf-pack { flex: 1; min-width: 0; }
.lf-pack-tag { position: absolute; top: 14px; left: 14px; padding: 1px 6px; border-radius: 6px; font-style: normal; pointer-events: none;
  font-size: calc(9.5px * var(--lumiverse-font-scale, 1)); letter-spacing: .06em; text-transform: uppercase; color: #fff; background: rgba(0,0,0,.45); }
.lf-pack-del { position: absolute; top: 12px; right: 12px; width: 22px; height: 22px; border-radius: 50%; border: 0; cursor: pointer; font: inherit; line-height: 1;
  font-size: 15px; color: #fff; background: rgba(0,0,0,.5); opacity: 0; transition: opacity .15s ease, background .15s ease; }
.lf-pack-wrap:hover .lf-pack-del, .lf-pack-del:focus-visible { opacity: 1; }
.lf-pack-del:hover { background: var(--lumiverse-danger, #e5484d); }
@media (hover: none) { .lf-pack-del { opacity: .85; } }
.lf-save-form { display: flex; flex-direction: column; gap: 10px; color: var(--lumiverse-text); }
.lf-save-form label { display: flex; flex-direction: column; gap: 6px; font-size: calc(12px * var(--lumiverse-font-scale, 1)); color: var(--lumiverse-text-muted); }
.lf-input { font: inherit; font-size: calc(14px * var(--lumiverse-font-scale, 1)); padding: 8px 10px; border-radius: var(--lumiverse-radius, 8px);
  color: var(--lumiverse-text); background: var(--lumiverse-fill); border: 1px solid var(--lumiverse-border); outline: none; }
.lf-input:focus { border-color: var(--lf-c, var(--lumiverse-primary)); }
.lf-theme-dot { width: 10px; height: 10px; border-radius: 50%; flex: 0 0 auto; background: var(--lumiverse-primary); box-shadow: 0 0 8px currentColor; }
.lf-save { flex-direction: column; align-items: flex-start; gap: 2px; }
.lf-save b { font-weight: 600; }
.lf-save span { font-size: calc(11px * var(--lumiverse-font-scale, 1)); color: var(--lumiverse-text-dim); }
.lf-save[data-state="error"] b { color: var(--lumiverse-danger, #e5484d); }
.lf-btn { flex: 1 1 auto; display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  padding: 8px 14px; border-radius: var(--lumiverse-radius, 8px); border: 1px solid var(--lumiverse-border);
  background: transparent; color: var(--lumiverse-text-muted); font-family: inherit; font-size: ${FS(13)}; font-weight: 500;
  cursor: pointer; white-space: nowrap;
  transition: background var(--lumiverse-transition-fast, 150ms ease), color var(--lumiverse-transition-fast, 150ms ease),
    border-color var(--lumiverse-transition-fast, 150ms ease), transform 80ms ease; }
.lf-btn:hover { background: var(--lumiverse-fill-subtle); color: var(--lumiverse-text); }
.lf-btn:active { transform: scale(.98); }
.lf-btn:focus-visible { outline: 1.5px solid var(--lumiverse-primary-050); outline-offset: 2px; }
.lf-btn:disabled { opacity: .4; cursor: not-allowed; }
.lf-btn svg { width: 14px; height: 14px; flex-shrink: 0; }
.lf-btn.lf-primary { background: var(--lumiverse-primary); border-color: var(--lumiverse-primary); color: var(--lumiverse-primary-contrast, #fff); }
.lf-btn.lf-primary:hover { background: var(--lumiverse-primary-hover); color: var(--lumiverse-primary-contrast, #fff); }
.lf-btn.lf-ghost { border-color: transparent; color: var(--lumiverse-text-dim); }
.lf-btn.lf-ghost:hover { color: var(--lumiverse-text); }

.lf-swatch { display: inline-block; width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0;
  background: var(--lf-c, var(--lumiverse-primary)); box-shadow: 0 0 10px var(--lf-c, var(--lumiverse-primary)); }
.lf-aura-row { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
.lf-aura-dot { display: inline-block; width: 14px; height: 14px; border-radius: 50%; }
.lf-beat-host { padding: 6px 2px 0; }
.lf-tw-demo { padding: 10px 12px; border-radius: var(--lumiverse-radius, 8px); background: var(--lumiverse-fill); color: var(--lumiverse-text); font-size: calc(14px * var(--lumiverse-font-scale, 1)); line-height: 1.6; }
.lf-fx-head { display: flex; align-items: baseline; justify-content: space-between; margin-top: 4px; }
.lf-fx-count { font-size: calc(11px * var(--lumiverse-font-scale, 1)); color: var(--lumiverse-text-dim); font-variant-numeric: tabular-nums; }
.lf-fx-pick { display: grid; grid-template-columns: repeat(auto-fill, minmax(104px, 1fr)); gap: 6px; }
.lf-fx-chip { display: flex; align-items: center; justify-content: space-between; gap: 6px; min-height: 38px; padding: 6px 10px; cursor: pointer; font: inherit;
  color: var(--lumiverse-text); background: var(--lumiverse-fill); border: 1px solid color-mix(in srgb, var(--lf-c, var(--lumiverse-primary)) 45%, var(--lumiverse-border));
  border-radius: var(--lumiverse-radius, 8px); transition: opacity .2s ease, border-color .2s ease, background .2s ease; overflow: hidden; }
.lf-fx-chip:hover { border-color: var(--lf-c, var(--lumiverse-primary)); }
.lf-fx-chip:focus-visible { outline: 2px solid var(--lf-c, var(--lumiverse-primary)); outline-offset: 1px; }
.lf-fx-chip > span { font-size: calc(13px * var(--lumiverse-font-scale, 1)); white-space: nowrap; }
.lf-fx-chip small { font-size: calc(10px * var(--lumiverse-font-scale, 1)); letter-spacing: .06em; text-transform: uppercase; color: var(--lf-c, var(--lumiverse-primary)); }
.lf-fx-chip.lf-off { opacity: .5; border-style: dashed; border-color: var(--lumiverse-border); background: transparent; }
.lf-fx-chip.lf-off small { color: var(--lumiverse-text-dim); }
.lf-fx-chip.lf-off > span { animation-play-state: paused !important; text-decoration: line-through; text-decoration-color: var(--lumiverse-text-dim); }
.lf-fx-pick.lf-master-off { opacity: .55; }
/* Your sounds */
.lf-snd-list { display: flex; flex-direction: column; gap: 8px; }
.lf-snd { display: flex; flex-direction: column; gap: 6px; padding: 8px 10px 4px; border-radius: var(--lumiverse-radius, 8px);
  background: var(--lumiverse-fill); border: 1px solid var(--lumiverse-border); }
.lf-snd-head { display: flex; align-items: center; gap: 10px; min-width: 0; }
.lf-snd-play, .lf-snd-del { flex: none; width: 30px; height: 30px; border-radius: 50%; border: 1px solid var(--lumiverse-border); padding: 0;
  display: flex; align-items: center; justify-content: center; cursor: pointer; background: transparent; color: var(--lumiverse-text-muted);
  transition: background var(--lumiverse-transition-fast, 150ms ease), color var(--lumiverse-transition-fast, 150ms ease); }
.lf-snd-play svg { width: 12px; height: 12px; }
.lf-snd-del svg { width: 14px; height: 14px; }
.lf-snd-play:hover { background: var(--lumiverse-primary); border-color: var(--lumiverse-primary); color: var(--lumiverse-primary-contrast, #fff); }
.lf-snd-play[data-on="1"] { background: var(--lumiverse-primary); border-color: var(--lumiverse-primary); color: var(--lumiverse-primary-contrast, #fff); }
.lf-snd-del { border-color: transparent; color: var(--lumiverse-text-dim); }
.lf-snd-del:hover { color: var(--lumiverse-danger, #e5484d); background: var(--lumiverse-fill-subtle); }
.lf-snd-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px; }
.lf-snd-info b { font-size: ${FS(13)}; font-weight: 600; color: var(--lumiverse-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.lf-snd-info span { font-size: ${FS(11)}; color: var(--lumiverse-text-dim); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.lf-snd-empty { padding: 10px; text-align: center; border-radius: var(--lumiverse-radius, 8px); border: 1px dashed var(--lumiverse-border);
  color: var(--lumiverse-text-dim); font-size: ${FS(12)}; }
.lf-snd-sub { margin-top: 4px; font-size: ${FS(12)}; font-weight: 600; color: var(--lumiverse-text-muted); letter-spacing: .02em; }
.lf-snd-assigned { display: flex; flex-direction: column; gap: 4px; }
.lf-snd-pair { display: flex; align-items: center; gap: 8px; padding: 4px 4px 4px 10px; border-radius: var(--lumiverse-radius, 8px);
  background: var(--lumiverse-fill); font-size: ${FS(12)}; color: var(--lumiverse-text-muted); min-width: 0; }
.lf-snd-pair > span { flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.lf-snd-pair b { color: var(--lumiverse-text); font-weight: 600; }
.lf-snd-pair[data-missing="1"] b { color: var(--lumiverse-text-dim); font-weight: 500; font-style: italic; }
.lf-snd-pair .lf-snd-del { width: 26px; height: 26px; }
.lf-snd-msg[data-kind="error"] { color: var(--lumiverse-danger, #e5484d); }
.lf-fx-demo { display: flex; flex-wrap: wrap; gap: 6px 14px; padding: 10px 12px; border-radius: var(--lumiverse-radius, 8px); background: var(--lumiverse-fill); }
`;
var svg2 = (body, fill = false) => `<svg viewBox="0 0 24 24" ${fill ? 'fill="currentColor"' : 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"'}>${body}</svg>`;
var I = {
  play: svg2('<path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.4-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z"/>', true),
  spark: svg2('<path d="M12 3l1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9z"/>'),
  reset: svg2('<path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/>'),
  sliders: svg2('<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>'),
  user: svg2('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'),
  send: svg2('<path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4z"/>'),
  glow: svg2('<rect x="4" y="5" width="16" height="14" rx="3"/><path d="M2 9V7M22 9V7M2 17v-2M22 17v-2"/>'),
  palette: svg2('<path d="M12 22a10 10 0 1 1 10-10c0 2.5-2 3-3.5 3H16a2 2 0 0 0-1.5 3.3A2 2 0 0 1 13 22z"/><circle cx="7.5" cy="10.5" r="1"/><circle cx="12" cy="7" r="1"/><circle cx="16.5" cy="10.5" r="1"/>'),
  cloud: svg2('<path d="M17.5 19a4.5 4.5 0 1 0-1.4-8.8A6 6 0 1 0 6 17h11.5z"/>'),
  text: svg2('<path d="M4 7V5h16v2M9 19h6M12 5v14"/>'),
  party: svg2('<path d="M3 21l5-14 9 9z"/><path d="M14 3l1 2M19 6l2-1M17 10l3 1M11 5l.5-2"/>'),
  sound: svg2('<path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/>'),
  music: svg2('<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>'),
  upload: svg2('<path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/><path d="M7 9l5-5 5 5M12 4v12"/>'),
  stop: svg2('<rect x="6" y="6" width="12" height="12" rx="2"/>', true),
  trash: svg2('<path d="M4 7h16M10 11v6M14 11v6M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/>'),
  share: svg2('<path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7"/><path d="M16 6l-4-4-4 4M12 2v13"/>'),
  copy: svg2('<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>'),
  chev: svg2('<path d="m9 6 6 6-6 6"/>'),
  film: svg2('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 4v16M17 4v16M3 9h4M3 15h4M17 9h4M17 15h4"/>'),
  heart: svg2('<path d="M3 12h4l2-5 4 10 2-5h6"/>'),
  trophy: svg2('<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/>'),
  camera: svg2('<path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="3.5"/>'),
  star: svg2('<polygon points="12,2.8 14.9,8.9 21.5,9.7 16.6,14.3 17.9,20.9 12,17.6 6.1,20.9 7.4,14.3 2.5,9.7 9.1,8.9"/>')
};
var SLOT_LABEL = {
  always: { label: "Always play (replaces scene sounds)", group: "Ambience" },
  "scene:snow": { label: "Snow", group: "Ambience" },
  "scene:rain": { label: "Rain", group: "Ambience" },
  "scene:embers": { label: "Embers", group: "Ambience" },
  "scene:fireflies": { label: "Fireflies", group: "Ambience" },
  "scene:petals": { label: "Petals", group: "Ambience" },
  "scene:stars": { label: "Starfield", group: "Ambience" },
  "light:dawn": { label: "Dawn", group: "Lighting" },
  "light:day": { label: "Daylight", group: "Lighting" },
  "light:dusk": { label: "Dusk / golden hour", group: "Lighting" },
  "light:night": { label: "Night", group: "Lighting" },
  "light:candle": { label: "Candlelight", group: "Lighting" },
  "light:storm": { label: "Storm", group: "Lighting" },
  "light:neon": { label: "Neon city", group: "Lighting" },
  "ui:send": { label: "Message sent", group: "Interface" },
  "ui:receive": { label: "Reply received", group: "Interface" },
  "ui:fanfare": { label: "Milestone celebration", group: "Interface" },
  "ui:achievement": { label: "Achievement unlocked", group: "Interface" },
  "ui:sparkle": { label: "Screen effect / keyword", group: "Interface" },
  "ui:key": { label: "Typewriter key", group: "Interface" },
  ...Object.fromEntries(SFX_CUES.map((c) => [`sfx:${c.name}`, { label: c.label, group: "Sound effects" }]))
};
var fmtDuration = (sec) => {
  const s = Math.max(0, Math.round(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};
var fmtSize = (b) => b >= 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`;
var SCENE_LABEL = {
  off: "Off",
  snow: "Snow",
  rain: "Rain",
  embers: "Embers",
  fireflies: "Fireflies",
  petals: "Petals",
  stars: "Starfield"
};
var LIGHT_LABEL = {
  none: "None",
  dawn: "Dawn",
  day: "Daylight",
  dusk: "Dusk / golden hour",
  night: "Night",
  candle: "Candlelight",
  storm: "Storm",
  neon: "Neon city"
};
var OPEN_KEY = "lumi_flair:open-sections";
function readOpen() {
  try {
    return JSON.parse(localStorage.getItem(OPEN_KEY) || "{}");
  } catch {
    return {};
  }
}
function writeOpen(map) {
  try {
    localStorage.setItem(OPEN_KEY, JSON.stringify(map));
  } catch {}
}
function mountPanel(ctx, store, actions) {
  const tab = ctx.ui.registerDrawerTab({
    id: "flair",
    title: "Lumi Flair",
    shortName: "Flair",
    headerTitle: "Flair",
    description: "Send effects, mood glow, ambient scenes, text effects and more",
    keywords: ["animation", "glow", "effects", "theme", "hover", "particles", "mood", "ambient", "weather", "sound"],
    iconSvg: ICON2
  });
  const handles = [];
  const syncers = [];
  const statusSyncers = [];
  const s0 = store.get();
  const openMap = readOpen();
  const panel = document.createElement("div");
  panel.className = "lf-panel";
  function section(id, title, icon, defaultOpen = false) {
    const d = document.createElement("details");
    d.className = "lf-sec";
    d.open = openMap[id] ?? defaultOpen;
    const sum = document.createElement("summary");
    sum.innerHTML = `<span class="lf-sec-ico">${icon}</span><span class="lf-sec-title"></span><span class="lf-badge"></span><span class="lf-chev">${I.chev}</span>`;
    sum.querySelector(".lf-sec-title").textContent = tr(title);
    const body = document.createElement("div");
    body.className = "lf-body";
    d.append(sum, body);
    d.addEventListener("toggle", () => {
      openMap[id] = d.open;
      writeOpen(openMap);
    });
    panel.appendChild(d);
    return { body, badge: sum.querySelector(".lf-badge") };
  }
  function row(parent, label, fit = "fill") {
    const r = document.createElement("div");
    r.className = "lf-row";
    const l = document.createElement("span");
    l.className = "lf-label";
    l.textContent = tr(label);
    const c = document.createElement("div");
    c.className = `lf-ctl lf-${fit}`;
    r.append(l, c);
    parent.appendChild(r);
    return c;
  }
  function hint(parent, html) {
    const p = document.createElement("p");
    p.className = "lf-hint";
    p.innerHTML = tr(html);
    parent.appendChild(p);
    return p;
  }
  function status(parent, render) {
    const el = document.createElement("div");
    el.className = "lf-status";
    parent.appendChild(el);
    const fn = (st) => render(st, el);
    statusSyncers.push(fn);
    fn(actions.status());
    return el;
  }
  function select(parent, label, key, options) {
    const slot = row(parent, label, "fill");
    const h = ctx.components.mountSelect(slot, {
      value: String(s0[key]),
      options: options.map((o) => ({ ...o, label: tr(o.label), sublabel: o.sublabel ? tr(o.sublabel) : undefined })),
      ariaLabel: tr(label),
      onChange: (v) => store.update({ [key]: v })
    });
    handles.push(h);
    syncers.push((s) => {
      if (h.getValue() !== String(s[key]))
        h.update({ value: String(s[key]) });
    });
  }
  function toggle(parent, label, key, before) {
    const slot = row(parent, label, "fit");
    const rowEl = slot.parentElement;
    rowEl.classList.add("lf-toggle");
    const set = async (next) => {
      if (before && !await before(next)) {
        h.update({ checked: Boolean(store.get()[key]) });
        return;
      }
      store.update({ [key]: next });
    };
    const h = ctx.components.mountSwitch(slot, {
      checked: Boolean(s0[key]),
      size: "md",
      ariaLabel: tr(label),
      onChange: (on) => void set(on)
    });
    rowEl.addEventListener("click", (e) => {
      if (slot.contains(e.target))
        return;
      set(!store.get()[key]);
    });
    handles.push(h);
    syncers.push((s) => {
      if (h.getValue() !== Boolean(s[key]))
        h.update({ checked: Boolean(s[key]) });
    });
  }
  function slider(parent, label, key, min, max, step, format) {
    const slot = document.createElement("div");
    parent.appendChild(slot);
    const scale = format.scale ?? 1;
    const h = ctx.components.mountRangeSlider(slot, {
      label: tr(label),
      min: min * scale,
      max: max * scale,
      step: step * scale,
      value: Number(s0[key]) * scale,
      format: { suffix: format.suffix, decimals: format.decimals ?? (step < 1 ? 2 : 1) },
      onCommit: (v) => store.update({ [key]: v / scale })
    });
    handles.push(h);
    syncers.push((s) => {
      const want = Number(s[key]) * scale;
      if (Math.abs(h.getValue() - want) > 0.000001)
        h.update({ value: want });
    });
  }
  function textarea(parent, label, key, rows, placeholder) {
    const wrap = document.createElement("div");
    wrap.className = "lf-stack";
    const l = document.createElement("span");
    l.className = "lf-label";
    l.textContent = tr(label);
    const slot = document.createElement("div");
    wrap.append(l, slot);
    parent.appendChild(wrap);
    let timer;
    let typing = false;
    const h = ctx.components.mountTextArea(slot, {
      value: String(s0[key]),
      rows,
      placeholder,
      ariaLabel: label,
      onChange: (v) => {
        typing = true;
        if (timer)
          clearTimeout(timer);
        timer = setTimeout(() => {
          typing = false;
          store.update({ [key]: v });
        }, 400);
      }
    });
    handles.push(h);
    syncers.push((s) => {
      if (!typing && h.getValue() !== String(s[key]))
        h.update({ value: String(s[key]) });
    });
  }
  function color(parent, label, key) {
    const slot = row(parent, label, "fit");
    const input = document.createElement("input");
    input.type = "color";
    input.className = "lf-color";
    input.value = String(s0[key]);
    input.setAttribute("aria-label", label);
    input.addEventListener("input", () => store.update({ [key]: input.value }));
    slot.appendChild(input);
    syncers.push((s) => {
      if (input.value !== s[key])
        input.value = String(s[key]);
    });
    return slot.parentElement;
  }
  function buttons(parent) {
    const wrap = document.createElement("div");
    wrap.className = "lf-btns";
    parent.appendChild(wrap);
    return wrap;
  }
  function button(parent, text, onClick, variant = "secondary", iconSvg) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = variant === "secondary" ? "lf-btn" : `lf-btn lf-${variant}`;
    if (iconSvg)
      b.innerHTML = iconSvg;
    const label = document.createElement("span");
    label.textContent = tr(text);
    b.append(label);
    b.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      try {
        await onClick();
      } catch (err) {
        console.error("[Lumi Flair] button action failed", err);
      }
    });
    parent.appendChild(b);
    return { el: b, setText: (t) => label.textContent = tr(t) };
  }
  const sceneOptions = SCENES.map((s) => ({ value: s, label: SCENE_LABEL[s] }));
  const general = section("general", "General", I.sliders, true);
  toggle(general.body, "Enable Lumi Flair", "enabled");
  toggle(general.body, "Respect “reduce motion”", "respectReducedMotion");
  hint(general.body, "When your OS asks for reduced motion, glows stay but particles, scenes and movement are skipped.");
  toggle(general.body, "Spotlight mode", "spotlight");
  hint(general.body, "While you hover the chat, every message except the one under your cursor dims. Also in the input bar’s Extras menu.");
  toggle(general.body, "No flashing", "noFlash");
  hint(general.body, "Replaces lightning flashes with a slow glow, stops flickering text and disables camera shake. Recommended for light-sensitive viewers.");
  toggle(general.body, "Battery saver when needed", "perfGovernor");
  const saverHint = hint(general.body, "");
  statusSyncers.push((st) => {
    saverHint.innerHTML = st.saver ? tr("<b>Battery saver is on</b> — the frame rate dipped, so particles are halved and grain and light rays are paused.") : tr("Watches the frame rate and lightens particles, grain and light rays if your device struggles.");
  });
  toggle(general.body, "Tap to glow (touch screens)", "tapGlow");
  const saveEl = document.createElement("div");
  saveEl.className = "lf-status lf-save";
  general.body.appendChild(saveEl);
  const ago = (t) => {
    if (!t)
      return tr("not saved yet");
    const s = Math.round((Date.now() - t) / 1000);
    if (s < 10)
      return tr("just now");
    if (s < 60)
      return `${s}s ${tr("ago")}`;
    if (s < 3600)
      return `${Math.round(s / 60)}m ${tr("ago")}`;
    return new Date(t).toLocaleString();
  };
  const mark = (st) => st === "ok" ? "✓" : st === "unknown" ? "…" : "✕";
  const renderSave = (v) => {
    const ok = Object.values(v.layers).some((x) => x === "ok");
    saveEl.dataset.state = v.saving ? "saving" : ok ? "ok" : "error";
    saveEl.innerHTML = "";
    const head = document.createElement("b");
    head.textContent = v.saving ? tr("Saving…") : ok ? `✓ ${tr("Auto-saved")} · ${ago(v.lastSavedAt)}` : tr("Not saved — check the console");
    const detail = document.createElement("span");
    detail.textContent = `${tr("Account")} ${mark(v.layers.account)} · ${tr("Config file")} ${mark(v.layers.file)} · ${tr("This browser")} ${mark(v.layers.browser)}`;
    saveEl.append(head, detail);
  };
  renderSave(actions.vaultStatus());
  const unsubVault = actions.onVaultStatus(renderSave);
  const agoTimer = setInterval(() => renderSave(actions.vaultStatus()), 15000);
  hint(general.body, "Every change saves itself to your Lumiverse account and to a config file on the server (<code>data/users/&lt;you&gt;/extensions/lumi_flair/settings.json</code>), which survives reinstalling Flair. The newest copy is used when Lumiverse starts.");
  const backupBtns = buttons(general.body);
  button(backupBtns, "Back up settings", () => actions.backupSettings(), "secondary", I.share);
  const restoreBtn = button(backupBtns, "Restore from file", async () => {
    const ok = await actions.restoreSettings();
    restoreBtn.setText(ok ? "Restored ✓" : "Not a Flair backup");
    setTimeout(() => restoreBtn.setText("Restore from file"), 2500);
  }, "ghost");
  const packsSec = section("packs", "Flair Packs", I.palette, true);
  const packGrid = document.createElement("div");
  packGrid.className = "lf-packs";
  let gridKey = "";
  const renderGrid = () => {
    const list = allPacks();
    const key = list.map((p) => `${p.id}:${p.name}:${p.swatch.join(",")}`).join("|");
    if (key === gridKey)
      return;
    gridKey = key;
    packGrid.textContent = "";
    for (const pk of list) {
      const wrap = document.createElement("div");
      wrap.className = "lf-pack-wrap";
      const b = document.createElement("button");
      b.type = "button";
      b.className = "lf-pack";
      b.dataset.pack = pk.id;
      const sw = document.createElement("div");
      sw.className = "lf-pack-sw";
      sw.style.background = `linear-gradient(135deg, ${pk.swatch[0]}, ${pk.swatch[1]})`;
      const nm = document.createElement("b");
      nm.textContent = pk.custom ? pk.name : tr(pk.name);
      const tg = document.createElement("span");
      tg.textContent = pk.custom ? pk.tagline || tr(pk.custom === "imported" ? "Imported pack" : "Saved from your look") : tr(pk.tagline);
      b.append(sw, nm, tg);
      b.addEventListener("click", () => actions.applyPack(pk.id));
      wrap.appendChild(b);
      if (pk.custom) {
        const tag = document.createElement("em");
        tag.className = "lf-pack-tag";
        tag.textContent = tr(pk.custom === "imported" ? "Imported" : "Yours");
        const del = document.createElement("button");
        del.type = "button";
        del.className = "lf-pack-del";
        del.title = tr("Remove pack");
        del.setAttribute("aria-label", `${tr("Remove pack")}: ${pk.name}`);
        del.textContent = "×";
        del.addEventListener("click", async (e) => {
          e.stopPropagation();
          const res = await ctx.ui.showConfirm({
            title: tr("Remove pack?"),
            message: `“${pk.name}” ${tr("will be removed from your packs. Your current look stays as it is.")}`,
            variant: "warning",
            confirmLabel: tr("Remove")
          });
          if (res.confirmed)
            actions.deletePack(pk.id);
        });
        wrap.append(tag, del);
      }
      packGrid.appendChild(wrap);
    }
    syncPacks(store.get());
    lastAuraSync?.();
  };
  let lastAuraSync = null;
  packsSec.body.appendChild(packGrid);
  const syncPacks = (st) => {
    packGrid.querySelectorAll(".lf-pack").forEach((el) => el.classList.toggle("lf-on", el.dataset.pack === st.activePack));
    const active = packById(st.activePack);
    packsSec.badge.textContent = active ? active.custom ? active.name : tr(active.name) : "";
  };
  syncers.push(() => renderGrid());
  renderGrid();
  syncers.push(syncPacks);
  syncPacks(s0);
  const auraSwatch = (st) => {
    const sw = packGrid.querySelector('.lf-pack[data-pack="character"] .lf-pack-sw');
    if (!sw)
      return;
    const cols = st.auraColors.slice(0, 4);
    if (cols.length >= 2)
      sw.style.background = `linear-gradient(135deg, ${cols.join(", ")})`;
    else if (cols.length === 1)
      sw.style.background = `linear-gradient(135deg, ${cols[0]}, color-mix(in oklab, ${cols[0]} 45%, #fff))`;
  };
  statusSyncers.push(auraSwatch);
  lastAuraSync = () => auraSwatch(actions.status());
  hint(packsSec.body, "A pack sets effects, glow, colours, scene and lighting in one click. Tweak anything afterwards. Packs never turn sound on.");
  const themeSlot = row(packsSec.body, "Lumiverse theme", "fill");
  const themeSel = ctx.components.mountSelect(themeSlot, {
    value: s0.uiTheme,
    options: [
      { value: "off", label: tr("Keep my theme"), sublabel: tr("Flair only styles its own effects") },
      { value: "pack", label: tr("Match the Flair Pack"), sublabel: tr("Accent, backgrounds and dialogue colours follow the pack") },
      { value: "character", label: tr("Character aware"), sublabel: tr("Follows the aura colour of whoever is speaking") }
    ],
    ariaLabel: tr("Lumiverse theme"),
    onChange: async (v) => {
      if (v !== "off" && !actions.status().tintPermission && !await actions.requestTintPermission()) {
        themeSel.update({ value: store.get().uiTheme });
        return;
      }
      store.update({ uiTheme: v });
    }
  });
  handles.push(themeSel);
  syncers.push((st) => {
    if (themeSel.getValue() !== st.uiTheme)
      themeSel.update({ value: st.uiTheme });
  });
  const depthRow = row(packsSec.body, "Theme strength", "fill").parentElement;
  const depthSel = ctx.components.mountSelect(depthRow.querySelector(".lf-ctl"), {
    value: s0.uiThemeDepth,
    options: [
      { value: "full", label: tr("Accent + backgrounds"), sublabel: tr("The whole interface takes on the mood") },
      { value: "accent", label: tr("Accent colours only"), sublabel: tr("Buttons, highlights and dialogue; your backgrounds stay") }
    ],
    ariaLabel: tr("Theme strength"),
    onChange: (v) => store.update({ uiThemeDepth: v })
  });
  handles.push(depthSel);
  syncers.push((st) => {
    if (depthSel.getValue() !== st.uiThemeDepth)
      depthSel.update({ value: st.uiThemeDepth });
    depthRow.style.display = st.uiTheme === "off" ? "none" : "";
  });
  depthRow.style.display = s0.uiTheme === "off" ? "none" : "";
  const themeStatus = document.createElement("div");
  themeStatus.className = "lf-status lf-theme-status";
  packsSec.body.appendChild(themeStatus);
  const renderTheme = (st) => {
    const mode = store.get().uiTheme;
    themeStatus.style.display = mode === "off" ? "none" : "";
    if (mode === "off")
      return;
    themeStatus.textContent = "";
    if (!st.tintPermission) {
      themeStatus.textContent = tr("Needs permission to restyle Lumiverse — pick the option again to allow it.");
      return;
    }
    if (st.uiThemeLabel) {
      const dot = document.createElement("span");
      dot.className = "lf-theme-dot";
      if (st.charAura && (mode === "character" || store.get().activePack === "character" || store.get().colorSource === "character"))
        dot.style.background = st.charAura;
      const b = document.createElement("b");
      b.textContent = tr(st.uiThemeLabel);
      themeStatus.append(dot, document.createTextNode(`${tr("Theming Lumiverse")}: `), b);
    } else {
      themeStatus.textContent = mode === "character" ? tr("Waiting for a character message to read their aura colour…") : tr("This pack uses your own theme, so Lumiverse is unchanged.");
    }
  };
  statusSyncers.push(renderTheme);
  syncers.push(() => renderTheme(actions.status()));
  renderTheme(actions.status());
  hint(packsSec.body, "Restyles Lumiverse with its own theme engine, so everything stays readable in light and dark mode. Your saved theme is never changed — choose “Keep my theme” to get it back. It also shows under Extension Themes in Lumiverse’s Theme panel.");
  const packBtns = buttons(packsSec.body);
  button(packBtns, "Save my look", () => openSaveDialog(), "primary", I.palette);
  const importBtn = button(packBtns, "Import pack", async () => {
    const name = await actions.importPack();
    importBtn.setText(name ? "Imported ✓" : "Not a Flair pack");
    setTimeout(() => importBtn.setText("Import pack"), 2000);
  }, "secondary", I.share);
  button(packBtns, "Export my look", () => actions.exportPack(), "secondary", I.share);
  hint(packsSec.body, "<b>Save my look</b> adds your current setup to the packs above. Imported packs land there too, and stay after restarts. Export shares a pack as a <code>.flair.json</code> file, including its Lumiverse theme colours.");
  function openSaveDialog() {
    const modal = ctx.ui.showModal({ title: tr("Save my look as a pack"), width: 380 });
    const root = modal.root;
    modal.onDismiss(keepOpenWhileDragging(root));
    root.textContent = "";
    const form = document.createElement("form");
    form.className = "lf-save-form";
    const label = document.createElement("label");
    label.textContent = tr("Pack name");
    const input = document.createElement("input");
    input.type = "text";
    input.maxLength = 60;
    input.className = "lf-input";
    const active = packById(store.get().activePack);
    input.value = active?.custom ? active.name : "";
    input.placeholder = tr("My Flair Pack");
    label.appendChild(input);
    const note = document.createElement("p");
    note.className = "lf-hint";
    note.textContent = tr("Saves your effects, glow, colours, scene, lighting and Lumiverse theme colours. Using the name of one of your packs updates it.");
    const row2 = document.createElement("div");
    row2.className = "lf-btns";
    const save = document.createElement("button");
    save.type = "submit";
    save.className = "lf-btn lf-primary";
    save.textContent = tr("Save pack");
    const cancel = document.createElement("button");
    cancel.type = "button";
    cancel.className = "lf-btn lf-ghost";
    cancel.textContent = tr("Cancel");
    cancel.addEventListener("click", () => modal.dismiss());
    row2.append(save, cancel);
    form.append(label, note, row2);
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      actions.savePack(input.value || tr("My Flair Pack"));
      modal.dismiss();
    });
    root.appendChild(form);
    setTimeout(() => input.focus(), 50);
  }
  const prof = section("profile", "Character profile", I.user, true);
  status(prof.body, (st, el) => {
    const has = store.hasProfile(st.characterId);
    el.textContent = "";
    const name = document.createElement("b");
    name.textContent = st.characterName || (st.characterId ? tr("This character") : tr("No character open"));
    el.append(name, document.createTextNode(st.characterId ? ` — ${has ? tr("using their own Flair profile") : tr("using your global settings")}` : ""));
    prof.badge.textContent = has ? tr("Profile active") : "";
  });
  const profBtns = buttons(prof.body);
  const createBtn = button(profBtns, "Give this character their own look", () => {
    const id = store.activeCharacter();
    if (id)
      store.createProfile(id);
  }, "secondary", I.user);
  const removeBtn = button(profBtns, "Remove profile", async () => {
    const id = store.activeCharacter();
    if (!id)
      return;
    const res = await ctx.ui.showConfirm({
      title: tr("Remove character profile?"),
      message: tr("This character goes back to your global Flair settings."),
      variant: "warning",
      confirmLabel: tr("Remove")
    });
    if (res.confirmed)
      store.deleteProfile(id);
  }, "ghost", I.reset);
  hint(prof.body, "With a profile active, changes to effects, glow, colour, scene and swipe style in this tab apply to <b>this character only</b>.");
  const syncProfileButtons = () => {
    const id = store.activeCharacter();
    const has = store.hasProfile(id);
    createBtn.el.style.display = has ? "none" : "";
    createBtn.el.disabled = !id;
    removeBtn.el.style.display = has ? "" : "none";
  };
  syncProfileButtons();
  syncers.push(syncProfileButtons);
  const intro = section("intro", "Character intro", I.film);
  toggle(intro.body, "Name card when a chat opens", "intro");
  hint(intro.body, "Opening a chat plays a short name card in the character’s aura colour, every time you open one. Click or tap to skip it.");
  const introSounds = actions.sounds;
  const introSoundOptions = () => [
    { value: "", label: tr("None") },
    ...introSounds.list().map((m) => ({ value: m.id, label: m.name, sublabel: `${fmtDuration(m.duration)} · ${fmtSize(m.size)}` }))
  ];
  const introSoundValue = (id) => id && introSounds.has(id) ? id : "";
  const introSoundSel = ctx.components.mountSelect(row(intro.body, "Theme sound", "fill"), {
    value: introSoundValue(s0.introSound),
    options: introSoundOptions(),
    ariaLabel: tr("Theme sound"),
    searchThreshold: 99,
    onChange: (v) => store.update({ introSound: v })
  });
  handles.push(introSoundSel);
  syncers.push((s) => {
    const v = introSoundValue(s.introSound);
    if (introSoundSel.getValue() !== v)
      introSoundSel.update({ value: v });
  });
  const offIntroSounds = introSounds.onChange(() => introSoundSel.update({ options: introSoundOptions(), value: introSoundValue(store.get().introSound) }));
  handles.push({ destroy: offIntroSounds });
  hint(intro.body, "A short file from <b>Your sounds</b> to play with the card (up to 8 seconds). It needs <b>Interface sounds</b> on. With a separate look for a character (Character profile above) it belongs to them alone; without one it plays for every character.");
  toggle(intro.body, "Group chats: show who is speaking", "introGroup");
  hint(intro.body, "A small chip names whoever is talking, in the colour of their avatar, and the other messages dim a little until they have finished.");
  const introBtns = buttons(intro.body);
  button(introBtns, "Preview intro", actions.previewIntro, "primary", I.play);
  button(introBtns, "Preview speaker chip", actions.previewSpeaker, "secondary", I.play);
  const theaterSec = section("theater", "Theater mode", I.film);
  hint(theaterSec.body, "One click hides the interface and leaves the story full-screen, with larger type and a gentle auto-scroll. The atmosphere, lighting and soundscape carry on. You can also start it from the <b>Theater mode</b> item in the input bar’s Extras menu, from the corner-brackets button under any message (it starts reading from that message), or with the command <code>Flair: Toggle theater mode</code>.");
  button(buttons(theaterSec.body), "Enter theater mode", () => actions.enterTheater(), "primary", I.film);
  slider(theaterSec.body, "Text size", "theaterScale", 1, 2.2, 0.05, { suffix: "×" });
  slider(theaterSec.body, "Scroll speed", "theaterSpeed", 1, 8, 1, {});
  toggle(theaterSec.body, "Start the gentle auto-scroll", "theaterScroll");
  hint(theaterSec.body, "The scroll waits while you scroll or touch the screen and carries on a moment later; it stops at the end of the chat. With “reduce motion” on, it starts paused. Inside theater mode: <b>Esc</b> leaves, <b>Space</b> pauses, <b>+</b> and <b>−</b> change the text size; on a phone, tap the screen to bring the controls back. The reply box button lets you answer without leaving.");
  const send = section("send", "When you send", I.send, true);
  select(send.body, "Screen effect", "sendEffect", [
    { value: "sparkle", label: "Sparkle burst", sublabel: "Stars fan out from the composer" },
    { value: "ripple", label: "Ripple", sublabel: "Rings pulse outward" },
    { value: "comet", label: "Comet", sublabel: "A streak flies up into the chat" },
    { value: "confetti", label: "Confetti", sublabel: "Theme-coloured paper pop" },
    { value: "creamy", label: "Creamy", sublabel: "A whale-spout of thick white cream erupts and rains back down" },
    { value: "splash", label: "Splash", sublabel: "A hose-like gush of clear water bursts out and breaks into spray" },
    { value: "blackhole", label: "Black Hole ✦", sublabel: "Overkill: a singularity swallows everything, collapses to a white dot, then detonates" },
    { value: "petalstorm", label: "Petal Storm ✦", sublabel: "Overkill: blossoms burst from the button and a gale sweeps them across the screen" },
    { value: "none", label: "None" }
  ]);
  slider(send.body, "Intensity", "sendIntensity", 0.25, 2, 0.05, { suffix: "×" });
  select(send.body, "Cursor trail", "cursorTrail", [
    { value: "none", label: "None" },
    { value: "splash", label: "Splash" },
    { value: "creamy", label: "Creamy" },
    { value: "petalstorm", label: "Petal Storm" },
    { value: "blackhole", label: "Black Hole" },
    { value: "comet", label: "Comet" },
    { value: "confetti", label: "Confetti" }
  ]);
  slider(send.body, "Trail length", "trailLength", 0.25, 2, 0.05, { suffix: "×" });
  hint(send.body, "The trail follows your mouse pointer, so it doesn’t show on a touch screen.");
  select(send.body, "Your new message", "userEntrance", [
    { value: "pop", label: "Pop + glow flash" },
    { value: "rise", label: "Rise in" },
    { value: "none", label: "None" }
  ]);
  select(send.body, "AI reply finishes", "characterEntrance", [
    { value: "bloom", label: "Glow bloom" },
    { value: "none", label: "None" }
  ]);
  select(send.body, "Swipe transition", "swipeTransition", [
    { value: "slide", label: "Slide", sublabel: "Follows the swipe direction" },
    { value: "fade", label: "Soft fade" },
    { value: "none", label: "None" }
  ]);
  toggle(send.body, "Composer glows while the AI thinks", "composerGlow");
  hint(send.body, "The input box breathes while a reply is generating — brighter and faster when tokens stream in quickly.");
  button(buttons(send.body), "Preview send effect", actions.previewSend, "primary", I.play);
  const hover = section("hover", "Message glow", I.glow);
  select(hover.body, "Hover style", "hoverStyle", [
    { value: "trace", label: "Edge trace", sublabel: "A light runs around the border" },
    { value: "glow", label: "Soft glow" },
    { value: "neon", label: "Neon" },
    { value: "none", label: "Off (Lumiverse default)" }
  ]);
  select(hover.body, "Applies to", "hoverTarget", [
    { value: "all", label: "All messages" },
    { value: "character", label: "Character messages" },
    { value: "user", label: "My messages" }
  ]);
  slider(hover.body, "Glow strength", "hoverStrength", 0.25, 2, 0.05, { suffix: "×" });
  slider(hover.body, "Trace loop time", "traceSpeed", 1, 8, 0.5, { suffix: "s", decimals: 1 });
  toggle(hover.body, "Aura while the AI is writing", "streamingAura");
  button(buttons(hover.body), "Flash latest message", actions.previewHover, "secondary", I.spark);
  const colour = section("colour", "Colour & mood", I.palette);
  status(colour.body, (st, el) => {
    el.textContent = "";
    const sw = document.createElement("span");
    sw.className = "lf-swatch";
    el.appendChild(sw);
    const add = (label, value) => {
      if (!value)
        return;
      const b = document.createElement("b");
      b.textContent = value;
      el.append(document.createTextNode(` ${label} `), b);
    };
    el.append(document.createTextNode(tr("Glow colour")));
    add(`· ${tr("mood")}`, st.moodLabel);
    add(`· ${tr("time")}`, st.timeLabel ? tr(st.timeLabel) : null);
  });
  select(colour.body, "Glow colour", "colorSource", [
    { value: "theme", label: "Follow my theme", sublabel: "Uses the accent, incl. character-aware tint" },
    { value: "character", label: "Character aura", sublabel: "The aura colour of whoever is speaking" },
    { value: "custom", label: "Custom colour" }
  ]);
  const customRow = color(colour.body, "Custom colour", "customColor");
  select(colour.body, "My messages use", "userColor", [
    { value: "match", label: "Same colour" },
    { value: "warm", label: "Warm amber", sublabel: "Matches Minimal mode’s user bar" },
    { value: "custom", label: "Their own colour" }
  ]);
  const userRow = color(colour.body, "My colour", "userCustomColor");
  toggle(colour.body, "Time-of-day tint", "timeOfDay");
  hint(colour.body, "Peach at dawn, amber at golden hour, indigo at night (your local clock).");
  toggle(colour.body, "Mood-reactive glow", "moodGlow");
  hint(colour.body, "Follows the character’s current expression (needs Expressions set up for the character).");
  toggle(colour.body, "Tint the whole UI with the mood", "moodTintUI", async (next) => {
    if (!next)
      return true;
    if (actions.status().tintPermission)
      return true;
    return actions.requestTintPermission();
  });
  hint(colour.body, "Re-tints Lumiverse’s accent while the mood lasts, then restores your theme. Needs the <code>app_manipulation</code> permission (you’ll be asked once).");
  textarea(colour.body, "Mood colours (labels = #hex, one rule per line)", "moodMap", 6, "happy, joy = #ffc94d");
  toggle(colour.body, "Character aura signatures", "auras");
  const auraHint = hint(colour.body, "");
  statusSyncers.push((st) => {
    auraHint.innerHTML = tr("Each character glows in a signature colour sampled from their avatar; in group chats a small puff shows who just spoke.");
    if (st.auraColors.length) {
      const row = document.createElement("span");
      row.className = "lf-aura-row";
      for (const c of st.auraColors.slice(0, 12)) {
        const dot = document.createElement("i");
        dot.className = "lf-aura-dot";
        dot.style.background = c;
        dot.style.boxShadow = `0 0 8px ${c}`;
        row.appendChild(dot);
      }
      auraHint.appendChild(row);
    }
  });
  const amb = section("ambient", "Ambient scene", I.cloud);
  status(amb.body, (st, el) => {
    el.textContent = "";
    const b = document.createElement("b");
    b.textContent = tr(SCENE_LABEL[st.activeScene] ?? st.activeScene);
    el.append(document.createTextNode(`${tr("Now showing")}: `), b);
    if (st.autoScene)
      el.append(document.createTextNode(` · ${tr("lorebook suggests")} ${tr(SCENE_LABEL[st.autoScene] ?? st.autoScene)}`));
    amb.badge.textContent = st.activeScene !== "off" ? tr(SCENE_LABEL[st.activeScene] ?? "") : "";
  });
  select(amb.body, "Default scene", "ambientScene", sceneOptions);
  {
    const slot = row(amb.body, "This chat", "fill");
    const chatValue = () => {
      const id = actions.status().chatId;
      return id && store.getBase().chatScenes[id] || "default";
    };
    const h = ctx.components.mountSelect(slot, {
      value: chatValue(),
      options: [
        { value: "default", label: tr("Use default / lorebook") },
        { value: "auto", label: tr("Lorebook only") },
        ...sceneOptions.map((o) => ({ ...o, label: tr(o.label) }))
      ],
      ariaLabel: tr("This chat"),
      disabled: !actions.status().chatId,
      onChange: (v) => {
        const id = actions.status().chatId;
        if (!id)
          return;
        const next = { ...store.getBase().chatScenes };
        if (v === "default")
          delete next[id];
        else
          next[id] = v;
        store.update({ chatScenes: next });
      }
    });
    handles.push(h);
    let lastDisabled = !actions.status().chatId;
    const sync = () => {
      const v = chatValue();
      if (h.getValue() !== v)
        h.update({ value: v });
      const dis = !actions.status().chatId;
      if (dis !== lastDisabled) {
        lastDisabled = dis;
        h.update({ disabled: dis });
      }
    };
    syncers.push(sync);
    statusSyncers.push(sync);
  }
  toggle(amb.body, "Follow the lorebook", "ambientAuto");
  hint(amb.body, "When an activated lorebook entry mentions the weather or place (rain, snow, campfire, sakura, night sky…) the scene switches to match. Force one with a key or comment like <code>flair:snow</code>, or <code>flair:off</code> to clear it.");
  slider(amb.body, "Density", "ambientDensity", 0.25, 2, 0.05, { suffix: "×" });
  slider(amb.body, "Opacity", "ambientOpacity", 0.1, 1, 0.05, { suffix: "%", decimals: 0, scale: 100 });
  const dirSec = section("director", "Scene Director & lighting", I.film);
  status(dirSec.body, (st, el) => {
    el.textContent = "";
    const b = document.createElement("b");
    b.textContent = st.directed || tr("No direction yet");
    el.append(document.createTextNode(`${tr("AI direction")}: `), b, document.createTextNode(` · ${tr("light")}: ${tr(LIGHT_LABEL[st.light] ?? st.light)}`));
    dirSec.badge.textContent = st.directed ? "\uD83C\uDFAC" : "";
  });
  toggle(dirSec.body, "Let the AI direct the scene", "sceneDirector");
  hint(dirSec.body, 'The AI ends a reply with an invisible stage direction like <code>&lt;flair scene="rain" light="dusk" mood="tense"&gt;&lt;/flair&gt;</code> when the setting changes — weather, lighting, mood and soundscape follow. Uses the prompt note (or <code>{{flair_tags}}</code>).');
  select(dirSec.body, "Default lighting", "lightDefault", LIGHTS.map((l) => ({ value: l, label: LIGHT_LABEL[l] })));
  toggle(dirSec.body, "Cinematic layer", "cinematic");
  hint(dirSec.body, "Light tint, light rays, vignette and lightning drawn behind the messages, above your wallpaper.");
  slider(dirSec.body, "Vignette", "vignette", 0, 1, 0.05, { suffix: "%", decimals: 0, scale: 100 });
  toggle(dirSec.body, "Film grain", "grain");
  toggle(dirSec.body, "Lightning in storms", "lightning");
  toggle(dirSec.body, "Camera shake on shouts", "cameraShake");
  button(buttons(dirSec.body), "Preview lightning", actions.previewLightning, "secondary", I.spark);
  const tw = section("typewriter", "Typewriter pacing", I.text);
  toggle(tw.body, "Typewriter reveal", "typewriter");
  hint(tw.body, "Replies appear at a steady pace instead of in bursts, as if typed. It never falls more than a moment behind what has arrived, and when the reply ends the rest comes out quickly. Off when “reduce motion” is on.");
  slider(tw.body, "Typing speed", "typewriterCps", 10, 120, 5, { suffix: " /s" });
  toggle(tw.body, "Key sounds", "typewriterSound");
  hint(tw.body, "Soft key clicks while it types, a little lower and duller when the character is sad, brighter when happy. They need <b>Interface sounds</b> on (Sound). To use your own, pick a file for <b>Typewriter key</b> under Your sounds.");
  const twDemo = document.createElement("div");
  twDemo.className = "lf-tw-demo";
  twDemo.textContent = tr("The lamp flickered once, then steadied. “You came back,” she said, and for a moment neither of them knew what to do with the quiet.");
  tw.body.appendChild(twDemo);
  const twPreview = button(buttons(tw.body), "Preview typewriter", () => actions.previewTypewriter(twDemo), "primary", I.play);
  if (!actions.typewriterSupported()) {
    twPreview.el.disabled = true;
    hint(tw.body, "<b>This browser can’t do it</b> (it needs Chrome or Edge 105+, Safari 17.2+ or Firefox 140+).");
  }
  const tfx = section("textfx", "Text & AI effects", I.text);
  toggle(tfx.body, "Animated text effects", "textEffects");
  const FX_LABEL = {
    shake: "Shake",
    glow: "Glow",
    whisper: "Whisper",
    rainbow: "Rainbow",
    pulse: "Pulse",
    big: "Big",
    typewriter: "Typewriter",
    fade: "Fade",
    glitch: "Glitch",
    flicker: "Flicker"
  };
  const pickHead = document.createElement("div");
  pickHead.className = "lf-fx-head";
  const pickTitle = document.createElement("span");
  pickTitle.className = "lf-label";
  pickTitle.textContent = tr("Effects in use");
  const pickCount = document.createElement("span");
  pickCount.className = "lf-fx-count";
  pickHead.append(pickTitle, pickCount);
  tfx.body.appendChild(pickHead);
  const pick = document.createElement("div");
  pick.className = "lf-fx-pick";
  pick.setAttribute("role", "group");
  pick.setAttribute("aria-label", tr("Effects in use"));
  for (const fx of TEXT_FX) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "lf-fx-chip";
    b.dataset.fx = fx;
    const sample = document.createElement("span");
    sample.setAttribute("data-lf", fx);
    sample.textContent = tr(FX_LABEL[fx]);
    const state = document.createElement("small");
    b.append(sample, state);
    b.addEventListener("click", (e) => {
      e.preventDefault();
      const off = new Set(store.get().textFxOff);
      if (off.has(fx))
        off.delete(fx);
      else
        off.add(fx);
      store.update({ textFxOff: TEXT_FX.filter((x) => off.has(x)) });
    });
    b.addEventListener("mouseenter", () => {
      if (fx !== "typewriter" && fx !== "fade")
        return;
      sample.removeAttribute("data-lf");
      sample.offsetWidth;
      sample.setAttribute("data-lf", fx);
    });
    pick.appendChild(b);
  }
  tfx.body.appendChild(pick);
  const syncPick = (st) => {
    const off = new Set(st.textFxOff);
    pick.querySelectorAll(".lf-fx-chip").forEach((b) => {
      const isOn = !off.has(b.dataset.fx);
      b.classList.toggle("lf-off", !isOn);
      b.setAttribute("aria-pressed", String(isOn));
      b.title = tr(isOn ? "On — click to turn off" : "Off — click to turn on");
      b.querySelector("small").textContent = tr(isOn ? "On" : "Off");
    });
    pickCount.textContent = `${TEXT_FX.length - off.size} / ${TEXT_FX.length}`;
    pick.classList.toggle("lf-master-off", !st.textEffects);
  };
  syncers.push(syncPick);
  syncPick(store.get());
  const pickBtns = buttons(tfx.body);
  button(pickBtns, "Turn all on", () => store.update({ textFxOff: [] }), "ghost");
  hint(tfx.body, "Click an effect to switch it off. Off effects show as plain text in messages and the AI stops using them. With a character profile active, this choice is saved for that character only.");
  select(tfx.body, "How often the AI uses them", "textFxFrequency", [
    { value: "every", label: "Every reply", sublabel: "3–6 styled phrases in each message" },
    { value: "often", label: "Most replies", sublabel: "1–3 where they fit" },
    { value: "sparing", label: "Sparingly", sublabel: "Only for real emphasis" }
  ]);
  toggle(tfx.body, "Add the instructions to every prompt", "autoInject", async (next) => {
    if (!next)
      return true;
    if (actions.status().injectPermission)
      return true;
    return actions.requestInjectPermission();
  });
  const injectHint = hint(tfx.body, "");
  const renderInjectHint = (st) => {
    injectHint.innerHTML = st.injectPermission ? "Flair adds a short styling note just before the latest message, so the AI keeps using effects every turn. You can see it as <b>Lumi Flair text effects</b> in Prompt Breakdown." : "Needs the <code>interceptor</code> permission (you’ll be asked once). Without it, put <code>{{flair_tags}}</code> in your preset or character card instead.";
  };
  statusSyncers.push(renderInjectHint);
  renderInjectHint(actions.status());
  const grantBtn = button(buttons(tfx.body), "Allow prompt injection", async () => {
    await actions.requestInjectPermission();
  }, "primary", I.text);
  const syncGrant = (st) => {
    grantBtn.el.style.display = st.injectPermission || !store.get().autoInject ? "none" : "";
  };
  statusSyncers.push(syncGrant);
  syncers.push(() => syncGrant(actions.status()));
  syncGrant(actions.status());
  hint(tfx.body, 'Effects are written as <code>&lt;span data-lf="shake"&gt;…&lt;/span&gt;</code> — also <code>glow</code>, <code>whisper</code>, <code>rainbow</code>, <code>typewriter</code>, <code>fade</code>, <code>pulse</code>, <code>glitch</code>, <code>flicker</code>, <code>big</code>.');
  toggle(tfx.body, "Let the AI trigger screen effects", "aiEffects");
  hint(tfx.body, 'The AI can write <code>&lt;flair effect="confetti"&gt;&lt;/flair&gt;</code> at a big moment. It’s hidden from the text and plays once, when the reply arrives.');
  toggle(tfx.body, "Choice chips", "choiceChips");
  hint(tfx.body, "When you face a decision, the AI can offer 2–3 options as glowing buttons under its reply: <code>&lt;flair-choice&gt;…&lt;/flair-choice&gt;</code>.");
  toggle(tfx.body, "Send a choice immediately", "choiceSend");
  hint(tfx.body, "Off: clicking a choice puts it in the input box so you can edit it first.");
  const copyBtn = button(buttons(tfx.body), "Copy {{flair_tags}}", async () => {
    try {
      await navigator.clipboard.writeText("{{flair_tags}}");
      copyBtn.setText("Copied ✓");
      setTimeout(() => copyBtn.setText("Copy {{flair_tags}}"), 1800);
    } catch {}
  }, "secondary", I.copy);
  const beat = section("heartbeat", "Story heartbeat", I.heart);
  const beatHost = document.createElement("div");
  beatHost.className = "lf-beat-host";
  const legend = document.createElement("div");
  legend.className = "lf-beat-legend";
  legend.innerHTML = `<span>${tr("↑ joyful")}</span><span>${tr("↓ dark")}</span>`;
  beat.body.append(beatHost, legend);
  const BEAT_HINT = "The emotional arc of this chat, from the character’s expressions, the AI’s mood directions and the tone of each reply. Click a point to jump to it. A ★ marks a pinned moment.";
  const beatInfo = hint(beat.body, BEAT_HINT);
  const jumpNote = (res, gone) => {
    if (res === "missing")
      beatInfo.textContent = tr(gone);
    else if (res === "notfound")
      beatInfo.textContent = tr("Couldn’t reach that message just now — try again in a moment.");
    else if (res === "unavailable")
      beatInfo.textContent = tr("Open the chat to jump to its messages.");
    else
      beatInfo.textContent = tr(BEAT_HINT);
  };
  let beatKey = "";
  statusSyncers.push((st) => {
    const key = `${st.chatId}|${st.beats.length}|${st.beats.at(-1)?.v ?? ""}|${st.beats.at(-1)?.label ?? ""}|${st.pins.map((p) => p.id).join(",")}`;
    if (key === beatKey)
      return;
    beatKey = key;
    beat.badge.textContent = st.beats.length ? String(st.beats.length) : "";
    renderHeartbeat(beatHost, st.beats, async (pt) => jumpNote(await actions.jumpTo(pt), "That message no longer exists, so its point was removed."), st.pins, async (pin) => jumpNote(await actions.jumpToPin(pin), "That message no longer exists, so its pin was removed."));
  });
  const fav = section("favourites", "Favourite moments", I.star);
  const favList = document.createElement("div");
  favList.className = "lf-pin-list";
  fav.body.appendChild(favList);
  const favInfo = hint(fav.body, "Tap the ★ under a message to pin it. Select some text first to pin just that line. Pinned moments show as stars on the story heartbeat above.");
  button(buttons(fav.body), "Pin the latest message", () => actions.pinLatest(), "secondary", I.star);
  toggle(fav.body, "Save pins to Lumiverse memory", "pinMemory", async (next) => !next || actions.status().memoriesPermission || await actions.requestMemoriesPermission());
  hint(fav.body, "Adds each new pin to Lumiverse’s memory as a short fact about whoever said it, so the AI can recall it. It works through your Memory Cortex (which must be on) and Lumiverse’s own memory budget, so Flair adds no tokens of its own. Lumiverse can only add facts, so unpinning doesn’t take one back out.");
  const memGrant = button(buttons(fav.body), "Allow memory access", async () => {
    if (await actions.requestMemoriesPermission())
      store.update({ pinMemory: true });
  }, "secondary", I.star);
  button(buttons(fav.body), "Save this chat’s pins to memory", () => actions.savePinsToMemory(), "secondary", I.share);
  const memNote = hint(fav.body, "");
  statusSyncers.push((st) => {
    memGrant.el.style.display = store.get().pinMemory && !st.memoriesPermission ? "" : "none";
    memNote.textContent = st.memoryNote ?? "";
    memNote.style.display = st.memoryNote ? "" : "none";
  });
  syncers.push(() => memGrant.el.style.display = store.get().pinMemory && !actions.status().memoriesPermission ? "" : "none");
  let favKey = null;
  statusSyncers.push((st) => {
    const key = `${st.chatId}|${st.pins.map((p) => `${p.id}:${p.t}`).join(",")}`;
    if (key === favKey)
      return;
    favKey = key;
    fav.badge.textContent = st.pins.length ? String(st.pins.length) : "";
    favList.textContent = "";
    if (!st.pins.length) {
      const e = document.createElement("div");
      e.className = "lf-pin-empty";
      e.textContent = tr(st.chatId ? "No pinned moments in this chat yet." : "Open a chat to pin its moments.");
      favList.appendChild(e);
      return;
    }
    for (const pin of st.pins) {
      const card = document.createElement("div");
      card.className = "lf-pin";
      if (pin.color)
        card.style.setProperty("--lf-pin-c", pin.color);
      const head = document.createElement("div");
      head.className = "lf-pin-head";
      head.innerHTML = STAR_SVG;
      const who = document.createElement("span");
      who.className = "lf-pin-who";
      who.textContent = pin.who || tr(pin.user ? "You" : "Message");
      const n = document.createElement("span");
      n.className = "lf-pin-n";
      n.textContent = pin.t ? new Date(pin.t).toLocaleDateString() : "";
      head.append(who, n);
      const text = document.createElement("p");
      text.className = "lf-pin-text";
      text.dataset.whole = pin.whole ? "1" : "0";
      text.textContent = pin.whole ? pin.text : `“${pin.text}”`;
      const acts = document.createElement("div");
      acts.className = "lf-pin-acts";
      button(acts, "Jump to it", async () => {
        const res = await actions.jumpToPin(pin);
        if (res === "missing")
          favInfo.textContent = tr("That message no longer exists, so its pin was removed.");
        else if (res === "notfound")
          favInfo.textContent = tr("Couldn’t reach that message just now — try again in a moment.");
        else if (res === "unavailable")
          favInfo.textContent = tr("Open the chat to jump to its messages.");
      }, "ghost", I.chev);
      button(acts, "Remove", () => actions.unpin(pin.id), "ghost", I.trash);
      card.append(head, text, acts);
      favList.appendChild(card);
    }
  });
  const party = section("celebrate", "Celebrations", I.party);
  toggle(party.body, "Message milestones", "milestones");
  hint(party.body, "Confetti and a little banner at 50, 100, 250, 500, 1000… messages in a chat.");
  textarea(party.body, "Keyword triggers (phrase => sparkle | ripple | comet | confetti)", "triggers", 5, "happy birthday => confetti");
  hint(party.body, "Checked against your messages and the AI’s replies.");
  const ach = section("achievements", "Achievements", I.trophy);
  toggle(ach.body, "Show unlock cards", "achievements");
  const grid = document.createElement("div");
  grid.className = "lf-badges";
  ach.body.appendChild(grid);
  let achKey = null;
  statusSyncers.push((st) => {
    const key = Object.keys(st.unlocked).sort().join(",");
    if (key === achKey)
      return;
    achKey = key;
    grid.textContent = "";
    for (const a of ACHIEVEMENTS) {
      const got = !!st.unlocked[a.id];
      const c = document.createElement("div");
      c.className = got ? "lf-badge-card lf-got" : "lf-badge-card";
      c.title = tr(a.desc);
      const ico = document.createElement("span");
      ico.className = "lf-badge-ico";
      ico.textContent = a.icon;
      const t = document.createElement("b");
      t.textContent = tr(a.title);
      const d = document.createElement("span");
      d.textContent = got ? new Date(st.unlocked[a.id]).toLocaleDateString() : tr(a.desc);
      c.append(ico, t, d);
      grid.appendChild(c);
    }
    ach.badge.textContent = `${Object.keys(st.unlocked).length}/${ACHIEVEMENTS.length}`;
  });
  const snd = section("sound", "Sound", I.sound);
  toggle(snd.body, "Interface sounds", "sound");
  hint(snd.body, "Soft synthesized chimes on send, reply and celebrations. Pitch follows the mood.");
  slider(snd.body, "Volume", "soundVolume", 0, 1, 0.05, { suffix: "%", decimals: 0, scale: 100 });
  button(buttons(snd.body), "Test sound", actions.testSound, "secondary", I.sound);
  toggle(snd.body, "Soundscapes", "soundscape");
  hint(snd.body, "Rain, wind, crackling fire, night crickets, spring birds or a deep-space hum — generated live to match the scene and lighting, crossfading as the story moves. No audio files.");
  slider(snd.body, "Soundscape volume", "soundscapeVolume", 0, 1, 0.05, { suffix: "%", decimals: 0, scale: 100 });
  toggle(snd.body, "AI sound effects", "aiSfx");
  hint(snd.body, "The AI can add short sound cues to a reply — a door knock, a sword clash, a heartbeat — that play as the line appears. Adds a short note (about 200 tokens) to each request, and uses the same “Add the instructions to every prompt” setting as the other AI tags. Assign your own files to any cue under “Your sounds”.");
  slider(snd.body, "Effects volume", "sfxVolume", 0, 1, 0.05, { suffix: "%", decimals: 0, scale: 100 });
  const cueRow = buttons(snd.body);
  for (const c of SFX_CUES)
    button(cueRow, c.label, () => actions.previewSfx(c.name), "secondary", I.sound);
  toggle(snd.body, "Floating volume widget", "soundWidget", async (next) => !next || actions.status().panelsPermission || await actions.requestPanelsPermission());
  hint(snd.body, "A small pill you can drag anywhere: turn the ambience on or off and set its volume without opening this panel. Needs the “UI panels” permission.");
  const widgetGrant = button(buttons(snd.body), "Allow the floating widget", async () => {
    if (await actions.requestPanelsPermission())
      store.update({ soundWidget: true });
  }, "secondary", I.sound);
  const syncWidgetGrant = (st) => {
    widgetGrant.el.style.display = store.get().soundWidget && !st.panelsPermission ? "" : "none";
  };
  statusSyncers.push(syncWidgetGrant);
  syncers.push(() => syncWidgetGrant(actions.status()));
  syncWidgetGrant(actions.status());
  select(snd.body, "When in the background", "soundUnfocused", [
    { value: "keep", label: "Keep playing", sublabel: "Ambience plays at full volume when you switch windows" },
    { value: "dim", label: "Dim", sublabel: "Turns the ambience down while another window is in front" },
    { value: "mute", label: "Mute", sublabel: "Silences the ambience until you come back" }
  ]);
  hint(snd.body, "Dims or mutes the soundscape while you’re in another window or app, and brings it back when you return.");
  const dimWrap = document.createElement("div");
  snd.body.appendChild(dimWrap);
  slider(dimWrap, "Dim to", "soundUnfocusedLevel", 0.05, 0.8, 0.05, { suffix: "%", decimals: 0, scale: 100 });
  const syncDim = (s) => dimWrap.style.display = s.soundUnfocused === "dim" ? "" : "none";
  syncers.push(syncDim);
  syncDim(s0);
  const scapeStatus = document.createElement("div");
  scapeStatus.className = "lf-status";
  snd.body.appendChild(scapeStatus);
  const renderScape = (st) => {
    const on = store.get().soundscape;
    scapeStatus.style.display = on ? "" : "none";
    if (!on)
      return;
    const [sc, li] = st.soundscapeKey.split("|");
    const named = st.soundscapeAlways ? [] : [sc && sc !== "off" ? tr(SCENE_LABEL[sc] ?? sc) : "", li && li !== "none" ? tr(LIGHT_LABEL[li] ?? li) : ""];
    const what = [...named, ...st.soundscapeCustom.map((n) => `♫ ${n}`)].filter(Boolean).join(" · ");
    scapeStatus.textContent = st.soundscape === "playing" ? `♪ ${tr("Playing")}: ${what}` : st.soundscape === "waiting" ? tr("Paused by the browser — click anywhere to resume") : tr("Silent — this scene and lighting have no ambience");
  };
  statusSyncers.push(renderScape);
  syncers.push(() => renderScape(actions.status()));
  renderScape(actions.status());
  const mine = section("mysounds", "Your sounds", I.music);
  hint(mine.body, "Use your own audio files: a looping ambience for any scene or lighting (or one track that always plays), and your own message and system sounds. Files stay in this browser, so other devices need their own copies, and they aren’t included in settings backups.");
  const sl = actions.sounds;
  const upMsg = document.createElement("div");
  upMsg.className = "lf-status lf-snd-msg";
  upMsg.style.display = "none";
  const upBtn = button(buttons(mine.body), "Upload sounds", async () => {
    upBtn.el.disabled = true;
    upBtn.setText("Adding…");
    try {
      const { added, errors } = await sl.upload();
      const parts = [];
      if (added.length)
        parts.push(`${tr("Added")}: ${added.join(", ")}`);
      parts.push(...errors);
      upMsg.textContent = parts.join(" · ");
      upMsg.dataset.kind = errors.length && !added.length ? "error" : "ok";
      upMsg.style.display = parts.length ? "" : "none";
    } finally {
      upBtn.el.disabled = false;
      upBtn.setText("Upload sounds");
    }
  }, "primary", I.upload);
  mine.body.appendChild(upMsg);
  if (!sl.saved())
    hint(mine.body, "<b>This browser won’t keep files</b> (private window or storage blocked), so they’ll be gone when you close Lumiverse.");
  const libList = document.createElement("div");
  libList.className = "lf-snd-list";
  mine.body.appendChild(libList);
  const assignHead = document.createElement("div");
  assignHead.className = "lf-snd-sub";
  assignHead.textContent = tr("Use a sound");
  mine.body.appendChild(assignHead);
  const slotOptions = () => Object.entries(SLOT_LABEL).map(([value, l]) => ({ value, label: tr(l.label), group: tr(l.group) }));
  const soundOptions = () => [
    { value: "", label: tr("Built-in sound"), sublabel: tr("Generated by Lumi Flair") },
    ...sl.list().map((m) => ({ value: m.id, label: m.name, sublabel: `${fmtDuration(m.duration)} · ${fmtSize(m.size)}` }))
  ];
  let slot = "always";
  const slotSel = ctx.components.mountSelect(row(mine.body, "For", "fill"), {
    value: slot,
    options: slotOptions(),
    ariaLabel: tr("For"),
    searchThreshold: 99,
    onChange: (v) => {
      slot = v || "always";
      soundSel.update({ value: store.get().customSounds[slot] ?? "" });
    }
  });
  handles.push(slotSel);
  const soundSel = ctx.components.mountSelect(row(mine.body, "Sound", "fill"), {
    value: s0.customSounds[slot] ?? "",
    options: soundOptions(),
    ariaLabel: tr("Sound"),
    onChange: (v) => {
      const next = { ...store.get().customSounds };
      if (v)
        next[slot] = v;
      else
        delete next[slot];
      store.update({ customSounds: next });
    }
  });
  handles.push(soundSel);
  const assigned = document.createElement("div");
  assigned.className = "lf-snd-assigned";
  mine.body.appendChild(assigned);
  hint(mine.body, "Ambience files loop through the soundscape (so the volume, floating widget and background dimming apply). A scene and a lighting can each have a file and play together. Interface sounds need <b>Interface sounds</b> on and play for up to 12 seconds.");
  let libHandles = [];
  let previewing = null;
  const usedFor = (id) => Object.entries(store.get().customSounds).filter(([, v]) => v === id).map(([k]) => tr(SLOT_LABEL[k]?.label ?? k));
  const renderLibrary = () => {
    for (const h of libHandles)
      h.destroy();
    libHandles = [];
    libList.textContent = "";
    const items = sl.list();
    mine.badge.textContent = items.length ? String(items.length) : "";
    if (!items.length) {
      const empty = document.createElement("div");
      empty.className = "lf-snd-empty";
      empty.textContent = tr("No sounds yet — upload MP3, OGG, WAV, M4A or FLAC files.");
      libList.appendChild(empty);
      return;
    }
    for (const m of items) {
      const card = document.createElement("div");
      card.className = "lf-snd";
      const head = document.createElement("div");
      head.className = "lf-snd-head";
      const play = document.createElement("button");
      play.type = "button";
      play.className = "lf-snd-play";
      const paintPlay = () => {
        const on = previewing === m.id;
        play.dataset.on = on ? "1" : "0";
        play.innerHTML = on ? I.stop : I.play;
        play.setAttribute("aria-label", on ? tr("Stop") : tr("Play"));
        play.title = play.getAttribute("aria-label") ?? "";
      };
      paintPlay();
      play.addEventListener("click", (e) => {
        e.preventDefault();
        if (previewing === m.id) {
          sl.stopPreview();
          return;
        }
        previewing = m.id;
        renderPlayButtons();
        sl.preview(m.id, () => {
          if (previewing === m.id)
            previewing = null;
          renderPlayButtons();
        });
      });
      play.paint = paintPlay;
      const info = document.createElement("div");
      info.className = "lf-snd-info";
      const name = document.createElement("b");
      name.textContent = m.name;
      name.title = m.name;
      const meta = document.createElement("span");
      const uses = usedFor(m.id);
      meta.textContent = [fmtDuration(m.duration), fmtSize(m.size), uses.length ? `${tr("Used for")}: ${uses.join(", ")}` : tr("Not used yet")].join(" · ");
      info.append(name, meta);
      const del = document.createElement("button");
      del.type = "button";
      del.className = "lf-snd-del";
      del.innerHTML = I.trash;
      del.title = tr("Delete");
      del.setAttribute("aria-label", `${tr("Delete")} ${m.name}`);
      del.addEventListener("click", async (e) => {
        e.preventDefault();
        let ok = true;
        try {
          const res = await ctx.ui.showConfirm({
            title: tr("Delete this sound?"),
            message: `${m.name}${uses.length ? ` — ${tr("Used for")}: ${uses.join(", ")}` : ""}`,
            variant: "warning",
            confirmLabel: tr("Delete")
          });
          ok = res.confirmed;
        } catch {}
        if (!ok)
          return;
        if (previewing === m.id)
          sl.stopPreview();
        const next = Object.fromEntries(Object.entries(store.get().customSounds).filter(([, v]) => v !== m.id));
        store.update({ customSounds: next });
        await sl.remove(m.id);
      });
      head.append(play, info, del);
      const level = document.createElement("div");
      card.append(head, level);
      libList.appendChild(card);
      const h = ctx.components.mountRangeSlider(level, {
        label: tr("Level"),
        min: 0,
        max: 150,
        step: 5,
        value: Math.round(m.level * 100),
        format: { suffix: "%", decimals: 0 },
        onCommit: (v) => sl.setLevel(m.id, v / 100)
      });
      libHandles.push(h);
    }
  };
  const renderPlayButtons = () => {
    for (const b of libList.querySelectorAll(".lf-snd-play"))
      b.paint?.();
  };
  const renderAssigned = () => {
    assigned.textContent = "";
    const cs = store.get().customSounds;
    for (const [k, id] of Object.entries(cs)) {
      const pair = document.createElement("div");
      pair.className = "lf-snd-pair";
      const missing = !sl.has(id);
      pair.dataset.missing = missing ? "1" : "0";
      const text = document.createElement("span");
      const l = SLOT_LABEL[k];
      text.append(`${tr(l?.group ?? "")} · ${tr(l?.label ?? k)} → `);
      const b = document.createElement("b");
      b.textContent = missing ? tr("not in this browser") : sl.list().find((m) => m.id === id)?.name ?? id;
      text.appendChild(b);
      const x = document.createElement("button");
      x.type = "button";
      x.className = "lf-snd-del";
      x.innerHTML = I.trash;
      x.title = tr("Use the built-in sound");
      x.setAttribute("aria-label", x.title);
      x.addEventListener("click", (e) => {
        e.preventDefault();
        const next = { ...store.get().customSounds };
        delete next[k];
        store.update({ customSounds: next });
      });
      pair.append(text, x);
      assigned.appendChild(pair);
    }
  };
  const renderMine = () => {
    soundSel.update({ options: soundOptions(), value: store.get().customSounds[slot] ?? "" });
    renderLibrary();
    renderAssigned();
  };
  let lastAssign = JSON.stringify(s0.customSounds);
  syncers.push((st) => {
    const key = JSON.stringify(st.customSounds);
    if (key === lastAssign)
      return;
    lastAssign = key;
    renderMine();
  });
  const offSounds = sl.onChange(renderMine);
  handles.push({
    destroy: () => {
      offSounds();
      sl.stopPreview();
      for (const h of libHandles)
        h.destroy();
    }
  });
  renderMine();
  const share = section("share", "Share", I.share);
  hint(share.body, "<b>Moment Cards</b> turn a message into a share-ready image with the avatar, the quote and the character’s glow. Use the camera button on any message, or:");
  button(buttons(share.body), "Moment Card of the latest reply", () => actions.momentLatest(), "primary", I.camera);
  hint(share.body, "Export your hover glow, edge trace and streaming aura as a Lumiverse theme pack, so friends get the look without installing the extension.");
  const exportBtn = button(buttons(share.body), "Export theme pack", async () => {
    exportBtn.el.disabled = true;
    try {
      const kind = await actions.exportTheme();
      exportBtn.setText(kind === "pack" ? "Saved .lumitheme ✓" : "Saved .css ✓");
      setTimeout(() => exportBtn.setText("Export theme pack"), 2500);
    } finally {
      exportBtn.el.disabled = false;
    }
  }, "secondary", I.share);
  const foot = buttons(panel);
  button(foot, "Show welcome", () => actions.openWelcome(), "ghost", I.spark);
  button(foot, "Reset to defaults", async () => {
    const res = await ctx.ui.showConfirm({
      title: tr("Reset Lumi Flair?"),
      message: tr("All Flair settings go back to their defaults, and character profiles are removed."),
      variant: "warning",
      confirmLabel: tr("Reset")
    });
    if (res.confirmed)
      store.reset();
  }, "ghost", I.reset);
  function syncVisibility(s) {
    customRow.style.display = s.colorSource === "custom" ? "" : "none";
    userRow.style.display = s.userColor === "custom" ? "" : "none";
  }
  syncVisibility(s0);
  for (const fn of statusSyncers)
    fn(actions.status());
  tab.root.appendChild(panel);
  const unsub = store.subscribe((s) => {
    syncVisibility(s);
    for (const fn of syncers)
      fn(s);
    for (const fn of statusSyncers)
      fn(actions.status());
  });
  const unsubStatus = actions.onStatus((st) => {
    for (const fn of statusSyncers)
      fn(st);
    syncProfileButtons();
  });
  return {
    activate: () => tab.activate(),
    destroy: () => {
      unsub();
      unsubStatus();
      unsubVault();
      clearInterval(agoTimer);
      for (const h of handles) {
        try {
          h.destroy();
        } catch {}
      }
      tab.destroy();
    }
  };
}

// src/navigate.ts
var LIST = '[data-component="MessageList"]';
var ROW = "[data-virtual-index][data-message-id]";
var DESKTOP_TOP_THRESHOLD = 96;
var MAX_MS = 45000;
var NAVIGATE_CSS = `
.lf-veil { position: fixed; z-index: 2147483000; display: flex; align-items: center; justify-content: center; pointer-events: auto; cursor: pointer;
  opacity: 0; transition: opacity .28s ease; border-radius: 0;
  background: radial-gradient(ellipse at center, color-mix(in srgb, var(--lf-c, var(--lumiverse-primary)) 16%, transparent), transparent 70%),
              color-mix(in srgb, var(--lumiverse-bg, #0f0c18) 62%, transparent);
  -webkit-backdrop-filter: blur(14px) saturate(1.1); backdrop-filter: blur(14px) saturate(1.1); }
.lf-veil.lf-in { opacity: 1; }
.lf-veil-card { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 18px 22px; border-radius: 16px; min-width: 220px; text-align: center;
  color: var(--lumiverse-text); background: color-mix(in srgb, var(--lumiverse-bg-elevated, #1a1626) 82%, transparent);
  border: 1px solid color-mix(in srgb, var(--lf-c, var(--lumiverse-primary)) 40%, transparent);
  box-shadow: 0 10px 40px rgba(0,0,0,.35), 0 0 24px color-mix(in srgb, var(--lf-c, var(--lumiverse-primary)) 22%, transparent); }
.lf-veil-ico { width: 30px; height: 30px; color: var(--lf-c, var(--lumiverse-primary)); animation: lf-rewind 1.1s linear infinite; }
@keyframes lf-rewind { to { transform: rotate(-360deg); } }
.lf-veil-card b { font-size: calc(14px * var(--lumiverse-font-scale, 1)); }
.lf-veil-card small { font-size: calc(11px * var(--lumiverse-font-scale, 1)); color: var(--lumiverse-text-dim); }
.lf-veil-bar { width: 180px; height: 3px; border-radius: 3px; overflow: hidden; background: var(--lumiverse-fill, rgba(255,255,255,.08)); }
.lf-veil-bar i { display: block; height: 100%; width: 0%; border-radius: inherit; background: var(--lf-c, var(--lumiverse-primary));
  box-shadow: 0 0 10px var(--lf-c, var(--lumiverse-primary)); transition: width .35s ease; }
.lf-veil-bar.lf-indet i { width: 35%; animation: lf-indet 1.2s ease-in-out infinite; }
@keyframes lf-indet { 0% { transform: translateX(-110%); } 100% { transform: translateX(320%); } }
@media (prefers-reduced-motion: reduce) { .lf-veil-ico, .lf-veil-bar.lf-indet i { animation: none; } .lf-veil { transition: none; } }
`;
var ICON3 = `<svg class="lf-veil-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/></svg>`;
var frame = () => new Promise((r) => requestAnimationFrame(() => r()));
var sleep = (ms) => new Promise((r) => setTimeout(r, ms));

class StoryNavigator {
  ctx;
  host;
  onArrive;
  job = null;
  veil = null;
  bar = null;
  sub = null;
  constructor(ctx, host, onArrive) {
    this.ctx = ctx;
    this.host = host;
    this.onArrive = onArrive;
  }
  get busy() {
    return !!this.job;
  }
  cancel() {
    if (this.job)
      this.job.cancelled = true;
  }
  list() {
    return document.querySelector(LIST);
  }
  row(id) {
    const list = this.list();
    if (!list)
      return null;
    const sel = `[data-message-id="${CSS.escape(id)}"]`;
    return list.querySelector(`${ROW}${sel}`) ?? list.querySelector(sel);
  }
  ids() {
    try {
      return this.ctx.messages.listMessageIds();
    } catch {
      return [];
    }
  }
  topThreshold(el) {
    const coarse = window.matchMedia?.("(pointer: coarse)").matches;
    return coarse ? Math.max(DESKTOP_TOP_THRESHOLD, Math.round(el.clientHeight * 1.15), 420) : DESKTOP_TOP_THRESHOLD;
  }
  async indexOf(id) {
    const get = this.ctx.messages.get;
    if (!get)
      return;
    try {
      const dto = await get(id);
      return dto ? dto.index_in_chat : null;
    } catch {
      return;
    }
  }
  async jump(id) {
    this.cancel();
    const job = { cancelled: false };
    this.job = job;
    const started = performance.now();
    let veilTimer;
    const onKey = (e) => {
      if (e.key === "Escape")
        job.cancelled = true;
    };
    window.addEventListener("keydown", onKey, true);
    try {
      const el = this.list();
      if (!el)
        return "unavailable";
      const mounted = this.row(id);
      if (mounted) {
        this.glide(mounted, true);
        this.onArrive(id);
        return "ok";
      }
      const targetIndex = await this.indexOf(id);
      if (targetIndex === null)
        return "missing";
      if (job.cancelled)
        return "cancelled";
      veilTimer = setTimeout(() => !job.cancelled && this.showVeil(), 180);
      let firstIndexCache = null;
      const lastId = this.ids().at(-1);
      const latest = lastId ? await this.indexOf(lastId) ?? null : null;
      const progress = async () => {
        if (targetIndex === undefined || !this.bar)
          return;
        const ids = this.ids();
        const first = ids[0];
        if (!first)
          return;
        if (firstIndexCache?.id !== first)
          firstIndexCache = { id: first, index: await this.indexOf(first) ?? null };
        if (firstIndexCache.index == null || latest == null || latest <= targetIndex)
          return;
        const pct = Math.max(4, Math.min(100, (latest - firstIndexCache.index) / (latest - targetIndex) * 100));
        const bar = this.bar;
        if (!bar || job.cancelled)
          return;
        bar.classList.remove("lf-indet");
        bar.firstElementChild.style.width = `${pct}%`;
      };
      let stalls = 0;
      while (!job.cancelled) {
        if (performance.now() - started > MAX_MS)
          return "notfound";
        const list = this.list();
        if (!list)
          return "unavailable";
        const row = this.row(id);
        if (row) {
          this.glide(row, !this.veil);
          await frame();
          const again = this.row(id);
          if (again)
            this.glide(again, false);
          this.onArrive(id);
          return "ok";
        }
        const ids = this.ids();
        const k = ids.indexOf(id);
        if (k >= 0) {
          const rows = [...list.querySelectorAll(ROW)];
          const pos = rows.map((r) => ({ r, k: ids.indexOf(r.dataset.messageId ?? "") })).filter((x) => x.k >= 0);
          if (!pos.length) {
            list.scrollTop = 0;
            await this.settle();
            continue;
          }
          const avg = pos.reduce((a, x) => a + x.r.getBoundingClientRect().height, 0) / pos.length || 200;
          const lo = pos[0], hi = pos[pos.length - 1];
          const before = list.scrollTop;
          if (k < lo.k) {
            if (before <= 1) {
              if (!await this.loadOlder(list))
                stalls++;
            } else
              list.scrollTop = Math.max(0, before - Math.max(list.clientHeight * 0.5, (lo.k - k) * avg));
          } else if (k > hi.k) {
            list.scrollTop = before + Math.max(list.clientHeight * 0.5, (k - hi.k) * avg);
          } else {
            list.scrollTop = before + (k - lo.k) * avg * 0.5;
          }
          await this.settle();
        } else {
          const grew = await this.loadOlder(list);
          if (grew)
            stalls = 0;
          else if (++stalls >= 3)
            return "notfound";
          progress();
        }
      }
      return "cancelled";
    } finally {
      if (veilTimer)
        clearTimeout(veilTimer);
      window.removeEventListener("keydown", onKey, true);
      this.hideVeil();
      if (this.job === job)
        this.job = null;
    }
  }
  async loadOlder(list) {
    const thr = this.topThreshold(list);
    const countBefore = this.ids().length;
    const heightBefore = list.scrollHeight;
    const firstRowBefore = list.querySelector(ROW)?.dataset.messageId;
    if (list.scrollTop <= thr) {
      list.scrollTop = Math.min(list.scrollHeight, thr + 60);
      await frame();
      await frame();
    }
    list.scrollTop = 0;
    const t0 = performance.now();
    while (performance.now() - t0 < 4000) {
      await sleep(60);
      if (this.ids().length !== countBefore)
        break;
      if (list.scrollHeight !== heightBefore && list.querySelector(ROW)?.dataset.messageId !== firstRowBefore)
        break;
    }
    await this.settle();
    return this.ids().length !== countBefore || list.scrollHeight !== heightBefore;
  }
  async settle() {
    await frame();
    await frame();
  }
  glide(row, smooth) {
    const list = this.list();
    if (!list)
      return;
    const lr = list.getBoundingClientRect();
    const rr = row.getBoundingClientRect();
    const target = list.scrollTop + (rr.top - lr.top) - (lr.height - Math.min(rr.height, lr.height * 0.8)) / 2;
    list.scrollTo({ top: Math.max(0, target), behavior: smooth ? "smooth" : "auto" });
  }
  showVeil() {
    const list = this.list();
    if (!list || this.veil)
      return;
    const r = list.getBoundingClientRect();
    const v = document.createElement("div");
    v.className = "lf-veil";
    v.setAttribute("role", "status");
    v.setAttribute("aria-live", "polite");
    Object.assign(v.style, { left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px` });
    const card = document.createElement("div");
    card.className = "lf-veil-card";
    card.innerHTML = ICON3;
    const b = document.createElement("b");
    b.textContent = tr("Rewinding the story…");
    const bar = document.createElement("div");
    bar.className = "lf-veil-bar lf-indet";
    bar.appendChild(document.createElement("i"));
    const sub = document.createElement("small");
    sub.textContent = tr("Click or press Esc to cancel");
    card.append(b, bar, sub);
    v.appendChild(card);
    v.addEventListener("click", () => this.cancel());
    this.host().appendChild(v);
    requestAnimationFrame(() => v.classList.add("lf-in"));
    this.veil = v;
    this.bar = bar;
    this.sub = sub;
  }
  hideVeil() {
    const v = this.veil;
    if (!v)
      return;
    this.veil = this.bar = this.sub = null;
    v.classList.remove("lf-in");
    setTimeout(() => v.remove(), 320);
  }
  destroy() {
    this.cancel();
    this.veil?.remove();
    this.veil = null;
  }
}

// src/uitheme.ts
function hslToHex2(h, s, l) {
  s /= 100;
  l /= 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return "#" + [f(0), f(8), f(4)].map((x) => Math.round(x * 255).toString(16).padStart(2, "0")).join("");
}
function themeFromColor(hex) {
  const { h, s } = hexToHsl(hex);
  const sat = Math.max(30, Math.min(85, s));
  const tint = s < 12 ? 0 : 1;
  return {
    accent: hex,
    secondary: hslToHex2((h + 40) % 360, sat * 0.8, 62),
    bgDark: hslToHex2(h, 26 * tint, 9),
    bgLight: hslToHex2(h, 34 * tint, 96),
    speech: hslToHex2(h, Math.min(90, sat + 10), 74),
    thoughts: hslToHex2((h + 28) % 360, 38 * tint, 72)
  };
}
function resolveUiTheme(s, charAura, moodColor) {
  if (!s.enabled || s.uiTheme === "off")
    return null;
  const pack = s.activePack ? packById(s.activePack) : undefined;
  let base = null;
  const fromCharacter = () => charAura ? { ...themeFromColor(charAura.color), source: "character", label: charAura.name ?? "Character" } : null;
  const fromPack = () => {
    if (pack?.theme === "character" || s.colorSource === "character")
      return fromCharacter();
    if (pack?.theme)
      return { ...pack.theme, source: "pack", label: pack.name };
    if (s.colorSource === "custom")
      return { ...themeFromColor(s.customColor), source: "custom", label: pack?.name ?? "Custom colour" };
    return null;
  };
  base = s.uiTheme === "character" ? fromCharacter() ?? fromPack() : fromPack();
  if (!base)
    return null;
  if (moodColor && s.moodTintUI)
    base = { ...base, accent: moodColor, speech: undefined };
  return { ...base, depth: s.uiThemeDepth };
}
function themeKey(spec) {
  return spec ? JSON.stringify([spec.accent, spec.secondary, spec.bgDark, spec.bgLight, spec.speech, spec.thoughts, spec.depth]) : "none";
}

// src/persist.ts
var VAULT_NAMES = ["settings", "achievements", "heartbeat", "moments"];
var LOCAL_PREFIX = "lumi_flair:vault:";
var FILE_TIMEOUT = 3000;
function envelope(raw) {
  if (raw === undefined || raw === null)
    return;
  if (typeof raw === "object" && !Array.isArray(raw) && "at" in raw && "data" in raw) {
    const at = Number(raw.at);
    return { at: Number.isFinite(at) ? at : 0, data: raw.data };
  }
  return { at: 0, data: raw };
}
function newest(...items) {
  let best;
  for (const it of items)
    if (it && (!best || it.at > best.at))
      best = it;
  return best;
}

class Vault {
  ctx;
  canWrite = { account: false, file: false, browser: true };
  loaded = false;
  current = new Map;
  req = 0;
  pendingLoads = new Map;
  pendingSaves = new Map;
  listeners = new Set;
  st = {
    saving: false,
    lastSavedAt: 0,
    layers: { account: "unknown", file: "unknown", browser: "unknown" }
  };
  onLateNewer = null;
  constructor(ctx) {
    this.ctx = ctx;
  }
  get status() {
    return { ...this.st, layers: { ...this.st.layers } };
  }
  onStatus(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
  emit() {
    const s = this.status;
    for (const fn of this.listeners) {
      try {
        fn(s);
      } catch {}
    }
  }
  setLayer(layer, state) {
    if (this.st.layers[layer] === state)
      return;
    this.st.layers[layer] = state;
    this.emit();
  }
  handleBackend(raw) {
    const msg = raw;
    if (msg?.type === "vault_data" && typeof msg.req === "number") {
      const resolve = this.pendingLoads.get(msg.req);
      if (resolve) {
        this.pendingLoads.delete(msg.req);
        resolve(msg.files ?? {});
      } else {
        this.canWrite.file = true;
        this.setLayer("file", "ok");
        for (const name of VAULT_NAMES) {
          const e = envelope(msg.files?.[name]);
          const cur = this.current.get(name);
          if (e && (!cur || e.at > cur.at)) {
            this.current.set(name, e);
            this.writeBrowser(name, e);
            this.writeAccount(name, e);
            this.onLateNewer?.(name, e.data);
          } else if (cur) {
            this.writeFile(name, cur);
          }
        }
      }
      return true;
    }
    if (msg?.type === "vault_saved") {
      if (msg.name) {
        const t = this.pendingSaves.get(msg.name);
        if (t)
          clearTimeout(t);
        this.pendingSaves.delete(msg.name);
      }
      this.setLayer("file", "ok");
      this.settle();
      return true;
    }
    if (msg?.type === "vault_error") {
      if (msg.name) {
        const t = this.pendingSaves.get(msg.name);
        if (t)
          clearTimeout(t);
        this.pendingSaves.delete(msg.name);
      }
      console.warn("[Lumi Flair] Could not write config file:", msg.reason);
      this.setLayer("file", "error");
      this.settle();
      return true;
    }
    return false;
  }
  requestFiles() {
    const id = ++this.req;
    return new Promise((resolve) => {
      this.pendingLoads.set(id, resolve);
      try {
        this.ctx.sendToBackend({ type: "vault_load", req: id, names: [...VAULT_NAMES] });
      } catch {
        this.pendingLoads.delete(id);
        resolve(null);
        return;
      }
      setTimeout(() => {
        if (this.pendingLoads.delete(id))
          resolve(null);
      }, FILE_TIMEOUT);
    });
  }
  retryFiles(left) {
    setTimeout(() => {
      if (this.canWrite.file || this.disposed)
        return;
      try {
        this.ctx.sendToBackend({ type: "vault_load", req: ++this.req, names: [...VAULT_NAMES] });
      } catch {}
      if (left > 1)
        this.retryFiles(left - 1);
    }, 4000);
  }
  disposed = false;
  dispose() {
    this.disposed = true;
    for (const t of this.pendingSaves.values())
      clearTimeout(t);
    this.pendingSaves.clear();
    this.listeners.clear();
  }
  readBrowser(name) {
    try {
      const raw = localStorage.getItem(LOCAL_PREFIX + name);
      this.setLayer("browser", "ok");
      return raw ? envelope(JSON.parse(raw)) : undefined;
    } catch {
      this.setLayer("browser", "unavailable");
      return;
    }
  }
  async readAccount(name) {
    if (!this.ctx.settings) {
      this.setLayer("account", "unavailable");
      return;
    }
    try {
      const v = await this.ctx.settings.get(`flair:${name}`);
      this.canWrite.account = true;
      this.setLayer("account", "ok");
      return envelope(v);
    } catch (err) {
      console.warn("[Lumi Flair] Could not read account settings", err);
      this.setLayer("account", "error");
      return;
    }
  }
  async loadAll() {
    const filesP = this.requestFiles();
    const account = await Promise.all(VAULT_NAMES.map((n) => this.readAccount(n)));
    const files = await filesP;
    if (files) {
      this.canWrite.file = true;
      this.setLayer("file", "ok");
    } else {
      this.setLayer("file", "unknown");
      this.retryFiles(5);
    }
    const out = {};
    VAULT_NAMES.forEach((name, i) => {
      const fromAccount = account[i];
      const fromFile = files ? envelope(files[name]) : undefined;
      const fromBrowser = this.readBrowser(name);
      const best = newest(fromAccount, fromFile, fromBrowser);
      if (!best)
        return;
      this.current.set(name, best);
      out[name] = best.data;
      if (!fromBrowser || fromBrowser.at < best.at)
        this.writeBrowser(name, best);
      if (this.canWrite.account && (!fromAccount || fromAccount.at < best.at))
        this.writeAccount(name, best);
      if (this.canWrite.file && (!fromFile || fromFile.at < best.at))
        this.writeFile(name, best);
    });
    if (this.current.size)
      this.st.lastSavedAt = Math.max(...[...this.current.values()].map((e) => e.at));
    this.loaded = true;
    this.emit();
    return out;
  }
  save(name, data) {
    if (!this.loaded) {
      console.warn("[Lumi Flair] Ignored a save made before the saved copy was read");
      return;
    }
    const e = { at: Date.now(), data };
    this.current.set(name, e);
    this.st.saving = true;
    this.emit();
    this.writeBrowser(name, e);
    this.writeAccount(name, e);
    this.writeFile(name, e);
    this.settle();
  }
  writeBrowser(name, e) {
    try {
      localStorage.setItem(LOCAL_PREFIX + name, JSON.stringify(e));
      this.setLayer("browser", "ok");
    } catch {
      this.setLayer("browser", "unavailable");
    }
  }
  accountInFlight = 0;
  writeAccount(name, e) {
    if (!this.ctx.settings || !this.canWrite.account)
      return;
    this.accountInFlight++;
    this.ctx.settings.set(`flair:${name}`, e).then(() => this.setLayer("account", "ok")).catch((err) => {
      console.warn("[Lumi Flair] Could not save to account settings", err);
      this.setLayer("account", "error");
    }).finally(() => {
      this.accountInFlight--;
      this.settle();
    });
  }
  writeFile(name, e) {
    if (!this.canWrite.file)
      return;
    try {
      this.ctx.sendToBackend({ type: "vault_save", name, data: e });
    } catch {
      this.setLayer("file", "error");
      return;
    }
    const prev = this.pendingSaves.get(name);
    if (prev)
      clearTimeout(prev);
    this.pendingSaves.set(name, setTimeout(() => {
      this.pendingSaves.delete(name);
      this.setLayer("file", "error");
      this.settle();
    }, 6000));
  }
  settle() {
    if (this.accountInFlight > 0 || this.pendingSaves.size > 0)
      return;
    if (this.st.saving) {
      this.st.saving = false;
      const ok = Object.values(this.st.layers).some((s) => s === "ok");
      if (ok)
        this.st.lastSavedAt = this.current.size ? Math.max(...[...this.current.values()].map((e) => e.at)) : Date.now();
      this.emit();
    }
  }
  snapshot() {
    const out = {};
    for (const [k, v] of this.current)
      out[k] = v.data;
    return out;
  }
}
function downloadBackup(data, version) {
  const payload = { lumiFlairBackup: 1, version, exportedAt: new Date().toISOString(), ...data };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `lumi-flair-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
async function pickBackup(ctx) {
  const files = await ctx.uploads.pickFile({ accept: [".json", "application/json"], maxSizeBytes: 4 * 1024 * 1024 });
  const f = files[0];
  if (!f)
    return null;
  try {
    const raw = JSON.parse(new TextDecoder().decode(f.bytes));
    if (!raw || typeof raw !== "object")
      return null;
    if (raw.lumiFlairBackup) {
      const out = {};
      for (const n of VAULT_NAMES)
        if (raw[n] && typeof raw[n] === "object")
          out[n] = raw[n];
      return out;
    }
    const e = envelope(raw);
    return e && typeof e.data === "object" ? { settings: e.data } : null;
  } catch {
    return null;
  }
}

// src/frontend.ts
var AI_FX_WINDOW_MS = 30000;
var SFX_MAX_PER_MESSAGE = 4;
var SFX_GAP_MS = 700;
var CARD2 = ':is([data-component="BubbleMessage"],[data-component="MinimalMessage"])[data-message-id]';
function setup(ctx) {
  ctx.deferReady();
  try {
    setLocale(ctx.locale?.get());
  } catch {}
  const vault = new Vault(ctx);
  const store = createSettingsStore(vault);
  bindCustomPacks(() => store.getBase().customPacks);
  const beats = createJsonStore(vault, "heartbeat", {});
  const badges = createJsonStore(vault, "achievements", normalizeAchievements(null));
  const pins = createJsonStore(vault, "moments", {});
  const disposers = [];
  let disposed = false;
  const on = (event, fn) => disposers.push(ctx.events.on(event, fn));
  const state = {
    chatId: null,
    characterId: null,
    characterName: null,
    mood: new Map,
    autoScene: new Map,
    tintPermission: false,
    injectPermission: false,
    panelsPermission: false,
    memoriesPermission: false,
    memoryNote: null,
    room: 14,
    saver: false,
    lastPrefsKey: "",
    lastTintKey: "",
    lastThemeKey: "",
    themeLabel: null,
    charAura: null,
    lastScene: "off",
    generating: null,
    recentGenerated: new Map,
    pendingAiFx: new Map,
    firedAiFx: new Set,
    shaken: new Set,
    sfxEpoch: 0,
    sfxFired: new Map,
    pendingSfx: new Map,
    sfxNextAt: 0
  };
  const director = new DirectorState;
  const statusListeners = new Set;
  const pinListeners = new Set;
  disposers.push(ctx.dom.addStyle([PANEL_CSS, CINEMATIC_CSS, CHOICES_CSS, HEARTBEAT_CSS, ACHIEVEMENT_CSS, MOMENT_CSS, PIN_CSS, INTRO_CSS, THEATER_CSS, TYPEWRITER_CSS, WELCOME_CSS, NAVIGATE_CSS, SOUND_WIDGET_CSS].join(`
`)));
  let removeMainCss = null;
  disposers.push(() => removeMainCss?.());
  const overlayWrap = ctx.dom.inject("body", '<div class="lf-overlay" aria-hidden="true"></div>');
  const overlay = overlayWrap.querySelector(".lf-overlay");
  const storyNav = new StoryNavigator(ctx, () => document.body, (id) => {
    setTimeout(() => animateMessage(id, "bloom", true), 380);
  });
  disposers.push(() => storyNav.destroy());
  const ambientEl = ctx.dom.createElement("canvas", { class: "lf-ambient" });
  const fxEl = ctx.dom.createElement("canvas", { class: "lf-fx" });
  overlay.append(fxEl);
  const probe = ctx.dom.createElement("span");
  probe.style.cssText = "position:absolute;width:0;height:0;overflow:hidden;color:var(--lf-c-user, var(--lf-c, var(--lumiverse-primary, #9370db)))";
  const probeChar = ctx.dom.createElement("span");
  probeChar.style.cssText = "position:absolute;width:0;height:0;overflow:hidden;color:var(--lf-c, var(--lumiverse-primary, #9370db))";
  overlay.append(probe, probeChar);
  const colorStyle = ctx.dom.createElement("style");
  const composerStyle = ctx.dom.createElement("style");
  const auraStyle = ctx.dom.createElement("style");
  const theaterStyle = ctx.dom.createElement("style");
  overlayWrap.append(colorStyle, composerStyle, auraStyle, theaterStyle);
  const theaterWrap = ctx.dom.inject("body", '<div class="lf-th-root"></div>');
  const introCard = new IntroCard(overlay);
  const speaker = new SpeakerChip(overlay);
  const fx = new FxCanvas(fxEl);
  const ambient = new AmbientCanvas(ambientEl);
  const sound = new SoundBoard;
  const sfx = new SfxBoard(() => sound.context());
  const scape = new Soundscape;
  scape.onState = () => notifyStatus();
  const lib = new SoundLibrary;
  scape.loader = (id, ac) => lib.source(id, ac);
  lib.onChange(() => {
    if (disposed)
      return;
    applySoundscape();
    warmUiSounds();
    notifyStatus();
  });
  const customFor = (slot) => {
    const id = store.get().customSounds[slot];
    return lib.has(id) ? id : undefined;
  };
  let warmKey = "";
  function warmUiSounds() {
    const s = store.get();
    if (!s.sound)
      return;
    const ids = UI_SOUNDS.map((u) => customFor(`ui:${u}`)).filter((x) => !!x);
    const key = ids.join(",");
    if (key === warmKey)
      return;
    warmKey = key;
    const ac = sound.context();
    if (ac)
      for (const id of ids)
        lib.source(id, ac).catch(() => {});
  }
  const chatOnScreen = () => !!document.querySelector('[data-component="ChatView"]');
  const soundWidget = new SoundWidget(ctx, {
    settings: () => store.get(),
    update: (patch) => store.update(patch),
    preview: (v) => scape.setVolume(v),
    view: () => ({
      state: scape.state,
      key: scape.playing,
      backgrounded: scape.backgrounded,
      offChat: !chatOnScreen(),
      custom: scape.alwaysPlaying ? lib.meta(scape.customPlaying[0] ?? "")?.name ?? null : null
    }),
    sceneLabel: (sc) => tr(SCENE_LABEL[sc] ?? sc),
    lightLabel: (li) => tr(LIGHT_LABEL[li] ?? li)
  });
  scape.onBackground = () => soundWidget.render();
  statusListeners.add(() => soundWidget.render());
  const cine = new Cinematic((t) => ctx.dom.createElement(t));
  cine.onThunder = () => scape.thunder(500 + Math.random() * 900);
  const auras = new AuraManager(auraStyle);
  auras.onChange = () => refreshCharAura();
  function refreshCharAura() {
    const latest = auras.enabled ? auras.latest() : null;
    const color = latest?.aura.color ?? null;
    if (color === state.charAura)
      return;
    state.charAura = color;
    applyColor();
    notifyStatus();
  }
  const choices = new ChoiceManager(ctx);
  disposers.push(() => {
    fx.destroy();
    ambient.destroy();
    sound.destroy();
    soundWidget.destroy();
    scape.destroy();
    lib.destroy();
    cine.destroy();
    choices.clear();
    introCard.destroy();
    speaker.destroy();
    theater.destroy();
    typewriter.stop();
    ctx.dom.uninject(theaterWrap);
    ctx.dom.uninject(overlayWrap);
  });
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const motionAllowed = () => !(store.get().respectReducedMotion && reducedMotion.matches);
  const onMotionChange = () => applyAll();
  reducedMotion.addEventListener?.("change", onMotionChange);
  disposers.push(() => reducedMotion.removeEventListener?.("change", onMotionChange));
  const touchScreen = () => typeof matchMedia === "function" && matchMedia("(pointer: coarse)").matches;
  const lightAnimating = () => cine.animating && !touchScreen();
  const perf = new PerfGovernor(() => store.get().perfGovernor && (ambient.current !== "off" || lightAnimating()), (saver) => {
    state.saver = saver;
    applyAmbient();
    applyCinematic();
    notifyStatus();
  });
  disposers.push(() => perf.stop());
  function rgbOf(el) {
    return parseComputedColor(getComputedStyle(el).color) ?? { r: 147, g: 112, b: 219 };
  }
  const accentColor = () => rgbOf(probe);
  const charColor = () => rgbOf(probeChar);
  const rgbCss = (c) => `rgb(${Math.round(c.r)}, ${Math.round(c.g)}, ${Math.round(c.b)})`;
  function hexToRgb(hex) {
    const n = parseInt(hex.slice(1), 16);
    return { r: n >> 16 & 255, g: n >> 8 & 255, b: n & 255 };
  }
  const hexOf = (c) => "#" + [c.r, c.g, c.b].map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("");
  function sendOrigin() {
    const input = document.querySelector('[data-component="InputArea"]');
    if (input) {
      const sendBtn = input.querySelector('button[class*="sendBtn"]');
      const r = (sendBtn ?? input).getBoundingClientRect();
      if (r.width > 0 && r.height > 0)
        return { x: r.left + r.width / 2, y: r.top };
    }
    return { x: window.innerWidth / 2, y: window.innerHeight - 90 };
  }
  function cardFor(messageId) {
    return document.querySelector(`:is([data-component="BubbleMessage"],[data-component="MinimalMessage"])[data-message-id="${CSS.escape(messageId)}"]`);
  }
  function messageOrigin(messageId) {
    if (messageId) {
      const r = cardFor(messageId)?.getBoundingClientRect();
      if (r && r.width > 0 && r.bottom > 0 && r.top < window.innerHeight) {
        return { x: r.left + r.width / 2, y: Math.max(40, Math.min(window.innerHeight - 40, r.top + Math.min(r.height / 2, 80))) };
      }
    }
    return viewportCenter();
  }
  function currentMood() {
    return state.chatId ? state.mood.get(state.chatId) ?? null : null;
  }
  function playSound(kind) {
    const s = store.get();
    if (!s.enabled || !s.sound)
      return;
    const id = customFor(`ui:${kind}`);
    const ac = id ? sound.context() : null;
    if (id && ac) {
      lib.source(id, ac).then((src) => src ? sound.playFile(src, s.soundVolume) : sound.play(kind, s.soundVolume)).catch(() => sound.play(kind, s.soundVolume));
      return;
    }
    sound.play(kind, s.soundVolume, moodPitch(currentMood()?.label ?? null));
  }
  function isActiveChat(chatId) {
    return !chatId || !state.chatId || chatId === state.chatId;
  }
  const running = new Map;
  function tempRule(key, css, ms) {
    running.get(key)?.();
    const remove = ctx.dom.addStyle(css);
    const timer = setTimeout(() => stop(), ms);
    const stop = () => {
      clearTimeout(timer);
      remove();
      running.delete(key);
    };
    running.set(key, stop);
  }
  disposers.push(() => {
    for (const stop of [...running.values()])
      stop();
  });
  function animateMessage(messageId, kind, force = false) {
    if (disposed || !force && !motionAllowed())
      return;
    const { css, durationMs } = entranceRule(messageId, kind);
    tempRule(`${kind}:${messageId}`, css, durationMs + 400);
  }
  function earn(track) {
    badges.whenLoaded(() => {
      const data = badges.get();
      const ids = track(data);
      const s = store.get();
      let changed = false;
      for (const id of ids) {
        if (data.unlocked[id])
          continue;
        const def = ACHIEVEMENTS.find((a) => a.id === id);
        if (!def)
          continue;
        data.unlocked[id] = Date.now();
        changed = true;
        if (s.enabled && s.achievements)
          showUnlock(def.icon, tr(def.title), tr(def.desc));
      }
      badges.set({ ...data });
      if (changed)
        notifyStatus();
    });
  }
  function unlock(ids) {
    earn(() => ids);
  }
  function showUnlock(icon, title, desc) {
    const el = ctx.dom.createElement("div", { class: "lf-unlock", role: "status" });
    const ico = ctx.dom.createElement("div", { class: "lf-unlock-ico" });
    ico.textContent = icon;
    const body = ctx.dom.createElement("div");
    const small = ctx.dom.createElement("small");
    small.textContent = tr("Achievement unlocked");
    const b = ctx.dom.createElement("b");
    b.textContent = title;
    const d = ctx.dom.createElement("span", { class: "lf-unlock-desc" });
    d.textContent = desc;
    body.append(small, b, d);
    el.append(ico, body);
    const existing = overlay.querySelectorAll(".lf-unlock").length;
    el.style.setProperty("--lf-slot", String(existing));
    overlay.appendChild(el);
    playSound("achievement");
    setTimeout(() => el.remove(), 5000);
  }
  function applyMain(s) {
    removeMainCss?.();
    removeMainCss = ctx.dom.addStyle(buildCss(s));
  }
  function applyColor() {
    const s = store.get();
    const mood = s.enabled && s.moodGlow ? currentMood() : null;
    const tod = s.enabled && s.timeOfDay ? timeOfDayTint() : null;
    colorStyle.textContent = colorVarsCss(s, mood?.color ?? null, tod) + `
:root { --lf-ambient-opacity: ${s.ambientOpacity}; --lf-room: ${state.room}px;${state.charAura ? ` --lf-char: ${state.charAura};` : ""} }`;
    syncTint();
  }
  function syncTint() {
    const s = store.get();
    const mood = currentMood();
    const themed = syncTheme();
    const want = !themed && s.enabled && s.moodTintUI && state.tintPermission && mood?.color ? mood.color : null;
    const key = want ?? "none";
    if (key === state.lastTintKey)
      return;
    if (!want && state.lastTintKey === "") {
      state.lastTintKey = key;
      return;
    }
    state.lastTintKey = key;
    ctx.sendToBackend({ type: "mood_tint", accent: want ? hexToHsl(want) : null });
  }
  function syncTheme() {
    const s = store.get();
    const mood = currentMood();
    const group = !!document.querySelector('[data-component="MessageList"][data-group-chat="true"]');
    const spec = state.tintPermission ? resolveUiTheme(s, state.charAura ? { color: state.charAura, name: group ? null : state.characterName } : null, s.moodGlow ? mood?.color ?? null : null) : null;
    state.themeLabel = spec ? spec.label : null;
    const key = themeKey(spec);
    if (key !== state.lastThemeKey) {
      if (spec || state.lastThemeKey !== "")
        ctx.sendToBackend({ type: "ui_theme", spec });
      state.lastThemeKey = key;
    }
    return !!spec;
  }
  function syncPrefs(force = false) {
    const s = store.get();
    const prefs = {
      type: "prefs",
      frequency: s.textFxFrequency,
      textEffects: s.enabled && s.textEffects,
      aiEffects: s.enabled && s.aiEffects,
      sceneDirector: s.enabled && s.sceneDirector,
      choices: s.enabled && s.choiceChips,
      sfx: s.enabled && s.aiSfx,
      autoInject: s.enabled && s.autoInject && (s.textEffects || s.aiEffects || s.sceneDirector || s.choiceChips || s.aiSfx),
      disabledFx: s.textFxOff
    };
    const key = JSON.stringify(prefs);
    if (!force && key === state.lastPrefsKey)
      return;
    state.lastPrefsKey = key;
    ctx.sendToBackend(prefs);
  }
  let ambientHost = null;
  let ambientChatView = null;
  function ensureAmbientHost() {
    const view = document.querySelector('[data-component="ChatView"]');
    if (!view) {
      if (ambientHost) {
        ctx.dom.uninject(ambientHost);
        ambientHost = null;
        ambientChatView = null;
      }
      return false;
    }
    if (view === ambientChatView && ambientHost?.isConnected && ambientEl.isConnected && cine.el.isConnected)
      return true;
    if (ambientHost)
      ctx.dom.uninject(ambientHost);
    ambientHost = ctx.dom.inject(view, '<div class="lf-ambient-host"></div>', "beforeend");
    const host = ambientHost.querySelector(".lf-ambient-host") ?? ambientHost;
    host.append(ambientEl, cine.el);
    ambientChatView = view;
    return true;
  }
  disposers.push(() => {
    if (ambientHost)
      ctx.dom.uninject(ambientHost);
  });
  function measureRoom() {
    const list = document.querySelector('[data-component="MessageList"]');
    if (!list || !list.clientWidth)
      return;
    const lr = list.getBoundingClientRect();
    const scale = lr.width / (list.offsetWidth || lr.width) || 1;
    const left = lr.left + list.clientLeft * scale;
    const right = left + list.clientWidth * scale;
    let gap = Infinity;
    const cards = list.querySelectorAll(CARD2);
    for (let i = 0;i < cards.length && i < 8; i++) {
      const r = cards[i].getBoundingClientRect();
      if (!r.width)
        continue;
      gap = Math.min(gap, r.left - left, right - r.right);
    }
    if (!Number.isFinite(gap))
      return;
    const room = Math.max(3, Math.min(28, Math.floor(gap / scale) - 1));
    if (room !== state.room) {
      state.room = room;
      applyColor();
    }
  }
  const onResize = () => measureRoom();
  window.addEventListener("resize", onResize);
  disposers.push(() => window.removeEventListener("resize", onResize));
  function sceneRaw() {
    const s = store.get();
    if (!s.enabled)
      return "off";
    const chatOverride = state.chatId ? s.chatScenes[state.chatId] : undefined;
    const auto = state.chatId ? state.autoScene.get(state.chatId) ?? null : null;
    const directed = s.sceneDirector ? director.get(state.chatId)?.scene : undefined;
    if (chatOverride && chatOverride !== "auto")
      return chatOverride;
    if (directed)
      return directed;
    if (chatOverride === "auto")
      return auto ?? "off";
    if (s.ambientAuto && auto)
      return auto;
    return s.ambientScene;
  }
  function chatLeaving() {
    return !!document.querySelector("[data-chat-chrome-leaving]");
  }
  function resolveScene() {
    if (!motionAllowed() || !ensureAmbientHost() || chatLeaving())
      return "off";
    return sceneRaw();
  }
  function resolveLight() {
    const s = store.get();
    const directed = s.sceneDirector ? director.get(state.chatId)?.light : undefined;
    return directed ?? s.lightDefault;
  }
  function applyAmbient() {
    const s = store.get();
    const scene = resolveScene();
    ambient.set(scene, s.ambientDensity * (state.saver || perf.saving ? 0.5 : 1));
    if (scene !== state.lastScene) {
      state.lastScene = scene;
      if (scene !== "off")
        earn((d) => onScene(d, scene));
    }
    if (scene !== "off" && s.perfGovernor)
      perf.start();
    applySoundscape();
  }
  function applyCinematic() {
    const s = store.get();
    const hostOk = ensureAmbientHost();
    const saving = state.saver || perf.saving;
    cine.set({
      enabled: s.enabled && s.cinematic && hostOk && !chatLeaving(),
      light: resolveLight(),
      vignette: s.vignette,
      grain: s.grain && !saving && motionAllowed(),
      lightning: s.lightning,
      noFlash: s.noFlash,
      motion: motionAllowed(),
      saver: saving
    });
    if (s.perfGovernor && lightAnimating())
      perf.start();
  }
  if (typeof MutationObserver !== "undefined") {
    let wasLeaving = false;
    const leaveWatch = new MutationObserver(() => {
      const leaving = chatLeaving();
      if (leaving === wasLeaving)
        return;
      wasLeaving = leaving;
      if (disposed)
        return;
      if (leaving)
        stopComposer();
      applyAmbient();
      applyCinematic();
    });
    leaveWatch.observe(document.body, { subtree: true, attributes: true, attributeFilter: ["data-chat-chrome-leaving"] });
    disposers.push(() => leaveWatch.disconnect());
  }
  function applySoundscape() {
    const s = store.get();
    scape.setBackground(s.soundUnfocused, s.soundUnfocusedLevel);
    const scene = sceneRaw();
    const light = resolveLight();
    const bed = {
      always: customFor("always"),
      scene: scene !== "off" ? customFor(`scene:${scene}`) : undefined,
      light: light !== "none" ? customFor(`light:${light}`) : undefined
    };
    bed.rev = [bed.always, bed.scene, bed.light].map((id) => id ? lib.meta(id)?.level ?? 1 : "").join(",");
    scape.set(s.enabled && s.soundscape && chatOnScreen(), scene, light, s.soundscapeVolume, bed);
    warmUiSounds();
    soundWidget.sync(s.enabled && s.soundWidget && state.panelsPermission);
  }
  function applyAll() {
    const s = store.get();
    applyMain(s);
    applyColor();
    applyAmbient();
    applyCinematic();
    syncInputBar();
    syncPrefs();
    auras.enabled = s.enabled && (s.auras || s.colorSource === "character" || s.uiTheme === "character" || packById(s.activePack)?.theme === "character");
    auras.paint = s.auras;
    auras.scan();
    choices.enabled = s.enabled && s.choiceChips;
    choices.sendOnPick = s.choiceSend;
    if (!choices.enabled)
      choices.clear();
    if (!s.enabled || !s.composerGlow)
      stopComposer();
    notifyStatus();
  }
  function status() {
    const mood = currentMood();
    const s = store.get();
    const dir = director.get(state.chatId);
    return {
      chatId: state.chatId,
      characterId: state.characterId,
      characterName: state.characterName,
      moodLabel: s.moodGlow && mood?.color ? mood.label : null,
      timeLabel: s.timeOfDay ? timeOfDayTint()?.label ?? "Day" : null,
      autoScene: state.chatId ? state.autoScene.get(state.chatId) ?? null : null,
      activeScene: ambient.current,
      tintPermission: state.tintPermission,
      injectPermission: state.injectPermission,
      panelsPermission: state.panelsPermission,
      memoriesPermission: state.memoriesPermission,
      memoryNote: state.memoryNote,
      directed: dir ? [dir.scene, dir.light, dir.mood].filter(Boolean).join(" · ") : null,
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
      soundscapeCustom: scape.customPlaying.map((id) => lib.meta(id)?.name ?? "").filter(Boolean),
      soundscapeAlways: scape.alwaysPlaying
    };
  }
  function notifyStatus() {
    for (const fn of pinListeners)
      fn();
    const st = status();
    for (const fn of statusListeners) {
      try {
        fn(st);
      } catch (err) {
        console.error("[Lumi Flair] status listener failed", err);
      }
    }
  }
  function closeHostDrawer() {
    try {
      if (!ctx.ui.events?.getDrawerState?.().open)
        return;
    } catch {
      return;
    }
    const tab = document.querySelector('[data-spindle-mount="sidebar"]')?.parentElement?.parentElement?.firstElementChild;
    if (tab instanceof HTMLButtonElement)
      tab.click();
  }
  const theater = new Theater({
    root: theaterWrap.querySelector(".lf-th-root"),
    style: theaterStyle,
    get: () => {
      const s = store.get();
      return { scale: s.theaterScale, speed: s.theaterSpeed, scroll: s.theaterScroll };
    },
    set: (patch) => store.update(patch),
    motion: motionAllowed,
    list: () => document.querySelector('[data-component="MessageList"]'),
    latest: () => {
      const id = ctx.messages.getLatestMessageId();
      return id ? cardFor(id) : null;
    },
    closeDrawer: closeHostDrawer,
    tr,
    changed: () => notifyStatus()
  });
  let keySrc = null;
  function typeKey(space) {
    const s = store.get();
    if (!s.enabled || !s.sound || !s.typewriterSound || document.hidden)
      return;
    const away = scape.backgrounded;
    if (away === "mute")
      return;
    const volume = s.soundVolume * 0.8 * (away === "dim" ? s.soundUnfocusedLevel : 1);
    const semis = moodPitch(currentMood()?.label ?? null);
    const id = customFor("ui:key");
    const ac = sound.context();
    if (id && ac && keySrc?.id !== id) {
      lib.source(id, ac).then((src) => {
        if (src)
          keySrc = { id, src };
      }).catch(() => {});
    }
    sound.key(volume, semis, space, id && keySrc?.id === id ? keySrc.src : undefined);
  }
  const typewriter = new Typewriter({
    get: () => {
      const s = store.get();
      return { on: s.enabled && s.typewriter, cps: s.typewriterCps };
    },
    motion: motionAllowed,
    content: (id) => [...document.querySelectorAll(`${CARD2}[data-part="streaming"] [data-component="MessageContent"]`)].at(-1) ?? (id ? cardFor(id)?.querySelector('[data-component="MessageContent"]') ?? null : null),
    list: () => document.querySelector('[data-component="MessageList"]'),
    key: typeKey
  });
  let introRun = 0;
  const isGroupChat = () => !!document.querySelector('[data-component="MessageList"][data-group-chat]');
  async function playIntroSound(id) {
    const s = store.get();
    if (!s.enabled || !s.sound || !lib.has(id) || document.hidden)
      return;
    const away = scape.backgrounded;
    if (away === "mute")
      return;
    const ac = sound.context();
    if (!ac)
      return;
    if (ac.state === "suspended")
      await Promise.race([ac.resume().catch(() => {}), new Promise((r) => setTimeout(r, 400))]);
    if (disposed || ac.state !== "running")
      return;
    const src = await lib.source(id, ac).catch(() => null);
    if (src && !disposed)
      sound.playFile(src, s.soundVolume * (away === "dim" ? s.soundUnfocusedLevel : 1), 8);
  }
  function showIntro(name, color, avatar) {
    const view = document.querySelector('[data-component="ChatView"]')?.getBoundingClientRect();
    const left = Math.max(0, view?.left ?? 0);
    const top = Math.max(0, view?.top ?? 0);
    const area = view ? { left, top, width: Math.min(window.innerWidth, view.right) - left, height: Math.min(window.innerHeight, view.bottom) - top } : null;
    introCard.show({ name, color, avatar, kicker: tr("A conversation with"), motion: motionAllowed(), area });
    const id = store.get().introSound;
    if (id)
      playIntroSound(id);
  }
  function startIntro(chatId) {
    const run = ++introRun;
    const t0 = performance.now();
    const attempt = () => {
      if (disposed || run !== introRun || state.chatId !== chatId)
        return;
      const s = store.get();
      if (!s.enabled || !s.intro || !s.welcomed)
        return;
      const waited = performance.now() - t0;
      const retry = () => {
        if (waited < 3200)
          setTimeout(attempt, 150);
      };
      if (!document.querySelector('[data-component="MessageList"]'))
        return retry();
      if (isGroupChat())
        return;
      const name = state.characterName;
      if (!name)
        return retry();
      const found = auras.enabled ? auras.latest() : null;
      if (!found && auras.enabled && waited < 1800)
        return retry();
      showIntro(name, found?.aura.color ?? state.charAura ?? hexOf(charColor()), found?.avatar ?? null);
    };
    setTimeout(attempt, 450);
  }
  function previewIntro() {
    const found = auras.enabled ? auras.latest() : null;
    showIntro(state.characterName || tr("Your character"), found?.aura.color ?? state.charAura ?? hexOf(charColor()), found?.avatar ?? null);
  }
  const speakerColors = new Map;
  const SPOT_KEY = "groupspot";
  let speakerRun = 0;
  let speakerGen = "";
  let spotOn = false;
  let speakerTurns = 0;
  let speakerTimer;
  let speakerHide;
  function chipPlace() {
    const list = document.querySelector('[data-component="MessageList"]')?.getBoundingClientRect();
    const input = document.querySelector('[data-component="InputArea"]')?.getBoundingClientRect();
    return {
      x: list && list.width > 0 ? list.left + list.width / 2 : window.innerWidth / 2,
      bottom: input && input.height > 0 ? window.innerHeight - input.top + 12 : 110
    };
  }
  const spotlightRule = (dim) => `:root [data-component="MessageList"][data-group-chat] ${CARD2}:not([data-part="streaming"]) { opacity: ${dim ? ".7" : "1"}; transition: opacity .3s ease; }`;
  function speakerStart(p) {
    const s = store.get();
    const name = (p.characterName ?? "").trim();
    if (disposed || !s.enabled || !s.introGroup || !name || !isActiveChat(p.chatId) || !isGroupChat())
      return;
    const gen = p.generationId ?? "";
    const total = p.total && p.total > 1 ? p.total : 0;
    if (gen && gen === speakerGen && speaker.showing && (!total || total === speakerTurns))
      return;
    speakerGen = gen;
    speakerTurns = total;
    const run = ++speakerRun;
    const id = p.characterId || name;
    const known = speakerColors.get(id);
    speaker.show({ name, color: known ?? hashColor(id), turn: (p.turn ?? 0) + 1, total, motion: motionAllowed(), ...chipPlace() });
    spotOn = true;
    tempRule(SPOT_KEY, spotlightRule(true), 120000);
    clearTimeout(speakerHide);
    speakerHide = setTimeout(speakerFinish, 120000);
    if (known || !auras.enabled)
      return;
    const t0 = performance.now();
    const poll = () => {
      if (disposed || run !== speakerRun)
        return;
      auras.scan();
      const waited = performance.now() - t0;
      const hit = auras.forSpeaker(name) ?? (waited > 250 ? auras.forStreaming() : null);
      if (hit) {
        speakerColors.set(id, hit.aura.color);
        speaker.setColor(hit.aura.color);
        return;
      }
      if (waited < 2400)
        speakerTimer = setTimeout(poll, 150);
    };
    clearTimeout(speakerTimer);
    poll();
  }
  function speakerFinish() {
    speakerRun++;
    speakerGen = "";
    speaker.hide(false);
    if (spotOn) {
      spotOn = false;
      tempRule(SPOT_KEY, spotlightRule(false), 450);
    }
  }
  function speakerEnd(delay = 700) {
    if (!speaker.showing)
      return;
    clearTimeout(speakerHide);
    speakerHide = setTimeout(speakerFinish, delay);
  }
  function speakerReset() {
    clearTimeout(speakerHide);
    clearTimeout(speakerTimer);
    speakerFinish();
    speaker.hide(true);
  }
  disposers.push(() => {
    clearTimeout(speakerHide);
    clearTimeout(speakerTimer);
  });
  function previewSpeaker() {
    const name = state.characterName || tr("Your character");
    const found = auras.enabled ? auras.latest() : null;
    const color = found?.aura.color ?? state.charAura ?? hashColor(name);
    speaker.show({ name, color, turn: 1, total: 3, motion: motionAllowed(), ...chipPlace() });
    clearTimeout(speakerHide);
    speakerHide = setTimeout(() => speaker.hide(false), 2600);
  }
  let nameRequest = 0;
  function checkActive() {
    const { chatId, characterId } = ctx.getActiveChat();
    if (chatId === state.chatId && characterId === state.characterId)
      return;
    const charChanged = characterId !== state.characterId;
    const chatChanged = chatId !== state.chatId;
    state.chatId = chatId;
    state.characterId = characterId;
    if (chatChanged) {
      choices.clear();
      speakerReset();
      typewriter.stop();
      introRun++;
      introCard.hide(false);
      if (chatId)
        startIntro(chatId);
    }
    if (charChanged) {
      state.characterName = null;
      const req = ++nameRequest;
      if (characterId) {
        ctx.characters.get(characterId).then((c) => {
          if (req !== nameRequest)
            return;
          const name = c?.name;
          state.characterName = typeof name === "string" ? name : null;
          notifyStatus();
        }).catch(() => {});
      }
    }
    store.setActiveCharacter(characterId);
    if (!chatId) {
      theater.exit();
      applyAmbient();
      applyCinematic();
      setTimeout(() => {
        if (disposed || state.chatId)
          return;
        applyColor();
        notifyStatus();
      }, 900);
      return;
    }
    applyColor();
    applyAmbient();
    applyCinematic();
    notifyStatus();
  }
  const pollTimer = setInterval(() => {
    checkActive();
    measureRoom();
    auras.scan();
    refreshCharAura();
    if (speaker.showing) {
      const at = chipPlace();
      speaker.place(at.x, at.bottom);
    }
    const view = document.querySelector('[data-component="ChatView"]');
    if (view !== ambientChatView || ambientHost && !ambientHost.isConnected) {
      applyAmbient();
      applyCinematic();
    }
  }, 1500);
  disposers.push(() => clearInterval(pollTimer));
  on("MESSAGE_DELETED", (raw) => {
    const p = raw ?? {};
    const gone = new Set([...p.messageIds ?? [], ...p.messageId ? [p.messageId] : []]);
    if (!gone.size)
      return;
    pins.whenLoaded(() => {
      const next = removePins(pins.get(), p.chatId, gone);
      if (next === pins.get())
        return;
      pins.set(next);
      notifyStatus();
    });
    beats.whenLoaded(() => {
      const all = beats.get();
      let changed = false;
      const next = {};
      for (const [chat, list] of Object.entries(all)) {
        if (p.chatId && chat !== p.chatId) {
          next[chat] = list;
          continue;
        }
        const kept = list.filter((x) => !gone.has(x.id));
        if (kept.length !== list.length)
          changed = true;
        next[chat] = kept;
      }
      if (changed) {
        beats.set(next);
        notifyStatus();
      }
    });
  });
  on("CHAT_SWITCHED", () => {
    storyNav.cancel();
    setTimeout(checkActive, 0);
  });
  on("CHAT_CHANGED", () => setTimeout(checkActive, 0));
  const todTimer = setInterval(() => {
    if (store.get().timeOfDay) {
      applyColor();
      notifyStatus();
    }
  }, 5 * 60000);
  disposers.push(() => clearInterval(todTimer));
  function screenEffect(effect) {
    const s = store.get();
    const list = document.querySelector('[data-component="MessageList"]');
    const r = list?.getBoundingClientRect();
    const center = r && r.width > 0 ? { x: r.left + r.width / 2, y: r.top + r.height * 0.45 } : undefined;
    if (effect === "blackhole" && s.cameraShake && !s.noFlash && motionAllowed()) {
      const body = document.querySelector('[data-component="ChatView"] [data-lumiverse-surface="chat-body"]');
      const b = body?.getBoundingClientRect();
      if (b && center && b.width > 0 && b.height > 0) {
        const ms = HOLE_TIMING.total * 1000;
        tempRule("warp", blackHoleWarpRule((center.x - b.left) / b.width * 100, (center.y - b.top) / b.height * 100, HOLE_TIMING), ms + 60);
      }
    }
    return { center, noFlash: s.noFlash };
  }
  function fireSendEffect(force = false) {
    const s = store.get();
    if (!force && (!s.enabled || s.sendEffect === "none" || !motionAllowed()))
      return;
    const effect = s.sendEffect === "none" ? "sparkle" : s.sendEffect;
    playSendEffect(fx, effect, sendOrigin(), accentColor(), s.sendIntensity * (state.saver ? 0.6 : 1), screenEffect(effect));
  }
  function burst(effect, origin, intensity = 1, color) {
    if (!motionAllowed())
      return;
    playSendEffect(fx, effect, origin, color ?? charColor(), intensity * (state.saver ? 0.6 : 1), screenEffect(effect));
  }
  function checkTriggers(text, origin) {
    const s = store.get();
    if (!s.enabled)
      return;
    const t = matchTrigger(text, parseTriggers(s.triggers));
    if (!t)
      return;
    burst(t.effect, origin, 1.2);
    playSound("sparkle");
  }
  function checkMilestone(chatId) {
    const s = store.get();
    if (!s.enabled || !s.milestones || !chatId || chatId !== state.chatId)
      return;
    setTimeout(() => {
      const count = ctx.messages.listMessageIds().length;
      if (!count)
        return;
      const base = store.getBase();
      let celebrated = base.celebrated[chatId];
      if (celebrated === undefined) {
        celebrated = milestoneAtOrBelow(Math.max(0, count - 2));
        store.patchSilently({ celebrated: { ...base.celebrated, [chatId]: celebrated } });
      }
      const m = milestoneAtOrBelow(count);
      if (m > celebrated) {
        store.patchSilently({ celebrated: { ...store.getBase().celebrated, [chatId]: m } });
        if (motionAllowed()) {
          playBanner(fx, `${m.toLocaleString()} ${tr("messages")} ✨`, charColor());
          burst("confetti", { x: window.innerWidth / 2, y: window.innerHeight * 0.9 }, 1.4);
        }
        playSound("fanfare");
        unlock(["milestone"]);
      }
    }, 350);
  }
  function startComposer(generationId) {
    const s = store.get();
    stopComposer();
    if (!s.enabled || !s.composerGlow)
      return;
    const startedAt = performance.now();
    const timer = setInterval(() => {
      const g = state.generating;
      if (!g)
        return;
      const now = performance.now();
      const secs = Math.max(0.25, (now - g.windowStart) / 1000);
      const rate = g.tokens / secs;
      g.tokens = 0;
      g.windowStart = now;
      composerStyle.textContent = composerActiveCss(Math.min(1, rate / 40));
      if (now - startedAt > 5 * 60000)
        stopComposer();
    }, 600);
    state.generating = { id: generationId, tokens: 0, windowStart: startedAt, timer };
    composerStyle.textContent = composerActiveCss(0);
  }
  function stopComposer() {
    if (state.generating)
      clearInterval(state.generating.timer);
    state.generating = null;
    composerStyle.textContent = "";
  }
  disposers.push(stopComposer);
  function setMood(chatId, label) {
    const color = moodColorFor(label, parseMoodMap(store.get().moodMap));
    state.mood.set(chatId, { label, color, at: Date.now() });
    earn((d) => onMood(d, chatId, label));
    if (chatId === state.chatId) {
      applyColor();
      notifyStatus();
    }
  }
  function recordBeat(chatId, messageId, content) {
    const ids = ctx.messages.listMessageIds();
    const i = ids.indexOf(messageId);
    const mood = state.mood.get(chatId);
    const fresh = mood && Date.now() - mood.at < 90000 ? mood : null;
    const lv = valenceForLabel(fresh?.label);
    const tv = valenceForText(content);
    const v = lv === null ? tv : lv * 0.65 + tv * 0.35;
    const p = { id: messageId, i: i < 0 ? ids.length : i, v, label: fresh?.label ?? "", color: fresh?.color ?? null, t: Date.now() };
    beats.whenLoaded(() => {
      beats.set(addPoint(beats.get(), chatId, p));
      notifyStatus();
    });
  }
  function refineLatestBeat(chatId, label, color) {
    beats.whenLoaded(() => {
      const list = beats.get()[chatId];
      const last = list?.at(-1);
      if (!last || Date.now() - last.t > 90000)
        return;
      const lv = valenceForLabel(label);
      if (lv === null)
        return;
      const updated = { ...last, v: lv * 0.65 + last.v * 0.35, label, color };
      beats.set(addPoint(beats.get(), chatId, updated));
      notifyStatus();
    });
  }
  function fireAiEffect(messageId, effect) {
    if (state.firedAiFx.has(messageId))
      return;
    state.firedAiFx.add(messageId);
    state.pendingAiFx.delete(messageId);
    const s = store.get();
    if (!s.enabled || !s.aiEffects)
      return;
    burst(effect, messageOrigin(messageId), 1.2);
    playSound("sparkle");
    unlock(["showstopper"]);
  }
  function playCue(cue, volume) {
    const id = customFor(`sfx:${cue}`);
    const ac = id ? sound.context() : null;
    if (id && ac) {
      lib.source(id, ac).then((src) => src ? sound.playFile(src, volume) : sfx.play(cue, volume)).catch(() => sfx.play(cue, volume));
      return;
    }
    sfx.play(cue, volume);
  }
  function fireSfx(messageId, cue, key) {
    let rec = state.sfxFired.get(messageId);
    if (!rec) {
      rec = { epoch: state.sfxEpoch, keys: new Set };
      state.sfxFired.set(messageId, rec);
      if (state.sfxFired.size > 200)
        state.sfxFired.delete(state.sfxFired.keys().next().value);
    }
    if (rec.keys.has(key) || rec.keys.size >= SFX_MAX_PER_MESSAGE)
      return;
    rec.keys.add(key);
    const now = Date.now();
    const at = Math.max(now, state.sfxNextAt);
    state.sfxNextAt = at + SFX_GAP_MS;
    setTimeout(() => {
      if (disposed)
        return;
      const s = store.get();
      if (!s.enabled || !s.aiSfx)
        return;
      const volume = s.sfxVolume * scape.focusLevel;
      if (volume > 0)
        playCue(cue, volume);
    }, at - now);
  }
  function handleSfx(messageId, cue, key, streaming) {
    const s = store.get();
    if (!s.enabled || !s.aiSfx || s.sfxVolume <= 0)
      return;
    let rec = state.sfxFired.get(messageId);
    if (streaming && rec && rec.epoch < state.sfxEpoch) {
      state.sfxFired.delete(messageId);
      rec = undefined;
    }
    if (rec?.keys.has(key))
      return;
    const at = state.recentGenerated.get(messageId);
    if (streaming || at !== undefined && Date.now() - at < AI_FX_WINDOW_MS) {
      fireSfx(messageId, cue, key);
      return;
    }
    const pending = state.pendingSfx.get(messageId) ?? { items: [], at: 0 };
    if (!pending.items.some((i) => i.key === key))
      pending.items.push({ cue, key });
    pending.at = Date.now();
    state.pendingSfx.set(messageId, pending);
    if (state.pendingSfx.size > 50)
      state.pendingSfx.delete(state.pendingSfx.keys().next().value);
  }
  function applyDirection(chatId, messageId, attrs) {
    const s = store.get();
    if (!s.enabled || !s.sceneDirector)
      return;
    const dir = parseDirection(attrs);
    if (!dir)
      return;
    const index = ctx.messages.listMessageIds().indexOf(messageId);
    if (!director.apply(chatId, index < 0 ? Number.MAX_SAFE_INTEGER : index, dir))
      return;
    if (dir.mood)
      setMood(chatId, dir.mood);
    unlock(["director"]);
    if (chatId === state.chatId) {
      applyAmbient();
      applyCinematic();
      notifyStatus();
    }
  }
  try {
    disposers.push(ctx.messages.registerTagInterceptor({ tagName: "flair", removeFromMessage: true }, (p) => {
      if (p.isUser || !p.messageId)
        return;
      const cue = cueName(p.attrs?.sfx);
      if (cue && isActiveChat(p.chatId))
        handleSfx(p.messageId, cue, p.fullMatch || cue, !!p.isStreaming);
      if (p.isStreaming)
        return;
      const chatId = p.chatId ?? state.chatId;
      if (chatId)
        applyDirection(chatId, p.messageId, p.attrs ?? {});
      const raw = (p.attrs?.effect || (p.attrs?.sfx !== undefined ? "" : p.content) || "").trim().toLowerCase();
      if (!raw || state.firedAiFx.has(p.messageId))
        return;
      const effect = BURST_EFFECTS.includes(raw) ? raw : "sparkle";
      const at = state.recentGenerated.get(p.messageId);
      if (at && Date.now() - at < AI_FX_WINDOW_MS)
        fireAiEffect(p.messageId, effect);
      else
        state.pendingAiFx.set(p.messageId, { effect, at: Date.now() });
    }));
    disposers.push(ctx.messages.registerTagInterceptor({ tagName: "flair-choice", removeFromMessage: true }, (p) => {
      if (p.isStreaming || p.isUser || !p.messageId)
        return;
      if (!store.get().enabled || !store.get().choiceChips)
        return;
      choices.add(p.messageId, p.content ?? "");
    }));
  } catch (err) {
    console.warn("[Lumi Flair] Tag interceptor unavailable", err);
  }
  choices.onPick = () => {
    earn((d) => {
      d.choices += 1;
      return d.choices >= 10 ? ["choices_10"] : [];
    });
    playSound("send");
  };
  on("MESSAGE_SENT", (raw) => {
    const p = raw;
    const s = store.get();
    if (!s.enabled || !p?.message?.is_user || !isActiveChat(p.chatId))
      return;
    choices.clear();
    fireSendEffect();
    playSound("send");
    if (p.message.id && s.userEntrance !== "none")
      animateMessage(p.message.id, s.userEntrance);
    checkTriggers(p.message.content, sendOrigin());
    checkMilestone(p.chatId ?? state.chatId ?? undefined);
    earn((d) => onSent(d));
  });
  on("GENERATION_STARTED", (raw) => {
    const p = raw;
    state.sfxEpoch++;
    if (!isActiveChat(p?.chatId) || p?.generationType === "impersonate")
      return;
    if (p?.generationType === "continue")
      choices.pause();
    else
      choices.clear();
    startComposer(p?.generationId ?? "unknown");
    if (p)
      speakerStart(p);
    typewriter.start(p?.generationType === "continue" ? p.targetMessageId ?? null : null);
  });
  on("GROUP_TURN_STARTED", (raw) => {
    const p = raw;
    if (p?.chatId)
      speakerStart({ ...p, turn: p.turnIndex, total: p.totalExpected });
  });
  on("GROUP_ROUND_COMPLETE", () => speakerEnd(300));
  on("STREAM_TOKEN_RECEIVED", (raw) => {
    const g = state.generating;
    if (!g)
      return;
    const p = raw;
    if (!p?.generationId || g.id === "unknown" || p.generationId === g.id)
      g.tokens++;
  });
  on("GENERATION_STOPPED", () => {
    stopComposer();
    speakerEnd(200);
    typewriter.end();
  });
  on("GENERATION_ENDED", (raw) => {
    const p = raw;
    if (!p?.generationId || !speakerGen || p.generationId === speakerGen)
      speakerEnd();
    if (!p?.error && p?.generationType !== "impersonate")
      typewriter.end();
    else
      typewriter.stop();
    if (!state.generating || !p?.generationId || state.generating.id === p.generationId || state.generating.id === "unknown") {
      stopComposer();
    }
    if (!p?.messageId || p.error || p.generationType === "impersonate")
      return;
    const now = Date.now();
    state.recentGenerated.set(p.messageId, now);
    for (const [id, t] of state.recentGenerated)
      if (now - t > AI_FX_WINDOW_MS)
        state.recentGenerated.delete(id);
    for (const [id, v] of state.pendingAiFx)
      if (now - v.at > AI_FX_WINDOW_MS)
        state.pendingAiFx.delete(id);
    for (const [id, v] of state.pendingSfx)
      if (now - v.at > AI_FX_WINDOW_MS)
        state.pendingSfx.delete(id);
    if (!isActiveChat(p.chatId))
      return;
    const s = store.get();
    if (!s.enabled)
      return;
    const messageId = p.messageId;
    const pendingCues = state.pendingSfx.get(messageId);
    state.pendingSfx.delete(messageId);
    if (pendingCues && s.aiSfx && s.sfxVolume > 0)
      for (const i of pendingCues.items)
        fireSfx(messageId, i.cue, i.key);
    if (s.characterEntrance !== "none")
      animateMessage(messageId, "bloom");
    playSound("receive");
    const pending = state.pendingAiFx.get(messageId);
    if (pending)
      fireAiEffect(messageId, pending.effect);
    checkTriggers(p.content, messageOrigin(messageId));
    checkMilestone(p.chatId);
    if (p.chatId)
      recordBeat(p.chatId, messageId, p.content);
    if (s.cameraShake && !s.noFlash && motionAllowed() && !state.shaken.has(messageId) && ["big", "shake"].some((fx) => !s.textFxOff.includes(fx) && new RegExp(`data-lf=["']${fx}["']`).test(p.content ?? ""))) {
      state.shaken.add(messageId);
      setTimeout(() => tempRule("camshake", cameraShakeRule(), 520), 120);
    }
    setTimeout(() => {
      auras.scan();
      if (!s.auras || state.firedAiFx.has(messageId))
        return;
      if (!document.querySelector('[data-component="MessageList"][data-group-chat]'))
        return;
      const aura = auras.forMessage(messageId);
      if (aura)
        burst(aura.burst, messageOrigin(messageId), 0.45, hexToRgb(aura.color));
    }, 250);
  });
  on("EXPRESSION_CHANGED", (raw) => {
    const p = raw;
    if (!p?.chatId || !p.label)
      return;
    setMood(p.chatId, p.label);
    refineLatestBeat(p.chatId, p.label, state.mood.get(p.chatId)?.color ?? null);
  });
  on("WORLD_INFO_ACTIVATED", (raw) => {
    const p = raw;
    if (!p?.chatId || !Array.isArray(p.entries))
      return;
    const scene = sceneFromEntries(p.entries);
    if (!scene)
      return;
    if (scene === "off")
      state.autoScene.delete(p.chatId);
    else
      state.autoScene.set(p.chatId, scene);
    if (p.chatId === state.chatId) {
      applyAmbient();
      notifyStatus();
    }
  });
  on("MESSAGE_SWIPED", (raw) => {
    const p = raw;
    if (p?.message?.id && isActiveChat(p.chatId))
      choices.swiped(p.message.id, p.message.content ?? "");
    const s = store.get();
    if (!s.enabled || s.swipeTransition === "none" || p?.action !== "navigated" || !isActiveChat(p.chatId))
      return;
    const id = p.message?.id;
    if (!id)
      return;
    if (s.swipeTransition === "fade")
      return animateMessage(id, "swipe-fade");
    const to = p.swipeId ?? p.message?.swipe_id ?? 0;
    const from = p.previousSwipeId ?? to;
    animateMessage(id, to >= from ? "swipe-left" : "swipe-right");
  });
  const coarse = window.matchMedia("(hover: none)");
  const onTap = (e) => {
    const s = store.get();
    if (e.pointerType !== "touch" || !s.enabled || !s.tapGlow || s.hoverStyle === "none" || !coarse.matches)
      return;
    const card = e.target?.closest?.(CARD2);
    const id = card?.getAttribute("data-message-id");
    if (id)
      tempRule("tapglow", tapGlowRule(id), 1400);
  };
  document.addEventListener("pointerdown", onTap, { capture: true, passive: true });
  disposers.push(() => document.removeEventListener("pointerdown", onTap, { capture: true }));
  let trail = { t: 0, x: 0, y: 0 };
  let trailColor = { at: -1e9, rgb: { r: 0, g: 0, b: 0 } };
  const onTrail = (e) => {
    const s = store.get();
    if (e.pointerType !== "mouse" || !s.enabled || s.cursorTrail === "none" || !motionAllowed())
      return;
    const dt = e.timeStamp - trail.t;
    const dx = e.clientX - trail.x, dy = e.clientY - trail.y;
    if (dt < 16 || dx * dx + dy * dy < 16)
      return;
    const v = dt < 120 ? { x: dx / dt * 1000, y: dy / dt * 1000 } : { x: 0, y: 0 };
    trail = { t: e.timeStamp, x: e.clientX, y: e.clientY };
    if (e.timeStamp - trailColor.at > 1000)
      trailColor = { at: e.timeStamp, rgb: accentColor() };
    playTrail(fx, s.cursorTrail, { x: e.clientX, y: e.clientY }, v, trailColor.rgb, state.saver, s.trailLength);
  };
  document.addEventListener("pointermove", onTrail, { capture: true, passive: true });
  disposers.push(() => document.removeEventListener("pointermove", onTrail, { capture: true }));
  async function portraitFor(card, avatarSrc) {
    if (!card || !avatarSrc || card.dataset.part === "user" || !state.characterId || isGroupChat())
      return null;
    if (!/\/images\/[^/?#]+/.test(avatarSrc))
      return null;
    try {
      const c = await ctx.characters.get(state.characterId);
      const crop = c?.extensions?.avatar_crop_image_id;
      if (typeof crop !== "string" || !/^[A-Za-z0-9_-]{1,80}$/.test(crop))
        return null;
      return avatarSrc.replace(/\/images\/[^/?#]+(\?[^#]*)?/, `/images/${crop}?size=lg`);
    } catch {
      return null;
    }
  }
  async function makeMoment(messageId, picked = null) {
    if (!messageId)
      return;
    const card = cardFor(messageId);
    let name = "";
    let text = "";
    try {
      const msg = await ctx.messages.get?.(messageId);
      if (msg) {
        name = msg.name;
        text = msg.content;
      }
    } catch {}
    if (!text && card)
      text = (card.querySelector('[data-component="MessageContent"]') ?? card).innerText;
    if (!name)
      name = (card?.querySelector('[class*="_name_"]')?.textContent ?? "").trim() || (state.characterName ?? "Lumiverse");
    const avatarSrc = card?.querySelector("img[src]")?.getAttribute("src") ?? null;
    const portraitSrc = await portraitFor(card, avatarSrc);
    const aura = auras.forMessage(messageId);
    await showMomentCard(ctx, { name, text: plainText(text), avatarSrc, portraitSrc, color: aura?.color ?? rgbCss(charColor()), date: new Date }, () => unlock(["shutterbug"]), picked);
  }
  function selectedIn(messageId) {
    const raw = selectionIn(messageId);
    const t = raw ? excerpt(raw) : "";
    return t.length > 1 ? t : null;
  }
  function selectionIn(messageId) {
    const sel = window.getSelection();
    const card = cardFor(messageId);
    if (!sel || sel.isCollapsed || !card || !card.contains(sel.anchorNode) || !card.contains(sel.focusNode))
      return null;
    const t = sel.toString().trim();
    return t.length > 1 ? t : null;
  }
  function pinMessage(messageId, picked = null) {
    const chatId = state.chatId ?? ctx.getActiveChat()?.chatId ?? null;
    if (!messageId || !chatId)
      return;
    const line = picked ?? selectedIn(messageId);
    const card = cardFor(messageId);
    const user = card?.getAttribute("data-part") === "user";
    const body = card?.querySelector('[data-component="MessageContent"]') ?? card;
    const text = line ?? excerpt(body?.innerText ?? "");
    const name = card?.querySelector('[class*="_name_"]')?.textContent?.trim();
    const ids = ctx.messages.listMessageIds();
    const at = ids.indexOf(messageId);
    const aura = auras.forMessage(messageId);
    pins.whenLoaded(() => {
      const all = pins.get();
      if (isPinned(all, chatId, messageId) && !line) {
        pins.set(removePins(all, chatId, new Set([messageId])));
      } else {
        if (!text)
          return;
        const pin = {
          id: messageId,
          i: at < 0 ? ids.length : at,
          text,
          whole: !line,
          who: name || (user ? "" : state.characterName ?? ""),
          user,
          color: aura?.color ?? null,
          t: Date.now()
        };
        pins.set(setPin(all, chatId, pin));
        if (store.get().pinMemory && state.memoriesPermission)
          remember(chatId, [pin]);
      }
      notifyStatus();
    });
  }
  const memoryWaits = new Map;
  let memoryReq = 0;
  function sendPinsToMemory(chatId, list) {
    const items = list.filter((p) => p.who).map((p) => ({ who: p.who, text: excerpt(p.text, PIN_MEMORY_MAX) }));
    if (!items.length)
      return Promise.resolve({ ok: true, saved: 0, reason: "unnamed" });
    const req = ++memoryReq;
    return new Promise((resolve) => {
      const done = (r) => {
        clearTimeout(timer);
        memoryWaits.delete(req);
        resolve(r);
      };
      const timer = setTimeout(() => done({ ok: false, saved: 0, reason: "no answer" }), 15000);
      memoryWaits.set(req, done);
      ctx.sendToBackend({ type: "pin_memory", req, chatId, items });
    });
  }
  async function remember(chatId, list) {
    const r = await sendPinsToMemory(chatId, list);
    if (!r.ok)
      console.warn("[Lumi Flair] Saving pins to memory failed:", r.reason);
    state.memoryNote = !r.ok ? tr("Couldn’t save to Lumiverse memory.") : r.saved ? tr("Saved to Lumiverse memory.") : list.length ? tr("Nothing to save: those pins have no speaker name.") : null;
    notifyStatus();
  }
  disposers.push(() => memoryWaits.clear());
  async function jumpToPin(pin) {
    const res = await storyNav.jump(pin.id);
    if (res === "missing" && state.chatId) {
      pins.whenLoaded(() => {
        pins.set(removePins(pins.get(), state.chatId ?? undefined, new Set([pin.id])));
        notifyStatus();
      });
    }
    return res;
  }
  try {
    const ui = ctx.ui;
    const CAM = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="3.5"/></svg>';
    const off = ui.registerDomDecorator?.({
      mount: "message_actions",
      render: (root, rctx) => {
        const id = /^message:(.+):actions$/.exec(rctx.scope)?.[1];
        if (!id)
          return;
        const star = document.createElement("button");
        star.type = "button";
        star.className = "lf-moment-btn lf-pin-btn";
        star.innerHTML = STAR_SVG;
        let picked = null;
        const syncStar = () => {
          const on = isPinned(pins.get(), state.chatId, id);
          if (star.dataset.on === (on ? "1" : "0"))
            return;
          star.dataset.on = on ? "1" : "0";
          star.setAttribute("aria-pressed", String(on));
          star.title = tr(on ? "Unpin this moment" : "Pin this moment");
          star.setAttribute("aria-label", tr(on ? "Remove from favourite moments" : "Pin as a favourite moment"));
        };
        star.addEventListener("pointerdown", () => picked = selectedIn(id));
        star.addEventListener("click", (e) => {
          e.stopPropagation();
          pinMessage(id, picked);
          picked = null;
        });
        syncStar();
        pinListeners.add(syncStar);
        const b = document.createElement("button");
        b.type = "button";
        b.className = "lf-moment-btn";
        b.title = tr("Moment Card");
        b.setAttribute("aria-label", tr("Make a Moment Card"));
        b.innerHTML = CAM;
        let shot = null;
        b.addEventListener("pointerdown", () => shot = selectionIn(id));
        b.addEventListener("click", (e) => {
          e.stopPropagation();
          makeMoment(id, shot ?? selectionIn(id));
          shot = null;
        });
        const th = document.createElement("button");
        th.type = "button";
        th.className = "lf-moment-btn";
        th.title = tr("Read in theater mode");
        th.setAttribute("aria-label", tr("Read from here in theater mode"));
        th.innerHTML = THEATER_ICON;
        th.addEventListener("click", (e) => {
          e.stopPropagation();
          theater.enter(cardFor(id));
        });
        root.append(star, b, th);
        return () => {
          pinListeners.delete(syncStar);
          star.remove();
          b.remove();
          th.remove();
        };
      }
    });
    if (off)
      disposers.push(off);
  } catch (err) {
    console.warn("[Lumi Flair] Message action decorator unavailable", err);
  }
  function lookTheme(s) {
    const active = packById(s.activePack);
    if (active?.theme)
      return active.theme;
    if (s.colorSource === "character")
      return "character";
    if (s.colorSource === "custom")
      return themeFromColor(s.customColor);
    return;
  }
  function addCustomPack(pack, source) {
    const base = store.getBase();
    const same = base.customPacks.find((p) => p.name.toLowerCase() === pack.name.toLowerCase());
    const id = same?.id ?? `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const stored = { id, name: pack.name, tagline: pack.tagline, swatch: pack.swatch, settings: pack.settings, theme: pack.theme, source, at: Date.now() };
    const list = same ? base.customPacks.map((p) => p.id === id ? stored : p) : [...base.customPacks, stored].slice(-MAX_CUSTOM_PACKS);
    store.update({ customPacks: list });
    applyPack(id);
  }
  function applyPack(id) {
    const pack = packById(id);
    if (!pack)
      return;
    store.update({ ...pack.settings, ...pack.extra, activePack: id });
    unlock(["packrat"]);
    setTimeout(() => fireSendEffect(true), 150);
  }
  disposers.push(ctx.onBackendMessage((raw) => {
    if (vault.handleBackend(raw))
      return;
    const msg = raw;
    if (msg?.type === "command")
      runCommand(msg.id);
    const tr2 = raw;
    if (tr2?.type === "theme_result" && !tr2.ok)
      console.warn("[Lumi Flair] Lumiverse theme matching unavailable:", tr2.reason);
    if (msg?.type === "pin_memory_result")
      memoryWaits.get(msg.req)?.(msg);
    if (msg?.type === "tint_result" && !msg.ok) {
      console.warn("[Lumi Flair] Mood UI tint unavailable:", msg.reason);
    }
  }));
  function cycle(list, current) {
    return list[(list.indexOf(current) + 1) % list.length];
  }
  let panel = null;
  function runCommand(id) {
    const s = store.get();
    switch (id) {
      case "toggle":
        return store.update({ enabled: !s.enabled });
      case "next-effect": {
        const next = cycle(SEND_EFFECTS, s.sendEffect);
        store.update({ sendEffect: next });
        if (next !== "none")
          fireSendEffect(true);
        return;
      }
      case "preview":
        return fireSendEffect(true);
      case "spotlight":
        return store.update({ spotlight: !s.spotlight });
      case "next-scene":
        return store.update({ ambientScene: cycle(SCENES, s.ambientScene) });
      case "scene-off":
        if (state.chatId)
          store.update({ chatScenes: { ...store.getBase().chatScenes, [state.chatId]: "off" } });
        else
          store.update({ ambientScene: "off" });
        return;
      case "sound":
        return store.update({ sound: !s.sound });
      case "soundscape":
        return store.update({ soundscape: !s.soundscape });
      case "next-pack": {
        const ids = allPacks().map((p) => p.id);
        return applyPack(cycle(ids, ids.includes(s.activePack) ? s.activePack : ids[ids.length - 1]));
      }
      case "moment":
        return void makeMoment(ctx.messages.getLatestMessageId());
      case "pin":
        return pinMessage(ctx.messages.getLatestMessageId());
      case "intro":
        return previewIntro();
      case "theater":
        return theater.toggle();
      case "welcome":
        return openWelcome();
      case "open":
        return panel?.activate();
    }
  }
  const inputActions = {};
  const SPOT_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
  const FLAIR_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9z"/></svg>';
  try {
    inputActions.spotlight = ctx.ui.registerInputBarAction({ id: "spotlight", label: tr("Spotlight mode"), subtitle: tr("Off"), iconSvg: SPOT_ICON });
    disposers.push(inputActions.spotlight.onClick(() => runCommand("spotlight")));
    inputActions.flair = ctx.ui.registerInputBarAction({ id: "flair", label: tr("Flair effects"), subtitle: tr("On"), iconSvg: FLAIR_ICON });
    disposers.push(inputActions.flair.onClick(() => runCommand("toggle")));
    inputActions.theater = ctx.ui.registerInputBarAction({ id: "theater", label: tr("Theater mode"), subtitle: tr("Hide the interface and read"), iconSvg: THEATER_ICON });
    disposers.push(inputActions.theater.onClick(() => runCommand("theater")));
    disposers.push(() => {
      inputActions.spotlight?.destroy();
      inputActions.flair?.destroy();
      inputActions.theater?.destroy();
    });
  } catch (err) {
    console.warn("[Lumi Flair] Input bar actions unavailable", err);
  }
  function syncInputBar() {
    const s = store.get();
    inputActions.spotlight?.setSubtitle(s.spotlight ? tr("On — other messages dim on hover") : tr("Off"));
    inputActions.flair?.setSubtitle(s.enabled ? tr("On") : tr("Off"));
  }
  const hasPerm = (perm) => perm === "interceptor" ? state.injectPermission : perm === "app_manipulation" ? state.tintPermission : perm === "memories" ? state.memoriesPermission : state.panelsPermission;
  function adoptGranted(granted) {
    state.tintPermission = granted.includes("app_manipulation");
    state.injectPermission = granted.includes("interceptor");
    state.panelsPermission = granted.includes("ui_panels");
    state.memoriesPermission = granted.includes("memories");
  }
  async function requestPermission(perm, reason) {
    try {
      adoptGranted(await ctx.permissions.request([perm], { reason }));
    } catch {}
    syncPrefs(true);
    syncTint();
    applySoundscape();
    notifyStatus();
    return hasPerm(perm);
  }
  const requestInject = () => requestPermission("interceptor", tr("Lumi Flair adds a short note to each prompt so the AI uses text effects, directs scenes and offers choices."));
  const requestTint = () => requestPermission("app_manipulation", tr("Lumi Flair restyles Lumiverse’s colours to match your Flair Pack, the speaking character or their mood. Your saved theme is never changed — switching it off restores it."));
  const requestMemories = () => requestPermission("memories", tr("Lumi Flair adds the moments you pin to Lumiverse’s memory as short facts about whoever said them, so the AI can remember them. It only ever adds, and only while this is switched on in Flair."));
  const requestPanels = () => requestPermission("ui_panels", tr("Lumi Flair shows a small floating volume control for the ambient soundscape. You can drag it anywhere and turn it off in Flair’s Sound settings."));
  let preview = null;
  function stopPreview() {
    const p = preview;
    if (!p)
      return;
    preview = null;
    clearTimeout(p.timer);
    p.el.pause();
    p.el.removeAttribute("src");
    p.el.load();
    p.done();
  }
  disposers.push(stopPreview);
  const soundActions = {
    list: () => lib.list(),
    has: (id) => lib.has(id),
    saved: () => lib.saved,
    upload: async () => {
      const added = [];
      const errors = [];
      let files = [];
      try {
        files = await ctx.uploads.pickFile({ accept: SOUND_ACCEPT, multiple: true });
      } catch (err) {
        errors.push(err instanceof Error ? err.message : String(err));
      }
      for (const f of files) {
        try {
          added.push((await lib.add(f)).name);
        } catch (err) {
          errors.push(err instanceof Error ? err.message : String(err));
        }
      }
      return { added, errors };
    },
    remove: (id) => lib.remove(id),
    setLevel: (id, level) => void lib.update(id, { level }),
    preview: (id, onEnd) => {
      stopPreview();
      lib.url(id).then((url) => {
        if (!url)
          return onEnd();
        const el = new Audio(url);
        el.volume = Math.min(1, 0.8 * (lib.meta(id)?.level ?? 1));
        const p = { el, done: onEnd, timer: setTimeout(() => stopPreview(), 20000) };
        preview = p;
        el.onended = () => preview === p && stopPreview();
        el.play().catch(() => preview === p && stopPreview());
      });
    },
    stopPreview,
    onChange: (fn) => lib.onChange(fn)
  };
  let welcomeOpen = false;
  function openWelcome() {
    if (welcomeOpen)
      return;
    welcomeOpen = true;
    try {
      showWelcome(ctx, {
        applyPack,
        activePack: () => store.get().activePack,
        requestInject,
        requestTint,
        hasInject: () => state.injectPermission,
        themeOn: () => state.tintPermission && store.get().uiTheme !== "off",
        enableTheme: async () => {
          if (!state.tintPermission && !await requestTint())
            return false;
          if (store.get().uiTheme === "off")
            store.update({ uiTheme: "pack" });
          return true;
        },
        hasTint: () => state.tintPermission,
        enableSound: () => store.update({ sound: true, soundscape: true }),
        soundOn: () => store.get().sound && store.get().soundscape,
        done: () => {
          welcomeOpen = false;
          if (!store.get().welcomed)
            store.update({ welcomed: true });
        }
      });
    } catch (err) {
      welcomeOpen = false;
      console.warn("[Lumi Flair] Welcome modal unavailable", err);
    }
  }
  ctx.permissions.getGranted().then((granted) => {
    adoptGranted(granted);
    syncTint();
    syncPrefs(true);
    applySoundscape();
    notifyStatus();
  }).catch(() => {});
  const flushAll = () => {
    store.flush();
    beats.flush();
    badges.flush();
    pins.flush();
  };
  const onHide = () => document.visibilityState === "hidden" && flushAll();
  window.addEventListener("pagehide", flushAll);
  document.addEventListener("visibilitychange", onHide);
  disposers.push(() => {
    window.removeEventListener("pagehide", flushAll);
    document.removeEventListener("visibilitychange", onHide);
  });
  function adoptSaved(saved, save) {
    if (saved.heartbeat)
      beats.hydrate(saved.heartbeat);
    if (saved.achievements) {
      badges.hydrate(normalizeAchievements(saved.achievements));
      if (save)
        badges.set(badges.get());
    }
    if (saved.heartbeat && save)
      beats.set(beats.get());
    if (saved.moments) {
      pins.hydrate(normalizePins(saved.moments));
      if (save)
        pins.set(pins.get());
    }
    if (saved.settings)
      store.adopt(saved.settings, save);
    notifyStatus();
  }
  vault.onLateNewer = (name, data) => {
    if (!disposed)
      adoptSaved({ [name]: data }, false);
  };
  vault.loadAll().then((saved) => {
    store.hydrate(saved.settings);
    beats.hydrate(saved.heartbeat);
    badges.hydrate(normalizeAchievements(saved.achievements));
    pins.hydrate(normalizePins(saved.moments));
  }).then(() => {
    if (disposed)
      return;
    checkActive();
    applyAll();
    store.subscribe(() => applyAll());
    store.subscribe(() => theater.refresh());
    panel = mountPanel(ctx, store, {
      previewSend: () => fireSendEffect(true),
      previewHover: () => {
        const id = ctx.messages.getLatestMessageId();
        if (!id)
          return;
        running.get(`bloom:${id}`)?.();
        requestAnimationFrame(() => requestAnimationFrame(() => animateMessage(id, "bloom", true)));
      },
      previewLightning: () => {
        if (!cine.el.isConnected)
          applyCinematic();
        cine.flash();
      },
      testSound: () => {
        const s = store.get();
        sound.play("receive", s.soundVolume || 0.4, moodPitch(currentMood()?.label ?? null));
        setTimeout(() => sound.play("send", s.soundVolume || 0.4), 650);
      },
      previewSfx: (cue) => playCue(cue, store.get().sfxVolume || 0.5),
      exportTheme: () => exportThemePack(ctx, store.get()),
      requestTintPermission: requestTint,
      requestInjectPermission: requestInject,
      requestPanelsPermission: requestPanels,
      sounds: soundActions,
      applyPack,
      exportPack: () => {
        const s = store.get();
        exportPack(packFromLook(packById(s.activePack)?.name ?? tr("My Flair Pack"), s, lookTheme));
      },
      importPack: async () => {
        const pack = await importPack(ctx);
        if (!pack)
          return null;
        addCustomPack(pack, "imported");
        return pack.name;
      },
      savePack: (name) => {
        const s = store.get();
        addCustomPack(packFromLook(name.trim().slice(0, 60) || tr("My Flair Pack"), s, lookTheme), "saved");
      },
      deletePack: (id) => {
        const s = store.getBase();
        store.update({
          customPacks: s.customPacks.filter((p) => p.id !== id),
          ...s.activePack === id ? { activePack: "" } : {}
        });
      },
      momentLatest: () => makeMoment(ctx.messages.getLatestMessageId()),
      pinLatest: () => pinMessage(ctx.messages.getLatestMessageId()),
      previewIntro,
      previewSpeaker,
      enterTheater: () => theater.enter(),
      previewTypewriter: (el) => typewriter.preview(el),
      typewriterSupported: () => typewriter.supported,
      unpin: (id) => {
        const chatId = state.chatId;
        if (!chatId)
          return;
        pins.whenLoaded(() => {
          pins.set(removePins(pins.get(), chatId, new Set([id])));
          notifyStatus();
        });
      },
      jumpToPin,
      savePinsToMemory: async () => {
        if (!state.memoriesPermission && !await requestMemories())
          return;
        const chatId = state.chatId;
        if (chatId)
          await remember(chatId, pins.get()[chatId] ?? []);
      },
      requestMemoriesPermission: requestMemories,
      jumpTo: async (p) => {
        const res = await storyNav.jump(p.id);
        if (res === "missing" && state.chatId) {
          const all = beats.get();
          const list = all[state.chatId];
          if (list?.some((x) => x.id === p.id)) {
            beats.set({ ...all, [state.chatId]: list.filter((x) => x.id !== p.id) });
            notifyStatus();
          }
        }
        return res;
      },
      openWelcome,
      backupSettings: () => {
        flushAll();
        downloadBackup({ ...vault.snapshot(), settings: store.getBase(), achievements: badges.get(), heartbeat: beats.get(), moments: pins.get() }, ctx.manifest?.version ?? "");
      },
      restoreSettings: async () => {
        const saved = await pickBackup(ctx);
        if (!saved || !Object.keys(saved).length)
          return false;
        adoptSaved(saved, true);
        return true;
      },
      vaultStatus: () => vault.status,
      onVaultStatus: (fn) => vault.onStatus(fn),
      status,
      onStatus: (fn) => {
        statusListeners.add(fn);
        return () => statusListeners.delete(fn);
      }
    });
    if (!store.get().welcomed)
      setTimeout(() => !disposed && openWelcome(), 1200);
  }).catch((err) => console.error("[Lumi Flair] setup failed", err)).finally(() => ctx.ready());
  return () => {
    disposed = true;
    flushAll();
    vault.dispose();
    if (state.lastTintKey && state.lastTintKey !== "none")
      ctx.sendToBackend({ type: "mood_tint", accent: null });
    if (state.lastThemeKey && state.lastThemeKey !== "none")
      ctx.sendToBackend({ type: "ui_theme", spec: null });
    panel?.destroy();
    for (const d of disposers.splice(0).reverse()) {
      try {
        d();
      } catch {}
    }
  };
}
export {
  setup
};
