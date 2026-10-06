"""Typewriter pacing: a streaming reply is revealed at a steady pace, with soft key sounds.

The mock streams a reply the way the host does: a card with data-part="streaming", text arriving in bursts,
each new chunk wrapped in a span of its own. What is not revealed yet is the `lf-typewriter` highlight (painted
transparent), so "hidden" below is the length of that highlight's text. Checks: new text is hidden before it
can be painted (no flash), the reveal is smooth and at the chosen pace, it never falls far behind, the rest
comes out quickly when the reply ends and the highlight goes, a continued reply keeps its old text, a closed
reasoning block doesn't hold it up, key sounds (on, off, how often), switching off / reduced motion / leaving
the chat, and the panel's preview.

Run from the repo root with the mock server up (see dev/README.md):
    python dev/run.py test_typewriter.py
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

SEED = lambda extra: "if(!sessionStorage.x){sessionStorage.x=1; localStorage.setItem('lumi_flair:vault:settings', JSON.stringify({at:1,data:Object.assign({welcomed:true,intro:false,typewriter:true,sound:true,typewriterCps:40}, %s)}))}" % json.dumps(extra)
INIT = r"""
window.__keys=0;
(()=>{ const C=window.AudioContext; const f=C.prototype.createBiquadFilter; C.prototype.createBiquadFilter=function(){window.__keys++; return f.call(this)} })();
// Stream like the host: a streaming card, and each chunk appended in its own span.
window.__card=(id, text, part)=>{const l=document.getElementById('list'); const c=document.createElement('div'); c.className='B_card B_character'; c.setAttribute('data-component','BubbleMessage'); c.setAttribute('data-part', part||'streaming'); c.setAttribute('data-message-id', id);
  c.innerHTML='<div class="B_bubble" style="padding:16px"><div data-component="MessageContent" class="mc"><p></p></div></div>'; if(text) c.querySelector('p').textContent=text; l.appendChild(c); return c};
