"""Frame sheet of a send effect in dark + light themes.

    python dev/run.py effect_frames.py [effect] [k]      # default: splash 1
Writes dev/out/<effect>_frames.png and checks the canvas is fully cleared afterwards.
"""
import asyncio, os, sys
from playwright.async_api import async_playwright
from PIL import Image

BASE = os.environ.get("LF_BASE", "http://localhost:8765")
EFFECT = sys.argv[1] if len(sys.argv) > 1 else 'splash'
K = float(sys.argv[2]) if len(sys.argv) > 2 else 1
TS = [0.12, 0.3, 0.5, 0.75, 1.05, 1.45] if EFFECT not in ('blackhole', 'petalstorm') else [0.3, 1.0, 2.0, 3.0, 3.9, 4.5]


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); errs = []
        for theme in ['dark', 'light']:
            pg = await b.new_page(viewport={'width': 900, 'height': 760}); pg.on('pageerror', lambda e: errs.append(str(e)))
            await pg.goto(BASE + '/effects.html'); await pg.evaluate(f"document.body.className='{theme}'")
            await pg.evaluate(f"window.__t0=performance.now(); fireFx('{EFFECT}',{K})")
            for t in TS:
                await pg.wait_for_function(f"performance.now()-window.__t0 >= {t*1000-30}", polling=10)
                await pg.screenshot(path=f'_{EFFECT}_{theme}_{t}.png')
            await pg.wait_for_timeout(int(max(2500, TS[-1] * 1000)))
            print(theme, 'canvas clear afterwards:', await pg.evaluate("(()=>{const c=document.getElementById('c');const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;for(let i=3;i<d.length;i+=4)if(d[i])return false;return true})()"))
            await pg.close()
        W, H = 450, 380
        sheet = Image.new('RGB', (W * len(TS), H * 2))
        for r, th in enumerate(['dark', 'light']):
            for i, t in enumerate(TS):
                im = Image.open(f'_{EFFECT}_{th}_{t}.png').resize((W, H))
                sheet.paste(im, (i * W, r * H)); os.remove(f'_{EFFECT}_{th}_{t}.png')
        sheet.save(f'{EFFECT}_frames.png'); print('wrote', f'{EFFECT}_frames.png', '| errors', errs)
        await b.close()

asyncio.run(main())
