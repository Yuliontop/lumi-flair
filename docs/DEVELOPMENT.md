# Developing Lumi Flair

## How it fits together

Lumi Flair is a Spindle extension with two bundles:

- **`dist/frontend.js`** (from `src/frontend.ts`) runs in the Lumiverse page. Its `setup(ctx)` returns a cleanup function. Nearly everything lives here.
- **`dist/backend.js`** (from `src/backend.ts`) runs in Lumiverse's worker. Its jobs:
  - the `{{flair_tags}}` macro and the prompt interceptor that teaches the AI the tags (`interceptor`);
  - commands;
  - the theme engine bridge (`spindle.theme.*`, `app_manipulation`);
  - the settings "vault" files in `spindle.userStorage`.

The frontend talks to the backend with `ctx.sendToBackend` / `ctx.onBackendMessage`. Messages are JSON only, with a 4 MB cap.

### Source map

| File | What it does |
|---|---|
| `frontend.ts` | Orchestrator: event wiring, state, `applyAll()`, permissions, panel actions, status for the panel |
| `settings.ts` | `FlairSettings`, defaults, `normalize()` (every stored field is validated), the store with per-character profiles, `SOUND_SLOTS` |
| `persist.ts` | Auto-save vault: Lumiverse account settings (`flair:*` keys), a backend file, and a browser fallback. Backup and restore. It refuses to save before `loadAll()` has read every layer |
| `panel.ts` | The "Flair" drawer tab, built from `ctx.components.*` |
| `effects.ts` | Canvas particle engine (`FxCanvas`) and every send-effect recipe: sparkle, ripple, comet, confetti, creamy, splash, black hole, petal storm |
| `cinematic.ts` | Light tint, rays, vignette, grain, lightning, camera shake, the black-hole chat warp. The rays are a small image painted once per chat-area shape (`raysImage`), not a masked, filtered conic gradient; see "Phones" below |
| `ambient.ts` | Scene particles (snow, rain, embers, fireflies, petals, stars) |
| `soundscape.ts` | Procedural WebAudio beds per scene and light, the user's files layered in, the self-healing watchdog, background dim/mute |
| `sound.ts` | Interface chimes (send, receive, fanfare, sparkle, achievement), plus playing the user's files |
| `sfx.ts`, `sfx-cues.ts` | AI sound effects (`<flair sfx="…">`): the procedural cue recipes and `SfxBoard`; and the cue names, aliases and `cueName()`, as pure data shared with the backend prompt and the `sfx:<name>` file slots |
| `soundlib.ts` | The user's sound library (IndexedDB), with decode or stream sources |
| `soundwidget.ts` | Floating volume widget (`ctx.ui.createFloatWidget`, needs `ui_panels`). A pill, or a round button when collapsed (the default on a touch screen, `soundWidgetCollapsed: null` = auto); it folds toward the nearer screen edge and keeps its middle |
| `director.ts`, `choices.ts` | `<flair scene light mood>` stage directions and `<flair-choice>` chips (tag interceptors). The chips follow the swipe on screen: `MESSAGE_SWIPED` carries the swipe's own text, which `choices.swiped()` parses (see "Swipes and chips" below) |
| `aura.ts`, `palette.ts`, `uitheme.ts`, `themepack.ts` | Character colours, mood and time-of-day colours, Lumiverse theme matching, `.lumitheme` export |
| `packs.ts` | Flair Packs (built-in and user-made, `.flair.json`) |
| `heartbeat.ts`, `navigate.ts` | Story heartbeat chart, and jumping to any message (even unloaded ones) |
| `achievements.ts`, `momentcard.ts`, `welcome.ts`, `celebrate.ts` | Badges, shareable PNG cards, first-run screen, milestones and keyword triggers |
| `perf.ts` | FPS governor (battery saver) |
| `styles.ts` | Main CSS (only public selectors) |
| `i18n.ts`, `i18n-dict.ts` | `tr()` plus translations |

### Data and settings

- **Settings** are one `FlairSettings` object.
  - Add a field in four places: the interface, `DEFAULT_SETTINGS`, `normalize()` (validate it!), and the panel.
  - Per-character profiles override `LOOK_KEYS` only.
  - Packs only touch `PACK_KEYS`.
- **The user's sound files** live in the browser (IndexedDB `lumi_flair_sounds`), not in settings. Settings only hold `customSounds: slot → id`, so a missing file falls back to the built-in sound.
- **Never put user data in URLs.** Settings backups are local JSON downloads.
- **Never change or save a store before it has loaded.**
  - On a cold start (an iOS home-screen app, a slow server) the host replays old messages through our tag interceptors while `vault.loadAll()` is still in flight.
  - A save is stamped "now", so it would win over every older copy: an early unlock used to overwrite saved achievements with an empty list.
  - Use `createJsonStore().whenLoaded(fn)` for anything that changes achievements or the heartbeat; the settings store and the vault ignore saves until they have loaded.
  - `test_achievements.py` replays this with a slow and a dead server.
