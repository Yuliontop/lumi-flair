/**
 * Lumi Tile (several chats on screen at once) runs each extra chat as a same-origin frame holding a whole
 * Lumiverse, so every tile runs its own Lumi Flair. It marks each window's <html data-lumi-tile>:
 *   - 'live'  the tile the user is in (full colour)
 *   - 'idle'  the other tiles (dimmed)
 *   - 'host'  the main window while tiles cover it. It always shows the live tile's chat, hidden underneath.
 *   - absent  no tiling: Lumi Flair behaves as always.
 * Lumi Flair splits its work so nothing doubles: pictures where the user looks (no tiling, or the live tile);
 * sound, theme and float widgets once (no tiling, or the main window); saving only outside tiles.
 */
export type TileRole = 'live' | 'idle' | 'host' | null

/** Lumi Tile names its frames `lumi-tile:<id>` before they load, so a tile knows it's one from the start. */
export const inTileFrame = (): boolean => window.name.startsWith('lumi-tile:')

export function tileRole(): TileRole {
  const v = document.documentElement.dataset.lumiTile
  if (v === 'live' || v === 'idle' || v === 'host') return v
  return inTileFrame() ? 'idle' : null // a tile stays quiet until Lumi Tile says it's live
}

/** Atmosphere, bursts, intro, speaker chip: only where the user is looking. */
export const visualsHere = (): boolean => {
  const r = tileRole()
  return r === null || r === 'live'
}

/** Sounds, the whole-UI theme/tint, float widgets: exactly one window. */
export const sharedHere = (): boolean => {
  const r = tileRole()
  return r === null || r === 'host'
}

/** Calls `fn` when this window's role changes. Returns the way to stop. */
export function onTileRole(fn: (role: TileRole) => void): () => void {
  if (typeof MutationObserver === 'undefined') return () => {}
  let last = tileRole()
  const mo = new MutationObserver(() => {
    const r = tileRole()
    if (r === last) return
    last = r
    fn(r)
  })
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-lumi-tile'] })
  return () => mo.disconnect()
}
