"""Floating volume widget + background dim/mute (reads the real master gain).

Run from the repo root with the mock server up (see dev/README.md):
    python dev/run.py test_volume_widget.py
"""
import os, sys
BASE = os.environ.get("LF_BASE", "http://localhost:8765")
import asyncio, json
from playwright.async_api import async_playwright
INIT = """
window.__granted = JSON.parse(sessionStorage.g || '[]');
(()=>{const C=window.AudioContext; const cg=C.prototype.createGain; window.__gains=[]; C.prototype.createGain=function(){const g=cg.call(this); window.__gains.push(g); return g}})();
if(!sessionStorage.x){sessionStorage.x=1; localStorage.setItem('lumi_flair:vault:settings', JSON.stringify({at:1,data:{welcomed:true,soundscape:true,soundscapeVolume:0.5,ambientScene:'rain'}}))}
"""
SW = "(lbl)=>[...document.querySelectorAll('#drawer .lf-row')].find(r=>r.querySelector('.lf-label')?.textContent===lbl)?.querySelector('[role=switch]')"
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required']); c=await b.new_context(viewport={'width':1280,'height':900}); errs=[]
        pg=await c.new_page(); pg.on('pageerror',lambda e:errs.append(str(e))); pg.on('console',lambda m: m.type=='error' and errs.append(m.text))
        await pg.add_init_script(INIT)
        await pg.goto(BASE+'/lumiverse.html'); await pg.wait_for_function('window.__ready===true'); await pg.wait_for_timeout(1200)
        await pg.mouse.click(5,5)
        print('before: widget?', await pg.evaluate("!!window.__float"), '| grant button visible?', await pg.evaluate("[...document.querySelectorAll('#drawer button')].find(b=>b.textContent.includes('Allow the floating widget'))?.style.display"))
        # turn on via toggle -> permission request
        await pg.evaluate(f"({SW})('Floating volume widget').click()"); await pg.wait_for_timeout(600)
        print('after toggle: granted', await pg.evaluate("__granted"), '| widget?', await pg.evaluate("!!window.__float"), '| pos', await pg.evaluate("__float&&__float.o.initialPosition"))
        lab = lambda: pg.evaluate("document.querySelector('.lf-sw-label')?.textContent")
        print('label:', await lab(), '| pct', await pg.evaluate("document.querySelector('.lf-sw-pct').textContent"), '| on', await pg.evaluate("document.querySelector('.lf-sw').dataset.on"), '| state', await pg.evaluate("document.querySelector('.lf-sw').dataset.state"))
        await pg.wait_for_timeout(1500)
        print('master gain (full):', round(await pg.evaluate("__gains[0].gain.value"),3), 'ac', await pg.evaluate("__gains[0].context.state"))
        # slider
        bx = await pg.evaluate("(()=>{const r=document.querySelector('.lf-sw-slider').getBoundingClientRect();return [r.x,r.y,r.width,r.height]})()")
        await pg.mouse.click(bx[0]+bx[2]*0.8, bx[1]+bx[3]/2); await pg.wait_for_timeout(400)
        print('slider 80 -> stored', await pg.evaluate("JSON.parse(localStorage.getItem('lumi_flair:vault:settings')).data.soundscapeVolume"), '| panel slider', await pg.evaluate("[...document.querySelectorAll('#drawer .R_labeledRow')].find(r=>r.textContent.includes('Soundscape volume')).querySelector('input').value"))
        # slider pointerdown must not drag the widget
        d0 = await pg.evaluate("window.__dragStarted||0")
        box = await pg.evaluate("(()=>{const r=document.querySelector('.lf-sw-slider').getBoundingClientRect();return [r.x,r.y,r.width,r.height]})()")
        await pg.mouse.move(box[0]+box[2]*0.2, box[1]+box[3]/2); await pg.mouse.down(); await pg.mouse.move(box[0]+box[2]*0.5, box[1]+box[3]/2+30, steps=5); await pg.mouse.up(); await pg.wait_for_timeout(300)
        print('slider drag started widget drag?', (await pg.evaluate("window.__dragStarted||0"))-d0, '| widget moved?', await pg.evaluate("__float.c.style.left+','+__float.c.style.top"), '| volume', await pg.evaluate("document.querySelector('.lf-sw-pct').textContent"))
        await pg.evaluate("document.querySelector('.lf-sw-slider').focus()"); await pg.keyboard.press('ArrowRight'); await pg.keyboard.press('ArrowRight'); await pg.wait_for_timeout(300)
        print('2x ArrowRight ->', await pg.evaluate("document.querySelector('.lf-sw-pct').textContent"), '| stored', await pg.evaluate("JSON.parse(localStorage.getItem('lumi_flair:vault:settings')).data.soundscapeVolume"), '| aria', await pg.evaluate("document.querySelector('.lf-sw-slider').getAttribute('aria-valuenow')"))
        await pg.mouse.move(bx[0]+bx[2]*0.5, bx[1]+5); await pg.mouse.wheel(0,-100); await pg.wait_for_timeout(300)
        print('wheel up ->', await pg.evaluate("document.querySelector('.lf-sw-pct').textContent"))
        # mute button
        await pg.evaluate("document.querySelector('.lf-sw-btn').click()"); await pg.wait_for_timeout(400)
        print('button -> soundscape setting', await pg.evaluate("JSON.parse(localStorage.getItem('lumi_flair:vault:settings')).data.soundscape"), '| label', await lab(), '| panel switch', await pg.evaluate(f"({SW})('Soundscapes').className"))
        await pg.evaluate("document.querySelector('.lf-sw-btn').click()"); await pg.wait_for_timeout(400)
        print('button again -> label', await lab())
        # drag by grip
        g = await pg.evaluate("(()=>{const r=document.querySelector('.lf-sw-grip').getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2]})()")
        await pg.mouse.move(*g); await pg.mouse.down(); await pg.mouse.move(g[0]-500, g[1]+300, steps=8); await pg.mouse.up(); await pg.wait_for_timeout(500)
        print('dragged to', await pg.evaluate("__float.c.style.left+','+__float.c.style.top"), '| saved pos', await pg.evaluate("JSON.parse(localStorage.getItem('lumi_flair:vault:settings')).data.soundWidgetPos"))
        # drag off-screen -> clamped
        g = await pg.evaluate("(()=>{const r=document.querySelector('.lf-sw-grip').getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2]})()")
        await pg.mouse.move(*g); await pg.mouse.down(); await pg.mouse.move(1270, 895, steps=8); await pg.mouse.up(); await pg.wait_for_timeout(500)
        print('dragged off edge ->', await pg.evaluate("__float.c.style.left+','+__float.c.style.top"), '| saved', await pg.evaluate("JSON.parse(localStorage.getItem('lumi_flair:vault:settings')).data.soundWidgetPos"))
        # focus behaviour: dim
        sel = "(v)=>{const s=[...document.querySelectorAll('#drawer select')].find(s=>[...s.options].some(o=>o.value==='mute')); s.value=v; s.dispatchEvent(new Event('change'))}"
        print('dim slider hidden while keep?', await pg.evaluate("[...document.querySelectorAll('#drawer .R_labeledRow')].find(r=>r.textContent.includes('Dim to')).parentElement.style.display"))
        await pg.evaluate(f"({sel})('dim')"); await pg.wait_for_timeout(300)
        print('dim slider shown?', repr(await pg.evaluate("[...document.querySelectorAll('#drawer .R_labeledRow')].find(r=>r.textContent.includes('Dim to')).parentElement.style.display")))
        full = await pg.evaluate("__gains[0].gain.value")
        await pg.evaluate("document.hasFocus=()=>false; window.dispatchEvent(new Event('blur'))"); await pg.wait_for_timeout(1800)
        dim = await pg.evaluate("__gains[0].gain.value")
        print(f'blur (dim 30%): gain {full:.3f} -> {dim:.3f} ratio {dim/full:.2f} | label', await lab())
        await pg.evaluate(f"({sel})('mute')"); await pg.wait_for_timeout(1800)
        print('mute while blurred: gain', round(await pg.evaluate("__gains[0].gain.value"),4), '| label', await lab())
        await pg.evaluate("document.hasFocus=()=>true; window.dispatchEvent(new Event('focus'))"); await pg.wait_for_timeout(1800)
        print('focus back: gain', round(await pg.evaluate("__gains[0].gain.value"),3), '| label', await lab())
        # blur into an iframe inside the page (hasFocus stays true) -> no dim
        await pg.evaluate("window.dispatchEvent(new Event('blur'))"); await pg.wait_for_timeout(1200)
        print('blur but focus inside page frame: gain', round(await pg.evaluate("__gains[0].gain.value"),3))
        await pg.evaluate(f"({sel})('keep')"); await pg.evaluate("document.hasFocus=()=>false; window.dispatchEvent(new Event('blur'))"); await pg.wait_for_timeout(1500)
        print('keep + blurred: gain', round(await pg.evaluate("__gains[0].gain.value"),3), '| label', await lab())
        await pg.evaluate("document.hasFocus=()=>true; window.dispatchEvent(new Event('focus')); sessionStorage.g=JSON.stringify(__granted)")
        # reload -> widget restored at saved position
        await pg.reload(); await pg.wait_for_function('window.__ready===true'); await pg.wait_for_timeout(1500)
        print('after reload widget?', await pg.evaluate("!!window.__float"), 'at', await pg.evaluate("__float&&__float.c.style.left+','+__float.c.style.top"), '| label', await lab())
        # flair disabled -> widget hidden; enabled -> back
        await pg.evaluate(f"({SW})('Enable Lumi Flair').click()"); await pg.wait_for_timeout(400)
        print('flair off -> widget?', await pg.evaluate("!!window.__float"))
        await pg.evaluate(f"({SW})('Enable Lumi Flair').click()"); await pg.wait_for_timeout(400)
        print('flair on -> widget?', await pg.evaluate("!!window.__float"), '| floats created total', await pg.evaluate("__floatCount"))
        # toggle off
        await pg.evaluate(f"({SW})('Floating volume widget').click()"); await pg.wait_for_timeout(400)
        print('toggle off -> widget?', await pg.evaluate("!!window.__float"))
        # permission missing but setting on (e.g. revoked): button appears
        await pg.evaluate(f"({SW})('Floating volume widget').click()"); await pg.wait_for_timeout(600)
        await pg.evaluate("sessionStorage.g=JSON.stringify(['app_manipulation'])"); await pg.reload(); await pg.wait_for_function('window.__ready===true'); await pg.wait_for_timeout(1200)
        print('revoked: widget?', await pg.evaluate("!!window.__float"), '| switch on?', await pg.evaluate(f"({SW})('Floating volume widget').className"), '| allow button', repr(await pg.evaluate("[...document.querySelectorAll('#drawer button')].find(b=>b.textContent.includes('Allow the floating widget')).style.display")))
        await pg.evaluate("[...document.querySelectorAll('#drawer button')].find(b=>b.textContent.includes('Allow the floating widget')).click()"); await pg.wait_for_timeout(500)
        print('re-request ok ->', await pg.evaluate("__granted"), 'widget', await pg.evaluate("!!window.__float"))
        await pg.evaluate("__cleanup()"); await pg.wait_for_timeout(200)
        print('cleanup -> widget?', await pg.evaluate("!!window.__float"))
        print('errors', errs)
        await b.close()
asyncio.run(main())
