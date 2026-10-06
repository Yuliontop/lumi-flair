import type { SoundMeta } from './soundlib'
import type { SpindleFrontendContext } from 'lumiverse-spindle-types'
import type { VaultStatus } from './persist'
import { LIGHTS, SCENES, TEXT_FX, type ChatScene, type FlairSettings, type SettingsStore, type TextFx } from './settings'
import { tr } from './i18n'
import { SFX_CUES } from './sfx-cues'
import { allPacks, packById } from './packs'
import { ACHIEVEMENTS } from './achievements'
import { renderHeartbeat, type BeatPoint } from './heartbeat'
import { STAR_SVG, type Pin } from './moments'
import { keepOpenWhileDragging } from './modal'

const ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9z"/><path d="M19 15l.8 1.9 1.9.8-1.9.8L19 20.4l-.8-1.9-1.9-.8 1.9-.8z"/><path d="M5 16l.6 1.4 1.4.6-1.4.6L5 20l-.6-1.4L3 18l1.4-.6z"/></svg>`

/*
 * Typography, buttons and spacing mirror Lumiverse's own shared form styles
 * (components/shared/FormComponents.module.css, RangeSlider.module.css) so
 * the tab looks native and follows the user's Font Scale setting.
 */
const FS = (px: number) => `calc(${px}px * var(--lumiverse-font-scale, 1))`

export const PANEL_CSS = `
.lf-panel { display: flex; flex-direction: column; gap: 10px; padding: 12px; color: var(--lumiverse-text); font-size: ${FS(13)}; }

/* Collapsible sections (native <details>, styled like Lumiverse editor sections) */
.lf-sec { border-radius: var(--lumiverse-radius-lg, 12px); background: var(--lumiverse-fill-subtle); border: 1px solid var(--lumiverse-border); }
.lf-sec > summary { list-style: none; display: flex; align-items: center; gap: 10px; padding: 12px 14px; cursor: pointer; user-select: none;
  font-size: ${FS(13)}; font-weight: 600; color: var(--lumiverse-text); }
.lf-sec > summary::-webkit-details-marker { display: none; }
.lf-sec > summary .lf-sec-ico { display: flex; align-items: center; justify-content: center; width: var(--lumiverse-btn-icon-sm, 28px);
  height: var(--lumiverse-btn-icon-sm, 28px); border-radius: 6px; background: var(--lumiverse-primary-010); color: var(--lumiverse-primary); flex-shrink: 0; }
.lf-sec > summary .lf-sec-ico svg { width: 15px; height: 15px; }
.lf-sec > summary .lf-sec-title { flex: 1; }
.lf-sec > summary .lf-badge { font-size: ${FS(11)}; font-weight: 500; color: var(--lumiverse-text-dim); }
.lf-sec > summary .lf-chev { display: flex; color: var(--lumiverse-text-dim); transition: transform var(--lumiverse-transition-fast, 150ms ease); }
.lf-sec > summary .lf-chev svg { width: 14px; height: 14px; }
.lf-sec[open] > summary .lf-chev { transform: rotate(90deg); }
.lf-sec[open] > summary { border-bottom: 1px solid var(--lumiverse-border); }
.lf-body { display: flex; flex-direction: column; gap: 12px; padding: 12px 14px 14px; }

/* Label + control rows */
.lf-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 36px; }
.lf-row > .lf-label { flex: 1 1 auto; min-width: 0; font-size: ${FS(13)}; font-weight: 500; color: var(--lumiverse-text-muted); }
.lf-row > .lf-ctl { flex: 0 0 55%; min-width: 0; }
/* Only stretch controls that are meant to fill (selects). Switches and
   colour pickers keep their intrinsic size — stretching the host switch
   collapses its track and leaves just the white knob visible. */
.lf-row > .lf-ctl.lf-fill > * { width: 100%; }
.lf-row > .lf-ctl.lf-fit { flex: 0 0 auto; display: flex; align-items: center; justify-content: flex-end; }
.lf-row.lf-toggle { cursor: pointer; }
.lf-row.lf-toggle:hover > .lf-label { color: var(--lumiverse-text); }
.lf-stack { display: flex; flex-direction: column; gap: 6px; }
.lf-stack > .lf-label { font-size: ${FS(13)}; font-weight: 500; color: var(--lumiverse-text-muted); }

.lf-hint { margin: -6px 0 0; color: var(--lumiverse-text-dim); font-size: ${FS(11)}; line-height: 1.45; }
.lf-hint code { font-family: var(--lumiverse-font-mono, monospace); font-size: .95em; padding: 1px 5px; border-radius: 4px;
  background: var(--lumiverse-fill); color: var(--lumiverse-text-muted); }
.lf-status { display: flex; align-items: center; gap: 8px; padding: 8px 10px; border-radius: var(--lumiverse-radius, 8px);
  background: var(--lumiverse-fill); color: var(--lumiverse-text-muted); font-size: ${FS(12)}; }
.lf-status b { color: var(--lumiverse-text); font-weight: 600; }
.lf-color { appearance: none; -webkit-appearance: none; display: block; width: 44px; height: 28px; padding: 0; margin: 0;
  border: 1px solid var(--lumiverse-border); border-radius: var(--lumiverse-radius, 8px); background: none; cursor: pointer; }
.lf-color::-webkit-color-swatch-wrapper { padding: 3px; }
.lf-color::-webkit-color-swatch { border: none; border-radius: 5px; }
.lf-color::-moz-color-swatch { border: none; border-radius: 5px; }

/* Buttons — same recipe as Lumiverse's shared Button (secondary / primary). */
.lf-btns { display: flex; gap: 8px; flex-wrap: wrap; }
.lf-theme-status { gap: 6px; }
.lf-pack-wrap { position: relative; display: flex; }
.lf-pack-wrap > .lf-pack { flex: 1; min-width: 0; }
.lf-pack-tag { position: absolute; top: 14px; left: 14px; padding: 1px 6px; border-radius: 6px; font-style: normal; pointer-events: none;
  font-size: calc(9.5px * var(--lumiverse-font-scale, 1)); letter-spacing: .06em; text-transform: uppercase; color: #fff; background: rgba(0,0,0,.45); }
.lf-pack-del { position: absolute; top: 12px; right: 12px; width: 22px; height: 22px; border-radius: 50%; border: 0; cursor: pointer; font: inherit; line-height: 1;
  font-size: 15px; color: #fff; background: rgba(0,0,0,.5); opacity: 0; transition: opacity .15s ease, background .15s ease; }
.lf-pack-wrap:hover .lf-pack-del, .lf-pack-del:focus-visible { opacity: 1; }
.lf-pack-del:hover { background: var(--lumiverse-danger, #e5484d); }
@media (hover: none) { .lf-pack-del { opacity: .85; } }
.lf-save-form { display: flex; flex-direction: column; gap: 10px; color: var(--lumiverse-text); }
.lf-save-form label { display: flex; flex-direction: column; gap: 6px; font-size: calc(12px * var(--lumiverse-font-scale, 1)); color: var(--lumiverse-text-muted); }
.lf-input { font: inherit; font-size: calc(14px * var(--lumiverse-font-scale, 1)); padding: 8px 10px; border-radius: var(--lumiverse-radius, 8px);
  color: var(--lumiverse-text); background: var(--lumiverse-fill); border: 1px solid var(--lumiverse-border); outline: none; }
.lf-input:focus { border-color: var(--lf-c, var(--lumiverse-primary)); }
.lf-theme-dot { width: 10px; height: 10px; border-radius: 50%; flex: 0 0 auto; background: var(--lumiverse-primary); box-shadow: 0 0 8px currentColor; }
.lf-save { flex-direction: column; align-items: flex-start; gap: 2px; }
.lf-save b { font-weight: 600; }
.lf-save span { font-size: calc(11px * var(--lumiverse-font-scale, 1)); color: var(--lumiverse-text-dim); }
.lf-save[data-state="error"] b { color: var(--lumiverse-danger, #e5484d); }
.lf-btn { flex: 1 1 auto; display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  padding: 8px 14px; border-radius: var(--lumiverse-radius, 8px); border: 1px solid var(--lumiverse-border);
  background: transparent; color: var(--lumiverse-text-muted); font-family: inherit; font-size: ${FS(13)}; font-weight: 500;
  cursor: pointer; white-space: nowrap;
  transition: background var(--lumiverse-transition-fast, 150ms ease), color var(--lumiverse-transition-fast, 150ms ease),
    border-color var(--lumiverse-transition-fast, 150ms ease), transform 80ms ease; }
.lf-btn:hover { background: var(--lumiverse-fill-subtle); color: var(--lumiverse-text); }
.lf-btn:active { transform: scale(.98); }
.lf-btn:focus-visible { outline: 1.5px solid var(--lumiverse-primary-050); outline-offset: 2px; }
.lf-btn:disabled { opacity: .4; cursor: not-allowed; }
.lf-btn svg { width: 14px; height: 14px; flex-shrink: 0; }
.lf-btn.lf-primary { background: var(--lumiverse-primary); border-color: var(--lumiverse-primary); color: var(--lumiverse-primary-contrast, #fff); }
.lf-btn.lf-primary:hover { background: var(--lumiverse-primary-hover); color: var(--lumiverse-primary-contrast, #fff); }
.lf-btn.lf-ghost { border-color: transparent; color: var(--lumiverse-text-dim); }
.lf-btn.lf-ghost:hover { color: var(--lumiverse-text); }

.lf-swatch { display: inline-block; width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0;
  background: var(--lf-c, var(--lumiverse-primary)); box-shadow: 0 0 10px var(--lf-c, var(--lumiverse-primary)); }
.lf-aura-row { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
.lf-aura-dot { display: inline-block; width: 14px; height: 14px; border-radius: 50%; }
.lf-beat-host { padding: 6px 2px 0; }
.lf-tw-demo { padding: 10px 12px; border-radius: var(--lumiverse-radius, 8px); background: var(--lumiverse-fill); color: var(--lumiverse-text); font-size: calc(14px * var(--lumiverse-font-scale, 1)); line-height: 1.6; }
.lf-fx-head { display: flex; align-items: baseline; justify-content: space-between; margin-top: 4px; }
.lf-fx-count { font-size: calc(11px * var(--lumiverse-font-scale, 1)); color: var(--lumiverse-text-dim); font-variant-numeric: tabular-nums; }
.lf-fx-pick { display: grid; grid-template-columns: repeat(auto-fill, minmax(104px, 1fr)); gap: 6px; }
.lf-fx-chip { display: flex; align-items: center; justify-content: space-between; gap: 6px; min-height: 38px; padding: 6px 10px; cursor: pointer; font: inherit;
  color: var(--lumiverse-text); background: var(--lumiverse-fill); border: 1px solid color-mix(in srgb, var(--lf-c, var(--lumiverse-primary)) 45%, var(--lumiverse-border));
  border-radius: var(--lumiverse-radius, 8px); transition: opacity .2s ease, border-color .2s ease, background .2s ease; overflow: hidden; }
.lf-fx-chip:hover { border-color: var(--lf-c, var(--lumiverse-primary)); }
.lf-fx-chip:focus-visible { outline: 2px solid var(--lf-c, var(--lumiverse-primary)); outline-offset: 1px; }
.lf-fx-chip > span { font-size: calc(13px * var(--lumiverse-font-scale, 1)); white-space: nowrap; }
.lf-fx-chip small { font-size: calc(10px * var(--lumiverse-font-scale, 1)); letter-spacing: .06em; text-transform: uppercase; color: var(--lf-c, var(--lumiverse-primary)); }
.lf-fx-chip.lf-off { opacity: .5; border-style: dashed; border-color: var(--lumiverse-border); background: transparent; }
.lf-fx-chip.lf-off small { color: var(--lumiverse-text-dim); }
.lf-fx-chip.lf-off > span { animation-play-state: paused !important; text-decoration: line-through; text-decoration-color: var(--lumiverse-text-dim); }
.lf-fx-pick.lf-master-off { opacity: .55; }
/* Your sounds */
.lf-snd-list { display: flex; flex-direction: column; gap: 8px; }
.lf-snd { display: flex; flex-direction: column; gap: 6px; padding: 8px 10px 4px; border-radius: var(--lumiverse-radius, 8px);
  background: var(--lumiverse-fill); border: 1px solid var(--lumiverse-border); }
.lf-snd-head { display: flex; align-items: center; gap: 10px; min-width: 0; }
.lf-snd-play, .lf-snd-del { flex: none; width: 30px; height: 30px; border-radius: 50%; border: 1px solid var(--lumiverse-border); padding: 0;
  display: flex; align-items: center; justify-content: center; cursor: pointer; background: transparent; color: var(--lumiverse-text-muted);
  transition: background var(--lumiverse-transition-fast, 150ms ease), color var(--lumiverse-transition-fast, 150ms ease); }
.lf-snd-play svg { width: 12px; height: 12px; }
.lf-snd-del svg { width: 14px; height: 14px; }
.lf-snd-play:hover { background: var(--lumiverse-primary); border-color: var(--lumiverse-primary); color: var(--lumiverse-primary-contrast, #fff); }
.lf-snd-play[data-on="1"] { background: var(--lumiverse-primary); border-color: var(--lumiverse-primary); color: var(--lumiverse-primary-contrast, #fff); }
.lf-snd-del { border-color: transparent; color: var(--lumiverse-text-dim); }
.lf-snd-del:hover { color: var(--lumiverse-danger, #e5484d); background: var(--lumiverse-fill-subtle); }
.lf-snd-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px; }
.lf-snd-info b { font-size: ${FS(13)}; font-weight: 600; color: var(--lumiverse-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.lf-snd-info span { font-size: ${FS(11)}; color: var(--lumiverse-text-dim); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.lf-snd-empty { padding: 10px; text-align: center; border-radius: var(--lumiverse-radius, 8px); border: 1px dashed var(--lumiverse-border);
  color: var(--lumiverse-text-dim); font-size: ${FS(12)}; }
.lf-snd-sub { margin-top: 4px; font-size: ${FS(12)}; font-weight: 600; color: var(--lumiverse-text-muted); letter-spacing: .02em; }
.lf-snd-assigned { display: flex; flex-direction: column; gap: 4px; }
.lf-snd-pair { display: flex; align-items: center; gap: 8px; padding: 4px 4px 4px 10px; border-radius: var(--lumiverse-radius, 8px);
  background: var(--lumiverse-fill); font-size: ${FS(12)}; color: var(--lumiverse-text-muted); min-width: 0; }
.lf-snd-pair > span { flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.lf-snd-pair b { color: var(--lumiverse-text); font-weight: 600; }
.lf-snd-pair[data-missing="1"] b { color: var(--lumiverse-text-dim); font-weight: 500; font-style: italic; }
.lf-snd-pair .lf-snd-del { width: 26px; height: 26px; }
.lf-snd-msg[data-kind="error"] { color: var(--lumiverse-danger, #e5484d); }
.lf-fx-demo { display: flex; flex-wrap: wrap; gap: 6px 14px; padding: 10px 12px; border-radius: var(--lumiverse-radius, 8px); background: var(--lumiverse-fill); }
`

