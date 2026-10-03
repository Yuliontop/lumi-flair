// @bun
// src/backend.ts
var DEFAULT_PREFS = { frequency: "every", textEffects: true, aiEffects: true, sceneDirector: true, choices: true, autoInject: true, disabledFx: [] };
var MARKER = "[Lumi Flair";
var EFFECTS = [
  ["shake", "shouting, fear, anger, trembling, impacts"],
  ["whisper", "whispers, asides, secrets, quiet thoughts"],
  ["glow", "magic, important names, revelations"],
  ["rainbow", "joy, wonder, delight, excitement"],
  ["pulse", "heartbeat, tension, longing, nervousness"],
  ["big", "loud exclamations, sound effects"],
  ["typewriter", "slow, deliberate words (short phrases only)"],
  ["fade", "drifting thoughts, memories, dreams"],
  ["glitch", "distortion, the uncanny, broken machines, corrupted magic"],
  ["flicker", "failing lights, ghosts, unstable things"]
];
var KNOWN_FX = new Set(EFFECTS.map(([fx]) => fx));
function effectList(disabled) {
  return EFFECTS.filter(([fx]) => !disabled.includes(fx)).map(([fx, use]) => `<span data-lf="${fx}">\u2026</span> ${use}`).join(`
`);
}
var HOW_OFTEN = {
  every: "Use them in EVERY reply \u2014 aim for 3 to 6 styled phrases per message, especially on spoken dialogue, sound effects and emotional beats. A reply without any styled phrase is incomplete.",
  often: "Use them in most replies \u2014 usually 1 to 3 styled phrases where they fit the emotion.",
  sparing: "Use them sparingly \u2014 at most 2 per reply, only where they add real emphasis."
};
function buildInstructions(p) {
  const parts = [];
  const list = effectList(p.disabledFx);
  if (p.textEffects && list) {
    parts.push(`${MARKER} \u2014 expressive text] Make the characters' voices feel alive by styling short phrases with these inline effect spans, picking whichever matches the emotion (use ONLY these \u2014 no other data-lf values):`, list, HOW_OFTEN[p.frequency], "Rules: wrap a short phrase or a single line of dialogue (keep the quotation marks outside the span), never whole paragraphs; never nest spans; copy the markup exactly; vary the effects instead of repeating one.");
  }
  const intro = (topic) => parts.length ? "" : `${MARKER} \u2014 ${topic}] `;
  if (p.sceneDirector) {
    parts.push(`${intro("scene direction")}Scene direction: whenever the location, weather, time of day or emotional atmosphere changes \u2014 and at the start of a new scene \u2014 end the reply with ONE invisible stage direction tag: <flair scene="rain" light="dusk" mood="tense"></flair>. scene: snow, rain, embers, fireflies, petals, stars or clear. light: dawn, day, dusk, night, candle, storm or neon. mood: one word for the emotional tone. Include only the attributes that changed. The reader never sees it; it re-dresses their screen to match the story.`);
  }
  if (p.aiEffects) {
    parts.push(`${intro("screen effects")}At a genuinely big moment (a celebration, a revelation, a kiss, a victory, a shooting star) you may also add one screen effect: <flair effect="confetti"></flair> \u2014 effect is confetti, sparkle, ripple or comet (it can share the tag with a scene direction). At most once per reply; most replies have none.`);
  }
  if (p.choices) {
    parts.push(`${intro("choices")}When the user's character faces a meaningful decision, end the reply with 2 or 3 short options written from the user's point of view, each in its own tag: <flair-choice>Follow her into the forest</flair-choice>. Keep each under 10 words and make them genuinely different. Skip it when there is no real decision. Never decide for the user.`);
  }
  return parts.join(`
`);
}
var prefsByUser = new Map;
var macroPrefs = DEFAULT_PREFS;
spindle.registerMacro({
  name: "flair_tags",
  category: "extension:lumi_flair",
  description: "Instructions that let the AI use Lumi Flair text effects and screen effects.",
  returnType: "string",
  handler: ""
});
spindle.updateMacroValue("flair_tags", buildInstructions(macroPrefs));
try {
  spindle.frontendCapabilities.declare("message_tag_interceptor");
} catch (err) {
  spindle.log.warn(`Lumi Flair: could not declare tag interceptor capability: ${String(err)}`);
}
spindle.commands.register([
  { id: "open", label: "Flair: Open settings", description: "Open the Lumi Flair tab", keywords: ["flair", "effects", "glow"], scope: "global" },
  { id: "toggle", label: "Flair: Toggle effects", description: "Turn all Lumi Flair effects on or off", keywords: ["flair", "effects", "animation"], scope: "global" },
  { id: "next-effect", label: "Flair: Next send effect", description: "Cycle sparkle \u2192 ripple \u2192 comet \u2192 confetti \u2192 none", keywords: ["send", "effect", "particles"], scope: "global" },
  { id: "preview", label: "Flair: Preview send effect", description: "Play the current send effect", keywords: ["preview", "test"], scope: "global" },
  { id: "spotlight", label: "Flair: Toggle spotlight mode", description: "Dim other messages while you hover one", keywords: ["focus", "dim", "reading"], scope: "chat" },
  { id: "next-scene", label: "Flair: Next ambient scene", description: "Cycle snow, rain, embers, fireflies, petals, stars", keywords: ["weather", "ambient", "snow", "rain"], scope: "global" },
  { id: "scene-off", label: "Flair: Turn off scene for this chat", description: "Stop the ambient scene in this chat", keywords: ["weather", "ambient", "off"], scope: "chat" },
  { id: "sound", label: "Flair: Toggle sounds", description: "Turn interface chimes on or off", keywords: ["sound", "audio", "chime"], scope: "global" },
  { id: "soundscape", label: "Flair: Toggle soundscapes", description: "Rain, fire, wind and night ambience that follow the scene", keywords: ["ambience", "soundscape", "rain", "audio"], scope: "global" },
  { id: "next-pack", label: "Flair: Next Flair Pack", description: "Cycle Classic, Cozy Fantasy, Cyberpunk, Horror, Sakura, Deep Space, Noir", keywords: ["pack", "theme", "look", "preset"], scope: "global" },
  { id: "moment", label: "Flair: Moment Card of latest reply", description: "Turn the latest message into a share-ready image", keywords: ["share", "image", "card", "screenshot"], scope: "chat" },
  { id: "welcome", label: "Flair: Show welcome", description: "Pick a Flair Pack and optional extras", keywords: ["setup", "onboarding", "welcome"], scope: "global" }
]);
spindle.commands.onInvoked((commandId) => {
  spindle.sendToFrontend({ type: "command", id: commandId });
});
var VAULT_FILES = new Set(["settings", "achievements", "heartbeat"]);
var VERSION = "1.0.0";
async function vaultLoad(req, names, userId) {
  const files = {};
  const list = Array.isArray(names) ? names.filter((n) => typeof n === "string" && VAULT_FILES.has(n)) : [];
  for (const name of list) {
    try {
      if (await spindle.userStorage.exists(`${name}.json`, userId)) {
        files[name] = await spindle.userStorage.getJson(`${name}.json`, { fallback: null, userId });
      }
    } catch (err) {
      spindle.log.warn(`[Lumi Flair] could not read ${name}.json: ${String(err)}`);
    }
  }
  spindle.sendToFrontend({ type: "vault_data", req, files }, userId);
}
var writeChains = new Map;
function vaultSave(name, data, userId) {
  if (typeof name !== "string" || !VAULT_FILES.has(name))
    return;
  const env = data;
  if (!env || typeof env !== "object" || typeof env.at !== "number" || env.data === undefined)
    return;
  const key = `${userId}:${name}`;
  const file = {
    lumiFlair: VERSION,
    savedAt: new Date(env.at).toISOString(),
    at: env.at,
    data: env.data
  };
  const next = (writeChains.get(key) ?? Promise.resolve()).then(async () => {
    await spindle.userStorage.setJson(`${name}.json`, file, { indent: 2, userId });
    spindle.sendToFrontend({ type: "vault_saved", name, at: env.at }, userId);
  }).catch((err) => {
    spindle.sendToFrontend({ type: "vault_error", name, reason: String(err) }, userId);
  });
  writeChains.set(key, next);
  next.finally(() => {
    if (writeChains.get(key) === next)
      writeChains.delete(key);
  });
}
var HEX = /^#[0-9a-f]{6}$/i;
var KEEP_USERS = /scale|font-family|font-mono|radius|transition/;
var ACCENT_ONLY = /^--lumiverse-(primary|secondary|prose)/;
function cleanSpec(raw) {
  const r = raw;
  if (!r || typeof r !== "object" || !HEX.test(String(r.accent)) || !HEX.test(String(r.bgDark)) || !HEX.test(String(r.bgLight)))
    return null;
  const opt = (v) => typeof v === "string" && HEX.test(v) ? v : undefined;
  return {
    accent: r.accent,
    bgDark: r.bgDark,
    bgLight: r.bgLight,
    secondary: opt(r.secondary),
    speech: opt(r.speech),
    thoughts: opt(r.thoughts),
    depth: r.depth === "accent" ? "accent" : "full"
  };
}
function hexHsl(hex) {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16 & 255) / 255, g = (n >> 8 & 255) / 255, b = (n & 255) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h *= 60;
  }
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
}
async function buildTheme(spec, userId) {
  let cur = {};
  try {
    cur = await spindle.theme.getCurrent(userId);
  } catch {}
  const byMode = { dark: {}, light: {} };
  for (const mode of ["dark", "light"]) {
    const baseColors = { primary: spec.accent };
    if (spec.secondary)
      baseColors.secondary = spec.secondary;
    if (spec.speech)
      baseColors.speech = spec.speech;
    if (spec.thoughts)
      baseColors.thoughts = spec.thoughts;
    if (spec.depth === "full")
      baseColors.background = mode === "dark" ? spec.bgDark : spec.bgLight;
    const vars = await spindle.theme.generateVariables({
      accent: hexHsl(spec.accent),
      mode,
      enableGlass: cur.enableGlass ?? true,
      radiusScale: cur.radiusScale ?? 1,
      fontScale: cur.fontScale ?? 1,
      baseColors
    });
    for (const [k, v] of Object.entries(vars)) {
      if (KEEP_USERS.test(k))
        continue;
      if (spec.depth === "accent" && !ACCENT_ONLY.test(k))
        continue;
      byMode[mode][k] = v;
    }
  }
  return byMode;
}
var themeJobs = new Map;
function queueTheme(userId, spec) {
  const job = themeJobs.get(userId) ?? { running: false };
  themeJobs.set(userId, job);
  job.next = { spec };
  if (job.running)
    return;
  job.running = true;
  (async () => {
    while (job.next) {
      const { spec: want } = job.next;
      job.next = undefined;
      try {
        if (!spindle.permissions.has("app_manipulation"))
          throw new Error("app_manipulation not granted");
        if (!want) {
          await spindle.theme.clear(userId);
          job.lastDepth = undefined;
        } else {
          const byMode = await buildTheme(want, userId);
          if (job.lastDepth && job.lastDepth !== want.depth)
            await spindle.theme.clear(userId);
          await spindle.theme.apply({ variablesByMode: byMode }, userId);
          job.lastDepth = want.depth;
        }
        spindle.sendToFrontend({ type: "theme_result", ok: true }, userId);
      } catch (err) {
        spindle.sendToFrontend({ type: "theme_result", ok: false, reason: String(err) }, userId);
      }
    }
    job.running = false;
  })();
}
spindle.onFrontendMessage(async (raw, userId) => {
  const tm = raw;
  if (tm?.type === "ui_theme")
    return queueTheme(userId, tm.spec ? cleanSpec(tm.spec) : null);
  const vm = raw;
  if (vm?.type === "vault_load" && typeof vm.req === "number")
    return void await vaultLoad(vm.req, vm.names, userId);
  if (vm?.type === "vault_save")
    return vaultSave(vm.name, vm.data, userId);
  const msg = raw;
  if (msg?.type === "prefs") {
    const prefs = {
      frequency: msg.frequency === "often" || msg.frequency === "sparing" ? msg.frequency : "every",
      textEffects: msg.textEffects !== false,
      aiEffects: msg.aiEffects !== false,
      sceneDirector: msg.sceneDirector !== false,
      choices: msg.choices !== false,
      autoInject: msg.autoInject === true,
      disabledFx: Array.isArray(msg.disabledFx) ? msg.disabledFx.filter((fx) => typeof fx === "string" && KNOWN_FX.has(fx)) : []
    };
    prefsByUser.set(userId, prefs);
    macroPrefs = prefs;
    spindle.updateMacroValue("flair_tags", buildInstructions(prefs));
    return;
  }
  if (msg?.type !== "mood_tint")
    return;
  if (!spindle.permissions.has("app_manipulation")) {
    spindle.sendToFrontend({ type: "tint_result", ok: false, reason: "app_manipulation not granted" }, userId);
    return;
  }
  try {
    if (msg.accent) {
      const accent = {
        h: Math.round(msg.accent.h),
        s: Math.min(85, Math.max(35, msg.accent.s)),
        l: Math.min(68, Math.max(48, msg.accent.l))
      };
      await spindle.theme.applyPalette({ accent }, userId);
    } else {
      await spindle.theme.applyPalette(null, userId);
    }
    spindle.sendToFrontend({ type: "tint_result", ok: true }, userId);
  } catch (err) {
    spindle.sendToFrontend({ type: "tint_result", ok: false, reason: String(err) }, userId);
  }
});
function contentText(content) {
  if (typeof content === "string")
    return content;
  if (Array.isArray(content))
    return content.map((p) => p && typeof p === "object" && ("text" in p) ? String(p.text) : "").join(" ");
  return "";
}
var interceptorDisposer = null;
function syncInterceptor() {
  const want = spindle.permissions.has("interceptor");
  if (want && !interceptorDisposer) {
    interceptorDisposer = spindle.registerInterceptor(async (messages, context) => {
      const prefs = prefsByUser.get(context.userId) ?? (prefsByUser.size === 0 ? DEFAULT_PREFS : null);
      if (!prefs?.autoInject || !prefs.textEffects && !prefs.aiEffects && !prefs.sceneDirector && !prefs.choices)
        return messages;
      if (context.generationType === "impersonate" || context.generationType === "quiet")
        return messages;
      if (messages.some((m) => contentText(m.content).includes(MARKER)))
        return messages;
      const text = buildInstructions(prefs);
      if (!text)
        return messages;
      const note = { role: "system", content: text };
      const at = Math.max(0, messages.length - 1);
      const out = [...messages.slice(0, at), note, ...messages.slice(at)];
      return { messages: out, breakdown: [{ messageIndex: at, name: "Lumi Flair storytelling" }] };
    }, 150);
    spindle.log.info("Lumi Flair: prompt injection enabled");
  } else if (!want && interceptorDisposer) {
    interceptorDisposer();
    interceptorDisposer = null;
  }
}
syncInterceptor();
spindle.permissions.onChanged(({ permission, granted }) => {
  if (permission === "interceptor")
    syncInterceptor();
  if (permission === "app_manipulation" && !granted) {
    spindle.log.info("Lumi Flair: mood UI tint disabled (permission revoked)");
  }
});
spindle.log.info("Lumi Flair backend ready");
