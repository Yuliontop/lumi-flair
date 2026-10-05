"""Achievements: they survive a restart, even when the page wakes up while the saved copy is still loading.

The bug this guards: on a cold start (an iOS home-screen app, a slow server) the chat renders at once and
the host replays old messages' <flair scene="..."> tags through the extension while the saved achievements are
still being fetched. That used to unlock/save against an empty list and write it over the real one.

Run from the repo root with the mock server up (see dev/README.md):
    python dev/run.py test_achievements.py
"""
import os, sys
BASE = os.environ.get("LF_BASE", "http://localhost:8765")
import asyncio, json
from playwright.async_api import async_playwright

URL = BASE + '/lumiverse.html'
errs = []

def expect(label, got, want):
    ok = got == want
    print(f"{'ok ' if ok else 'BAD'} {label}: {got}" + ('' if ok else f'  (wanted {want})'))
    if not ok: errs.append(f'{label}: got {got}, wanted {want}')

SAVED = {'at': 1000, 'data': {'unlocked': {'night_owl': 1700000000000, 'first_spark': 1700000000001}, 'sent': 7, 'choices': 0,
         'scenes': ['rain'], 'lastDay': '2026-10-4', 'streak': 2, 'moodsByChat': {}}}

def init(delay=None, dead=False, saved=None, settings=True):
    # seeds once (sessionStorage), so a reload sees what the app itself wrote
    js = "window.__granted=['ui_panels'];"
    if delay: js += f"window.__backendDelay={delay};"
    if dead: js += "window.__backendDead=true;"
    seed = ""
    if settings: seed += "localStorage.setItem('lumi_flair:vault:settings', JSON.stringify({at:1,data:{welcomed:true}}));"
    if saved:
        s = json.dumps(saved)
        seed += (f"localStorage.setItem('lumi_flair:vault:achievements', {json.dumps(s)});"
                 f"localStorage.setItem('srv:acct:flair:achievements', {json.dumps(s)});"
                 f"localStorage.setItem('srv:file:achievements.json', {json.dumps(json.dumps({'lumiFlair': 'x', 'savedAt': 'x', **saved}))});")
    return js + "if(!sessionStorage.seeded){sessionStorage.seeded=1;" + seed + "}"

async def new_page(b, **kw):
    pg = await (await b.new_context(viewport={'width': 1280, 'height': 900})).new_page()
    pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: m.type == 'error' and errs.append(m.text))
    await pg.add_init_script(init(**kw))
    return pg

async def ready(pg):
    await pg.wait_for_function('window.__ready===true', timeout=20000); await pg.wait_for_timeout(900)

async def reload(pg):
    await pg.reload(); await ready(pg)

STORES = {'browser': "JSON.parse(localStorage.getItem('lumi_flair:vault:achievements')||'null')?.data",
          'account': "JSON.parse(localStorage.getItem('srv:acct:flair:achievements')||'null')?.data",
          'file': "JSON.parse(localStorage.getItem('srv:file:achievements.json')||'null')?.data"}
async def stored(pg, layer='browser'):
    return await pg.evaluate(STORES[layer]) or {}
async def shown(pg):
    """Badges the panel shows as earned."""
    return sorted(await pg.evaluate("[...document.querySelectorAll('#drawer .lf-badge-card.lf-got b')].map(b=>b.textContent)"))