const svg = (body: string, fill = false) =>
  `<svg viewBox="0 0 24 24" ${fill ? 'fill="currentColor"' : 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"'}>${body}</svg>`

const I = {
  play: svg('<path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.4-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z"/>', true),
  spark: svg('<path d="M12 3l1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9z"/>'),
  reset: svg('<path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/>'),
  sliders: svg('<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>'),
  user: svg('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'),
  send: svg('<path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4z"/>'),
  glow: svg('<rect x="4" y="5" width="16" height="14" rx="3"/><path d="M2 9V7M22 9V7M2 17v-2M22 17v-2"/>'),
  palette: svg('<path d="M12 22a10 10 0 1 1 10-10c0 2.5-2 3-3.5 3H16a2 2 0 0 0-1.5 3.3A2 2 0 0 1 13 22z"/><circle cx="7.5" cy="10.5" r="1"/><circle cx="12" cy="7" r="1"/><circle cx="16.5" cy="10.5" r="1"/>'),
  cloud: svg('<path d="M17.5 19a4.5 4.5 0 1 0-1.4-8.8A6 6 0 1 0 6 17h11.5z"/>'),
  text: svg('<path d="M4 7V5h16v2M9 19h6M12 5v14"/>'),
  party: svg('<path d="M3 21l5-14 9 9z"/><path d="M14 3l1 2M19 6l2-1M17 10l3 1M11 5l.5-2"/>'),
  sound: svg('<path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/>'),
  music: svg('<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>'),
  upload: svg('<path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/><path d="M7 9l5-5 5 5M12 4v12"/>'),
  stop: svg('<rect x="6" y="6" width="12" height="12" rx="2"/>', true),
  trash: svg('<path d="M4 7h16M10 11v6M14 11v6M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/>'),
  share: svg('<path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7"/><path d="M16 6l-4-4-4 4M12 2v13"/>'),
  copy: svg('<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>'),
  chev: svg('<path d="m9 6 6 6-6 6"/>'),
  film: svg('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 4v16M17 4v16M3 9h4M3 15h4M17 9h4M17 15h4"/>'),
  heart: svg('<path d="M3 12h4l2-5 4 10 2-5h6"/>'),
  trophy: svg('<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/>'),
  camera: svg('<path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="3.5"/>'),
  star: svg('<polygon points="12,2.8 14.9,8.9 21.5,9.7 16.6,14.3 17.9,20.9 12,17.6 6.1,20.9 7.4,14.3 2.5,9.7 9.1,8.9"/>'),
}

/** Live status the panel displays but does not own. */
export interface PanelStatus {
  chatId: string | null
  characterId: string | null
  characterName: string | null
  moodLabel: string | null
  timeLabel: string | null
  autoScene: string | null
  activeScene: string
  tintPermission: boolean
  injectPermission: boolean
  panelsPermission: boolean
  memoriesPermission: boolean
  /** What the last save of pins to Lumiverse's memory did (null: nothing to say). */
  memoryNote: string | null
  directed: string | null
  light: string
  saver: boolean
  auraColors: string[]
  beats: BeatPoint[]
  /** Pinned moments in the current chat. */
  pins: Pin[]
  unlocked: Record<string, number>
  soundscape: 'off' | 'playing' | 'waiting'
  soundscapeKey: string
  /** names of the user's files in the current soundscape */
  soundscapeCustom: string[]
  /** the user's "always play" file is replacing the scene sounds */
  soundscapeAlways: boolean
  uiThemeLabel: string | null
  charAura: string | null
}

export interface PanelActions {
  previewSend(): void
  previewHover(): void
  testSound(): void
  /** Play one AI sound cue (the user's file for it, if they assigned one). */
  previewSfx(cue: string): void
  exportTheme(): Promise<'pack' | 'css'>
  requestTintPermission(): Promise<boolean>
  requestInjectPermission(): Promise<boolean>
  requestPanelsPermission(): Promise<boolean>
  sounds: SoundActions
  previewLightning(): void
  applyPack(id: string): void
  exportPack(): void
  importPack(): Promise<string | null>
  savePack(name: string): void
  deletePack(id: string): void
  momentLatest(): Promise<void> | void
  /** Play the name card now, and show the group-chat speaker chip for a moment (so both can be seen without a group chat). */
  previewIntro(): void
  previewSpeaker(): void
  /** Close the drawer's interface and read in theater mode. */
  enterTheater(): void
  /** Type out the text of this element (the panel's sample) at the chosen pace, with the key sounds. */
  previewTypewriter(el: HTMLElement): void
  typewriterSupported(): boolean
  /** Pin the latest message as a favourite moment (or take it off again). */
  pinLatest(): void
  unpin(id: string): void
  jumpToPin(p: Pin): Promise<'ok' | 'missing' | 'notfound' | 'cancelled' | 'unavailable'>
  /** Add this chat's pins to Lumiverse's memory now (asks for the permission first if needed). */
  savePinsToMemory(): Promise<void>
  requestMemoriesPermission(): Promise<boolean>
  jumpTo(p: BeatPoint): Promise<'ok' | 'missing' | 'notfound' | 'cancelled' | 'unavailable'>
  openWelcome(): void
  backupSettings(): void
  restoreSettings(): Promise<boolean>
  vaultStatus(): VaultStatus
  onVaultStatus(fn: (s: VaultStatus) => void): () => void
  status(): PanelStatus
  onStatus(fn: (s: PanelStatus) => void): () => void
}

/** The user's sound library, as the panel sees it. */
export interface SoundActions {
  list(): SoundMeta[]
  has(id: string): boolean
  /** false when the browser can't keep files (they last until the page closes) */
  saved(): boolean
  upload(): Promise<{ added: string[]; errors: string[] }>
  remove(id: string): Promise<void>
  setLevel(id: string, level: number): void
  /** Play a file once (toggles); `onEnd` fires when it stops for any reason. */
  preview(id: string, onEnd: () => void): void
  stopPreview(): void
  onChange(fn: () => void): () => void
}

/** What each sound slot is called in the panel. */
export const SLOT_LABEL: Record<string, { label: string; group: string }> = {
  always: { label: 'Always play (replaces scene sounds)', group: 'Ambience' },
  'scene:snow': { label: 'Snow', group: 'Ambience' },
  'scene:rain': { label: 'Rain', group: 'Ambience' },
  'scene:embers': { label: 'Embers', group: 'Ambience' },
  'scene:fireflies': { label: 'Fireflies', group: 'Ambience' },
  'scene:petals': { label: 'Petals', group: 'Ambience' },
  'scene:stars': { label: 'Starfield', group: 'Ambience' },
  'light:dawn': { label: 'Dawn', group: 'Lighting' },
  'light:day': { label: 'Daylight', group: 'Lighting' },
  'light:dusk': { label: 'Dusk / golden hour', group: 'Lighting' },
  'light:night': { label: 'Night', group: 'Lighting' },
  'light:candle': { label: 'Candlelight', group: 'Lighting' },
  'light:storm': { label: 'Storm', group: 'Lighting' },
  'light:neon': { label: 'Neon city', group: 'Lighting' },
  'ui:send': { label: 'Message sent', group: 'Interface' },
  'ui:receive': { label: 'Reply received', group: 'Interface' },
  'ui:fanfare': { label: 'Milestone celebration', group: 'Interface' },
  'ui:achievement': { label: 'Achievement unlocked', group: 'Interface' },
  'ui:sparkle': { label: 'Screen effect / keyword', group: 'Interface' },
  'ui:key': { label: 'Typewriter key', group: 'Interface' },
  ...Object.fromEntries(SFX_CUES.map((c) => [`sfx:${c.name}`, { label: c.label, group: 'Sound effects' }])),
}

const fmtDuration = (sec: number) => {
  const s = Math.max(0, Math.round(sec))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}
