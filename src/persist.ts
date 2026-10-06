/**
 * Auto-save vault. Every saved blob (settings, achievements, heartbeat) is
 * written to three places at once, each stamped with a save time:
 *
 *   1. Lumiverse account settings (`ctx.settings`, key `flair:<name>`) —
 *      follows the user to every device and survives reinstalling Flair.
 *   2. A real JSON config file written by the backend with per-user storage:
 *      `data/users/<you>/extensions/lumi_flair/<name>.json`. Human-readable,
 *      easy to back up, and outside the extension folder so removing or
 *      re-importing the extension does not delete it.
 *   3. This browser's localStorage — instant, works even if the server is busy.
 *
 * On load all three are read and the newest copy wins; stale or missing
 * copies are healed automatically. A layer that could not be read is never
 * written over until it has been read (so defaults can never clobber a good
 * config file that was merely slow to answer).
 */
import type { SpindleFrontendContext } from 'lumiverse-spindle-types'

export const VAULT_NAMES = ['settings', 'achievements', 'heartbeat', 'moments'] as const
export type VaultName = (typeof VAULT_NAMES)[number]

interface Envelope<T = unknown> {
  at: number
  data: T
}

type Layer = 'account' | 'file' | 'browser'
export type LayerState = 'unknown' | 'ok' | 'error' | 'unavailable'
export interface VaultStatus {
  saving: boolean
  lastSavedAt: number
  layers: Record<Layer, LayerState>
}

const LOCAL_PREFIX = 'lumi_flair:vault:'
const FILE_TIMEOUT = 3000

function envelope(raw: unknown): Envelope | undefined {
  if (raw === undefined || raw === null) return undefined
  if (typeof raw === 'object' && !Array.isArray(raw) && 'at' in raw && 'data' in raw) {
    const at = Number((raw as Envelope).at)
    return { at: Number.isFinite(at) ? at : 0, data: (raw as Envelope).data }
  }
  // Un-stamped legacy value: treat as oldest.
  return { at: 0, data: raw }
}

function newest(...items: Array<Envelope | undefined>): Envelope | undefined {
  let best: Envelope | undefined
  for (const it of items) if (it && (!best || it.at > best.at)) best = it
  return best
}

export class Vault {
  private canWrite: Record<Layer, boolean> = { account: false, file: false, browser: true }
  /** Set once loadAll() has read every layer. */
  private loaded = false
  private current = new Map<VaultName, Envelope>()
  private req = 0
  private pendingLoads = new Map<number, (files: Record<string, unknown> | null) => void>()
  private pendingSaves = new Map<VaultName, ReturnType<typeof setTimeout>>()
  private listeners = new Set<(s: VaultStatus) => void>()
  private st: VaultStatus = {
    saving: false,
    lastSavedAt: 0,
    layers: { account: 'unknown', file: 'unknown', browser: 'unknown' },
  }
  /** Called when a slower layer (the config file) turns out to hold newer data after boot. */
  onLateNewer: ((name: VaultName, data: unknown) => void) | null = null

  constructor(private ctx: SpindleFrontendContext) {}

  get status(): VaultStatus {
    return { ...this.st, layers: { ...this.st.layers } }
  }

  onStatus(fn: (s: VaultStatus) => void) {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }

  private emit() {
    const s = this.status
    for (const fn of this.listeners) {
      try {
        fn(s)
      } catch {
        /* ignore */
      }
    }
  }

  private setLayer(layer: Layer, state: LayerState) {
    if (this.st.layers[layer] === state) return
    this.st.layers[layer] = state
    this.emit()
  }

