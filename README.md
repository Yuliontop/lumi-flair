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
| **Camera shake** | A short shake when a reply shouts with `big` or `shake` text |
| **No flashing** | One switch replaces every flash with a soft fade and stops flicker, for light-sensitive viewers |

### Glow & colour

| Feature | What it does |
|---|---|
| **Send effects** | Sparkle, ripple, comet, confetti or **Creamy** (a whale-spout of white cream that erupts and rains back down) from the send button. For an overkill experience: **Black Hole ✦** (a singularity swallows the screen, collapses to a white dot and detonates) and **Petal Storm ✦** (a full-screen gale of blossoms). Your message pops in, and the AI's reply blooms when it finishes |
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
| **Choice chips** | When you face a decision, the AI offers 2–3 next moves as buttons under its reply |

### Fun & sharing

| Feature | What it does |
|---|---|
| **Story heartbeat** | A chart of each chat's emotional arc. Click any point to jump to that message, even far back in the chat |
| **Moment Cards** | Turn any reply into a share-ready image with the avatar, name and quote |
| **Achievements** | 15 badges, such as Night Owl, Showstopper and a 7-day streak |
| **Celebrations** | Confetti at message milestones, plus your own keyword triggers (`happy birthday => confetti`) |
| **Sounds, spotlight & commands** | Soft synthesized chimes, a spotlight reading mode, and 12 `Flair: …` commands in Ctrl/Cmd+K |

### Comfort & compatibility

| Feature | What it does |
|---|---|
| **Battery saver** | Lightens effects automatically if your device struggles, and follows Lumiverse's Efficiency mode |
| **Reduced motion** | Respects your OS setting: glows stay, movement goes |
| **Translations** | Labels in 简体中文, 繁體中文, 日本語, Français and Italiano (longer hints are English for now) |
| **Auto-save & backup** | Settings save themselves to your account and a config file. **Back up settings** and **Restore from file** are in General |

## Your settings are saved automatically

Every change you make is saved within a fraction of a second, to three places at once:

| Where | Why |
|---|---|
| **Your Lumiverse account** (`ctx.settings`) | Follows you to every device and browser you sign in from |
| **A config file on the server**: `data/users/<your id>/extensions/lumi_flair/settings.json` (plus `achievements.json` and `heartbeat.json`) | A readable JSON file you can back up. It lives outside the extension folder, so it survives removing and re-importing Flair |
| **This browser** (localStorage) | Instant, and still works if the server is briefly unreachable |

When Lumiverse starts, Flair reads all three copies and uses the **newest** one, then refreshes any copy that is missing or older. If the server is slow to answer, Flair waits for it before writing to the file, so a slow start can never replace your saved config with the defaults.

**General → Back up settings** downloads everything (settings, character profiles, achievements and heartbeat) as one file. **Restore from file** loads it back. Restore also accepts a `settings.json` config file.

> **Upgrading from v0.3.0 or earlier:** those versions didn't save settings at all (see the changelog), so set your look once more after updating. From now on it sticks.

## Permissions

Lumi Flair requests two permissions. Both are optional, and Lumiverse asks for each one the first time you turn on the feature that needs it:

| Permission | Used for |
|---|---|
| `interceptor` | **Add the instructions to every prompt** (on by default). Flair adds a short styling note just before the latest message on each generation, so the AI keeps using text effects in nearly every reply. The note covers text effects, scene direction, screen effects and choices, following your settings. It appears as **Lumi Flair storytelling** in Prompt Breakdown. It's skipped for impersonate and quiet generations, and when `{{flair_tags}}` is already in the prompt |
| `app_manipulation` | **Lumiverse theme matching** (packs and Character Aware) through `spindle.theme.generateVariables` and `apply`, and **Tint the whole UI with the mood** (`applyPalette`, or folded into the matched theme). Both are layered and fully removable |

## Teaching the AI

The easiest way is to grant `interceptor`, which adds the styling note automatically. Without it, put `{{flair_tags}}` in a preset block, the character card, or the author's note. Both use the same text, which follows the **How often the AI uses them** setting.

If you'd rather type short tags like `<shake>…</shake>`, add a display regex script that turns `<(shake|glow|whisper|rainbow|typewriter|fade|pulse|big)>(.*?)</\1>` into `<span data-lf="$1">$2</span>`.

## Scene direction and choices

With **Scene Director** on, the AI is asked to set the scene when the setting or mood changes:

```html
<flair scene="snow" light="night" mood="melancholy"></flair>
<flair effect="confetti"></flair>
<flair-choice>Follow the footprints</flair-choice>
```

- **`scene`** accepts snow, rain, embers, fireflies, petals, stars or off. Aliases such as `storm`, `fire`, `sakura`, `space` and `clear` also work.
- **`light`** accepts dawn, day, dusk, night, candle, storm, neon or none.
- **`mood`** accepts any word in your mood map.

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
| Lighting | A second layer next to the ambient canvas, with blend modes per light preset. Lightning and camera shake are short CSS animations |
| Soundscapes | WebAudio graphs of filtered noise, LFOs and short grains. They start after your first click or key press, because browsers block audio until then |
| Auras | Reads the colour from avatar images that are already loaded, then writes `:has(img[src=…])` rules so the colour follows the avatar through virtualization |
| Moment Card button | Uses `ctx.ui.registerDomDecorator` on the `message_actions` mount. This works in current Lumiverse but isn't in the published types yet. If a display mode has no action pill, use the Share section or the command instead |
| Backend | Pushes the `{{flair_tags}}` macro, registers the commands, declares the tag-interceptor capability, and applies the optional mood palette |

## Compatibility notes

- Hover effects only run on devices with a mouse or trackpad (`@media (hover: hover)`). On touch devices, **Tap glow** takes their place.
- When your OS asks for reduced motion and **Respect reduce motion** is on, particles, scenes, text animation and entrance animations are skipped. Colours and glows stay.
- Command palette commands carry no user id. On an operator-scoped install (Import Local by an owner or admin), a command is broadcast, and every connected user's Flair settings apply it. On a single-user instance this makes no difference.
- Settings, achievements and heartbeat points are stored per user in your account settings and your own config files. Nothing leaves your server.

## Changelog

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
