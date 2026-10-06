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
| `heartbeat.ts`, `navigate.ts` | Story heartbeat chart (with a star for each pinned moment), and jumping to any message (even unloaded ones) |
| `moments.ts` | Pinned moments ("favourite moments"): the `Pin` data per chat (one pin per message), `normalizePins`, the star icon and its CSS. The star button is registered in `frontend.ts` next to the Moment Card button; the reel is the "Favourite moments" section in `panel.ts` |
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
- **Message positions are window-relative.** `ctx.messages.listMessageIds()` is the chat store's array, i.e. only the messages loaded so far; the heartbeat's `i` and a pin's `i` are indexes into that, so they can shift when older messages load. Place things by message id where you can; `i` is only the fallback (a pin on a message with no heartbeat point sits at the nearest point).
- **Lumiverse's memory API** (`spindle.memories`, backend only, permission `memories`).
  - Write surface: `entities.upsert` plus `entities.addFacts(id, facts)`. **Facts can only be added**: there is no remove or edit. A fact the entity already has (compared in lower case) is skipped.
  - The host keeps at most 30 facts per entity and drops the lowest-importance ones first; facts added through the API carry no importance, so the Memory Cortex's own extractions can push ours out.
  - The AI sees an entity through the `{{entities}}` snapshot: only the **last 6 facts** of the **active** entities (the ones the retrieval matched, the most salient first), and only when the Memory Cortex is on. A made-up entity like "Favourite moments" would never be active, so pins go on the **speaker's own entity** (found by name, created as a `character` if there is none). That is also why a pin with no speaker name (your own message, when the page doesn't show a persona name) is not saved.
  - A Cortex **rebuild** deletes entities that aren't user-curated, and our facts with them. "Save this chat's pins to memory" re-adds them (it is safe to repeat).
  - We cut each saved line to ~160 characters, so a pin costs the user a few tokens through Lumiverse's own memory budget; Flair adds none. `dev/tests/pin_memory_backend.ts` runs the real backend against a stand-in with these rules.
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
- **v1.4 (released as 1.4.11, tag `v1.4.11`):** pinned moments first (1.4.0), then the character intro (1.4.2, 1.4.3), theater mode (1.4.4), QoL fixes (1.4.5-1.4.9) and typewriter pacing (1.4.10) (see ROADMAP).
  - Pinned moments (1.4.0, 1.4.1): a star in each message's action pill (and `Flair: Pin the latest message…`, and a panel button) pins the message, or the selected line if one is selected; stars on the heartbeat; the reel in the panel (jump, remove). Stored per chat in the new `moments` vault file (`VAULT_NAMES` and the backend's `VAULT_FILES`). Optional "Save pins to Lumiverse memory" (`pinMemory`, `memories` permission, backend `pinsToMemory`): see "Lumiverse's memory API" below. Ash chose this over a Flair prompt note because the sound effects already add tokens.
  - Typewriter pacing (1.4.10), `src/typewriter.ts`.
    - **Feasibility:** the host renders streaming text itself and already rewrites it as it arrives (MessageContent's layout effect wraps each new chunk in a `chunkFade` span), so changing or delaying its DOM would fight it. Instead the not-yet-revealed text is painted transparent with the **CSS Custom Highlight API**: one `Range` from the reveal point to the end of the message, registered as `lf-typewriter`, styled by `::highlight(lf-typewriter)` in `TYPEWRITER_CSS`. No host node is touched. Needs Chrome/Edge 105+, Safari 17.2+, Firefox 140+; the panel says so when it's missing.
    - **No flash:** while a reply streams, a MutationObserver on the message list re-measures and re-hides in the same task the host adds text (observer callbacks run before paint). A frame loop moves the reveal point only while there is something to reveal, and stops when it has caught up (the observer wakes it).
    - **Pace:** `typewriterCps` (default 40/s). Never more than 1.5 s behind what has arrived: anything beyond is worked off linearly in ~0.5 s (a proportional speed-up approaches but never reaches the end; the first version did that). After GENERATION_ENDED/STOPPED the rest is out by a 0.6 s deadline, then the highlight is deleted. Continue keeps the message's old text (`targetMessageId` measured at the start). Text inside a closed `<details>` within the message (reasoning) is skipped so it can't stall the reveal. Off when motion is reduced; turning it off, switching chats or disposing shows everything at once; a 5-minute safety stop.
    - **Keys:** `SoundBoard.key()`: a filtered noise tick with a short low body, a deeper softer one for spaces, ±6% random, pitch from `moodPitch` (the mood). At most one per 55 ms, every 2-4 characters; only with interface sounds and `typewriterSound` on; honours background dim/mute; never plays late (needs a running context). Own sound: the `ui:key` slot ("Typewriter key"), decoded once and played cut to 0.25 s.
    - The panel has a sample paragraph and "Preview typewriter" (uses the same highlight on the sample). `test_typewriter.py` streams like the host (chunks in their own spans).
  - QoL (1.4.6):
    - **Buttons in the message action pill.** The host's pill (`BubbleActions`) is a flex row of 26 px buttons, but the decorator root it gives extensions is a plain block `div` (`data-spindle-extension-root`), so our buttons stacked under the row. `MOMENT_CSS` makes that root `display: contents` (only the one holding `.lf-moment-btn`) and sizes ours like the host's (26 px, 13 px icons).
    - **Moment Cards** (1.4.6, framing in 1.4.7) are a 1600×1000 card saved like a macOS window capture: `renderMomentCard` draws the card (`drawCard`), then places it with 40 px rounded corners on a transparent 1792×1216 image with two soft downward shadows and an edge in the character's colour. The card is the only shape: 1.4.7 still drew a full backdrop with a second, inset panel on it, which read as "a background"; 1.4.8 removed the inner panel (the PNG keeps its alpha; the modal preview shows the image as it is). Layout: portrait and name on the left, the quote on the right, the largest type at which it all fits, else the smallest with "…"). The modal (760 wide) has the text that goes on the card in a host textarea: it starts with what was selected in the message when the camera was pressed (read on `pointerdown`, like the star), else the whole message; "Use selection" keeps the part selected in the box, "Whole message" resets, free editing works, the preview redraws after 220 ms, and a note says when the text was shortened. The avatar image is cached between redraws.
    - **Modals and drags (1.4.9).** `ctx.ui.showModal` closes on any click whose target is its backdrop, and a text selection dragged from inside the modal to outside ends in exactly that click (it goes to the element the press and the release share). Every Flair modal calls `keepOpenWhileDragging(modal.root)` (`src/modal.ts`): a click whose press started inside the modal and lands outside it is stopped in the capture phase. A real backdrop click still closes it. `test_modal_drag.py` drags with the real mouse against a mock backdrop that closes like the host's (`window.__modalBackdrop`), and fails without the guard.
  - Theater mode (1.4.4), `src/theater.ts` plus the "Theater mode" block in `frontend.ts`.
    - **How it hides the interface:** while on, `<html>` carries `data-lf-theater` and one stylesheet, written into a dynamic `<style>` only for that time (so it costs nothing otherwise; the `:has()` rules are never live while off). It hides the host's chrome by stable selectors (`CHROME` in `theater.ts`: `data-component` for the title bar, quick toolbar, find bar, scroll button, action pill and swipe controls; `data-spindle-mount` for the docks, headers, sidebars and `message_actions`; hashed classes by substring for the notice dock, portrait panels and the long-message toggle). Nothing on a host node is touched, except that the host's drawer is closed by pressing its tab button when `ctx.ui.events.getDrawerState().open` (the host offers no close call to extensions).
    - **The side drawer** (`ViewportDrawer`) sits outside `<main>` (z-index 9992, above anything we could raise inside `<main>`'s stacking context), so it has to be hidden itself: `div:has(> div > [data-spindle-mount="sidebar"])` is its wrapper, and `[class*="_backdrop_"]:has(+ div > div > [data-spindle-mount="sidebar"])` the dimmer behind it on a phone.
    - **Reading:** text is `calc(14px * var(--lumiverse-font-scale) * theaterScale)` on `[data-component="MessageContent"]`, the chat keeps the width the user chose in Lumiverse (the first version capped it at 600 px x the text size, which looked thin on a wide screen; never override `--lumiverse-chat-content-width` or the list's side padding), the host's long-message collapse (max-height, fade mask, "show more") is lifted, and a little room (96 px, the height of the control bar) goes under the last message so the bar never covers the last lines. It is deliberately small: the host follows a streaming reply only while you are near the bottom, and a big gap (the first version had 38vh) would look like "scrolled up". Even so, whether you were at the end of the chat is read **before** the stylesheet goes on.
    - **Auto-scroll:** `scrollTop` steps at `SPEED_LEVELS` px/s (levels 1-8, default 3 = 22), from a float carry. It waits `RESUME_MS` after you scroll, touch or press a key, and is not running at all while paused or hidden; at the end of the chat it checks every 600 ms from a timer, not a frame loop. It starts paused when motion is reduced or `theaterScroll` is off. On entering it starts at the beginning of the message you came from (the corner-brackets button in each message's pill), else at the start of the latest reply if you were at the end and it is longer than half the screen, else where you were.
    - **Controls:** a bar in its own `.lf-th-root` (not in the aria-hidden overlay: it has buttons) with leave, pause, speed, text size and a reply-box toggle (`data-lf-compose` keeps the composer visible; the bar then moves to the top). It fades after 3.2 s and returns on a tap, mouse move or key. Keys: Esc, Space, + and -, ignored while typing. Leaving the chat (home screen) ends the mode, because the home screen needs the interface it hides. Entry points: the `theater` command, an Extras-menu action, the panel button, and the message button.
    - Tested in `test_theater.py` against a mock that is given host-like chrome; **never run against the real host's DOM** (the selectors are read from its source).
  - Character intro (1.4.2), `src/intro.ts` plus the "Character intro" block in `frontend.ts`. Called "intro" everywhere because `characterEntrance` already means the bloom a reply gets when it finishes.
    - **Name card:** `checkActive()` calls `startIntro(chatId)` when the chat changes. It waits (up to ~3 s) for the chat to be on screen (a group chat has `[data-component="MessageList"][data-group-chat]` and gets no card), for the character's name (`ctx.characters.get`) and for an aura colour (`auras.latest()`, ~1.8 s at most, then the theme colour). Plays **every time a chat is opened** (1.4.2 played once per chat per page load, which Ash rightly found wrong: clicking off to the home screen and back onto the same chat must replay it). Skipped while the welcome is still to be seen, when Flair is off or `intro` is off. The card is centred on the `ChatView` rect clipped to the screen (a side panel may be open), fades in and out in ~2.3 s on transform/opacity only, and a tap or key press after 0.5 s sends it away without being swallowed.
    - **Theme sound:** `introSound` is a sound-library id and a `LOOK_KEY`, so a character with a profile has their own; without one it is the same for everyone. It plays through `SoundBoard.playFile(src, volume, 8)` (new `maxSeconds` argument), only with interface sounds on, never while the window is in the background and set to mute (dimmed to the background level otherwise), and only if the audio context is already running: a theme that starts after the card has gone is worse than none.
    - **Group chats:** the speaker is whoever `GENERATION_STARTED` names (`characterId`/`characterName`; this host's backend does not send `GROUP_TURN_STARTED`, which is handled too and adds the "2/3" count). The chip sits above the composer, level with the chat column and clamped to the screen. Colour: the avatar colour taken from a message with that name on screen (`auras.forSpeaker`), else from the streaming card (`auras.forStreaming`, polled for ~2.4 s), else a steady colour from the name (`hashColor`); remembered per character for the session. While someone writes, the other messages on screen go to 70% opacity through a temporary rule (`tempRule('groupspot')`, only inside `[data-group-chat]`, not the streaming card); it eases back when the turn ends. Impersonation, a different chat and `introGroup` off all leave it alone.
    - Command `Flair: Play the character intro`, and two preview buttons in the panel (the speaker chip can be seen without a group chat). Tested in `test_intro.py` against the mock; **never seen in a real group chat** (only fake events).
- **v1.3 (released as 1.3.1, tag `v1.3.1`):** AI sound effects (`<flair sfx="…">`): 14 built-in cues, off by default, your own files per cue (`sfx:<name>` slots). Ash has heard and approved all 14, including the retuned door creak. Levels and character are guarded by measurements (`test_sfx_cues.py`).
  - Fixes in the same release, from Ash's iPhone: achievements lost across restarts (an early write over the saved copy, and a panel that never drew them until another event; see "Never change or save a store before it has loaded"), the unlock card under the status bar, the light rays and scene effects being heavy, and the home button reloading the page (see "Phones"; Ash confirmed on his iPhone that it is fixed).
  - Also from the phone: suggestion chips stuck on the first swipe and piling up (now follow the swipe on screen), and the floating volume control cluttering the screen (now collapses to a round button, which is how it starts on a touch screen). 1.3.0 was installed locally and tested; these are in 1.3.1, which is the public v1.3 release (1.3.0 was never published).
