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
| `lumiverse.html` | A mock Lumiverse page with a ChatView, MessageList, drawer and composer. It provides a fake `ctx` covering settings, events, permissions, a float widget (needs `ui_panels`), the file picker, theme generation (`vendor/lumiverse-theme.js`: Lumiverse's own theme code, kept local and git-ignored; without it only `test_theme.py` can't check colours) and backend vault messages. Test helpers: `__emit(event, payload)`, `__granted`, `__pickFiles`, `__sent`, `__cleanup()` |
| `effects.html` | Just the canvas engine. `fireFx(effect, k, noFlash)` fires a send effect from the fake send button (dark/light via `body.className`) |
| `nav.html` | Story-navigator emulator with a virtualized list that lazy-loads older messages |
| `scape.html` | Soundscape engine alone |
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

## Tools (`dev/tools/`)

| Tool | Use |
|---|---|
| `effect_frames.py [effect] [k]` | Frame sheet in dark and light, plus a check that the canvas clears |
| `record_gif.py [effect] [ms] [theme]` | Preview GIF for releases and Discord |
| `bench.py [effect …]` | ms per frame at 1× and 2× intensity (compare with `bun dev/build.ts --baseline <old checkout>`) |
| `widget_shots.py` | Volume widget in 3 states × 2 themes under deliberately hostile host CSS |

## Adding a test

Copy the closest existing test.

- Boot the page with an `add_init_script` that seeds `localStorage['lumi_flair:vault:settings']` with `{at:1, data:{welcomed:true, …}}` (that skips the welcome screen) and sets `window.__granted`.
- Then wait for `window.__ready===true`.
- Collect `pageerror` and console errors, and print `errors [...]` at the end.
