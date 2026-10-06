"""Moment Cards and the buttons in the message action pill.

Checks that our buttons sit in the host's pill row at the host's size (the host wraps extension buttons in a
plain block div), that the card is the wide 1600x1000 one, that the modal lets you choose the text (a selection
made in the message before pressing the camera, "Use selection" in the box, "Whole message", free editing),
that the preview follows, and that a passage too long to fit is said to be shortened.

Run from the repo root with the mock server up (see dev/README.md):
    python dev/run.py test_moment_card.py
"""
import os, base64
BASE = os.environ.get("LF_BASE", "http://localhost:8765")
import asyncio, json
from playwright.async_api import async_playwright

errs = []

def expect(label, got, want):
    ok = got == want
    print(f"{'ok ' if ok else 'BAD'} {label}: {got}" + ('' if ok else f'  (wanted {want})'))
    if not ok: errs.append(f'{label}: got {got}, wanted {want}')

SEED = "if(!sessionStorage.x){sessionStorage.x=1; localStorage.setItem('lumi_flair:vault:settings', JSON.stringify({at:1,data:{welcomed:true,intro:false}}))}"
# The host's pill: a flex row of 26px buttons, then the extension mount (display: contents) holding our stamped div.
PILL = r"""
(()=>{
  const ours=document.querySelector('[data-message-id=m1] .fake-actions')
  const pill=document.createElement('div'); pill.setAttribute('data-component','BubbleActions'); pill.id='t_pill'
  pill.style.cssText='display:flex;gap:1px;padding:2px 3px;border-radius:9px;border:1px solid #444;background:#222;width:max-content;position:relative'
  for(let i=0;i<8;i++){const b=document.createElement('button'); b.className='t_host'; b.style.cssText='width:26px;height:26px;display:flex;align-items:center;justify-content:center;border:none;background:transparent'; b.textContent='·'; pill.appendChild(b)}
  const mount=document.createElement('span'); mount.setAttribute('data-spindle-mount','message_actions'); mount.style.display='contents'
  mount.appendChild(ours); pill.appendChild(mount)
  document.querySelector('[data-message-id=m1] .B_bubble').appendChild(pill)
})()
"""
CAM = lambda mid: f"[...document.querySelectorAll('[data-message-id={mid}] .lf-moment-btn')].find(b=>b.getAttribute('aria-label')==='Make a Moment Card')"
MODAL = "window.__modal.root"
TA = f"{MODAL}.querySelector('textarea')"
IMG = f"{MODAL}.querySelector('.lf-moment img')"
NOTE = f"{MODAL}.querySelector('.lf-moment-note')"
BTN = lambda t: f"[...{MODAL}.querySelectorAll('button')].find(b=>b.textContent==={json.dumps(t)})"

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width': 1280, 'height': 900})
        pg = await ctx.new_page()
        pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: m.type == 'error' and errs.append(m.text))
        await pg.add_init_script(SEED)
        await pg.goto(BASE + '/lumiverse.html'); await pg.wait_for_function('window.__ready===true'); await pg.wait_for_timeout(700)

        print('== our buttons in the host pill ==')
        await pg.evaluate(PILL); await pg.wait_for_timeout(200)
        rows = await pg.evaluate("[...document.querySelectorAll('#t_pill button')].map(b=>{const r=b.getBoundingClientRect(); return [Math.round(r.top), Math.round(r.width), Math.round(r.height)]})")
        expect('all eleven buttons (8 host + star, camera, theater) on one row', len({r[0] for r in rows}), 1)
        expect('ours are the host size (26 x 26)', [r[1:] for r in rows[8:]], [[26, 26]] * 3)
        expect('the pill stays one row high', await pg.evaluate("Math.round(document.getElementById('t_pill').getBoundingClientRect().height)") <= 34, True)
        expect('icons at the host size (13 px)', await pg.evaluate("[...document.querySelectorAll('#t_pill .lf-moment-btn svg')].map(s=>Math.round(s.getBoundingClientRect().width))"), [13, 13, 13])
        await pg.evaluate("document.getElementById('t_pill').scrollIntoView()")
        box = await pg.evaluate("(()=>{const r=document.getElementById('t_pill').getBoundingClientRect(); return {x:r.x-6,y:r.y-6,width:r.width+12,height:r.height+12}})()")
        await pg.screenshot(path='pill.png', clip=box)

        print('== the card ==')
        await pg.evaluate(f"{CAM('m4')}.click()"); await pg.wait_for_timeout(1200)
        expect('the modal opens, wide', [await pg.evaluate("window.__modal?.title"), await pg.evaluate("window.__modalWidth")], ['Moment Card', 760])
        size = await pg.evaluate(f"new Promise(r=>{{const i={IMG}; const go=()=>r([i.naturalWidth,i.naturalHeight]); i.complete?go():i.onload=go}})")
        expect('the image is the 1600 x 1000 card plus a margin for its shadow', size, [1792, 1216])
        px = await pg.evaluate(f"""new Promise(r=>{{const i={IMG}; const go=()=>{{const c=document.createElement('canvas'); c.width=i.naturalWidth; c.height=i.naturalHeight; const g=c.getContext('2d'); g.drawImage(i,0,0);
          const a=(x,y)=>g.getImageData(x,y,1,1).data[3]; r({{corner:a(2,2), cardCorner:a(96+3,80+3), inside:a(96+60,80+60), centre:a(896,580), below:a(896,80+1000+40), side:a(40,600)}})}}; i.complete?go():i.onload=go}})""")
        print('   alpha', px)
        expect('like a window capture: transparent around it', px['corner'], 0)
        expect('rounded corners (the very corner of the card is not filled)', px['cardCorner'] < 200, True)
        expect('the card itself is solid', [px['inside'], px['centre']], [255, 255])
        expect('a soft shadow under it (partly see-through)', 0 < px['below'] < 255, True)
        expect('a lighter shadow at the sides', px['side'] < px['below'], True)
        expect('the text starts as the whole message', await pg.evaluate(f"{TA}.value"), 'Latest reply.')
        expect('the reminder says how to choose', await pg.evaluate(f"{NOTE}.dataset.cut"), '0')
        await pg.evaluate("document.querySelector('.fake-modal').remove(); window.__modal=null")

        print('-- a selection in the message before pressing the camera --')
        await pg.evaluate("""(()=>{const el=document.querySelector("[data-message-id='m1'] [data-lf='whisper']"); const r=document.createRange(); r.selectNodeContents(el); const s=getSelection(); s.removeAllRanges(); s.addRange(r)})()""")
        await pg.evaluate(f"(()=>{{const c={CAM('m1')}; c.dispatchEvent(new PointerEvent('pointerdown',{{bubbles:true}})); getSelection().removeAllRanges(); c.click()}})()"); await pg.wait_for_timeout(1200)
        expect('the card starts with just the selected words (even though the tap cleared the selection)', await pg.evaluate(f"{TA}.value"), 'leaned closer')
        first = await pg.evaluate(f"{IMG}.src")
        print('-- choosing in the box --')
        await pg.evaluate(f"{BTN('Whole message')}.click()"); await pg.wait_for_timeout(700)
        whole = await pg.evaluate(f"{TA}.value")
        expect('"Whole message" puts the whole text back (without the markup)', [whole.startswith('She leaned closer and the room trembled.'), '<' in whole], [True, False])
        expect('...and the preview follows', await pg.evaluate(f"{IMG}.src") != first, True)
        before = await pg.evaluate(f"{IMG}.src")
        await pg.evaluate(f"(()=>{{const t={TA}; const i=t.value.indexOf('the room'); t.focus(); t.setSelectionRange(i, i+'the room trembled'.length)}})()")
        await pg.evaluate(f"{BTN('Use selection')}.dispatchEvent(new MouseEvent('mousedown',{{bubbles:true,cancelable:true}}))")
        await pg.evaluate(f"{BTN('Use selection')}.click()"); await pg.wait_for_timeout(700)
        expect('"Use selection" keeps just the selected part', await pg.evaluate(f"{TA}.value"), 'the room trembled')
        expect('...and redraws', await pg.evaluate(f"{IMG}.src") != before, True)
        await pg.evaluate(f"(()=>{{const t={TA}; t.setSelectionRange(3,3)}})()")
        await pg.evaluate(f"{BTN('Use selection')}.click()"); await pg.wait_for_timeout(200)
        expect('"Use selection" with nothing selected says what to do', await pg.evaluate(f"{NOTE}.textContent"), 'Select some of the text first, then press “Use selection”.')
        print('-- editing --')
        await pg.fill('.fake-modal textarea', 'A line I wrote myself.'); await pg.wait_for_timeout(700)
        expect('free editing works too', await pg.evaluate(f"{TA}.value"), 'A line I wrote myself.')
        await pg.fill('.fake-modal textarea', ('A long passage that goes on and on. ' * 60).strip()); await pg.wait_for_timeout(800)
        expect('too long: the note says it is shortened', [await pg.evaluate(f"{NOTE}.dataset.cut"), 'shorter part' in await pg.evaluate(f"{NOTE}.textContent")], ['1', True])
        await pg.fill('.fake-modal textarea', 'Short again.'); await pg.wait_for_timeout(800)
        expect('short again: the warning goes', await pg.evaluate(f"{NOTE}.dataset.cut"), '0')
        await pg.fill('.fake-modal textarea', 'She leaned closer and the room trembled. A rune lit up, and for a heartbeat the whole tower held its breath, waiting to see which of them would speak first.'); await pg.wait_for_timeout(800)
        data = await pg.evaluate(f"{IMG}.src")
        with open('moment_card.png', 'wb') as f: f.write(base64.b64decode(data.split(',', 1)[1]))
        await pg.screenshot(path='moment_modal.png')
        print('-- download --')
        async with pg.expect_download() as dl:
            await pg.evaluate(f"{BTN('Download PNG')}.click()")
        expect('Download PNG saves a file named after the character', (await dl.value).suggested_filename, 'Hazel-lumi-flair.png')
        await ctx.close(); await b.close()
    print('errors', errs)
asyncio.run(main())
