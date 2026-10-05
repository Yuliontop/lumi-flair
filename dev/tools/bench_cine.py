"""How much work the browser does per second to show the light rays etc.: previous version of the layer vs now.

    python dev/run.py bench_cine.py [light ...]       # default: day dusk neon candle
Needs the baseline (see test_cinematic.py): bun dev/build.ts --baseline dev/out/base

Records a Chromium trace of a phone-sized page (430x932 at 3x, touch) with blurred message cards over a busy wallpaper, and adds up
what the browser spent per second: frames drawn, raster work, GPU work, main-thread painting. It is Chromium's software
renderer, not an iPhone: a relative signal (is the new layer lighter, and by how much?), not an absolute frame time.
"""
import asyncio, json, os, sys
from playwright.async_api import async_playwright

BASE = os.environ.get("LF_BASE", "http://localhost:8765")
LIGHTS = sys.argv[1:] or ['day', 'dusk', 'neon', 'candle']
SECONDS = 4
CATS = ['devtools.timeline', 'disabled-by-default-devtools.timeline', 'gpu', 'cc', 'viz', 'benchmark']
SUMS = {'frames drawn': ('count', {'DrawFrame', 'Display::DrawAndSwap', 'DrawAndSwap'}),
        'raster ms': ('ms', {'RasterTask', 'RasterizerTaskImpl::RunOnWorkerThread', 'TileManager::RasterizeTile'}),
        'gpu ms': ('ms', {'GPUTask', 'GLES2DecoderImpl::DoCommands', 'GpuChannel::HandleMessage', 'CommandBufferStub::OnAsyncFlush'}),
        'paint ms': ('ms', {'Paint', 'PaintLayer', 'UpdateLayer', 'Layerize', 'PrePaint', 'Commit'})}


def summarize(events):
    out = {k: 0.0 for k in SUMS}
    for e in events:
        for label, (kind, names) in SUMS.items():
            if e.get('name') in names and e.get('ph') in ('X', 'B'):
                out[label] += 1 if kind == 'count' else e.get('dur', 0) / 1000
    return {k: round(v / SECONDS, 1) for k, v in out.items()}


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width': 430, 'height': 932}, device_scale_factor=3, is_mobile=True, has_touch=True)
        pg = await ctx.new_page()
        await pg.goto(BASE + '/cine.html'); await pg.wait_for_function('window.__ready===true')
        if not await pg.evaluate('hasOld()'):
            sys.exit('no baseline: build one first (see the top of this file)')
        print(f"{'light':8} {'version':8} " + ' '.join(f'{k:>13}' for k in SUMS))
        for light in LIGHTS:
            for which in ['old', 'new']:
                await pg.evaluate(f"mount('{which}','{light}')"); await pg.wait_for_timeout(3400)  # past the fade-in
                await b.start_tracing(page=pg, categories=CATS)
                await pg.wait_for_timeout(SECONDS * 1000)
                data = json.loads(await b.stop_tracing())
                events = data['traceEvents'] if isinstance(data, dict) else data
                s = summarize(events)
                print(f'{light:8} {which:8} ' + ' '.join(f'{v:>13}' for v in s.values()))
        await b.close()

asyncio.run(main())
