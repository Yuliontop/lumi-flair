/**
 * Whether anyone is looking: false while the page is hidden and, unless the user turned it off, while the window
 * isn't the one in front. The animated layers (scenes, the light, the visualizer) stop drawing while it is true.
 */
let pauseUnfocused = true
const subs = new Set<() => void>()

export const away = (): boolean => document.hidden || (pauseUnfocused && typeof document.hasFocus === 'function' && !document.hasFocus())

const fire = () => subs.forEach((f) => f())

export function setPauseUnfocused(v: boolean) {
  if (v === pauseUnfocused) return
  pauseUnfocused = v
  fire()
}

/** Call `fn` whenever the page is shown or hidden or the window gains or loses focus. Returns the way to stop. */
export function onPresence(fn: () => void): () => void {
  if (!subs.size) {
    document.addEventListener('visibilitychange', fire)
    window.addEventListener('focus', fire)
    window.addEventListener('blur', fire)
  }
  subs.add(fn)
  return () => {
    subs.delete(fn)
    if (subs.size) return
    document.removeEventListener('visibilitychange', fire)
    window.removeEventListener('focus', fire)
    window.removeEventListener('blur', fire)
  }
}
