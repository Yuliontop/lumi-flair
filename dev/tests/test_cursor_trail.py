"""Cursor trail: every theme draws behind a moving mouse and leaves the canvas fully cleared once the mouse stops,
and the length slider sets how long it lingers.
Nothing is drawn for touch, with the trail off, or when reduced motion is respected.

Run from the repo root with the mock server up (see dev/README.md):
    python dev/run.py test_cursor_trail.py
"""
import os
BASE = os.environ.get("LF_BASE", "http://localhost:8765")
import asyncio, json
from playwright.async_api import async_playwright

errs = []

def expect(label, got, want):
    ok = got == want
    print(f"{'ok ' if ok else 'BAD'} {label}: {got}" + ('' if ok else f'  (wanted {want})'))
    if not ok: errs.append(f'{label}: got {got}, wanted {want}')

INIT = """
if(!sessionStorage.x){sessionStorage.x=1; localStorage.setItem('lumi_flair:vault:settings', JSON.stringify({at:1,data:Object.assign({welcomed:true},SEED)}))}
"""
# painted pixels on the effects canvas
PAINTED = "(()=>{const c=document.querySelector('.lf-fx'); const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data; let n=0; for(let i=3;i<d.length;i+=4) if(d[i]) n++; return n})()"

async def open_page(b, seed, reduced=False):
    ctx = await b.new_context(viewport={'width': 1100, 'height': 760}, reduced_motion='reduce' if reduced else 'no-preference')
    pg = await ctx.new_page()
    pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: m.type == 'error' and errs.append(m.text))
    await pg.add_init_script(INIT.replace('SEED', json.dumps(seed)))
    await pg.goto(BASE + '/lumiverse.html'); await pg.wait_for_function('window.__ready===true'); await pg.wait_for_timeout(700)
    return ctx, pg

async def wiggle(pg):
    await pg.mouse.move(200, 300)
    for i in range(12):
        await pg.mouse.move(220 + i * 50, 300 + (i % 2) * 60, steps=3)
        await pg.wait_for_timeout(16)

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        print('== each trail draws while the mouse moves, then clears ==')
        for t in ['splash', 'creamy', 'petalstorm', 'blackhole', 'comet', 'confetti']:
            ctx, pg = await open_page(b, {'cursorTrail': t})
            await wiggle(pg)
            n = await pg.evaluate(PAINTED)
            await pg.wait_for_timeout(2200)  # longest trail particle lives 1.8 s
            expect(f'{t}: drew while moving ({n} px), cleared after', [n > 200, await pg.evaluate(PAINTED)], [True, 0])
            await ctx.close()

        print('== trail length: a short trail is gone quickly, a long one lingers ==')
        for length, want in ((0.25, False), (2, True)):
            ctx, pg = await open_page(b, {'cursorTrail': 'comet', 'trailLength': length})
            await wiggle(pg); await pg.wait_for_timeout(500)  # 1x comet puffs live up to 0.75 s
            expect(f'{length}x: still drawn 0.5 s after the mouse stopped', await pg.evaluate(PAINTED) > 50, want)
            await pg.wait_for_timeout(1300)
            expect(f'{length}x: cleared after', await pg.evaluate(PAINTED), 0)
            await ctx.close()

        print('== nothing drawn ==')
        ctx, pg = await open_page(b, {'cursorTrail': 'none'})
        await wiggle(pg); expect('trail off', await pg.evaluate(PAINTED), 0); await ctx.close()

        ctx, pg = await open_page(b, {'cursorTrail': 'comet'}, reduced=True)
        await wiggle(pg); expect('reduced motion', await pg.evaluate(PAINTED), 0); await ctx.close()

        ctx, pg = await open_page(b, {'cursorTrail': 'comet'})
        await pg.evaluate("""(async()=>{for(let i=0;i<20;i++){document.body.dispatchEvent(new PointerEvent('pointermove',{bubbles:true,pointerType:'touch',clientX:200+i*30,clientY:300})); await new Promise(r=>setTimeout(r,20))}})()""")
        expect('touch moves', await pg.evaluate(PAINTED), 0); await ctx.close()

        await b.close()
    print('errors', errs)

asyncio.run(main())
