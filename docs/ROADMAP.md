# Roadmap: v1.3 ideas

Goal: make people look at Lumi Flair and be blown away. Each idea extends what Flair already has: the Scene Director tags, the soundscape engine, your own sounds, Moment Cards and the heartbeat.

Effort: **S** is about a day, **M** a few days, **L** a week or more. 💸 marks features that spend the user's tokens or credits; they must be opt-in and labelled.

## Recommended for v1.3: "Living Sound"

1. **AI sound effects (M). Released in v1.3 (1.3.1).**
   - The AI writes `<flair sfx="door-knock"></flair>` (always paired) and the sound plays as the line streams in.
   - 14 procedural cues: door knock / creak / slam, footsteps, sword clash, glass break, heartbeat, thunder, bell, whoosh, impact, magic, splash, fire crackle.
   - Users can map their own uploads to any cue (`sfx:<name>` slots).
   - Off by default. The prompt note is about 200 tokens.
   - **Next:** user-defined cue names, so you can name a cue ("owl-hoot") and the AI is told it exists. `SOUND_SLOTS` is a static list used for validation today, so slots would have to become dynamic.
   - **Later:** more cues (animals and voices can't be synthesised convincingly, so those are file-only); fix the interface chimes, which still ignore background dim/mute (`Soundscape.focusLevel` is ready for it).
2. **Adaptive music (M).**
   - Users assign tracks to moods (calm, tense, romantic, sad, battle), and Flair crossfades as the mood changes.
   - A built-in generated ambient-pad mode covers users without music files.
   - Mood already flows through `currentMood()` / the Scene Director. Add a music layer next to the soundscape bed that honours its master gain, so the volume, widget and background dimming apply.
3. **"Previously on…" recap (M, 💸).**
   - Reopen a chat after a gap (configurable, for example 6 hours) and get a short cinematic recap card, written by a quiet generation (needs the `generation` permission).
   - Cache it per chat and message id.
4. **Flair Wrapped (M).**
   - A monthly or yearly shareable stats card: words written, favourite characters, mood mix, longest chat, achievements, top scenes.
   - Builds on the Moment Card renderer. Needs a small local stats store, kept in the vault.

## More big ideas

5. **AI scene art (L, 💸).** When the Scene Director moves to a new place, generate a background illustration and crossfade the wallpaper. Cache it per chat. Needs the `image_gen` permission and the user's image connection.
6. **Story map (L).** A visual tree of branches and swipes, with jump to any path. It's the companion to the heartbeat; reuse `navigate.ts`.
7. **Chapter titles (S–M).** The AI marks turning points, and Flair shows a letterboxed title card. Chapters also appear on the heartbeat and in exports.
8. **Theater mode (M). Released in v1.4 (1.4.11):** one click hides the interface (command, Extras menu, panel, or the button under any message), larger type, long replies shown in full, a gentle auto-scroll with a small self-hiding control bar, atmosphere and soundscape kept.
9. **Character entrances (S–M). Released in v1.4 (1.4.11), called "Character intro":** a name card in the aura colour when a chat opens, an optional theme sound from your library (per character with a profile), and in group chats a speaker chip in each speaker's colour with the other messages dimmed. Group chats are only tested with fake events.
10. **Dice and skill checks (M).** `<flair roll="d20+3" dc="15">` animates a roll with success or failure flair.
11. **Storybook export (M–L).** A typeset HTML book with chapters, Moment Cards, scene art and the heartbeat as an epilogue.
12. **Pack gallery (M).** Browse and one-click install community Flair Packs.
13. **"Reply ready" notifications (S).** A push notification when a long generation finishes in the background. Needs `push_notification`; pairs with the background dimming.
14. **Typewriter pacing (S–M). Released in v1.4 (1.4.11):** an optional steady reveal of streaming text through the CSS Custom Highlight API (no host DOM touched), with soft key sounds that follow the mood (built in or the user's own "Typewriter key").
15. **Pin a moment (S–M). Released in v1.4 (1.4.11): star button, selected line, favourite-moments reel, stars on the heartbeat, optional save to Lumiverse memory.**
    - Bookmark lines into a favourite-moments reel, shown as stars on the heartbeat.
    - Optionally saved to Lumiverse memories (needs the `memories` permission). **Built (1.4.1), within what the API allows** (`spindle.memories`, backend only; details in DEVELOPMENT.md):
      - The only way to write is `entities.upsert` (an entity, e.g. a "Favourite moments" concept) plus `entities.addFacts(id, facts)`. There is **no way to remove or edit a fact**, so unpinning cannot take it back out of memory.
      - The host keeps at most 30 facts per entity and drops the lowest-importance ones first; facts added through the API carry no importance, so the Memory Cortex's own extractions can push pins out.
      - Memory is per chat, and facts only reach the AI when the user has the Memory Cortex on.
      - Pins are therefore saved as a short fact on the speaker's own entity, and only the latest few facts of active entities reach the AI. Ash decided against a Flair prompt note (more tokens on top of the sound effects), so this is the whole feature. If that proves too weak, the fallback is Flair's own note through the `interceptor`: "the reader pinned these lines: …", opt-in and capped.

## Parked, worth revisiting now

- **Living portrait:** breathing, parallax and rim light on the Expressions portrait.
- **TTS-reactive glow:** a WebAudio analyser on the TTS `<audio>`, so the aura pulses with the voice.

## Smaller backlog

- Translate the long hints.
- Custom particle images per scene (theme assets).
- Export the heartbeat as an image.
- Check whether choice chips overlap Lumiverse's associative regex actions.
- Ask for `registerDomDecorator` to be added to the published types.
- Optionally sync custom sounds across devices (tus upload to `spindle.uploads`, plus `userStorage.writeBinary`; see DEVELOPMENT.md).
