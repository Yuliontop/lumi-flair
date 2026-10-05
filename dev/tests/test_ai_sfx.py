"""AI sound effects (<flair sfx="…">): when a cue plays, and when it must not.

Fires the tag interceptor the way the host does (streaming, then the final render) and
counts what reaches the speakers. Every cue ends in a gain node wired to the destination;
a cue with one of the user's files plays through a buffer source instead.

Run from the repo root with the mock server up (see dev/README.md):
    python dev/run.py test_ai_sfx.py
"""
import os, sys
BASE = os.environ.get("LF_BASE", "http://localhost:8765")
import asyncio, json
from playwright.async_api import async_playwright

INIT = r"""
window.__granted=['ui_panels'];
window.__plays=[]; window.__srcs=[];
(()=>{
  const conn=AudioNode.prototype.connect;
  AudioNode.prototype.connect=function(d,...r){ if(d instanceof AudioDestinationNode && this instanceof GainNode) window.__plays.push({gain:Math.round(this.gain.value*1000)/1000, t:Math.round(performance.now())}); return conn.call(this,d,...r) };
  const C=window.AudioContext, cbs=C.prototype.createBufferSource;
  C.prototype.createBufferSource=function(){const n=cbs.call(this); const st=n.start.bind(n); n.start=(...a)=>{window.__srcs.push({dur:n.buffer?Math.round(n.buffer.duration*10)/10:null}); return st(...a)}; return n};
})();
if(!sessionStorage.x){sessionStorage.x=1; localStorage.setItem('lumi_flair:vault:settings', JSON.stringify({at:1,data:Object.assign({welcomed:true},SEED)}))}
"""
SW = "(lbl)=>[...document.querySelectorAll('#drawer .lf-row')].find(r=>r.querySelector('.lf-label')?.textContent===lbl)?.querySelector('[role=switch]')"
errs = []
# Every cue, in panel order: (name, label)
CUES = [('door-knock', 'Door knock'), ('door-creak', 'Door creak'), ('door-slam', 'Door slam'), ('footsteps', 'Footsteps'), ('sword-clash', 'Sword clash'),
        ('glass-break', 'Glass break'), ('heartbeat', 'Heartbeat'), ('thunder', 'Thunder'), ('bell', 'Bell'), ('whoosh', 'Whoosh'), ('impact', 'Impact'),
        ('magic', 'Magic'), ('splash', 'Splash'), ('fire-crackle', 'Fire crackle')]
LABELS = [l for _, l in CUES]

def expect(label, got, want):
    ok = got == want
    print(f"{'ok ' if ok else 'BAD'} {label}: {got}" + ('' if ok else f'  (wanted {want})'))
    if not ok: errs.append(f'{label}: got {got}, wanted {want}')

def tag(cue, mid, streaming, full=None, content=''):
    full = full or f'<flair sfx="{cue}"></flair>'
    return "__tag(" + json.dumps({'tagName': 'flair', 'attrs': {'sfx': cue}, 'content': content, 'fullMatch': full, 'messageId': mid, 'chatId': 'c1', 'isUser': False, 'isStreaming': streaming}) + ")"

