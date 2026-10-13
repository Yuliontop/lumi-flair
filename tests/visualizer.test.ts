import { afterEach, beforeEach, expect, mock, test } from 'bun:test'
import type { SpindleFrontendContext, SpindleSystemAudioFrame, SpindleSystemAudioStartOptions } from 'lumiverse-spindle-types'
import { DEFAULT_SETTINGS, normalize, type FlairSettings } from '../src/settings'
import { Visualizer } from '../src/visualizer'

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
  g = {
    setTransform() {}, transform() {}, save() {}, restore() {},
    translate: (...args: number[]) => this.translations.push(args),
    clearRect: () => { this.rects = []; this.translations = []; this.curves = [] },
    createLinearGradient: () => ({ addColorStop() {} }),
    beginPath() {}, moveTo() {}, lineTo() {}, closePath() {}, stroke() {},
    quadraticCurveTo: (...args: number[]) => this.curves.push(args),
    fill: (path?: TestPath) => { if (path) this.rects.push(...path.rects) },
    fillRect: (...args: number[]) => this.rects.push(args),
  }
  getContext() { return this.g }
  remove() {}
}

let frames: Map<number, FrameRequestCallback>
let nextFrame: number
let visualizers: Visualizer[]
let doc: { hidden: boolean; hasFocus(): boolean; addEventListener(): void; removeEventListener(): void; querySelector(): unknown }
const globals = ['document', 'window', 'Path2D', 'matchMedia', 'requestAnimationFrame', 'cancelAnimationFrame']
const original = new Map(globals.map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]))

beforeEach(() => {
  frames = new Map()
  nextFrame = 0
  visualizers = []
  const list = { getBoundingClientRect: () => ({ left: 200, right: 800 }) }
  const view = { offsetWidth: 1000, getBoundingClientRect: () => ({ left: 0, right: 1000, width: 1000 }), querySelector: () => list }
  doc = { hidden: false, hasFocus: () => true, addEventListener() {}, removeEventListener() {}, querySelector: () => view }
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

test('stereo setting survives normalization and old settings keep the combined view', () => {
  expect(normalize({ vizStereo: true }).vizStereo).toBe(true)
  expect(normalize({}).vizStereo).toBe(false)
  expect(normalize({ vizStereo: 'true' }).vizStereo).toBe(false)
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

test('wakes on channel activity even when the combined spectrum cancels', async () => {
  const f = fixture({ vizStereo: true })
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
