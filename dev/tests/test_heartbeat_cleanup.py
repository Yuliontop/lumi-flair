"""Heartbeat point removal when a message is deleted.

Run from the repo root with the mock server up (see dev/README.md):
    python dev/run.py test_heartbeat_cleanup.py
"""
import os, sys
BASE = os.environ.get("LF_BASE", "http://localhost:8765")
import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); pg=await b.new_page(); errs=[]
        pg.on('pageerror',lambda e:errs.append(str(e)))
        await pg.add_init_script("localStorage.setItem('lumi_flair:vault:settings', JSON.stringify({at:1,data:{welcomed:true}}))")
        await pg.goto(BASE+'/lumiverse.html'); await pg.wait_for_function('window.__ready===true'); await pg.wait_for_timeout(500)
        for mid in ['m1','m4']:
            await pg.evaluate(f"__emit('GENERATION_ENDED',{{chatId:'c1',generationId:'g{mid}',messageId:'{mid}',content:'hi'}})"); await pg.wait_for_timeout(150)
        cnt = "document.querySelector('.lf-beat-host').closest('details').querySelector('.lf-badge').textContent"
        print('points', await pg.evaluate(cnt))
        await pg.evaluate("__emit('MESSAGE_DELETED',{chatId:'c1',messageId:'m1'})"); await pg.wait_for_timeout(200)
        print('after delete', await pg.evaluate(cnt), '| errors', errs)
        await b.close()
asyncio.run(main())
