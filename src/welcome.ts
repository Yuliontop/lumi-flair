/**
 * First-run welcome: pick a Flair Pack (with live preview), opt into the
 * optional permissions with clear reasons, and turn on sound if wanted.
 */
import type { SpindleFrontendContext } from 'lumiverse-spindle-types'
import { allPacks } from './packs'
import { tr } from './i18n'
import { keepOpenWhileDragging } from './modal'

export interface WelcomeActions {
  applyPack(id: string): void
  activePack(): string
  requestInject(): Promise<boolean>
  requestTint(): Promise<boolean>
  hasInject(): boolean
  hasTint(): boolean
  enableSound(): void
  soundOn(): boolean
  themeOn(): boolean
  enableTheme(): Promise<boolean>
  done(): void
}

export const WELCOME_CSS = `
.lf-welcome { display: flex; flex-direction: column; gap: 14px; padding: 2px 2px 10px; color: var(--lumiverse-text); }
.lf-welcome-hero { position: relative; padding: 18px 16px; border-radius: 14px; overflow: hidden; text-align: center;
  background: radial-gradient(ellipse at 20% 0%, color-mix(in srgb, var(--lf-c, var(--lumiverse-primary)) 35%, transparent), transparent 60%),
              radial-gradient(ellipse at 90% 100%, color-mix(in srgb, var(--lf-c, var(--lumiverse-primary)) 25%, transparent), transparent 60%),
              var(--lumiverse-fill-subtle);
  border: 1px solid color-mix(in srgb, var(--lf-c, var(--lumiverse-primary)) 35%, transparent); }
.lf-welcome-hero h2 { margin: 0 0 4px; font-size: calc(20px * var(--lumiverse-font-scale, 1)); }
.lf-welcome-hero p { margin: 0; color: var(--lumiverse-text-muted); font-size: calc(13px * var(--lumiverse-font-scale, 1)); line-height: 1.45; }
.lf-welcome h3 { margin: 4px 0 0; font-size: calc(11px * var(--lumiverse-font-scale, 1)); letter-spacing: .08em; text-transform: uppercase; color: var(--lumiverse-text-dim); }
.lf-packs { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 8px; }
.lf-pack { display: flex; flex-direction: column; gap: 6px; padding: 10px; border-radius: 12px; cursor: pointer; text-align: left; font: inherit;
  color: var(--lumiverse-text); background: var(--lumiverse-fill); border: 1px solid var(--lumiverse-border);
  transition: border-color .2s ease, box-shadow .25s ease, transform .15s ease; }
.lf-pack:hover { transform: translateY(-1px); border-color: var(--lumiverse-border-hover); }
.lf-pack.lf-on { border-color: var(--lf-c, var(--lumiverse-primary)); box-shadow: 0 0 14px color-mix(in srgb, var(--lf-c, var(--lumiverse-primary)) 35%, transparent); }
.lf-pack-sw { height: 34px; border-radius: 8px; }
.lf-pack b { font-size: calc(13px * var(--lumiverse-font-scale, 1)); }
.lf-pack span { font-size: calc(11px * var(--lumiverse-font-scale, 1)); color: var(--lumiverse-text-dim); line-height: 1.35; }
.lf-perm { display: flex; align-items: center; gap: 12px; padding: 10px 12px; border-radius: 10px; background: var(--lumiverse-fill); }
.lf-perm div { flex: 1; font-size: calc(12px * var(--lumiverse-font-scale, 1)); color: var(--lumiverse-text-muted); line-height: 1.4; }
.lf-perm div b { display: block; color: var(--lumiverse-text); font-size: calc(13px * var(--lumiverse-font-scale, 1)); }
.lf-perm .lf-btn { flex: 0 0 auto; }
`

