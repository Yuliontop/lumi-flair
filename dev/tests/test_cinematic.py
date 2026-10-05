"""The cinematic layer (light rays, tint, neon, grain): cheap to run, and still the same picture.

Two kinds of check, on dev/mock/cine.html:
  * structure (always): nothing in the layer is drawn through a blend mode that isolates a group, a mask or a live filter,
    every animation moves only `transform` or `opacity` (the two the compositor can do without redrawing), nothing
    animates while it is invisible, the rays are a small image that follows the chat area's shape, and on a touch
    screen the sway is taken in steps;
  * parity (when a baseline is built): pixel comparison against the previous version of the layer, for every light,
    on a wallpaper that would show up any change in how it blends. Build the baseline first:
        git show <old commit>:src/cinematic.ts > dev/out/base/src/cinematic.ts   (and effects.ts)
        bun dev/build.ts --baseline dev/out/base

Run from the repo root with the mock server up (see dev/README.md):
    python dev/run.py test_cinematic.py
"""
import os, sys, io, json
BASE = os.environ.get("LF_BASE", "http://localhost:8765")
import asyncio
from playwright.async_api import async_playwright
from PIL import Image, ImageChops

URL = BASE + '/cine.html'
errs = []
LIGHTS = ['none', 'dawn', 'day', 'dusk', 'night', 'candle', 'storm', 'neon']
NO_TRANSITIONS = "document.head.insertAdjacentHTML('beforeend','<style>.lf-cine *,.lf-cine *::before,.lf-cine *::after{transition:none!important}</style>')"

def expect(label, got, want):
    ok = got == want
    print(f"{'ok ' if ok else 'BAD'} {label}: {got}" + ('' if ok else f'  (wanted {want})'))
    if not ok: errs.append(f'{label}: got {got}, wanted {want}')

def check(label, ok, detail=''):
    print(f"{'ok ' if ok else 'BAD'} {label}" + (f': {detail}' if detail else ''))
    if not ok: errs.append(f'{label} {detail}')

