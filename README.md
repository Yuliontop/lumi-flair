# Lumi Flair

Lumi Flair lets the story control the room. It adds theme-aware motion, glow, weather, lighting and sound to [Lumiverse](https://lumiverse.chat), and it's built on the Spindle extension API.

## Install

1. In Lumiverse, open **Extensions → Add Extension**.
2. Paste `https://github.com/yuliontop/lumi-flair` and install.
3. Enable **Lumi Flair**. A welcome screen lets you pick a look and turn on the optional extras, and a **Flair** tab appears in the sidebar.

To update later, click **Update** on Lumi Flair in the Extensions panel. Your settings, packs and achievements are kept (see *Your settings are saved automatically* below).

## Features

### Atmosphere

| Feature | What it does |
|---|---|
| **Ambient scenes** | Snow, rain, embers, fireflies, petals or a starfield, drawn above your wallpaper but behind the messages. Set one per chat, or let lorebook entries and the AI switch it |
| **Cinematic lighting** | Dawn, day, dusk, night, candle, storm and neon light, with a vignette, film grain and light rays. Storm light adds lightning |
| **Soundscapes** | Rain, wind, crackling fire, crickets, birdsong and a space hum, generated live with no audio files. They crossfade with the scene and recover by themselves if the browser pauses audio |
| **AI sound effects** | The AI adds short sound cues to its replies (a door knock, a sword clash, a heartbeat, thunder…) that play as the line appears. 14 cues are generated live with no audio files, and you can assign your own file to any of them. Off by default |
| **Volume widget** | An optional floating pill you can drag anywhere: turn the ambience on or off and set its volume without opening the panel. It shows what's playing and remembers where you left it. Fold it into a small round button to keep the screen clear (it starts that way on phones) |
| **Your own sounds** | Upload your own audio (MP3, OGG, WAV, M4A, FLAC…) and use it as a seamless looping ambience for any scene or lighting, as one track that always plays, as a character's intro theme, or as your send, reply, milestone, achievement, screen-effect and typewriter-key sounds. Files stay in your browser, with a level control and preview for each |
| **Background sound** | Optionally dim (to a level you choose) or mute the soundscape while you're in another window or app, then fade it back when you return |
| **Character intro** | Opening a chat plays a short name card in the character's aura colour, with an optional theme sound from your library (each character can have their own). In group chats a small chip names whoever is speaking, in their own colour, and the other messages dim while they talk |
| **Typewriter pacing** | Replies appear at a steady pace instead of in bursts, as if typed, with soft key sounds that follow the character's mood (or your own sound). Off by default |
| **Camera shake** | A short shake when a reply shouts with `big` or `shake` text |
| **No flashing** | One switch replaces every flash with a soft fade and stops flicker, for light-sensitive viewers |

### Glow & colour

| Feature | What it does |
|---|---|
| **Send effects** | Sparkle, ripple, comet, confetti or **Creamy** (a whale-spout of white cream that erupts and rains back down), **Splash** (a hose-like gush of clear water that tears into big clumps and thins into spray, rippling where it lands) from the send button. For an overkill experience: **Black Hole ✦** (a singularity swallows the screen, collapses to a white dot and detonates) and **Petal Storm ✦** (a full-screen gale of blossoms). Your message pops in, and the AI's reply blooms when it finishes |
| **Hover glow** | A soft glow, neon edge or a light that runs around the message border, plus a breathing aura while the AI writes. On touch screens, **Tap glow** does the same |
| **Mood-reactive glow** | The glow follows the character's expression: red for anger, gold for joy, blue for sadness, and so on. The colours are yours to edit |
| **Character auras** | Each character's messages take a signature colour sampled from their avatar, which is great in group chats |
| **Time of day** | A peach dawn, an amber golden hour and an indigo night tint |
| **Swipe transitions & thinking composer** | Swipes slide in from the side you swiped to, and the input box breathes while a reply is generating |

### Flair Packs & Lumiverse themes

| Feature | What it does |
|---|---|
| **Flair Packs** | One-click looks: Lumi Classic, Cozy Fantasy, Cyberpunk Neon, Horror, Sakura Romance, Deep Space, Noir and **Character Aware** |
| **Lumiverse theme matching** | Packs can restyle Lumiverse itself (accent, backgrounds, dialogue colours) through Lumiverse's own theme engine, so everything stays readable in light and dark mode. Your font, UI scale and saved theme are never changed |
| **Character Aware** | Glow and theme follow whoever is speaking, using their aura colour |
| **Your own packs** | **Save my look** turns your setup into a pack. Import and export `.flair.json` packs to share with others |
| **Character profiles** | Give one character their own effects, colours, scene and text-effect choices |

### Storytelling with the AI

| Feature | What it does |
|---|---|
| **Text effects** | The AI styles phrases with `shake`, `glow`, `whisper`, `rainbow`, `pulse`, `big`, `typewriter`, `fade`, `glitch` and `flicker`. Choose how often, and switch off any effect you don't like |
| **Scene Director** | The AI sets the weather, lighting and mood as the story moves: `<flair scene="rain" light="night" mood="tense"></flair>` |
| **Screen effects** | At big moments the AI can trigger confetti, sparkles and more |
| **Choice chips** | When you face a decision, the AI offers 2–3 next moves as buttons under its reply. They follow swipes: each version of a reply keeps its own set |

### Fun & sharing

| Feature | What it does |
|---|---|
| **Story heartbeat** | A chart of each chat's emotional arc. Click any point to jump to that message, even far back in the chat |
| **Moment Cards** | Turn any reply, or just the lines you pick, into a wide share-ready image with the avatar, name and quote. It saves like a window capture: rounded corners and a soft shadow on a transparent background |
| **Favourite moments** | Pin any message, or a selected line, with the ★ under it. Pins collect in a reel in the panel, show as stars on the story heartbeat and jump you back to the moment. Optionally they're saved to Lumiverse's memory so the AI remembers them |
| **Theater mode** | One click hides the interface and leaves the story full-screen, with larger type, long replies shown in full and a gentle auto-scroll. The atmosphere and soundscape carry on |
| **Achievements** | 15 badges, such as Night Owl, Showstopper and a 7-day streak |
| **Celebrations** | Confetti at message milestones, plus your own keyword triggers (`happy birthday => confetti`) |
| **Sounds, spotlight & commands** | Soft synthesized chimes, a spotlight reading mode, and 15 `Flair: …` commands in Ctrl/Cmd+K |

### Comfort & compatibility

| Feature | What it does |
|---|---|
| **Battery saver** | Lightens effects automatically if your device struggles, and follows Lumiverse's Efficiency mode |
| **Reduced motion** | Respects your OS setting: glows stay, movement goes |
| **Made for phones** | Scene effects are drawn lighter on touch screens, the atmosphere steps aside while Lumiverse changes screens, and pop-ups respect the notch on iPhone home-screen apps |
| **Translations** | Labels in 简体中文, 繁體中文, 日本語, Français and Italiano (longer hints are English for now) |
| **Auto-save & backup** | Settings save themselves to your account and a config file. **Back up settings** and **Restore from file** are in General |

## Your settings are saved automatically

Every change you make is saved within a fraction of a second, to three places at once:

| Where | Why |
|---|---|
| **Your Lumiverse account** (`ctx.settings`) | Follows you to every device and browser you sign in from |
| **A config file on the server**: `data/users/<your id>/extensions/lumi_flair/settings.json` (plus `achievements.json`, `heartbeat.json` and `moments.json`) | A readable JSON file you can back up. It lives outside the extension folder, so it survives removing and re-importing Flair |
| **This browser** (localStorage) | Instant, and still works if the server is briefly unreachable |

When Lumiverse starts, Flair reads all three copies and uses the **newest** one, then refreshes any copy that is missing or older. If the server is slow to answer, Flair waits for it before writing to the file, so a slow start can never replace your saved config with the defaults.

**General → Back up settings** downloads everything (settings, character profiles, achievements and heartbeat) as one file. **Restore from file** loads it back. Restore also accepts a `settings.json` config file.

> **Upgrading from v0.3.0 or earlier:** those versions didn't save settings at all (see the changelog), so set your look once more after updating. From now on it sticks.

## Permissions

Lumi Flair requests four permissions. All are optional, and Lumiverse asks for each one the first time you turn on the feature that needs it:

| Permission | Used for |
|---|---|
| `interceptor` | **Add the instructions to every prompt** (on by default). Flair adds a short styling note just before the latest message on each generation, so the AI keeps using text effects in nearly every reply. The note covers text effects, scene direction, screen effects and choices, following your settings. It appears as **Lumi Flair storytelling** in Prompt Breakdown. It's skipped for impersonate and quiet generations, and when `{{flair_tags}}` is already in the prompt |
| `app_manipulation` | **Lumiverse theme matching** (packs and Character Aware) through `spindle.theme.generateVariables` and `apply`, and **Tint the whole UI with the mood** (`applyPalette`, or folded into the matched theme). Both are layered and fully removable |
| `ui_panels` | The **floating volume widget** (Sound → Floating volume widget), a small draggable float widget. Nothing is shown unless you turn it on |
| `memories` | **Save pins to Lumiverse memory** (Favourite moments). Each pinned line is added to Lumiverse's memory as a short fact about whoever said it. Nothing is saved unless you turn it on, and it only ever adds |

## Teaching the AI

The easiest way is to grant `interceptor`, which adds the styling note automatically. Without it, put `{{flair_tags}}` in a preset block, the character card, or the author's note. Both use the same text, which follows the **How often the AI uses them** setting.

If you'd rather type short tags like `<shake>…</shake>`, add a display regex script that turns `<(shake|glow|whisper|rainbow|typewriter|fade|pulse|big)>(.*?)</\1>` into `<span data-lf="$1">$2</span>`.

## Scene direction and choices

With **Scene Director** on, the AI is asked to set the scene when the setting or mood changes:

```html
<flair scene="snow" light="night" mood="melancholy"></flair>
<flair effect="confetti"></flair>
<flair sfx="door-knock"></flair>
<flair-choice>Follow the footprints</flair-choice>
```

- **`scene`** accepts snow, rain, embers, fireflies, petals, stars or off. Aliases such as `storm`, `fire`, `sakura`, `space` and `clear` also work.
- **`light`** accepts dawn, day, dusk, night, candle, storm, neon or none.
- **`mood`** accepts any word in your mood map.
- **`sfx`** (needs **Sound → AI sound effects**) accepts door-knock, door-creak, door-slam, footsteps, sword-clash, glass-break, heartbeat, thunder, bell, whoosh, impact, magic, splash and fire-crackle. Near-misses such as `knock` or `rumble` are understood. A cue plays once as the reply streams in, at most a few per reply, and plays again if you swipe to a new version. It adds about 200 tokens to each request, so it is off until you switch it on.

The tags are removed from the displayed message. Priority for the scene is: your chat override, then the director, then the lorebook, then your default.

## Ambient scenes from the lorebook

When an activated lorebook entry's comment or keys contain `flair:snow`, `weather:rain`, `scene:off` and similar tags, the scene switches to match. Without a tag, Flair also recognises words like *rain, storm, snow, blizzard, campfire, forge, sakura, petals, night sky* and *galaxy*. The weather stays until another entry changes it. You can also pin a scene for a chat in **Ambient scene → This chat**.

## Development

```bash
bun install
bun run build       # → dist/frontend.js + dist/backend.js
bun run typecheck   # optional, needs TypeScript
```

The bundles build without `node_modules`, because the type package is only imported for types. `dist/` is committed, so Lumiverse can install straight from GitHub without building.

To test a local copy, put the folder at `Lumiverse/data/extensions/lumi_flair/repo/` and use **Extensions → Add Extension → Import Local** (owner/admin only).

> **Bump `version` in `spindle.json` with every change.** Lumiverse loads the frontend code from a URL keyed by `identifier:version`. If the version stays the same, browsers can keep serving the old cached copy after an update.

## How it works

| Piece | Mechanism |
|---|---|
| Soft glow edges | The chat list clips sideways at its padding (about 20px, or 8px on mobile). Flair measures that gap as `--lf-room` and keeps every outer shadow inside it (blur + spread ≤ room), so glows fade out instead of being cut off. Inner (inset) glow adds depth |
| Glow, ring, aura, text effects, spotlight | Global CSS on the public selectors `[data-component="BubbleMessage" \| "MinimalMessage"][data-part][data-message-id]` and `[data-lf]` spans. The trace is a masked `conic-gradient` rotated with `@property --lf-angle` |
| Colour pipeline | `--lf-c` is a registered `<color>`, so mood and time changes fade smoothly. It starts from the theme accent (or your custom colour), mixes in the time-of-day tint, then the mood colour |
| Bursts | A canvas in a `pointer-events: none` overlay, measured with `getBoundingClientRect()` so it lines up correctly at any UI Scale |
| Ambient | A canvas placed inside `ChatView` at z-index 2: above the wallpaper, scene background and text scrim (z 0–2), below the chat body (z 3). It reattaches whenever the chat view remounts |
| One-shot animations | Short-lived CSS rules keyed by message id, so they survive React re-renders and chat-list virtualization |
| AI screen effects | A `flair` tag interceptor (`removeFromMessage`). It only fires for replies that finished in the last 30 s, so reopening an old chat doesn't replay effects |
| Lighting | A second layer next to the ambient canvas, built from flat layers (a tint, a small pre-rendered light-ray image, a vignette) that only move with `transform` and `opacity`, so phones can keep them on the GPU. Lightning and camera shake are short CSS animations |
| AI sound effects | The `flair` tag interceptor also reads `sfx="…"`. Each cue is a short WebAudio recipe (noise bursts, resonant filters and sine partials), rendered live and routed through the soundscape's master gain, so volume and background dimming apply. Your own file for a cue replaces the generated one |
| Soundscapes | WebAudio graphs of filtered noise, LFOs and short grains. They start after your first click or key press, because browsers block audio until then |
| Auras | Reads the colour from avatar images that are already loaded, then writes `:has(img[src=…])` rules so the colour follows the avatar through virtualization |
| Message buttons (★ pin, Moment Card, theater) | Use `ctx.ui.registerDomDecorator` on the `message_actions` mount. This works in current Lumiverse but isn't in the published types yet. If a display mode has no action pill, use the panel or the commands instead |
| Typewriter pacing | Nothing in Lumiverse's message is changed: the part not revealed yet is painted transparent with the CSS Custom Highlight API (a range from the reveal point to the end), re-hidden by a MutationObserver before the browser paints new text. Needs Chrome/Edge 105+, Safari 17.2+ or Firefox 140+ |
| Theater mode | While it's on, one stylesheet hides Lumiverse's chrome by its stable selectors (`data-component`, `data-spindle-mount`) and enlarges message text; the auto-scroll moves the message list's `scrollTop` and only runs while there is something to scroll |
| Backend | Pushes the `{{flair_tags}}` macro, registers the commands, declares the tag-interceptor capability, and applies the optional mood palette |

## Compatibility notes

- Hover effects only run on devices with a mouse or trackpad (`@media (hover: hover)`). On touch devices, **Tap glow** takes their place.
- When your OS asks for reduced motion and **Respect reduce motion** is on, particles, scenes, text animation and entrance animations are skipped. Colours and glows stay.
- Command palette commands carry no user id. On an operator-scoped install (Import Local by an owner or admin), a command is broadcast, and every connected user's Flair settings apply it. On a single-user instance this makes no difference.
- Settings, achievements, heartbeat points and pinned moments are stored per user in your account settings and your own config files. Nothing leaves your server.

## Changelog

- **1.4.11 (release v1.4):** Center Stage.
  - **Favourite moments:** a ★ in each message's action bar pins the message, or just the line you selected. Pins collect in a reel in the panel (jump to it, remove it), show as gold stars on the story heartbeat, survive restarts (`moments.json`), and can also be added with `Flair: Pin the latest message…` or the panel button. Optionally, **Save pins to Lumiverse memory** adds each pin as a short fact about whoever said it, through Lumiverse's own memory API (needs the Memory Cortex and the optional `memories` permission, requested only when you turn it on; Flair adds no tokens of its own, and Lumiverse can only add facts, so unpinning doesn't remove one).
  - **Character intro:** opening a chat plays a ~2 s name card in the character's aura colour, with their portrait. Tap to skip; reduced motion gets a plain fade. An optional **theme sound** from Your sounds plays with it (per character when they have their own look). In group chats a chip above the composer names whoever is speaking, in their avatar colour, and the other messages dim to 70% while they write.
  - **Theater mode:** one click hides Lumiverse's interface (toolbars, docks, side drawer, action bars, reply box) and leaves the story full-screen, keeping your chat width. Text is larger (100–220%), long replies are shown in full, and a gentle auto-scroll (8 speeds) pauses while you scroll and stops at the end. A small control bar fades away and comes back with a tap: leave, pause, speed, text size, and a reply box so you can answer without leaving. Esc, Space and +/− on a keyboard. Start it from the button under any message (it starts reading there), the Extras menu, the panel or `Flair: Toggle theater mode`.
  - **Typewriter pacing:** an optional steady reveal of streaming replies (10–120 characters a second), never more than a moment behind what has arrived, with soft key sounds that sound lower when the character is sad and brighter when happy. Your own **Typewriter key** sound can replace them. Off by default; off with reduced motion.
  - **Moment Cards:** wide 1600×1000 cards (portrait on the left, quote on the right, as large as it fits), a text box to pick the lines that go on the card (or start from a selection in the message), a live preview, and a PNG saved like a window capture: rounded corners and a soft drop shadow on a transparent background.
  - **Fixes:** Flair's buttons sit in one row with Lumiverse's in the message action bar, at its size. Flair's windows (Moment Card, Save my look, Welcome) no longer close when a text selection is dragged outside them.
- **1.3.1 (release v1.3):** Living Sound, plus fixes from phones.
  - **AI sound effects:** the AI can write `<flair sfx="door-knock"></flair>` and the sound plays as the line streams in. 14 generated cues (door knock, creak and slam, footsteps, sword clash, glass break, heartbeat, thunder, bell, whoosh, impact, magic, splash, fire crackle), each with a preview button, and your own file can replace any of them under **Your sounds**. Off by default; a note of about 200 tokens is added to the prompt when it's on. Cues play once, never for old messages, at most a few per reply, again on a swipe, and follow the effects volume and background dimming.
  - **Choice chips follow swipes:** a new swipe replaces the chips instead of piling a second set on top, and swiping back brings that version's own chips back.
  - **Collapsible volume widget:** a chevron folds the pill into a 44 px round button that still shows whether the ambience is playing. Tap to open it, drag to move it. It starts folded on touch screens and remembers your choice.
  - **Achievements are kept across sessions:** progress could be overwritten by an early save while the saved copy was still loading, and the panel only drew badges after another event. Both are fixed.
  - **Achievement pop-ups clear the notch** on iPhone home-screen apps.
  - **Lighter scene effects:** the light rays are a small pre-rendered image instead of a blended, masked layer; neon crossfades instead of animating a filter; film grain only moves when turned on; scene particles are drawn at about 30 fps on touch screens; slow light movements are stepped on touch screens; and battery saver only runs a frame loop when something is animating and recovers more calmly.
  - **Home button on mobile:** the atmosphere and lighting step aside the moment Lumiverse starts leaving the chat, and closing a chat no longer re-injects the stylesheet or recolours the whole interface, so the page is no longer forced to reload.
- **1.2.0:** Your own sounds, sound comfort and a new send effect.
  - **Floating volume widget:** an optional draggable pill with an on/off button, a volume slider (drag, click, arrow keys or mouse wheel) and what's playing. It remembers its position and stays on screen when the window is resized. Needs the optional `ui_panels` permission.
  - **When in the background:** keep playing, dim (5–80%, default 30%) or mute the soundscape while Lumiverse isn't the focused window. Focus moving into a frame inside Lumiverse doesn't count as leaving.
  - **Your own sounds:** upload audio files and assign them to any scene or lighting (they loop through the soundscape, so volume, the widget and background dimming apply), to an "always play" track that replaces the scene sounds, or to message and system sounds (message sent, reply received, milestone, achievement unlocked, screen effect / keyword). Each file has a level and a preview. Files are kept in this browser (IndexedDB); short files loop seamlessly and long ones stream. Assignments sync with your settings, and a file missing on another device falls back to the built-in sound.
  - **Splash** send effect: a hose-like gush of clear, see-through water bursts from the send button. The solid column tears into big wobbling clumps that keep breaking into smaller drops, so it thins into a fine spray the farther it flies, then ripples and splashes where it lands. Works in keyword triggers too (`=> splash`).
- **1.1.0:** Three new send effects.
  - **Creamy:** thick white cream erupts from the send button like a whale's blowhole, fans out with a fine mist, then rains back and splats on the composer.
  - **Black Hole ✦** (overkill), about 5 s in four acts. A beam opens a singularity in the chat. Dust spirals in from across the screen around a spinning accretion disk, the hole growing as it feeds, until every mote is swallowed. The hole then implodes into a trembling white dot. Finally it detonates with a flash, a chromatic shockwave and debris. The chat is pulled in, squeezed, then punched outward. No flashing softens the flash, and the chat warp follows the Camera shake setting.
  - **Petal Storm ✦** (overkill): blossoms burst from the button, then a gale sweeps hundreds of fluttering sakura petals across the whole screen.
  - All three also work in keyword triggers (`=> creamy`, `=> blackhole`, `=> petalstorm`).
- **1.0.0:** First public release. It brings together everything below: atmosphere (scenes, lighting, soundscapes), glow and colour (mood, auras, time of day), Flair Packs with Lumiverse theme matching and Character Aware, your own packs, AI storytelling (text effects, Scene Director, screen effects, choice chips), the story heartbeat, Moment Cards, achievements, auto-saved settings with backup, battery saver, reduced-motion and no-flash support, and translations.

### Pre-release history

- **0.4.2:** Story heartbeat dots jump to any message, even ones not loaded yet. Flair drives Lumiverse's own *load older* path behind a short "Rewinding the story…" veil (with progress, cancel by click or Esc), then centres the message and blooms it. On-screen messages just glide into view. Deleted messages are removed from the heartbeat automatically (`MESSAGE_DELETED`).
- **0.4.1:** Imported packs are now added to your pack grid (tagged *Imported*) and kept after restarts, instead of being applied once and forgotten. **Save my look** turns your current setup into a pack (*Yours*). Hover a user pack to remove it. Re-importing or saving with the same name updates that pack in place. Exports use format v2, which includes a tagline, a swatch and the pack's Lumiverse theme colours; v1 files still import. Up to 24 user packs are kept.
- **0.4.0:** Flair Packs can theme Lumiverse (accent, backgrounds, dialogue colours) through Lumiverse's own theme engine. Added the Character Aware pack and theme mode, which follow the speaking character's aura colour, and the *Character aura* glow colour. Mood tint folds into the matched theme. Added an option on the welcome screen. User-owned scale, font, radius and transition settings are never overridden; updates are coalesced per user.
- **0.3.3:** Soundscapes recover by themselves if the browser pauses or loses audio (PC sleep, headphones or Bluetooth switching, energy saving, tab freezing). A watchdog resumes a paused audio engine, rebuilds a closed one or one whose clock stalled, and any click or key press also resumes it. The Sound section shows what's playing, or whether the browser paused it. The idle engine is paused when soundscapes are off.
- **0.3.2:** Each text effect can be switched on or off in **Text & AI effects → Effects in use**. Each chip shows a live preview of its effect. Effects you switch off show as plain text, aren't taught to the AI, and no longer trigger camera shake. The choice is saved per character profile when one is active.
- **0.3.1:** Fixed settings being lost on restart. Lumiverse only accepts setting keys shaped like `module:name`, and Flair used a plain `config` key, so every save was rejected. Added auto-saving to a per-user config file, newest-copy-wins loading, saving when the page closes, a save-status line, and backup and restore.
- **0.3.0:** Flair Packs, Scene Director, cinematic lighting, soundscapes, auras, choice chips, story heartbeat, achievements, Moment Cards, welcome screen, battery saver, tap glow and translations.

## Licence

[MIT](LICENSE) © 2026 Ash ([@yuliontop](https://github.com/yuliontop))
