import { afterEach, beforeEach, expect, mock, test } from 'bun:test'
import type { SpindleFrontendContext, SpindleSystemAudioFrame, SpindleSystemAudioStartOptions } from 'lumiverse-spindle-types'
import { DEFAULT_SETTINGS, normalize, type FlairSettings } from '../src/settings'
import { Visualizer, themePalette } from '../src/visualizer'

// A small canvas/host fixture: exercise the real session lifecycle, frame loop and drawing paths.
class TestPath {
  rects: number[][] = []
  rect(...args: number[]) { this.rects.push(args) }
  roundRect(...args: number[]) { this.rects.push(args) }
}

class TestCanvas {
  style: Record<string, string> = {}
  width = 1000
  height = 180
  clientWidth = 1000
  clientHeight = 180
  rects: number[][] = []
  translations: number[][] = []
  curves: number[][] = []
  transforms: number[][] = []
  labels: Array<{ text: string; colour: unknown }> = []
  g = {
    fillStyle: '' as unknown,
    globalAlpha: 1,
    setTransform() {}, save() {}, restore() {},
    transform: (...args: number[]) => this.transforms.push(args),
    translate: (...args: number[]) => this.translations.push(args),
    clearRect: () => { this.rects = []; this.translations = []; this.curves = []; this.transforms = []; this.labels = [] },
    createLinearGradient: () => ({ addColorStop() {} }),
    beginPath() {}, moveTo() {}, lineTo() {}, closePath() {}, stroke() {},
    quadraticCurveTo: (...args: number[]) => this.curves.push(args),
    fill: (path?: TestPath) => { if (path) this.rects.push(...path.rects) },
    fillRect: (...args: number[]) => this.rects.push(args),
    fillText: (text: string) => this.labels.push({ text, colour: this.g.fillStyle }),
  }
  getContext() { return this.g }
  remove() {}
}

let frames: Map<number, FrameRequestCallback>
let nextFrame: number
let visualizers: Visualizer[]
let doc: { hidden: boolean; hasFocus(): boolean; addEventListener(): void; removeEventListener(): void; querySelector(): unknown;
  documentElement: { setAttribute(key: string, value: string): void; removeAttribute(key: string): void; hasAttribute(key: string): boolean } }
const globals = ['document', 'window', 'Path2D', 'matchMedia', 'requestAnimationFrame', 'cancelAnimationFrame']
const original = new Map(globals.map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]))

beforeEach(() => {
  frames = new Map()
  nextFrame = 0
  visualizers = []
  const list = { getBoundingClientRect: () => ({ left: 200, right: 800 }) }
  const view = { offsetWidth: 1000, getBoundingClientRect: () => ({ left: 0, right: 1000, width: 1000 }), querySelector: () => list }
  const attributes = new Map<string, string>()
  doc = { hidden: false, hasFocus: () => true, addEventListener() {}, removeEventListener() {}, querySelector: () => view,
    documentElement: {
      setAttribute: (key, value) => { attributes.set(key, value) },
      removeAttribute: (key) => { attributes.delete(key) },
      hasAttribute: (key) => attributes.has(key),
    } }
  Object.assign(globalThis, {
    document: doc,
    window: { devicePixelRatio: 1, addEventListener() {}, removeEventListener() {} },
    Path2D: TestPath,
    matchMedia: () => ({ matches: false }),
    requestAnimationFrame: (callback: FrameRequestCallback) => { frames.set(++nextFrame, callback); return nextFrame },
    cancelAnimationFrame: (id: number) => frames.delete(id),
  })
})

afterEach(() => {
  for (const viz of visualizers) viz.destroy()
  for (const [key, descriptor] of original) {
    if (descriptor) Object.defineProperty(globalThis, key, descriptor)
    else Reflect.deleteProperty(globalThis, key)
  }
})

const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0))
function tick(at: number) {
  const callbacks = [...frames.values()]
  frames.clear()
  for (const callback of callbacks) callback(at)
}

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no })
  return { promise, resolve, reject }
}