export function showWelcome(ctx: SpindleFrontendContext, a: WelcomeActions) {
  const modal = ctx.ui.showModal({ title: tr('Welcome to Lumi Flair'), width: 560, maxHeight: 760 })
  const root = modal.root
  const unguard = keepOpenWhileDragging(root)
  modal.onDismiss(() => {
    unguard()
    a.done()
  })
  root.innerHTML = ''
  const w = document.createElement('div')
  w.className = 'lf-welcome'

  const hero = document.createElement('div')
  hero.className = 'lf-welcome-hero'
  const h2 = document.createElement('h2')
  h2.textContent = '✦ Lumi Flair'
  const p = document.createElement('p')
  p.textContent = tr('The story controls the room: glow, weather, light and sound that react to your chat. Pick a look to start — you can change everything later in the Flair tab.')
  hero.append(h2, p)
  w.appendChild(hero)

  const h3a = document.createElement('h3')
  h3a.textContent = tr('Choose a Flair Pack')
  w.appendChild(h3a)
  const grid = document.createElement('div')
  grid.className = 'lf-packs'
  const paint = () => grid.querySelectorAll<HTMLElement>('.lf-pack').forEach((el) => el.classList.toggle('lf-on', el.dataset.pack === a.activePack()))
  for (const pack of allPacks()) {
    const b = document.createElement('button')
    b.type = 'button'
    b.className = 'lf-pack'
    b.dataset.pack = pack.id
    const sw = document.createElement('div')
    sw.className = 'lf-pack-sw'
    sw.style.background = `linear-gradient(135deg, ${pack.swatch[0]}, ${pack.swatch[1]})`
    const name = document.createElement('b')
    name.textContent = tr(pack.name)
    const tag = document.createElement('span')
    tag.textContent = tr(pack.tagline)
    b.append(sw, name, tag)
    b.addEventListener('click', () => {
      a.applyPack(pack.id)
      paint()
    })
    grid.appendChild(b)
  }
  w.appendChild(grid)
  paint()

  const h3b = document.createElement('h3')
  h3b.textContent = tr('Optional extras')
  w.appendChild(h3b)

  const perm = (title: string, body: string, has: () => boolean, ask: () => Promise<boolean> | void, label: string) => {
    const row = document.createElement('div')
    row.className = 'lf-perm'
    const text = document.createElement('div')
    const b = document.createElement('b')
    b.textContent = title
    text.append(b, document.createTextNode(body))
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'lf-btn lf-primary'
    const sync = () => {
      btn.textContent = has() ? `${tr('Enabled')} ✓` : label
      btn.disabled = has()
    }
    sync()
    btn.addEventListener('click', async () => {
      await ask()
      sync()
    })
    row.append(text, btn)
    w.appendChild(row)
  }
  perm(
    tr('AI storytelling'),
    tr('Lets Flair add a short note to each prompt so the AI uses text effects, directs scenes and offers choices. (interceptor permission)'),
    a.hasInject,
    a.requestInject,
    tr('Allow'),
  )
  perm(
    tr('Match Lumiverse to your pack'),
    tr('Restyles Lumiverse’s accent, backgrounds and dialogue colours to fit the pack — or the speaking character with Character Aware. Your saved theme is never changed. (app_manipulation permission)'),
    a.themeOn,
    a.enableTheme,
    tr('Turn on'),
  )
  perm(
    tr('Mood-tinted interface'),
    tr('Re-tints Lumiverse’s accent to the character’s mood, then restores your theme. (app_manipulation permission)'),
    a.hasTint,
    a.requestTint,
    tr('Allow'),
  )
  perm(tr('Sound & soundscapes'), tr('Soft chimes plus rain, fire, wind and night ambience generated live — no audio files.'), a.soundOn, a.enableSound, tr('Turn on'))

  const go = document.createElement('div')
  go.className = 'lf-btns'
  const start = document.createElement('button')
  start.type = 'button'
  start.className = 'lf-btn lf-primary'
  start.textContent = tr('Start chatting ✦')
  start.addEventListener('click', () => modal.dismiss())
  go.appendChild(start)
  w.appendChild(go)
  root.appendChild(w)
  return modal
}
