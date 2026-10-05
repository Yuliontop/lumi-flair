"""Lumiverse theme matching: pack, character aware, mood, accent-only, off.

Run from the repo root with the mock server up (see dev/README.md):
    python dev/run.py test_theme.py
"""
import os, sys
BASE = os.environ.get("LF_BASE", "http://localhost:8765")
import asyncio, json
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); c=await b.new_context(viewport={'width':1280,'height':900}); errs=[]
        # 1) user who never enables theming: no ui_theme messages at all
        pg=await c.new_page(); pg.on('pageerror',lambda e:errs.append(str(e))); pg.on('console',lambda m: m.type=='error' and errs.append(m.text))
        await pg.add_init_script("window.__granted=['app_manipulation']; if(!sessionStorage.x){sessionStorage.x=1; localStorage.setItem('lumi_flair:vault:settings', JSON.stringify({at:1,data:{welcomed:true}}))}")
        await pg.goto(BASE+'/lumiverse.html'); await pg.wait_for_function('window.__ready===true'); await pg.wait_for_timeout(1500)
        print('theme off -> ui_theme msgs:', await pg.evaluate("__sent.filter(x=>x.type==='ui_theme').length"))
        await pg.evaluate("document.querySelector('.lf-pack[data-pack=cyber]').click()"); await pg.wait_for_timeout(400)
        print('pack applied, still off -> msgs:', await pg.evaluate("__sent.filter(x=>x.type==='ui_theme').length"))
        # 2) choose Match the Flair Pack via the select
        await pg.evaluate("(()=>{const sel=[...document.querySelectorAll('#drawer select')].find(s=>[...s.options].some(o=>o.value==='character'&&o.textContent.includes('Character aware'))); sel.value='pack'; sel.dispatchEvent(new Event('change'))})()")
        await pg.wait_for_timeout(500)
        last = await pg.evaluate("__sent.filter(x=>x.type==='ui_theme').at(-1)")
        print('match pack -> accent', last['spec']['accent'], 'bg', last['spec']['bgDark'], 'depth', last['spec']['depth'])
        print('  page bg', await pg.evaluate("getComputedStyle(document.body).backgroundColor"), '| status:', await pg.evaluate("document.querySelector('.lf-theme-status').textContent"))
        await pg.evaluate("document.querySelector('.lf-pack[data-pack=cyber]').scrollIntoView({block:'start'})"); await pg.wait_for_timeout(300)
        await pg.screenshot(path='v7_cyber.png')
        # 3) mood folds into theme (no separate palette)
        await pg.evaluate("document.querySelector('#drawer [role=switch][aria-label=\"Tint the whole UI with the mood\"]')?.click()"); await pg.wait_for_timeout(200)
        await pg.evaluate("__emit('EXPRESSION_CHANGED',{chatId:'c1',characterId:'char1',label:'angry'})"); await pg.wait_for_timeout(500)
        last = await pg.evaluate("__sent.filter(x=>x.type==='ui_theme').at(-1)")
        print('angry mood -> theme accent', last['spec']['accent'], 'bg kept', last['spec']['bgDark'], '| palette tint msgs w/ colour:', await pg.evaluate("__sent.filter(x=>x.type==='mood_tint'&&x.accent).length"))
        await pg.evaluate("__emit('EXPRESSION_CHANGED',{chatId:'c1',characterId:'char1',label:'neutral'})"); await pg.wait_for_timeout(300)
        # 4) Character Aware pack
        await pg.evaluate("document.querySelector('.lf-pack[data-pack=character]').click()"); await pg.wait_for_timeout(2500)
        last = await pg.evaluate("__sent.filter(x=>x.type==='ui_theme').at(-1)")
        lfchar = await pg.evaluate("getComputedStyle(document.documentElement).getPropertyValue('--lf-char')")
        print('character aware -> accent', last['spec']['accent'] if last['spec'] else None, '| --lf-char', lfchar.strip(), '| status:', await pg.evaluate("document.querySelector('.lf-theme-status').textContent"))
        print('  swatch', await pg.evaluate("document.querySelector('.lf-pack[data-pack=character] .lf-pack-sw').style.background"))
        await pg.evaluate("document.querySelector('.lf-pack[data-pack=character]').scrollIntoView({block:'start'})"); await pg.wait_for_timeout(400)
        await pg.screenshot(path='v7_character.png')
        # 5) another character speaks last -> theme follows
        await pg.evaluate("""(()=>{const a=document.querySelector('[data-message-id=m1][data-component]'); const n=a.cloneNode(true); n.dataset.messageId='m9'; document.querySelector('[data-message-id=m4][data-component]').after(n)})()""")
        await pg.wait_for_timeout(2000)
        last2 = await pg.evaluate("__sent.filter(x=>x.type==='ui_theme').at(-1)")
        print('new speaker -> accent', last2['spec']['accent'], '(was', last['spec']['accent'] + ')')
        # 6) accent-only depth & off
        await pg.evaluate("(()=>{const sel=[...document.querySelectorAll('#drawer select')].find(s=>[...s.options].some(o=>o.value==='accent')); sel.value='accent'; sel.dispatchEvent(new Event('change'))})()"); await pg.wait_for_timeout(300)
        print('accent only ->', await pg.evaluate("__sent.filter(x=>x.type==='ui_theme').at(-1).spec.depth"), '| page bg back to', await pg.evaluate("getComputedStyle(document.body).backgroundColor"))
        await pg.evaluate("(()=>{const sel=[...document.querySelectorAll('#drawer select')].find(s=>[...s.options].some(o=>o.value==='character'&&o.textContent.includes('Character aware'))); sel.value='off'; sel.dispatchEvent(new Event('change'))})()"); await pg.wait_for_timeout(300)
        print('off ->', await pg.evaluate("__sent.filter(x=>x.type==='ui_theme').at(-1).spec"))
        # 7) reload keeps it
        await pg.reload(); await pg.wait_for_function('window.__ready===true'); await pg.wait_for_timeout(800)
        print('after reload uiTheme select:', await pg.evaluate("[...document.querySelectorAll('#drawer select')].find(s=>[...s.options].some(o=>o.value==='character'&&o.textContent.includes('Character aware'))).value"))
        print('errors', errs)
        await b.close()
asyncio.run(main())
