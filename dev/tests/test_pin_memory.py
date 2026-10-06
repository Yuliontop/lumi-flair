"""Saving pins to Lumiverse's memory (optional, needs the `memories` permission).

Two halves. The backend half loads the built dist/backend.js against a stand-in memory API that behaves like
Lumiverse's (find an entity by name, upsert, add facts that skip duplicates and can never be removed) and
checks what it asks of it. The page half checks when the page asks the backend to save, and what the panel says.

Run from the repo root with the mock server up (see dev/README.md):
    python dev/run.py test_pin_memory.py
"""
import os, subprocess, json
BASE = os.environ.get("LF_BASE", "http://localhost:8765")
ROOT = os.path.join(os.path.dirname(__file__), '..', '..')
import asyncio
from playwright.async_api import async_playwright

errs = []

def expect(label, got, want):
    ok = got == want
    print(f"{'ok ' if ok else 'BAD'} {label}: {got}" + ('' if ok else f'  (wanted {want})'))
    if not ok: errs.append(f'{label}: got {got}, wanted {want}')

# ───────────────────────── backend ─────────────────────────
def backend():
    print('== backend: what it asks Lumiverse\'s memory to do ==')
    run = subprocess.run(['bun', os.path.join('dev', 'tests', 'pin_memory_backend.ts')], cwd=ROOT, capture_output=True, text=True, encoding='utf-8', shell=(os.name == 'nt'))
    if run.returncode != 0:
        errs.append('backend script failed: ' + run.stderr[-400:]); print(run.stderr[-600:]); return
    o = json.loads(run.stdout.strip().splitlines()[-1])
    r = lambda k: o[k]['reply']
    expect('without the permission: refused, nothing touched', [r('noPermission')['ok'], r('noPermission')['reason'], o['noPermission']['calls']], [False, 'memories not granted', []])
    expect('saves three facts (two for Hazel, one for Bob); the unnamed and the empty ones are skipped', [r('basic')['ok'], r('basic')['saved']], [True, 3])
    expect('the reply carries the request id', r('basic')['req'], 7)
    expect('a missing entity is created as a character, once each', [c for c in o['basic']['calls'] if c.startswith('upsert')], ['upsert c1 Hazel character 1 as u1', 'upsert c1 Bob character 1 as u1'])
    expect('...for the right user', all(c.endswith('as u1') for c in o['basic']['calls']), True)
    expect('the fact says who and quotes the line', o['hazelFacts'][0], 'Hazel said this, and the reader pinned it as a favourite moment: “first line”')
    expect('no entity for the empty one', o['noEve'], True)
    expect('an entity Lumiverse already has is used, not created again (name in another case)', [c for c in o['again']['calls'] if c.startswith('upsert')], [])
    expect('a fact it already has is not added twice', o['hazelFactsAfter'], 2)
    expect('another chat has its own entity', o['twoHazels'], 2)
    expect('long text is cut and whitespace collapsed', [len(o['longFact']) <= 200 + 70, '\n' not in o['longFact'], o['longFact'].endswith('”'), o['longFact'].endswith(' ”')], [True, True, True, False])
    expect('a failure is reported, not thrown', [r('failure')['ok'], r('failure')['reason']], [False, 'memory is busy'])
    expect('no chat: refused', [r('badChat')['ok'], r('badChat')['reason']], [False, 'no chat'])
    expect('junk items: nothing saved, nothing touched', [[r(k)['ok'], r(k)['saved'], o[k]['calls']] for k in ('badItems', 'badItems2')], [[True, 0, []], [True, 0, []]])
    expect('at most 60 pins in one request', [r('many')['saved'], o['manyEntities']], [60, 60])

# ───────────────────────── page ─────────────────────────
SEED = lambda extra: "if(!sessionStorage.x){sessionStorage.x=1; localStorage.setItem('lumi_flair:vault:settings', JSON.stringify({at:1,data:Object.assign({welcomed:true}, %s)}))}" % json.dumps(extra)
STAR = lambda mid: f"document.querySelector(\"[data-message-id='{mid}'] .lf-pin-btn\")"
MEMSENT = "window.__sent.filter(m=>m.type==='pin_memory')"
NOTE = "(()=>{const sec=[...document.querySelectorAll('details')].find(d=>d.querySelector('.lf-pin-list')); const hs=[...sec.querySelectorAll('.lf-hint')]; const h=hs.at(-1); return h.style.display==='none' ? null : h.textContent})()"
SWITCH = "document.querySelector('[role=switch][aria-label=\"Save pins to Lumiverse memory\"]')"

async def boot(b, settings, granted, size=(1280, 900)):
    ctx = await b.new_context(viewport={'width': size[0], 'height': size[1]})
    pg = await ctx.new_page()
    pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: m.type == 'error' and errs.append(m.text))
    await pg.add_init_script(SEED(settings) + f"window.__granted={json.dumps(granted)};")
    await pg.goto(BASE + '/lumiverse.html'); await pg.wait_for_function('window.__ready===true'); await pg.wait_for_timeout(700)
    return ctx, pg

