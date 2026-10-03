# Lumi Flair: customization ideas & roadmap

Built from a review of Lumiverse's own frontend (`frontend/src/theme`, `components/chat`, `lib/spindle`), the user docs (Theme, Display Modes, Wallpaper, Expressions, Regex) and the Spindle developer docs.

## What Lumiverse already gives you

| Area | What exists today |
|---|---|
| Theme Panel | Dark/light/system mode, accent colour, base colours, radius scale, font scale, UI scale, glass toggle, preset grid |
| Character-aware theming | Accent is extracted from the current character's avatar |
| Custom CSS | Raw CSS plus **component overrides** (TSX that wraps `<Original />`), theme assets and `.lumitheme` packs. `?safe-theme=1` recovers a broken theme |
| Chat display | Minimal and Bubble modes, avatar-in-bubble background, chat width, bubble opacity (`--lcs-bubble-opacity`), hover highlight on/off (`data-no-bubble-hover`) |
| Wallpaper | Global, per-chat, library, video loops, AI scene backgrounds, opacity/fit |
| Motion | Only a few subtle keyframes: `lumiverseFadeIn`, `lumiverseSlideUp`, `lumiversePulse`, `lumiverseShimmer`, `lcs-chunk-fade` (streaming), and a highlight pulse |
| Extension hooks | `spindle.theme` (live CSS-variable overrides, needs `app_manipulation`), `ctx.theme` (assets, packs, catalog, editor), 50+ mount points, message tag interceptors, DOM decorators |

**The gap:** theming is strong on *static* look but has almost no *feedback motion*. Nothing happens when you send, when a reply lands, when a swipe changes, or when the character's mood shifts. Lumi Flair v0.1 starts filling that gap.

## Shipped in v0.1 (and still there)

- Send effects: sparkle, ripple, comet, confetti
- User message pop/rise entrance, and an AI reply bloom on `GENERATION_ENDED`
- Hover glow, edge trace and neon, with a target filter (all / character / user)
- Streaming aura ring
- Theme / custom / per-side colour, reduce-motion support, settings drawer tab

## Shipped in v0.2: all 12 ideas below are implemented

Status per idea: ✅ mood glow (+ optional whole-UI tint) · ✅ text effects via `data-lf` spans + `<flair effect>` AI tag + `{{flair_tags}}` macro · ✅ ambient scenes (manual, per chat, lorebook-driven) · ✅ swipe transitions · ✅ thinking composer · ✅ per-character profiles · ✅ milestones + keyword triggers · ✅ WebAudio sounds · ✅ theme-pack export · ✅ spotlight (+ input-bar toggle) · ✅ time-of-day tint · ✅ command palette.

Design changes made during implementation:
- **Text effects use `<span data-lf="…">` instead of custom tags.** Lumiverse's message sanitizer removes unknown elements like `<shake>` but keeps `span` and `data-*`, so styling the spans with CSS alone works with streaming, virtualization and reloads. A regex script can turn short tags into spans for people who prefer them.
- **AI screen effects** use a tag interceptor and only fire for replies that finished in the last 30 seconds, so opening old chats doesn't replay them.
- **Whole-UI mood tint** uses `spindle.theme.applyPalette` (the safe palette API) rather than raw CSS variables.

## Shipped in v0.3: "the story controls the room"

✅ Flair Packs (7 built in, plus import/export as `.flair.json`) · ✅ Scene Director (`<flair scene light mood>`) · ✅ cinematic lighting with vignette, grain, rays and lightning · ✅ No-flash accessibility mode · ✅ camera shake · ✅ procedural soundscapes · ✅ character auras from avatars · ✅ choice chips (`<flair-choice>`) · ✅ story heartbeat chart · ✅ 15 achievements · ✅ Moment Cards (shareable PNG) · ✅ welcome / onboarding · ✅ battery saver (FPS governor) · ✅ tap glow for touch · ✅ translations (zh, zh-TW, ja, fr, it) · ✅ `glitch` and `flicker` text effects.

Design notes:
- **Injected instructions avoid `{{user}}`.** The interceptor runs after macros are resolved, so the note says "the user's character" instead.
- **Packs never enable sound or permissions.** That keeps imported packs safe to try.
- **Director state is per chat, and the newest message wins.** Re-rendering old messages never moves the scene backwards.

## Parked (too complex for now)

- **Living portrait:** an expression-driven animated avatar.
- **Audio-reactive TTS glow:** the glow pulses with the TTS output level.

