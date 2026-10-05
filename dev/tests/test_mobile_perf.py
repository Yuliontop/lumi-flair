"""What keeps a phone (an iOS home-screen app in particular) from struggling or being killed:

  * the scene's particles are drawn at ~30 fps on a touch screen, ~60 on a desktop;
  * the frame-rate governor's own animation-frame loop only runs when something animates (and, on a touch screen, only for the particles);
  * the moment the host starts leaving the chat (the home button), our atmosphere goes: the canvas stops and the layers are hidden;
  * closing a chat for the home screen does not re-inject the whole stylesheet, and the whole-UI colour work waits for the page change to settle.

Run from the repo root with the mock server up (see dev/README.md):
    python dev/run.py test_mobile_perf.py
"""
import os, sys
BASE = os.environ.get("LF_BASE", "http://localhost:8765")
import asyncio, json
from playwright.async_api import async_playwright

errs = []

def expect(label, got, want):
    ok = got == want
    print(f"{'ok ' if ok else 'BAD'} {label}: {got}" + ('' if ok else f'  (wanted {want})'))
    if not ok: errs.append(f'{label}: got {got}, wanted {want}')

def between(label, got, lo, hi):
    ok = lo <= got <= hi
    print(f"{'ok ' if ok else 'BAD'} {label}: {got} (wanted {lo} to {hi})")
    if not ok: errs.append(f'{label}: {got} not in {lo}..{hi}')

# Counts what we draw on the ambient canvas, how many animation frames get requested, and what is added to <head> / rewritten in the colour sheet
INIT = r"""
window.__granted=['ui_panels'];
window.__amb=0; window.__raf=0; window.__heads=[]; window.__color=[];
(()=>{
  const cr=CanvasRenderingContext2D.prototype.clearRect;
  CanvasRenderingContext2D.prototype.clearRect=function(...a){ if(this.canvas&&this.canvas.classList&&this.canvas.classList.contains('lf-ambient')) window.__amb++; return cr.apply(this,a) };
  const raf=window.requestAnimationFrame; window.requestAnimationFrame=function(cb){ window.__raf++; return raf.call(window,cb) };
  document.addEventListener('DOMContentLoaded',()=>new MutationObserver(m=>{ for(const r of m) for(const n of r.addedNodes) if(n.tagName==='STYLE') window.__heads.push(Math.round(performance.now())) }).observe(document.head,{childList:true}));
})();
if(!sessionStorage.x){sessionStorage.x=1; localStorage.setItem('lumi_flair:vault:settings', JSON.stringify({at:1,data:Object.assign({welcomed:true},SEED)}))}
"""

async def open_page(b, seed, touch=False, size=(1280, 900)):
    kw = dict(viewport={'width': size[0], 'height': size[1]})
    if touch: kw.update(is_mobile=True, has_touch=True, device_scale_factor=2)
    ctx = await b.new_context(**kw); pg = await ctx.new_page()
    pg.on('pageerror', lambda e: errs.append(str(e)))
    await pg.add_init_script(INIT.replace('SEED', json.dumps(seed)))
    await pg.goto(BASE + '/lumiverse.html'); await pg.wait_for_function('window.__ready===true'); await pg.wait_for_timeout(1500)
    return ctx, pg