function fixture(patch: Partial<FlairSettings> = {}) {
  const settings = { ...DEFAULT_SETTINGS, viz: true, vizSource: 'system', vizWindow: false, vizBg: true, vizSides: true, vizGlow: 0, ...patch } as FlairSettings
  const canvases: TestCanvas[] = []
  const sessions: Array<{ options: SpindleSystemAudioStartOptions; stop: ReturnType<typeof mock> }> = []
  const status = { available: true, stereoSupported: true }
  const capabilities: Record<string, number> = { 'system-audio-v1': 1, 'system-audio-stereo-v1': 1 }
  const getGranted = mock(async () => ['system_audio'])
  const request = mock(async () => ['system_audio'])
  const start = mock((options: SpindleSystemAudioStartOptions) => {
    const session = { options, stop: mock(() => {}) }
    sessions.push(session)
    return { ready: Promise.resolve(), stop: session.stop }
  })
  const ctx = {
    dom: { createElement: () => { const canvas = new TestCanvas(); canvases.push(canvas); return canvas } },
    host: { capabilities },
    permissions: { getGranted, request },
    systemAudio: { isAvailable: () => status, start },
  } as unknown as SpindleFrontendContext
  const deps = {
    settings: () => settings, update: (patch: Partial<FlairSettings>) => Object.assign(settings, patch),
    tap: () => null, palette: (): [string, string] => ['#a78bfa', '#38bdf8'],
    motionOk: () => true, saver: () => false, panels: () => false, onState: mock(() => {}),
  }
  const viz = new Visualizer(ctx, deps)
  visualizers.push(viz)
  return { viz, settings, ctx, deps, canvases, sessions, status, capabilities, getGranted, request, start }
}

const channel = (level: number) => ({ amplitude: level, peak: level, frequencies: Array(64).fill(level) })
const stereoFrame = (left: number, right: number, mono = Math.max(left, right)): SpindleSystemAudioFrame =>
  ({ ...channel(mono), stereo: { left: channel(left), right: channel(right) } })

test('limits message hover transitions only while a visualizer is animating', async () => {
  const f = fixture({ vizStereo: true })
  expect(doc.documentElement.hasAttribute('data-lf-viz-active')).toBe(false)
  f.viz.sync(true)
  await flush()
  expect(doc.documentElement.hasAttribute('data-lf-viz-active')).toBe(true)
  f.sessions[0].options.onFrame(stereoFrame(0, 0))
  for (let at = 100; at <= 1700; at += 100) tick(at)
  expect(f.viz.animating).toBe(false)
  expect(doc.documentElement.hasAttribute('data-lf-viz-active')).toBe(false)
  f.sessions[0].options.onFrame(stereoFrame(1, 0))
  expect(doc.documentElement.hasAttribute('data-lf-viz-active')).toBe(true)
  f.viz.destroy()
  expect(doc.documentElement.hasAttribute('data-lf-viz-active')).toBe(false)
})

test.each(['hidden', 'unfocused', 'disabled', 'no targets'] as const)('restores normal message transitions when %s', (reason) => {
  const f = fixture({ vizSource: 'demo' })
  f.viz.sync(true)
  expect(doc.documentElement.hasAttribute('data-lf-viz-active')).toBe(true)
  if (reason === 'hidden') doc.hidden = true
  if (reason === 'unfocused') doc.hasFocus = () => false
  if (reason === 'disabled') f.settings.enabled = false
  if (reason === 'no targets') f.settings.vizBg = f.settings.vizSides = false
  if (reason === 'unfocused') tick(100)
  else f.viz.sync(true)
  expect(f.viz.animating).toBe(false)
  expect(doc.documentElement.hasAttribute('data-lf-viz-active')).toBe(false)
})

test('stereo setting survives normalization and old settings keep the combined view', () => {
  expect(normalize({ vizStereo: true }).vizStereo).toBe(true)
  expect(normalize({}).vizStereo).toBe(false)
  expect(normalize({ vizStereo: 'true' }).vizStereo).toBe(false)
})

