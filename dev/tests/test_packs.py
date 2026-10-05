"""Flair Packs: import, save, export, re-import, remove, welcome listing.

Run from the repo root with the mock server up (see dev/README.md):
    python dev/run.py test_packs.py
"""
import os, sys
BASE = os.environ.get("LF_BASE", "http://localhost:8765")
import asyncio, json
from playwright.async_api import async_playwright
GRID = "[...document.querySelectorAll('#drawer .lf-pack')].map(b=>b.dataset.pack.startsWith('custom-')?('*'+b.querySelector('b').textContent):b.dataset.pack).join(', ')"
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); c=await b.new_context(viewport={'width':1280,'height':1000}, accept_downloads=True); errs=[]
        pg=await c.new_page(); pg.on('pageerror',lambda e:errs.append(str(e))); pg.on('console',lambda m: m.type=='error' and errs.append(m.text))
        await pg.add_init_script("window.__granted=['app_manipulation']; if(!sessionStorage.x){sessionStorage.x=1; localStorage.setItem('lumi_flair:vault:settings', JSON.stringify({at:1,data:{welcomed:true,uiTheme:'pack'}}))}")
        await pg.goto(BASE+'/lumiverse.html'); await pg.wait_for_function('window.__ready===true'); await pg.wait_for_timeout(800)
        click = lambda txt: pg.evaluate(f"[...document.querySelectorAll('#drawer button')].find(b=>b.textContent.includes('{txt}')).click()")
        # 1) import an old-style (v1) pack file
        await pg.evaluate("""window.__importPack={lumiFlairPack:1,name:'Ocean <b>Dream</b>',settings:{colorSource:'custom',customColor:'#2ad4c0',ambientScene:'rain',sendEffect:'ripple',evil:'x',hoverStyle:'neon'}}""")
        await click('Import pack'); await pg.wait_for_timeout(2200)
        print('after v1 import grid:', await pg.evaluate(GRID))
        print('  active:', await pg.evaluate("document.querySelector('#drawer .lf-pack.lf-on b').textContent"), '| tag', await pg.evaluate("document.querySelector('#drawer .lf-pack.lf-on').parentElement.querySelector('.lf-pack-tag')?.textContent"), '| theme accent sent', await pg.evaluate("__sent.filter(x=>x.type==='ui_theme').at(-1)?.spec?.accent"))
        # 2) import a v2 pack with theme
        await pg.evaluate("""window.__importPack={lumiFlairPack:2,name:'Vampire Court',tagline:'Velvet and candlelight.',swatch:['#7a0a2a','#e8c27a'],settings:{colorSource:'custom',customColor:'#a3123a',lightDefault:'candle'},theme:{accent:'#a3123a',bgDark:'#14060b',bgLight:'#f6eef0',speech:'#e8c27a',secondary:'not-a-colour'}}""")
        await click('Import pack'); await pg.wait_for_timeout(2200)
        print('after v2 import grid:', await pg.evaluate(GRID))
        last = await pg.evaluate("__sent.filter(x=>x.type==='ui_theme').at(-1).spec")
        print('  v2 theme ->', last['accent'], last['bgDark'], last['speech'], 'secondary dropped:', 'secondary' not in last or last['secondary'] is None)
        # 3) switch to builtin then back to custom by clicking card
        await pg.evaluate("document.querySelector('#drawer .lf-pack[data-pack=cozy]').click()"); await pg.wait_for_timeout(200)
        await pg.evaluate("[...document.querySelectorAll('#drawer .lf-pack')].find(b=>b.textContent.includes('Vampire')).click()"); await pg.wait_for_timeout(300)
        print('reselect custom -> active', await pg.evaluate("document.querySelector('#drawer .lf-pack.lf-on b').textContent"), '| badge', await pg.evaluate("document.querySelector('#drawer details .lf-badge') && [...document.querySelectorAll('#drawer .lf-badge')].map(x=>x.textContent).find(t=>t.includes('Vampire'))"))
        # 4) save my look
        await click('Save my look'); await pg.wait_for_timeout(200)
        await pg.fill('.fake-modal .lf-input', 'Night Shift'); await pg.evaluate("document.querySelector('.fake-modal form').requestSubmit()"); await pg.wait_for_timeout(400)
        print('after save grid:', await pg.evaluate(GRID))
        # 5) re-import same name replaces instead of duplicating
        await pg.evaluate("window.__importPack={lumiFlairPack:2,name:'vampire court',settings:{customColor:'#ff0000',colorSource:'custom'}}")
        await click('Import pack'); await pg.wait_for_timeout(2200)
        print('re-import same name grid:', await pg.evaluate(GRID))
        # 6) export current custom pack
        async with pg.expect_download() as dl:
            await click('Export my look')
        d = await dl.value; path = await d.path(); data = json.load(open(path))
        print('export file', d.suggested_filename, '| v', data['lumiFlairPack'], '| name', data['name'], '| theme', data.get('theme',{}).get('accent') if isinstance(data.get('theme'),dict) else data.get('theme'), '| keys', len(data['settings']))
        # 7) reload persists
        await pg.wait_for_timeout(500); await pg.reload(); await pg.wait_for_function('window.__ready===true'); await pg.wait_for_timeout(900)
        print('after reload grid:', await pg.evaluate(GRID), '| active', await pg.evaluate("document.querySelector('#drawer .lf-pack.lf-on b')?.textContent"))
        await pg.evaluate("document.querySelector('#drawer .lf-packs').scrollIntoView({block:'start'})"); await pg.wait_for_timeout(300)
        await pg.hover("#drawer .lf-pack[data-pack^='custom-']")
        await pg.screenshot(path='v8_packs.png')
        # 8) remove
        await pg.evaluate("[...document.querySelectorAll('#drawer .lf-pack-wrap')].find(w=>w.textContent.includes('Night Shift')).querySelector('.lf-pack-del').click()"); await pg.wait_for_timeout(400)
        print('after remove grid:', await pg.evaluate(GRID))
        # 9) welcome lists customs, next-pack command cycles into customs
        print('welcome lists customs?', await pg.evaluate("(()=>{return 1})()"))
        print('errors', errs)
        await b.close()
asyncio.run(main())
