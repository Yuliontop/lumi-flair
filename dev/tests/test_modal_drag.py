"""Flair's popups stay open when a text selection is dragged outside them.

Lumiverse's extension modal closes on any click whose target is its backdrop, and a drag that starts inside
the modal and ends outside it produces exactly such a click. The mock gets a backdrop that behaves the same
(window.__modalBackdrop), and the real mouse drags out of the Moment Card's text box and the "Save my look"
name field. A real click on the backdrop must still close them, and clicks elsewhere must work afterwards.

Run from the repo root with the mock server up (see dev/README.md):
    python dev/run.py test_modal_drag.py
"""
import os
BASE = os.environ.get("LF_BASE", "http://localhost:8765")
import asyncio
from playwright.async_api import async_playwright

errs = []

def expect(label, got, want):
    ok = got == want
    print(f"{'ok ' if ok else 'BAD'} {label}: {got}" + ('' if ok else f'  (wanted {want})'))
    if not ok: errs.append(f'{label}: got {got}, wanted {want}')

SEED = "if(!sessionStorage.x){sessionStorage.x=1; localStorage.setItem('lumi_flair:vault:settings', JSON.stringify({at:1,data:{welcomed:true,intro:false}}))} window.__modalBackdrop=true;"
OPEN = "!!window.__modal"

async def drag_out(pg, sel):
    box = await pg.evaluate(f"(()=>{{const r=document.querySelector({sel!r}).getBoundingClientRect(); return [r.x+20, r.y+r.height/2]}})()")
    await pg.mouse.move(box[0], box[1]); await pg.mouse.down()
    for i in range(1, 11):
        await pg.mouse.move(box[0] + (12 - box[0]) * i / 10, box[1] + (12 - box[1]) * i / 10)
    await pg.mouse.up(); await pg.wait_for_timeout(300)

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width': 1280, 'height': 900})
        pg = await ctx.new_page()
        pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: m.type == 'error' and errs.append(m.text))
        await pg.add_init_script(SEED)
        await pg.goto(BASE + '/lumiverse.html'); await pg.wait_for_function('window.__ready===true'); await pg.wait_for_timeout(700)

        print('== Moment Card ==')
        await pg.evaluate("[...document.querySelectorAll('[data-message-id=m4] .lf-moment-btn')].find(b=>b.getAttribute('aria-label')==='Make a Moment Card').click()"); await pg.wait_for_timeout(1200)
        expect('the card window is open, over a backdrop', [await pg.evaluate(OPEN), await pg.evaluate("document.querySelectorAll('.fake-backdrop').length")], [True, 1])
        await pg.fill('.fake-modal textarea', 'A long enough line to select across, and then some more words.')
        await drag_out(pg, '.fake-modal textarea')
        expect('selecting in the text box and letting go outside the window: it stays open', await pg.evaluate(OPEN), True)
        await pg.mouse.click(12, 12); await pg.wait_for_timeout(300)
        expect('a real click on the backdrop still closes it', [await pg.evaluate(OPEN), await pg.evaluate("document.querySelectorAll('.fake-backdrop').length")], [False, 0])

        print('== Save my look ==')
        await pg.evaluate("[...document.querySelectorAll('#drawer button')].find(b=>b.textContent.includes('Save my look')).click()"); await pg.wait_for_timeout(500)
        expect('the dialog is open', await pg.evaluate(OPEN), True)
        await pg.fill('.fake-modal input', 'My cosy evening pack')
        await drag_out(pg, '.fake-modal input')
        expect('dragging out of the name field: it stays open', await pg.evaluate(OPEN), True)
        await pg.mouse.click(12, 12); await pg.wait_for_timeout(300)
        expect('a click on the backdrop closes it', await pg.evaluate(OPEN), False)

        print('== afterwards ==')
        await pg.evaluate("document.querySelector('[data-message-id=m1]').scrollIntoView()")
        star = await pg.evaluate("(()=>{const r=document.querySelector(\"[data-message-id='m1'] .lf-pin-btn\").getBoundingClientRect(); return [r.x+r.width/2, r.y+r.height/2]})()")
        await pg.mouse.click(star[0], star[1]); await pg.wait_for_timeout(500)
        expect('clicks elsewhere still work (a star pins)', await pg.evaluate("document.querySelector(\"[data-message-id='m1'] .lf-pin-btn\").dataset.on"), '1')
        await ctx.close(); await b.close()
    print('errors', errs)
asyncio.run(main())
