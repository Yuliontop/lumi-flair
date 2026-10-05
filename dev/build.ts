/**
 * Dev build: bundles the extension plus the test-page entries into dev/mock/build/.
 *
 *   bun dev/build.ts                       # extension (dist/) + all test bundles
 *   bun dev/build.ts --baseline ../old-src # also bundle another checkout's effects.ts as the benchmark baseline
 *
 * The extension itself is still built with the two `bun build` commands in CLAUDE.md;
 * this script runs those too so dist/ and the test pages never drift apart.
 */
import { existsSync, mkdirSync, rmSync } from 'node:fs'
import { join, resolve } from 'node:path'

const root = resolve(import.meta.dir, '..')
const out = join(root, 'dev/mock/build')
mkdirSync(out, { recursive: true })

async function bundle(entry: string, outfile: string, target: 'browser' | 'bun' = 'browser') {
  const res = await Bun.build({ entrypoints: [join(root, entry)], target, minify: false })
  if (!res.success) {
    for (const log of res.logs) console.error(log)
    throw new Error(`build failed: ${entry}`)
  }
  await Bun.write(outfile, res.outputs[0])
  console.log(`  ${entry} -> ${outfile.replace(root + '/', '').replace(root + '\\', '')}`)
}

console.log('Extension:')
await bundle('src/frontend.ts', join(root, 'dist/frontend.js'))
await bundle('src/backend.ts', join(root, 'dist/backend.js'), 'bun')

console.log('Test pages:')
await Bun.write(join(out, 'frontend.js'), Bun.file(join(root, 'dist/frontend.js')))
await bundle('dev/entries/effects-entry.ts', join(out, 'effects.js'))
await bundle('dev/entries/nav-entry.ts', join(out, 'nav.js'))
await bundle('dev/entries/scape-entry.ts', join(out, 'scape.js'))
await bundle('dev/entries/sfx-entry.ts', join(out, 'sfx.js'))
await bundle('dev/entries/bench-entry.ts', join(out, 'bench.js'))
await bundle('dev/entries/cine-entry.ts', join(out, 'cine.js'))

const i = process.argv.indexOf('--baseline')
const base = join(out, 'bench-base.js')
const cineBase = join(out, 'cine-base.js')
if (i > 0 && process.argv[i + 1]) {
  const dir = resolve(process.argv[i + 1])
  const effects = join(dir, 'src/effects.ts')
  if (!existsSync(effects)) throw new Error(`no src/effects.ts in ${dir}`)
  const tmp = join(out, '_baseline-entry.ts')
  await Bun.write(tmp, `import { FxCanvas, playSendEffect } from ${JSON.stringify(effects.replace(/\\/g, '/'))}\n;(window as any).B_OLD = { FxCanvas, playSendEffect }\n`)
  await bundle(tmp.replace(root + '/', '').replace(root + '\\', ''), base)
  rmSync(tmp)
  // The cinematic layer (light rays and the rest) from the same checkout, for the old-vs-new comparison page (cine.html).
  const cine = join(dir, 'src/cinematic.ts')
  if (existsSync(cine)) {
    await Bun.write(tmp, `import { Cinematic, CINEMATIC_CSS } from ${JSON.stringify(cine.replace(/\\/g, '/'))}\n;(window as any).C_OLD = { Cinematic, CINEMATIC_CSS }\n`)
    await bundle(tmp.replace(root + '/', '').replace(root + '\\', ''), cineBase)
    rmSync(tmp)
  }
} else {
  if (existsSync(base)) rmSync(base)
  if (existsSync(cineBase)) rmSync(cineBase)
}
console.log('Done.')