SENT = "__emit('MESSAGE_SENT',{chatId:'c1',message:{id:'u%d',is_user:true,content:'hello there'}})"
EARLY_TAG = "__tag(" + json.dumps({'tagName': 'flair', 'attrs': {'scene': 'rain', 'mood': 'tense'}, 'content': '', 'fullMatch': '<flair scene="rain" mood="tense"></flair>',
                                   'messageId': 'old1', 'chatId': 'c1', 'isUser': False, 'isStreaming': False}) + ")"

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()

        print('== a fresh install: earn, restart, still earned ==')
        pg = await new_page(b)
        await pg.goto(URL); await ready(pg)
        expect('nothing earned yet', await shown(pg), [])
        expect('every badge is listed, locked, from the start', await pg.evaluate("document.querySelectorAll('#drawer .lf-badge-card').length"), 15)
        for i in range(3):
            await pg.evaluate(SENT % i); await pg.wait_for_timeout(150)
        await pg.wait_for_timeout(900)
        # (Night Owl / Early Bird also arrive at some hours of the day, so check membership, not the whole list)
        expect('earned First Spark (shown)', 'First Spark' in await shown(pg), True)
        for layer in STORES:
            d = await stored(pg, layer)
            expect(f'{layer} copy has it, sent', ('first_spark' in d.get('unlocked', {}), d.get('sent')), (True, 3))
        await reload(pg)
        expect('after a restart: still earned', 'First Spark' in await shown(pg), True)
        await pg.evaluate(SENT % 9); await pg.wait_for_timeout(900)
        expect('counter carries on across the restart', (await stored(pg)).get('sent'), 4)
        expect('no unlock card again for First Spark', await pg.evaluate("document.querySelectorAll('.lf-unlock').length"), 0)
        await pg.close()

        print('== leaving right after earning (no time for the 500 ms save) ==')
        pg = await new_page(b)
        await pg.goto(URL); await ready(pg)
        await pg.evaluate(SENT % 1)
        await pg.evaluate("document.dispatchEvent(new Event('visibilitychange'))")  # still 'visible': must not matter
        await pg.evaluate("Object.defineProperty(document,'visibilityState',{value:'hidden',configurable:true}); document.dispatchEvent(new Event('visibilitychange'))")
        expect('browser copy written on hide', 'first_spark' in (await stored(pg)).get('unlocked', {}), True)
        await pg.close()

        for label, kw in [('slow server (1.5 s)', dict(delay=1500)), ('dead server', dict(dead=True)), ('normal server', dict())]:
            print(f'== the page wakes up before saved progress has loaded: {label} ==')
            pg = await new_page(b, saved=SAVED, **kw)
            await pg.goto(URL)
            await pg.wait_for_function('!!(window.__tags && window.__tags.flair)')
            await pg.evaluate(EARLY_TAG)              # an old message with a scene tag is replayed at once
            await pg.wait_for_timeout(800)             # longer than the save debounce
            await ready(pg)
            await pg.wait_for_timeout(900)
            got = await shown(pg)  # straight after the panel is built, with no other event to prompt a redraw
            expect('earned badges kept', ('Night Owl' in got, 'First Spark' in got), (True, True))
            expect('the early scene tag still counted', 'Action!' in got, True)
            expect('section counter', await pg.evaluate("[...document.querySelectorAll('#drawer details')].find(d=>d.querySelector('.lf-sec-title').textContent==='Achievements').querySelector('.lf-badge').textContent"), '3/15')
            d = await stored(pg)
            expect('saved sent count kept', d.get('sent'), 7)
            await reload(pg)
            got = await shown(pg)
            expect('and after a restart', ('Night Owl' in got, 'First Spark' in got, 'Action!' in got), (True, True, True))
            expect('sent count after a restart', (await stored(pg)).get('sent'), 7)
            await pg.close()

        print('== a message sent before loading finishes is not lost or doubled ==')
        pg = await new_page(b, saved=SAVED, delay=1500)
        await pg.goto(URL)
        await pg.wait_for_function('!!(window.__tags && window.__tags.flair)')
        await pg.evaluate(SENT % 5)
        await ready(pg); await pg.wait_for_timeout(900)
        expect('sent = saved 7 + 1', (await stored(pg)).get('sent'), 8)
        await pg.close()

        print('== the unlock card clears the notch / status bar (iOS home-screen app) ==')
        cards = "[...document.querySelectorAll('.lf-unlock')].map(e=>{const r=e.getBoundingClientRect();return {top:Math.round(r.top),left:Math.round(r.left),right:Math.round(innerWidth-r.right)}})"
        async def two_cards(inset):
            """A phone-sized page; earns First Spark and Action! together, so two cards stack."""
            ctx = await b.new_context(viewport={'width': 390, 'height': 844}); pg = await ctx.new_page()
            pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: m.type == 'error' and errs.append(m.text))
            await pg.add_init_script(init())
            await pg.goto(URL); await ready(pg)
            if inset: await pg.evaluate(f"document.documentElement.style.setProperty('--app-interactive-safe-top','{inset}px')")
            await pg.evaluate(SENT % 1); await pg.evaluate(EARLY_TAG)
            await pg.wait_for_timeout(1000)  # they have slid in
            got = await pg.evaluate(cards)
            await ctx.close()
            return got
        got = await two_cards(0)
        print('   no inset:', got)
        expect('no inset (a desktop): first card at 18 px, the next 84 px below', [c['top'] for c in got][:2], [18, 102])
        got = await two_cards(59)
        print('   59 px inset:', got)
        expect('iPhone-sized inset (59 px): first card below it', [c['top'] for c in got][:2], [59 + 18, 59 + 18 + 84])
        expect('fits a 390 px phone', all(c['left'] >= 0 and c['right'] >= 18 for c in got), True)

        await b.close()
    print('errors', errs)
asyncio.run(main())
