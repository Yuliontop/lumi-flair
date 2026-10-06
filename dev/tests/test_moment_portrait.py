"""Moment Card portrait: the round portrait is always fully covered, whatever the picture's shape, and uses the
character's own square crop (`extensions.avatar_crop_image_id`) when they have one.

Lumiverse's image addresses (/api/v1/images/<id>?size=…) are served by the test: a wide red picture, a slightly
tall orange one (the shape that left a gap at the top before 1.4.12) and a square green crop. The card's pixels
are read just inside the edge of the circle, at the top, bottom, left and right.

Run from the repo root with the mock server up (see dev/README.md):
    python dev/run.py test_moment_portrait.py
"""
import os, io
BASE = os.environ.get("LF_BASE", "http://localhost:8765")
import asyncio, json
from PIL import Image
from playwright.async_api import async_playwright

errs = []

def expect(label, got, want):
    ok = got == want
    print(f"{'ok ' if ok else 'BAD'} {label}: {got}" + ('' if ok else f'  (wanted {want})'))
    if not ok: errs.append(f'{label}: got {got}, wanted {want}')

def png(w, h, rgb):
    b = io.BytesIO(); Image.new('RGB', (w, h), rgb).save(b, 'PNG'); return b.getvalue()

IMAGES = {'wide1': png(600, 200, (230, 30, 30)), 'tall1': png(200, 260, (240, 150, 20)), 'crop1': png(300, 300, (30, 200, 60))}
SEED = "if(!sessionStorage.x){sessionStorage.x=1; localStorage.setItem('lumi_flair:vault:settings', JSON.stringify({at:1,data:{welcomed:true,intro:false}}))}"
# The portrait circle in the saved image: margin (96, 80) + card layout (centre 250, 423; radius 150).
CX, CY, R = 96 + 250, 80 + 423, 150
SPOTS = {'top': (CX, CY - R + 10), 'bottom': (CX, CY + R - 10), 'left': (CX - R + 10, CY), 'right': (CX + R - 10, CY)}

def colour(rgb):
    r, g, b = rgb[:3]
    if r > 180 and g < 80: return 'red'
    if r > 180 and 100 < g < 200 and b < 80: return 'orange'
    if g > 150 and r < 90: return 'green'
    return f'other{tuple(rgb[:3])}'

async def card_spots(pg, image_id, ext):
    await pg.evaluate(f"window.__charExt={json.dumps(ext)}")
    await pg.evaluate(f"document.querySelector('[data-message-id=m4] img').setAttribute('src', '/api/v1/images/{image_id}?size=sm')"); await pg.wait_for_timeout(300)
    await pg.evaluate("[...document.querySelectorAll('[data-message-id=m4] .lf-moment-btn')].find(b=>b.getAttribute('aria-label')==='Make a Moment Card').click()"); await pg.wait_for_timeout(1500)
    px = await pg.evaluate(f"""new Promise(r=>{{const i=window.__modal.root.querySelector('.lf-moment img'); const go=()=>{{const c=document.createElement('canvas'); c.width=i.naturalWidth; c.height=i.naturalHeight; const g=c.getContext('2d'); g.drawImage(i,0,0);
      r(Object.fromEntries(Object.entries({json.dumps(SPOTS)}).map(([k,[x,y]])=>[k,[...g.getImageData(x,y,1,1).data]])))}}; i.complete?go():i.onload=go}})""")
    await pg.evaluate("document.querySelector('.fake-modal')?.remove(); window.__modal=null")
    return {k: colour(v) for k, v in px.items()}

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width': 1280, 'height': 900})
        pg = await ctx.new_page()
        pg.on('pageerror', lambda e: errs.append(str(e)))
        asked = []
        async def serve(route):
            url = route.request.url; asked.append(url.split('/images/')[1])
            iid = url.split('/images/')[1].split('?')[0]
            await route.fulfill(status=200, content_type='image/png', body=IMAGES.get(iid, IMAGES['wide1']))
        await pg.route('**/api/v1/images/**', serve)
        await pg.add_init_script(SEED)
        await pg.goto(BASE + '/lumiverse.html'); await pg.wait_for_function('window.__ready===true'); await pg.wait_for_timeout(700)

        everywhere = lambda c: {'top': c, 'bottom': c, 'left': c, 'right': c}
        expect('a wide picture fills the whole circle', await card_spots(pg, 'wide1', {}), everywhere('red'))
        expect('a slightly tall picture fills it too (no gap at the top)', await card_spots(pg, 'tall1', {}), everywhere('orange'))
        asked.clear()
        expect('a character with a square crop: the circle shows the crop', await card_spots(pg, 'wide1', {'avatar_crop_image_id': 'crop1'}), everywhere('green'))
        expect('...asked for at the large size', 'crop1?size=lg' in asked, True)
        expect('a crop id that is not a plain id is ignored', await card_spots(pg, 'wide1', {'avatar_crop_image_id': '../../etc'}), everywhere('red'))
        await ctx.close(); await b.close()
    print('errors', errs)
asyncio.run(main())
