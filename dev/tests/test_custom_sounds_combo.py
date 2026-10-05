"""Your sounds: lighting file over a generated scene; widget label for an always-play file.

Run from the repo root with the mock server up (see dev/README.md):
    python dev/run.py test_custom_sounds_combo.py
"""
import os, sys
BASE = os.environ.get("LF_BASE", "http://localhost:8765")
import asyncio
from playwright.async_api import async_playwright
INIT = open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'test_custom_sounds.py')).read().split('INIT = r"""')[1].split('"""')[0].replace("customSounds:{'scene:snow':'snd_doesnotexist'}","soundWidget:true")
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required']); pg=await b.new_page(viewport={'width':1280,'height':900}); errs=[]
        pg.on('pageerror',lambda e:errs.append(str(e))); pg.on('console',lambda m: m.type=='error' and errs.append(m.text))
        await pg.add_init_script(INIT)
        await pg.goto(BASE+'/lumiverse.html'); await pg.wait_for_function('window.__ready===true'); await pg.wait_for_timeout(1000)
        await pg.mouse.click(600,5)
        sec = "[...document.querySelectorAll('#drawer details')].find(d=>d.querySelector('.lf-sec-title').textContent==='Your sounds')"
        await pg.evaluate("""(async()=>{const f=async(n,m)=>{const r=await fetch(n);const b=new Uint8Array(await r.arrayBuffer());return {name:n.split('/').pop(),mimeType:m,sizeBytes:b.length,bytes:b}}; window.__pickFiles=[await f('fixtures/long_tavern_track.wav','audio/wav'),await f('fixtures/my_rain_loop.wav','audio/wav')]})()""")
        await pg.evaluate(f"[...{sec}.querySelectorAll('button')].find(b=>b.textContent.includes('Upload sounds')).click()"); await pg.wait_for_timeout(2000)
        ids = await pg.evaluate("(async()=>{const db=await new Promise(r=>{const o=indexedDB.open('lumi_flair_sounds');o.onsuccess=()=>r(o.result)}); return await new Promise(r=>{const q=db.transaction('meta').objectStore('meta').getAll(); q.onsuccess=()=>r(Object.fromEntries(q.result.map(m=>[m.name,m.id])))})})()")
        sel = f"[...{sec}.querySelectorAll('select')]"
        async def assign(slot, sid):
            await pg.evaluate(f"(()=>{{const [a,b]={sel}; a.value='{slot}'; a.dispatchEvent(new Event('change')); b.value='{sid}'; b.dispatchEvent(new Event('change'))}})()"); await pg.wait_for_timeout(900)
        status = lambda: pg.evaluate("[...document.querySelectorAll('#drawer .lf-status')].find(e=>e.textContent.includes('Playing'))?.textContent")
        n=await pg.evaluate("__srcs.length"); m=await pg.evaluate("__media.length")
        await assign('light:night', ids['long tavern track'])
        print('night file + generated rain:', await status(), '| widget', await pg.evaluate("document.querySelector('.lf-sw-label')?.textContent"), '| media', await pg.evaluate(f"__media.slice({m}).length"), '| generated rain clicks keep coming', await pg.evaluate(f"__srcs.slice({n}).filter(s=>s.dur===3).length>0"))
        await assign('always', ids['my rain loop'])
        print('always:', await status(), '| widget', await pg.evaluate("document.querySelector('.lf-sw-label')?.textContent"))
        # reset to generated and turn off soundscape: no errors
        await assign('always',''); await assign('light:night','')
        print('back to generated:', await status())
        print('errors', errs)
        await b.close()
asyncio.run(main())
