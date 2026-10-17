/**
 * Book mode: turning a page. The curl is one leaf (two faces back to back) rotating about the spine with
 * `rotateY`, shaded by a gradient layer whose opacity follows the angle. Only `transform` and `opacity` change
 * (docs/BOOK_MODE.md 2 and 3.3), and the leaf exists only while a page is turning.
 */
export type TurnStyle = 'curl' | 'slide' | 'instant'

export interface TurnEnv {
  /** The reader's choice: 'auto' | 'curl' | 'slide' | 'instant'. */
  setting: string
  /** False when motion is reduced. */
  motion: boolean
  /** A touch screen. */
  coarse: boolean
  /** The viewport's width in CSS pixels. */
  width: number
}

/** auto: the curl on a computer or a tablet, a flat slide on a phone. Reduced motion always means an instant turn. */
export function resolveStyle(e: TurnEnv): TurnStyle {
  if (!e.motion || e.setting === 'instant') return 'instant'
  if (e.setting === 'curl' || e.setting === 'slide') return e.setting
  return e.coarse && e.width < 768 ? 'slide' : 'curl'
}

export const TURN_MS = 520
export const SLIDE_MS = 320
const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2)

/**
 * A turning leaf. `p` runs from 0 (flat on its own page) to 1 (turned over onto the other side). The leaf sits over
 * `box` (a half of the spread, or the whole page) and turns about that box's spine edge: its left edge when `forward`.
 */
export class Leaf {
  readonly el: HTMLElement
  private shadeFront: HTMLElement
  private shadeBack: HTMLElement
  private raf = 0
  p = 0

  constructor(stage: HTMLElement, box: { left: number; width: number; height: number }, front: HTMLElement, back: HTMLElement) {
    const el = document.createElement('div')
    el.className = 'lf-bk-leaf'
    Object.assign(el.style, { left: `${box.left}px`, width: `${box.width}px`, height: `${box.height}px` })
    const f = document.createElement('div')
    f.className = 'lf-bk-lf lf-bk-lf-front'
    const b = document.createElement('div')
    b.className = 'lf-bk-lf lf-bk-lf-back'
    this.shadeFront = document.createElement('i')
    this.shadeBack = document.createElement('i')
    this.shadeFront.className = this.shadeBack.className = 'lf-bk-shade'
    f.append(front, this.shadeFront)
    b.append(back, this.shadeBack)
    el.append(f, b)
    stage.appendChild(el)
    this.el = el
    this.set(0)
  }

  set(p: number) {
    this.p = Math.min(1, Math.max(0, p))
    this.el.style.transform = `rotateY(${(-180 * this.p).toFixed(2)}deg)`
    const s = Math.sin(Math.PI * this.p)
    this.shadeFront.style.opacity = String((0.42 * s * (this.p < 0.5 ? 1 : 0)).toFixed(3))
    this.shadeBack.style.opacity = String((0.42 * s * (this.p >= 0.5 ? 1 : 0)).toFixed(3))
  }

  /** Animate to `to` (0 or 1) from wherever the leaf is. Resolves when it has landed. */
  play(to: 0 | 1, ms = TURN_MS): Promise<void> {
    cancelAnimationFrame(this.raf)
    const from = this.p
    const t0 = performance.now()
    const span = Math.max(80, ms * Math.abs(to - from))
    return new Promise((done) => {
      const step = (now: number) => {
        const t = Math.min(1, (now - t0) / span)
        this.set(from + (to - from) * ease(t))
        if (t < 1) this.raf = requestAnimationFrame(step)
        else {
          this.raf = 0
          done()
        }
      }
      this.raf = requestAnimationFrame(step)
    })
  }

  destroy() {
    cancelAnimationFrame(this.raf)
    this.el.remove()
  }
}
