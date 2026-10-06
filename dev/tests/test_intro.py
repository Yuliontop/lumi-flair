"""Character intro: the name card that plays when a chat opens, its theme sound, and the group-chat speaker chip.

Checks the card's text and colour (the aura of the avatar on screen), that it leaves by itself and when tapped,
that it plays every time a chat is opened (also when you click off to the home screen and back onto the same chat), that it stays away when switched off / during the welcome / in a group chat, that
reduced motion turns the movement off, the theme sound (and where it is stored), and, in a group chat, the chip
(name, colour, turn count, hand-over between speakers) and the dimming of the other messages.

Run from the repo root with the mock server up (see dev/README.md):
    python dev/run.py test_intro.py
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

SEED = lambda extra: "if(!sessionStorage.x){sessionStorage.x=1; localStorage.setItem('lumi_flair:vault:settings', JSON.stringify({at:1,data:Object.assign({welcomed:true}, %s)}))}" % json.dumps(extra)
GROUP = "document.addEventListener('DOMContentLoaded',()=>document.getElementById('list').setAttribute('data-group-chat',''));"
SPY = r"""
window.__srcs=[];
(()=>{ const C=window.AudioContext; const cbs=C.prototype.createBufferSource;
  C.prototype.createBufferSource=function(){const n=cbs.call(this); const st=n.start.bind(n); n.start=(...a)=>{window.__srcs.push({dur:n.buffer?Math.round(n.buffer.duration*100)/100:null, loop:n.loop}); return st(...a)}; return n}; })();
