import { TEXT_FX, type FlairSettings } from './settings'
import type { TimeTint } from './palette'

/**
 * Public, documented selectors only. Lumiverse stamps every chat card with
 * `data-component` (BubbleMessage / MinimalMessage), `data-part`
 * (user / character / streaming) and `data-message-id`. CSS-module class
 * names are hashed and change between builds, so we never target them.
 *
 * The `:root` prefix + `[data-message-id]` lifts specificity to (0,3,0) so we
 * beat the host's `[data-glass] .card:hover` rules without `!important`, while
 * a user's own Custom CSS can still win with a more specific selector.
 */
export const CARD =
  ':is([data-component="BubbleMessage"],[data-component="MinimalMessage"])[data-message-id]'
const MSG = ':is([data-component="BubbleMessage"],[data-component="MinimalMessage"])'

const WARM = '#f5a524'

function mix(pct: number | string, color = 'var(--lf-glow)') {
  return `color-mix(in srgb, ${color} ${typeof pct === 'number' ? `${pct}%` : pct}, transparent)`
}

/**
 * Glow "room": how far an outer glow may reach before the chat list clips it.
 * The message list is `overflow-x: hidden` with only ~20px padding (8px on
 * mobile), so a big blur gets a hard edge. The frontend measures the real gap
 * and sets --lf-room; every outer shadow below has blur + spread ≤ room, so it
 * fades to nothing before the clip edge. Depth comes from inset glow instead.
 */
const R = (f: number) => `calc(var(--lf-room, 14px) * ${f})`

// ── Colour variables (kept in their own <style> so mood/time updates are cheap) ──

export function colorVarsCss(s: FlairSettings, moodColor: string | null, tod: TimeTint | null): string {
  const base = s.colorSource === 'custom' ? s.customColor : s.colorSource === 'character' ? 'var(--lf-char, var(--lumiverse-primary, #9370db))' : 'var(--lumiverse-primary, #9370db)'
  const tinted = tod ? `color-mix(in oklab, var(--lf-base), ${tod.color} ${tod.amount}%)` : 'var(--lf-base)'
  const final = moodColor ? `color-mix(in oklab, var(--lf-tod) 25%, ${moodColor})` : 'var(--lf-tod)'
  const user =
    s.userColor === 'warm' ? WARM : s.userColor === 'custom' ? s.userCustomColor : 'var(--lf-c)'
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
`
}

// ── Static keyframes & registered properties ──

const KEYFRAMES = `
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
@keyframes lf-glowtext { 0%, 100% { text-shadow: 0 0 4px ${mix(45, 'var(--lf-fx)')}; } 50% { text-shadow: 0 0 10px ${mix(75, 'var(--lf-fx)')}, 0 0 22px ${mix(35, 'var(--lf-fx)')}; } }
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
`

/** A 1.5px border "ring" painted with a rotating conic gradient, masked to the edge. */
function ringDeclarations(): string {
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
  display: block;`
}

function cardTransitionCss(): string {
  return `
:root ${CARD} {
  transition: box-shadow .25s ease, background var(--lcs-transition-fast, 120ms ease), opacity .35s ease, filter .35s ease;
}
`
}

