/**
 * The user's own sound files. Stored in this browser (IndexedDB), never
 * uploaded anywhere: audio can be large, and the browser's own storage keeps
 * playback instant and offline. Which file plays where (the "slots") is a
 * normal synced setting; a slot whose file isn't in this browser simply falls
 * back to the generated sound.
 */

export interface SoundMeta {
  id: string
  name: string
  mime: string
  size: number
  /** seconds, measured when the file was added */
  duration: number
  /** loudness trim, 0 – 1.5 */
  level: number
  at: number
}

/** Where a custom sound can be used. */
export type SoundSlot = string // 'always' | `scene:${Scene}` | `light:${Light}` | `ui:${Chime}`

export const MAX_SOUND_BYTES = 40 * 1024 * 1024
export const MAX_SOUNDS = 40
export const SOUND_ACCEPT = ['audio/*', '.mp3', '.ogg', '.oga', '.opus', '.wav', '.m4a', '.aac', '.flac', '.webm']
/** Files up to this long are decoded once (seamless loops, instant replays); longer ones stream. */
const DECODE_SECONDS = 90
/** Memory budget for decoded files kept around. */
const DECODED_BUDGET = 160 * 1024 * 1024

const DB_NAME = 'lumi_flair_sounds'
const META = 'meta'
const DATA = 'data'

function req<T>(r: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    r.onsuccess = () => resolve(r.result)
    r.onerror = () => reject(r.error)
  })
}

function done(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error ?? new Error('aborted'))
  })
}

