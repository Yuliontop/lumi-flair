"""Heartbeat dots, bloom on arrival, hints.

Run from the repo root with the mock server up (see dev/README.md):
    python dev/run.py test_heartbeat.py
"""
import os, sys
BASE = os.environ.get("LF_BASE", "http://localhost:8765")
import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); pg=await b.new_page(viewport={'width':1280,'height':900}); errs=[]
        pg.on('pageerror',lambda e:errs.append(str(e))); pg.on('console',lambda m: m.type=='error' and errs.append(m.text))
        await pg.add_init_script("localStorage.setItem('lumi_flair:vault:settings', JSON.stringify({at:1,data:{welcomed:true}}))")
        await pg.goto(BASE+'/lumiverse.html'); await pg.wait_for_function('window.__ready===true'); await pg.wait_for_timeout(600)
        for mid in ['m1','m4']:
            await pg.evaluate(f"__emit('GENERATION_ENDED',{{chatId:'c1',generationId:'g{mid}',messageId:'{mid}',content:'a happy day'}})"); await pg.wait_for_timeout(200)
        await pg.evaluate("document.querySelector('.lf-beat-host').closest('details').open=true"); await pg.wait_for_timeout(300)
        dots = await pg.evaluate("document.querySelectorAll('.lf-beat-host circle, .lf-beat-host [data-id], .lf-beat-host .lf-beat-dot').length")
        print('dots', dots)
        # scroll the chat away so m1 is off screen, then click the first dot
        await pg.evaluate("document.querySelector('.lf-beat-host circle, .lf-beat-host .lf-beat-dot').dispatchEvent(new MouseEvent('click',{bubbles:true}))")
        await pg.wait_for_timeout(700)
        print('bloom rule on m1:', await pg.evaluate("[...document.querySelectorAll('style')].some(s=>s.textContent.includes('m1') && s.textContent.includes('animation'))"))
        print('hint:', await pg.evaluate("document.querySelector('.lf-beat-host').parentElement.querySelector('.lf-hint').textContent.slice(0,60)"))
        # a beat for a message that isn't in this page at all -> notfound, point kept
        await pg.evaluate("__emit('GENERATION_ENDED',{chatId:'c1',generationId:'gz',messageId:'ghost',content:'x'})"); await pg.wait_for_timeout(300)
        n_before = await pg.evaluate("document.querySelector('.lf-beat-host').closest('details').querySelector('.lf-badge').textContent")
        await pg.evaluate("[...document.querySelectorAll('.lf-beat-host circle, .lf-beat-host .lf-beat-dot')].at(-1).dispatchEvent(new MouseEvent('click',{bubbles:true}))")
        await pg.wait_for_timeout(5500)
        print('ghost -> hint:', await pg.evaluate("document.querySelector('.lf-beat-host').parentElement.querySelector('.lf-hint').textContent"), '| points', n_before, '->', await pg.evaluate("document.querySelector('.lf-beat-host').closest('details').querySelector('.lf-badge').textContent"))
        print('errors', errs); await b.close()
asyncio.run(main())
