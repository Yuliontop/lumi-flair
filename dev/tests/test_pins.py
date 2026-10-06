"""Pinned moments: the star under each message, the reel in the panel, the stars on the heartbeat.

Checks that a tap pins and unpins, that a selected line is what gets pinned (even if the tap clears the
selection), that pins survive a reload and a backup, that deleting a message removes its pin, that a pin
made while the saved copy is still loading is merged instead of replacing it, and the command.

Run from the repo root with the mock server up (see dev/README.md):
    python dev/run.py test_pins.py
"""
import os
BASE = os.environ.get("LF_BASE", "http://localhost:8765")
import asyncio, json
from playwright.async_api import async_playwright

errs = []

def expect(label, got, want):
    ok = got == want
    print(f"{'ok ' if ok else 'BAD'} {label}: {got}" + ('' if ok else f'  (wanted {want})'))
    if not ok: errs.append(f'{label}: got {got}, wanted {want}')

SEED = "if(!sessionStorage.x){sessionStorage.x=1; localStorage.setItem('lumi_flair:vault:settings', JSON.stringify({at:1,data:{welcomed:true}}))}"
STAR = lambda mid: f"document.querySelector(\"[data-message-id='{mid}'] .lf-pin-btn\")"
SAVED = "(()=>{const r=localStorage.getItem('lumi_flair:vault:moments'); return r? JSON.parse(r).data : null})()"
PINS = "(()=>{const r=localStorage.getItem('lumi_flair:vault:moments'); return r? (JSON.parse(r).data.c1||[]) : []})()"

async def boot(b, init='', size=(1280, 900)):
    ctx = await b.new_context(viewport={'width': size[0], 'height': size[1]})
    pg = await ctx.new_page()
    pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: m.type == 'error' and errs.append(m.text))
    await pg.add_init_script(SEED + init)
    await pg.goto(BASE + '/lumiverse.html'); await pg.wait_for_function('window.__ready===true'); await pg.wait_for_timeout(700)
    return ctx, pg

async def state(pg, mid):
    return await pg.evaluate(f"(()=>{{const b={STAR(mid)}; return b? [b.dataset.on, b.getAttribute('aria-pressed'), b.title] : null}})()")

