"""AI sound-effect recipes, rendered offline: level, length and a silent tail for every cue.

You can't hear a test, so this checks what can be measured. To listen, open
http://localhost:8765/sfx.html and press the buttons.

Run from the repo root with the mock server up (see dev/README.md):
    python dev/run.py test_sfx_cues.py
"""
import os, sys
BASE = os.environ.get("LF_BASE", "http://localhost:8765")
import asyncio
from playwright.async_api import async_playwright

TAKES = int(os.environ.get("LF_TAKES", 8))  # recipes vary every time (some scatter events at random), so measure several takes and keep the worst. LF_TAKES=60 for a stricter look
PEAK_MAX, PEAK_MIN, LENGTH_MAX, TAIL_MAX = 1.2, 0.3, 3.0, 0.003
# Cues should sit together in a chat. Loudness is a rough proxy (see sfx.html); the heartbeat is sub-bass by design, so it is exempt.
LOUD_MIN, LOUD_MAX, LOUD_EXEMPT = -26.0, -12.0, {'heartbeat'}
# What each cue is meant to be, from the tone measurements (averaged over the takes). The first three were approved by ear; the rest follow the design.
# s = {'bands': [<150, 150-300, 300-1k, 1-3k, 3-8k, >8k as %], 'centroid': Hz, 'flat': 0-1, 't30': s}
CHARACTER = {
    'door-knock':   (lambda s: s['bands'][0] + s['bands'][1] >= 90 and s['bands'][0] >= 55, 'heavy: nearly all its energy under 300 Hz, most under 150'),
    'sword-clash':  (lambda s: s['flat'] >= 0.25 and s['t30'] <= 0.3 and s['centroid'] >= 3500, 'a dense, bright, quick crash, not a bell (flatness >= 0.25, fades in <= 0.3 s)'),
    'heartbeat':    (lambda s: s['bands'][0] >= 90, 'deep: >= 90% of its energy under 150 Hz'),
    'door-creak':   (lambda s: 1400 <= s['centroid'] <= 3500 and s['bands'][3] + s['bands'][4] >= 70 and s['flat'] <= 0.2, 'a thin, high, tonal squeal (centroid 1.4 - 3.5 kHz, mostly 1 - 8 kHz), as for an old door'),
    'door-slam':    (lambda s: s['bands'][0] + s['bands'][1] >= 90, 'heavy, like the knock'),
    'footsteps':    (lambda s: s['bands'][0] + s['bands'][1] >= 85, 'low thumps'),
    'glass-break':  (lambda s: s['centroid'] >= 3500 and s['flat'] <= 0.4, 'bright but not just hiss: pinging shards (centroid >= 3.5 kHz, flatness <= 0.4)'),
    'thunder':      (lambda s: s['bands'][0] + s['bands'][1] >= 85 and s['t30'] >= 0.5, 'a low, long roll (>= 85% under 300 Hz, takes >= 0.5 s to fade)'),
    'bell':         (lambda s: s['flat'] <= 0.1 and s['t30'] >= 0.6, 'a clear tone that rings (flatness <= 0.1, takes >= 0.6 s to fade)'),
    'whoosh':       (lambda s: 1500 <= s['centroid'] <= 5000 and s['flat'] >= 0.25, 'airy mid-range noise, not hiss (centroid 1.5 - 5 kHz)'),
    'impact':       (lambda s: s['bands'][0] + s['bands'][1] >= 90, 'a deep thud'),
    'magic':        (lambda s: s['flat'] <= 0.15 and 1200 <= s['centroid'] <= 4000, 'bright, tonal and shimmering'),
    'splash':       (lambda s: s['flat'] >= 0.3 and s['centroid'] >= 1500, 'noisy water'),
    'fire-crackle': (lambda s: s['flat'] >= 0.25 and s['t30'] <= 0.3, 'sparse pops over a low roar'),
}

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
        pg = await (await b.new_context()).new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: m.type == 'error' and errs.append(m.text))
        await pg.goto(BASE + '/sfx.html'); await pg.wait_for_function('window.__ready===true')
        cues = await pg.evaluate("Sfx.SFX_CUES.map(c=>c.name)")
        print('cues', cues)
        for cue in cues:
            takes = [await pg.evaluate(f"analyse('{cue}')") for _ in range(TAKES)]
            peak_hi, peak_lo = max(t['peak'] for t in takes), min(t['peak'] for t in takes)
            audible, tail = max(t['audible'] for t in takes), max(t['tail'] for t in takes)
            declared = takes[0]['declared']
            print(f"{cue:12} peak {peak_lo:.2f}-{peak_hi:.2f} | audible up to {audible:.2f}s (declared {declared:.2f}s) | tail {tail:.4f} | NaN {any(t['bad'] for t in takes)}")
            # tone, averaged over the takes (compare one version of a recipe with another; this doesn't replace listening)
            avg = lambda f: sum(f(t['tone']) for t in takes) / TAKES
            bands = [round(avg(lambda s, i=i: s['bands'][i])) for i in range(6)]
            loud = sum(t['loud'] for t in takes) / TAKES
            print(f"   tone: energy % <150/150-300/300-1k/1-3k/3-8k/>8k Hz {bands} | centroid {avg(lambda s: s['centroid']):.0f} Hz | flatness {avg(lambda s: s['flat']):.2f} | t30 {avg(lambda s: s['t30']):.2f}s | first 150 ms rms {avg(lambda s: s['body']):.2f} | loudness {loud:.1f} dB")
            mean = {'bands': bands, 'centroid': avg(lambda s: s['centroid']), 'flat': avg(lambda s: s['flat']), 't30': avg(lambda s: s['t30'])}
            ok, what = CHARACTER[cue]
            if not ok(mean): errs.append(f'{cue}: no longer {what}')
            if cue not in LOUD_EXEMPT and not LOUD_MIN <= loud <= LOUD_MAX: errs.append(f'{cue}: loudness {loud:.1f} dB is outside {LOUD_MIN} to {LOUD_MAX} (it would stick out, or vanish, next to the others)')
            if any(t['bad'] for t in takes): errs.append(f'{cue}: NaN or infinite samples')
            if peak_hi > PEAK_MAX: errs.append(f'{cue}: peak {peak_hi:.2f} is too hot (> {PEAK_MAX})')
            if peak_lo < PEAK_MIN: errs.append(f'{cue}: peak {peak_lo:.2f} is too quiet (< {PEAK_MIN})')
            if audible > LENGTH_MAX: errs.append(f'{cue}: audible for {audible:.2f}s (> {LENGTH_MAX}s)')
            if tail > TAIL_MAX: errs.append(f'{cue}: tail not silent ({tail:.4f})')
        # name matching: what the AI writes -> the cue it plays (null = ignored)
        names = ['door-knock', 'Door Knock', 'door_knock', 'knock', 'KNOCKING', 'sword clash', 'swords', 'heart-beat', 'heartbeat', 'owl-hoot', '', '../x', 'door-knock"><b>']
        print('cueName:', await pg.evaluate(f"Object.fromEntries({names}.map(n=>[n, Sfx.cueName(n)]))"))
        # every cue has a character guard, and every alias leads to a real cue
        if set(cues) != set(CHARACTER): errs.append(f'cues without a character guard (or the other way round): {sorted(set(cues) ^ set(CHARACTER))}')
        aliases = ['creak', 'door-open', 'slam', 'door-close', 'footstep', 'walking', 'glass-shatter', 'shattering', 'thunderclap', 'rumble', 'church-bell', 'ding', 'swoosh', 'punch', 'thud', 'spell', 'sparkle', 'water-splash', 'crackling', 'campfire', 'swing']
        resolved = await pg.evaluate(f"Object.fromEntries({aliases}.map(n=>[n, Sfx.cueName(n)]))")
        print('aliases ->', resolved)
        for a, c in resolved.items():
            if c not in cues: errs.append(f'alias {a} leads to {c}, which is not a cue')
        await b.close()
    print('errors', errs)
asyncio.run(main())
