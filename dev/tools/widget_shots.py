"""Screenshots of the volume widget in 5 states (open: playing, dimmed in the background, off; collapsed: playing, off) x 2 themes under hostile host CSS.

Run from the repo root with the mock server up (see dev/README.md):
    python dev/run.py widget_shots.py
"""
import os, sys
BASE = os.environ.get("LF_BASE", "http://localhost:8765")
import asyncio
from playwright.async_api import async_playwright
from PIL import Image
INIT = """window.__granted=['ui_panels'];
if(!sessionStorage.x){sessionStorage.x=1; localStorage.setItem('lumi_flair:vault:settings', JSON.stringify({at:1,data:{welcomed:true,soundscape:true,soundscapeVolume:0.45,ambientScene:'rain',lightDefault:'night',soundWidget:true,soundUnfocused:'dim'}}))}"""
LIGHT = ":root{--lumiverse-bg:#f4f1ea;--lumiverse-bg-elevated:#ffffff;--lumiverse-text:#1d1a24;--lumiverse-text-dim:#4a4555;--lumiverse-text-muted:#7a7486;--lumiverse-border:rgba(0,0,0,.12);--lumiverse-fill:rgba(0,0,0,.06);--lumiverse-fill-subtle:rgba(0,0,0,.1);--lumiverse-primary:#7c5cd6}"
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required']); c=await b.new_context(viewport={'width':1280,'height':900}, device_scale_factor=2)
        pg=await c.new_page(); await pg.add_init_script(INIT)
        await pg.goto(BASE+'/lumiverse.html'); await pg.wait_for_function('window.__ready===true'); await pg.wait_for_timeout(1500)
        await pg.mouse.click(600,5); await pg.wait_for_timeout(400)
        await pg.evaluate("for(const el of document.body.children){ if(el!==__float.c) el.style.visibility='hidden' } __float.c.style.visibility='visible'")
        await pg.add_style_tag(content='body{text-align:center;line-height:1.8} button{padding:8px 16px;min-height:40px;min-width:64px;border-radius:8px;margin:4px;font-size:15px} span{font-size:15px;line-height:24px;margin:2px;display:inline-block} div{padding:2px} input[type=range]{height:32px;margin:8px 0} svg{width:1.5em;height:1.5em}')
        rows=[]
        for theme,bg,css in [('dark','#15121d',''),('light','#f4f1ea',LIGHT)]:
            if css: await pg.add_style_tag(content=css)
            await pg.add_style_tag(content=f"html,body{{background:{bg}!important}}")
            await pg.evaluate("__float.c.style.left='40px'; __float.c.style.top='40px'"); await pg.wait_for_timeout(200)
            clip={'x':20,'y':20,'width':320,'height':92}
            shots=[]
            await pg.evaluate("document.hasFocus=()=>true; window.dispatchEvent(new Event('focus'))"); await pg.wait_for_timeout(250)
            await pg.screenshot(path=f'w_{theme}_on.png', clip=clip); shots.append(f'w_{theme}_on.png')
            await pg.evaluate("document.hasFocus=()=>false; window.dispatchEvent(new Event('blur'))"); await pg.wait_for_timeout(250)
            await pg.screenshot(path=f'w_{theme}_bg.png', clip=clip); shots.append(f'w_{theme}_bg.png')
            await pg.evaluate("document.hasFocus=()=>true; window.dispatchEvent(new Event('focus')); document.querySelector('.lf-sw-btn').click()"); await pg.wait_for_timeout(300)
            await pg.screenshot(path=f'w_{theme}_off.png', clip=clip); shots.append(f'w_{theme}_off.png')
            await pg.evaluate("document.querySelector('.lf-sw-btn').click()"); await pg.wait_for_timeout(300)
            # collapsed to the round button: playing, then off
            await pg.evaluate("document.querySelector('.lf-sw-fold').click()"); await pg.wait_for_timeout(300)
            await pg.screenshot(path=f'w_{theme}_dot_on.png', clip=clip); shots.append(f'w_{theme}_dot_on.png')
            await pg.evaluate("document.querySelector('.lf-sw').dataset.on='0'"); await pg.wait_for_timeout(100)  # (the look of the off state; the real toggle is in the open pill)
            await pg.screenshot(path=f'w_{theme}_dot_off.png', clip=clip); shots.append(f'w_{theme}_dot_off.png')
            await pg.evaluate("document.querySelector('.lf-sw').dataset.on='1'; document.querySelector('.lf-sw-dot').click(); document.activeElement.blur()"); await pg.wait_for_timeout(300)
            rows.append(shots)
        ims=[[Image.open(s) for s in r] for r in rows]
        w,h=ims[0][0].size
        out=Image.new('RGB',(w*5,h*2))
        for y,r in enumerate(ims):
            for x,im in enumerate(r): out.paste(im,(x*w,y*h))
        out.save('sw_hostile.png'); print(out.size)
        await b.close()
asyncio.run(main())
