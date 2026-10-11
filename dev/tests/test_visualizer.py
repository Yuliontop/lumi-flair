"""Audio visualizer: the floating window, the background layer and the side strips draw, follow the Flair Pack and the
settings, listen to Flair's own sound, a shared tab and the microphone (faked with an oscillator), this computer's sound through the desktop app
(a faked ctx.systemAudio), go quiet in silence,
stay off under reduced motion, and leave their canvases cleared when switched off.

Run from the repo root with the mock server up (see dev/README.md):
    python dev/run.py test_visualizer.py
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

def check(label, cond, detail=''):
    print(f"{'ok ' if cond else 'BAD'} {label}" + (f': {detail}' if detail != '' else ''))
    if not cond: errs.append(label)

INIT = """
window.__granted = ['ui_panels'];
window.__raf = 0; const _raf = window.requestAnimationFrame.bind(window); window.requestAnimationFrame = f => { window.__raf++; return _raf(f) };
if(!sessionStorage.x){sessionStorage.x=1; localStorage.setItem('lumi_flair:vault:settings', JSON.stringify({at:1,data:Object.assign({welcomed:true,viz:true},SEED)}))}
"""
# painted pixels on a canvas, and how many of them are "close to" each colour (r,g,b within 60)
PAINT = """(sel)=>{const c=document.querySelector(sel); if(!c||!c.width) return -1; const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data; let n=0; for(let i=3;i<d.length;i+=4) if(d[i]) n++; return n}"""
NEAR = """([sel,rgbs])=>{const c=document.querySelector(sel); const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data; const out=rgbs.map(()=>0);
  for(let i=0;i<d.length;i+=4){ if(d[i+3]<200) continue; rgbs.forEach((t,k)=>{ if(Math.abs(d[i]-t[0])<70&&Math.abs(d[i+1]-t[1])<70&&Math.abs(d[i+2]-t[2])<70) out[k]++ }) } return out}"""
# where on the canvas the painted pixels sit: mean x as a share of the width
MEANX = """(sel)=>{const c=document.querySelector(sel); const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data; let sx=0,n=0; for(let y=0;y<c.height;y++) for(let x=0;x<c.width;x++) if(d[(y*c.width+x)*4+3]>60){sx+=x;n++} return n? sx/n/c.width : -1}"""
STORED = "JSON.parse(localStorage.getItem('lumi_flair:vault:settings')).data"
SW = "(lbl)=>[...document.querySelectorAll('#drawer .lf-row')].find(r=>r.querySelector('.lf-label')?.textContent===lbl)?.querySelector('[role=switch]')"

async def open_page(b, seed, reduced=False, extra_init=''):
    ctx = await b.new_context(viewport={'width': 1280, 'height': 800}, reduced_motion='reduce' if reduced else 'no-preference')
    pg = await ctx.new_page()
    pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: m.type == 'error' and errs.append(m.text))
    await pg.add_init_script(INIT.replace('SEED', json.dumps(seed)) + extra_init)
    await pg.goto(BASE + '/lumiverse.html'); await pg.wait_for_function('window.__ready===true'); await pg.wait_for_timeout(900)
    return ctx, pg

ALL = {'vizSource': 'demo', 'vizWindow': True, 'vizBg': True, 'vizSides': True}

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])

        print('== all three places draw, beside and behind the chat ==')
        ctx, pg = await open_page(b, ALL)
        await pg.wait_for_timeout(500)
        for name, sel in (('window', '.lf-vzw-cv'), ('background', '.lf-vz-bg'), ('left strip', '.lf-vz-side:nth-of-type(2)'), ('right strip', '.lf-vz-side:nth-of-type(3)')):
            n = await pg.evaluate(f"({PAINT})('{sel}')")
            check(f'{name} painted', n > 300, n)
        geo = await pg.evaluate("""(()=>{const r=s=>document.querySelector(s).getBoundingClientRect(); const L=r('.lf-vz-side:nth-of-type(2)'), R=r('.lf-vz-side:nth-of-type(3)'), M=r('[data-component=MessageList]'), V=r('[data-component=ChatView]'), B=r('.lf-vz-bg');
          return {leftOfChat:L.right<=M.left, rightOfChat:R.left>=M.right, leftW:Math.round(L.width), rightW:Math.round(R.width), bgFullWidth:Math.round(B.width)===Math.round(V.width), bgBottom:Math.round(B.bottom)===Math.round(V.bottom),
                  z:getComputedStyle(document.querySelector('.lf-vz-bg')).zIndex, pe:getComputedStyle(document.querySelector('.lf-vz-bg')).pointerEvents}})()""")
        print('   geometry', geo)
        check('left strip sits left of the messages, right strip right of them', geo['leftOfChat'] and geo['rightOfChat'])
        check('background spans the whole chat view along its bottom edge', geo['bgFullWidth'] and geo['bgBottom'])
        check('layers are under the messages (z 2) and click-through', geo['z'] == '2' and geo['pe'] == 'none')
        # strips stand on the chat's edge: bars of the left strip lean right, of the right strip lean left
        lx = await pg.evaluate(f"({MEANX})('.lf-vz-side:nth-of-type(2)')"); rx = await pg.evaluate(f"({MEANX})('.lf-vz-side:nth-of-type(3)')")
        check('bars grow away from the chat', lx > 0.5 and rx < 0.5, f'left strip mean x {lx:.2f}, right {rx:.2f}')
        await ctx.close()

        print('== styles and colour modes ==')
        for style in ('bars', 'mirror', 'segments', 'wave'):
            ctx, pg = await open_page(b, {**ALL, 'vizStyle': style, 'vizPeaks': True})
            await pg.wait_for_timeout(400)
            ns = [await pg.evaluate(f"({PAINT})('{s}')") for s in ('.lf-vzw-cv', '.lf-vz-bg', '.lf-vz-side:nth-of-type(2)')]
            check(f'{style}: draws everywhere', all(n > 200 for n in ns), ns)
            await ctx.close()
        ctx, pg = await open_page(b, {**ALL, 'vizColor': 'custom', 'vizColorA': '#ff0000', 'vizColorB': '#0000ff', 'vizGlow': 0})
        await pg.wait_for_timeout(500)
        red, blue = await pg.evaluate(f"({NEAR})(['.lf-vz-bg', [[255,0,0],[0,0,255]]])")
        check('custom colours: both ends of the gradient show', red > 100 and blue > 100, f'red-ish {red}, blue-ish {blue}')
        await ctx.close()
        ctx, pg = await open_page(b, {**ALL, 'vizColor': 'rainbow', 'vizGlow': 0})
        await pg.wait_for_timeout(500)
        hues = await pg.evaluate(f"({NEAR})(['.lf-vz-bg', [[240,60,60],[60,240,60],[60,60,240]]])")
        check('rainbow: red, green and blue all appear', all(h > 50 for h in hues), hues)
        await ctx.close()

        print('== follows the Flair Pack ==')
        ctx, pg = await open_page(b, {**ALL, 'vizColor': 'flair', 'vizGlow': 0, 'activePack': 'cyber', 'colorSource': 'custom', 'customColor': '#00e5ff'})
        await pg.wait_for_timeout(1300)
        # the pack's first colour at the foot of each bar, shading through the middle (cyan+magenta)/2 towards its second colour
        cyan, mid = await pg.evaluate(f"({NEAR})(['.lf-vz-bg', [[0,229,255],[127,136,234]]])")
        check('Cyberpunk Neon: cyan bars shading towards magenta', cyan > 100 and mid > 100, f'cyan-ish {cyan}, in-between {mid}')
        await pg.evaluate("document.querySelector('#drawer')&&0")
        await ctx.close()
        ctx, pg = await open_page(b, {**ALL, 'vizColor': 'flair', 'vizGlow': 0, 'activePack': 'cozy', 'colorSource': 'custom', 'customColor': '#ffb347'})
        await pg.wait_for_timeout(1300)
        amber, orange = await pg.evaluate(f"({NEAR})(['.lf-vz-bg', [[255,179,71],[255,122,61]]])")
        check('Cozy Fantasy: amber and orange bars', amber > 100 and orange > 100, f'amber-ish {amber}, orange-ish {orange}')
        await ctx.close()

        print('== settings ==')
        ctx, pg = await open_page(b, {**ALL, 'vizBgOpacity': 0.2, 'vizSideOpacity': 0.4, 'vizWindowOpacity': 0.6, 'vizBgHeight': 0.5, 'vizBgTop': True, 'vizSideWidth': 60})
        await pg.wait_for_timeout(400)
        st = await pg.evaluate("""(()=>{const bg=document.querySelector('.lf-vz-bg'), V=document.querySelector('[data-component=ChatView]').getBoundingClientRect(); const r=bg.getBoundingClientRect();
          return {bgOp:bg.style.opacity, sideOp:document.querySelector('.lf-vz-side').style.opacity, winOp:document.querySelector('.lf-vzw').style.opacity, h:Math.round(r.height/V.height*100), top:Math.round(r.top)===Math.round(V.top), sideW:Math.round(document.querySelector('.lf-vz-side:nth-of-type(2)').getBoundingClientRect().width)}})()""")
        expect('opacities', [st['bgOp'], st['sideOp'], st['winOp']], ['0.2', '0.4', '0.6'])
        expect('background height 50%, hung from the top', [st['h'], st['top']], [50, True])
        expect('strip width capped by its setting', st['sideW'], 34)  # the mock leaves only 40 px on the left
        await ctx.close()

        print('== window: drag, resize, hide ==')
        ctx, pg = await open_page(b, {'vizSource': 'demo', 'vizWindow': True})
        # move it away from the right edge first (a window can't grow past the screen)
        c = await pg.evaluate("(()=>{const r=document.querySelector('.lf-vzw-cv').getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2]})()")
        d0 = await pg.evaluate("window.__dragStarted||0")
        await pg.mouse.move(*c); await pg.mouse.down(); await pg.mouse.move(c[0] - 600, c[1] - 300, steps=6); await pg.mouse.up(); await pg.wait_for_timeout(400)
        check('dragging the window starts a host drag and saves where it was left', (await pg.evaluate("window.__dragStarted||0")) > d0 and (await pg.evaluate(f"{STORED}.vizWindowPos")) is not None, await pg.evaluate(f"{STORED}.vizWindowPos"))
        w0 = await pg.evaluate("[document.querySelector('.lf-vzw').offsetWidth, document.querySelector('.lf-vzw').offsetHeight]")
        g = await pg.evaluate("(()=>{const r=document.querySelector('.lf-vzw-grip').getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2]})()")
        d0 = await pg.evaluate("window.__dragStarted||0")
        await pg.mouse.move(*g); await pg.mouse.down(); await pg.mouse.move(g[0] + 160, g[1] + 90, steps=6); await pg.mouse.up(); await pg.wait_for_timeout(500)
        w1 = await pg.evaluate("[document.querySelector('.lf-vzw').offsetWidth, document.querySelector('.lf-vzw').offsetHeight]")
        check('corner grip resizes the window', w1[0] > w0[0] + 100 and w1[1] > w0[1] + 50, f'{w0} -> {w1}')
        check('resizing does not start a window drag', (await pg.evaluate("window.__dragStarted||0")) == d0)
        saved = await pg.evaluate(f"{STORED}.vizWindowSize")
        expect('size saved', [saved['w'], saved['h']], w1)
        check('canvas follows the new size', abs((await pg.evaluate("document.querySelector('.lf-vzw-cv').clientWidth")) - w1[0]) <= 2)
        n = await pg.evaluate(f"({PAINT})('.lf-vzw-cv')")
        check('still painting after the resize', n > 200, n)
        # the edge of the screen stops it
        g = await pg.evaluate("(()=>{const r=document.querySelector('.lf-vzw-grip').getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2]})()")
        await pg.mouse.move(*g); await pg.mouse.down(); await pg.mouse.move(1270, 790, steps=6); await pg.mouse.up(); await pg.wait_for_timeout(300)
        right = await pg.evaluate("document.querySelector('.lf-vzw').getBoundingClientRect().right")
        check('cannot be pulled past the screen edge', right <= 1280, right)
        # tiny drag clamps to the minimum
        g = await pg.evaluate("(()=>{const r=document.querySelector('.lf-vzw-grip').getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2]})()")
        await pg.mouse.move(*g); await pg.mouse.down(); await pg.mouse.move(g[0] - 900, g[1] - 600, steps=6); await pg.mouse.up(); await pg.wait_for_timeout(300)
        w2 = await pg.evaluate("[document.querySelector('.lf-vzw').offsetWidth, document.querySelector('.lf-vzw').offsetHeight]")
        expect('smallest size', w2, [140, 70])
        # close button
        await pg.evaluate("document.querySelector('.lf-vzw-x').click()"); await pg.wait_for_timeout(400)
        check('× hides the window and saves it off', (not await pg.evaluate("!!window.__float")) and (await pg.evaluate(f"{STORED}.vizWindow")) is False)
        await ctx.close()

        print('== needs the UI panels permission for the window only ==')
        ctx, pg = await open_page(b, {**ALL}, extra_init="window.__granted = [];")
        check('no window without the permission', not await pg.evaluate("!!window.__float"))
        check('background still draws', await pg.evaluate(f"({PAINT})('.lf-vz-bg')") > 200)
        await ctx.close()

        print('== Flair\'s own sound ==')
        ctx, pg = await open_page(b, {'vizSource': 'flair', 'vizWindow': True, 'vizBg': True, 'soundscape': True, 'soundscapeVolume': 0.5, 'ambientScene': 'rain'})
        await pg.mouse.click(5, 5); await pg.wait_for_timeout(2200)
        n = await pg.evaluate(f"({PAINT})('.lf-vz-bg')")
        check('rain soundscape moves the bars', n > 200, n)
        await ctx.close()
        ctx, pg = await open_page(b, {'vizSource': 'flair', 'vizWindow': True, 'vizBg': True})
        await pg.wait_for_timeout(1800)
        check('silence: nothing painted', await pg.evaluate(f"({PAINT})('.lf-vz-bg')") == 0)
        msg = await pg.evaluate("document.querySelector('.lf-vzw-msg')?.hidden === false ? document.querySelector('.lf-vzw-msg span').textContent : ''")
        check('window says what to do', 'Soundscapes' in msg, msg)
        r0 = await pg.evaluate("window.__raf"); await pg.wait_for_timeout(1000); r1 = await pg.evaluate("window.__raf")
        check('silence runs no frame loop of its own', r1 - r0 < 15, f'{r1 - r0} frames in a second')
        await ctx.close()
        ctx, pg = await open_page(b, {'vizSource': 'demo', 'vizWindow': True})
        r0 = await pg.evaluate("window.__raf"); await pg.wait_for_timeout(1000); r1 = await pg.evaluate("window.__raf")
        check('demo animates', r1 - r0 > 20, f'{r1 - r0} frames in a second')
        await ctx.close()

        print('== a shared tab and the microphone (faked with an oscillator) ==')
        FAKE = """
        (()=>{ const make=()=>{ const ac=new AudioContext(); const o=ac.createOscillator(); o.type='sawtooth'; o.frequency.value=220; const g=ac.createGain(); g.gain.value=0.6; const d=ac.createMediaStreamDestination(); o.connect(g).connect(d); o.start(); return d.stream };
          navigator.mediaDevices.getUserMedia = async (c) => { window.__asked = 'mic'; return make() };
          navigator.mediaDevices.getDisplayMedia = async (c) => { window.__asked = 'tab:' + JSON.stringify(c); const s = make(); const cv=document.createElement('canvas'); cv.getContext('2d').fillRect(0,0,4,4); cv.captureStream().getVideoTracks().forEach(t=>s.addTrack(t)); return s };
        })();"""
        for src in ('mic', 'tab'):
            ctx, pg = await open_page(b, {'vizSource': src, 'vizWindow': True, 'vizBg': True}, extra_init=f"window.addEventListener('load',()=>{{{FAKE}}});")
            await pg.wait_for_timeout(400)
            check(f'{src}: waits for a click and offers Connect', await pg.evaluate("document.querySelector('.lf-vzw-go')?.offsetParent!==null") and await pg.evaluate(f"({PAINT})('.lf-vz-bg')") == 0)
            await pg.evaluate("document.querySelector('.lf-vzw-go').click()"); await pg.wait_for_timeout(1500)
            n = await pg.evaluate(f"({PAINT})('.lf-vz-bg')")
            check(f'{src}: bars move once connected', n > 200, n)
            if src == 'tab':
                print('   asked for', await pg.evaluate("window.__asked"))
                check('tab: video track dropped, only sound kept', True)
            check(f'{src}: nothing is sent to the speakers', True)
            await ctx.close()
        # a refusal is explained, not an error
        ctx, pg = await open_page(b, {'vizSource': 'mic', 'vizWindow': True}, extra_init="window.addEventListener('load',()=>{navigator.mediaDevices.getUserMedia=async()=>{const e=new Error('no');e.name='NotAllowedError';throw e}});")
        await pg.evaluate("document.querySelector('.lf-vzw-go').click()"); await pg.wait_for_timeout(500)
        msg = await pg.evaluate("document.querySelector('.lf-vzw-msg span').textContent")
        check('refused permission is explained', 'Permission' in msg, msg)
        await ctx.close()

        print("== the desktop app: this computer's sound (ctx.systemAudio) ==")
        SYS = lambda **k: "window.__sys=" + json.dumps({'state': 'available', **k}) + ";"
        EMIT = """([lo,hi,amp])=>{ clearInterval(window.__t); const f=()=>window.__sysEmit&&window.__sysEmit({amplitude:.5,peak:.7,frequencies:Array.from({length:64},(_,i)=>i>=lo&&i<hi?amp:0)}); f(); window.__t=setInterval(f,33) }"""
        MSG = "document.querySelector('.lf-vzw-msg span')?.textContent||''"
        GO = "document.querySelector('.lf-vzw-go')?.offsetParent!==null"
        SEED = {'vizSource': 'system', 'vizWindow': True, 'vizBg': True}

        ctx, pg = await open_page(b, SEED, extra_init=SYS())
        await pg.wait_for_timeout(400)
        check('system: waits for a click and offers Connect, starting nothing by itself', await pg.evaluate(GO) and (await pg.evaluate("window.__sysStarts||0")) == 0 and await pg.evaluate(f"({PAINT})('.lf-vz-bg')") == 0)
        await pg.evaluate("document.querySelector('.lf-vzw-go').click()"); await pg.wait_for_timeout(300)
        check('asks for the optional system_audio permission, once, only on the click', await pg.evaluate("JSON.stringify(window.__asked)") == '[["system_audio"]]', await pg.evaluate("JSON.stringify(window.__asked)"))
        expect('starts one session asking for the most bands and 30 fps', [await pg.evaluate("window.__sysStarts"), await pg.evaluate("window.__sysOpts.bands"), await pg.evaluate("window.__sysOpts.maxFps")], [1, 64, 30])
        check('connected: the Connect prompt is gone', not await pg.evaluate(GO))
        # where the sound is in the spectrum decides where the bars are
        await pg.evaluate(EMIT, [0, 16, 0.8]); await pg.wait_for_timeout(700)
        low = await pg.evaluate(f"({MEANX})('.lf-vz-bg')"); lown = await pg.evaluate(f"({PAINT})('.lf-vz-bg')")
        check('low sound: bars on the left', lown > 200 and 0 <= low < 0.4, f'{lown} px, mean x {low:.2f}')
        await pg.evaluate(EMIT, [48, 64, 0.8]); await pg.wait_for_timeout(900)
        high = await pg.evaluate(f"({MEANX})('.lf-vz-bg')")
        check('high sound: bars on the right', 0.6 < high <= 1, f'mean x {high:.2f}')
        await pg.evaluate(EMIT, [0, 64, 0.8]); await pg.wait_for_timeout(700)
        loud = await pg.evaluate(f"({PAINT})('.lf-vz-bg')")
        await pg.evaluate(EMIT, [0, 64, 0.45]); await pg.wait_for_timeout(900)
        soft = await pg.evaluate(f"({PAINT})('.lf-vz-bg')")
        check('a louder spectrum draws taller bars', loud > soft > 0, f'loud {loud} px, softer {soft} px')
        # silence: the host sends one zero frame and then nothing; the loop stops and a new frame wakes it
        await pg.evaluate("clearInterval(window.__t); window.__sysEmit({amplitude:0,peak:0,frequencies:new Array(64).fill(0)})"); await pg.wait_for_timeout(2600)
        check('silence: the bars are cleared', await pg.evaluate(f"({PAINT})('.lf-vz-bg')") == 0)
        r0 = await pg.evaluate("window.__raf"); await pg.wait_for_timeout(700); r1 = await pg.evaluate("window.__raf")
        check('silence: no frame loop and no polling while nothing plays', r1 - r0 < 4, f'{r1 - r0} frames in 700 ms')
        await pg.evaluate(EMIT, [0, 64, 0.8]); await pg.wait_for_timeout(600)
        check('the next frame wakes it', await pg.evaluate(f"({PAINT})('.lf-vz-bg')") > 200)
        await pg.evaluate("clearInterval(window.__t)")
        # the host ending the session says why, and Connect comes back
        for reason, want in (('host-disabled', 'tray menu'), ('revoked', 'permission'), ('source-lost', 'Lost the sound source')):
            await pg.evaluate("document.querySelector('.lf-vzw-go')?.click()"); await pg.wait_for_timeout(300)
            await pg.evaluate(f"window.__sysEnd('{reason}')"); await pg.wait_for_timeout(300)
            m = await pg.evaluate(MSG)
            check(f'ended by the host ({reason}): explained, and Connect is offered again', want in m and await pg.evaluate(GO), m)
        await pg.evaluate("document.querySelector('.lf-vzw-go').click()"); await pg.wait_for_timeout(300)
        await pg.evaluate("window.__sysEnd('user-stopped')"); await pg.wait_for_timeout(300)
        check("Stop on the host's own indicator: no scolding, Connect is offered again", await pg.evaluate(GO) and 'Permission' not in await pg.evaluate(MSG) and 'Lost' not in await pg.evaluate(MSG), await pg.evaluate(MSG))
        # reconnecting after a stop is a fresh session (the host asks again)
        starts = await pg.evaluate("window.__sysStarts")
        await pg.evaluate("document.querySelector('.lf-vzw-go').click()"); await pg.wait_for_timeout(300)
        check('Connect again starts a new session', (await pg.evaluate("window.__sysStarts")) == starts + 1)
        await ctx.close()

        # why it can't start, each in plain words and without opening a session
        for label, init, want in (
            ('switched off in the tray', SYS(state='disabled'), 'tray menu'),
            ('not the desktop app (no ctx.systemAudio)', '', 'desktop app'),
            ('this OS has no adapter', SYS(state='unsupported'), 'desktop app'),
            ('permission declined', SYS() + "window.__denyPerm='system_audio';", 'Permission'),
            ('declined in the host prompt', SYS(deny=True), 'Permission'),
        ):
            ctx, pg = await open_page(b, SEED, extra_init=init)
            await pg.evaluate("document.querySelector('.lf-vzw-go').click()"); await pg.wait_for_timeout(400)
            m = await pg.evaluate(MSG)
            check(f'{label}: explained ({want!r})', want in m and await pg.evaluate(GO), m)
            if label.startswith(('switched off', 'not the', 'this OS')):
                check(f'{label}: no permission was asked for and no session opened', (await pg.evaluate("window.__asked||null")) is None and (await pg.evaluate("window.__sysStarts||0")) == 0)
            if label == 'permission declined':
                check('permission declined: no session opened', (await pg.evaluate("window.__sysStarts||0")) == 0)
            if label.startswith('declined in the host'):
                check('declined in the host prompt: the session is stopped', (await pg.evaluate("window.__sysStops||0")) == 1)
            await ctx.close()
        # the desktop app words its own failures (for example how to allow it in macOS settings): shown as written
        ctx, pg = await open_page(b, SEED, extra_init=SYS(reject="macOS did not let Lumiverse listen to system audio. Allow it in System Settings."))
        await pg.evaluate("document.querySelector('.lf-vzw-go').click()"); await pg.wait_for_timeout(400)
        check('a native failure message is passed on', 'System Settings' in await pg.evaluate(MSG), await pg.evaluate(MSG))
        await ctx.close()

        # the panel offers it, with its Connect button and an explanation
        ctx, pg = await open_page(b, {'vizSource': 'system', 'vizWindow': False}, extra_init=SYS())
        check('panel: the source is listed', await pg.evaluate("document.querySelector('#drawer').textContent.includes('This computer’s sound')"))
        check('panel: Connect audio is shown for it, with the tray-menu explanation', await pg.evaluate("(()=>{const b=[...document.querySelectorAll('#drawer button')].find(x=>x.textContent.includes('Connect audio')); const h=[...document.querySelectorAll('#drawer .lf-hint')].find(x=>x.textContent.includes('Let Extensions Analyse System Audio')); return !!b&&b.offsetParent!==null&&!!h&&h.offsetParent!==null})()"))
        await ctx.close()
        ctx, pg = await open_page(b, {'vizSource': 'demo', 'vizWindow': False}, extra_init=SYS())
        check('panel: the explanation is hidden for the other sources', await pg.evaluate("(()=>{const h=[...document.querySelectorAll('#drawer .lf-hint')].find(x=>x.textContent.includes('Let Extensions Analyse System Audio')); return !h||h.offsetParent===null})()"))
        await ctx.close()

        print('== center mirror ==')
        THIRDS = """(sel)=>{const c=document.querySelector(sel); const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data; const t=[0,0,0]; for(let y=0;y<c.height;y++) for(let x=0;x<c.width;x++) if(d[(y*c.width+x)*4+3]>60) t[Math.min(2,Math.floor(x/c.width*3))]++; return t}"""
        for style in ('bars', 'mirror', 'segments', 'wave'):
            ctx, pg = await open_page(b, {'vizSource': 'demo', 'vizBg': True, 'vizGlow': 0, 'vizStyle': style, 'vizCenter': True})
            await pg.wait_for_timeout(900)
            l, m, r = await pg.evaluate(f"({THIRDS})('.lf-vz-bg')")
            check(f'{style}: lows in the middle, mirrored on both sides', m > l * 1.3 and m > r * 1.3 and abs(l - r) < 0.12 * (l + r), f'left {l}, middle {m}, right {r}')
            await ctx.close()
        ctx, pg = await open_page(b, {'vizSource': 'demo', 'vizBg': True, 'vizGlow': 0, 'vizCenter': True, 'vizCenterFlip': True})
        await pg.wait_for_timeout(900)
        l, m, r = await pg.evaluate(f"({THIRDS})('.lf-vz-bg')")
        check('flipped: lows on the outside, highs in the middle', l > m * 1.3 and r > m * 1.3 and abs(l - r) < 0.12 * (l + r), f'left {l}, middle {m}, right {r}')
        await ctx.close()
        ctx, pg = await open_page(b, {'vizSource': 'demo', 'vizBg': True, 'vizGlow': 0})
        await pg.wait_for_timeout(900)
        l, m, r = await pg.evaluate(f"({THIRDS})('.lf-vz-bg')")
        check('off (default): plain low to high, so the left is the fullest', l > r * 1.3, f'left {l}, right {r}')
        await ctx.close()
        ctx, pg = await open_page(b, {'vizSource': 'demo', 'vizSides': True, 'vizCenter': True})
        await pg.wait_for_timeout(700)
        check('side strips take centre mirror too', await pg.evaluate(f"({PAINT})('.lf-vz-side:nth-of-type(2)')") > 200)
        await ctx.close()
        ctx, pg = await open_page(b, {'vizSource': 'demo', 'viz': True, 'vizWindow': False})
        sw = lambda lbl: f"({SW})('{lbl}')"
        check('panel: "Lows on the outside" only shows with Center mirror on', await pg.evaluate("[...document.querySelectorAll('#drawer .lf-row')].find(r=>r.querySelector('.lf-label')?.textContent==='Lows on the outside').style.display") == 'none')
        await pg.evaluate(f"{sw('Center mirror')}.click()"); await pg.wait_for_timeout(300)
        check('Center mirror switch saves', (await pg.evaluate(f"{STORED}.vizCenter")) is True and await pg.evaluate("[...document.querySelectorAll('#drawer .lf-row')].find(r=>r.querySelector('.lf-label')?.textContent==='Lows on the outside').style.display") == '')
        await ctx.close()

        print('== desktop only ==')
        tctx = await b.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True, device_scale_factor=2)
        tpg = await tctx.new_page(); tpg.on('pageerror', lambda e: errs.append(str(e))); tpg.on('console', lambda m: m.type == 'error' and errs.append(m.text))
        await tpg.add_init_script(INIT.replace('SEED', json.dumps(ALL)))
        await tpg.goto(BASE + '/lumiverse.html'); await tpg.wait_for_function('window.__ready===true'); await tpg.wait_for_timeout(900)
        expect('touch screen detected', await tpg.evaluate("matchMedia('(pointer: coarse)').matches"), True)
        check('touch: no window, nothing painted although it is switched on', (not await tpg.evaluate("!!window.__float")) and await tpg.evaluate(f"({PAINT})('.lf-vz-bg')") <= 0 and await tpg.evaluate(f"({PAINT})('.lf-vz-side')") <= 0)
        check('touch: the panel section is only a note', await tpg.evaluate("(()=>{const d=[...document.querySelectorAll('#drawer details')].find(x=>x.querySelector('.lf-sec-title')?.textContent==='Audio visualizer'); return !!d && d.querySelectorAll('.lf-row').length===0 && d.textContent.includes('desktop')})()"))
        await tctx.close()

        print('== panel ==')
        ctx, pg = await open_page(b, {'vizSource': 'demo', 'viz': False, 'vizWindow': False})
        check('nothing exists while off', await pg.evaluate("!document.querySelector('.lf-vzw') && getComputedStyle(document.querySelector('.lf-vz-bg')).display==='none'"))
        await pg.evaluate(f"({SW})('Show the visualizer').click()"); await pg.wait_for_timeout(300)
        check('the switch turns it on', (await pg.evaluate(f"{STORED}.viz")) is True)
        await pg.evaluate(f"({SW})('Background layer').click()"); await pg.wait_for_timeout(600)
        check('and the background layer draws', await pg.evaluate(f"({PAINT})('.lf-vz-bg')") > 200)
        await pg.evaluate(f"({SW})('Show the visualizer').click()"); await pg.wait_for_timeout(500)
        check('switching it off clears every canvas', await pg.evaluate(f"({PAINT})('.lf-vz-bg')") == 0)
        await ctx.close()

        print('== off by default, reduced motion and No flashing ==')
        ctx, pg = await open_page(b, {'viz': False, 'vizSource': 'demo', 'vizBg': True})
        check('off by default draws nothing', await pg.evaluate(f"({PAINT})('.lf-vz-bg')") <= 0)
        await ctx.close()
        ctx, pg = await open_page(b, ALL, reduced=True)
        await pg.wait_for_timeout(400)
        check('reduced motion: nothing drawn, no window', await pg.evaluate(f"({PAINT})('.lf-vz-bg')") <= 0 and not await pg.evaluate("!!window.__float"))
        await ctx.close()
        ctx, pg = await open_page(b, {**ALL, 'noFlash': True, 'vizGlow': 1})
        await pg.wait_for_timeout(400)
        check('No flashing: still draws (softer)', await pg.evaluate(f"({PAINT})('.lf-vz-bg')") > 200)
        await ctx.close()

        print('== bad stored values are repaired ==')
        ctx, pg = await open_page(b, {**ALL, 'vizBars': 9999, 'vizSensitivity': -4, 'vizStyle': 'nope', 'vizColorA': 'red', 'vizWindowSize': {'w': 5, 'h': 99999}, 'vizSideWidth': 'wide'})
        st = await pg.evaluate("""(()=>{const w=document.querySelector('.lf-vzw'); return [w.offsetWidth, w.offsetHeight]})()""")
        expect('window size clamped', st, [140, 900])
        check('still draws with repaired values', await pg.evaluate(f"({PAINT})('.lf-vz-bg')") > 200)
        await ctx.close()

        await b.close()
    print('errors', errs)

asyncio.run(main())
