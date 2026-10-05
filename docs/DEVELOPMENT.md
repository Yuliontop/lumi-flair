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
| `persist.ts` | Auto-save vault: Lumiverse account settings (`flair:*` keys), a backend file, and a browser fallback. Backup and restore |
| `panel.ts` | The "Flair" drawer tab, built from `ctx.components.*` |
| `effects.ts` | Canvas particle engine (`FxCanvas`) and every send-effect recipe: sparkle, ripple, comet, confetti, creamy, splash, black hole, petal storm |
| `cinematic.ts` | Light tint, rays, vignette, grain, lightning, camera shake, the black-hole chat warp |
| `ambient.ts` | Scene particles (snow, rain, embers, fireflies, petals, stars) |
| `soundscape.ts` | Procedural WebAudio beds per scene and light, the user's files layered in, the self-healing watchdog, background dim/mute |
| `sound.ts` | Interface chimes (send, receive, fanfare, sparkle, achievement), plus playing the user's files |
| `soundlib.ts` | The user's sound library (IndexedDB), with decode or stream sources |
| `soundwidget.ts` | Floating volume widget (`ctx.ui.createFloatWidget`, needs `ui_panels`) |
| `director.ts`, `choices.ts` | `<flair scene light mood>` stage directions and `<flair-choice>` chips (tag interceptors) |
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

## Lumiverse facts we rely on

- **Chat markup.**
  - Chat cards carry `data-component="BubbleMessage" | "MinimalMessage"` and `data-message-id`. The list is `data-component="MessageList"`, the view `data-component="ChatView"`.
  - Cards are `overflow:hidden; contain:paint`, and the list has about 20 px of side padding, so keep outer glow inside `--lf-room`.
  - Streaming cards force `box-shadow … !important`, so draw streaming effects with `::after`.
- **ChatView layers:** wallpaper z0, scrim z1, transition z2, body z3. Atmosphere goes at z2, appended last.
- **Zoom:** `<body>` carries the UI-scale zoom. Measure overlays with `getBoundingClientRect()`.
- **Message sanitizer:** keeps `span` and `data-*` and strips unknown tags. That's why text effects are `<span data-lf="…">`.
- **Interceptors** run after macro resolution, so don't put `{{user}}` in injected text.
- **Messages API:** `ctx.messages.listMessageIds()` covers only the loaded window. The frontend `messages.get` / `list` aren't implemented; `navigate.ts` handles that.
- **Frontend `ctx.permissions`** has only `getGranted()` and `request()`. There's no change event and no frontend toast API, so messages go in the panel.
- **`ctx.uploads.pickFile({accept, multiple})`** returns `bytes`. `maxSizeBytes` fails the *whole* pick, so check sizes per file.
- **Selects** (`ctx.components.mountSelect`) support `group` and `update({ options })`.
- **Theme engine:** `spindle.theme.generateVariables` also emits font, scale and radius variables. Flair strips those so the user's typography is untouched.
- **Large uploads to the backend:** use the tus endpoint `/api/v1/spindle-uploads` and `spindle.uploads.get`, not base64 messages. Backend base64 decoding trips the install scanner.
- **Float widgets:** max 4 per extension. Lumiverse Desktop can pop them out (`setSize`). An `entry_frontend_widget` bundle is optional (not used).

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
6. On GitHub, create a release from the tag with the notes. Attach previews made with `python dev/run.py record_gif.py <effect>` and `widget_shots.py`.
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