- **Panel sections that draw from `status()` must be drawn once when the panel is built** (`mountPanel` does one pass over `statusSyncers`), or they stay empty until an unrelated event fires a status update.

## Phones (the iOS home-screen app)

Ash's iPhone is the tightest environment, and iOS kills a home-screen web app that runs short of memory ("the page force reloads"). The host stores a lifecycle timeline (Settings → Diagnostics): a `boot` entry with `previousSessionEndedCleanly: false` means WebKit killed the page, rather than something calling `reload()`. What we do about it:

- **Keep our layers small and plain.** Everything in `cinematic.ts` is a flat layer. No `mix-blend-mode` (the layer is already an isolated stacking context, so `screen` blended with nothing, and it made the browser render the whole group offscreen every frame), no masks, no live filters, no `background-position` animation. Animations move only `transform` or `opacity`. An animation on an invisible layer still keeps the browser drawing frames, so animate only while visible. `test_cinematic.py` enforces all of this.
- **Slow movements are stepped on touch screens** (`@media (pointer: coarse)`: the rays' sway, neon's drift, the candle). Every change makes the browser redraw whatever blurs the background behind the messages (Lumiverse's `backdrop-filter`), which is the cost on a phone. `bench_cine.py`: the rays went from 60 drawn frames a second to about 3.
- **The scene's particles run at ~30 fps on touch screens** (`AmbientCanvas.minFrameMs`).
- **The frame-rate governor only runs a frame loop while something animates** (a loop of its own keeps the screen redrawing), and only for the particles on a touch screen. After a relapse it waits twice as long before switching effects back on, so it doesn't flap.
- **When the host starts leaving the chat** (the home button) its chrome gets `data-chat-chrome-leaving` for ~220 ms before the route changes. We watch that attribute and drop the atmosphere at once. (The host sets the same attribute while it swaps the wallpaper, so the atmosphere also pauses, briefly, for that.) When the chat closes, the whole-UI colour and theme work waits ~900 ms for the page change to settle, and a chat change no longer re-injects the whole stylesheet unless the character has a profile.
- **Fixed overlays go below the notch:** use `var(--app-interactive-safe-top, env(safe-area-inset-top, 0px))`, divided by `var(--lumiverse-ui-scale, 1)` because our overlays sit in the zoom layer (the unlock card does this).
- Not verifiable here: the mock is Chromium's software renderer, not an iPhone. The measured claims are relative (frames drawn, painting work), and whether the home button still reloads on the device needs Ash's phone.

## Lumiverse facts we rely on

- **Chat markup.**
  - Chat cards carry `data-component="BubbleMessage" | "MinimalMessage"` and `data-message-id`. The list is `data-component="MessageList"`, the view `data-component="ChatView"`.
  - Cards are `overflow:hidden; contain:paint`, and the list has about 20 px of side padding, so keep outer glow inside `--lf-room`.
  - Streaming cards force `box-shadow … !important`, so draw streaming effects with `::after`.
- **ChatView layers:** wallpaper z0, scrim z1, transition z2, body z3. Atmosphere goes at z2, appended last.
- **Zoom:** `<body>` carries the UI-scale zoom. Measure overlays with `getBoundingClientRect()`.
- **Message sanitizer:** keeps `span` and `data-*` and strips unknown tags. That's why text effects are `<span data-lf="…">`.
- **Tag interceptors** (`frontend/src/lib/spindle/message-interceptors.ts` in the Lumiverse source):
  - A tag is matched only when its **closing tag** has arrived: `<tag …>…</tag>`. A self-closing `<flair sfx="x"/>` would swallow everything up to the next `</flair>`, so always teach the AI the paired form.
  - Handlers run **during streaming** (`isStreaming: true`) for every completed tag, and again for the final render. The host dedupes by extension, message, phase, tag name and the exact tag text, so two identical tags in one message arrive once per phase.
  - They also run every time an old message is rendered (chat opened, scrolled). Anything that makes sound or motion must check the message is live (`isStreaming`, or `recentGenerated`) before acting.
  - While a tag is still streaming, the host swaps the unfinished tag for a block-level "…is processing this part of the message" indicator. Put tags at the start or end of a paragraph, not mid-sentence.
  - The options' `attrs` match exact values only, so a wildcard attribute has to be checked inside the handler.
- **Swipes and chips.**
  - The host keeps one "delivered" set **per mounted message** and never delivers the same tag text twice for it. Swiping back to a variant you have already seen therefore brings **no** tag callbacks, and a new variant's tags arrive with no hint of which swipe they belong to.
  - `MESSAGE_SWIPED` is the authority: its payload has the whole message (`message.content` mirrors the active swipe) and `action` (`added`, `updated`, `deleted`, `navigated`). A regenerate adds a **blank** swipe at the start (`added`, empty text) and fills it at the end (`updated`); a continue fires only `MESSAGE_EDITED`.
  - So the chips are parsed from the swipe event's text (`choicesIn`), which then locks that message's options until the next event; the interceptor fills them in only when no swipe event told us (a normal reply, a continue). Anything that must follow the active variant should work this way.
  - The host's injection registry can replay an old `dom.inject` wrapper after you removed it (a replay queued before the removal still holds the record). `ChoiceManager.hide()` empties and hides what it removes, so a late replay shows nothing.
- **Interceptors** run after macro resolution, so don't put `{{user}}` in injected text.
- **Messages API:** `ctx.messages.listMessageIds()` covers only the loaded window. The frontend `messages.get` / `list` aren't implemented; `navigate.ts` handles that.
- **Frontend `ctx.permissions`** has only `getGranted()` and `request()`. There's no change event and no frontend toast API, so messages go in the panel.
- **`ctx.uploads.pickFile({accept, multiple})`** returns `bytes`. `maxSizeBytes` fails the *whole* pick, so check sizes per file.
- **Selects** (`ctx.components.mountSelect`) support `group` and `update({ options })`.
- **Theme engine:** `spindle.theme.generateVariables` also emits font, scale and radius variables. Flair strips those so the user's typography is untouched.
- **Large uploads to the backend:** use the tus endpoint `/api/v1/spindle-uploads` and `spindle.uploads.get`, not base64 messages. Backend base64 decoding trips the install scanner.
- **Float widgets:** drag is host-owned (4 px slop; a button may start one, the click that follows a drag is swallowed, `[role=slider]`, inputs and anything that stops `pointerdown` are not draggable). `setSize` resizes (our widget changes shape to collapse), `moveTo` and `getPosition` use the layout viewport, and on a phone the host clamps the size to the screen. Max 4 per extension. Lumiverse Desktop can pop them out (`setSize`). An `entry_frontend_widget` bundle is optional (not used).

## Testing

`dev/` has a mock Lumiverse (`dev/mock/lumiverse.html`) that loads the real `dist/frontend.js`, plus focused pages for effects, navigation, the soundscape and benchmarks. See `dev/README.md`.

The mock is not the real app. It has already missed one real-host problem: global range-input CSS. When you touch host-mounted UI, ask Ash to check it in Lumiverse too. With Claude in Chrome, you can look yourself.

## Local test install

Ash tests through **Extensions → Import Local**, which uses a non-git copy at `<Lumiverse>/data/extensions/lumi_flair/repo/`.

1. Bump the version.
2. Build.
3. Copy `dist/`, `src/`, `README.md` and `package.json` there, plus `spindle.json` with `"dev_mode": true` added.
4. Ash clicks **Update**, toggles the extension off and on, and presses **Ctrl+Shift+R**.

Alternatively, point Import Local at this checkout directly. Then remember never to commit `dev_mode`.

## Release checklist

1. Bump the version in `spindle.json`, `package.json` and `src/backend.ts` (`VERSION`). Use a version never installed locally.
2. Add a changelog entry at the top of `## Changelog` in `README.md`, and update the features table if needed.
3. Run `bun dev/build.ts`, then `bunx tsc --noEmit -p .`, the scanner grep (see CLAUDE.md), and `python dev/run.py` (read the output).
4. Check that `spindle.json` has **no** `dev_mode`, and that `permissions` lists everything used.
5. Commit everything, including `dist/`. Tag `vX.Y.Z` and push (ask Ash first).
6. On GitHub, create a release from the tag with the notes (`docs/releases/vX.Y.md` doubles as the Discord post). Attach `lumi-flair-vX.Y.Z.zip` (LICENSE, README, IDEAS.md, package.json, spindle.json, dist/ and src/, as in earlier releases) and, if useful, previews made with `python dev/run.py record_gif.py <effect>` and `widget_shots.py`.
7. Write the Discord post (under 2000 characters; title plus emoji sections, matching earlier posts).
8. Users update with Extensions → Lumi Flair → **Update**, then Ctrl+Shift+R.

## History

- **v1.0.0:** first public release.
- **v1.1:** Creamy, Black Hole ✦, Petal Storm ✦.
- **v1.2:**
  - Your own sounds (IndexedDB library, scene/lighting/always/interface slots).
  - Floating volume widget (`ui_panels`).
  - Background dim/mute.
  - Splash (hose gush; `stepWater` / `drawWater`, single-Path2D rendering).
- **v1.3 (released as 1.3.1, tag `v1.3.1`):** AI sound effects (`<flair sfx="…">`): 14 built-in cues, off by default, your own files per cue (`sfx:<name>` slots). Ash has heard and approved all 14, including the retuned door creak. Levels and character are guarded by measurements (`test_sfx_cues.py`).
  - Fixes in the same release, from Ash's iPhone: achievements lost across restarts (an early write over the saved copy, and a panel that never drew them until another event; see "Never change or save a store before it has loaded"), the unlock card under the status bar, the light rays and scene effects being heavy, and the home button reloading the page (see "Phones"; Ash confirmed on his iPhone that it is fixed).
  - Also from the phone: suggestion chips stuck on the first swipe and piling up (now follow the swipe on screen), and the floating volume control cluttering the screen (now collapses to a round button, which is how it starts on a touch screen). 1.3.0 was installed locally and tested; these are in 1.3.1, which is the public v1.3 release (1.3.0 was never published).