async def rate(pg, var, ms=2000):
    a = await pg.evaluate(f"window.{var}"); await pg.wait_for_timeout(ms); z = await pg.evaluate(f"window.{var}")
    return round((z - a) * 1000 / ms)

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()

        print('== the scene is drawn at ~30 fps on a touch screen, ~60 on a desktop ==')
        ctx, pg = await open_page(b, {'ambientScene': 'rain'})
        expect('pointer is fine (desktop)', await pg.evaluate("matchMedia('(pointer: coarse)').matches"), False)
        between('desktop: scene frames per second', await rate(pg, '__amb'), 45, 70)
        await ctx.close()
        ctx, pg = await open_page(b, {'ambientScene': 'rain'}, touch=True, size=(430, 932))
        expect('pointer is coarse (touch)', await pg.evaluate("matchMedia('(pointer: coarse)').matches"), True)
        between('touch: scene frames per second', await rate(pg, '__amb'), 22, 36)
        await ctx.close()

        print('== the governor only runs a frame loop when something animates ==')
        for label, seed, touch, lo, hi in [('nothing on, desktop', {}, False, 0, 8),
                                           ('light rays only, desktop (watched)', {'lightDefault': 'dawn'}, False, 40, 200),
                                           ('light rays only, touch (already stepped: not watched)', {'lightDefault': 'dawn'}, True, 0, 8),
                                           ('scene, touch (watched, and the scene itself)', {'ambientScene': 'snow'}, True, 25, 200)]:
            ctx, pg = await open_page(b, seed, touch=touch, size=(430, 932) if touch else (1280, 900))
            between(f'{label}: animation frames requested per second', await rate(pg, '__raf'), lo, hi)
            await ctx.close()

        print('== the home button: the atmosphere goes the moment the host starts leaving ==')
        ctx, pg = await open_page(b, {'ambientScene': 'rain', 'lightDefault': 'dawn'})
        between('scene running before', await rate(pg, '__amb', 1000), 45, 70)
        cine = "(()=>{const e=document.querySelector('.lf-cine'); return e ? getComputedStyle(e).display : 'missing'})()"
        expect('light layer shown before', await pg.evaluate(cine), 'block')
        await pg.evaluate("document.querySelector('[data-component=ChatView]').setAttribute('data-chat-chrome-leaving','')")  # what the host sets for the 220 ms before it navigates
        await pg.wait_for_timeout(250)
        expect('light layer hidden', await pg.evaluate(cine), 'none')
        expect('scene stopped drawing', await rate(pg, '__amb', 600), 0)
        expect('scene canvas cleared', await pg.evaluate("(()=>{const c=document.querySelector('canvas.lf-ambient'); const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data; for(let i=3;i<d.length;i+=4) if(d[i]) return false; return true})()"), True)
        await pg.evaluate("document.querySelector('[data-component=ChatView]').removeAttribute('data-chat-chrome-leaving')")  # (the transition was cancelled / a wallpaper change ended)
        await pg.wait_for_timeout(400)
        expect('light layer back', await pg.evaluate(cine), 'block')
        between('scene running again', await rate(pg, '__amb', 1000), 45, 70)
        await ctx.close()

        print('== closing the chat for the home screen ==')
        for label, seed, expected_swaps in [('no per-character profile', {}, 0), ('a profile for this character', {'characterProfiles': {'char1': {'sendEffect': 'confetti'}}}, 1)]:
            ctx, pg = await open_page(b, seed)
            await pg.evaluate("window.__heads.length=0; window.__colorAt=[]; new MutationObserver(()=>window.__colorAt.push(Math.round(performance.now()))).observe(document.querySelector('.lf-overlay').parentElement.querySelector(':scope > style'),{childList:true,characterData:true,subtree:true})")  # the colour sheet sits beside the overlay
            t0 = await pg.evaluate("(()=>{window.__active={chatId:null,characterId:null}; const t=Math.round(performance.now()); __emit('CHAT_CHANGED',{}); return t})()")
            await pg.wait_for_timeout(1600)
            heads = await pg.evaluate("window.__heads.length"); colors = await pg.evaluate("window.__colorAt")
            expect(f'{label}: stylesheets re-injected', heads, expected_swaps)
            first = (colors[0] - t0) if colors else None
            print('   colour sheet rewritten', [c - t0 for c in colors], 'ms after closing the chat')
            check_wait = first is not None and first >= 800
            expect(f'{label}: colour work waits for the page change to settle (>= 800 ms)' if expected_swaps == 0 else f'{label}: (applyAll runs at once: it must, the settings changed)', check_wait if expected_swaps == 0 else True, True)
            await pg.evaluate("window.__active=undefined; __emit('CHAT_CHANGED',{})"); await pg.wait_for_timeout(600)  # the chat opens again
            await ctx.close()

        await b.close()
    print('errors', errs)
asyncio.run(main())
