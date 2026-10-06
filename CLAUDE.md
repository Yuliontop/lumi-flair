# Lumi Flair: notes for Claude

Lumi Flair is a **Lumiverse extension** (Spindle API) that makes AI chats feel alive. It covers send effects, glow, ambient scenes, cinematic lighting, procedural soundscapes, the user's own sounds, AI-directed text and screen effects, Flair Packs that theme Lumiverse, character auras, the story heartbeat, Moment Cards and achievements.

- **Author:** Ash ([yuliontop](https://github.com/yuliontop)).
- **Public repo:** https://github.com/yuliontop/lumi-flair (MIT).
- **Positioning:** atmosphere and feel. Stat and tracker extensions (SimTracker, DataCat) are a different niche.

Read `docs/DEVELOPMENT.md` before changing code, and `docs/ROADMAP.md` for what's next.

## Commands

| What | Command |
|---|---|
| Build the extension and test pages | `bun dev/build.ts` (writes `dist/` and `dev/mock/build/`) |
| Build the extension only | `bun run build` |
| Typecheck | `bunx tsc --noEmit -p .` |
| Mock server | `python -m http.server 8765 -d dev/mock` |
| All tests | `python dev/run.py` (needs `pip install playwright pillow` and `python -m playwright install chromium`) |
| One test or tool | `python dev/run.py test_custom_sounds.py` · `python dev/run.py effect_frames.py blackhole` · `python dev/run.py bench.py splash` |
| Audio fixtures (once) | `python dev/make_fixtures.py` |
| Copy into Ash's local install | `python dev/deploy_local.py` (a full `python dev/run.py` that passes does this itself) |

The tests print what they observe rather than asserting it. **Read the output.** `dev/run.py` only flags crashes and non-empty `errors [...]` lines. `dev/README.md` lists what each test covers.

## Rules that bite (each one learned the hard way)

1. **Versions.** Lumiverse now keys the frontend bundle cache on the bundle's size and mtime (`getFrontendBundleCacheKey` in Lumiverse's `src/spindle/manager.service.ts`), so a rebuilt bundle is picked up under the same version. Older hosts cached by `identifier:version`.
   - **Ash's naming:** work toward a release stays on that release's version (all of v1.5 work is 1.5.0); don't bump to 1.5.1 etc. for each test round unless Ash asks.
   - The version lives in three places: `spindle.json`, `package.json` and `VERSION` in `src/backend.ts`.
   - Versions installed so far: 1.1.0–1.1.2, 1.2.0–1.2.3, 1.3.0, 1.3.1, 1.4.0, 1.4.1, 1.4.2, 1.4.3, 1.4.4, 1.4.5, 1.4.6, 1.4.7, 1.4.8, 1.4.9, 1.4.10, 1.4.11, 1.4.12, 1.5.0. Public is 1.5.0 (tag `v1.5.0`, the "v1.5" release: cursor trail). v1.4 was 1.4.11 plus the 1.4.12 fix; v1.3 was 1.3.1. Tags are `vX.Y.Z`; release titles say "vX.Y".
   - After installing, Ash presses **Ctrl+Shift+R**.
   - **Deploy automatically.** When a feature or fix is done (built, tests green), run `python dev/deploy_local.py` without being asked; a full passing `python dev/run.py` already does. Ash tests from that folder and doesn't want to copy by hand.
2. **`dist/` is committed.** Lumiverse installs straight from GitHub without building. Always rebuild before committing.
3. **Backend install scanner.** `dist/backend.js` must not contain the following (check with grep before every release):
   - `eval(`, `Function(` / `new Function(`
   - base64 decoding (`Buffer.from(…, "base64")`; avoid `atob` and `btoa` too)
   - `fs`, `child_process`, `net`, `tls`, `http`, `https`, `dgram`, `worker_threads`, `cluster`, `bun:sqlite` / `node:sqlite`
   - `Bun.*` system calls, `process.env`, `process.exit`

   Grep:
   `grep -nE "\beval\(|new Function|atob|btoa|base64|require\(|from ['\"](node:)?(fs|child_process|net|http|https|worker_threads|bun:sqlite)['\"]|Bun\.|process\.env" dist/backend.js`
4. **Manifests: the public one has no `dev_mode`.** Ash's local test install (Lumiverse → Import Local, at `<Lumiverse>/data/extensions/lumi_flair/repo/`) uses a copy of `spindle.json` with `"dev_mode": true`. Don't commit `dev_mode`.
5. **Setting keys must be `module:name`** (for example `flair:settings`). A plain `config` key silently fails to save.
6. **Lumiverse styles native form controls globally** (for example `input[type=range]`).
   - In anything mounted into host UI (float widgets, overlays), prefer self-drawn controls.
   - Scope every rule under your root class, and reset `margin/padding/text-align/line-height` on `.root, .root *`.
   - Inside the drawer panel, use `ctx.components.*` (the host's own select, switch, range and textarea).
7. **Chat rows are virtualized.**
   - Target only `data-component`, `data-part` and `data-message-id`; CSS-module class names are hashed.
   - Style messages with CSS rules keyed by message id, or use `ctx.dom.inject` (which replays). Never toggle classes on host nodes once.
8. **Audio needs a user gesture.** Resume WebAudio and retry blocked `<audio>.play()` on the next pointer or key press. Honour background dim/mute through the soundscape master gain.
9. **Accessibility is a feature.** Respect `prefers-reduced-motion` (`motionAllowed()`) and **No flashing** (`noFlash`): no flashes, flicker or camera shake when it's on. Effects must leave the canvas fully cleared afterwards.
10. **Performance.**
    - Benchmark heavy canvas work with `dev/tools/bench.py`; rAF timing is too noisy to trust.
    - In Skia, one ellipse per path beats one huge batched path, and an offscreen-canvas composite cost about 8 ms per frame.
    - Battery saver (`perf.ts`) must be able to tone effects down.
11. **Features that spend the user's tokens or credits** (extra LLM calls, image generation) must be opt-in and say so in the UI.
12. **Permissions are optional and live.** Declared: `interceptor`, `app_manipulation`, `ui_panels` and `memories`.
    - Request a permission only when the user turns on the feature that needs it (`ctx.permissions.request`).
    - Degrade gracefully when it's missing.
    - The frontend has no permission-change event, so re-check with `getGranted()`.
13. **i18n.** Every UI label goes through `tr()`, with translations in `src/i18n-dict.ts` (zh, zh-TW, ja, fr, it). Long hints may stay English.
14. **Never change or save a store before it has loaded.** On a cold start the host replays old messages through our tag interceptors while `vault.loadAll()` is still running, and a save is stamped "now", so it beats every older copy. Use `badges.whenLoaded(...)` / `beats.whenLoaded(...)`; the vault and the settings store ignore early saves. Anything the panel draws from `status()` must be drawn once when the panel is built.
15. **Phones are the tight case (Ash's iPhone; iOS kills a home-screen app that runs short of memory).** Keep layers flat: no blend modes, masks or live filters, animate only `transform` / `opacity`, never animate an invisible layer, step slow movements under `@media (pointer: coarse)`, and don't run a frame loop that has nothing to watch. Fixed overlays sit below the notch with `var(--app-interactive-safe-top, env(safe-area-inset-top, 0px))`. Details and what the tests enforce: `docs/DEVELOPMENT.md` → Phones.

## Releasing (Ash publishes; see docs/DEVELOPMENT.md → Release checklist)

1. Bump the version (three places) and add a README changelog entry.
2. Run `bun dev/build.ts`, the typecheck, the scanner grep and `python dev/run.py`.
3. Commit (including `dist/`), tag `vX.Y.Z` and push.
4. Draft the GitHub release notes and the Discord post (Ash posts it; keep it under 2000 characters).

Git commits use Ash's GitHub identity. Ask before pushing or tagging.
