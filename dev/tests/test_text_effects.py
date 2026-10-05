"""Per-effect text-effect toggles, prompt prefs and camera-shake gating.

Run from the repo root with the mock server up (see dev/README.md):
    python dev/run.py test_text_effects.py
"""
import os, sys
BASE = os.environ.get("LF_BASE", "http://localhost:8765")
import asyncio, json
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); c=await b.new_context(viewport={'width':1280,'height':900}); pg=await c.new_page(); errs=[]
        pg.on('pageerror',lambda e:errs.append(str(e))); pg.on('console',lambda m: m.type=='error' and errs.append(m.text))
        await pg.add_init_script("localStorage.setItem('lumi_flair:vault:settings', JSON.stringify({at:1,data:{welcomed:true}}))")
        await pg.goto(BASE+'/lumiverse.html'); await pg.wait_for_function('window.__ready===true'); await pg.wait_for_timeout(800)
        await pg.evaluate("""(()=>{const m=document.querySelector('[data-message-id=m4][data-component]'); const t=m.querySelector('*:not(img)')||m; t.insertAdjacentHTML('beforeend',' <span data-lf="pulse" id=tp>thump</span> <span data-lf="shake" id=ts>NO</span>')})()""")
        anim = lambda sel: pg.evaluate(f"getComputedStyle(document.querySelector('{sel}')).animationName")
        print('before: msg pulse', await anim('#tp'), '| chips', await pg.evaluate("document.querySelectorAll('.lf-fx-chip').length"), await pg.evaluate("document.querySelector('.lf-fx-count').textContent"))
        await pg.evaluate("document.querySelector('.lf-fx-chip[data-fx=pulse]').click()"); await pg.wait_for_timeout(400)
        print('pulse off: msg pulse', await anim('#tp'), '| shake still', await anim('#ts'), '| chip preview still animates', await anim('.lf-fx-chip[data-fx=pulse] [data-lf]'), '| chip', await pg.evaluate("[document.querySelector('.lf-fx-chip[data-fx=pulse]').className, document.querySelector('.lf-fx-chip[data-fx=pulse]').getAttribute('aria-pressed'), document.querySelector('.lf-fx-count').textContent]"))
        print('prefs sent', [x.get('disabledFx') for x in await pg.evaluate("__sent.filter(x=>x.type==='prefs')")][-1])
        # camera shake suppression
        await pg.evaluate("document.querySelector('.lf-fx-chip[data-fx=shake]').click(); document.querySelector('.lf-fx-chip[data-fx=big]').click()"); await pg.wait_for_timeout(300)
        await pg.evaluate("__emit('GENERATION_ENDED',{chatId:'c1',generationId:'g9',messageId:'m4',content:'<span data-lf=\"shake\">NO!</span>'})"); await pg.wait_for_timeout(250)
        print('shake+big off -> camera shake:', await pg.evaluate("getComputedStyle(document.querySelector('[data-lumiverse-surface=chat-body]')).animationName"))
        await pg.evaluate("document.querySelector('.lf-fx-chip[data-fx=tp]')"); 
        await pg.wait_for_timeout(600)
        await pg.reload(); await pg.wait_for_function('window.__ready===true'); await pg.wait_for_timeout(800)
        print('after reload off list', await pg.evaluate("[...document.querySelectorAll('.lf-fx-chip.lf-off')].map(b=>b.dataset.fx)"))
        await pg.locator('.lf-fx-pick').scroll_into_view_if_needed(); await pg.wait_for_timeout(300)
        box = await pg.locator('.lf-fx-pick').bounding_box()
        await pg.screenshot(path='v6_picker.png', clip={'x':box['x']-20,'y':box['y']-60,'width':box['width']+40,'height':box['height']+170})
        await pg.evaluate("[...document.querySelectorAll('#drawer button')].find(b=>b.textContent.includes('Turn all on')).click()"); await pg.wait_for_timeout(300)
        print('turn all on ->', await pg.evaluate("document.querySelector('.lf-fx-count').textContent"))
        print('errors', errs)
        await b.close()
asyncio.run(main())