async def page(b):
    print('== page: on, with the permission ==')
    ctx, pg = await boot(b, {'pinMemory': True}, ['memories'])
    await pg.evaluate(f"{STAR('m1')}.click()"); await pg.wait_for_timeout(500)
    sent = await pg.evaluate(MEMSENT)
    expect('pinning sends one request', len(sent), 1)
    expect('for this chat, the speaker and the line', [sent[0]['chatId'], [(i['who'], i['text'][:12]) for i in sent[0]['items']]], ['c1', [('Hazel', 'She leaned c')]])
    expect('the line is short (a few tokens)', len(sent[0]['items'][0]['text']) <= 161, True)
    expect('the panel says it was saved', await pg.evaluate(NOTE), 'Saved to Lumiverse memory.')
    await pg.evaluate(f"{STAR('m1')}.click()"); await pg.wait_for_timeout(400)
    expect('unpinning sends nothing', len(await pg.evaluate(MEMSENT)), 1)
    await pg.evaluate(f"{STAR('m2')}.click()"); await pg.wait_for_timeout(400)
    expect('your own message has no name on the page: nothing is sent', len(await pg.evaluate(MEMSENT)), 1)
    expect('...and the panel says why', await pg.evaluate(NOTE), 'Nothing to save: those pins have no speaker name.')
    await pg.evaluate(f"{STAR('m4')}.click()"); await pg.wait_for_timeout(500)
    expect('a second pin sends a second request', len(await pg.evaluate(MEMSENT)), 2)
    await pg.evaluate("[...document.querySelectorAll('button')].find(b=>b.textContent.includes('Save this chat’s pins to memory')).click()"); await pg.wait_for_timeout(500)
    sent = await pg.evaluate(MEMSENT)
    expect('"Save this chat\'s pins" sends every named pin at once (yours has no name, so it is left out)', [len(sent), [i['who'] for i in sent[-1]['items']]], [3, ['Hazel']])
    await pg.evaluate("window.__memFail=true")
    await pg.evaluate(f"{STAR('m3')}.click()"); await pg.wait_for_timeout(500)
    expect('a failed save is told plainly', await pg.evaluate(NOTE), 'Couldn’t save to Lumiverse memory.')
    await ctx.close()

    print('== page: off ==')
    ctx, pg = await boot(b, {}, ['memories'])
    await pg.evaluate(f"{STAR('m1')}.click()"); await pg.wait_for_timeout(500)
    expect('the switch is off by default: nothing is sent', len(await pg.evaluate(MEMSENT)), 0)
    expect('the panel has nothing to report', await pg.evaluate(NOTE), None)
    await ctx.close()

    print('== page: on, but the permission is gone ==')
    ctx, pg = await boot(b, {'pinMemory': True}, [])
    await pg.evaluate(f"{STAR('m1')}.click()"); await pg.wait_for_timeout(500)
    expect('nothing is sent', len(await pg.evaluate(MEMSENT)), 0)
    expect('the pin itself is still saved', await pg.evaluate("JSON.parse(localStorage.getItem('lumi_flair:vault:moments')).data.c1.length"), 1)
    expect('a button offers to allow it', await pg.evaluate("[...document.querySelectorAll('button')].find(b=>b.textContent==='Allow memory access').style.display!=='none'"), True)
    await pg.evaluate("[...document.querySelectorAll('button')].find(b=>b.textContent==='Allow memory access').click()"); await pg.wait_for_timeout(500)
    expect('it asks for the memories permission', await pg.evaluate("window.__granted"), ['memories'])
    expect('and the button goes away', await pg.evaluate("[...document.querySelectorAll('button')].find(b=>b.textContent==='Allow memory access').style.display"), 'none')
    await ctx.close()

    print('== page: turning the switch on asks for the permission ==')
    ctx, pg = await boot(b, {}, [])
    await pg.evaluate(f"{SWITCH}.click()"); await pg.wait_for_timeout(600)
    expect('asked for it', await pg.evaluate("window.__granted"), ['memories'])
    expect('switch is on and remembered', await pg.evaluate("JSON.parse(localStorage.getItem('lumi_flair:vault:settings')).data.pinMemory"), True)
    await pg.evaluate(f"{STAR('m1')}.click()"); await pg.wait_for_timeout(500)
    expect('and the next pin is saved', len(await pg.evaluate(MEMSENT)), 1)
    await ctx.close()

    print('== page: the backfill button asks for the permission too ==')
    ctx, pg = await boot(b, {}, [])
    await pg.evaluate(f"{STAR('m1')}.click()"); await pg.wait_for_timeout(400)
    await pg.evaluate("[...document.querySelectorAll('button')].find(b=>b.textContent.includes('Save this chat’s pins to memory')).click()"); await pg.wait_for_timeout(700)
    expect('permission asked, pins sent', [await pg.evaluate("window.__granted"), len(await pg.evaluate(MEMSENT))], [['memories'], 1])
    await ctx.close()

async def main():
    backend()
    async with async_playwright() as p:
        b = await p.chromium.launch()
        await page(b)
        await b.close()
    print('errors', errs)
asyncio.run(main())
