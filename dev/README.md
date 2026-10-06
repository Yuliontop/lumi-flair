# Dev tools

A mock Lumiverse and browser tests (Python + Playwright). They load the **real** built extension, so build first.

## Setup (once)

```bash
pip install playwright pillow
python -m playwright install chromium
python dev/make_fixtures.py          # audio files for the custom-sound tests
```

`record_gif.py` also needs `ffmpeg` on your PATH.

## Every time

```bash
bun dev/build.ts                               # builds dist/ and dev/mock/build/
python -m http.server 8765 -d dev/mock         # leave this running in a second terminal
python dev/run.py                              # all tests, outputs and screenshots go to dev/out/
python dev/run.py test_custom_sounds.py        # one test
```

Use `LF_BASE=http://localhost:9000` if you serve the mock on a different port.

The tests **print what they observe** (they don't assert). Read the output; `run.py` only fails on crashes and non-empty `errors [...]` lines (page or console errors).

## Pages (`dev/mock/`)

| Page | What it is |
|---|---|
| `lumiverse.html` | A mock Lumiverse page with a ChatView, MessageList, drawer and composer. It provides a fake `ctx` covering settings, events, permissions, a float widget (needs `ui_panels`), the file picker, theme generation (`vendor/lumiverse-theme.js`: Lumiverse's own theme code, kept local and git-ignored; without it only `test_theme.py` can't check colours) and backend vault messages. Test helpers: `__emit(event, payload)`, `__tag(payload)` (fires the `<flair>` tag interceptor: `{attrs, content, fullMatch, messageId, chatId, isStreaming}`), `__granted`, `__pickFiles`, `__sent`, `__cleanup()` |
| `effects.html` | Just the canvas engine. `fireFx(effect, k, noFlash)` fires a send effect from the fake send button (dark/light via `body.className`) |
| `nav.html` | Story-navigator emulator with a virtualized list that lazy-loads older messages |
| `scape.html` | Soundscape engine alone |
| `sfx.html` | AI sound cues alone. **Open it to listen:** one button per cue, a volume slider, and each cue's measured peak and length. `analyse(cue)` renders a cue offline for the tests |
| `cine.html` | The cinematic layer (light rays, tint, neon, grain) alone, over a busy wallpaper and blurred cards. `mount('new' \| 'old', light)`, `freeze(ms)`. `old` is the previous version and exists only after `bun dev/build.ts --baseline <checkout>` (see `test_cinematic.py`) |
| `bench.html` | Deterministic benchmark: `bench('B_NEW', effect, k)`. `B_OLD` exists when a baseline was built with `--baseline` |

## Tests (`dev/tests/`)

| Test | Covers |
|---|---|
| `test_persistence.py` | Auto-save to account + vault file + browser; slow and dead backend; backup and restore |
| `test_text_effects.py` | Per-effect toggles, prompt prefs, camera-shake gating |
| `test_theme.py` | Lumiverse theme matching (pack / character aware / mood / accent only / off) |
| `test_welcome.py` | First-run welcome |
| `test_packs.py` | Flair Pack import, save, export, re-import and remove |
| `test_navigation.py` | Heartbeat jump to unloaded and deleted messages |
| `test_heartbeat.py`, `test_heartbeat_cleanup.py` | Heartbeat dots, arrival bloom, point removal |
| `test_soundscape_resume.py`, `test_soundscape_toggle.py` | Soundscape self-healing and parking |
| `test_volume_widget.py` | Floating widget: permission flow, slider (click, keys, wheel), drag isolation, position save and clamp; background dim/mute measured on the real master gain |
| `test_custom_sounds.py` | Your sounds: upload and validation, scene / always / interface slots, preview, level, reload, delete, missing-file fallback |
| `test_custom_sounds_combo.py` | A lighting file over a generated scene; widget label for an always-play file |
| `test_ai_sfx.py` | AI sound effects: every cue has a preview button and a file slot and plays (by name and by near-miss name), plays once per streamed cue, never replays on the final render or for old messages, holds a non-streamed reply's cues until it ends and spaces them out, cap per message, swipe plays again, toggle, background dim/mute, volume 0, your own file for a cue. Asserts (non-empty `errors [...]` fails) |
| `test_sfx_cues.py` | Each cue rendered offline: peak level, length, silent tail, no NaN; a **character guard** per cue (so a retune can't turn the sword clash back into a bell); a loudness band so the cues sit together; cue-name matching and aliases. Asserts. It measures, it can't listen: use `sfx.html` for that |
| `test_achievements.py` | Achievements survive a restart, including when the page wakes up while the saved copy is still loading (slow server, dead server, old messages replayed at startup); the panel shows them straight away; the unlock card clears the notch / status bar (`--app-interactive-safe-top`). Asserts |
| `test_choices.py` | Suggestion chips follow the swipe on screen: a regenerate replaces them (the old ones must not stay, nor pile up), swiping back restores a variant's chips even though the host won't deliver its tags twice, a variant without chips shows none, tags and swipe event in either order, never a second set, a late host replay of the old set shows nothing, continue keeps its options, sending clears them. Asserts |
| `test_pins.py` | Pinned moments: a star on every kind of message, pin / unpin, a selected line is what gets pinned (even if the tap clears the selection; a selection in another message is ignored), the reel, stars on the heartbeat, remove, deleted message, the command, reload, a pin made before the saved copy has loaded is merged, junk in storage is cleaned. Asserts |
| `test_modal_drag.py` | A text selection dragged out of a Flair modal (Moment Card text box, "Save my look" name) doesn't close it; a real backdrop click still does; clicks elsewhere work afterwards. Uses the mock's opt-in host-like backdrop (`window.__modalBackdrop`). Asserts |
| `test_moment_portrait.py` | The Moment Card's round portrait is fully covered for wide and tall pictures, and uses the character's own square crop (`extensions.avatar_crop_image_id`, served at `?size=lg`) when there is one; a crop id that isn't a plain id is ignored. Serves Lumiverse-style image addresses itself. Asserts |
| `test_moment_card.py` | Our buttons in a host-like action pill (one row, host size), the wide 1600x1000 card, choosing the text (a selection made in the message before pressing the camera, "Use selection", "Whole message", editing), the preview following, the too-long note, Download. Asserts |
| `test_typewriter.py` | Typewriter pacing against a host-like stream (bursty chunks in their own spans): new text hidden before paint, smooth steady reveal at the chosen pace, never far behind after a big burst, quick finish and highlight removed at the end, continue keeps old text, closed reasoning block doesn't stall it, key sounds (count, rate limit, off), switched off / reduced motion / leaving the chat / turned off mid-reply, the panel preview and the "Typewriter key" slot. Asserts |
| `test_theater.py` | Theater mode: host-like chrome hidden and restored (title bar, quick toolbar, top dock, scroll button, action pill, side drawer and its backdrop), reply box and its toggle, larger type, a long reply shown in full, the open drawer closed through its tab, the control bar (shows, fades, returns), the auto-scroll (speed, pause with no frame loop, waits while you scroll, stops at the end, paused for reduced motion or when switched off), where it starts, the message button, text size limits, keyboard (and not while typing), leaving the chat, being switched off mid-way, the panel and Extras entry, a phone. Asserts |
| `test_intro.py` | Character intro: the name card (text, aura colour, portrait, centred on the chat, leaves by itself or when tapped without eating the tap), every time a chat is opened (also off to the home screen and back onto the same chat, and quick flips), off / welcome unseen / Flair off, reduced motion, auras off, a long name on a phone; the theme sound (list follows uploads, stored globally or in a character's profile, plays once, silent with interface sounds off or a missing file); the command and previews; group chats (no card; the chip, its colour from the avatar, remembered colour, hand-over, turn count, dimming and its release, impersonation, leaving the chat). Asserts |
| `test_pin_memory.py` | Saving pins to Lumiverse memory: runs the built backend against a stand-in memory API (`pin_memory_backend.ts`: finds or creates the speaker, adds a short fact, skips duplicates and unnamed or empty pins, caps a request, reports failures) and checks when the page asks for a save, what the panel says, and the permission flow. Asserts |
| `test_widget_collapse.py` | The floating volume widget collapses to a round button: shape and what shows in each state, folds / opens on the spot toward the nearer screen edge, a drag doesn't open it, remembered across reloads, starts collapsed on a touch screen, stays inside a phone-sized window, keyboard (space / enter) and focus. Asserts |
| `test_cinematic.py` | The light layer is cheap and unchanged: nothing in it uses a blend mode, mask or live filter; every animation moves only `transform` / `opacity`; nothing animates while invisible; the rays are a small image that follows the chat area's shape; slow movements are stepped on a touch screen. With a baseline built, a **pixel comparison** with the previous version for every light at desktop and phone size. Asserts |
| `test_mobile_perf.py` | Phone behaviour: the scene is drawn at ~30 fps on a touch screen (~60 on a desktop); the governor's frame loop only runs when something animates; the atmosphere goes the moment the host starts leaving the chat (`data-chat-chrome-leaving`, the home button); closing a chat doesn't re-inject the stylesheet and defers the whole-UI colour work. Asserts |

## Tools (`dev/tools/`)

| Tool | Use |
|---|---|
| `effect_frames.py [effect] [k]` | Frame sheet in dark and light, plus a check that the canvas clears |
| `record_gif.py [effect] [ms] [theme]` | Preview GIF for releases and Discord |
| `bench.py [effect …]` | ms per frame at 1× and 2× intensity (compare with `bun dev/build.ts --baseline <old checkout>`) |
| `bench_cine.py [light …]` | Frames drawn and painting work per second for the light layer, previous version vs now, on a phone-sized page (needs the baseline). Chromium's software renderer, so it is a relative signal, not an iPhone frame time. To make a baseline: `mkdir -p dev/out/base/src && git show <commit>:src/cinematic.ts > dev/out/base/src/cinematic.ts && git show <commit>:src/effects.ts > dev/out/base/src/effects.ts && bun dev/build.ts --baseline dev/out/base` |
| `pin_shots.py` | Pinned moments (the star under a message, the reel, the heartbeat stars) in dark and light |
| `widget_shots.py` | Volume widget in 5 states (open: playing / dimmed / off; collapsed: playing / off) × 2 themes under deliberately hostile host CSS |
| `prompt.ts` | `bun dev/tools/prompt.ts [pref=value …]` prints the exact instructions the AI receives (`{{flair_tags}}`) from the built `dist/backend.js`, with a token estimate |

## Adding a test

Copy the closest existing test.

- Boot the page with an `add_init_script` that seeds `localStorage['lumi_flair:vault:settings']` with `{at:1, data:{welcomed:true, …}}` (that skips the welcome screen) and sets `window.__granted`.
- Then wait for `window.__ready===true`.
- Collect `pageerror` and console errors, and print `errors [...]` at the end.
