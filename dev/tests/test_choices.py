"""Suggestion chips (<flair-choice>) follow the swipe on screen.

The bug: swiping a reply left the old chips in place, a new swipe's options were piled onto the old ones
(the oldest four won), and going back to a swipe brought nothing, because the host delivers a tag only once.

The host's side, which the mock imitates: a regenerate adds a BLANK swipe at the start (MESSAGE_SWIPED "added", empty
text) and fills it in at the end (MESSAGE_SWIPED "updated"); navigating fires MESSAGE_SWIPED "navigated" with the
whole message, whose `content` is the swipe now on screen. Tag interceptors only fire for a tag text they haven't
delivered for that message yet.

Run from the repo root with the mock server up (see dev/README.md):
    python dev/run.py test_choices.py
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
if(!sessionStorage.x){sessionStorage.x=1; localStorage.setItem('lumi_flair:vault:settings', JSON.stringify({at:1,data:Object.assign({welcomed:true,choiceChips:true},SEED)}))}
"""
MSG = 'm4'  # the newest message in the mock

def tags(*opts):
    return ''.join(f'<flair-choice>{o}</flair-choice>' for o in opts)

def tag(text, mid=MSG):
    full = f'<flair-choice>{text}</flair-choice>'
    return "__choice(" + json.dumps({'tagName': 'flair-choice', 'attrs': {}, 'content': text, 'fullMatch': full, 'messageId': mid, 'chatId': 'c1', 'isUser': False, 'isStreaming': False}) + ")"

def swiped(action, swipe_id, content, mid=MSG, prev=None):
    p = {'chatId': 'c1', 'action': action, 'swipeId': swipe_id, 'message': {'id': mid, 'swipe_id': swipe_id, 'content': content, 'swipes': ['…'] * (swipe_id + 1)}}
    if prev is not None: p['previousSwipeId'] = prev
    return "__emit('MESSAGE_SWIPED'," + json.dumps(p) + ")"

CHIPS = "[...document.querySelectorAll('.lf-choices')].map(g=>[...g.querySelectorAll('.lf-choice')].map(b=>b.textContent))"
SHOWN = "[...document.querySelectorAll('.lf-choice')].filter(b=>{for(let e=b;e;e=e.parentElement) if(e.hidden) return false; return true}).map(b=>b.textContent)"  # what a person would see

async def open_page(b, seed=None):
    pg = await (await b.new_context(viewport={'width': 1000, 'height': 800})).new_page()
    pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: m.type == 'error' and errs.append(m.text))
    await pg.add_init_script(INIT.replace('SEED', json.dumps(seed or {})))
    await pg.goto(BASE + '/lumiverse.html'); await pg.wait_for_function('window.__ready===true'); await pg.wait_for_timeout(800)
    return pg

