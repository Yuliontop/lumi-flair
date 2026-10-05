"""Settings auto-save: account + vault file + browser fallback, slow/dead backend, backup/restore.

Run from the repo root with the mock server up (see dev/README.md):
    python dev/run.py test_persistence.py
"""
import os, sys
BASE = os.environ.get("LF_BASE", "http://localhost:8765")
import asyncio, json
from playwright.async_api import async_playwright
URL=BASE+'/lumiverse.html'
async def boot(pg, init=None):
    if init: await pg.add_init_script(init)
    await pg.goto(URL); await pg.wait_for_function('window.__ready===true', timeout=15000); await pg.wait_for_timeout(600)
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch()
        c=await b.new_context(); pg=await c.new_page(); errs=[]
        pg.on('pageerror',lambda e:errs.append(str(e))); pg.on('console',lambda m: m.type in('error','warning') and errs.append(m.text))
        await boot(pg); await pg.wait_for_timeout(1000)
        print('welcome shown first run', await pg.evaluate("!!window.__modal"))
        await pg.evaluate("[...document.querySelectorAll('.fake-modal .lf-pack')].find(b=>b.dataset.pack==='cyber').click()")
        await pg.evaluate("[...document.querySelectorAll('.fake-modal button')].find(b=>b.textContent.includes('Start')).click()")
        await pg.evaluate("document.querySelector(`#drawer [role=switch][aria-label='No flashing']`).click()")
        await pg.wait_for_timeout(1200)
        keys = await pg.evaluate("Object.keys(localStorage).sort()")
        print('storage keys', keys)
        print('save status', await pg.evaluate("document.querySelector('.lf-save').innerText.replace(/\\n/g,' | ')"))
        f = json.loads(await pg.evaluate("localStorage.getItem('srv:file:settings.json')"))
        print('file', f['lumiFlair'], f['savedAt'][:10], 'pack', f['data']['activePack'], 'noFlash', f['data']['noFlash'], 'welcomed', f['data']['welcomed'])
        # 1. plain reload
        await pg.reload(); await pg.wait_for_function('window.__ready===true'); await pg.wait_for_timeout(1600)
        print('R1 reload: pack', await pg.evaluate("document.querySelector('#drawer .lf-pack.lf-on')?.dataset.pack"), 'noFlash', await pg.evaluate("document.querySelector(`#drawer [role=switch][aria-label='No flashing']`).className.includes('On')"), 'welcome again?', await pg.evaluate("!!window.__modal"))
        # 2. wipe account + browser copies, keep only config file
        await pg.evaluate("for (const k of Object.keys(localStorage)) if(!k.startsWith('srv:file:')) localStorage.removeItem(k)")
        await pg.reload(); await pg.wait_for_function('window.__ready===true'); await pg.wait_for_timeout(800)
        print('R2 file only: pack', await pg.evaluate("document.querySelector('#drawer .lf-pack.lf-on')?.dataset.pack"), 'account healed', await pg.evaluate("!!localStorage.getItem('srv:acct:flair:settings')"), 'browser healed', await pg.evaluate("!!localStorage.getItem('lumi_flair:vault:settings')"))
        # 3. slow backend + newer file -> late adoption
        await pg.evaluate("""(()=>{const f=JSON.parse(localStorage.getItem('srv:file:settings.json')); f.at=Date.now()+5000; f.data.activePack='noir'; localStorage.setItem('srv:file:settings.json', JSON.stringify(f))})()""")
        await pg.add_init_script("window.__backendDelay=3500")
        await pg.reload(); await pg.wait_for_function('window.__ready===true')
        early = await pg.evaluate("document.querySelector('#drawer .lf-pack.lf-on')?.dataset.pack")
        await pg.wait_for_timeout(4500)
        late = await pg.evaluate("document.querySelector('#drawer .lf-pack.lf-on')?.dataset.pack")
        print('R3 slow backend: early', early, '-> late', late, 'account updated', json.loads(await pg.evaluate("localStorage.getItem('srv:acct:flair:settings')"))['data']['activePack'])
        # 4. dead backend: changes still saved to account+browser, file untouched
        c2=await b.new_context(); pg2=await c2.new_page(); pg2.on('pageerror',lambda e:errs.append(str(e)))
        await pg2.add_init_script("window.__backendDead=true")
        await boot(pg2)
        await pg2.evaluate("document.querySelector(`#drawer [role=switch][aria-label='Spotlight mode']`).click()"); await pg2.wait_for_timeout(800)
        print('R4 dead backend status', await pg2.evaluate("document.querySelector('.lf-save').innerText.replace(/\\n/g,' | ')"), 'file written?', await pg2.evaluate("!!localStorage.getItem('srv:file:settings.json')"))
        await pg2.reload(); await pg2.wait_for_function('window.__ready===true'); await pg2.wait_for_timeout(500)
        print('R4 reload spotlight kept', await pg2.evaluate("document.querySelector(`#drawer [role=switch][aria-label='Spotlight mode']`).className.includes('On')"))
        # 5. backup restore
        await pg.evaluate("window.__importPack={lumiFlairBackup:1,version:'0.3.1',settings:{activePack:'sakura',sendEffect:'confetti',welcomed:true},achievements:{unlocked:{night_owl:1}}}")
        await pg.evaluate("[...document.querySelectorAll('#drawer button')].find(b=>b.textContent.includes('Restore from file')).click()"); await pg.wait_for_timeout(4300)
        print('R5 restore: pack', await pg.evaluate("document.querySelector('#drawer .lf-pack.lf-on')?.dataset.pack"), 'file', json.loads(await pg.evaluate("localStorage.getItem('srv:file:settings.json')"))['data']['sendEffect'], 'badges file', bool(await pg.evaluate("localStorage.getItem('srv:file:achievements.json')")))
        # 6. pagehide flush: change then immediately reload
        await pg.evaluate("document.querySelector(`#drawer [role=switch][aria-label='Tap to glow (touch screens)']`).click()")
        await pg.reload(); await pg.wait_for_function('window.__ready===true'); await pg.wait_for_timeout(500)
        print('R6 instant reload kept tapGlow off', not await pg.evaluate("document.querySelector(`#drawer [role=switch][aria-label='Tap to glow (touch screens)']`).className.includes('On')"))
        await pg.locator('.lf-save').scroll_into_view_if_needed(); await pg.screenshot(path='v5_save.png', clip={'x':0,'y':0,'width':1280,'height':900})
        print('errors', [e for e in errs if 'Could not' not in e])
        await b.close()
asyncio.run(main())
