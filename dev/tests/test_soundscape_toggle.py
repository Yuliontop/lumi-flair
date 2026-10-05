"""Soundscape turns off, parks the engine, and comes back.

Run from the repo root with the mock server up (see dev/README.md):
    python dev/run.py test_soundscape_toggle.py
"""
import os, sys
BASE = os.environ.get("LF_BASE", "http://localhost:8765")
import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); pg=await b.new_page()
        await pg.goto(BASE+'/scape.html')
        await pg.evaluate("window.s=new Soundscape(); s.set(true,'embers','candle',0.5)"); await pg.wait_for_timeout(300)
        await pg.evaluate("s.set(false,'embers','candle',0.5)"); await pg.wait_for_timeout(4500)
        print('off 4.5s ->', await pg.evaluate("[s.state, s.ac.state]"))
        await pg.evaluate("s.set(true,'embers','candle',0.5)"); await pg.wait_for_timeout(500)
        print('on again ->', await pg.evaluate("[s.state, s.ac.state, s.playing]"))
        await b.close()
asyncio.run(main())
