"""Soundscape self-healing: resumes after the browser suspends audio.

Run from the repo root with the mock server up (see dev/README.md):
    python dev/run.py test_soundscape_resume.py
"""
import os, sys
BASE = os.environ.get("LF_BASE", "http://localhost:8765")
import asyncio
from playwright.async_api import async_playwright
async def run(autoplay):
    async with async_playwright() as p:
        args=['--autoplay-policy=no-user-gesture-required'] if autoplay else []
        b=await p.chromium.launch(args=args); pg=await b.new_page(); logs=[]
        pg.on('console',lambda m: logs.append(m.text)); pg.on('pageerror',lambda e: logs.append('ERR '+str(e)))
        await pg.goto(BASE+'/scape.html')
        await pg.evaluate("window.states=[]; window.s=new Soundscape(); s.onState=x=>states.push(x); s.set(true,'rain','storm',0.5)")
        await pg.wait_for_timeout(600)
        st = lambda: pg.evaluate("[s.state, s.ac && s.ac.state, s.playing]")
        print('start', await st())
        if not autoplay:
            await pg.click('#b'); await pg.wait_for_timeout(400); print('after click', await st()); 
        await pg.evaluate("s.ac.suspend()"); await pg.wait_for_timeout(150); print('suspended ->', await st())
        await pg.wait_for_timeout(900); print('auto-resumed ->', await st())
        old = await pg.evaluate("window.oldAc = s.ac, 1")
        await pg.evaluate("s.ac.close()"); await pg.wait_for_timeout(900); print('closed -> rebuilt', await st(), 'new ctx', await pg.evaluate("s.ac !== oldAc"))
        await pg.evaluate("window.oldAc = s.ac; Object.defineProperty(s.ac,'currentTime',{get:()=>42})")
        for i in range(3): await pg.evaluate("s.heal()")
        await pg.wait_for_timeout(300); print('stalled clock -> rebuilt', await st(), 'new ctx', await pg.evaluate("s.ac !== oldAc"))
        t0 = await pg.evaluate("s.ac.currentTime"); await pg.wait_for_timeout(12000); t1 = await pg.evaluate("s.ac.currentTime")
        print('12s later still advancing', round(t1-t0,1), await st())
        await pg.evaluate("s.set(true,'snow','night',0.5)"); await pg.wait_for_timeout(300); print('scene change', await st())
        await pg.evaluate("s.set(false,'snow','night',0.5)"); await pg.wait_for_timeout(300); print('disabled', await st(), 'watchdog', await pg.evaluate("!!s.watchdog"))
        await pg.evaluate("s.destroy()")
        print('states', await pg.evaluate("states"), '| logs', [l for l in logs if 'Lumi' in l or 'ERR' in l])
        await b.close()
async def main():
    print('== autoplay allowed =='); await run(True)
    print('== needs a click =='); await run(False)
asyncio.run(main())