window.__chunk=(id, text)=>{const p=document.querySelector(`[data-message-id='${id}'] [data-component=MessageContent] p`); const s=document.createElement('span'); s.className='chunkFade'; s.textContent=text; p.appendChild(s)};
window.__hidden=()=>{const h=CSS.highlights.get('lf-typewriter'); if(!h) return 0; let n=0; for(const r of h) n+=r.toString().length; return n};
window.__total=(id)=>document.querySelector(`[data-message-id='${id}'] [data-component=MessageContent]`).textContent.length;
"""
WORDS = 'the quiet hall echoed with her steps and somewhere far below a door closed softly '

async def boot(b, extra=None, reduced=False):
    ctx = await b.new_context(viewport={'width': 1280, 'height': 900}, reduced_motion='reduce' if reduced else 'no-preference')
    pg = await ctx.new_page()
    pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: m.type == 'error' and errs.append(m.text))
    await pg.add_init_script(SEED(extra or {}) + INIT)
    await pg.goto(BASE + '/lumiverse.html'); await pg.wait_for_function('window.__ready===true'); await pg.wait_for_timeout(700)
    await pg.mouse.click(600, 5)  # a gesture, so the audio can run
    return ctx, pg

def gen(gid, **kw):
    return f"__emit('GENERATION_STARTED',{json.dumps({'chatId': 'c1', 'generationId': gid, **kw})})"

def ended(gid, mid):
    return f"__emit('GENERATION_ENDED',{json.dumps({'chatId': 'c1', 'generationId': gid, 'messageId': mid, 'content': 'x'})})"

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])

        print('== a reply streams in bursts ==')
        ctx, pg = await boot(b)
        expect('the browser supports it', await pg.evaluate("!!(window.CSS && CSS.highlights && window.Highlight)"), True)
        await pg.evaluate(gen('g1')); await pg.wait_for_timeout(50)
        # the card appears with its first words, and they are hidden in the same task (before any paint)
        first = await pg.evaluate("(async()=>{__card('m10'); __chunk('m10', 'She turned toward the window. '); await Promise.resolve(); await Promise.resolve(); return [__hidden(), __total('m10')]})()")
        expect('new text is hidden before it can be painted (no flash)', first[0] >= first[1] - 2, True)
        samples = []
        for i in range(30):  # 3 s: a 20-character burst every 500 ms (40 a second, but lumpy)
            if i % 5 == 0: await pg.evaluate(f"__chunk('m10', {json.dumps(WORDS[:20])})")
            await pg.wait_for_timeout(100)
            samples.append(await pg.evaluate("[__total('m10') - __hidden(), __total('m10')]"))
        shown = [s[0] for s in samples]
        steps = [b2 - a for a, b2 in zip(shown, shown[1:])]
        print('   shown every 100 ms:', shown)
        expect('smooth: it never jumps by a burst at once (at most ~10 characters per 100 ms)', max(steps) <= 10, True)
        expect('steady: it keeps moving (no long stalls while there is text to show)', sum(1 for s, (sh, tot) in zip(steps, samples[1:]) if s == 0 and tot - sh > 5) <= 3, True)
        rate = (shown[-1] - shown[5]) / 2.4
        expect('about the chosen pace (40 a second)', 25 <= rate <= 60, True)
        print('   rate', round(rate, 1), '/s')
        print('-- a big burst --')
        await pg.evaluate(f"__chunk('m10', {json.dumps(WORDS * 8)})"); await pg.wait_for_timeout(1700)
        hid = await pg.evaluate("__hidden()")
        print('   hidden 1.7 s after a 650-character burst:', hid)
        expect('a big burst: it never stays more than ~1.5 s behind (60 characters at 40/s), it speeds up instead', hid <= 70, True)
        print('-- the end --')
        await pg.evaluate(f"__chunk('m10', {json.dumps(WORDS * 2)})"); await pg.wait_for_timeout(50)
        await pg.evaluate(ended('g1', 'm10')); await pg.evaluate("document.querySelector('[data-message-id=m10]').setAttribute('data-part','character')")
        await pg.wait_for_timeout(900)
        expect('when the reply ends the rest comes out quickly, and the highlight goes', [await pg.evaluate("__hidden()"), await pg.evaluate("CSS.highlights.has('lf-typewriter')")], [0, False])
        keys = await pg.evaluate("window.__keys")
        expect('key sounds played while it typed', keys > 20, True)
        expect('...but not a click per letter (at most ~18 a second)', keys <= 6.5 * 18, True)
        print('   keys', keys)
        print('-- a continued reply --')
        await pg.evaluate("__card('m11', 'This was already written. ', 'character')")
        await pg.evaluate(gen('g2', generationType='continue', targetMessageId='m11'))
        await pg.evaluate("document.querySelector('[data-message-id=m11]').setAttribute('data-part','streaming')")
        h = await pg.evaluate("(async()=>{__chunk('m11', 'And then she smiled, slowly.'); await Promise.resolve(); await Promise.resolve(); return __hidden()})()")
        expect('continue: the old text stays, only the new words are typed', 20 <= h <= len('And then she smiled, slowly.'), True)
        await pg.evaluate(ended('g2', 'm11')); await pg.evaluate("document.querySelector('[data-message-id=m11]').setAttribute('data-part','character')"); await pg.wait_for_timeout(900)
        print('-- a closed reasoning block --')
        await pg.evaluate(gen('g3'))
        await pg.evaluate("(()=>{const c=__card('m12'); c.querySelector('[data-component=MessageContent]').insertAdjacentHTML('afterbegin', '<details><summary>Thinking</summary><p>' + 'reasoning '.repeat(300) + '</p></details>')})()")
        await pg.evaluate("__chunk('m12', 'Short visible answer.')"); await pg.wait_for_timeout(1000)
        expect('text inside a closed block does not hold the reveal up (the answer is out within a second)', await pg.evaluate("(()=>{const h=CSS.highlights.get('lf-typewriter'); if(!h) return 0; let n=0; for(const r of h){ const s=r.toString(); n+=s.length - (s.match(/reasoning /g)||[]).length*10 } return n})()") <= 2, True)
        await pg.evaluate(ended('g3', 'm12')); await pg.evaluate("document.querySelector('[data-message-id=m12]').setAttribute('data-part','character')"); await pg.wait_for_timeout(800)
        print('-- leaving the chat mid-reply --')
        await pg.evaluate(gen('g4')); await pg.evaluate("__card('m13'); __chunk('m13', " + json.dumps(WORDS * 4) + ")"); await pg.wait_for_timeout(200)
        expect('mid-reply: some text still hidden', await pg.evaluate("__hidden()") > 0, True)
        await pg.evaluate("window.__active={chatId:'c2',characterId:'char1'}; __emit('CHAT_SWITCHED',{chatId:'c2'})"); await pg.wait_for_timeout(300)
        expect('switching chats shows everything at once', await pg.evaluate("CSS.highlights.has('lf-typewriter')"), False)
        await ctx.close()

        print('== off, sounds off, reduced motion ==')
        for label, extra, reduced, want_keys in (('switched off', {'typewriter': False}, False, None), ('reduced motion', {}, True, None), ('key sounds off', {'typewriterSound': False}, False, 0), ('interface sounds off', {'sound': False}, False, 0)):
            ctx, pg = await boot(b, extra, reduced)
            await pg.evaluate(gen('g1')); await pg.evaluate("__card('m10'); __chunk('m10', " + json.dumps(WORDS * 3) + ")"); await pg.wait_for_timeout(600)
            if want_keys is None:
                expect(f'{label}: nothing is hidden', await pg.evaluate("CSS.highlights.has('lf-typewriter')"), False)
            else:
                expect(f'{label}: it still types, silently', [await pg.evaluate("__hidden()") > 0, await pg.evaluate("window.__keys")], [True, 0])
            await ctx.close()

        print('== turned off mid-reply ==')
        ctx, pg = await boot(b)
        await pg.evaluate(gen('g1')); await pg.evaluate("__card('m10'); __chunk('m10', " + json.dumps(WORDS * 4) + ")"); await pg.wait_for_timeout(200)
        await pg.evaluate("[...document.querySelectorAll('#drawer [role=switch]')].find(s=>s.getAttribute('aria-label')==='Typewriter reveal').click()"); await pg.wait_for_timeout(100)
        await pg.evaluate("__chunk('m10', 'more')"); await pg.wait_for_timeout(100)
        expect('everything shows as soon as it is switched off', await pg.evaluate("CSS.highlights.has('lf-typewriter')"), False)
        await ctx.close()

        print('== the panel ==')
        ctx, pg = await boot(b, {'typewriter': False})
        sec = "[...document.querySelectorAll('#drawer details')].find(d=>d.querySelector('.lf-sec-title').textContent==='Typewriter pacing')"
        expect('the section and its controls', await pg.evaluate(f"[...({sec}).querySelectorAll('.lf-row .lf-label, .R_labeledLabel, .lf-btn')].map(e=>e.textContent.trim())"), ['Typewriter reveal', 'Typing speed', 'Key sounds', 'Preview typewriter'])
        expect('"Typewriter key" can take your own sound', await pg.evaluate("[...document.querySelectorAll('#drawer select option')].some(o=>o.textContent.includes('Typewriter key'))"), True)
        await pg.evaluate(f"({sec}).open=true")
        demo = f"({sec}).querySelector('.lf-tw-demo')"
        n = await pg.evaluate(f"{demo}.textContent.length")
        await pg.evaluate(f"[...({sec}).querySelectorAll('button')].find(b=>b.textContent.includes('Preview typewriter')).click()"); await pg.wait_for_timeout(1000)
        mid = await pg.evaluate("__hidden()")
        expect('Preview types out the sample (even with the reveal itself off), at the chosen pace', 0 < mid < n, True)
        await pg.wait_for_timeout(n / 40 * 1000 + 800)
        expect('...and finishes, with key sounds', [await pg.evaluate("CSS.highlights.has('lf-typewriter')"), await pg.evaluate("window.__keys") > 5], [False, True])
        await ctx.close()
        await b.close()
    print('errors', errs)
asyncio.run(main())