# What every element of the layer (and its ::before / ::after) is drawn with, and what each animation moves
AUDIT = """(()=>{
  const out={drawn:[],moves:[]};
  for (const el of document.querySelectorAll('.lf-cine, .lf-cine *')) for (const ps of [null,'::before','::after']) {
    const cs=getComputedStyle(el,ps); if(ps && cs.content==='none') continue;
    out.drawn.push({cls:(el.className||'')+(ps||''), blend:cs.mixBlendMode, filter:cs.filter, mask:cs.maskImage||cs.webkitMaskImage||'none', backdrop:cs.backdropFilter||'none'});
  }
  for (const a of document.getAnimations()) { const t=a.effect.target;
    out.moves.push({on:(t.className||t.tagName)+(a.effect.pseudoElement||''), props:[...new Set(a.effect.getKeyframes().flatMap(k=>Object.keys(k)))].filter(p=>!['offset','computedOffset','easing','composite'].includes(p)), visible:+getComputedStyle(t, a.effect.pseudoElement||null).opacity}) }
  return out })()"""

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await (await b.new_context(viewport={'width': 1280, 'height': 900})).new_page()
        pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: m.type == 'error' and 'Failed to load resource' not in m.text and errs.append(m.text))  # (the baseline bundle is optional: its 404 is expected)
        await pg.goto(URL); await pg.wait_for_function('window.__ready===true')
        await pg.evaluate(NO_TRANSITIONS)

        print('== structure: what each light is drawn with ==')
        for light in LIGHTS:
            await pg.evaluate(f"mount('new','{light}',{{grain:true}})"); await pg.wait_for_timeout(120)
            a = await pg.evaluate(AUDIT)
            bad_blend = [d['cls'] for d in a['drawn'] if d['blend'] not in ('normal', 'overlay') or (d['blend'] == 'overlay' and 'lf-grain' not in d['cls'])]
            check(f'{light}: no blend mode but the grain\'s', not bad_blend, str(bad_blend))
            check(f'{light}: no filter, mask or backdrop blur', all(d['filter'] == 'none' and d['mask'] == 'none' and d['backdrop'] == 'none' for d in a['drawn']), str([d for d in a['drawn'] if d['filter'] != 'none' or d['mask'] != 'none']))
            heavy = [m for m in a['moves'] if set(m['props']) - {'transform', 'opacity'}]
            check(f'{light}: every animation moves only transform / opacity', not heavy, str(heavy))
            invisible = [m for m in a['moves'] if m['visible'] == 0 and 'lf-neon' not in str(m) and m['on'] not in ('lf-tint', 'lf-tint::after')]
            check(f'{light}: nothing animates while invisible', not invisible, str(invisible))
        await pg.evaluate("mount('new','none',{grain:false})")
        expect('light none: no animation at all', len(await pg.evaluate("document.getAnimations()")), 0)

        print('== structure: the rays ==')
        await pg.evaluate("mount('new','day')"); await pg.wait_for_timeout(120)
        r = await pg.evaluate("""(()=>{const v=document.getElementById('view').getBoundingClientRect(), e=document.querySelector('.lf-rays'), r=e.getBoundingClientRect(), s=getComputedStyle(e);
          return {area:Math.round(r.width*r.height/(v.width*v.height)*100)/100, img:s.backgroundImage.slice(0,22), len:s.backgroundImage.length, anim:document.getAnimations().filter(a=>a.effect.target===e).length}})()""")
        print('  ', r)
        check('rays are a small box (< 0.6 of the chat area; it was 1.96)', r['area'] < 0.6, str(r['area']))
        check('rays are an image', r['img'].startswith('url("data:image/png'), r['img'])
        check('image is small (< 60 KB as text)', r['len'] < 60000, str(r['len']))
        expect('sway runs', r['anim'], 1)
        first = await pg.evaluate("getComputedStyle(document.querySelector('.lf-rays')).backgroundImage")
        await pg.set_viewport_size({'width': 1270, 'height': 895}); await pg.wait_for_timeout(300)
        same = await pg.evaluate("getComputedStyle(document.querySelector('.lf-rays')).backgroundImage")
        await pg.set_viewport_size({'width': 800, 'height': 900}); await pg.wait_for_timeout(300)
        other = await pg.evaluate("getComputedStyle(document.querySelector('.lf-rays')).backgroundImage")
        await pg.set_viewport_size({'width': 1280, 'height': 900})
        check('a small resize keeps the image', first == same)
        check('a change of shape repaints it', first != other)
        await pg.evaluate("mount('new','dusk')"); await pg.wait_for_timeout(120)
        dusk = await pg.evaluate("getComputedStyle(document.querySelector('.lf-rays')).backgroundImage")
        check('dusk rays are painted in their own colour', dusk != first)
        await pg.evaluate("mount('new','day',{saver:true})"); await pg.wait_for_timeout(120)
        expect('battery saver hides the rays', await pg.evaluate("getComputedStyle(document.querySelector('.lf-rays')).display"), 'none')
        expect('light rays count as animating (so the frame-rate governor watches them)', await pg.evaluate("mount('new','day'), layer.animating"), True)
        expect('light none does not', await pg.evaluate("mount('new','none'), layer.animating"), False)

        print('== structure: on a touch screen the sway is taken in steps ==')
        touch = await (await b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=3, is_mobile=True, has_touch=True)).new_page()
        touch.on('pageerror', lambda e: errs.append(str(e)))
        await touch.goto(URL); await touch.wait_for_function('window.__ready===true')
        expect('pointer is coarse', await touch.evaluate("matchMedia('(pointer: coarse)').matches"), True)
        await touch.evaluate("mount('new','day')"); await touch.wait_for_timeout(100)
        easing = await touch.evaluate("document.getAnimations().find(a=>a.effect.target.className==='lf-rays').effect.getKeyframes()[0].easing")
        check('easing is steps(60)', easing in ('steps(60)', 'steps(60, end)'), easing)
        seen = set()
        for _ in range(40):
            seen.add(await touch.evaluate("getComputedStyle(document.querySelector('.lf-rays')).transform")); await touch.wait_for_timeout(50)
        print('   distinct positions in 2 s:', len(seen))
        check('moves a few times a second, not every frame', len(seen) <= 12, str(len(seen)))
        await touch.close()

        print('== parity with the previous version ==')
        if not await pg.evaluate("hasOld()"):
            print('   (no baseline built: skipped. See the top of this file.)')
        else:
            async def shot(which, light, at, w, h, **extra):
                await pg.set_viewport_size({'width': w, 'height': h})
                await pg.evaluate(f"mount('{which}','{light}',{json.dumps(extra)})"); await pg.wait_for_timeout(150)
                await pg.evaluate(f"freeze({at})")
                return Image.open(io.BytesIO(await pg.screenshot())).convert('RGB')
            def diff(a, b):
                d = ImageChops.difference(a, b).convert('L'); px = list(d.getdata()); n = len(px)
                return sum(px) / n, max(px), sum(1 for v in px if v > 12) / n * 100
            # (light, time the animations are frozen at, allowed mean difference, allowed share of pixels off by more than 12 levels)
            for (w, h) in [(1280, 900), (390, 844)]:
                for light, at, mean_ok, share_ok in [('none', 0, 0.0, 0.0), ('night', 0, 0.6, 0.0), ('storm', 0, 0.6, 0.0), ('candle', 1000, 0.6, 0.0),  # (+-1 level: the old layer stack rounded differently)
                                                       ('day', 0, 0.5, 1.0), ('day', 4000, 0.5, 1.0), ('dawn', 9000, 0.5, 1.0), ('dusk', 0, 0.5, 1.0), ('dusk', 15000, 0.5, 1.0),
                                                       ('neon', 0, 0.0, 0.0), ('neon', 3000, 1.2, 2.0), ('neon', 5900, 1.5, 2.5)]:
                    a, bb = await shot('old', light, at, w, h), await shot('new', light, at, w, h)
                    mean, mx, share = diff(a, bb)
                    check(f'{w}x{h} {light} at {at} ms matches (mean diff {mean:.2f}, max {mx}, {share:.2f}% of pixels off by > 12)', mean <= mean_ok and share <= share_ok)
                    if os.environ.get('LF_SAVE_SHOTS'):
                        a.save(f'cine_{w}_{light}_{at}_old.png'); bb.save(f'cine_{w}_{light}_{at}_new.png')
        await b.close()
    print('errors', errs)
asyncio.run(main())