  /** Feed backend messages here; returns true when the message was for the vault. */
  handleBackend(raw: unknown): boolean {
    const msg = raw as { type?: string; req?: number; files?: Record<string, unknown>; name?: VaultName; at?: number; reason?: string }
    if (msg?.type === 'vault_data' && typeof msg.req === 'number') {
      const resolve = this.pendingLoads.get(msg.req)
      if (resolve) {
        this.pendingLoads.delete(msg.req)
        resolve(msg.files ?? {})
      } else {
        // Late answer after the boot timeout: adopt anything newer.
        this.canWrite.file = true
        this.setLayer('file', 'ok')
        for (const name of VAULT_NAMES) {
          const e = envelope(msg.files?.[name])
          const cur = this.current.get(name)
          if (e && (!cur || e.at > cur.at)) {
            this.current.set(name, e)
            this.writeBrowser(name, e)
            this.writeAccount(name, e)
            this.onLateNewer?.(name, e.data)
          } else if (cur) {
            this.writeFile(name, cur)
          }
        }
      }
      return true
    }
    if (msg?.type === 'vault_saved') {
      if (msg.name) {
        const t = this.pendingSaves.get(msg.name)
        if (t) clearTimeout(t)
        this.pendingSaves.delete(msg.name)
      }
      this.setLayer('file', 'ok')
      this.settle()
      return true
    }
    if (msg?.type === 'vault_error') {
      if (msg.name) {
        const t = this.pendingSaves.get(msg.name)
        if (t) clearTimeout(t)
        this.pendingSaves.delete(msg.name)
      }
      console.warn('[Lumi Flair] Could not write config file:', msg.reason)
      this.setLayer('file', 'error')
      this.settle()
      return true
    }
    return false
  }

  private requestFiles(): Promise<Record<string, unknown> | null> {
    const id = ++this.req
    return new Promise((resolve) => {
      this.pendingLoads.set(id, resolve)
      try {
        this.ctx.sendToBackend({ type: 'vault_load', req: id, names: [...VAULT_NAMES] })
      } catch {
        this.pendingLoads.delete(id)
        resolve(null)
        return
      }
      setTimeout(() => {
        if (this.pendingLoads.delete(id)) resolve(null)
      }, FILE_TIMEOUT)
    })
  }

  /** Backend may still be starting: ask again a few times; answers land in handleBackend(). */
  private retryFiles(left: number) {
    setTimeout(() => {
      if (this.canWrite.file || this.disposed) return
      try {
        this.ctx.sendToBackend({ type: 'vault_load', req: ++this.req, names: [...VAULT_NAMES] })
      } catch {
        /* ignore */
      }
      if (left > 1) this.retryFiles(left - 1)
    }, 4000)
  }

  private disposed = false
  dispose() {
    this.disposed = true
    for (const t of this.pendingSaves.values()) clearTimeout(t)
    this.pendingSaves.clear()
    this.listeners.clear()
  }

  private readBrowser(name: VaultName): Envelope | undefined {
    try {
      const raw = localStorage.getItem(LOCAL_PREFIX + name)
      this.setLayer('browser', 'ok')
      return raw ? envelope(JSON.parse(raw)) : undefined
    } catch {
      this.setLayer('browser', 'unavailable')
      return undefined
    }
  }

  private async readAccount(name: VaultName): Promise<Envelope | undefined> {
    if (!this.ctx.settings) {
      this.setLayer('account', 'unavailable')
      return undefined
    }
    try {
      const v = await this.ctx.settings.get<unknown>(`flair:${name}`)
      this.canWrite.account = true
      this.setLayer('account', 'ok')
      return envelope(v)
    } catch (err) {
      console.warn('[Lumi Flair] Could not read account settings', err)
      this.setLayer('account', 'error')
      return undefined
    }
  }

  /** Load every blob at once; resolves with the newest copy of each (or undefined). */
  async loadAll(): Promise<Partial<Record<VaultName, unknown>>> {
    const filesP = this.requestFiles()
    const account = await Promise.all(VAULT_NAMES.map((n) => this.readAccount(n)))
    const files = await filesP
    if (files) {
      this.canWrite.file = true
      this.setLayer('file', 'ok')
    } else {
      // Backend didn't answer in time (or isn't running). Don't overwrite the
      // file until we've seen it — handleBackend() adopts a late answer.
      this.setLayer('file', 'unknown')
      this.retryFiles(5)
    }
    const out: Partial<Record<VaultName, unknown>> = {}
    VAULT_NAMES.forEach((name, i) => {
      const fromAccount = account[i]
      const fromFile = files ? envelope(files[name]) : undefined
      const fromBrowser = this.readBrowser(name)
      const best = newest(fromAccount, fromFile, fromBrowser)
      if (!best) return
      this.current.set(name, best)
      out[name] = best.data
      // Heal any layer that is missing or older than the winner.
      if (!fromBrowser || fromBrowser.at < best.at) this.writeBrowser(name, best)
      if (this.canWrite.account && (!fromAccount || fromAccount.at < best.at)) this.writeAccount(name, best)
      if (this.canWrite.file && (!fromFile || fromFile.at < best.at)) this.writeFile(name, best)
    })
    if (this.current.size) this.st.lastSavedAt = Math.max(...[...this.current.values()].map((e) => e.at))
    this.loaded = true
    this.emit()
    return out
  }