function newId() {
  return 'snd_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

/** Strip the extension and tidy a file name for display. */
export function soundName(file: string): string {
  const base = file.replace(/\.[a-z0-9]{2,5}$/i, '').replace(/[_]+/g, ' ').trim()
  return (base || 'Sound').slice(0, 60)
}

export type AudioSource = { kind: 'buffer'; buffer: AudioBuffer; level: number } | { kind: 'url'; url: string; level: number }

export class SoundLibrary {
  private db: IDBDatabase | null = null
  private items = new Map<string, SoundMeta>()
  /** Fallback when IndexedDB is unavailable (private windows): this session only. */
  private memory = new Map<string, Blob>()
  private persistent = true
  private urls = new Map<string, string>()
  private buffers = new Map<string, AudioBuffer>()
  private listeners = new Set<() => void>()
  readonly ready: Promise<void>

  constructor() {
    this.ready = this.open().catch((err) => {
      console.warn('[Lumi Flair] Sound library is session-only (browser storage unavailable)', err)
      this.persistent = false
    })
  }

  /** False when files can only be kept until the page is closed. */
  get saved() {
    return this.persistent
  }

  private async open() {
    if (typeof indexedDB === 'undefined') throw new Error('no indexedDB')
    const open = indexedDB.open(DB_NAME, 1)
    open.onupgradeneeded = () => {
      const db = open.result
      if (!db.objectStoreNames.contains(META)) db.createObjectStore(META, { keyPath: 'id' })
      if (!db.objectStoreNames.contains(DATA)) db.createObjectStore(DATA)
    }
    this.db = await req(open)
    const all = (await req(this.db.transaction(META).objectStore(META).getAll())) as SoundMeta[]
    for (const m of all) if (m && typeof m.id === 'string') this.items.set(m.id, m)
    this.emit()
  }

  onChange(fn: () => void) {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }

  private emit() {
    for (const fn of this.listeners) {
      try {
        fn()
      } catch (err) {
        console.error('[Lumi Flair] sound library listener failed', err)
      }
    }
  }

  list(): SoundMeta[] {
    return [...this.items.values()].sort((a, b) => a.at - b.at)
  }

  has(id: string | undefined | null): id is string {
    return !!id && this.items.has(id)
  }

  meta(id: string) {
    return this.items.get(id)
  }

  get count() {
    return this.items.size
  }

  /** Measure the file by decoding it (also proves the browser can play it). */
  private async probe(bytes: Uint8Array): Promise<number> {
    const Ctor = window.OfflineAudioContext || (window as unknown as { webkitOfflineAudioContext?: typeof OfflineAudioContext }).webkitOfflineAudioContext
    if (!Ctor) return 0
    const ac = new Ctor(1, 1, 22050)
    const copy = bytes.slice().buffer as ArrayBuffer
    const buf = await ac.decodeAudioData(copy)
    return buf.duration
  }

  /** Add a picked file. Throws a readable Error if the browser can't play it or storage is full. */
  async add(file: { name: string; mimeType: string; bytes: Uint8Array; sizeBytes?: number }): Promise<SoundMeta> {
    await this.ready
    if (this.items.size >= MAX_SOUNDS) throw new Error(`You can keep up to ${MAX_SOUNDS} sounds — delete one first.`)
    const size = file.sizeBytes ?? file.bytes.byteLength
    if (size > MAX_SOUND_BYTES) throw new Error(`“${file.name}” is larger than ${MAX_SOUND_BYTES / 1024 / 1024} MB.`)
    let duration = 0
    try {
      duration = await this.probe(file.bytes)
    } catch {
      throw new Error(`“${file.name}” isn't an audio file this browser can play.`)
    }
    const mime = file.mimeType && file.mimeType !== 'application/octet-stream' ? file.mimeType : 'audio/mpeg'
    const meta: SoundMeta = { id: newId(), name: soundName(file.name), mime, size, duration: Math.round(duration * 10) / 10, level: 1, at: Date.now() }
    const blob = new Blob([file.bytes.slice().buffer as ArrayBuffer], { type: mime })
    if (this.db) {
      try {
        const tx = this.db.transaction([META, DATA], 'readwrite')
        tx.objectStore(DATA).put(blob, meta.id)
        tx.objectStore(META).put(meta)
        await done(tx)
      } catch (err) {
        const quota = err instanceof DOMException && err.name === 'QuotaExceededError'
        throw new Error(quota ? 'The browser is out of storage space for sounds — delete some first.' : `Couldn't save “${file.name}”.`)
      }
    } else this.memory.set(meta.id, blob)
    this.items.set(meta.id, meta)
    this.emit()
    return meta
  }

  async remove(id: string) {
    await this.ready
    if (this.db) {
      const tx = this.db.transaction([META, DATA], 'readwrite')
      tx.objectStore(DATA).delete(id)
      tx.objectStore(META).delete(id)
      await done(tx).catch(() => {})
    }
    this.memory.delete(id)
    this.items.delete(id)
    this.buffers.delete(id)
    const url = this.urls.get(id)
    if (url) URL.revokeObjectURL(url)
    this.urls.delete(id)
    this.emit()
  }

  async update(id: string, patch: Partial<Pick<SoundMeta, 'name' | 'level'>>) {
    const m = this.items.get(id)
    if (!m) return
    const next: SoundMeta = {
      ...m,
      ...(patch.name !== undefined ? { name: patch.name.trim().slice(0, 60) || m.name } : {}),
      ...(patch.level !== undefined ? { level: Math.max(0, Math.min(1.5, patch.level)) } : {}),
    }
    this.items.set(id, next)
    if (this.db) {
      const tx = this.db.transaction(META, 'readwrite')
      tx.objectStore(META).put(next)
      await done(tx).catch(() => {})
    }
    this.emit()
  }

  private async blob(id: string): Promise<Blob | null> {
    await this.ready
    const mem = this.memory.get(id)
    if (mem) return mem
    if (!this.db) return null
    const b = (await req(this.db.transaction(DATA).objectStore(DATA).get(id)).catch(() => null)) as Blob | null
    return b ?? null
  }

  /** An object URL for the file (kept for the session). */
  async url(id: string): Promise<string | null> {
    const have = this.urls.get(id)
    if (have) return have
    const b = await this.blob(id)
    if (!b) return null
    const u = URL.createObjectURL(b)
    this.urls.set(id, u)
    return u
  }

  /**
   * How to play a file: small files are decoded once (seamless loops, instant
   * replays); large ones stream from the stored file so they don't fill memory.
   */
  async source(id: string, ac: BaseAudioContext): Promise<AudioSource | null> {
    const m = this.items.get(id)
    if (!m) return null
    const cached = this.buffers.get(id)
    if (cached) return { kind: 'buffer', buffer: cached, level: m.level }
    if (m.duration > 0 && m.duration <= DECODE_SECONDS) {
      const b = await this.blob(id)
      if (!b) return null
      try {
        const buffer = await ac.decodeAudioData(await b.arrayBuffer())
        this.remember(id, buffer)
        return { kind: 'buffer', buffer, level: m.level }
      } catch {
        return null
      }
    }
    const url = await this.url(id)
    return url ? { kind: 'url', url, level: m.level } : null
  }

  /** Keep recently used decoded files around, within a memory budget (most recent last). */
  private remember(id: string, buffer: AudioBuffer) {
    this.buffers.delete(id)
    this.buffers.set(id, buffer)
    const bytes = (b: AudioBuffer) => b.length * b.numberOfChannels * 4
    let total = 0
    for (const b of this.buffers.values()) total += bytes(b)
    while (total > DECODED_BUDGET && this.buffers.size > 1) {
      const oldest = this.buffers.keys().next().value
      if (oldest === undefined) break
      total -= bytes(this.buffers.get(oldest)!)
      this.buffers.delete(oldest)
    }
  }

  destroy() {
    for (const u of this.urls.values()) URL.revokeObjectURL(u)
    this.urls.clear()
    this.buffers.clear()
    this.listeners.clear()
    this.db?.close()
    this.db = null
  }
}
