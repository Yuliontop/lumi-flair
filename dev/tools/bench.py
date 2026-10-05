"""Deterministic CPU benchmark of send effects: drives 150 frames by hand, median of 5 runs.
rAF timing in a busy machine is too noisy; this measures the drawing work itself.

    python dev/run.py bench.py [effect ...]            # default: creamy splash blackhole petalstorm
To compare with an older version, build a baseline first:
    bun dev/build.ts --baseline path/to/old/checkout   (bundles its src/effects.ts as B_OLD)
"""
import asyncio, os, sys
from playwright.async_api import async_playwright

BASE = os.environ.get("LF_BASE", "http://localhost:8765")
EFFECTS = sys.argv[1:] or ['creamy', 'splash', 'blackhole', 'petalstorm']


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width': 1280, 'height': 900})
        await pg.goto(BASE + '/bench.html'); await pg.wait_for_function('window.B_NEW'); await pg.wait_for_timeout(300)
        libs = ['B_NEW'] + (['B_OLD'] if await pg.evaluate('!!window.B_OLD') else [])
        for eff in EFFECTS:
            for k in [1, 2]:
                row = [f'{eff:<11} {k}x']
                for lib in libs:
                    row.append(f"{'now' if lib == 'B_NEW' else 'baseline'} {await pg.evaluate(f'bench({lib!r},{eff!r},{k})')}")
                print(' | '.join(row))
        await b.close()

asyncio.run(main())