window.__clicks=0; document.addEventListener('click',()=>window.__clicks++,true);
"""
CARD = "document.querySelector('.lf-intro')"
CHIP = "document.querySelector('.lf-spk')"
AURA = lambda mid: f"getComputedStyle(document.querySelector('[data-message-id={mid}]')).getPropertyValue('--lf-aura').trim()"
OPACITY = lambda mid: f"+getComputedStyle(document.querySelector('[data-message-id={mid}]')).opacity"
SWITCH = lambda chat, char: f"window.__active={{chatId:{json.dumps(chat)},characterId:{json.dumps(char)}}}; __emit('CHAT_SWITCHED',{{chatId:{json.dumps(chat)}}})"
GEN = lambda gen, cid, name: f"__emit('GENERATION_STARTED',{{chatId:'c1',generationId:'{gen}',characterId:'{cid}',characterName:'{name}'}})"
END = lambda gen: f"__emit('GENERATION_ENDED',{{chatId:'c1',generationId:'{gen}',messageId:'m4',content:'x'}})"
# a card for a speaker who is writing right now, wearing the avatar of message m1
STREAMING = """(()=>{const src=document.querySelector('[data-message-id=m1] img').getAttribute('src'); const d=document.createElement('div'); d.className='B_card B_character';
  d.setAttribute('data-component','BubbleMessage'); d.setAttribute('data-part','streaming'); d.setAttribute('data-message-id','m9');
  d.innerHTML='<img src="'+src+'" style="width:40px;height:40px"><span class="B_name_x1">Bob</span><div class="B_bubble" style="padding:16px">writing…</div>'; document.getElementById('list').appendChild(d)})()"""

async def boot(b, settings=None, init='', size=(1280, 900), reduced=False, mobile=False, charName=None):
    ctx = await b.new_context(viewport={'width': size[0], 'height': size[1]}, reduced_motion='reduce' if reduced else 'no-preference',
                              is_mobile=mobile, has_touch=mobile)
    pg = await ctx.new_page()
    pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: m.type == 'error' and errs.append(m.text))
    await pg.add_init_script(SEED(settings or {}) + SPY + (f"window.__charName={json.dumps(charName)};" if charName else '') + init)
    await pg.goto(BASE + '/lumiverse.html'); await pg.wait_for_function('window.__ready===true')
    return ctx, pg

async def card_info(pg):
    return await pg.evaluate("""(()=>{const e=document.querySelector('.lf-intro'); if(!e) return null; return {name:e.querySelector('.lf-intro-name').textContent,
      kicker:e.querySelector('.lf-intro-kicker').textContent, color:e.style.getPropertyValue('--lf-intro-c'), avatar:!!e.querySelector('img.lf-intro-av'), motion:e.dataset.motion}})()""")

async def chip_info(pg):
    return await pg.evaluate("""(()=>{const e=document.querySelector('.lf-spk'); if(!e) return null; return {name:e.querySelector('.lf-spk-name').textContent,
      color:e.style.getPropertyValue('--lf-spk-c'), n:e.querySelector('.lf-spk-n')?.textContent ?? null, count:document.querySelectorAll('.lf-spk').length}})()""")

async def section(pg, title):
    return f"[...document.querySelectorAll('#drawer details')].find(d=>d.querySelector('.lf-sec-title').textContent==='{title}')"

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])

        print('== the card, when a chat opens ==')
        ctx, pg = await boot(b)
        await pg.wait_for_selector('.lf-intro', timeout=5000)
        info = await card_info(pg)
        aura = await pg.evaluate(AURA('m4'))
        expect('names the character', info['name'], 'Hazel')
        expect('says what it is', info['kicker'], 'A conversation with')
        expect('in the colour of the avatar on screen (newest message)', [info['color'] == aura, bool(aura)], [True, True])
        expect('with their portrait', info['avatar'], True)
        expect('moving, by default', info['motion'], '1')
        await pg.wait_for_timeout(900)
        cx = await pg.evaluate("(()=>{const c=document.querySelector('.lf-intro-card').getBoundingClientRect(); const v=document.querySelector('[data-component=ChatView]').getBoundingClientRect(); return [Math.round(c.left+c.width/2), Math.round(v.left+v.width/2), Math.round(v.width)]})()")
        expect('centred on the chat area, not the window (a side panel may be open)', [abs(cx[0] - cx[1]) <= 2, cx[2] < 1280], [True, True])
        await pg.screenshot(path='intro_desktop.png')
        await pg.wait_for_timeout(2300)
        expect('it leaves by itself', await pg.evaluate(f"!{CARD}"), True)
        expect('and leaves nothing behind', await pg.evaluate("document.querySelectorAll('.lf-intro').length"), 0)

        print('== every time a chat is opened ==')
        await pg.evaluate("__emit('CHAT_SWITCHED',{chatId:'c1'})"); await pg.wait_for_timeout(1800)
        expect('"opening" the chat that is already open: nothing', await pg.evaluate(f"!{CARD}"), True)
        await pg.evaluate(SWITCH('c2', 'char2')); await pg.wait_for_selector('.lf-intro', timeout=4000)
        expect('another chat: it plays', (await card_info(pg))['name'], 'Hazel')
        await pg.wait_for_timeout(2800)
        await pg.evaluate(SWITCH('c1', 'char1')); await pg.wait_for_selector('.lf-intro', timeout=4000)
        expect('back to a chat that has played before: it plays again', (await card_info(pg))['name'], 'Hazel')
        await pg.wait_for_timeout(2800)
        print('-- click off to the home screen and back onto the same chat --')
        await pg.evaluate(SWITCH(None, None)); await pg.wait_for_timeout(2000)
        await pg.evaluate(SWITCH('c1', 'char1')); await pg.wait_for_selector('.lf-intro', timeout=4000)
        expect('it plays again', (await card_info(pg))['name'], 'Hazel')
        await pg.wait_for_timeout(2800)
        await pg.evaluate(SWITCH(None, None)); await pg.wait_for_timeout(300)
        await pg.evaluate(SWITCH('c1', 'char1')); await pg.wait_for_selector('.lf-intro', timeout=4000)
        expect('and again, even when it is quick', await pg.evaluate("document.querySelectorAll('.lf-intro').length"), 1)
        await pg.wait_for_timeout(2800)
        print('-- flipping between chats quickly: one card, for the chat you end on --')
        await pg.evaluate(SWITCH('c2', 'char2')); await pg.wait_for_timeout(200)
        await pg.evaluate(SWITCH('c1', 'char1')); await pg.wait_for_timeout(1500)
        expect('one card', await pg.evaluate("document.querySelectorAll('.lf-intro').length"), 1)
        await pg.wait_for_timeout(2800)
        await pg.evaluate(SWITCH('c3', 'char3')); await pg.wait_for_selector('.lf-intro', timeout=4000)
        await pg.evaluate(SWITCH(None, None)); await pg.wait_for_timeout(700)
        expect('leaving for the home screen takes it away', await pg.evaluate("document.querySelectorAll('.lf-intro').length"), 0)
        await ctx.close()

        print('== a tap sends it away (and still reaches the page) ==')
        ctx, pg = await boot(b)
        await pg.wait_for_selector('.lf-intro', timeout=5000)
        await pg.mouse.click(10, 10); await pg.wait_for_timeout(150)
        expect('a tap straight away is ignored (grace period)', await pg.evaluate(f"!!{CARD}"), True)
        await pg.wait_for_timeout(500)
        before = await pg.evaluate("window.__clicks")
        await pg.mouse.click(10, 10); await pg.wait_for_timeout(700)
        expect('a later tap closes it', await pg.evaluate(f"!{CARD}"), True)
        expect('and the tap still counted as a click on the page', await pg.evaluate("window.__clicks") - before, 1)
        await ctx.close()

        print('== switched off, or the welcome still to see ==')
        ctx, pg = await boot(b, {'intro': False}); await pg.wait_for_timeout(4200)
        expect('off: no card', await pg.evaluate(f"!{CARD}"), True)
        await ctx.close()
        ctx, pg = await boot(b, {'welcomed': False}); await pg.wait_for_timeout(4200)
        expect('welcome not seen yet: no card on top of it', await pg.evaluate(f"!{CARD}"), True)
        await ctx.close()
        ctx, pg = await boot(b, {'enabled': False}); await pg.wait_for_timeout(4200)
        expect('Flair switched off: no card', await pg.evaluate(f"!{CARD}"), True)
        await ctx.close()

        print('== reduced motion ==')
        ctx, pg = await boot(b, reduced=True)
        await pg.wait_for_selector('.lf-intro', timeout=5000)
        expect('still shows, but without movement', (await card_info(pg))['motion'], '0')
        expect('the card has no animation', await pg.evaluate("getComputedStyle(document.querySelector('.lf-intro-card')).animationName"), 'none')
        await ctx.close()

        print('== no avatar colour to take (auras off): the theme colour ==')
        ctx, pg = await boot(b, {'auras': False})
        await pg.wait_for_selector('.lf-intro', timeout=5000)
        info = await card_info(pg)
        expect('a valid colour, and no portrait', [bool(__import__('re').match(r'^#[0-9a-f]{6}$', info['color'])), info['avatar']], [True, False])
        await ctx.close()

        print('== group chat: no name card, a speaker chip instead ==')
        ctx, pg = await boot(b, init=GROUP); await pg.wait_for_timeout(4200)
        expect('no name card for a group', await pg.evaluate(f"!{CARD}"), True)
        expect('nothing speaking yet: no chip', await pg.evaluate(f"!{CHIP}"), True)
        await pg.evaluate(GEN('g1', 'cB', 'Bob')); await pg.wait_for_timeout(300)
        chip = await chip_info(pg)
        expect('the chip names the speaker', [chip['name'], chip['count'], chip['n']], ['Bob', 1, None])
        expect('with a colour of their own (not known yet, so a steady one from the name)', bool(__import__('re').match(r'^#[0-9a-f]{6}$', chip['color'])), True)
        first = chip['color']
        await pg.wait_for_timeout(500)
        expect('others dim while someone writes', [round(await pg.evaluate(OPACITY('m1')), 2), round(await pg.evaluate(OPACITY('m4')), 2)], [0.7, 0.7])
        await pg.evaluate(STREAMING); await pg.wait_for_timeout(2000)
        chip = await chip_info(pg)
        aura = await pg.evaluate(AURA('m1'))
        expect('their message appears: the chip takes the colour of their avatar (the same as the message glow)', [chip['color'] == aura, chip['color'] != first], [True, True])
        expect('the message being written stays bright; the others are dimmed', [await pg.evaluate(OPACITY('m9')), round(await pg.evaluate(OPACITY('m1')), 2)], [1, 0.7])
        await pg.screenshot(path='intro_chip.png')
        await pg.evaluate(END('g1')); await pg.wait_for_timeout(1500)
        expect('the turn ends: the chip goes', await pg.evaluate(f"!{CHIP}"), True)
        expect('and the others come back up', [round(await pg.evaluate(OPACITY('m1')), 2), round(await pg.evaluate(OPACITY('m4')), 2)], [1, 1])
        await pg.evaluate("document.querySelector('[data-message-id=m9]').remove()")
        await pg.evaluate(GEN('g3', 'cB', 'Bob')); await pg.wait_for_timeout(250)
        expect('next time Bob speaks his colour is remembered at once', (await chip_info(pg))['color'], aura)
        print('-- hand-over --')
        await pg.evaluate(GEN('g4', 'cC', 'Cara')); await pg.wait_for_timeout(300)
        chip = await chip_info(pg)
        expect('a new speaker replaces the chip (one chip, not two)', [chip['name'], chip['count']], ['Cara', 1])
        await pg.evaluate(END('g3')); await pg.wait_for_timeout(1200)
        expect('the old turn ending does not take the new speaker away', (await chip_info(pg))['name'], 'Cara')
        await pg.evaluate("__emit('GROUP_TURN_STARTED',{chatId:'c1',generationId:'g4',characterId:'cC',characterName:'Cara',turnIndex:1,totalExpected:3})"); await pg.wait_for_timeout(300)
        chip = await chip_info(pg)
        expect('a host that reports the round adds the count (still one chip)', [chip['name'], chip['n'], chip['count']], ['Cara', '2/3', 1])
        await pg.evaluate("__emit('GROUP_ROUND_COMPLETE',{chatId:'c1',round:1,charactersSpoken:['cB','cC']})"); await pg.wait_for_timeout(1200)
        expect('the round completes: chip gone', await pg.evaluate(f"!{CHIP}"), True)
        await pg.evaluate("__emit('GENERATION_STARTED',{chatId:'c1',generationId:'g5',generationType:'impersonate',characterId:'cB',characterName:'Bob'})"); await pg.wait_for_timeout(300)
        expect('impersonating is not a speaker', await pg.evaluate(f"!{CHIP}"), True)
        await pg.evaluate(GEN('g6', 'cB', 'Bob')); await pg.wait_for_timeout(300)
        await pg.evaluate(SWITCH('c9', 'char9')); await pg.wait_for_timeout(300)
        expect('leaving the chat clears the chip', await pg.evaluate(f"!{CHIP}"), True)
        expect('and the dimming', [round(await pg.evaluate(OPACITY('m1')), 2)], [1])
        await ctx.close()

        print('== group chip off, and a single-character chat ==')
        ctx, pg = await boot(b, {'introGroup': False}, init=GROUP); await pg.wait_for_timeout(1500)
        await pg.evaluate(GEN('g1', 'cB', 'Bob')); await pg.wait_for_timeout(400)
        expect('switched off: no chip, no dimming', [await pg.evaluate(f"!{CHIP}"), await pg.evaluate(OPACITY('m1'))], [True, 1])
        await ctx.close()
        ctx, pg = await boot(b); await pg.wait_for_timeout(1500)
        await pg.evaluate(GEN('g1', 'cB', 'Bob')); await pg.wait_for_timeout(400)
        expect('one character: no chip, no dimming', [await pg.evaluate(f"!{CHIP}"), await pg.evaluate(OPACITY('m1'))], [True, 1])
        await ctx.close()

        print('== theme sound: choose, store, play ==')
        ctx, pg = await boot(b, {'sound': True}); await pg.wait_for_timeout(5200)
        await pg.mouse.click(600, 5)
        intro = await section(pg, 'Character intro'); mine = await section(pg, 'Your sounds')
        expect('the section is there', await pg.evaluate(f"!!({intro})"), True)
        expect('its controls', await pg.evaluate(f"[...({intro}).querySelectorAll('.lf-row .lf-label')].map(l=>l.textContent)"), ['Name card when a chat opens', 'Theme sound', 'Group chats: show who is speaking'])
        expect('the sound list starts with None only', await pg.evaluate(f"[...({intro}).querySelector('select').options].map(o=>o.textContent)"), ['None'])
        await pg.evaluate("""(async()=>{const f=async(n,m)=>{const r=await fetch(n);const b=new Uint8Array(await r.arrayBuffer());return {name:n.split('/').pop(),mimeType:m,sizeBytes:b.length,bytes:b}};
          window.__pickFiles=[await f('fixtures/ding.wav','audio/wav'),await f('fixtures/my_rain_loop.wav','audio/wav')]})()""")
        await pg.evaluate(f"[...({mine}).querySelectorAll('button')].find(b=>b.textContent.includes('Upload sounds')).click()"); await pg.wait_for_timeout(2500)
        ids = await pg.evaluate("(async()=>{const db=await new Promise(r=>{const o=indexedDB.open('lumi_flair_sounds');o.onsuccess=()=>r(o.result)}); return await new Promise(r=>{const q=db.transaction('meta').objectStore('meta').getAll(); q.onsuccess=()=>r(q.result.map(m=>[m.name,m.id,m.duration]))})})()")
        idOf = {n: i for n, i, _ in ids}
        expect('uploading adds them to the intro list (live)', await pg.evaluate(f"[...({intro}).querySelector('select').options].map(o=>o.textContent)"), ['None', 'ding', 'my rain loop'])
        n0 = await pg.evaluate("__srcs.length")
        await pg.evaluate(SWITCH('c4', 'char4')); await pg.wait_for_selector('.lf-intro', timeout=4000); await pg.wait_for_timeout(500)
        expect('no sound chosen: the card is silent', await pg.evaluate(f"__srcs.length - {n0}"), 0)
        await pg.evaluate(f"(()=>{{const s=({intro}).querySelector('select'); s.value='{idOf['ding']}'; s.dispatchEvent(new Event('change'))}})()"); await pg.wait_for_timeout(800)
        expect('the choice is stored with the settings', await pg.evaluate("JSON.parse(localStorage.getItem('lumi_flair:vault:settings')).data.introSound"), idOf['ding'])
        await pg.wait_for_timeout(2500)
        n0 = await pg.evaluate("__srcs.length")
        await pg.evaluate(SWITCH('c5', 'char5')); await pg.wait_for_selector('.lf-intro', timeout=4000); await pg.wait_for_timeout(900)
        played = await pg.evaluate(f"__srcs.slice({n0})")
        expect('a new chat: the theme sound plays once, not looping', [len(played), played[0]['loop'] if played else None], [1, False])
        await pg.wait_for_timeout(2500)
        # preview: ignores "already played in this chat"
        n0 = await pg.evaluate("__srcs.length")
        await pg.evaluate(f"[...({intro}).querySelectorAll('button')].find(b=>b.textContent==='Preview intro').click()"); await pg.wait_for_timeout(900)
        expect('Preview intro shows the card and plays the sound', [await pg.evaluate(f"!!{CARD}"), await pg.evaluate(f"__srcs.length - {n0}")], [True, 1])
        await pg.wait_for_timeout(2600)
        # command
        n0 = await pg.evaluate("__srcs.length")
        await pg.evaluate("__backend({type:'command',id:'intro'})"); await pg.wait_for_timeout(900)
        expect('the command does the same', [await pg.evaluate(f"!!{CARD}"), await pg.evaluate(f"__srcs.length - {n0}")], [True, 1])
        await pg.wait_for_timeout(2600)
        print('-- a character with their own look keeps their own theme sound --')
        await pg.evaluate("[...document.querySelectorAll('#drawer button')].find(b=>b.textContent.includes('Give this character their own look')).click()"); await pg.wait_for_timeout(500)
        await pg.evaluate(f"(()=>{{const s=({intro}).querySelector('select'); s.value='{idOf['my rain loop']}'; s.dispatchEvent(new Event('change'))}})()"); await pg.wait_for_timeout(900)
        st = await pg.evaluate("(()=>{const d=JSON.parse(localStorage.getItem('lumi_flair:vault:settings')).data; return [d.introSound, d.characterProfiles.char5?.introSound]})()")
        expect('the profile holds the new one; everyone else keeps theirs', st, [idOf['ding'], idOf['my rain loop']])
        print('-- the sound is switched off with interface sounds --')
        await pg.evaluate("[...document.querySelectorAll('#drawer [role=switch]')].find(s=>s.getAttribute('aria-label')==='Interface sounds')?.click()"); await pg.wait_for_timeout(500)
        on = await pg.evaluate("JSON.parse(localStorage.getItem('lumi_flair:vault:settings')).data.sound")
        n0 = await pg.evaluate("__srcs.length")
        await pg.evaluate(SWITCH('c6', 'char6')); await pg.wait_for_selector('.lf-intro', timeout=4000); await pg.wait_for_timeout(900)
        expect('Interface sounds off: the card shows, silently', [on, await pg.evaluate(f"__srcs.length - {n0}")], [False, 0])
        await ctx.close()

        print('== a theme sound whose file is gone: silent, no error ==')
        ctx, pg = await boot(b, {'sound': True, 'introSound': 'snd_doesnotexist'})
        await pg.wait_for_selector('.lf-intro', timeout=5000); await pg.wait_for_timeout(600)
        expect('card shows, nothing plays', await pg.evaluate("__srcs.length"), 0)
        await ctx.close()

        print('== a long name, on a phone ==')
        longName = 'Bartholomew Maximilian Fitzgerald-Wellington of the Eastern Marches'
        ctx, pg = await boot(b, size=(390, 844), mobile=True, charName=longName)
        await pg.wait_for_selector('.lf-intro', timeout=5000); await pg.wait_for_timeout(1000)
        box = await pg.evaluate("(()=>{const r=document.querySelector('.lf-intro-card').getBoundingClientRect(); return {l:Math.round(r.left), r:Math.round(r.right), w:innerWidth, sw:document.documentElement.scrollWidth}})()")
        expect('the card stays inside the screen, and the page does not scroll sideways', [box['l'] >= 0, box['r'] <= box['w'], box['sw'] <= box['w']], [True, True, True])
        await pg.screenshot(path='intro_phone.png')
        await pg.evaluate("document.getElementById('list').setAttribute('data-group-chat','')")
        await pg.evaluate(GEN('g1', 'cB', longName)); await pg.wait_for_timeout(600)
        box = await pg.evaluate("(()=>{const r=document.querySelector('.lf-spk-in').getBoundingClientRect(); return {l:Math.round(r.left), r:Math.round(r.right), t:Math.round(r.top), b:Math.round(r.bottom), w:innerWidth, h:innerHeight}})()")
        expect('the chip fits on a phone too', [box['l'] >= 0, box['r'] <= box['w'], box['b'] <= box['h']], [True, True, True])
        await pg.screenshot(path='intro_chip_phone.png')
        await ctx.close()

        print('== switched off mid-card, and disposed ==')
        ctx, pg = await boot(b)
        await pg.wait_for_selector('.lf-intro', timeout=5000)
        await pg.evaluate("window.__cleanup()"); await pg.wait_for_timeout(300)
        expect('disposing removes the card and the overlay', [await pg.evaluate("document.querySelectorAll('.lf-intro').length"), await pg.evaluate("document.querySelectorAll('.lf-overlay').length")], [0, 0])
        await ctx.close()

        await b.close()
    print('errors', errs)
asyncio.run(main())