async def select_text(pg, mid, sel):
    """Select the text of the element matching `sel` inside a message."""
    await pg.evaluate(f"""(()=>{{const el=document.querySelector("[data-message-id='{mid}'] {sel}"); const r=document.createRange(); r.selectNodeContents(el);
      const s=getSelection(); s.removeAllRanges(); s.addRange(r)}})()""")

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()

        print('== the star under each message, and what a tap does ==')
        ctx, pg = await boot(b)
        expect('a star on every kind of message (bubble, yours, minimal)', await pg.evaluate("[...document.querySelectorAll('.lf-pin-btn')].map(b=>b.closest('[data-message-id]').dataset.messageId)"), ['m1', 'm2', 'm3', 'm4'])
        expect('starts unpinned', await state(pg, 'm1'), ['0', 'false', 'Pin this moment'])
        expect('reel starts empty (with a note)', await pg.evaluate("document.querySelector('.lf-pin-list .lf-pin-empty')?.textContent"), 'No pinned moments in this chat yet.')
        await pg.evaluate(f"{STAR('m1')}.click()"); await pg.wait_for_timeout(700)
        expect('pinned: button turns on', await state(pg, 'm1'), ['1', 'true', 'Unpin this moment'])
        pins = await pg.evaluate(PINS)
        expect('saved: one pin, on that message', [x['id'] for x in pins], ['m1'])
        expect('it holds the start of the message (whole)', [pins[0]['text'].startswith('She leaned closer'), pins[0]['whole']], [True, True])
        expect('who said it (the page gave no name, so the character)', pins[0]['who'], 'Hazel')
        expect('reel shows it', await pg.evaluate("[...document.querySelectorAll('.lf-pin .lf-pin-who')].map(e=>e.textContent)"), ['Hazel'])
        expect('badge counts it', await pg.evaluate("document.querySelector('.lf-pin-list').closest('details').querySelector('.lf-badge').textContent"), '1')
        await pg.evaluate(f"{STAR('m2')}.click()"); await pg.wait_for_timeout(700)
        pins = await pg.evaluate(PINS)
        expect('your own message can be pinned too', [(x['id'], x['user'], x['who']) for x in pins if x['id'] == 'm2'], [('m2', True, '')])
        expect('...and the reel calls it "You"', await pg.evaluate("[...document.querySelectorAll('.lf-pin .lf-pin-who')].map(e=>e.textContent)"), ['Hazel', 'You'])
        await pg.evaluate(f"{STAR('m2')}.click()"); await pg.wait_for_timeout(700)
        expect('tapping again unpins', [await state(pg, 'm2'), [x['id'] for x in await pg.evaluate(PINS)]], [['0', 'false', 'Pin this moment'], ['m1']])

        print('== a selected line is what gets pinned ==')
        await select_text(pg, 'm4', '.B_bubble')
        sel = await pg.evaluate("getSelection().toString().trim().slice(0,40)")
        # a tap on a button may clear the selection before the click: the press itself reads it
        await pg.evaluate(f"""(()=>{{const b={STAR('m4')}; b.dispatchEvent(new PointerEvent('pointerdown',{{bubbles:true}})); getSelection().removeAllRanges(); b.click()}})()""")
        await pg.wait_for_timeout(700)
        pin = [x for x in await pg.evaluate(PINS) if x['id'] == 'm4']
        expect('pinned the selection, not the whole message', [len(pin), pin[0]['whole'] if pin else None, pin[0]['text'][:20] == sel[:20] if pin else None], [1, False, True])
        expect('reel quotes it', await pg.evaluate("[...document.querySelectorAll('.lf-pin-text')].map(e=>[e.dataset.whole, e.textContent.startsWith('“')])"), [['1', False], ['0', True]])
        await select_text(pg, 'm1', 'span[data-lf=whisper]')
        await pg.evaluate(f"{STAR('m1')}.dispatchEvent(new PointerEvent('pointerdown',{{bubbles:true}})); {STAR('m1')}.click()"); await pg.wait_for_timeout(700)
        pin = [x for x in await pg.evaluate(PINS) if x['id'] == 'm1']
        expect('a pinned message given a new selection takes the line (it is not unpinned)', [(await state(pg, 'm1'))[0], pin[0]['text'], pin[0]['whole']], ['1', 'leaned closer', False])
        await pg.evaluate("getSelection().removeAllRanges()")
        await select_text(pg, 'm1', 'span[data-lf=shake]')  # selected in m1; tapping m3's star must ignore it
        await pg.evaluate(f"{STAR('m3')}.dispatchEvent(new PointerEvent('pointerdown',{{bubbles:true}})); {STAR('m3')}.click()"); await pg.wait_for_timeout(700)
        pin = [x for x in await pg.evaluate(PINS) if x['id'] == 'm3']
        expect('a selection in another message is ignored', [pin[0]['whole'], pin[0]['text'].startswith('Minimal mode')], [True, True])

        print('== the heartbeat shows them as stars ==')
        for mid in ['m1', 'm4']:
            await pg.evaluate(f"__emit('GENERATION_ENDED',{{chatId:'c1',generationId:'g{mid}',messageId:'{mid}',content:'a happy day'}})"); await pg.wait_for_timeout(250)
        await pg.evaluate("document.querySelector('.lf-beat-host').closest('details').open=true"); await pg.wait_for_timeout(300)
        n_pins = len(await pg.evaluate(PINS))
        expect('one star per pin', await pg.evaluate("document.querySelectorAll('.lf-beat-host .lf-beat-star').length"), n_pins)
        expect('stars sit inside the chart', await pg.evaluate("""(()=>{const svg=document.querySelector('.lf-beat'); const v=svg.viewBox.baseVal; return [...svg.querySelectorAll('.lf-beat-star')].every(s=>{const b=s.getBBox(); return b.x>=-1&&b.y>=-1&&b.x+b.width<=v.width+1&&b.y+b.height<=v.height+1})})()"""), True)
        expect('a star has a tooltip with the line', await pg.evaluate("document.querySelector('.lf-beat-star title').textContent.startsWith('★')"), True)
        seen = len(errs)
        await pg.evaluate("document.querySelector('.lf-beat-star').dispatchEvent(new MouseEvent('click',{bubbles:true}))"); await pg.wait_for_timeout(500)
        expect('clicking a star jumps without errors', errs[seen:], [])

        print('== remove from the reel, and when the message is deleted ==')
        before = [x['id'] for x in await pg.evaluate(PINS)]
        await pg.evaluate("document.querySelectorAll('.lf-pin .lf-pin-acts button')[1].click()"); await pg.wait_for_timeout(700)
        after = [x['id'] for x in await pg.evaluate(PINS)]
        expect('Remove unpins the first one in the reel', [len(before) - len(after), (await state(pg, before[0]))[0]], [1, '0'])
        if 'm4' not in after:
            await pg.evaluate(f"{STAR('m4')}.click()"); await pg.wait_for_timeout(700)
        expect('(m4 is pinned before it is deleted)', 'm4' in [x['id'] for x in await pg.evaluate(PINS)], True)
        await pg.evaluate("__emit('MESSAGE_DELETED',{chatId:'c1',messageId:'m4'})"); await pg.wait_for_timeout(700)
        expect('a deleted message loses its pin', 'm4' in [x['id'] for x in await pg.evaluate(PINS)], False)
        await pg.evaluate("__emit('MESSAGE_DELETED',{chatId:'other-chat',messageId:'m3'})"); await pg.wait_for_timeout(500)
        expect('...but only in its own chat', 'm3' in [x['id'] for x in await pg.evaluate(PINS)], True)

        print('== the command ==')
        await pg.evaluate("window.__latest='m2'; window.__backend({type:'command', id:'pin'})"); await pg.wait_for_timeout(700)
        expect('pins the latest message', 'm2' in [x['id'] for x in await pg.evaluate(PINS)], True)
        await pg.evaluate("window.__backend({type:'command', id:'pin'})"); await pg.wait_for_timeout(700)
        expect('and again takes it off', 'm2' in [x['id'] for x in await pg.evaluate(PINS)], False)
        await pg.evaluate("document.querySelector('.lf-pin-list').closest('details').open=true")
        await pg.evaluate("[...document.querySelectorAll('.lf-btns button')].find(b=>b.textContent.includes('Pin the latest message')).click()"); await pg.wait_for_timeout(700)
        expect('the panel button does the same', 'm2' in [x['id'] for x in await pg.evaluate(PINS)], True)

        print('== survives a reload ==')
        keep = sorted(x['id'] for x in await pg.evaluate(PINS))
        await pg.reload(); await pg.wait_for_function('window.__ready===true'); await pg.wait_for_timeout(900)
        expect('same pins after a reload', sorted(x['id'] for x in await pg.evaluate(PINS)), keep)
        expect('stars are on again', [(await state(pg, mid))[0] for mid in keep], ['1'] * len(keep))
        expect('reel is drawn', len(await pg.evaluate("[...document.querySelectorAll('.lf-pin')]")), len(keep))
        await ctx.close()

        print('== a pin made while the saved copy is still loading is merged, not lost or overwriting ==')
        old = {'at': 5, 'data': {'c1': [{'id': 'm3', 'i': 3, 'text': 'An older pin', 'whole': True, 'who': 'Hazel', 'user': False, 'color': None, 't': 5}]}}
        ctx = await b.new_context(viewport={'width': 1280, 'height': 900}); pg = await ctx.new_page()
        pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: m.type == 'error' and errs.append(m.text))
        await pg.add_init_script(SEED + f"window.__backendDelay=1500; if(!localStorage.getItem('lumi_flair:vault:moments')) localStorage.setItem('lumi_flair:vault:moments', JSON.stringify({json.dumps(old)}));")
        await pg.goto(BASE + '/lumiverse.html')
        await pg.wait_for_function("!!document.querySelector('.lf-pin-btn')", timeout=8000)   # the buttons exist before the saved copy has loaded
        expect('tapped before the page is ready', await pg.evaluate("window.__ready===true"), False)
        await pg.evaluate(f"{STAR('m1')}.click()")
        await pg.wait_for_timeout(3500)
        expect('both the old pin and the new one are there', sorted(x['id'] for x in await pg.evaluate(PINS)), ['m1', 'm3'])
        await ctx.close()

        print('== junk in storage is cleaned, not trusted ==')
        junk = {'at': 9, 'data': {'c1': [{'id': 'm1', 'text': 'ok', 'i': 'x'}, {'id': 7, 'text': 'no id'}, 'nonsense', {'id': 'm4', 'text': ''}, {'id': 'm3', 'text': 'fine ' * 400, 'i': 2.7}], 'c2': 'nope'}}
        ctx, pg = await boot(b, f"localStorage.setItem('lumi_flair:vault:moments', JSON.stringify({json.dumps(junk)}));")
        await pg.evaluate(f"{STAR('m2')}.click()"); await pg.wait_for_timeout(800)
        pins = await pg.evaluate(PINS)
        expect('only well-formed pins kept, long text cut, index rounded', [(x['id'], len(x['text']) <= 421, x['i']) for x in pins], [('m1', True, 0), ('m3', True, 3), ('m2', True, 60)])
        expect('junk chat dropped', sorted((await pg.evaluate(SAVED)).keys()), ['c1'])
        await ctx.close()

        print('== a phone-sized window: the star is a real touch target and the reel fits ==')
        ctx, pg = await boot(b, '', size=(390, 844))
        box = await pg.evaluate(f"(()=>{{const r={STAR('m1')}.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]}})()")
        expect('star button size (same as the camera button)', box, await pg.evaluate("(()=>{const r=document.querySelector('.lf-moment-btn:not(.lf-pin-btn)').getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]})()"))
        await pg.evaluate(f"{STAR('m1')}.click()"); await pg.wait_for_timeout(700)
        await pg.evaluate("document.querySelector('.lf-pin-list').closest('details').open=true"); await pg.wait_for_timeout(200)
        expect('reel does not overflow sideways', await pg.evaluate("(()=>{const l=document.querySelector('.lf-pin-list'); return l.scrollWidth<=l.clientWidth+1})()"), True)
        await ctx.close()

        await b.close()
    print('errors', errs)
asyncio.run(main())