async def open_page(b, seed):
    pg = await (await b.new_context(viewport={'width': 1280, 'height': 900})).new_page()
    pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: m.type == 'error' and errs.append(m.text))
    await pg.add_init_script(INIT.replace('SEED', json.dumps(seed)))
    await pg.goto(BASE + '/lumiverse.html'); await pg.wait_for_function('window.__ready===true'); await pg.wait_for_timeout(1200)
    await pg.mouse.click(5, 5)
    return pg

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])

        print('== defaults: off ==')
        pg = await open_page(b, {})
        expect('switch on by default?', await pg.evaluate(f"({SW})('AI sound effects').className.includes('switchOn')"), False)
        await pg.evaluate("__emit('GENERATION_STARTED',{chatId:'c1',generationId:'g0'})")
        await pg.evaluate(tag('door-knock', 'd1', True)); await pg.wait_for_timeout(300)
        expect('streamed cue with the toggle off -> plays', await pg.evaluate("__plays.length"), 0)
        prefs = await pg.evaluate("__sent.filter(m=>m.type==='prefs').map(m=>m.sfx)")
        expect('backend told sfx is', prefs[-1] if prefs else None, False)
        await pg.close()

        print('== on: panel ==')
        pg = await open_page(b, {'aiSfx': True, 'sfxVolume': 0.5})
        sec = "[...document.querySelectorAll('#drawer details')].find(d=>d.querySelector('.lf-sec-title').textContent==='Sound')"
        expect('toggle present', await pg.evaluate(f"!!({SW})('AI sound effects')"), True)
        expect('volume slider present, at', await pg.evaluate("[...document.querySelectorAll('#drawer .R_labeledRow')].filter(r=>r.textContent.includes('Effects volume')).map(r=>r.querySelector('input[type=range]')?.max+'/'+r.querySelector('.R_labeledValue')?.textContent)"), ['100/50'])  # 0-1 scaled to 0-100, shown as %
        expect('preview buttons', await pg.evaluate(f"[...{sec}.querySelectorAll('button')].map(b=>b.textContent.trim()).filter(t=>{json.dumps(LABELS)}.includes(t))"), LABELS)
        slot = "[...document.querySelectorAll('#drawer select')].find(s=>[...s.options].some(o=>o.value==='sfx:door-knock'))"
        expect('file slots offered', await pg.evaluate(f"[...{slot}.options].filter(o=>o.value.startsWith('sfx:')).map(o=>o.value)"), ['sfx:' + n for n, _ in CUES])
        print('   slot labels:', await pg.evaluate(f"[...{slot}.options].filter(o=>o.value.startsWith('sfx:')).map(o=>o.textContent)"))
        prefs = await pg.evaluate("__sent.filter(m=>m.type==='prefs').map(m=>[m.sfx,m.autoInject])")
        expect('backend told [sfx, autoInject]', prefs[-1], [True, True])
        for label in LABELS:
            n0 = await pg.evaluate("__plays.length")
            await pg.evaluate(f"[...{sec}.querySelectorAll('button')].find(b=>b.textContent.trim()==='{label}').click()"); await pg.wait_for_timeout(250)
            now = await pg.evaluate("__plays.slice(%d)" % n0)
            expect(f'preview {label} -> plays, at gain', [x['gain'] for x in now], [0.3])
        print('== every cue, streamed, by name (and a few of the AI\'s near-misses) ==')
        await pg.evaluate("__emit('GENERATION_STARTED',{chatId:'c1',generationId:'g0'})")
        for i, (name, _) in enumerate(CUES + [('knocking', ''), ('Church Bell', ''), ('thunderclap', ''), ('campfire', '')]):
            n0 = await pg.evaluate("__plays.length")
            await pg.evaluate(tag(name, f'all{i}', True)); await pg.wait_for_timeout(760)  # one message each: the cap is per message
            expect(f'sfx="{name}" plays', await pg.evaluate("__plays.length") - n0, 1)

        print('== streaming ==')
        await pg.evaluate("__emit('GENERATION_STARTED',{chatId:'c1',generationId:'g1'})")
        n = await pg.evaluate("__plays.length")
        await pg.evaluate(tag('door-knock', 'm9', True)); await pg.wait_for_timeout(250)
        expect('streamed cue plays once, at gain', [x['gain'] for x in await pg.evaluate("__plays.slice(%d)" % n)], [0.3])
        await pg.evaluate(tag('door-knock', 'm9', True)); await pg.wait_for_timeout(250)
        expect('same streamed tag delivered again', await pg.evaluate("__plays.length") - n, 1)
        await pg.evaluate("__emit('GENERATION_ENDED',{chatId:'c1',messageId:'m9',generationId:'g1',content:'Knock knock.'})")
        await pg.evaluate(tag('door-knock', 'm9', False)); await pg.wait_for_timeout(1000)
        expect('final render after streaming does not replay', await pg.evaluate("__plays.length") - n, 1)
        await pg.evaluate(tag('Sword Clash', 'm9', True, full='<flair sfx="Sword Clash"></flair>')); await pg.wait_for_timeout(900)
        expect('"Sword Clash" (case, space) plays', await pg.evaluate("__plays.length") - n, 2)
        await pg.evaluate(tag('owl-hoot', 'm9', True, full='<flair sfx="owl-hoot"></flair>')); await pg.wait_for_timeout(900)
        expect('unknown cue is ignored', await pg.evaluate("__plays.length") - n, 2)

        print('== old messages ==')
        n = await pg.evaluate("__plays.length")
        await pg.evaluate(tag('heartbeat', 'old1', False)); await pg.wait_for_timeout(1200)
        expect('old message rendered (no live generation) -> plays', await pg.evaluate("__plays.length") - n, 0)
        await pg.evaluate("__emit('GENERATION_ENDED',{chatId:'c1',messageId:'someone-else',generationId:'g2',content:'x'})"); await pg.wait_for_timeout(1200)
        expect('another message finishing does not release it', await pg.evaluate("__plays.length") - n, 0)

        print('== reply that was not streamed ==')
        n = await pg.evaluate("__plays.length")
        await pg.evaluate(tag('door-knock', 'm30', False)); await pg.evaluate(tag('heartbeat', 'm30', False))
        await pg.wait_for_timeout(500)
        expect('held until the reply is finished', await pg.evaluate("__plays.length") - n, 0)
        await pg.evaluate("__emit('GENERATION_ENDED',{chatId:'c1',messageId:'m30',generationId:'g3',content:'x'})"); await pg.wait_for_timeout(2200)
        got = await pg.evaluate("__plays.slice(%d)" % n)
        expect('both cues play', len(got), 2)
        if len(got) == 2:
            gap = got[1]['t'] - got[0]['t']
            expect('spaced out (>= 650 ms)', gap >= 650, True); print('   gap', gap, 'ms')

        print('== at most 4 per message ==')
        await pg.evaluate("__emit('GENERATION_STARTED',{chatId:'c1',generationId:'g4'})")
        n = await pg.evaluate("__plays.length")
        for i in range(6):
            await pg.evaluate(tag('door-knock', 'm40', True, full=f'<flair sfx="door-knock" n="{i}"></flair>'))
        await pg.wait_for_timeout(5200)
        expect('six distinct cues in one message', await pg.evaluate("__plays.length") - n, 4)

        print('== regenerate / swipe ==')
        await pg.evaluate("__emit('GENERATION_STARTED',{chatId:'c1',generationId:'g5'})")
        n = await pg.evaluate("__plays.length")
        await pg.evaluate(tag('door-knock', 'm9', True)); await pg.wait_for_timeout(900)
        expect('same cue in the new take of m9 plays again', await pg.evaluate("__plays.length") - n, 1)
        await pg.evaluate(tag('door-knock', 'm9', False)); await pg.wait_for_timeout(900)
        expect('scrolling past it afterwards stays silent', await pg.evaluate("__plays.length") - n, 1)

        print('== a cue tag does not also fire a screen effect ==')
        ach = lambda: pg.evaluate("localStorage.getItem('lumi_flair:vault:achievements')||''")
        await pg.evaluate("__emit('GENERATION_STARTED',{chatId:'c1',generationId:'g6'})")
        await pg.evaluate("__emit('GENERATION_ENDED',{chatId:'c1',messageId:'m60',generationId:'g6',content:'x'})")
        await pg.evaluate(tag('door-knock', 'm60', False, content='knock')); await pg.wait_for_timeout(1500)
        expect('<flair sfx>knock</flair> unlocks the screen-effect badge?', 'showstopper' in await ach(), False)
        await pg.evaluate("__emit('GENERATION_ENDED',{chatId:'c1',messageId:'m61',generationId:'g6',content:'x'})")
        await pg.evaluate("__tag(%s)" % json.dumps({'tagName': 'flair', 'attrs': {}, 'content': 'confetti', 'fullMatch': '<flair>confetti</flair>', 'messageId': 'm61', 'chatId': 'c1', 'isStreaming': False})); await pg.wait_for_timeout(1500)
        expect('control: <flair>confetti</flair> does', 'showstopper' in await ach(), True)

        print('== switching it off and on ==')
        await pg.evaluate(f"({SW})('AI sound effects').click()"); await pg.wait_for_timeout(500)
        prefs = await pg.evaluate("__sent.filter(m=>m.type==='prefs').map(m=>[m.sfx,m.autoInject])")
        expect('backend told [sfx, autoInject] after switching off', prefs[-1], [False, True])
        await pg.evaluate("__emit('GENERATION_STARTED',{chatId:'c1',generationId:'g7'})")
        n = await pg.evaluate("__plays.length")
        await pg.evaluate(tag('door-knock', 'm70', True)); await pg.wait_for_timeout(900)
        expect('switched off -> silent', await pg.evaluate("__plays.length") - n, 0)
        await pg.evaluate(f"({SW})('AI sound effects').click()"); await pg.wait_for_timeout(500)
        await pg.evaluate(tag('door-knock', 'm71', True)); await pg.wait_for_timeout(900)
        expect('switched on again -> plays', await pg.evaluate("__plays.length") - n, 1)
        await pg.close()

        print('== in the background ==')
        for mode, want in (('dim', [0.09]), ('mute', []), ('keep', [0.3])):
            pg = await open_page(b, {'aiSfx': True, 'sfxVolume': 0.5, 'soundUnfocused': mode, 'soundUnfocusedLevel': 0.3})
            await pg.evaluate("document.hasFocus=()=>false; window.dispatchEvent(new Event('blur'))"); await pg.wait_for_timeout(200)
            await pg.evaluate("__emit('GENERATION_STARTED',{chatId:'c1',generationId:'g1'})")
            await pg.evaluate(tag('heartbeat', 'b1', True)); await pg.wait_for_timeout(500)
            expect(f'window blurred, "{mode}" -> gains played', [x['gain'] for x in await pg.evaluate("__plays")], want)
            await pg.close()

        print('== level 0 ==')
        pg = await open_page(b, {'aiSfx': True, 'sfxVolume': 0})
        await pg.evaluate("__emit('GENERATION_STARTED',{chatId:'c1',generationId:'g1'})")
        await pg.evaluate(tag('heartbeat', 'z1', True)); await pg.wait_for_timeout(500)
        expect('effects volume 0 -> silent', await pg.evaluate("__plays.length"), 0)
        await pg.close()

        print('== your own file for a cue ==')
        pg = await open_page(b, {'aiSfx': True, 'sfxVolume': 0.5})
        mine = "[...document.querySelectorAll('#drawer details')].find(d=>d.querySelector('.lf-sec-title').textContent==='Your sounds')"
        await pg.evaluate("""(async()=>{const r=await fetch('fixtures/ding.wav');const b=new Uint8Array(await r.arrayBuffer());window.__pickFiles=[{name:'ding.wav',mimeType:'audio/wav',sizeBytes:b.length,bytes:b}]})()""")
        await pg.evaluate(f"[...{mine}.querySelectorAll('button')].find(b=>b.textContent.includes('Upload sounds')).click()"); await pg.wait_for_timeout(2000)
        sid = await pg.evaluate("(async()=>{const db=await new Promise(r=>{const o=indexedDB.open('lumi_flair_sounds');o.onsuccess=()=>r(o.result)}); return await new Promise(r=>{const q=db.transaction('meta').objectStore('meta').getAll(); q.onsuccess=()=>r(q.result.map(m=>m.id))})})()")
        expect('file uploaded', len(sid), 1)
        sels = f"[...{mine}.querySelectorAll('select')]"
        await pg.evaluate(f"(()=>{{const [a,b]={sels}; a.value='sfx:door-knock'; a.dispatchEvent(new Event('change')); b.value='{sid[0]}'; b.dispatchEvent(new Event('change'))}})()"); await pg.wait_for_timeout(900)
        print('   assigned:', await pg.evaluate(f"[...{mine}.querySelectorAll('.lf-snd-pair')].map(p=>p.textContent)"))
        await pg.evaluate("__emit('GENERATION_STARTED',{chatId:'c1',generationId:'g1'})")
        s0 = await pg.evaluate("__srcs.length")
        await pg.evaluate(tag('door-knock', 'f1', True)); await pg.wait_for_timeout(900)
        durs = [x['dur'] for x in await pg.evaluate("__srcs.slice(%d)" % s0)]
        expect('door-knock plays your file (0.5 s), not the built-in knock (1.5 s noise)', durs, [0.5])
        s1 = await pg.evaluate("__srcs.length")
        await pg.evaluate(tag('heartbeat', 'f1', True)); await pg.wait_for_timeout(900)
        expect('heartbeat (no file assigned) still uses the built-in', 0.5 not in [x['dur'] for x in await pg.evaluate("__srcs.slice(%d)" % s1)], True)
        await pg.close()
        await b.close()
    print('errors', errs)
asyncio.run(main())
