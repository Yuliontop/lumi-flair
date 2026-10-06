"""Theater mode: one click hides the interface and leaves the story full-screen, with larger type and a gentle auto-scroll.

The mock has no host chrome, so each page is given some that looks like the host's (title bar, quick toolbar,
top dock, scroll-to-bottom button, a message action pill, the side drawer with its tab button) and a long,
collapsed-looking reply. Checks: what hides and what comes back, the type size, the long reply shown in full,
the drawer being closed, the control bar (shows, goes away, comes back), the reply box, the keyboard, the
auto-scroll (speed, pause, waits for you, stops at the end, starts paused for reduced motion), where it starts,
leaving the chat, the panel, the Extras action, the message button, a phone, and being switched off mid-way.

Run from the repo root with the mock server up (see dev/README.md):
    python dev/run.py test_theater.py
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

SEED = lambda extra: "if(!sessionStorage.x){sessionStorage.x=1; localStorage.setItem('lumi_flair:vault:settings', JSON.stringify({at:1,data:Object.assign({welcomed:true,intro:false}, %s)}))}" % json.dumps(extra)

# Chrome like the host's (by the same selectors), a tall reply, and the host's side drawer with its tab button.
CHROME = r"""
(()=>{
  const add=(h,parent=document.body)=>{const d=document.createElement('div'); d.innerHTML=h; const e=d.firstElementChild; parent.appendChild(e); return e}
  add('<div data-component="DesktopPwaTitlebar" id="t_title" style="position:fixed;top:0;left:0;right:0;height:20px;background:#333;z-index:5">title</div>')
  const body=document.getElementById('body')
  body.insertBefore(Object.assign(document.createElement('div'),{id:'t_dock',innerHTML:'<div data-component="QuickToolbar" id="t_qt">tools</div>'}),document.getElementById('list'))
  document.getElementById('t_dock').setAttribute('data-spindle-mount','chat_top_dock')
  add('<div data-component="ScrollToBottom" id="t_stb" style="position:fixed;left:300px;bottom:100px">v</div>')
  add('<div class="D_wrapper" id="t_wrap" style="position:fixed;right:0;top:0;bottom:0;width:30px;background:#444;z-index:50"><button id="t_tab" style="width:30px;height:60px">tab</button><div class="D_drawer"><div data-spindle-mount="sidebar" style="height:10px"></div></div></div>')
  add('<div class="D_backdrop_x1" id="t_back" style="position:fixed;left:0;top:0;width:5px;height:5px;background:red;z-index:49"></div>')
  // the backdrop must come right before the wrapper, like the host's
  document.body.insertBefore(document.getElementById('t_back'), document.getElementById('t_wrap'))
  document.getElementById('t_tab').addEventListener('click',()=>{window.__tabClicks=(window.__tabClicks||0)+1; window.__drawerOpen=!window.__drawerOpen})
  // the chat column, whose width is the user's own chat-width setting (a variable, as in the host)
  const inner=document.createElement('div'); inner.id='t_inner'; inner.setAttribute('data-lumiverse-surface','chat-column-inner'); inner.style.cssText='max-width:var(--lumiverse-chat-content-width,none);height:1px'
  body.appendChild(inner); document.documentElement.style.setProperty('--lumiverse-chat-content-width','1100px')
  // the message action pill, as the host mounts it
  document.querySelectorAll('.fake-actions').forEach(a=>a.setAttribute('data-spindle-mount','message_actions'))
  // a long reply: tall, in a collapsed-looking viewport, with a "show more" button
  const list=document.getElementById('list')
  const long=document.createElement('div'); long.className='B_card B_character'; long.setAttribute('data-component','BubbleMessage'); long.setAttribute('data-part','character'); long.setAttribute('data-message-id','m9')
  long.innerHTML='<div data-component="MessageContent" id="t_content" style="font-size:14px"><div class="X_longMessageViewport_a1 X_longMessageViewportConstrained_a1" id="t_vp" style="max-height:120px;overflow:hidden"><div id="t_body" style="height:'+(window.__tall||3000)+'px;background:linear-gradient(#335,#533)">a very long reply</div></div><button class="X_longMessageToggle_a1" id="t_more">Show more</button></div>'
  list.appendChild(long)
  window.__latest='m9'
  if(window.__mkActions) window.__mkActions(long)
})();
"""
CHROME_IDS = ['t_title', 't_qt', 't_dock', 't_stb', 't_wrap', 't_back']
SHOWN = lambda sel: f"getComputedStyle(document.querySelector('{sel}')).display"
LIST = "document.getElementById('list')"
BAR = "document.querySelector('.lf-th')"
BTN = lambda label: f"[...document.querySelectorAll('.lf-th-btn')].find(b=>b.getAttribute('aria-label')==={json.dumps(label)})"
SETTINGS = "JSON.parse(localStorage.getItem('lumi_flair:vault:settings')).data"
CMD = "__backend({type:'command',id:'theater'})"

async def boot(b, settings=None, size=(1280, 900), reduced=False, mobile=False, tall=3000, drawer_open=False):
    ctx = await b.new_context(viewport={'width': size[0], 'height': size[1]}, reduced_motion='reduce' if reduced else 'no-preference', is_mobile=mobile, has_touch=mobile)
    pg = await ctx.new_page()
    pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: m.type == 'error' and errs.append(m.text))
    await pg.add_init_script(SEED(settings or {}) + f"window.__tall={tall}; window.__drawerOpen={json.dumps(drawer_open)};")
    await pg.goto(BASE + '/lumiverse.html'); await pg.wait_for_function('window.__ready===true'); await pg.wait_for_timeout(600)
    await pg.evaluate(CHROME)
    await pg.wait_for_timeout(200)
    return ctx, pg

async def on(pg):
    return await pg.evaluate("document.documentElement.hasAttribute('data-lf-theater')")

async def top(pg):
    return await pg.evaluate(f"{LIST}.scrollTop")

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()

        print('== the interface steps away, and comes back ==')
        ctx, pg = await boot(b, {'ambientScene': 'snow', 'ambientAuto': False})
        before = {i: await pg.evaluate(SHOWN('#' + i)) for i in CHROME_IDS}
        expect('before: all of it is showing', [v != 'none' for v in before.values()], [True] * len(CHROME_IDS))
        expect('before: the reply box and the pill are showing', [await pg.evaluate("getComputedStyle(document.querySelector('[data-component=InputArea]')).display"), await pg.evaluate("getComputedStyle(document.querySelector('.fake-actions')).display")], ['flex', 'contents'])
        WIDTH = "[getComputedStyle(document.getElementById('t_inner')).maxWidth, getComputedStyle(document.getElementById('list')).paddingLeft + ' ' + getComputedStyle(document.getElementById('list')).paddingRight, Math.round(document.getElementById('list').getBoundingClientRect().width)]"
        w0 = await pg.evaluate(WIDTH)
        fs0 = await pg.evaluate("parseFloat(getComputedStyle(document.getElementById('t_content')).fontSize)")
        h0 = await pg.evaluate("document.getElementById('t_vp').getBoundingClientRect().height")
        await pg.evaluate(CMD); await pg.wait_for_timeout(500)
        expect('theater mode is on', await on(pg), True)
        expect('the host chrome is hidden (title bar, quick toolbar, top dock, scroll button, drawer, backdrop)', [await pg.evaluate(SHOWN('#' + i)) for i in CHROME_IDS], ['none'] * len(CHROME_IDS))
        expect('the reply box and the action pill are hidden', [await pg.evaluate("getComputedStyle(document.querySelector('[data-component=InputArea]')).display"), await pg.evaluate("getComputedStyle(document.querySelector('.fake-actions')).display")], ['none', 'none'])
        fs1 = await pg.evaluate("parseFloat(getComputedStyle(document.getElementById('t_content')).fontSize)")
        expect('the type is larger (14 px x 1.35)', [fs0, round(fs1, 1)], [14, 18.9])
        expect('a long reply is shown in full: no height limit, no "show more"', [h0 < 200, await pg.evaluate("document.getElementById('t_vp').getBoundingClientRect().height") > 2900, await pg.evaluate(SHOWN('#t_more'))], [True, True, 'none'])
        expect('the chat keeps the width you chose in Lumiverse (not narrowed, not re-padded)', [w0[0], await pg.evaluate(WIDTH)], [w0[0], w0])
        expect('(and that width is the setting, not a default)', w0[0], '1100px')
        expect('the control bar is on screen, with the reminder', [await pg.evaluate(f"{BAR}.dataset.show"), await pg.evaluate("document.querySelector('.lf-th-hint').textContent.length > 10")], ['1', True])
        expect('the bar is not inside the aria-hidden overlay (it has buttons)', await pg.evaluate("!document.querySelector('.lf-th').closest('[aria-hidden=true]')"), True)
        expect('the atmosphere carries on', [await pg.evaluate("document.querySelector('.lf-ambient')?.isConnected"), await pg.evaluate("getComputedStyle(document.querySelector('.lf-ambient')).display !== 'none'")], [True, True])
        await pg.screenshot(path='theater_desktop.png')
        print('-- the bar goes away, and comes back --')
        await pg.wait_for_timeout(3700)
        expect('quiet: the bar fades away', await pg.evaluate(f"{BAR}.dataset.show"), '0')
        await pg.mouse.move(300, 300); await pg.mouse.move(320, 330); await pg.wait_for_timeout(300)
        expect('a mouse move brings it back', await pg.evaluate(f"{BAR}.dataset.show"), '1')
        expect('the reminder was for the first moments only', await pg.evaluate("document.querySelector('.lf-th-hint').style.display"), 'none')
        print('-- the reply box --')
        await pg.evaluate(f"{BTN('Show the reply box')}.click()"); await pg.wait_for_timeout(300)
        expect('"Show the reply box": the box is back, the bar moves to the top', [await pg.evaluate("getComputedStyle(document.querySelector('[data-component=InputArea]')).display"), await pg.evaluate(f"{BAR}.dataset.compose"), await pg.evaluate(f"{BAR}.getBoundingClientRect().top < 200")], ['flex', '1', True])
        expect('...and the rest stays hidden', await pg.evaluate(SHOWN('#t_qt')), 'none')
        await pg.evaluate(f"{BTN('Hide the reply box')}.click()"); await pg.wait_for_timeout(200)
        expect('"Hide the reply box" puts it away again', await pg.evaluate("getComputedStyle(document.querySelector('[data-component=InputArea]')).display"), 'none')
        print('-- leaving --')
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(300)
        expect('Esc leaves', await on(pg), False)
        expect('everything is back', [await pg.evaluate(SHOWN('#' + i)) != 'none' for i in CHROME_IDS], [True] * len(CHROME_IDS))
        expect('the reply box is back and so is the type size', [await pg.evaluate("getComputedStyle(document.querySelector('[data-component=InputArea]')).display"), await pg.evaluate("parseFloat(getComputedStyle(document.getElementById('t_content')).fontSize)")], ['flex', 14])
        expect('nothing of ours is left behind', [await pg.evaluate("document.querySelectorAll('.lf-th').length"), await pg.evaluate("document.documentElement.hasAttribute('data-lf-compose')"), await pg.evaluate("[...document.querySelectorAll('style')].some(s=>s.textContent.includes('data-lf-theater]') && s.textContent.includes('display: none !important'))")], [0, False, False])
        await pg.evaluate(CMD); await pg.wait_for_timeout(300)
        expect('the command toggles it back on', await on(pg), True)
        await pg.evaluate(CMD); await pg.wait_for_timeout(300)
        expect('...and off', await on(pg), False)
        await ctx.close()

        print('== the side drawer ==')
        ctx, pg = await boot(b, drawer_open=True)
        await pg.evaluate(CMD); await pg.wait_for_timeout(400)
        expect('open drawer: its tab is pressed once to close it', [await pg.evaluate("window.__tabClicks||0"), await pg.evaluate("window.__drawerOpen")], [1, False])
        await ctx.close()
        ctx, pg = await boot(b, drawer_open=False)
        await pg.evaluate(CMD); await pg.wait_for_timeout(400)
        expect('closed drawer: left alone', await pg.evaluate("window.__tabClicks||0"), 0)
        await ctx.close()

        print('== the auto-scroll ==')
        ctx, pg = await boot(b)
        await pg.evaluate(f"{LIST}.scrollTop=0")
        await pg.evaluate(CMD); await pg.wait_for_timeout(600)
        await pg.evaluate(f"{LIST}.scrollTop=0"); await pg.wait_for_timeout(100)
        # input pause: our own scrollTop write isn't input, so wait out the start breath
        await pg.wait_for_timeout(2300)
        t0 = await top(pg); await pg.wait_for_timeout(2000); t1 = await top(pg)
        rate = (t1 - t0) / 2
        expect('it moves at about the chosen speed (level 3 = 22 px/s)', 14 <= rate <= 30, True)
        print('   measured', round(rate, 1), 'px/s')
        await pg.evaluate(f"{BTN('Scroll faster')}.click()"); await pg.evaluate(f"{BTN('Scroll faster')}.click()"); await pg.wait_for_timeout(300)
        expect('faster x2 (level 5): stored', await pg.evaluate(f"{SETTINGS}.theaterSpeed"), 5)
        await pg.wait_for_timeout(2600)
        t0 = await top(pg); await pg.wait_for_timeout(1500); t1 = await top(pg)
        expect('and it is quicker (level 5 = 46 px/s)', 32 <= (t1 - t0) / 1.5 <= 62, True)
        print('-- pause --')
        await pg.evaluate(f"{BTN('Pause the scroll')}.click()"); await pg.wait_for_timeout(300)
        t0 = await top(pg); await pg.wait_for_timeout(1200)
        expect('paused: it stays put, and the button says so', [await top(pg) == t0, await pg.evaluate(f"{BTN('Start the scroll')} !== undefined")], [True, True])
        expect('while paused nothing is running (no frame loop)', await pg.evaluate("""new Promise(r=>{let n=0; const o=window.requestAnimationFrame; window.requestAnimationFrame=(f)=>{n++; return o(f)}; setTimeout(()=>{window.requestAnimationFrame=o; r(n)},1000)})"""), 0)
        await pg.evaluate(f"{BTN('Start the scroll')}.click()"); await pg.wait_for_timeout(600)
        t1 = await top(pg); await pg.wait_for_timeout(800)
        expect('play carries on straight away', await top(pg) > t1, True)
        print('-- you scroll: it waits, then carries on --')
        await pg.mouse.move(300, 400); await pg.mouse.wheel(0, -200); await pg.wait_for_timeout(300)
        t0 = await top(pg); await pg.wait_for_timeout(1500)
        expect('after you scroll it waits', abs(await top(pg) - t0) < 3, True)
        await pg.wait_for_timeout(1800)
        t0 = await top(pg); await pg.wait_for_timeout(1000)
        expect('and then carries on', await top(pg) > t0, True)
        print('-- the end --')
        await pg.evaluate(f"{LIST}.scrollTop={LIST}.scrollHeight"); await pg.wait_for_timeout(300)
        end = await top(pg)
        await pg.wait_for_timeout(3200)
        expect('at the end it stops (and does not run frames)', [await top(pg) == end, await pg.evaluate("""new Promise(r=>{let n=0; const o=window.requestAnimationFrame; window.requestAnimationFrame=(f)=>{n++; return o(f)}; setTimeout(()=>{window.requestAnimationFrame=o; r(n)},1000)})""")], [True, 0])
        await ctx.close()

        print('== starts paused: reduced motion, or switched off ==')
        for label, kw, st in (('reduced motion', dict(reduced=True), {}), ('"Start the gentle auto-scroll" off', {}, {'theaterScroll': False})):
            ctx, pg = await boot(b, st, **kw)
            await pg.evaluate(CMD); await pg.wait_for_timeout(2500)
            await pg.evaluate(f"{LIST}.scrollTop=0"); await pg.wait_for_timeout(2800)
            t0 = await top(pg); await pg.wait_for_timeout(1500)
            expect(f'{label}: it does not move, and offers to start', [await top(pg) == t0, await pg.evaluate(f"{BTN('Start the scroll')} !== undefined")], [True, True])
            await pg.evaluate(f"{BTN('Start the scroll')}.click()"); await pg.wait_for_timeout(1500)
            expect(f'{label}: you can start it yourself', await top(pg) > t0 + 10, True)
            await ctx.close()

        print('== where it starts ==')
        ctx, pg = await boot(b, tall=3000)
        await pg.evaluate(f"{LIST}.scrollTop={LIST}.scrollHeight"); await pg.wait_for_timeout(200)
        await pg.evaluate(CMD); await pg.wait_for_timeout(900)
        gap = await pg.evaluate(f"document.querySelector('[data-message-id=m9]').getBoundingClientRect().top - {LIST}.getBoundingClientRect().top")
        expect('at the end of the chat with a long latest reply: it starts at the top of that reply', abs(gap) < 50, True)
        await ctx.close()
        ctx, pg = await boot(b, tall=3000)
        # the first message in view, whichever it is (bigger type moves the pixels, not the place in the story)
        FIRST = f"[...document.querySelectorAll('[data-message-id]')].find(c=>c.getBoundingClientRect().bottom>{LIST}.getBoundingClientRect().top+1)?.dataset.messageId"
        # (a chat that scrolls before theater mode: some earlier messages above the long reply)
        await pg.evaluate("""(()=>{const l=document.getElementById('list'); for(let i=0;i<10;i++){const c=document.createElement('div'); c.className='B_card B_character'; c.setAttribute('data-component','BubbleMessage'); c.setAttribute('data-part','character'); c.setAttribute('data-message-id','f'+i); c.style.cssText='height:200px;flex:none'; c.textContent='earlier '+i; l.insertBefore(c, document.querySelector('[data-message-id=m9]'))}})()""")
        await pg.evaluate(f"{LIST}.scrollTop=700"); await pg.wait_for_timeout(200)
        was = await pg.evaluate(FIRST)
        await pg.evaluate(CMD); await pg.wait_for_timeout(900)
        expect('somewhere in the middle: you are still at the same message', [was.startswith('f'), await pg.evaluate(FIRST)], [True, was])
        await ctx.close()
        ctx, pg = await boot(b, tall=3000, settings={'theaterScroll': False})
        # the message button (in the pill of a message)
        btns = await pg.evaluate("[...document.querySelectorAll('[data-message-id=m1] .fake-actions .lf-moment-btn')].map(b=>b.getAttribute('aria-label'))")
        expect('the message pill has the theater button after the star and the camera', btns, ['Pin as a favourite moment', 'Make a Moment Card', 'Read from here in theater mode'])
        await pg.evaluate(f"{LIST}.scrollTop=0"); await pg.wait_for_timeout(100)
        await pg.evaluate("[...document.querySelectorAll('[data-message-id=m4] .fake-actions .lf-moment-btn')].at(-1).click()"); await pg.wait_for_timeout(900)
        expect('the message button starts theater mode, reading from that message', [await on(pg), abs(await pg.evaluate(f"document.querySelector('[data-message-id=m4]').getBoundingClientRect().top - {LIST}.getBoundingClientRect().top")) < 50], [True, True])
        await ctx.close()

        print('== text size ==')
        ctx, pg = await boot(b)
        await pg.evaluate(CMD); await pg.wait_for_timeout(300)
        await pg.evaluate(f"{BTN('Larger text')}.click()"); await pg.wait_for_timeout(300)
        expect('larger: 145%, stored, and applied (14 x 1.45)', [await pg.evaluate(f"{SETTINGS}.theaterScale"), round(await pg.evaluate("parseFloat(getComputedStyle(document.getElementById('t_content')).fontSize)"), 1), await pg.evaluate("[...document.querySelectorAll('.lf-th-val')].map(v=>v.textContent)")], [1.45, 20.3, ['3', '145%']])
        await pg.keyboard.press('-'); await pg.keyboard.press('-'); await pg.wait_for_timeout(600)
        expect('"-" twice: back to 125%', await pg.evaluate(f"{SETTINGS}.theaterScale"), 1.25)
        for _ in range(12): await pg.keyboard.press('-')
        await pg.wait_for_timeout(600)
        expect('it stops at 100%, and the button is disabled', [await pg.evaluate(f"{SETTINGS}.theaterScale"), await pg.evaluate(f"{BTN('Smaller text')}.disabled")], [1, True])
        for _ in range(20): await pg.keyboard.press('+')
        await pg.wait_for_timeout(600)
        expect('and at 220%', [await pg.evaluate(f"{SETTINGS}.theaterScale"), await pg.evaluate(f"{BTN('Larger text')}.disabled")], [2.2, True])
        await ctx.close()

        print('== keyboard ==')
        ctx, pg = await boot(b)
        await pg.evaluate(CMD); await pg.wait_for_timeout(300)
        await pg.keyboard.press('Space'); await pg.wait_for_timeout(200)
        expect('Space pauses', await pg.evaluate(f"{BTN('Start the scroll')} !== undefined"), True)
        await pg.keyboard.press('Space'); await pg.wait_for_timeout(200)
        expect('and plays again', await pg.evaluate(f"{BTN('Pause the scroll')} !== undefined"), True)
        await pg.evaluate(f"{BTN('Show the reply box')}.click()"); await pg.wait_for_timeout(200)
        await pg.focus('#ta'); await pg.keyboard.type('a - b + c '); await pg.wait_for_timeout(200)
        expect('typing in the reply box does not trigger any of it', [await pg.evaluate("document.getElementById('ta').value"), await pg.evaluate(f"{SETTINGS}.theaterScale ?? 1.35"), await pg.evaluate(f"{BTN('Pause the scroll')} !== undefined")], ['a - b + c ', 1.35, True])
        # (an untouched setting is not saved at all, which also means it was not changed)
        await ctx.close()

        print('== leaving the chat, and being switched off ==')
        ctx, pg = await boot(b)
        await pg.evaluate(CMD); await pg.wait_for_timeout(300)
        await pg.evaluate("window.__active={chatId:null,characterId:null}; __emit('CHAT_SWITCHED',{chatId:null})"); await pg.wait_for_timeout(500)
        expect('going home ends it (the home screen needs its interface)', [await on(pg), await pg.evaluate("document.querySelectorAll('.lf-th').length")], [False, 0])
        await ctx.close()
        ctx, pg = await boot(b)
        await pg.evaluate(CMD); await pg.wait_for_timeout(300)
        await pg.evaluate("window.__cleanup()"); await pg.wait_for_timeout(300)
        expect('switching Flair off mid-way gives everything back', [await on(pg), await pg.evaluate("document.querySelectorAll('.lf-th-root').length"), await pg.evaluate(SHOWN('#t_qt'))], [False, 0, 'block'])
        await ctx.close()

        print('== other ways in: the panel, the Extras menu ==')
        ctx, pg = await boot(b)
        await pg.mouse.click(600, 5)
        sec = "[...document.querySelectorAll('#drawer details')].find(d=>d.querySelector('.lf-sec-title').textContent==='Theater mode')"
        expect('the panel has a Theater mode section', await pg.evaluate(f"!!({sec})"), True)
        expect('with its controls', await pg.evaluate(f"[...({sec}).querySelectorAll('.lf-row .lf-label, .lf-btn, .R_labeledLabel')].map(e=>e.textContent.trim()).filter(Boolean)"), ['Enter theater mode', 'Text size', 'Scroll speed', 'Start the gentle auto-scroll'])
        await pg.evaluate(f"[...({sec}).querySelectorAll('button')].find(b=>b.textContent.includes('Enter theater mode')).click()"); await pg.wait_for_timeout(400)
        expect('the button enters theater mode', await on(pg), True)
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(200)
        expect('the Extras menu has a Theater mode item, and it enters', [await pg.evaluate("!!window.__inputActions.theater"), (await pg.evaluate("window.__inputActions.theater.click(); document.documentElement.hasAttribute('data-lf-theater')"))], [True, True])
        await ctx.close()

        print('== a phone ==')
        ctx, pg = await boot(b, size=(390, 844), mobile=True)
        await pg.evaluate(CMD); await pg.wait_for_timeout(500)
        box = await pg.evaluate("(()=>{const r=document.querySelector('.lf-th-bar').getBoundingClientRect(); return {l:Math.round(r.left), r:Math.round(r.right), b:Math.round(r.bottom), w:innerWidth, h:innerHeight, rows:new Set([...document.querySelectorAll('.lf-th-btn')].map(b=>Math.round(b.getBoundingClientRect().top))).size, hit:Math.min(...[...document.querySelectorAll('.lf-th-btn')].map(b=>b.getBoundingClientRect().width))}})()")
        expect('the bar fits the screen, above the bottom edge, with finger-sized buttons', [box['l'] >= 0, box['r'] <= box['w'], box['b'] <= box['h'], box['hit'] >= 44], [True, True, True, True])
        print('   bar rows', box['rows'])
        expect('the reminder on a touch screen says to tap', await pg.evaluate("document.querySelector('.lf-th-hint').textContent"), 'Tap the screen to show these controls')
        await pg.screenshot(path='theater_phone.png')
        await pg.wait_for_timeout(3800)
        expect('it fades; a tap brings it back', [await pg.evaluate(f"{BAR}.dataset.show")], ['0'])
        await pg.touchscreen.tap(200, 300); await pg.wait_for_timeout(300)
        expect('after the tap', await pg.evaluate(f"{BAR}.dataset.show"), '1')
        await ctx.close()

        await b.close()
    print('errors', errs)
asyncio.run(main())
