"""First-run welcome screen buttons and theme opt-in.

Run from the repo root with the mock server up (see dev/README.md):
    python dev/run.py test_welcome.py
"""
import os, sys
BASE = os.environ.get("LF_BASE", "http://localhost:8765")
import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); pg=await b.new_page(viewport={'width':1280,'height':900}); errs=[]
        pg.on('pageerror',lambda e:errs.append(str(e)))
        await pg.goto(BASE+'/lumiverse.html'); await pg.wait_for_function('window.__ready===true'); await pg.wait_for_timeout(1600)
        rows = await pg.evaluate("[...document.querySelectorAll('.fake-modal .lf-perm b')].map(b=>b.textContent)")
        print('welcome rows', rows)
        await pg.evaluate("[...document.querySelectorAll('.fake-modal .lf-perm')].find(r=>r.textContent.includes('Match Lumiverse')).querySelector('button').click()"); await pg.wait_for_timeout(300)
        await pg.evaluate("document.querySelector('.fake-modal .lf-pack[data-pack=sakura]').click()"); await pg.wait_for_timeout(500)
        print('button now', await pg.evaluate("[...document.querySelectorAll('.fake-modal .lf-perm')].find(r=>r.textContent.includes('Match Lumiverse')).querySelector('button').textContent"))
        print('theme sent', await pg.evaluate("__sent.filter(x=>x.type==='ui_theme').at(-1)?.spec?.accent"))
        await pg.screenshot(path='v7_welcome.png')
        print('errors', errs); await b.close()
asyncio.run(main())
