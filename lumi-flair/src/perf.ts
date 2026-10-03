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
        if (this.saver && this.high >= 4) this.set(false)
      }
      this.raf = requestAnimationFrame(tick)
    }
    this.raf = requestAnimationFrame(tick)
  }

  private set(v: boolean) {
    this.saver = v
    this.low = this.high = 0
    this.onChange(this.saving)
  }

  reset() {
    if (this.saver) this.set(false)
  }

  stop() {
    if (this.raf) cancelAnimationFrame(this.raf)
    this.raf = 0
  }
}
