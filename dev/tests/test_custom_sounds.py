"""Your sounds: upload/validate, scene + always + interface slots, preview, level, reload, delete, missing-file fallback.

Run from the repo root with the mock server up (see dev/README.md):
    python dev/run.py test_custom_sounds.py
"""
import os, sys
BASE = os.environ.get("LF_BASE", "http://localhost:8765")
import asyncio, json
from playwright.async_api import async_playwright
INIT = r"""
window.__granted=['ui_panels'];
(()=>{
  window.__srcs=[]; window.__media=[];
  const C=window.AudioContext; const cbs=C.prototype.createBufferSource;
  C.prototype.createBufferSource=function(){const n=cbs.call(this); const st=n.start.bind(n); n.start=(...a)=>{window.__srcs.push({dur:n.buffer?Math.round(n.buffer.duration*10)/10:null, loop:n.loop, ctx:this===window.__scapeCtx?'scape':'other'}); return st(...a)}; return n};
  const play=HTMLMediaElement.prototype.play; HTMLMediaElement.prototype.play=function(){window.__media.push({src:(this.src||'').slice(0,5), loop:this.loop}); return play.call(this)};
})();
if(!sessionStorage.x){sessionStorage.x=1; localStorage.setItem('lumi_flair:vault:settings', JSON.stringify({at:1,data:{welcomed:true,sound:true,soundscape:true,soundscapeVolume:0.5,ambientScene:'rain',ambientAuto:false,lightDefault:'night',customSounds:{'scene:snow':'snd_doesnotexist'}}}))}
"""
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required']); c=await b.new_context(viewport={'width':1280,'height':900}); errs=[]
        pg=await c.new_page(); pg.on('pageerror',lambda e:errs.append(str(e))); pg.on('console',lambda m: m.type=='error' and errs.append(m.text))
        await pg.add_init_script(INIT)
        await pg.goto(BASE+'/lumiverse.html'); await pg.wait_for_function('window.__ready===true'); await pg.wait_for_timeout(1200)
        await pg.mouse.click(600,5); await pg.wait_for_timeout(300)
        sec = "[...document.querySelectorAll('#drawer details')].find(d=>d.querySelector('.lf-sec-title').textContent==='Your sounds')"
        print('section exists', await pg.evaluate(f"!!{sec}"), '| empty text', await pg.evaluate(f"{sec}.querySelector('.lf-snd-empty')?.textContent"))
        status = lambda: pg.evaluate("[...document.querySelectorAll('#drawer .lf-status')].find(e=>e.textContent.includes('Playing')||e.textContent.includes('Silent'))?.textContent")
        print('status before:', await status())
        # upload 4 files
        await pg.evaluate("""(async()=>{const f=async(n,m)=>{const r=await fetch(n);const b=new Uint8Array(await r.arrayBuffer());return {name:n.split('/').pop(),mimeType:m,sizeBytes:b.length,bytes:b}};
          window.__pickFiles=[await f('fixtures/my_rain_loop.wav','audio/wav'),await f('fixtures/long_tavern_track.wav','audio/wav'),await f('fixtures/ding.wav','audio/wav'),await f('fixtures/notes.txt','text/plain')]})()""")
        await pg.evaluate(f"[...{sec}.querySelectorAll('button')].find(b=>b.textContent.includes('Upload sounds')).click()"); await pg.wait_for_timeout(2500)
        print('pick opts', await pg.evaluate("JSON.stringify(__pickOpts)"))
        print('msg:', await pg.evaluate(f"{sec}.querySelector('.lf-snd-msg').textContent"), '| kind', await pg.evaluate(f"{sec}.querySelector('.lf-snd-msg').dataset.kind"))
        print('library:', await pg.evaluate(f"[...{sec}.querySelectorAll('.lf-snd-info')].map(i=>i.textContent)"), '| badge', await pg.evaluate(f"{sec}.querySelector('.lf-badge').textContent"))
        ids = await pg.evaluate("(async()=>{const db=await new Promise(r=>{const o=indexedDB.open('lumi_flair_sounds');o.onsuccess=()=>r(o.result)}); return await new Promise(r=>{const q=db.transaction('meta').objectStore('meta').getAll(); q.onsuccess=()=>r(q.result.map(m=>[m.name,m.id,m.duration]))})})()")
        print('idb meta', ids)
        idOf = {n:i for n,i,_ in ids}
        selects = f"[...{sec}.querySelectorAll('select')]"
        async def assign(slot, sid):
            await pg.evaluate(f"(()=>{{const [a,b]={selects}; a.value='{slot}'; a.dispatchEvent(new Event('change')); b.value='{sid}'; b.dispatchEvent(new Event('change'))}})()"); await pg.wait_for_timeout(900)
        print('sound select options', await pg.evaluate(f"{selects}[1].options.length"), '| slot options', await pg.evaluate(f"{selects}[0].options.length"))
        print('assigned list (missing snow):', await pg.evaluate(f"[...{sec}.querySelectorAll('.lf-snd-pair')].map(p=>p.textContent+(p.dataset.missing==='1'?' [missing]':''))"))
        n0 = await pg.evaluate("__srcs.length")
        await assign('scene:rain', idOf['my rain loop'])
        print('rain -> custom: status', await status(), '| new looping buffers', await pg.evaluate(f"__srcs.slice({n0}).filter(s=>s.loop).map(s=>s.dur)"))
        print('library meta after assign', await pg.evaluate(f"[...{sec}.querySelectorAll('.lf-snd-info span')].map(i=>i.textContent)"))
        await assign('always', idOf['long tavern track'])
        print('always -> status', await status(), '| media plays', await pg.evaluate("__media.map(m=>m.src+(m.loop?' loop':''))"))
        # ui send sound
        await assign('ui:send', idOf['ding'])
        n1 = await pg.evaluate("__srcs.length")
        await pg.evaluate("__emit('MESSAGE_SENT',{chatId:'c1',message:{id:'m77',is_user:true,content:'hi'}})"); await pg.wait_for_timeout(800)
        print('send -> buffers played', await pg.evaluate(f"__srcs.slice({n1}).map(s=>s.dur+(s.loop?' loop':''))"))
        # preview
        await pg.evaluate(f"{sec}.querySelector('.lf-snd-play').click()"); await pg.wait_for_timeout(400)
        print('preview: play button on?', await pg.evaluate(f"{sec}.querySelector('.lf-snd-play').dataset.on"), '| media', await pg.evaluate("__media.length"))
        await pg.evaluate(f"{sec}.querySelector('.lf-snd-play').click()"); await pg.wait_for_timeout(300)
        print('preview stopped?', await pg.evaluate(f"{sec}.querySelector('.lf-snd-play').dataset.on"))
        # level change -> rebuild
        await assign('always', '')
        n2 = await pg.evaluate("__srcs.length")
        print('cards', await pg.evaluate(f"{sec}.querySelectorAll('.lf-snd').length"), await pg.evaluate(f"{sec}.querySelector('.lf-snd')?.innerHTML.slice(-400)"))
        await pg.evaluate(f"(()=>{{const r={sec}.querySelector('.lf-snd input[type=range]'); r.value='60'; r.dispatchEvent(new Event('change'))}})()"); await pg.wait_for_timeout(900)
        print('level 60% -> stored', await pg.evaluate("(async()=>{const db=await new Promise(r=>{const o=indexedDB.open('lumi_flair_sounds');o.onsuccess=()=>r(o.result)}); return await new Promise(r=>{const q=db.transaction('meta').objectStore('meta').getAll(); q.onsuccess=()=>r(q.result.map(m=>m.level))})})()"), '| rebuilt loops', await pg.evaluate(f"__srcs.slice({n2}).filter(s=>s.loop).map(s=>s.dur)"))
        print('assigned:', await pg.evaluate(f"[...{sec}.querySelectorAll('.lf-snd-pair')].map(p=>p.textContent)"))
        # reload persistence
        await pg.reload(); await pg.wait_for_function('window.__ready===true'); await pg.wait_for_timeout(1500)
        await pg.mouse.click(600,5); await pg.wait_for_timeout(800)
        print('after reload library', await pg.evaluate(f"[...{sec}.querySelectorAll('.lf-snd-info b')].map(i=>i.textContent)"), '| status', await status())
        # delete rain file -> assignment removed, generated again
        await pg.evaluate(f"[...{sec}.querySelectorAll('.lf-snd')].find(c=>c.textContent.includes('my rain loop')).querySelector('.lf-snd-del').click()"); await pg.wait_for_timeout(900)
        print('after delete: library', await pg.evaluate(f"[...{sec}.querySelectorAll('.lf-snd-info b')].map(i=>i.textContent)"), '| assigned', await pg.evaluate(f"[...{sec}.querySelectorAll('.lf-snd-pair')].map(p=>p.textContent)"), '| status', await status())
        print('settings customSounds', await pg.evaluate("JSON.parse(localStorage.getItem('lumi_flair:vault:settings')).data.customSounds"))
        await pg.evaluate(f"{sec}.open=true; {sec}.scrollIntoView()"); await pg.wait_for_timeout(300)
        box = await pg.evaluate(f"(()=>{{const r={sec}.getBoundingClientRect();return {{x:r.x,y:r.y,width:r.width,height:Math.min(r.height,900-r.y)}}}})()")
        await pg.screenshot(path='mysounds.png', clip=box)
        print('errors', errs)
        await b.close()
asyncio.run(main())