async def settle(pg, ms=250):
    await pg.wait_for_timeout(ms)

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await open_page(b)

        print('== a reply with chips ==')
        for o in 'ABC': await pg.evaluate(tag(o))
        await settle(pg)
        expect('chips', await pg.evaluate(CHIPS), [['A', 'B', 'C']])

        print('== regenerate (a new swipe) ==')
        await pg.evaluate("__emit('GENERATION_STARTED',{chatId:'c1',generationId:'g1',generationType:'swipe',targetMessageId:'m4'})")
        await pg.evaluate(swiped('added', 1, ''))                       # the host adds a blank swipe first
        await settle(pg)
        expect('old chips go as soon as it starts', await pg.evaluate(CHIPS), [])
        await pg.evaluate(tag('D')); await pg.evaluate(tag('E'))        # the new reply renders: its tags are delivered
        await pg.evaluate(swiped('updated', 1, 'The new reply. ' + tags('D', 'E')))  # and the host fills in the swipe
        await settle(pg)
        expect('only the new swipe\'s chips (it used to be A B C D)', await pg.evaluate(CHIPS), [['D', 'E']])

        print('== swipe back and forth ==')
        await pg.evaluate(swiped('navigated', 0, 'The first reply. ' + tags('A', 'B', 'C'), prev=1)); await settle(pg)
        expect('back to the first: its chips return (the host won\'t deliver its tags again)', await pg.evaluate(CHIPS), [['A', 'B', 'C']])
        await pg.evaluate(swiped('navigated', 1, 'The new reply. ' + tags('D', 'E'), prev=0)); await settle(pg)
        expect('forward again', await pg.evaluate(CHIPS), [['D', 'E']])
        await pg.evaluate(swiped('navigated', 2, 'A swipe that offered no choices.', prev=1)); await settle(pg)
        expect('a swipe without chips shows none', await pg.evaluate(CHIPS), [])
        await pg.evaluate(swiped('navigated', 1, 'The new reply. ' + tags('D', 'E'), prev=2)); await settle(pg)
        expect('and they come back', await pg.evaluate(CHIPS), [['D', 'E']])

        print('== the tags can beat the swipe event, or the other way round ==')
        await pg.evaluate(tag('F')); await pg.evaluate(tag('G'))        # a swipe never seen before: tags first...
        await settle(pg, 120)
        await pg.evaluate(swiped('navigated', 3, 'Another. ' + tags('F', 'G'), prev=1)); await settle(pg)   # ...then the event
        expect('tags then event', await pg.evaluate(CHIPS), [['F', 'G']])
        await pg.evaluate(swiped('navigated', 4, 'Yet another. ' + tags('H', 'I'), prev=3))                  # event first...
        await pg.evaluate(tag('H')); await pg.evaluate(tag('I')); await settle(pg)                            # ...then tags
        expect('event then tags', await pg.evaluate(CHIPS), [['H', 'I']])

        print('== never a second set ==')
        for _ in range(5):
            await pg.evaluate(swiped('updated', 4, 'Yet another. ' + tags('H', 'I')))
            await pg.evaluate(tag('H')); await pg.evaluate(tag('I'))
        await settle(pg)
        expect('still one set', await pg.evaluate(CHIPS), [['H', 'I']])
        await pg.evaluate("document.querySelector('.lf-choices').dataset.mark='kept'")
        await pg.evaluate(swiped('updated', 4, 'Yet another. ' + tags('H', 'I'))); await settle(pg)
        expect('and the same chips (nothing is redrawn for no reason)', await pg.evaluate("document.querySelector('.lf-choices').dataset.mark"), 'kept')

        print('== the host puts an injection back when a row remounts: a queued replay must not bring the old set back ==')
        old = await pg.evaluate("(()=>{const w=document.querySelector('.lf-choices').parentElement; window.__oldWrap=w; return w.querySelectorAll('.lf-choice').length})()")
        await pg.evaluate(swiped('navigated', 0, 'The first reply. ' + tags('A', 'B', 'C'), prev=4)); await settle(pg)
        await pg.evaluate("document.querySelector('[data-message-id=m4]').appendChild(window.__oldWrap)")   # the late replay
        await settle(pg, 100)
        expect('what a person sees is just the current set', await pg.evaluate(SHOWN), ['A', 'B', 'C'])
        expect('the revived old wrapper is empty', await pg.evaluate("window.__oldWrap.querySelectorAll('.lf-choice').length"), 0)

        print('== things that must not show chips ==')
        await pg.evaluate("window.__latest='m9'")
        await pg.evaluate(swiped('navigated', 1, 'x ' + tags('P', 'Q'), prev=0)); await settle(pg)
        expect('a swipe of an older message', await pg.evaluate(CHIPS), [])
        await pg.evaluate("window.__latest=undefined")

        print('== a continued reply keeps its options; sending clears them ==')
        await pg.evaluate(swiped('navigated', 1, 'Reply. ' + tags('D', 'E'), prev=0)); await settle(pg)
        await pg.evaluate("__emit('GENERATION_STARTED',{chatId:'c1',generationId:'g2',generationType:'continue',targetMessageId:'m4'})"); await settle(pg)
        expect('hidden while it continues', await pg.evaluate(CHIPS), [])
        await pg.evaluate(tag('Z')); await settle(pg)
        expect('the options it had, plus the new one', await pg.evaluate(CHIPS), [['D', 'E', 'Z']])
        await pg.evaluate("__emit('MESSAGE_SENT',{chatId:'c1',message:{id:'u9',is_user:true,content:'hi'}})"); await settle(pg)
        expect('sending a message clears them', await pg.evaluate(CHIPS), [])
        await pg.evaluate(swiped('navigated', 1, 'Reply. ' + tags('D', 'E'), prev=0)); await settle(pg)   # (u9 is not the newest per the mock: m4 still is)
        await pg.close()

        print('== switched off ==')
        pg = await open_page(b, {'choiceChips': False})
        await pg.evaluate(tag('A')); await pg.evaluate(swiped('navigated', 1, 'x ' + tags('P', 'Q'), prev=0)); await settle(pg)
        expect('no chips with the setting off', await pg.evaluate(CHIPS), [])
        await pg.close()

        await b.close()
    print('errors', errs)
asyncio.run(main())
