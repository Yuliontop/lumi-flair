"""Record a send effect to a GIF (needs ffmpeg on PATH).

    python dev/run.py record_gif.py [effect] [ms] [theme]     # default: splash 3400 dark
Writes dev/out/<effect>-preview.gif
"""
import asyncio, glob, os, shutil, subprocess, sys
from playwright.async_api import async_playwright

BASE = os.environ.get("LF_BASE", "http://localhost:8765")
EFFECT = sys.argv[1] if len(sys.argv) > 1 else 'splash'
MS = int(sys.argv[2]) if len(sys.argv) > 2 else 3400
THEME = sys.argv[3] if len(sys.argv) > 3 else 'dark'


async def main():
    vid = f'_vid_{EFFECT}'
    shutil.rmtree(vid, ignore_errors=True)
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width': 900, 'height': 760}, record_video_dir=vid, record_video_size={'width': 900, 'height': 760})
        pg = await ctx.new_page(); await pg.goto(BASE + '/effects.html'); await pg.evaluate(f"document.body.className='{THEME}'")
        await pg.wait_for_timeout(500)
        await pg.evaluate(f"fireFx('{EFFECT}',1)"); await pg.wait_for_timeout(MS)
        await ctx.close(); await b.close()
    src = glob.glob(f'{vid}/*.webm')[0]
    out = f'{EFFECT}-preview.gif'
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-ss', '0.45', '-t', str(MS / 1000 - 0.3), '-i', src, '-vf',
                    'fps=24,scale=600:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=128[p];[b][p]paletteuse=dither=bayer:bayer_scale=4', out], check=True)
    shutil.rmtree(vid, ignore_errors=True)
    print('wrote', out, os.path.getsize(out) // 1024, 'KB')

asyncio.run(main())