function hoverCss(s: FlairSettings): string {
  if (s.hoverStyle === 'none') return ''
  const k = s.hoverStrength
  const filter =
    s.hoverTarget === 'character'
      ? ':not([data-part="user"])'
      : s.hoverTarget === 'user'
        ? '[data-part="user"]'
        : ''
  const sel = `:root ${CARD}${filter}:not([data-part="streaming"])`

  // Strength scales opacity, not reach — reach is capped by --lf-room (see R()).
  const p = (n: number) => Math.min(100, Math.round(n * k))
  const shadows: Record<Exclude<FlairSettings['hoverStyle'], 'none'>, string> = {
    glow: [
      `0 0 0 1px ${mix(p(50))}`,
      `0 0 ${R(1)} 0 ${mix(p(40))}`,
      `0 0 ${R(1.8)} ${R(-0.8)} ${mix(p(30))}`,
      `inset 0 0 ${R(1.2)} ${mix(p(14))}`,
    ].join(', '),
    trace: [`0 0 ${R(1)} 0 ${mix(p(26))}`, `inset 0 0 ${R(1)} ${mix(p(10))}`].join(', '),
    neon: [
      `0 0 0 1.5px ${mix(p(85))}`,
      `0 0 ${R(0.45)} 0 ${mix(p(70))}`,
      `0 0 ${R(1)} 0 ${mix(p(45))}`,
      `0 0 ${R(1.8)} ${R(-0.8)} ${mix(p(35))}`,
      `inset 0 0 ${R(1.1)} ${mix(p(24))}`,
    ].join(', '),
  }

  let css = `
@media (hover: hover) {
  ${sel}:hover { box-shadow: ${shadows[s.hoverStyle]}; }
}
`
  if (s.hoverStyle === 'trace') {
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
`
  }
  return css
}

function streamingCss(s: FlairSettings): string {
  if (!s.streamingAura) return ''
  return `
:root ${CARD}[data-part="streaming"]::after {${ringDeclarations()}
  animation: lf-spin calc(var(--lf-speed) * .8) linear infinite, lf-breathe 2.4s ease-in-out infinite;
}
:root [data-component="MinimalMessage"][data-message-id][data-part="streaming"]::after { inset: -1px; }
`
}

/**
 * Inline text effects. The AI (taught by the {{flair_tags}} macro) or a
 * regex script writes `<span data-lf="shake">…</span>`; Lumiverse's message
 * sanitizer keeps `span` + `data-*`, so this is pure CSS — it survives
 * streaming, virtualization and reloads.
 */
function textFxRules(s: FlairSettings, scope: string, only: readonly string[]): string {
  const T = (fx: string) => `:root ${scope} [data-lf="${fx}"]`
  const rules: Record<string, string> = {
    shake: `${T('shake')} { display: inline-block; animation: lf-shake .45s linear infinite; }`,
    glow: `${T('glow')} { color: color-mix(in srgb, var(--lf-fx) 40%, var(--lumiverse-text, #fff)); animation: lf-glowtext 2.4s ease-in-out infinite; }`,
    whisper: `${T('whisper')} { font-size: .88em; font-style: italic; opacity: .68; letter-spacing: .04em; }`,
    rainbow: `${T('rainbow')} {
  background: linear-gradient(90deg, #ff5f6d, #ffc371, #7dffb0, #5bc8ff, #b18cff, #ff5f6d);
  background-size: 200% 100%;
  -webkit-background-clip: text; background-clip: text;
  -webkit-text-fill-color: transparent; color: transparent;
  animation: lf-rainbow 3s linear infinite;
}`,
    typewriter: `${T('typewriter')} { display: inline-block; vertical-align: bottom; clip-path: inset(0 100% 0 0); animation: lf-type 1.6s steps(28, end) .15s forwards; }`,
    fade: `${T('fade')} { animation: lf-fadein 1.6s ease both; }`,
    pulse: `${T('pulse')} { display: inline-block; animation: lf-pulse 1.4s ease-in-out infinite; }`,
    big: `${T('big')} { font-size: 1.3em; font-weight: 700; }`,
    glitch: `${T('glitch')} { position: relative; display: inline-block; animation: lf-glitch 2.6s steps(1) infinite;
  text-shadow: .06em 0 rgba(255,0,80,.55), -.06em 0 rgba(0,220,255,.55); }`,
    flicker: `${T('flicker')} { animation: ${s.noFlash ? 'none' : 'lf-flicker 3.4s linear infinite'}; opacity: ${s.noFlash ? '.75' : '1'}; }`,
  }
  return `:root ${scope} [data-lf] { --lf-fx: var(--lf-c, var(--lumiverse-primary)); }\n` + only.map((fx) => rules[fx] ?? '').join('\n')
}

/**
 * Inline text effects. The AI (taught by the {{flair_tags}} macro) or a
 * regex script writes `<span data-lf="shake">…</span>`; Lumiverse's message
 * sanitizer keeps `span` + `data-*`, so this is pure CSS — it survives
 * streaming, virtualization and reloads. Effects the user switched off get
 * no rule at all, so they read as plain text.
 */
function textFxCss(s: FlairSettings): string {
  // The panel's effect picker always previews every effect.
  const picker = textFxRules(s, '.lf-fx-pick', TEXT_FX)
  if (!s.textEffects) return picker
  const on = TEXT_FX.filter((fx) => !s.textFxOff.includes(fx))
  return picker + '\n' + textFxRules(s, ':is([data-component="BubbleMessage"],[data-component="MinimalMessage"],.lf-fx-demo)', on)
}

function spotlightCss(s: FlairSettings): string {
  if (!s.spotlight) return ''
  return `
@media (hover: hover) {
  :root [data-component="MessageList"]:hover ${CARD}:not(:hover) { opacity: .38; filter: saturate(.55); }
}
`
}

function reducedMotionCss(s: FlairSettings): string {
  if (!s.respectReducedMotion) return ''
  // Keep colour (glow / static ring) but drop all movement.
  return `
@media (prefers-reduced-motion: reduce) {
  :root ${CARD}::after { animation: none !important; }
  :root ${CARD}[data-part="streaming"]::after { opacity: .8; }
  :root ${MSG} [data-lf] { animation: none !important; clip-path: none !important; }
  :root [data-component="InputArea"] { animation: none !important; }
}
`
}

const OVERLAY_CSS = `
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
`

/** Build the main stylesheet for the current settings. */
export function buildCss(s: FlairSettings): string {
  // When disabled we still ship keyframes so the panel's preview buttons work;
  // only the always-on rules are dropped.
  if (!s.enabled) return [OVERLAY_CSS, KEYFRAMES].join('\n')
  return [
    OVERLAY_CSS,
    KEYFRAMES,
    cardTransitionCss(),
    hoverCss(s),
    streamingCss(s),
    textFxCss(s),
    spotlightCss(s),
    reducedMotionCss(s),
  ].join('\n')
}

/** Composer "thinking" glow while a generation is in flight. --lf-gen (0–1) tracks tokens/sec. */
export function composerActiveCss(level: number): string {
  return `
:root { --lf-gen: ${Math.max(0, Math.min(1, level)).toFixed(2)}; }
:root [data-component="InputArea"] {
  box-shadow:
    0 0 0 1px color-mix(in srgb, var(--lf-c) calc(var(--lf-breath) * 70%), transparent),
    0 0 calc(6px + 10px * var(--lf-gen)) color-mix(in srgb, var(--lf-c) calc(var(--lf-breath) * 45%), transparent);
  animation: lf-composer 1.8s ease-in-out infinite;
}
`
}

export type CardAnimation = 'pop' | 'rise' | 'bloom' | 'swipe-left' | 'swipe-right' | 'swipe-fade'

/** One-shot animation rule for a single message card. */
export function entranceRule(messageId: string, kind: CardAnimation): { css: string; durationMs: number } {
  const id = typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(messageId) : messageId.replace(/"/g, '\\"')
  const sel = `:root ${MSG}[data-message-id="${id}"]`
  const spec: Record<CardAnimation, { anim: string; ms: number }> = {
    pop: { anim: 'lf-pop 560ms cubic-bezier(.2, 1.25, .4, 1) both', ms: 560 },
    rise: { anim: 'lf-rise 420ms cubic-bezier(.2, .8, .2, 1) both', ms: 420 },
    bloom: { anim: 'lf-bloom 1400ms ease-out both', ms: 1400 },
    'swipe-left': { anim: 'lf-swipe-left 320ms cubic-bezier(.2, .8, .2, 1) both', ms: 320 },
    'swipe-right': { anim: 'lf-swipe-right 320ms cubic-bezier(.2, .8, .2, 1) both', ms: 320 },
    'swipe-fade': { anim: 'lf-swipe-fade 360ms ease-out both', ms: 360 },
  }
  const { anim, ms } = spec[kind]
  return { css: `${sel} { animation: ${anim}; }`, durationMs: ms }
}

/**
 * CSS-only subset for "Export as Theme Pack": hover glow, ring and streaming
 * aura with the colour pinned to the theme accent, so it works without the
 * extension installed.
 */
export function exportableCss(s: FlairSettings): string {
  const solid: FlairSettings = { ...s, enabled: true, textEffects: false, spotlight: false }
  const base = s.colorSource === 'custom' ? s.customColor : s.colorSource === 'character' ? 'var(--lf-char, var(--lumiverse-primary, #9370db))' : 'var(--lumiverse-primary, #9370db)'
  const user = s.userColor === 'warm' ? WARM : s.userColor === 'custom' ? s.userCustomColor : base
  return [
    '/* Generated by Lumi Flair — hover glow + streaming aura */',
    `:root { --lf-c: ${base}; --lf-c-user: ${user}; --lf-speed: ${s.traceSpeed}s; }`,
    `:root ${CARD} { --lf-glow: var(--lf-c); }`,
    `:root ${CARD}[data-part="user"] { --lf-glow: var(--lf-c-user); }`,
    '@property --lf-angle { syntax: \'<angle>\'; inherits: false; initial-value: 0deg; }',
    '@keyframes lf-spin { to { --lf-angle: 360deg; } }',
    '@keyframes lf-breathe { 0%, 100% { opacity: .35; } 50% { opacity: 1; } }',
    cardTransitionCss(),
    hoverCss(solid),
    streamingCss(solid),
    reducedMotionCss(solid),
  ].join('\n')
}

/** Short glow on a tapped message (touch devices have no hover). */
export function tapGlowRule(messageId: string): string {
  const id = typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(messageId) : messageId.replace(/"/g, '\\"')
  return `:root ${MSG}[data-message-id="${id}"] { box-shadow: 0 0 0 1px ${mix(55)}, 0 0 ${R(1)} 0 ${mix(42)}, inset 0 0 ${R(1.2)} ${mix(16)}; }`
}