  /** Save now to every layer. Callers debounce. */
  save(name: VaultName, data: unknown) {
    // A save is stamped "now", so it would win over every older copy: never write before they have been read.
    if (!this.loaded) {
      console.warn('[Lumi Flair] Ignored a save made before the saved copy was read')
      return
    }
    const e: Envelope = { at: Date.now(), data }
    this.current.set(name, e)
    this.st.saving = true
    this.emit()
    this.writeBrowser(name, e)
    this.writeAccount(name, e)
    this.writeFile(name, e)
    this.settle()
  }

  private writeBrowser(name: VaultName, e: Envelope) {
    try {
      localStorage.setItem(LOCAL_PREFIX + name, JSON.stringify(e))
      this.setLayer('browser', 'ok')
    } catch {
      this.setLayer('browser', 'unavailable')
    }
  }

  private accountInFlight = 0
  private writeAccount(name: VaultName, e: Envelope) {
    if (!this.ctx.settings || !this.canWrite.account) return
    this.accountInFlight++
    this.ctx.settings
      .set(`flair:${name}`, e)
      .then(() => this.setLayer('account', 'ok'))
      .catch((err) => {
        console.warn('[Lumi Flair] Could not save to account settings', err)
        this.setLayer('account', 'error')
      })
      .finally(() => {
        this.accountInFlight--
        this.settle()
      })
  }

  private writeFile(name: VaultName, e: Envelope) {
    if (!this.canWrite.file) return
    try {
      this.ctx.sendToBackend({ type: 'vault_save', name, data: e })
    } catch {
      this.setLayer('file', 'error')
      return
    }
    const prev = this.pendingSaves.get(name)
    if (prev) clearTimeout(prev)
    this.pendingSaves.set(
      name,
      setTimeout(() => {
        this.pendingSaves.delete(name)
        this.setLayer('file', 'error')
        this.settle()
      }, 6000),
    )
  }

  private settle() {
    if (this.accountInFlight > 0 || this.pendingSaves.size > 0) return
    if (this.st.saving) {
      this.st.saving = false
      const ok = Object.values(this.st.layers).some((s) => s === 'ok')
      if (ok) this.st.lastSavedAt = this.current.size ? Math.max(...[...this.current.values()].map((e) => e.at)) : Date.now()
      this.emit()
    }
  }

  /** Everything currently saved, for a downloadable backup. */
  snapshot(): Partial<Record<VaultName, unknown>> {
    const out: Partial<Record<VaultName, unknown>> = {}
    for (const [k, v] of this.current) out[k] = v.data
    return out
  }
}

// ── Backup file (download / restore) ──

export function downloadBackup(data: Partial<Record<VaultName, unknown>>, version: string) {
  const payload = { lumiFlairBackup: 1, version, exportedAt: new Date().toISOString(), ...data }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `lumi-flair-backup-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

export async function pickBackup(ctx: SpindleFrontendContext): Promise<Partial<Record<VaultName, unknown>> | null> {
  const files = await ctx.uploads.pickFile({ accept: ['.json', 'application/json'], maxSizeBytes: 4 * 1024 * 1024 })
  const f = files[0]
  if (!f) return null
  try {
    const raw = JSON.parse(new TextDecoder().decode(f.bytes)) as Record<string, unknown>
    if (!raw || typeof raw !== 'object') return null
    // Accept a full backup, or a bare settings.json config file.
    if (raw.lumiFlairBackup) {
      const out: Partial<Record<VaultName, unknown>> = {}
      for (const n of VAULT_NAMES) if (raw[n] && typeof raw[n] === 'object') out[n] = raw[n]
      return out
    }
    const e = envelope(raw)
    return e && typeof e.data === 'object' ? { settings: e.data } : null
  } catch {
    return null
  }
}
