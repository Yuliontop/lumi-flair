/**
 * Print the instructions the AI receives ({{flair_tags}}), for any set of settings.
 *
 *   bun run build && bun dev/tools/prompt.ts              # sound effects on, everything else default
 *   bun dev/tools/prompt.ts sfx=false textEffects=false   # override any pref
 *
 * Loads the built dist/backend.js with a stand-in `spindle` and sends it the same
 * "prefs" message the frontend sends, so what you read is what the model gets.
 */
import { join, resolve } from 'node:path'

const root = resolve(import.meta.dir, '../..')
const macros: Record<string, string> = {}
let onFrontend: ((msg: unknown, userId: string) => unknown) | null = null

// Anything the backend calls at load time that we don't care about resolves to a harmless stand-in.
const quiet: any = new Proxy(function () {}, { get: (_t, k) => (k === 'then' ? undefined : quiet), apply: () => quiet })
/** An object whose unlisted members fall back to the stand-in. */
const withQuiet = (o: Record<string, unknown>) => new Proxy(o, { get: (t, k: string) => (k in t ? t[k] : quiet) })
;(globalThis as any).spindle = withQuiet({
  registerMacro: () => {},
  updateMacroValue: (name: string, value: string) => (macros[name] = value),
  onFrontendMessage: (fn: typeof onFrontend) => (onFrontend = fn),
  permissions: withQuiet({ has: () => false }),
  frontendCapabilities: withQuiet({ declare: () => () => {} }),
  log: withQuiet({}),
})

await import(join(root, 'dist/backend.js'))

const prefs: Record<string, unknown> = { type: 'prefs', frequency: 'every', textEffects: false, aiEffects: false, sceneDirector: false, choices: false, sfx: true, autoInject: true, disabledFx: [] }
for (const arg of process.argv.slice(2)) {
  const [k, v] = arg.split('=')
  prefs[k] = v === 'true' ? true : v === 'false' ? false : v
}
await onFrontend?.(prefs, 'dev-user')
const text = macros['flair_tags'] ?? ''
console.log(text || '(empty: nothing is taught to the AI with these settings)')
console.log(`\n${text.length} characters, about ${Math.round(text.length / 4)} tokens`)
