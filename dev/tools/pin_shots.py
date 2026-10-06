"""Screenshots of pinned moments: the star under a message, the reel, and the stars on the heartbeat (dark and light).

Run from the repo root with the mock server up:
    python dev/run.py pin_shots.py        -> dev/out/pins_*.png
"""
import os
BASE = os.environ.get("LF_BASE", "http://localhost:8765")
OUT = os.path.join(os.path.dirname(__file__), '..', 'out')
import asyncio
from playwright.async_api import async_playwright

async def main():
    os.makedirs(OUT, exist_ok=True)
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for theme in ('dark', 'light'):
            pg = await b.new_page(viewport={'width': 760, 'height': 1000}, device_scale_factor=2)
            await pg.add_init_script("localStorage.setItem('lumi_flair:vault:settings', JSON.stringify({at:1,data:{welcomed:true}}))")
            await pg.goto(BASE + '/lumiverse.html'); await pg.wait_for_function('window.__ready===true'); await pg.wait_for_timeout(600)
            if theme == 'light': await pg.evaluate("document.body.className='light'")
            for mid in ['m1', 'm4', 'm1', 'm4', 'm1']:
                await pg.evaluate(f"__emit('GENERATION_ENDED',{{chatId:'c1',generationId:'g'+Math.random(),messageId:'{mid}',content:'a happy day'}})"); await pg.wait_for_timeout(120)
            await pg.evaluate("""(()=>{const el=document.querySelector("[data-message-id='m1'] span[data-lf=whisper]"); const r=document.createRange(); r.selectNodeContents(el); const s=getSelection(); s.removeAllRanges(); s.addRange(r)})()""")
            await pg.evaluate("document.querySelector(\"[data-message-id='m1'] .lf-pin-btn\").dispatchEvent(new PointerEvent('pointerdown',{bubbles:true})); document.querySelector(\"[data-message-id='m1'] .lf-pin-btn\").click()")
            await pg.evaluate("document.querySelector(\"[data-message-id='m4'] .lf-pin-btn\").click()")
            await pg.evaluate("document.querySelector(\"[data-message-id='m2'] .lf-pin-btn\").click()")
            await pg.wait_for_timeout(500)
            await pg.evaluate("for(const d of document.querySelectorAll('#drawer details')) d.open = /heartbeat|favourites/.test(d.querySelector('.lf-sec-title')?.textContent.toLowerCase().replace('story heartbeat','heartbeat').replace('favourite moments','favourites'))")
            await pg.wait_for_timeout(300)
            await pg.screenshot(path=os.path.join(OUT, f'pins_{theme}_page.png'))
            for sel, name in (('details:has(.lf-beat-host)', 'heartbeat'), ('details:has(.lf-pin-list)', 'reel')):
                el = await pg.query_selector(sel)
                if el: await el.screenshot(path=os.path.join(OUT, f'pins_{theme}_{name}.png'))
            await pg.close()
        await b.close()
    print('wrote dev/out/pins_*.png')
asyncio.run(main())
