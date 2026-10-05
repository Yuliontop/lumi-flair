/**
 * Performance governor: samples the frame rate while Flair is animating and
 * switches to "battery saver" (fewer particles, no grain/rays) when the
 * device struggles; recovers once things are smooth again. Lumiverse's own
 * Efficiency rendering mode starts us in saver straight away.
 */
export class PerfGovernor {
  private raf = 0
  private frames = 0
  private windowStart = 0
  private low = 0
  private high = 0
  private saver = false
  /** Times the effects were switched back on and the frame rate dropped again within a minute: each one makes the next recovery slower. */
  private relapses = 0
  private recoveredAt = 0
  fps = 60

  constructor(
    private isActive: () => boolean,
    private onChange: (saver: boolean) => void,
  ) {}

  get saving() {
    return this.saver || document.documentElement.getAttribute('data-rendering-mode') === 'efficiency'
  }

  start() {
    if (this.raf) return
    this.windowStart = performance.now()
    this.frames = 0
    const tick = (now: number) => {
      if (!this.isActive() || document.hidden) {
        this.raf = 0
        return
      }
      this.frames++
      const dt = now - this.windowStart
      if (dt >= 2000) {
        this.fps = (this.frames * 1000) / dt
        this.frames = 0
        this.windowStart = now
        if (this.fps < 38) {
          this.low++
          this.high = 0
        } else if (this.fps > 52) {
          this.high++
          this.low = 0
        }
        if (!this.saver && this.low >= 2) this.set(true)
        // 4 smooth windows (8 s) to recover at first; after a relapse, twice as long, so a device that can't keep up doesn't flap.
        if (this.saver && this.high >= Math.min(64, 4 * 2 ** this.relapses)) this.set(false)
      }
      this.raf = requestAnimationFrame(tick)
    }
    this.raf = requestAnimationFrame(tick)
  }

  private set(v: boolean) {
    if (v && this.recoveredAt && performance.now() - this.recoveredAt < 60_000) this.relapses++
    if (!v) this.recoveredAt = performance.now()
    this.saver = v
    this.low = this.high = 0
    this.onChange(this.saving)
  }

  reset() {
    this.relapses = 0
    if (this.saver) this.set(false)
  }

  stop() {
    if (this.raf) cancelAnimationFrame(this.raf)
    this.raf = 0
  }
}
