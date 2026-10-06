/**
 * Keep a Lumiverse extension modal open when a drag ends outside it.
 *
 * `ctx.ui.showModal` closes on any click whose target is its backdrop. Selecting text inside the modal and
 * letting go outside it produces exactly that click (a click goes to the nearest element the press and the
 * release share, which is the backdrop), so the modal closed mid-selection. The host's own modals check where
 * the press started; this does the same for ours: a click whose press began inside `root` and which lands
 * outside it is stopped before the backdrop sees it. A real click on the backdrop still closes the modal.
 */
export function keepOpenWhileDragging(root: HTMLElement): () => void {
  let pressedInside = false
  const down = (e: PointerEvent) => {
    pressedInside = root.contains(e.target as Node)
  }
  const click = (e: MouseEvent) => {
    if (!pressedInside) return
    pressedInside = false
    if (!root.contains(e.target as Node)) e.stopPropagation()
  }
  window.addEventListener('pointerdown', down, true)
  window.addEventListener('click', click, true)
  return () => {
    window.removeEventListener('pointerdown', down, true)
    window.removeEventListener('click', click, true)
  }
}
