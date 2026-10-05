"""Story heartbeat jump to unloaded / deleted messages (navigator mock).

Run from the repo root with the mock server up (see dev/README.md):
    python dev/run.py test_navigation.py
"""
import os, sys
BASE = os.environ.get("LF_BASE", "http://localhost:8765")
import asyncio, time
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); pg=await b.new_page(viewport={'width':1000,'height':760}); errs=[]
        pg.on('pageerror',lambda e:errs.append(str(e)))
        await pg.goto(BASE+'/nav.html'); await pg.wait_for_timeout(300)
        async def jump(id, label):
            t=time.time(); r=await pg.evaluate(f"nav.jump('{id}')"); dt=time.time()-t
            await pg.wait_for_timeout(700)
            print(f"{label}: {r} in {dt:.2f}s | centre offset {await pg.evaluate(f'center(\"{id}\")')}px | {await pg.evaluate('stats()')} | veil gone {await pg.evaluate('!document.querySelector(\".lf-veil\")')}")
        await jump('msg795','on screen    ')
        await jump('msg755','loaded,unmounted')
        # veil snapshot during a long jump
        task = asyncio.create_task(pg.evaluate("nav.jump('msg3')"))
        await pg.wait_for_timeout(900); await pg.screenshot(path='v9_veil.png')
        print('veil visible mid-jump:', await pg.evaluate("!!document.querySelector('.lf-veil.lf-in')"), '| bar', await pg.evaluate("document.querySelector('.lf-veil-bar i')?.style.width"))
        t=time.time(); r=await task; print(f"very old (#3): {r} in {time.time()-t+0.9:.2f}s | centre {await pg.evaluate('center(\"msg3\")')}px | {await pg.evaluate('stats()')}")
        await pg.wait_for_timeout(500)
        await jump('msg640','newer, below (loaded)')
        await jump('msg0','first message')
        await jump('deleted-id','deleted     ')
        # cancel: reload page (fresh window) then jump far and press Esc
        await pg.reload(); await pg.wait_for_timeout(300)
        task = asyncio.create_task(pg.evaluate("nav.jump('msg10')")); await pg.wait_for_timeout(700); await pg.keyboard.press('Escape')
        print('esc ->', await task, '| veil gone', await pg.evaluate("new Promise(r=>setTimeout(()=>r(!document.querySelector('.lf-veil')),400))"))
        print('arrived calls', await pg.evaluate("arrived.length"), '| errors', errs)
        await b.close()
asyncio.run(main())