## Possible v0.4 ideas

- Translate the longer hints, not only the labels.
- A pack gallery with a community sharing format.
- Per-scene custom particle images (theme assets).
- Heartbeat export as an image, so it can sit next to Moment Cards.

## The original 12 ideas (all shipped in v0.2)

### 1. Mood-reactive glow ⭐
Listen to `EXPRESSION_CHANGED` (`{ chatId, characterId, label }`) and map labels to colours: anger → red, joy → gold, sadness → blue, fear → violet. Set `--lf-c` from the map and fade it with a CSS transition. To retint the **whole UI**, also call `spindle.theme` (backend, `app_manipulation`).
*APIs: frontend events, optional backend + `app_manipulation`.*

### 2. Inline text effects the AI can use ⭐
Register tag interceptors (`ctx.messages.registerTagInterceptor`) for tags such as `<shake>`, `<glow>`, `<whisper>`, `<rainbow>` and `<typewriter>`, then render them with CSS animations. Add a prompt macro (`{{flair_tags}}`) that teaches the model the tags. This pairs naturally with regex scripts.
*APIs: message tags, macros (backend).*

### 3. Ambient scene layers
Draw snow, rain, embers, fireflies, petals or starfield on the same canvas overlay behind the chat. Turn layers on per chat, or automatically from `WORLD_INFO_ACTIVATED` entries (for example a lorebook entry tagged `weather:rain`). Keep them slow and low-opacity, and pause when the tab is hidden.
*APIs: events, `ctx.getActiveChat()`, settings keyed by chat id.*

### 4. Swipe transitions
`MESSAGE_SWIPED` with `action: 'navigated'` and `previousSwipeId` gives the direction. Slide or cross-fade the card left or right to match.
*APIs: events + the per-message CSS rule technique already in v0.1.*

### 5. "Thinking" composer glow
While `GENERATION_STARTED` → `GENERATION_ENDED` is in flight, give the `InputArea` a breathing border or a progress shimmer. Speed it up with `STREAM_TOKEN_RECEIVED` rate (tokens/sec), so the UI "feels" how fast the model is going.

### 6. Per-character flair profiles
Save a full settings override per `characterId`. For example, a pirate gets ripple + teal, and a fairy gets sparkle + pink. Add a "Use for this character" button in the Flair tab, or a character editor tab (needs `characters`).

### 7. Moment celebrations
Fire confetti or other effects on milestones: the 100th message, a chat anniversary, or a keyword in the AI reply (`GENERATION_ENDED.content` matches "happy birthday", "level up" and so on). Let users define their own trigger→effect pairs.

### 8. Sound design (optional, off by default)
Synthesize soft send and receive chimes with WebAudio, so there are no asset files. Pitch them to the mood from idea 1, and add a volume slider.

### 9. Export as Theme Pack
Add a "Save my glow as a theme" button. It uses `ctx.theme.packs.exportDraft({ globalCSS })` to turn the CSS-only parts (hover glow, ring, colours) into a `.lumitheme`, so people can share the look without installing the extension.

### 10. Spotlight / focus mode
Dim every message except the hovered or latest one, for immersive reading. This is pure CSS on `[data-component]` plus a toggle in the input-bar Extras menu (`ctx.ui.registerInputBarAction`).

### 11. Time-of-day palette
Warm the accent in the evening and cool it in the morning (local clock). This is cheap and subtle, and works well with idea 1.

### 12. Command palette shortcuts
Use `spindle.commands` to add Ctrl+K entries such as "Flair: toggle effects", "Flair: next send effect" and "Flair: preview".

## Technical guard-rails learned from the source

- Target **only** `data-component`, `data-part` and `data-message-id`. CSS-module class names are hashed (`_sendBtn_<hash>_<line>`).
- Chat rows are **virtualized**. Use CSS rules keyed by message id, or `ctx.dom.inject` (which auto-replays), never one-off class toggles on host nodes.
- `<body>` carries the **UI-scale zoom**. Measure overlays with `getBoundingClientRect()` and never multiply by the scale again.
- Bubble cards are `overflow: hidden; contain: paint`. Pseudo-element rings must sit at `inset: 0`, and outer `box-shadow` still renders.
- Streaming Bubble cards force `box-shadow … !important`, so use `::after` for streaming effects.
- Honour `prefers-reduced-motion`. Lumiverse itself does this in `global.css`.
