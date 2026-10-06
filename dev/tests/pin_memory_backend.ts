/**
 * Backend half of test_pin_memory.py: loads the built dist/backend.js with a stand-in `spindle` whose memory
 * API behaves like Lumiverse's (find an entity by name, upsert, add facts that skip duplicates and can never
 * be removed), sends it "pin_memory" messages, and prints what happened as one JSON object.
 *
 *   bun dev/tests/pin_memory_backend.ts
 */
import { join, resolve } from 'node:path'

const root = resolve(import.meta.dir, '../..')
type Entity = { id: string; name: string; type: string; facts: string[] }
const entities = new Map<string, Entity>() // `${chatId}|${name.toLowerCase()}`
const calls: string[] = []
const sent: any[] = []
let granted = true
let failNext = false
let onFrontend: ((msg: unknown, userId: string) => unknown) | null = null
let nextId = 1

const quiet: any = new Proxy(function () {}, { get: (_t, k) => (k === 'then' ? undefined : quiet), apply: () => quiet })
const withQuiet = (o: Record<string, unknown>) => new Proxy(o, { get: (t, k: string) => (k in t ? t[k] : quiet) })
const byId = (id: string) => [...entities.values()].find((e) => e.id === id)!

;(globalThis as any).spindle = withQuiet({
  registerMacro: () => {},
  updateMacroValue: () => {},
  onFrontendMessage: (fn: typeof onFrontend) => (onFrontend = fn),
  sendToFrontend: (m: unknown) => sent.push(m),
  permissions: withQuiet({ has: (p: string) => (p === 'memories' ? granted : false) }),
  frontendCapabilities: withQuiet({ declare: () => () => {} }),
  log: withQuiet({ warn: () => {} }),
  memories: {
    entities: {
      async findByName(chatId: string, name: string, userId?: string) {
        calls.push(`find ${chatId} ${name} as ${userId}`)
        return entities.get(`${chatId}|${name.toLowerCase()}`) ?? null
      },
      async upsert(chatId: string, e: { name: string; type: string; confidence?: number }, opts?: { userId?: string }) {
        calls.push(`upsert ${chatId} ${e.name} ${e.type} ${e.confidence} as ${opts?.userId}`)
        const made = { id: `e${nextId++}`, name: e.name, type: e.type, facts: [] }
        entities.set(`${chatId}|${e.name.toLowerCase()}`, made)
        return made
      },
      async addFacts(id: string, facts: string[], userId?: string) {
        calls.push(`addFacts ${byId(id).name} x${facts.length} as ${userId}`)
        if (failNext) {
          failNext = false
          throw new Error('memory is busy')
        }
        const e = byId(id)
        for (const f of facts) if (!e.facts.some((x) => x.toLowerCase() === f.toLowerCase())) e.facts.push(f)
        return e
      },
    },
  },
})

await import(join(root, 'dist/backend.js'))

async function send(msg: Record<string, unknown>) {
  sent.length = 0
  calls.length = 0
  await onFrontend?.({ type: 'pin_memory', req: 7, ...msg }, 'u1')
  return { reply: sent.find((m) => m.type === 'pin_memory_result') ?? null, calls: [...calls] }
}

const out: Record<string, unknown> = {}

granted = false
out.noPermission = await send({ chatId: 'c1', items: [{ who: 'Hazel', text: 'a line' }] })
granted = true

out.basic = await send({ chatId: 'c1', items: [{ who: 'Hazel', text: 'first line' }, { who: 'Hazel', text: 'second line' }, { who: 'Bob', text: 'bob line' }, { who: '', text: 'nobody said this' }, { who: 'Eve', text: '   ' }] })
out.hazelFacts = entities.get('c1|hazel')?.facts
out.bobFacts = entities.get('c1|bob')?.facts
out.noEve = !entities.has('c1|eve')

out.again = await send({ chatId: 'c1', items: [{ who: 'hazel', text: 'first line' }] }) // another case, same fact: found, not duplicated
out.hazelFactsAfter = entities.get('c1|hazel')?.facts.length

out.otherChat = await send({ chatId: 'c2', items: [{ who: 'Hazel', text: 'first line' }] })
out.twoHazels = [...entities.keys()].filter((k) => k.endsWith('|hazel')).length

out.long = await send({ chatId: 'c3', items: [{ who: 'Hazel', text: `${'word '.repeat(100)}\n\nnew   line` }] })
out.longFact = entities.get('c3|hazel')?.facts[0]

failNext = true
out.failure = await send({ chatId: 'c4', items: [{ who: 'Hazel', text: 'x' }] })

out.badChat = await send({ items: [{ who: 'Hazel', text: 'x' }] })
out.badItems = await send({ chatId: 'c5', items: 'nope' })
out.badItems2 = await send({ chatId: 'c5', items: [null, 3, { who: 7, text: 8 }] })

const many = Array.from({ length: 200 }, (_, i) => ({ who: `Person ${i}`, text: 'hi' }))
out.many = await send({ chatId: 'c6', items: many })
out.manyEntities = [...entities.keys()].filter((k) => k.startsWith('c6|')).length

console.log(JSON.stringify(out))