test('accepts the current-theme colour option while keeping Flair as the default', () => {
  expect(normalize({ vizColor: 'theme' }).vizColor).toBe('theme')
  expect(normalize({}).vizColor).toBe('flair')
  expect(normalize({ vizColor: 'unknown' }).vizColor).toBe('flair')
})

test('reads resolved RGB and sRGB theme hues, preserving a secondary colour with UI transparency', () => {
  expect(themePalette('rgba(240, 80, 40, 0.9)', 'rgba(128, 128, 128, 0.15)')).toEqual(['#f05028', '#808080'])
  expect(themePalette('color(srgb 0.2 0.4 0.6 / 0.9)', 'rgb(102 153 204)')).toEqual(['#336699', '#6699cc'])
})

test('respects identical or neutral theme colours instead of substituting a Flair Pack palette', () => {
  expect(themePalette('rgb(0, 0, 0)', 'rgb(0, 0, 0)')).toEqual(['#000000', '#000000'])
  expect(themePalette('rgb(255, 255, 255)', 'rgb(128, 128, 128)')).toEqual(['#ffffff', '#808080'])
})

test('uses valid fallback colours when resolved theme colours cannot be read', () => {
  const fallback = themePalette('', '')
  expect(fallback[0]).toBe('#9370db')
  expect(fallback[1]).toMatch(/^#[\da-f]{6}$/)
  expect(fallback[1]).not.toBe(fallback[0])
  const partial = themePalette('rgb(255, 100, 50)', 'not a colour')
  expect(partial[0]).toBe('#ff6432')
  expect(partial[1]).not.toBe(partial[0])
})

test('refreshes live theme colours without restarting capture or changing saved custom colours', async () => {
  const f = fixture({ vizStereo: true, vizStyle: 'ribbons', vizColor: 'theme' })
  let colours = ['rgb(240, 80, 40)', 'rgba(128, 128, 128, 0.15)']
  f.deps.palette = () => themePalette(colours[0], colours[1])
  f.viz.sync(true)
  await flush()
  f.sessions[0].options.onFrame(stereoFrame(1, 1))
  tick(100)
  expect(f.canvases[0].labels.map((label) => label.colour)).toEqual(['#f05028', '#808080'])
  colours = ['rgb(50, 200, 180)', 'rgb(100, 150, 250)']
  tick(1200)
  expect(f.canvases[0].labels.map((label) => label.colour)).toEqual(['#32c8b4', '#6496fa'])
  expect(f.start).toHaveBeenCalledTimes(1)
  expect(f.settings.vizColorA).toBe(DEFAULT_SETTINGS.vizColorA)
  expect(f.settings.vizColorB).toBe(DEFAULT_SETTINGS.vizColorB)
})

test('uses a changed theme immediately when channel activity wakes the visualizer', async () => {
  const f = fixture({ vizStereo: true, vizStyle: 'ribbons', vizColor: 'theme' })
  let colours = ['rgb(240, 80, 40)', 'rgb(128, 128, 128)']
  f.deps.palette = () => themePalette(colours[0], colours[1])
  f.viz.sync(true)
  await flush()
  for (let at = 100; at <= 1600; at += 100) tick(at)
  expect(f.viz.state()).toBe('quiet')
  colours = ['rgb(50, 200, 180)', 'rgb(100, 150, 250)']
  f.sessions[0].options.onFrame(stereoFrame(1, 1))
  tick(2700)
  expect(f.canvases[0].labels.map((label) => label.colour)).toEqual(['#32c8b4', '#6496fa'])
})

test('custom colours stay selected while the live theme palette changes', async () => {
  const f = fixture({ vizStereo: true, vizStyle: 'ribbons', vizColor: 'custom' })
  f.deps.palette = () => themePalette('rgb(240, 80, 40)', 'rgb(128, 128, 128)')
  f.viz.sync(true)
  await flush()
  f.sessions[0].options.onFrame(stereoFrame(1, 1))
  tick(100)
  expect(f.canvases[0].labels.map((label) => label.colour)).toEqual([f.settings.vizColorA, f.settings.vizColorB])
})

test('automatically starts once using the existing permission', async () => {
  const f = fixture({ vizStereo: true })
  f.viz.sync(true)
  f.viz.sync(true)
  await flush()
  expect(f.start).toHaveBeenCalledTimes(1)
  expect(f.request).not.toHaveBeenCalled()
  expect(f.sessions[0].options).toMatchObject({ stereo: true, bands: 64, maxFps: 30 })
  expect(f.viz.state()).toBe('live')
})

test.each(['native', 'frontend'])('falls back to mono without %s stereo support', async (missing) => {
  const f = fixture({ vizStereo: true })
  if (missing === 'native') f.status.stereoSupported = false
  else delete f.capabilities['system-audio-stereo-v1']
  f.viz.sync(true)
  await flush()
  expect(f.sessions[0].options.stereo).toBeUndefined()
  f.sessions[0].options.onFrame(channel(1))
  tick(100)
  expect(f.canvases[1].rects.length).toBeGreaterThan(0)
  expect(f.canvases[2].rects).toEqual(f.canvases[1].rects)
  expect(f.canvases[0].translations).toEqual([])
})

test('routes left-only and right-only audio to the matching strips and background halves', async () => {
  const f = fixture({ vizStereo: true, vizSmoothing: 0 })
  f.viz.sync(true)
  await flush()
  f.sessions[0].options.onFrame(stereoFrame(1, 0))
  tick(100)
  expect(f.canvases[1].rects.length).toBeGreaterThan(0)
  expect(f.canvases[2].rects).toEqual([])
  expect(f.canvases[0].translations).toEqual([[502, 0]])
  expect(f.canvases[0].rects.every(([x]) => x < 498)).toBe(true)
  f.sessions[0].options.onFrame(stereoFrame(0, 1))
  for (let at = 200; at <= 2200; at += 100) tick(at)
  expect(f.canvases[1].rects).toEqual([])
  expect(f.canvases[2].rects.length).toBeGreaterThan(0)
})

test.each(['bars', 'ribbons'] as const)('wakes %s on channel activity even when the combined spectrum cancels', async (vizStyle) => {
  const f = fixture({ vizStereo: true, vizStyle })
  f.viz.sync(true)
  await flush()
  for (let at = 100; at <= 1600; at += 100) tick(at)
  expect(f.viz.state()).toBe('quiet')
  expect(f.viz.animating).toBe(false)
  f.sessions[0].options.onFrame(stereoFrame(1, 1, 0))
  expect(f.viz.animating).toBe(true)
  tick(1700)
  expect(f.canvases[1].rects.length).toBeGreaterThan(0)
  expect(f.canvases[2].rects.length).toBeGreaterThan(0)
})

test('preserves Stereo ribbons as a saved style when stereo is toggled off', () => {
  expect(normalize({ vizStereo: true, vizStyle: 'ribbons' }).vizStyle).toBe('ribbons')
  expect(normalize({ vizStereo: false, vizStyle: 'ribbons' }).vizStyle).toBe('ribbons')
})

test.each([false, true])('ribbons align the channels across the full spectrum with centre flip %s', async (vizCenterFlip) => {
  const f = fixture({ vizStereo: true, vizStyle: 'ribbons', vizCenter: true, vizCenterFlip, vizBgTop: true })
  f.viz.sync(true)
  await flush()
  f.sessions[0].options.onFrame(stereoFrame(1, 0, 0))
  tick(100)
  const [bg, left, right] = f.canvases
  expect(bg.rects).toHaveLength(f.settings.vizBars * 2)
  expect(bg.rects.some(([x]) => x > 900)).toBe(true)
  expect(bg.transforms).toEqual([[1, 0, 0, -1, 22, 172]])
  expect(bg.labels.map((label) => label.text)).toEqual(['L', 'R'])
  expect(left.rects.length).toBeGreaterThan(0)
  expect(right.rects).toEqual([])
  expect(bg.g.globalAlpha).toBe(1)
})

test('ribbons keep the right channel in its own strip and separate matching colours', async () => {
  const f = fixture({ vizStereo: true, vizStyle: 'ribbons', vizColor: 'custom', vizColorA: '#a78bfa', vizColorB: '#a78bfa' })
  f.viz.sync(true)
  await flush()
  f.sessions[0].options.onFrame(stereoFrame(0, 1, 0))
  tick(100)
  const [bg, left, right] = f.canvases
  expect(left.rects).toEqual([])
  expect(right.rects.length).toBeGreaterThan(0)
  expect(bg.labels[0].colour).not.toBe(bg.labels[1].colour)
})

test.each(['disabled', 'unsupported', 'missing frame'] as const)('ribbons fall back to a combined Wave when stereo is %s', async (reason) => {
  const f = fixture({ vizStereo: reason !== 'disabled', vizStyle: 'ribbons' })
  if (reason === 'unsupported') f.status.stereoSupported = false
  f.viz.sync(true)
  await flush()
  f.sessions[0].options.onFrame(channel(1))
  tick(100)
  expect(f.canvases[0].labels).toEqual([])
  expect(f.canvases[0].translations).toEqual([])
  expect(f.canvases[0].curves.length).toBeGreaterThan(0)
  expect(f.canvases[1].curves).toEqual(f.canvases[2].curves)
})

test('changing to ribbons reuses the capture session and works with rainbow, peaks and glow', async () => {
  const f = fixture({ vizStereo: true })
  f.viz.sync(true)
  await flush()
  Object.assign(f.settings, { vizStyle: 'ribbons', vizColor: 'rainbow', vizPeaks: true, vizGlow: 0.8 })
  f.viz.sync(true)
  f.sessions[0].options.onFrame(stereoFrame(1, 0.6))
  tick(100)
  expect(f.start).toHaveBeenCalledTimes(1)
  expect(f.canvases[0].rects.length).toBeGreaterThan(0)
  expect(f.canvases[0].curves.length).toBeGreaterThan(0)
  expect(f.canvases[0].g.globalAlpha).toBe(1)
})

test.each(['bars', 'mirror', 'segments', 'wave'] as const)('draws two independent channels in %s style', async (style) => {
  const f = fixture({ vizStereo: true, vizStyle: style, vizCenter: true, vizPeaks: true })
  f.viz.sync(true)
  await flush()
  f.sessions[0].options.onFrame(stereoFrame(1, 0))
  tick(100)
  expect(f.canvases[0].translations).toEqual([[502, 0]])
  if (style === 'wave') {
    expect(f.canvases[1].curves.some(([, y]) => y < f.canvases[1].clientWidth)).toBe(true)
    expect(f.canvases[2].curves.every(([, y]) => y === f.canvases[2].clientWidth)).toBe(true)
  } else {
    expect(f.canvases[1].rects.length).toBeGreaterThan(0)
    expect(f.canvases[2].rects).toEqual([])
  }
})

test('a frame without channels falls back to the combined view', async () => {
  const f = fixture({ vizStereo: true })
  f.viz.sync(true)
  await flush()
  f.sessions[0].options.onFrame(channel(1))
  tick(100)
  expect(f.canvases[1].rects).toEqual(f.canvases[2].rects)
  expect(f.canvases[0].translations).toEqual([])
})

test('does not request missing permission automatically; manual connect still requests it', async () => {
  const f = fixture()
  f.getGranted.mockImplementation(async () => [])
  f.viz.sync(true)
  await flush()
  expect(f.start).not.toHaveBeenCalled()
  expect(f.request).not.toHaveBeenCalled()
  expect(f.viz.state()).toBe('connect')
  expect(f.viz.lastError).toBeNull()
  await f.viz.connect()
  expect(f.request).toHaveBeenCalledTimes(1)
  expect(f.start).toHaveBeenCalledTimes(1)
})

test('a failed automatic start leaves manual retry available without repeated attempts', async () => {
  const f = fixture()
  f.start.mockImplementationOnce(() => ({ ready: Promise.reject(new DOMException('Denied', 'NotAllowedError')), stop: mock(() => {}) }))
  f.viz.sync(true)
  await flush()
  f.viz.sync(true)
  await flush()
  expect(f.start).toHaveBeenCalledTimes(1)
  expect(f.viz.state()).toBe('connect')
  expect(f.viz.lastError).toBeNull()
  await f.viz.connect()
  expect(f.start).toHaveBeenCalledTimes(2)
  expect(f.viz.state()).toBe('live')
})

test.each(['user-stopped', 'revoked', 'host-disabled', 'source-lost'] as const)('does not automatically restart after %s', async (reason) => {
  const f = fixture()
  f.viz.sync(true)
  await flush()
  f.sessions[0].options.onEnd!(reason)
  f.viz.sync(true)
  await flush()
  expect(f.start).toHaveBeenCalledTimes(1)
  expect(f.viz.state()).toBe(reason === 'user-stopped' ? 'connect' : 'error')
})

test('changing the stereo option replaces the session and ignores old frames', async () => {
  const f = fixture()
  f.viz.sync(true)
  await flush()
  f.settings.vizStereo = true
  f.viz.sync(true)
  await flush()
  expect(f.sessions[0].stop).toHaveBeenCalledTimes(1)
  expect(f.sessions[1].options.stereo).toBe(true)
  f.sessions[0].options.onFrame(channel(1))
  tick(100)
  expect(f.canvases[1].rects).toEqual([])
  f.sessions[1].options.onFrame(stereoFrame(1, 0))
  tick(200)
  expect(f.canvases[1].rects.length).toBeGreaterThan(0)
  expect(f.canvases[2].rects).toEqual([])
})

test.each(['disable', 'switch source', 'destroy'])('cancels permission checks when the user chooses to %s', async (action) => {
  const f = fixture()
  const permissions = deferred<string[]>()
  f.getGranted.mockImplementation(() => permissions.promise)
  f.viz.sync(true)
  if (action === 'destroy') f.viz.destroy()
  else {
    if (action === 'disable') f.settings.viz = false
    else f.settings.vizSource = 'demo'
    f.viz.sync(true)
  }
  permissions.resolve(['system_audio'])
  await flush()
  expect(f.start).not.toHaveBeenCalled()
})

test('stops pending startup and ignores its late rejection after destruction', async () => {
  const f = fixture()
  const startup = deferred<void>()
  const stop = mock(() => {})
  f.start.mockImplementation(() => ({ ready: startup.promise, stop }))
  f.viz.sync(true)
  await flush()
  f.viz.destroy()
  startup.reject(new DOMException('Cancelled', 'AbortError'))
  await flush()
  expect(stop).toHaveBeenCalledTimes(1)
  expect(f.viz.lastError).toBeNull()
  expect(frames.size).toBe(0)
})

test.each(['hidden', 'disabled', 'reduced motion', 'touch screen'])('does not automatically capture when %s', async (reason) => {
  if (reason === 'touch screen') Object.assign(globalThis, { matchMedia: () => ({ matches: true }) })
  const f = fixture()
  if (reason === 'hidden') doc.hidden = true
  if (reason === 'disabled') f.settings.enabled = false
  if (reason === 'reduced motion') f.deps.motionOk = () => false
  f.viz.sync(true)
  await flush()
  expect(f.start).not.toHaveBeenCalled()
})

test('other audio sources remain manual and stereo demo needs no capture', async () => {
  for (const vizSource of ['flair', 'tab', 'mic', 'demo'] as const) {
    const f = fixture({ vizSource, vizStereo: true })
    f.viz.sync(true)
    await flush()
    expect(f.start).not.toHaveBeenCalled()
    if (vizSource === 'demo') {
      tick(100)
      expect(f.canvases[1].rects.length).toBeGreaterThan(0)
      expect(f.canvases[2].rects).not.toEqual(f.canvases[1].rects)
    }
    f.viz.destroy()
  }
})
