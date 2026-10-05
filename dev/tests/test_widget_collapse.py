"""The floating volume widget collapses to a round button (and starts that way on a touch screen).

Checks the shape it takes in each state, that it opens and folds on the spot instead of jumping, that a drag doesn't
open it, that the choice is remembered, and that everything stays inside a phone-sized window.

Run from the repo root with the mock server up (see dev/README.md):
    python dev/run.py test_widget_collapse.py
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

INIT = """
window.__granted=['ui_panels'];
if(!sessionStorage.x){sessionStorage.x=1; localStorage.setItem('lumi_flair:vault:settings', JSON.stringify({at:1,data:Object.assign({welcomed:true,soundscape:true,soundscapeVolume:0.5,ambientScene:'rain',soundWidget:true},SEED)}))}
"""
# the box and the visible parts of the widget
BOX = "(()=>{const r=document.querySelector('.fake-float').getBoundingClientRect(); return [Math.round(r.left),Math.round(r.top),Math.round(r.width),Math.round(r.height)]})()"
VISIBLE = "(()=>{const sw=document.querySelector('.lf-sw'); const out=[]; for(const c of sw.children) if(getComputedStyle(c).display!=='none') out.push(c.className.replace('lf-sw-','')); return out})()"
SAVED = "JSON.parse(localStorage.getItem('lumi_flair:vault:settings')).data"
async def open_page(b, seed=None, touch=False, size=(1280, 900)):
    kw = dict(viewport={'width': size[0], 'height': size[1]})
    if touch: kw.update(is_mobile=True, has_touch=True, device_scale_factor=2)
    ctx = await b.new_context(**kw); pg = await ctx.new_page()
    pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: m.type == 'error' and errs.append(m.text))
    await pg.add_init_script(INIT.replace('SEED', json.dumps(seed or {})))
    await pg.goto(BASE + '/lumiverse.html'); await pg.wait_for_function('window.__ready===true && !!window.__float'); await pg.wait_for_timeout(900)
    return ctx, pg

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])

        print('== desktop: starts as the pill, folds into a button, opens again on the spot ==')
        ctx, pg = await open_page(b, {'soundWidgetPos': {'x': 900, 'y': 100}})   # right half of the screen
        expect('starts open', await pg.evaluate("document.querySelector('.lf-sw').dataset.collapsed"), '0')
        expect('pill size', (await pg.evaluate(BOX))[2:], [288, 52])
        expect('shows', await pg.evaluate(VISIBLE), ['grip', 'btn', 'mid', 'pct', 'fold'])
        await pg.evaluate("document.querySelector('.lf-sw-fold').click()"); await pg.wait_for_timeout(400)
        box = await pg.evaluate(BOX)
        expect('folded: a round button', box[2:], [44, 44])
        expect('it folded toward the screen edge it was nearer (right end and middle stay)', box[:2], [900 + 288 - 44, 100 + 26 - 22])
        expect('shows only the button', await pg.evaluate(VISIBLE), ['dot'])
        print('   screen taken:', 288 * 52, '->', 44 * 44, 'px² (', round(100 - 44 * 44 / (288 * 52) * 100), '% less )')
        expect('remembered', (await pg.evaluate(SAVED))['soundWidgetCollapsed'], True)
        expect('button is a labelled button', await pg.evaluate("(()=>{const d=document.querySelector('.lf-sw-dot'); return [d.tagName, d.getAttribute('aria-label'), d.getAttribute('aria-expanded')]})()"), ['BUTTON', 'Show ambience volume', 'false'])
        expect('button shows it is playing', await pg.evaluate("[document.querySelector('.lf-sw').dataset.on, !!document.querySelector('.lf-sw-dot .lf-sw-w1')]"), ['1', True])
        await pg.evaluate("document.querySelector('.lf-sw-dot').click()"); await pg.wait_for_timeout(400)
        box = await pg.evaluate(BOX)
        expect('opened again', box[2:], [288, 52])
        expect('where it was before', box[:2], [900, 100])
        expect('focus moved to the control that took over', await pg.evaluate("document.activeElement?.className"), 'lf-sw-fold')
        expect('controls still work: slider click sets the volume', await pg.evaluate("""(()=>{const r=document.querySelector('.lf-sw-slider').getBoundingClientRect(); return [r.x+r.width*0.8, r.y+r.height/2]})()""") is not None, True)
        sl = await pg.evaluate("(()=>{const r=document.querySelector('.lf-sw-slider').getBoundingClientRect(); return [r.x,r.y,r.width,r.height]})()")
        await pg.mouse.click(sl[0] + sl[2] * 0.8, sl[1] + sl[3] / 2); await pg.wait_for_timeout(400)
        expect('...and it is saved', (await pg.evaluate(SAVED))['soundscapeVolume'] >= 0.7, True)

        print('== dragged across the screen: the chevron turns ==')
        expect('right side', await pg.evaluate("document.querySelector('.lf-sw').dataset.anchor"), 'r')
        g = await pg.evaluate("(()=>{const r=document.querySelector('.lf-sw-grip').getBoundingClientRect(); return [r.x+r.width/2, r.y+r.height/2]})()")
        await pg.mouse.move(*g); await pg.mouse.down(); await pg.mouse.move(g[0] - 700, g[1] + 40, steps=8); await pg.mouse.up(); await pg.wait_for_timeout(400)
        expect('after dragging to the left side', await pg.evaluate("document.querySelector('.lf-sw').dataset.anchor"), 'l')
        await pg.mouse.move(*await pg.evaluate("(()=>{const r=document.querySelector('.lf-sw-grip').getBoundingClientRect(); return [r.x+r.width/2, r.y+r.height/2]})()")); await pg.mouse.down()
        await pg.mouse.move(1000, 300, steps=8); await pg.mouse.up(); await pg.wait_for_timeout(400)
        expect('and back', await pg.evaluate("document.querySelector('.lf-sw').dataset.anchor"), 'r')

        print('== keyboard: space folds, enter opens, and the focus follows ==')
        await pg.evaluate("document.querySelector('.lf-sw-fold').focus()"); await pg.keyboard.press('Space'); await pg.wait_for_timeout(300)
        expect('folded by the keyboard, focus on the button', (await pg.evaluate(BOX))[2:] + [await pg.evaluate("document.activeElement.className")], [44, 44, 'lf-sw-dot'])
        await pg.keyboard.press('Enter'); await pg.wait_for_timeout(300)
        expect('opened by the keyboard, focus on the chevron', (await pg.evaluate(BOX))[2:] + [await pg.evaluate("document.activeElement.className")], [288, 52, 'lf-sw-fold'])
        await pg.mouse.click(*await pg.evaluate("(()=>{const r=document.querySelector('.lf-sw-fold').getBoundingClientRect(); return [r.x+r.width/2, r.y+r.height/2]})()")); await pg.wait_for_timeout(300)
        expect('a mouse click folds it and leaves no focus ring behind', (await pg.evaluate(BOX))[2:] + [await pg.evaluate("document.activeElement === document.body")], [44, 44, True])
        await pg.mouse.click(*await pg.evaluate("(()=>{const r=document.querySelector('.lf-sw-dot').getBoundingClientRect(); return [r.x+r.width/2, r.y+r.height/2]})()")); await pg.wait_for_timeout(300)
        expect('and a click opens it again', (await pg.evaluate(BOX))[2:], [288, 52])

        print('== left side: folds toward the left ==')
        await ctx.close()
        ctx, pg = await open_page(b, {'soundWidgetPos': {'x': 40, 'y': 200}})
        expect('chevron points toward the left edge', await pg.evaluate("document.querySelector('.lf-sw').dataset.anchor"), 'l')
        await pg.evaluate("document.querySelector('.lf-sw-fold').click()"); await pg.wait_for_timeout(300)
        expect('left end stays', (await pg.evaluate(BOX))[:2], [40, 200 + 26 - 22])

        print('== a drag moves the button, it does not open it ==')
        c = await pg.evaluate("(()=>{const r=document.querySelector('.lf-sw-dot').getBoundingClientRect(); return [r.x+r.width/2, r.y+r.height/2]})()")
        await pg.mouse.move(*c); await pg.mouse.down(); await pg.mouse.move(c[0] + 300, c[1] + 120, steps=8); await pg.mouse.up(); await pg.wait_for_timeout(400)
        expect('still the button after being dragged', (await pg.evaluate(BOX))[2:], [44, 44])
        moved = await pg.evaluate(BOX)
        expect('and it moved', moved[0] > 200, True)
        expect('position saved', (await pg.evaluate(SAVED))['soundWidgetPos'] == {'x': moved[0], 'y': moved[1]}, True)
        await pg.mouse.click(moved[0] + 22, moved[1] + 22); await pg.wait_for_timeout(400)
        expect('a plain tap opens it', (await pg.evaluate(BOX))[2:], [288, 52])

        print('== the choice survives a reload ==')
        await pg.evaluate("document.querySelector('.lf-sw-fold').click()"); await pg.wait_for_timeout(300)
        await pg.reload(); await pg.wait_for_function('window.__ready===true && !!window.__float'); await pg.wait_for_timeout(700)
        expect('starts folded', (await pg.evaluate(BOX))[2:], [44, 44])
        await pg.evaluate("document.querySelector('.lf-sw-dot').click()"); await pg.wait_for_timeout(300)
        await pg.reload(); await pg.wait_for_function('window.__ready===true && !!window.__float'); await pg.wait_for_timeout(700)
        expect('starts open', (await pg.evaluate(BOX))[2:], [288, 52])
        await ctx.close()

        print('== ambience off: the button says so ==')
        ctx, pg = await open_page(b, {'soundscape': False, 'soundWidgetCollapsed': True})
        expect('off, folded', await pg.evaluate("[document.querySelector('.lf-sw').dataset.on, document.querySelector('.lf-sw').dataset.collapsed, !!document.querySelector('.lf-sw-dot .lf-sw-w1')]"), ['0', '1', False])
        await ctx.close()

        print('== a phone: starts as the button, opens inside the screen ==')
        ctx, pg = await open_page(b, None, touch=True, size=(390, 844))
        expect('pointer is coarse', await pg.evaluate("matchMedia('(pointer: coarse)').matches"), True)
        expect('starts as the button (nothing saved yet)', (await pg.evaluate(BOX))[2:], [44, 44])
        expect('nothing was saved by just looking', (await pg.evaluate(SAVED)).get('soundWidgetCollapsed'), None)
        box = await pg.evaluate(BOX)
        expect('inside the screen, clear of the edge', box[0] >= 4 and box[0] + 44 <= 390 - 4 and box[1] >= 4, True)
        expect('a comfortable touch target', box[2] >= 44 and box[3] >= 44, True)
        await pg.evaluate("document.querySelector('.lf-sw-dot').click()"); await pg.wait_for_timeout(400)
        box = await pg.evaluate(BOX)
        expect('opens', box[2:], [288, 52])
        expect('and fits the screen', box[0] >= 4 and box[0] + 288 <= 390 and box[1] >= 4 and box[1] + 52 <= 844, True)
        expect('the choice is now saved', (await pg.evaluate(SAVED))['soundWidgetCollapsed'], False)
        await ctx.close()

        print('== a phone that chose the pill keeps it ==')
        ctx, pg = await open_page(b, {'soundWidgetCollapsed': False}, touch=True, size=(390, 844))
        expect('open on a phone because the user said so', (await pg.evaluate(BOX))[2:], [288, 52])
        await ctx.close()

        await b.close()
    print('errors', errs)
asyncio.run(main())