const fmtSize = (b: number) => (b >= 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`)

export const SCENE_LABEL: Record<string, string> = {
  off: 'Off',
  snow: 'Snow',
  rain: 'Rain',
  embers: 'Embers',
  fireflies: 'Fireflies',
  petals: 'Petals',
  stars: 'Starfield',
}

export const LIGHT_LABEL: Record<string, string> = {
  none: 'None', dawn: 'Dawn', day: 'Daylight', dusk: 'Dusk / golden hour', night: 'Night', candle: 'Candlelight', storm: 'Storm', neon: 'Neon city',
}

const OPEN_KEY = 'lumi_flair:open-sections'

function readOpen(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(OPEN_KEY) || '{}') as Record<string, boolean>
  } catch {
    return {}
  }
}

function writeOpen(map: Record<string, boolean>) {
  try {
    localStorage.setItem(OPEN_KEY, JSON.stringify(map))
  } catch {
    /* ignore */
  }
}

/**
 * The "Flair" drawer tab. Controls are Lumiverse's own shared components
 * (ctx.components.*) so they inherit the user's theme automatically.
 */
export function mountPanel(ctx: SpindleFrontendContext, store: SettingsStore, actions: PanelActions) {
  const tab = ctx.ui.registerDrawerTab({
    id: 'flair',
    title: 'Lumi Flair',
    shortName: 'Flair',
    headerTitle: 'Flair',
    description: 'Send effects, mood glow, ambient scenes, text effects and more',
    keywords: ['animation', 'glow', 'effects', 'theme', 'hover', 'particles', 'mood', 'ambient', 'weather', 'sound'],
    iconSvg: ICON,
  })

  const handles: Array<{ destroy(): void }> = []
  const syncers: Array<(s: FlairSettings) => void> = []
  const statusSyncers: Array<(st: PanelStatus) => void> = []
  const s0 = store.get()
  const openMap = readOpen()

  const panel = document.createElement('div')
  panel.className = 'lf-panel'

  // ── building blocks ──

  function section(id: string, title: string, icon: string, defaultOpen = false) {
    const d = document.createElement('details')
    d.className = 'lf-sec'
    d.open = openMap[id] ?? defaultOpen
    const sum = document.createElement('summary')
    sum.innerHTML = `<span class="lf-sec-ico">${icon}</span><span class="lf-sec-title"></span><span class="lf-badge"></span><span class="lf-chev">${I.chev}</span>`
    ;(sum.querySelector('.lf-sec-title') as HTMLElement).textContent = tr(title)
    const body = document.createElement('div')
    body.className = 'lf-body'
    d.append(sum, body)
    d.addEventListener('toggle', () => {
      openMap[id] = d.open
      writeOpen(openMap)
    })
    panel.appendChild(d)
    return { body, badge: sum.querySelector('.lf-badge') as HTMLElement }
  }

  type Fit = 'fill' | 'fit'
  function row(parent: HTMLElement, label: string, fit: Fit = 'fill') {
    const r = document.createElement('div')
    r.className = 'lf-row'
    const l = document.createElement('span')
    l.className = 'lf-label'
    l.textContent = tr(label)
    const c = document.createElement('div')
    c.className = `lf-ctl lf-${fit}`
    r.append(l, c)
    parent.appendChild(r)
    return c
  }

  /** Hints are static, trusted strings authored in this file. */
  function hint(parent: HTMLElement, html: string) {
    const p = document.createElement('p')
    p.className = 'lf-hint'
    p.innerHTML = tr(html)
    parent.appendChild(p)
    return p
  }

  function status(parent: HTMLElement, render: (st: PanelStatus, el: HTMLElement) => void) {
    const el = document.createElement('div')
    el.className = 'lf-status'
    parent.appendChild(el)
    const fn = (st: PanelStatus) => render(st, el)
    statusSyncers.push(fn)
    fn(actions.status())
    return el
  }

  function select<K extends keyof FlairSettings>(
    parent: HTMLElement,
    label: string,
    key: K,
    options: Array<{ value: string; label: string; sublabel?: string }>,
  ) {
    const slot = row(parent, label, 'fill')
    const h = ctx.components.mountSelect(slot, {
      value: String(s0[key]),
      options: options.map((o) => ({ ...o, label: tr(o.label), sublabel: o.sublabel ? tr(o.sublabel) : undefined })),
      ariaLabel: tr(label),
      onChange: (v) => store.update({ [key]: v } as Partial<FlairSettings>),
    })
    handles.push(h)
    syncers.push((s) => {
      if (h.getValue() !== String(s[key])) h.update({ value: String(s[key]) })
    })
  }

  function toggle<K extends keyof FlairSettings>(
    parent: HTMLElement,
    label: string,
    key: K,
    before?: (next: boolean) => Promise<boolean> | boolean,
  ) {
    const slot = row(parent, label, 'fit')
    const rowEl = slot.parentElement as HTMLElement
    rowEl.classList.add('lf-toggle')
    const set = async (next: boolean) => {
      if (before && !(await before(next))) {
        h.update({ checked: Boolean(store.get()[key]) })
        return
      }
      store.update({ [key]: next } as Partial<FlairSettings>)
    }
    const h = ctx.components.mountSwitch(slot, {
      checked: Boolean(s0[key]),
      size: 'md',
      ariaLabel: tr(label),
      onChange: (on) => void set(on),
    })
    // Clicking anywhere on the row (not just the 36px switch) flips it, like native settings rows.
    rowEl.addEventListener('click', (e) => {
      if (slot.contains(e.target as Node)) return
      void set(!store.get()[key])
    })
    handles.push(h)
    syncers.push((s) => {
      if (h.getValue() !== Boolean(s[key])) h.update({ checked: Boolean(s[key]) })
    })
  }

  function slider<K extends keyof FlairSettings>(
    parent: HTMLElement,
    label: string,
    key: K,
    min: number,
    max: number,
    step: number,
    format: { suffix?: string; decimals?: number; scale?: number },
  ) {
    const slot = document.createElement('div')
    parent.appendChild(slot)
    const scale = format.scale ?? 1
    const h = ctx.components.mountRangeSlider(slot, {
      label: tr(label),
      min: min * scale,
      max: max * scale,
      step: step * scale,
      value: Number(s0[key]) * scale,
      format: { suffix: format.suffix, decimals: format.decimals ?? (step < 1 ? 2 : 1) },
      onCommit: (v) => store.update({ [key]: v / scale } as Partial<FlairSettings>),
    })
    handles.push(h)
    syncers.push((s) => {
      const want = Number(s[key]) * scale
      if (Math.abs(h.getValue() - want) > 1e-6) h.update({ value: want })
    })
  }

  function textarea<K extends keyof FlairSettings>(parent: HTMLElement, label: string, key: K, rows: number, placeholder: string) {
    const wrap = document.createElement('div')
    wrap.className = 'lf-stack'
    const l = document.createElement('span')
    l.className = 'lf-label'
    l.textContent = tr(label)
    const slot = document.createElement('div')
    wrap.append(l, slot)
    parent.appendChild(wrap)
    let timer: ReturnType<typeof setTimeout> | undefined
    let typing = false
    const h = ctx.components.mountTextArea(slot, {
      value: String(s0[key]),
      rows,
      placeholder,
      ariaLabel: label,
      onChange: (v) => {
        typing = true
        if (timer) clearTimeout(timer)
        timer = setTimeout(() => {
          typing = false
          store.update({ [key]: v } as Partial<FlairSettings>)
        }, 400)
      },
    })
    handles.push(h)
    syncers.push((s) => {
      if (!typing && h.getValue() !== String(s[key])) h.update({ value: String(s[key]) })
    })
  }

  function color<K extends keyof FlairSettings>(parent: HTMLElement, label: string, key: K) {
    const slot = row(parent, label, 'fit')
    const input = document.createElement('input')
    input.type = 'color'
    input.className = 'lf-color'
    input.value = String(s0[key])
    input.setAttribute('aria-label', label)
    input.addEventListener('input', () => store.update({ [key]: input.value } as Partial<FlairSettings>))
    slot.appendChild(input)
    syncers.push((s) => {
      if (input.value !== s[key]) input.value = String(s[key])
    })
    return slot.parentElement as HTMLElement
  }

  function buttons(parent: HTMLElement) {
    const wrap = document.createElement('div')
    wrap.className = 'lf-btns'
    parent.appendChild(wrap)
    return wrap
  }

  function button(
    parent: HTMLElement,
    text: string,
    onClick: () => void | Promise<void>,
    variant: 'primary' | 'secondary' | 'ghost' = 'secondary',
    iconSvg?: string,
  ) {
    const b = document.createElement('button')
    b.type = 'button'
    b.className = variant === 'secondary' ? 'lf-btn' : `lf-btn lf-${variant}`
    if (iconSvg) b.innerHTML = iconSvg
    const label = document.createElement('span')
    label.textContent = tr(text)
    b.append(label)
    b.addEventListener('click', async (e) => {
      e.preventDefault()
      e.stopPropagation()
      try {
        await onClick()
      } catch (err) {
        console.error('[Lumi Flair] button action failed', err)
      }
    })
    parent.appendChild(b)
    return { el: b, setText: (t: string) => (label.textContent = tr(t)) }
  }

  const sceneOptions = SCENES.map((s) => ({ value: s, label: SCENE_LABEL[s] }))

  // ── General ──
  const general = section('general', 'General', I.sliders, true)
  toggle(general.body, 'Enable Lumi Flair', 'enabled')
  toggle(general.body, 'Respect “reduce motion”', 'respectReducedMotion')
  hint(general.body, 'When your OS asks for reduced motion, glows stay but particles, scenes and movement are skipped.')
  toggle(general.body, 'Spotlight mode', 'spotlight')
  hint(general.body, 'While you hover the chat, every message except the one under your cursor dims. Also in the input bar’s Extras menu.')
  toggle(general.body, 'No flashing', 'noFlash')
  hint(general.body, 'Replaces lightning flashes with a slow glow, stops flickering text and disables camera shake. Recommended for light-sensitive viewers.')
  toggle(general.body, 'Battery saver when needed', 'perfGovernor')
  const saverHint = hint(general.body, '')
  statusSyncers.push((st) => {
    saverHint.innerHTML = st.saver
      ? tr('<b>Battery saver is on</b> — the frame rate dipped, so particles are halved and grain and light rays are paused.')
      : tr('Watches the frame rate and lightens particles, grain and light rays if your device struggles.')
  })
  toggle(general.body, 'Tap to glow (touch screens)', 'tapGlow')

  // Auto-save status + backup
  const saveEl = document.createElement('div')
  saveEl.className = 'lf-status lf-save'
  general.body.appendChild(saveEl)
  const ago = (t: number) => {
    if (!t) return tr('not saved yet')
    const s = Math.round((Date.now() - t) / 1000)
    if (s < 10) return tr('just now')
    if (s < 60) return `${s}s ${tr('ago')}`
    if (s < 3600) return `${Math.round(s / 60)}m ${tr('ago')}`
    return new Date(t).toLocaleString()
  }
  const mark = (st: string) => (st === 'ok' ? '✓' : st === 'unknown' ? '…' : '✕')
  const renderSave = (v: VaultStatus) => {
    const ok = Object.values(v.layers).some((x) => x === 'ok')
    saveEl.dataset.state = v.saving ? 'saving' : ok ? 'ok' : 'error'
    saveEl.innerHTML = ''
    const head = document.createElement('b')
    head.textContent = v.saving ? tr('Saving…') : ok ? `✓ ${tr('Auto-saved')} · ${ago(v.lastSavedAt)}` : tr('Not saved — check the console')
    const detail = document.createElement('span')
    detail.textContent = `${tr('Account')} ${mark(v.layers.account)} · ${tr('Config file')} ${mark(v.layers.file)} · ${tr('This browser')} ${mark(v.layers.browser)}`
    saveEl.append(head, detail)
  }
  renderSave(actions.vaultStatus())
  const unsubVault = actions.onVaultStatus(renderSave)
  const agoTimer = setInterval(() => renderSave(actions.vaultStatus()), 15000)
  hint(general.body, 'Every change saves itself to your Lumiverse account and to a config file on the server (<code>data/users/&lt;you&gt;/extensions/lumi_flair/settings.json</code>), which survives reinstalling Flair. The newest copy is used when Lumiverse starts.')
  const backupBtns = buttons(general.body)
  button(backupBtns, 'Back up settings', () => actions.backupSettings(), 'secondary', I.share)
  const restoreBtn = button(backupBtns, 'Restore from file', async () => {
    const ok = await actions.restoreSettings()
    restoreBtn.setText(ok ? 'Restored ✓' : 'Not a Flair backup')
    setTimeout(() => restoreBtn.setText('Restore from file'), 2500)
  }, 'ghost')

  // ── Flair Packs ──
  const packsSec = section('packs', 'Flair Packs', I.palette, true)
  const packGrid = document.createElement('div')
  packGrid.className = 'lf-packs'
  let gridKey = ''
  /** (Re)build the grid when the user's pack library changes. */
  const renderGrid = () => {
    const list = allPacks()
    const key = list.map((p) => `${p.id}:${p.name}:${p.swatch.join(',')}`).join('|')
    if (key === gridKey) return
    gridKey = key
    packGrid.textContent = ''
    for (const pk of list) {
      const wrap = document.createElement('div')
      wrap.className = 'lf-pack-wrap'
      const b = document.createElement('button')
      b.type = 'button'
      b.className = 'lf-pack'
      b.dataset.pack = pk.id
      const sw = document.createElement('div')
      sw.className = 'lf-pack-sw'
      sw.style.background = `linear-gradient(135deg, ${pk.swatch[0]}, ${pk.swatch[1]})`
      const nm = document.createElement('b')
      nm.textContent = pk.custom ? pk.name : tr(pk.name)
      const tg = document.createElement('span')
      tg.textContent = pk.custom ? pk.tagline || tr(pk.custom === 'imported' ? 'Imported pack' : 'Saved from your look') : tr(pk.tagline)
      b.append(sw, nm, tg)
      b.addEventListener('click', () => actions.applyPack(pk.id))
      wrap.appendChild(b)
      if (pk.custom) {
        const tag = document.createElement('em')
        tag.className = 'lf-pack-tag'
        tag.textContent = tr(pk.custom === 'imported' ? 'Imported' : 'Yours')
        const del = document.createElement('button')
        del.type = 'button'
        del.className = 'lf-pack-del'
        del.title = tr('Remove pack')
        del.setAttribute('aria-label', `${tr('Remove pack')}: ${pk.name}`)
        del.textContent = '×'
        del.addEventListener('click', async (e) => {
          e.stopPropagation()
          const res = await ctx.ui.showConfirm({
            title: tr('Remove pack?'),
            message: `“${pk.name}” ${tr('will be removed from your packs. Your current look stays as it is.')}`,
            variant: 'warning',
            confirmLabel: tr('Remove'),
          })
          if (res.confirmed) actions.deletePack(pk.id)
        })
        wrap.append(tag, del)
      }
      packGrid.appendChild(wrap)
    }
    syncPacks(store.get())
    lastAuraSync?.()
  }
  let lastAuraSync: (() => void) | null = null
  packsSec.body.appendChild(packGrid)
  const syncPacks = (st: FlairSettings) => {
    packGrid.querySelectorAll<HTMLElement>('.lf-pack').forEach((el) => el.classList.toggle('lf-on', el.dataset.pack === st.activePack))
    const active = packById(st.activePack)
    packsSec.badge.textContent = active ? (active.custom ? active.name : tr(active.name)) : ''
  }
  syncers.push(() => renderGrid())
  renderGrid()
  syncers.push(syncPacks)
  syncPacks(s0)
  const auraSwatch = (st: PanelStatus) => {
    const sw = packGrid.querySelector<HTMLElement>('.lf-pack[data-pack="character"] .lf-pack-sw')
    if (!sw) return
    const cols = st.auraColors.slice(0, 4)
    if (cols.length >= 2) sw.style.background = `linear-gradient(135deg, ${cols.join(', ')})`
    else if (cols.length === 1) sw.style.background = `linear-gradient(135deg, ${cols[0]}, color-mix(in oklab, ${cols[0]} 45%, #fff))`
  }
  statusSyncers.push(auraSwatch)
  lastAuraSync = () => auraSwatch(actions.status())
  hint(packsSec.body, 'A pack sets effects, glow, colours, scene and lighting in one click. Tweak anything afterwards. Packs never turn sound on.')

  // Lumiverse theme matching
  const themeSlot = row(packsSec.body, 'Lumiverse theme', 'fill')
  const themeSel = ctx.components.mountSelect(themeSlot, {
    value: s0.uiTheme,
    options: [
      { value: 'off', label: tr('Keep my theme'), sublabel: tr('Flair only styles its own effects') },
      { value: 'pack', label: tr('Match the Flair Pack'), sublabel: tr('Accent, backgrounds and dialogue colours follow the pack') },
      { value: 'character', label: tr('Character aware'), sublabel: tr('Follows the aura colour of whoever is speaking') },
    ],
    ariaLabel: tr('Lumiverse theme'),
    onChange: async (v) => {
      if (v !== 'off' && !actions.status().tintPermission && !(await actions.requestTintPermission())) {
        themeSel.update({ value: store.get().uiTheme })
        return
      }
      store.update({ uiTheme: v as FlairSettings['uiTheme'] })
    },
  })
  handles.push(themeSel)
  syncers.push((st) => {
    if (themeSel.getValue() !== st.uiTheme) themeSel.update({ value: st.uiTheme })
  })
  const depthRow = row(packsSec.body, 'Theme strength', 'fill').parentElement as HTMLElement
  const depthSel = ctx.components.mountSelect(depthRow.querySelector('.lf-ctl') as HTMLElement, {
    value: s0.uiThemeDepth,
    options: [
      { value: 'full', label: tr('Accent + backgrounds'), sublabel: tr('The whole interface takes on the mood') },
      { value: 'accent', label: tr('Accent colours only'), sublabel: tr('Buttons, highlights and dialogue; your backgrounds stay') },
    ],
    ariaLabel: tr('Theme strength'),
    onChange: (v) => store.update({ uiThemeDepth: v as FlairSettings['uiThemeDepth'] }),
  })
  handles.push(depthSel)
  syncers.push((st) => {
    if (depthSel.getValue() !== st.uiThemeDepth) depthSel.update({ value: st.uiThemeDepth })
    depthRow.style.display = st.uiTheme === 'off' ? 'none' : ''
  })
  depthRow.style.display = s0.uiTheme === 'off' ? 'none' : ''
  const themeStatus = document.createElement('div')
  themeStatus.className = 'lf-status lf-theme-status'
  packsSec.body.appendChild(themeStatus)
  const renderTheme = (st: PanelStatus) => {
    const mode = store.get().uiTheme
    themeStatus.style.display = mode === 'off' ? 'none' : ''
    if (mode === 'off') return
    themeStatus.textContent = ''
    if (!st.tintPermission) {
      themeStatus.textContent = tr('Needs permission to restyle Lumiverse — pick the option again to allow it.')
      return
    }
    if (st.uiThemeLabel) {
      const dot = document.createElement('span')
      dot.className = 'lf-theme-dot'
      if (st.charAura && (mode === 'character' || store.get().activePack === 'character' || store.get().colorSource === 'character')) dot.style.background = st.charAura
      const b = document.createElement('b')
      b.textContent = tr(st.uiThemeLabel)
      themeStatus.append(dot, document.createTextNode(`${tr('Theming Lumiverse')}: `), b)
    } else {
      themeStatus.textContent =
        mode === 'character'
          ? tr('Waiting for a character message to read their aura colour…')
          : tr('This pack uses your own theme, so Lumiverse is unchanged.')
    }
  }
  statusSyncers.push(renderTheme)
  syncers.push(() => renderTheme(actions.status()))
  renderTheme(actions.status())
  hint(packsSec.body, 'Restyles Lumiverse with its own theme engine, so everything stays readable in light and dark mode. Your saved theme is never changed — choose “Keep my theme” to get it back. It also shows under Extension Themes in Lumiverse’s Theme panel.')
  const packBtns = buttons(packsSec.body)
  button(packBtns, 'Save my look', () => openSaveDialog(), 'primary', I.palette)
  const importBtn = button(packBtns, 'Import pack', async () => {
    const name = await actions.importPack()
    importBtn.setText(name ? 'Imported ✓' : 'Not a Flair pack')
    setTimeout(() => importBtn.setText('Import pack'), 2000)
  }, 'secondary', I.share)
  button(packBtns, 'Export my look', () => actions.exportPack(), 'secondary', I.share)
  hint(packsSec.body, '<b>Save my look</b> adds your current setup to the packs above. Imported packs land there too, and stay after restarts. Export shares a pack as a <code>.flair.json</code> file, including its Lumiverse theme colours.')

  function openSaveDialog() {
    const modal = ctx.ui.showModal({ title: tr('Save my look as a pack'), width: 380 })
    const root = modal.root
    modal.onDismiss(keepOpenWhileDragging(root)) // selecting the name and letting go outside must not close it
    root.textContent = ''
    const form = document.createElement('form')
    form.className = 'lf-save-form'
    const label = document.createElement('label')
    label.textContent = tr('Pack name')
    const input = document.createElement('input')
    input.type = 'text'
    input.maxLength = 60
    input.className = 'lf-input'
    const active = packById(store.get().activePack)
    input.value = active?.custom ? active.name : ''
    input.placeholder = tr('My Flair Pack')
    label.appendChild(input)
    const note = document.createElement('p')
    note.className = 'lf-hint'
    note.textContent = tr('Saves your effects, glow, colours, scene, lighting and Lumiverse theme colours. Using the name of one of your packs updates it.')
    const row2 = document.createElement('div')
    row2.className = 'lf-btns'
    const save = document.createElement('button')
    save.type = 'submit'
    save.className = 'lf-btn lf-primary'
    save.textContent = tr('Save pack')
    const cancel = document.createElement('button')
    cancel.type = 'button'
    cancel.className = 'lf-btn lf-ghost'
    cancel.textContent = tr('Cancel')
    cancel.addEventListener('click', () => modal.dismiss())
    row2.append(save, cancel)
    form.append(label, note, row2)
    form.addEventListener('submit', (e) => {
      e.preventDefault()
      actions.savePack(input.value || tr('My Flair Pack'))
      modal.dismiss()
    })
    root.appendChild(form)
    setTimeout(() => input.focus(), 50)
  }

  // ── Per-character profile ──
  const prof = section('profile', 'Character profile', I.user, true)
  status(prof.body, (st, el) => {
    const has = store.hasProfile(st.characterId)
    el.textContent = ''
    const name = document.createElement('b')
    name.textContent = st.characterName || (st.characterId ? tr('This character') : tr('No character open'))
    el.append(name, document.createTextNode(st.characterId ? ` — ${has ? tr('using their own Flair profile') : tr('using your global settings')}` : ''))
    prof.badge.textContent = has ? tr('Profile active') : ''
  })
  const profBtns = buttons(prof.body)
  const createBtn = button(profBtns, 'Give this character their own look', () => {
    const id = store.activeCharacter()
    if (id) store.createProfile(id)
  }, 'secondary', I.user)
  const removeBtn = button(profBtns, 'Remove profile', async () => {
    const id = store.activeCharacter()
    if (!id) return
    const res = await ctx.ui.showConfirm({
      title: tr('Remove character profile?'),
      message: tr('This character goes back to your global Flair settings.'),
      variant: 'warning',
      confirmLabel: tr('Remove'),
    })
    if (res.confirmed) store.deleteProfile(id)
  }, 'ghost', I.reset)
  hint(prof.body, 'With a profile active, changes to effects, glow, colour, scene and swipe style in this tab apply to <b>this character only</b>.')
  const syncProfileButtons = () => {
    const id = store.activeCharacter()
    const has = store.hasProfile(id)
    createBtn.el.style.display = has ? 'none' : ''
    createBtn.el.disabled = !id
    removeBtn.el.style.display = has ? '' : 'none'
  }
  syncProfileButtons()
  syncers.push(syncProfileButtons)

  // ── Character intro ──
  const intro = section('intro', 'Character intro', I.film)
  toggle(intro.body, 'Name card when a chat opens', 'intro')
  hint(intro.body, 'Opening a chat plays a short name card in the character’s aura colour, every time you open one. Click or tap to skip it.')
  const introSounds = actions.sounds
  const introSoundOptions = () => [
    { value: '', label: tr('None') },
    ...introSounds.list().map((m) => ({ value: m.id, label: m.name, sublabel: `${fmtDuration(m.duration)} · ${fmtSize(m.size)}` })),
  ]
  const introSoundValue = (id: string) => (id && introSounds.has(id) ? id : '')
  const introSoundSel = ctx.components.mountSelect(row(intro.body, 'Theme sound', 'fill'), {
    value: introSoundValue(s0.introSound),
    options: introSoundOptions(),
    ariaLabel: tr('Theme sound'),
    searchThreshold: 99,
    onChange: (v) => store.update({ introSound: v }),
  })
  handles.push(introSoundSel)
  syncers.push((s) => {
    const v = introSoundValue(s.introSound)
    if (introSoundSel.getValue() !== v) introSoundSel.update({ value: v })
  })
  const offIntroSounds = introSounds.onChange(() =>
    introSoundSel.update({ options: introSoundOptions(), value: introSoundValue(store.get().introSound) }),
  )
  handles.push({ destroy: offIntroSounds })
  hint(intro.body, 'A short file from <b>Your sounds</b> to play with the card (up to 8 seconds). It needs <b>Interface sounds</b> on. With a separate look for a character (Character profile above) it belongs to them alone; without one it plays for every character.')
  toggle(intro.body, 'Group chats: show who is speaking', 'introGroup')
  hint(intro.body, 'A small chip names whoever is talking, in the colour of their avatar, and the other messages dim a little until they have finished.')
  const introBtns = buttons(intro.body)
  button(introBtns, 'Preview intro', actions.previewIntro, 'primary', I.play)
  button(introBtns, 'Preview speaker chip', actions.previewSpeaker, 'secondary', I.play)

  // ── Theater mode ──
  const theaterSec = section('theater', 'Theater mode', I.film)
  hint(theaterSec.body, 'One click hides the interface and leaves the story full-screen, with larger type and a gentle auto-scroll. The atmosphere, lighting and soundscape carry on. You can also start it from the <b>Theater mode</b> item in the input bar’s Extras menu, from the corner-brackets button under any message (it starts reading from that message), or with the command <code>Flair: Toggle theater mode</code>.')
  button(buttons(theaterSec.body), 'Enter theater mode', () => actions.enterTheater(), 'primary', I.film)
  slider(theaterSec.body, 'Text size', 'theaterScale', 1, 2.2, 0.05, { suffix: '×' })
  slider(theaterSec.body, 'Scroll speed', 'theaterSpeed', 1, 8, 1, {})
  toggle(theaterSec.body, 'Start the gentle auto-scroll', 'theaterScroll')
  hint(theaterSec.body, 'The scroll waits while you scroll or touch the screen and carries on a moment later; it stops at the end of the chat. With “reduce motion” on, it starts paused. Inside theater mode: <b>Esc</b> leaves, <b>Space</b> pauses, <b>+</b> and <b>−</b> change the text size; on a phone, tap the screen to bring the controls back. The reply box button lets you answer without leaving.')

  // ── Send ──
  const send = section('send', 'When you send', I.send, true)
  select(send.body, 'Screen effect', 'sendEffect', [
    { value: 'sparkle', label: 'Sparkle burst', sublabel: 'Stars fan out from the composer' },
    { value: 'ripple', label: 'Ripple', sublabel: 'Rings pulse outward' },
    { value: 'comet', label: 'Comet', sublabel: 'A streak flies up into the chat' },
    { value: 'confetti', label: 'Confetti', sublabel: 'Theme-coloured paper pop' },
    { value: 'creamy', label: 'Creamy', sublabel: 'A whale-spout of thick white cream erupts and rains back down' },
    { value: 'splash', label: 'Splash', sublabel: 'A hose-like gush of clear water bursts out and breaks into spray' },
    { value: 'blackhole', label: 'Black Hole ✦', sublabel: 'Overkill: a singularity swallows everything, collapses to a white dot, then detonates' },
    { value: 'petalstorm', label: 'Petal Storm ✦', sublabel: 'Overkill: blossoms burst from the button and a gale sweeps them across the screen' },
    { value: 'none', label: 'None' },
  ])
  slider(send.body, 'Intensity', 'sendIntensity', 0.25, 2, 0.05, { suffix: '×' })
  select(send.body, 'Your new message', 'userEntrance', [
    { value: 'pop', label: 'Pop + glow flash' },
    { value: 'rise', label: 'Rise in' },
    { value: 'none', label: 'None' },
  ])
  select(send.body, 'AI reply finishes', 'characterEntrance', [
    { value: 'bloom', label: 'Glow bloom' },
    { value: 'none', label: 'None' },
  ])
  select(send.body, 'Swipe transition', 'swipeTransition', [
    { value: 'slide', label: 'Slide', sublabel: 'Follows the swipe direction' },
    { value: 'fade', label: 'Soft fade' },
    { value: 'none', label: 'None' },
  ])
  toggle(send.body, 'Composer glows while the AI thinks', 'composerGlow')
  hint(send.body, 'The input box breathes while a reply is generating — brighter and faster when tokens stream in quickly.')
  button(buttons(send.body), 'Preview send effect', actions.previewSend, 'primary', I.play)

  // ── Hover ──
  const hover = section('hover', 'Message glow', I.glow)
  select(hover.body, 'Hover style', 'hoverStyle', [
    { value: 'trace', label: 'Edge trace', sublabel: 'A light runs around the border' },
    { value: 'glow', label: 'Soft glow' },
    { value: 'neon', label: 'Neon' },
    { value: 'none', label: 'Off (Lumiverse default)' },
  ])
  select(hover.body, 'Applies to', 'hoverTarget', [
    { value: 'all', label: 'All messages' },
    { value: 'character', label: 'Character messages' },
    { value: 'user', label: 'My messages' },
  ])
  slider(hover.body, 'Glow strength', 'hoverStrength', 0.25, 2, 0.05, { suffix: '×' })
  slider(hover.body, 'Trace loop time', 'traceSpeed', 1, 8, 0.5, { suffix: 's', decimals: 1 })
  toggle(hover.body, 'Aura while the AI is writing', 'streamingAura')
  button(buttons(hover.body), 'Flash latest message', actions.previewHover, 'secondary', I.spark)

  // ── Colour & mood ──
  const colour = section('colour', 'Colour & mood', I.palette)
  status(colour.body, (st, el) => {
    el.textContent = ''
    const sw = document.createElement('span')
    sw.className = 'lf-swatch'
    el.appendChild(sw)
    const add = (label: string, value: string | null) => {
      if (!value) return
      const b = document.createElement('b')
      b.textContent = value
      el.append(document.createTextNode(` ${label} `), b)
    }
    el.append(document.createTextNode(tr('Glow colour')))
    add(`· ${tr('mood')}`, st.moodLabel)
    add(`· ${tr('time')}`, st.timeLabel ? tr(st.timeLabel) : null)
  })
  select(colour.body, 'Glow colour', 'colorSource', [
    { value: 'theme', label: 'Follow my theme', sublabel: 'Uses the accent, incl. character-aware tint' },
    { value: 'character', label: 'Character aura', sublabel: 'The aura colour of whoever is speaking' },
    { value: 'custom', label: 'Custom colour' },
  ])
  const customRow = color(colour.body, 'Custom colour', 'customColor')
  select(colour.body, 'My messages use', 'userColor', [
    { value: 'match', label: 'Same colour' },
    { value: 'warm', label: 'Warm amber', sublabel: 'Matches Minimal mode’s user bar' },
    { value: 'custom', label: 'Their own colour' },
  ])
  const userRow = color(colour.body, 'My colour', 'userCustomColor')
  toggle(colour.body, 'Time-of-day tint', 'timeOfDay')
  hint(colour.body, 'Peach at dawn, amber at golden hour, indigo at night (your local clock).')
  toggle(colour.body, 'Mood-reactive glow', 'moodGlow')
  hint(colour.body, 'Follows the character’s current expression (needs Expressions set up for the character).')
  toggle(colour.body, 'Tint the whole UI with the mood', 'moodTintUI', async (next) => {
    if (!next) return true
    if (actions.status().tintPermission) return true
    return actions.requestTintPermission()
  })
  hint(colour.body, 'Re-tints Lumiverse’s accent while the mood lasts, then restores your theme. Needs the <code>app_manipulation</code> permission (you’ll be asked once).')
  textarea(colour.body, 'Mood colours (labels = #hex, one rule per line)', 'moodMap', 6, 'happy, joy = #ffc94d')
  toggle(colour.body, 'Character aura signatures', 'auras')
  const auraHint = hint(colour.body, '')
  statusSyncers.push((st) => {
    auraHint.innerHTML = tr('Each character glows in a signature colour sampled from their avatar; in group chats a small puff shows who just spoke.')
    if (st.auraColors.length) {
      const row = document.createElement('span')
      row.className = 'lf-aura-row'
      for (const c of st.auraColors.slice(0, 12)) {
        const dot = document.createElement('i')
        dot.className = 'lf-aura-dot'
        dot.style.background = c
        dot.style.boxShadow = `0 0 8px ${c}`
        row.appendChild(dot)
      }
      auraHint.appendChild(row)
    }
  })

  // ── Ambient ──
  const amb = section('ambient', 'Ambient scene', I.cloud)
  status(amb.body, (st, el) => {
    el.textContent = ''
    const b = document.createElement('b')
    b.textContent = tr(SCENE_LABEL[st.activeScene] ?? st.activeScene)
    el.append(document.createTextNode(`${tr('Now showing')}: `), b)
    if (st.autoScene) el.append(document.createTextNode(` · ${tr('lorebook suggests')} ${tr(SCENE_LABEL[st.autoScene] ?? st.autoScene)}`))
    amb.badge.textContent = st.activeScene !== 'off' ? tr(SCENE_LABEL[st.activeScene] ?? '') : ''
  })
  select(amb.body, 'Default scene', 'ambientScene', sceneOptions)
  // Per-chat override lives in settings.chatScenes[chatId].
  {
    const slot = row(amb.body, 'This chat', 'fill')
    const chatValue = () => {
      const id = actions.status().chatId
      return (id && store.getBase().chatScenes[id]) || 'default'
    }
    const h = ctx.components.mountSelect(slot, {
      value: chatValue(),
      options: [
        { value: 'default', label: tr('Use default / lorebook') },
        { value: 'auto', label: tr('Lorebook only') },
        ...sceneOptions.map((o) => ({ ...o, label: tr(o.label) })),
      ],
      ariaLabel: tr('This chat'),
      disabled: !actions.status().chatId,
      onChange: (v) => {
        const id = actions.status().chatId
        if (!id) return
        const next = { ...store.getBase().chatScenes }
        if (v === 'default') delete next[id]
        else next[id] = v as ChatScene
        store.update({ chatScenes: next })
      },
    })
    handles.push(h)
    let lastDisabled = !actions.status().chatId
    const sync = () => {
      const v = chatValue()
      if (h.getValue() !== v) h.update({ value: v })
      const dis = !actions.status().chatId
      if (dis !== lastDisabled) {
        lastDisabled = dis
        h.update({ disabled: dis })
      }
    }
    syncers.push(sync)
    statusSyncers.push(sync)
  }
  toggle(amb.body, 'Follow the lorebook', 'ambientAuto')
  hint(amb.body, 'When an activated lorebook entry mentions the weather or place (rain, snow, campfire, sakura, night sky…) the scene switches to match. Force one with a key or comment like <code>flair:snow</code>, or <code>flair:off</code> to clear it.')
  slider(amb.body, 'Density', 'ambientDensity', 0.25, 2, 0.05, { suffix: '×' })
  slider(amb.body, 'Opacity', 'ambientOpacity', 0.1, 1, 0.05, { suffix: '%', decimals: 0, scale: 100 })

  // ── Scene Director & lighting ──
  const dirSec = section('director', 'Scene Director & lighting', I.film)
  status(dirSec.body, (st, el) => {
    el.textContent = ''
    const b = document.createElement('b')
    b.textContent = st.directed || tr('No direction yet')
    el.append(document.createTextNode(`${tr('AI direction')}: `), b, document.createTextNode(` · ${tr('light')}: ${tr(LIGHT_LABEL[st.light] ?? st.light)}`))
    dirSec.badge.textContent = st.directed ? '🎬' : ''
  })
  toggle(dirSec.body, 'Let the AI direct the scene', 'sceneDirector')
  hint(dirSec.body, 'The AI ends a reply with an invisible stage direction like <code>&lt;flair scene="rain" light="dusk" mood="tense"&gt;&lt;/flair&gt;</code> when the setting changes — weather, lighting, mood and soundscape follow. Uses the prompt note (or <code>{{flair_tags}}</code>).')
  select(dirSec.body, 'Default lighting', 'lightDefault', LIGHTS.map((l) => ({ value: l, label: LIGHT_LABEL[l] })))
  toggle(dirSec.body, 'Cinematic layer', 'cinematic')
  hint(dirSec.body, 'Light tint, light rays, vignette and lightning drawn behind the messages, above your wallpaper.')
  slider(dirSec.body, 'Vignette', 'vignette', 0, 1, 0.05, { suffix: '%', decimals: 0, scale: 100 })
  toggle(dirSec.body, 'Film grain', 'grain')
  toggle(dirSec.body, 'Lightning in storms', 'lightning')
  toggle(dirSec.body, 'Camera shake on shouts', 'cameraShake')
  button(buttons(dirSec.body), 'Preview lightning', actions.previewLightning, 'secondary', I.spark)

  // ── Typewriter pacing ──
  const tw = section('typewriter', 'Typewriter pacing', I.text)
  toggle(tw.body, 'Typewriter reveal', 'typewriter')
  hint(tw.body, 'Replies appear at a steady pace instead of in bursts, as if typed. It never falls more than a moment behind what has arrived, and when the reply ends the rest comes out quickly. Off when “reduce motion” is on.')
  slider(tw.body, 'Typing speed', 'typewriterCps', 10, 120, 5, { suffix: ' /s' })
  toggle(tw.body, 'Key sounds', 'typewriterSound')
  hint(tw.body, 'Soft key clicks while it types, a little lower and duller when the character is sad, brighter when happy. They need <b>Interface sounds</b> on (Sound). To use your own, pick a file for <b>Typewriter key</b> under Your sounds.')
  const twDemo = document.createElement('div')
  twDemo.className = 'lf-tw-demo'
  twDemo.textContent = tr('The lamp flickered once, then steadied. “You came back,” she said, and for a moment neither of them knew what to do with the quiet.')
  tw.body.appendChild(twDemo)
  const twPreview = button(buttons(tw.body), 'Preview typewriter', () => actions.previewTypewriter(twDemo), 'primary', I.play)
  if (!actions.typewriterSupported()) {
    twPreview.el.disabled = true
    hint(tw.body, '<b>This browser can’t do it</b> (it needs Chrome or Edge 105+, Safari 17.2+ or Firefox 140+).')
  }

  // ── Text & AI effects ──
  const tfx = section('textfx', 'Text & AI effects', I.text)
  toggle(tfx.body, 'Animated text effects', 'textEffects')
  // Effect picker: live previews; click to switch an effect off or on.
  const FX_LABEL: Record<TextFx, string> = {
    shake: 'Shake', glow: 'Glow', whisper: 'Whisper', rainbow: 'Rainbow', pulse: 'Pulse',
    big: 'Big', typewriter: 'Typewriter', fade: 'Fade', glitch: 'Glitch', flicker: 'Flicker',
  }
  const pickHead = document.createElement('div')
  pickHead.className = 'lf-fx-head'
  const pickTitle = document.createElement('span')
  pickTitle.className = 'lf-label'
  pickTitle.textContent = tr('Effects in use')
  const pickCount = document.createElement('span')
  pickCount.className = 'lf-fx-count'
  pickHead.append(pickTitle, pickCount)
  tfx.body.appendChild(pickHead)
  const pick = document.createElement('div')
  pick.className = 'lf-fx-pick'
  pick.setAttribute('role', 'group')
  pick.setAttribute('aria-label', tr('Effects in use'))
  for (const fx of TEXT_FX) {
    const b = document.createElement('button')
    b.type = 'button'
    b.className = 'lf-fx-chip'
    b.dataset.fx = fx
    const sample = document.createElement('span')
    sample.setAttribute('data-lf', fx)
    sample.textContent = tr(FX_LABEL[fx])
    const state = document.createElement('small')
    b.append(sample, state)
    b.addEventListener('click', (e) => {
      e.preventDefault()
      const off = new Set(store.get().textFxOff)
      if (off.has(fx)) off.delete(fx)
      else off.add(fx)
      store.update({ textFxOff: TEXT_FX.filter((x) => off.has(x)) })
    })
    // Replay one-shot effects (typewriter, fade) on hover.
    b.addEventListener('mouseenter', () => {
      if (fx !== 'typewriter' && fx !== 'fade') return
      sample.removeAttribute('data-lf')
      void sample.offsetWidth
      sample.setAttribute('data-lf', fx)
    })
    pick.appendChild(b)
  }
  tfx.body.appendChild(pick)
  const syncPick = (st: FlairSettings) => {
    const off = new Set(st.textFxOff)
    pick.querySelectorAll<HTMLButtonElement>('.lf-fx-chip').forEach((b) => {
      const isOn = !off.has(b.dataset.fx as TextFx)
      b.classList.toggle('lf-off', !isOn)
      b.setAttribute('aria-pressed', String(isOn))
      b.title = tr(isOn ? 'On — click to turn off' : 'Off — click to turn on')
      ;(b.querySelector('small') as HTMLElement).textContent = tr(isOn ? 'On' : 'Off')
    })
    pickCount.textContent = `${TEXT_FX.length - off.size} / ${TEXT_FX.length}`
    pick.classList.toggle('lf-master-off', !st.textEffects)
  }
  syncers.push(syncPick)
  syncPick(store.get())
  const pickBtns = buttons(tfx.body)
  button(pickBtns, 'Turn all on', () => store.update({ textFxOff: [] }), 'ghost')
  hint(tfx.body, 'Click an effect to switch it off. Off effects show as plain text in messages and the AI stops using them. With a character profile active, this choice is saved for that character only.')
  select(tfx.body, 'How often the AI uses them', 'textFxFrequency', [
    { value: 'every', label: 'Every reply', sublabel: '3–6 styled phrases in each message' },
    { value: 'often', label: 'Most replies', sublabel: '1–3 where they fit' },
    { value: 'sparing', label: 'Sparingly', sublabel: 'Only for real emphasis' },
  ])
  toggle(tfx.body, 'Add the instructions to every prompt', 'autoInject', async (next) => {
    if (!next) return true
    if (actions.status().injectPermission) return true
    return actions.requestInjectPermission()
  })
  const injectHint = hint(tfx.body, '')
  const renderInjectHint = (st: PanelStatus) => {
    injectHint.innerHTML = st.injectPermission
      ? 'Flair adds a short styling note just before the latest message, so the AI keeps using effects every turn. You can see it as <b>Lumi Flair text effects</b> in Prompt Breakdown.'
      : 'Needs the <code>interceptor</code> permission (you’ll be asked once). Without it, put <code>{{flair_tags}}</code> in your preset or character card instead.'
  }
  statusSyncers.push(renderInjectHint)
  renderInjectHint(actions.status())
  const grantBtn = button(buttons(tfx.body), 'Allow prompt injection', async () => {
    await actions.requestInjectPermission()
  }, 'primary', I.text)
  const syncGrant = (st: PanelStatus) => {
    grantBtn.el.style.display = st.injectPermission || !store.get().autoInject ? 'none' : ''
  }
  statusSyncers.push(syncGrant)
  syncers.push(() => syncGrant(actions.status()))
  syncGrant(actions.status())
  hint(
    tfx.body,
    'Effects are written as <code>&lt;span data-lf="shake"&gt;…&lt;/span&gt;</code> — also <code>glow</code>, <code>whisper</code>, <code>rainbow</code>, <code>typewriter</code>, <code>fade</code>, <code>pulse</code>, <code>glitch</code>, <code>flicker</code>, <code>big</code>.',
  )
  toggle(tfx.body, 'Let the AI trigger screen effects', 'aiEffects')
  hint(tfx.body, 'The AI can write <code>&lt;flair effect="confetti"&gt;&lt;/flair&gt;</code> at a big moment. It’s hidden from the text and plays once, when the reply arrives.')
  toggle(tfx.body, 'Choice chips', 'choiceChips')
  hint(tfx.body, 'When you face a decision, the AI can offer 2–3 options as glowing buttons under its reply: <code>&lt;flair-choice&gt;…&lt;/flair-choice&gt;</code>.')
  toggle(tfx.body, 'Send a choice immediately', 'choiceSend')
  hint(tfx.body, 'Off: clicking a choice puts it in the input box so you can edit it first.')
  const copyBtn = button(buttons(tfx.body), 'Copy {{flair_tags}}', async () => {
    try {
      await navigator.clipboard.writeText('{{flair_tags}}')
      copyBtn.setText('Copied ✓')
      setTimeout(() => copyBtn.setText('Copy {{flair_tags}}'), 1800)
    } catch {
      /* clipboard blocked — the hint shows the macro anyway */
    }
  }, 'secondary', I.copy)

  // ── Story heartbeat ──
  const beat = section('heartbeat', 'Story heartbeat', I.heart)
  const beatHost = document.createElement('div')
  beatHost.className = 'lf-beat-host'
  const legend = document.createElement('div')
  legend.className = 'lf-beat-legend'
  legend.innerHTML = `<span>${tr('↑ joyful')}</span><span>${tr('↓ dark')}</span>`
  beat.body.append(beatHost, legend)
  const BEAT_HINT = 'The emotional arc of this chat, from the character’s expressions, the AI’s mood directions and the tone of each reply. Click a point to jump to it. A ★ marks a pinned moment.'
  const beatInfo = hint(beat.body, BEAT_HINT)
  /** Say what happened after a jump, in the hint under the chart. */
  const jumpNote = (res: 'ok' | 'missing' | 'notfound' | 'cancelled' | 'unavailable', gone: string) => {
    if (res === 'missing') beatInfo.textContent = tr(gone)
    else if (res === 'notfound') beatInfo.textContent = tr('Couldn’t reach that message just now — try again in a moment.')
    else if (res === 'unavailable') beatInfo.textContent = tr('Open the chat to jump to its messages.')
    else beatInfo.textContent = tr(BEAT_HINT)
  }
  let beatKey = ''
  statusSyncers.push((st) => {
    const key = `${st.chatId}|${st.beats.length}|${st.beats.at(-1)?.v ?? ''}|${st.beats.at(-1)?.label ?? ''}|${st.pins.map((p) => p.id).join(',')}`
    if (key === beatKey) return
    beatKey = key
    beat.badge.textContent = st.beats.length ? String(st.beats.length) : ''
    renderHeartbeat(
      beatHost,
      st.beats,
      async (pt) => jumpNote(await actions.jumpTo(pt), 'That message no longer exists, so its point was removed.'),
      st.pins,
      async (pin) => jumpNote(await actions.jumpToPin(pin), 'That message no longer exists, so its pin was removed.'),
    )
  })

  // ── Favourite moments ──
  const fav = section('favourites', 'Favourite moments', I.star)
  const favList = document.createElement('div')
  favList.className = 'lf-pin-list'
  fav.body.appendChild(favList)
  const favInfo = hint(fav.body, 'Tap the ★ under a message to pin it. Select some text first to pin just that line. Pinned moments show as stars on the story heartbeat above.')
  button(buttons(fav.body), 'Pin the latest message', () => actions.pinLatest(), 'secondary', I.star)
  toggle(fav.body, 'Save pins to Lumiverse memory', 'pinMemory', async (next) =>
    !next || actions.status().memoriesPermission || (await actions.requestMemoriesPermission()),
  )
  hint(fav.body, 'Adds each new pin to Lumiverse’s memory as a short fact about whoever said it, so the AI can recall it. It works through your Memory Cortex (which must be on) and Lumiverse’s own memory budget, so Flair adds no tokens of its own. Lumiverse can only add facts, so unpinning doesn’t take one back out.')
  const memGrant = button(buttons(fav.body), 'Allow memory access', async () => {
    if (await actions.requestMemoriesPermission()) store.update({ pinMemory: true })
  }, 'secondary', I.star)
  button(buttons(fav.body), 'Save this chat’s pins to memory', () => actions.savePinsToMemory(), 'secondary', I.share)
  const memNote = hint(fav.body, '')
  statusSyncers.push((st) => {
    memGrant.el.style.display = store.get().pinMemory && !st.memoriesPermission ? '' : 'none'
    memNote.textContent = st.memoryNote ?? ''
    memNote.style.display = st.memoryNote ? '' : 'none'
  })
  syncers.push(() => (memGrant.el.style.display = store.get().pinMemory && !actions.status().memoriesPermission ? '' : 'none'))
  let favKey: string | null = null // null: nothing drawn yet, so the empty note shows even before the first pin
  statusSyncers.push((st) => {
    const key = `${st.chatId}|${st.pins.map((p) => `${p.id}:${p.t}`).join(',')}`
    if (key === favKey) return
    favKey = key
    fav.badge.textContent = st.pins.length ? String(st.pins.length) : ''
    favList.textContent = ''
    if (!st.pins.length) {
      const e = document.createElement('div')
      e.className = 'lf-pin-empty'
      e.textContent = tr(st.chatId ? 'No pinned moments in this chat yet.' : 'Open a chat to pin its moments.')
      favList.appendChild(e)
      return
    }
    for (const pin of st.pins) {
      const card = document.createElement('div')
      card.className = 'lf-pin'
      if (pin.color) card.style.setProperty('--lf-pin-c', pin.color)
      const head = document.createElement('div')
      head.className = 'lf-pin-head'
      head.innerHTML = STAR_SVG
      const who = document.createElement('span')
      who.className = 'lf-pin-who'
      who.textContent = pin.who || tr(pin.user ? 'You' : 'Message')
      const n = document.createElement('span')
      n.className = 'lf-pin-n'
      n.textContent = pin.t ? new Date(pin.t).toLocaleDateString() : ''
      head.append(who, n)
      const text = document.createElement('p')
      text.className = 'lf-pin-text'
      text.dataset.whole = pin.whole ? '1' : '0'
      text.textContent = pin.whole ? pin.text : `“${pin.text}”`
      const acts = document.createElement('div')
      acts.className = 'lf-pin-acts'
      button(acts, 'Jump to it', async () => {
        const res = await actions.jumpToPin(pin)
        if (res === 'missing') favInfo.textContent = tr('That message no longer exists, so its pin was removed.')
        else if (res === 'notfound') favInfo.textContent = tr('Couldn’t reach that message just now — try again in a moment.')
        else if (res === 'unavailable') favInfo.textContent = tr('Open the chat to jump to its messages.')
      }, 'ghost', I.chev)
      button(acts, 'Remove', () => actions.unpin(pin.id), 'ghost', I.trash)
      card.append(head, text, acts)
      favList.appendChild(card)
    }
  })

  // ── Celebrations ──
  const party = section('celebrate', 'Celebrations', I.party)
  toggle(party.body, 'Message milestones', 'milestones')
  hint(party.body, 'Confetti and a little banner at 50, 100, 250, 500, 1000… messages in a chat.')
  textarea(party.body, 'Keyword triggers (phrase => sparkle | ripple | comet | confetti)', 'triggers', 5, 'happy birthday => confetti')
  hint(party.body, 'Checked against your messages and the AI’s replies.')

  // ── Achievements ──
  const ach = section('achievements', 'Achievements', I.trophy)
  toggle(ach.body, 'Show unlock cards', 'achievements')
  const grid = document.createElement('div')
  grid.className = 'lf-badges'
  ach.body.appendChild(grid)
  let achKey: string | null = null // null: nothing drawn yet, so the locked badges show even before the first unlock
  statusSyncers.push((st) => {
    const key = Object.keys(st.unlocked).sort().join(',')
    if (key === achKey) return
    achKey = key
    grid.textContent = ''
    for (const a of ACHIEVEMENTS) {
      const got = !!st.unlocked[a.id]
      const c = document.createElement('div')
      c.className = got ? 'lf-badge-card lf-got' : 'lf-badge-card'
      c.title = tr(a.desc)
      const ico = document.createElement('span')
      ico.className = 'lf-badge-ico'
      ico.textContent = a.icon
      const t = document.createElement('b')
      t.textContent = tr(a.title)
      const d = document.createElement('span')
      d.textContent = got ? new Date(st.unlocked[a.id]).toLocaleDateString() : tr(a.desc)
      c.append(ico, t, d)
      grid.appendChild(c)
    }
    ach.badge.textContent = `${Object.keys(st.unlocked).length}/${ACHIEVEMENTS.length}`
  })

  // ── Sound ──
  const snd = section('sound', 'Sound', I.sound)
  toggle(snd.body, 'Interface sounds', 'sound')
  hint(snd.body, 'Soft synthesized chimes on send, reply and celebrations. Pitch follows the mood.')
  slider(snd.body, 'Volume', 'soundVolume', 0, 1, 0.05, { suffix: '%', decimals: 0, scale: 100 })
  button(buttons(snd.body), 'Test sound', actions.testSound, 'secondary', I.sound)
  toggle(snd.body, 'Soundscapes', 'soundscape')
  hint(snd.body, 'Rain, wind, crackling fire, night crickets, spring birds or a deep-space hum — generated live to match the scene and lighting, crossfading as the story moves. No audio files.')
  slider(snd.body, 'Soundscape volume', 'soundscapeVolume', 0, 1, 0.05, { suffix: '%', decimals: 0, scale: 100 })
  toggle(snd.body, 'AI sound effects', 'aiSfx')
  hint(snd.body, 'The AI can add short sound cues to a reply — a door knock, a sword clash, a heartbeat — that play as the line appears. Adds a short note (about 200 tokens) to each request, and uses the same “Add the instructions to every prompt” setting as the other AI tags. Assign your own files to any cue under “Your sounds”.')
  slider(snd.body, 'Effects volume', 'sfxVolume', 0, 1, 0.05, { suffix: '%', decimals: 0, scale: 100 })
  const cueRow = buttons(snd.body)
  for (const c of SFX_CUES) button(cueRow, c.label, () => actions.previewSfx(c.name), 'secondary', I.sound)
  toggle(snd.body, 'Floating volume widget', 'soundWidget', async (next) =>
    !next || actions.status().panelsPermission || (await actions.requestPanelsPermission()),
  )
  hint(snd.body, 'A small pill you can drag anywhere: turn the ambience on or off and set its volume without opening this panel. Needs the “UI panels” permission.')
  const widgetGrant = button(buttons(snd.body), 'Allow the floating widget', async () => {
    if (await actions.requestPanelsPermission()) store.update({ soundWidget: true })
  }, 'secondary', I.sound)
  const syncWidgetGrant = (st: PanelStatus) => {
    widgetGrant.el.style.display = store.get().soundWidget && !st.panelsPermission ? '' : 'none'
  }
  statusSyncers.push(syncWidgetGrant)
  syncers.push(() => syncWidgetGrant(actions.status()))
  syncWidgetGrant(actions.status())
  select(snd.body, 'When in the background', 'soundUnfocused', [
    { value: 'keep', label: 'Keep playing', sublabel: 'Ambience plays at full volume when you switch windows' },
    { value: 'dim', label: 'Dim', sublabel: 'Turns the ambience down while another window is in front' },
    { value: 'mute', label: 'Mute', sublabel: 'Silences the ambience until you come back' },
  ])
  hint(snd.body, 'Dims or mutes the soundscape while you’re in another window or app, and brings it back when you return.')
  const dimWrap = document.createElement('div')
  snd.body.appendChild(dimWrap)
  slider(dimWrap, 'Dim to', 'soundUnfocusedLevel', 0.05, 0.8, 0.05, { suffix: '%', decimals: 0, scale: 100 })
  const syncDim = (s: FlairSettings) => (dimWrap.style.display = s.soundUnfocused === 'dim' ? '' : 'none')
  syncers.push(syncDim)
  syncDim(s0)
  const scapeStatus = document.createElement('div')
  scapeStatus.className = 'lf-status'
  snd.body.appendChild(scapeStatus)
  const renderScape = (st: PanelStatus) => {
    const on = store.get().soundscape
    scapeStatus.style.display = on ? '' : 'none'
    if (!on) return
    const [sc, li] = st.soundscapeKey.split('|')
    const named = st.soundscapeAlways ? [] : [sc && sc !== 'off' ? tr(SCENE_LABEL[sc] ?? sc) : '', li && li !== 'none' ? tr(LIGHT_LABEL[li] ?? li) : '']
    const what = [...named, ...st.soundscapeCustom.map((n) => `♫ ${n}`)]
      .filter(Boolean)
      .join(' · ')
    scapeStatus.textContent =
      st.soundscape === 'playing'
        ? `♪ ${tr('Playing')}: ${what}`
        : st.soundscape === 'waiting'
          ? tr('Paused by the browser — click anywhere to resume')
          : tr('Silent — this scene and lighting have no ambience')
  }
  statusSyncers.push(renderScape)
  syncers.push(() => renderScape(actions.status()))
  renderScape(actions.status())

  // ── Your sounds ──
  const mine = section('mysounds', 'Your sounds', I.music)
  hint(mine.body, 'Use your own audio files: a looping ambience for any scene or lighting (or one track that always plays), and your own message and system sounds. Files stay in this browser, so other devices need their own copies, and they aren’t included in settings backups.')
  const sl = actions.sounds
  const upMsg = document.createElement('div')
  upMsg.className = 'lf-status lf-snd-msg'
  upMsg.style.display = 'none'
  const upBtn = button(buttons(mine.body), 'Upload sounds', async () => {
    upBtn.el.disabled = true
    upBtn.setText('Adding…')
    try {
      const { added, errors } = await sl.upload()
      const parts: string[] = []
      if (added.length) parts.push(`${tr('Added')}: ${added.join(', ')}`)
      parts.push(...errors)
      upMsg.textContent = parts.join(' · ')
      upMsg.dataset.kind = errors.length && !added.length ? 'error' : 'ok'
      upMsg.style.display = parts.length ? '' : 'none'
    } finally {
      upBtn.el.disabled = false
      upBtn.setText('Upload sounds')
    }
  }, 'primary', I.upload)
  mine.body.appendChild(upMsg)
  if (!sl.saved()) hint(mine.body, '<b>This browser won’t keep files</b> (private window or storage blocked), so they’ll be gone when you close Lumiverse.')
  const libList = document.createElement('div')
  libList.className = 'lf-snd-list'
  mine.body.appendChild(libList)

  const assignHead = document.createElement('div')
  assignHead.className = 'lf-snd-sub'
  assignHead.textContent = tr('Use a sound')
  mine.body.appendChild(assignHead)
  const slotOptions = () =>
    Object.entries(SLOT_LABEL).map(([value, l]) => ({ value, label: tr(l.label), group: tr(l.group) }))
  const soundOptions = () => [
    { value: '', label: tr('Built-in sound'), sublabel: tr('Generated by Lumi Flair') },
    ...sl.list().map((m) => ({ value: m.id, label: m.name, sublabel: `${fmtDuration(m.duration)} · ${fmtSize(m.size)}` })),
  ]
  let slot = 'always'
  const slotSel = ctx.components.mountSelect(row(mine.body, 'For', 'fill'), {
    value: slot,
    options: slotOptions(),
    ariaLabel: tr('For'),
    searchThreshold: 99,
    onChange: (v) => {
      slot = v || 'always'
      soundSel.update({ value: store.get().customSounds[slot] ?? '' })
    },
  })
  handles.push(slotSel)
  const soundSel = ctx.components.mountSelect(row(mine.body, 'Sound', 'fill'), {
    value: s0.customSounds[slot] ?? '',
    options: soundOptions(),
    ariaLabel: tr('Sound'),
    onChange: (v) => {
      const next = { ...store.get().customSounds }
      if (v) next[slot] = v
      else delete next[slot]
      store.update({ customSounds: next })
    },
  })
  handles.push(soundSel)
  const assigned = document.createElement('div')
  assigned.className = 'lf-snd-assigned'
  mine.body.appendChild(assigned)
  hint(mine.body, 'Ambience files loop through the soundscape (so the volume, floating widget and background dimming apply). A scene and a lighting can each have a file and play together. Interface sounds need <b>Interface sounds</b> on and play for up to 12 seconds.')

  let libHandles: Array<{ destroy(): void }> = []
  let previewing: string | null = null
  const usedFor = (id: string) =>
    Object.entries(store.get().customSounds)
      .filter(([, v]) => v === id)
      .map(([k]) => tr(SLOT_LABEL[k]?.label ?? k))

  const renderLibrary = () => {
    for (const h of libHandles) h.destroy()
    libHandles = []
    libList.textContent = ''
    const items = sl.list()
    mine.badge.textContent = items.length ? String(items.length) : ''
    if (!items.length) {
      const empty = document.createElement('div')
      empty.className = 'lf-snd-empty'
      empty.textContent = tr('No sounds yet — upload MP3, OGG, WAV, M4A or FLAC files.')
      libList.appendChild(empty)
      return
    }
    for (const m of items) {
      const card = document.createElement('div')
      card.className = 'lf-snd'
      const head = document.createElement('div')
      head.className = 'lf-snd-head'
      const play = document.createElement('button')
      play.type = 'button'
      play.className = 'lf-snd-play'
      const paintPlay = () => {
        const on = previewing === m.id
        play.dataset.on = on ? '1' : '0'
        play.innerHTML = on ? I.stop : I.play
        play.setAttribute('aria-label', on ? tr('Stop') : tr('Play'))
        play.title = play.getAttribute('aria-label') ?? ''
      }
      paintPlay()
      play.addEventListener('click', (e) => {
        e.preventDefault()
        if (previewing === m.id) {
          sl.stopPreview()
          return
        }
        previewing = m.id
        renderPlayButtons()
        sl.preview(m.id, () => {
          if (previewing === m.id) previewing = null
          renderPlayButtons()
        })
      })
      ;(play as HTMLButtonElement & { paint?: () => void }).paint = paintPlay
      const info = document.createElement('div')
      info.className = 'lf-snd-info'
      const name = document.createElement('b')
      name.textContent = m.name
      name.title = m.name
      const meta = document.createElement('span')
      const uses = usedFor(m.id)
      meta.textContent = [fmtDuration(m.duration), fmtSize(m.size), uses.length ? `${tr('Used for')}: ${uses.join(', ')}` : tr('Not used yet')].join(' · ')
      info.append(name, meta)
      const del = document.createElement('button')
      del.type = 'button'
      del.className = 'lf-snd-del'
      del.innerHTML = I.trash
      del.title = tr('Delete')
      del.setAttribute('aria-label', `${tr('Delete')} ${m.name}`)
      del.addEventListener('click', async (e) => {
        e.preventDefault()
        let ok = true
        try {
          const res = await ctx.ui.showConfirm({
            title: tr('Delete this sound?'),
            message: `${m.name}${uses.length ? ` — ${tr('Used for')}: ${uses.join(', ')}` : ''}`,
            variant: 'warning',
            confirmLabel: tr('Delete'),
          })
          ok = res.confirmed
        } catch {
          /* no confirm dialog available: just delete */
        }
        if (!ok) return
        if (previewing === m.id) sl.stopPreview()
        const next = Object.fromEntries(Object.entries(store.get().customSounds).filter(([, v]) => v !== m.id))
        store.update({ customSounds: next })
        await sl.remove(m.id)
      })
      head.append(play, info, del)
      const level = document.createElement('div')
      card.append(head, level)
      libList.appendChild(card)
      const h = ctx.components.mountRangeSlider(level, {
        label: tr('Level'),
        min: 0,
        max: 150,
        step: 5,
        value: Math.round(m.level * 100),
        format: { suffix: '%', decimals: 0 },
        onCommit: (v) => sl.setLevel(m.id, v / 100),
      })
      libHandles.push(h)
    }
  }
  const renderPlayButtons = () => {
    for (const b of libList.querySelectorAll<HTMLButtonElement & { paint?: () => void }>('.lf-snd-play')) b.paint?.()
  }

  const renderAssigned = () => {
    assigned.textContent = ''
    const cs = store.get().customSounds
    for (const [k, id] of Object.entries(cs)) {
      const pair = document.createElement('div')
      pair.className = 'lf-snd-pair'
      const missing = !sl.has(id)
      pair.dataset.missing = missing ? '1' : '0'
      const text = document.createElement('span')
      const l = SLOT_LABEL[k]
      text.append(`${tr(l?.group ?? '')} · ${tr(l?.label ?? k)} → `)
      const b = document.createElement('b')
      b.textContent = missing ? tr('not in this browser') : sl.list().find((m) => m.id === id)?.name ?? id
      text.appendChild(b)
      const x = document.createElement('button')
      x.type = 'button'
      x.className = 'lf-snd-del'
      x.innerHTML = I.trash
      x.title = tr('Use the built-in sound')
      x.setAttribute('aria-label', x.title)
      x.addEventListener('click', (e) => {
        e.preventDefault()
        const next = { ...store.get().customSounds }
        delete next[k]
        store.update({ customSounds: next })
      })
      pair.append(text, x)
      assigned.appendChild(pair)
    }
  }

  const renderMine = () => {
    soundSel.update({ options: soundOptions(), value: store.get().customSounds[slot] ?? '' })
    renderLibrary()
    renderAssigned()
  }
  let lastAssign = JSON.stringify(s0.customSounds)
  syncers.push((st) => {
    const key = JSON.stringify(st.customSounds)
    if (key === lastAssign) return
    lastAssign = key
    renderMine()
  })
  const offSounds = sl.onChange(renderMine)
  handles.push({
    destroy: () => {
      offSounds()
      sl.stopPreview()
      for (const h of libHandles) h.destroy()
    },
  })
  renderMine()

  // ── Share ──
  const share = section('share', 'Share', I.share)
  hint(share.body, '<b>Moment Cards</b> turn a message into a share-ready image with the avatar, the quote and the character’s glow. Use the camera button on any message, or:')
  button(buttons(share.body), 'Moment Card of the latest reply', () => actions.momentLatest(), 'primary', I.camera)
  hint(share.body, 'Export your hover glow, edge trace and streaming aura as a Lumiverse theme pack, so friends get the look without installing the extension.')
  const exportBtn = button(buttons(share.body), 'Export theme pack', async () => {
    exportBtn.el.disabled = true
    try {
      const kind = await actions.exportTheme()
      exportBtn.setText(kind === 'pack' ? 'Saved .lumitheme ✓' : 'Saved .css ✓')
      setTimeout(() => exportBtn.setText('Export theme pack'), 2500)
    } finally {
      exportBtn.el.disabled = false
    }
  }, 'secondary', I.share)

  // ── Footer ──
  const foot = buttons(panel)
  button(foot, 'Show welcome', () => actions.openWelcome(), 'ghost', I.spark)
  button(foot, 'Reset to defaults', async () => {
    const res = await ctx.ui.showConfirm({
      title: tr('Reset Lumi Flair?'),
      message: tr('All Flair settings go back to their defaults, and character profiles are removed.'),
      variant: 'warning',
      confirmLabel: tr('Reset'),
    })
    if (res.confirmed) store.reset()
  }, 'ghost', I.reset)

  function syncVisibility(s: FlairSettings) {
    customRow.style.display = s.colorSource === 'custom' ? '' : 'none'
    userRow.style.display = s.userColor === 'custom' ? '' : 'none'
  }
  syncVisibility(s0)

  // Catch up with what happened before the panel existed. Several sections (achievements, the heartbeat,
  // the hints) only draw when a status update arrives, so after a restart they would sit empty, with
  // everything saved but nothing shown, until some unrelated event happened to fire one.
  for (const fn of statusSyncers) fn(actions.status())

  tab.root.appendChild(panel)

  const unsub = store.subscribe((s) => {
    syncVisibility(s)
    for (const fn of syncers) fn(s)
    for (const fn of statusSyncers) fn(actions.status())
  })
  const unsubStatus = actions.onStatus((st) => {
    for (const fn of statusSyncers) fn(st)
    syncProfileButtons()
  })

  return {
    activate: () => tab.activate(),
    destroy: () => {
      unsub()
      unsubStatus()
      unsubVault()
      clearInterval(agoTimer)
      for (const h of handles) {
        try {
          h.destroy()
        } catch {
          /* already gone */
        }
      }
      tab.destroy()
    },
  }
}
