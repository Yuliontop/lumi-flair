"""Real Canvas/CSS hover regression: python3 tests/visualizer-hover.browser.py.

Requires Playwright and its Chromium browser. Pass --host-checkout PATH to
exercise a Lumiverse checkout's current message styles as well as Flair's.
"""

from collections import Counter
from pathlib import Path
import argparse
import json
import re
import subprocess
import tempfile

from playwright.sync_api import sync_playwright


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--host-checkout', type=Path)
    parser.add_argument('--browser', choices=['chromium', 'webkit'], default='chromium')
    args = parser.parse_args()
    repo = Path(__file__).resolve().parents[1]
    with tempfile.TemporaryDirectory(prefix='lumi-flair-hover-') as temporary:
        output = Path(temporary)
        entry = output / 'entry.ts'
        entry.write_text(f'''
          import {{ Visualizer, VIZ_CSS }} from '{repo}/src/visualizer.ts';
          import {{ normalize }} from '{repo}/src/settings.ts';
          import {{ buildCss, colorVarsCss, exportableCss }} from '{repo}/src/styles.ts';
          Object.assign(window, {{ Visualizer, VIZ_CSS, normalize, buildCss, colorVarsCss, exportableCss }});
        ''')
        subprocess.run(['bun', 'build', str(entry), '--target', 'browser', '--format', 'iife',
                        '--outfile', str(output / 'browser.js')], cwd=repo, check=True, capture_output=True)
        with sync_playwright() as playwright:
            browser = getattr(playwright, args.browser).launch()
            page = browser.new_page(viewport={'width': 1600, 'height': 1000}, device_scale_factor=2)
            errors = []
            page.on('pageerror', lambda error: errors.append(str(error)))
            page.set_content('''<!doctype html><html data-glass data-chat-bg><head><style>
              :root { --lcs-glass-bg: rgba(24,22,36,.65); --lcs-glass-border: rgba(255,255,255,.1);
                --lcs-glass-strong-blur: 12px; --lcs-radius: 14px; --lf-room: 18px; --lcs-transition-fast: 120ms ease; }
              body { margin: 0; font: 16px/1.6 sans-serif; color: #ddd; background: #14111e; }
              [data-component=ChatView] { position: relative; height: 100vh; overflow: clip;
                background: radial-gradient(at 10% 20%, #304650, transparent 70%), radial-gradient(at 70% 80%, #5a254a, #181722); }
              .chat-body { height: 100%; position: relative; z-index: 3; }
              .list { max-width: 950px; box-sizing: border-box; margin: auto; height: 100%;
                padding: 16px 20px 0; overflow: auto; }
              .card { position: relative; margin: 20px 0; overflow: hidden; contain: layout style paint;
                border-radius: var(--lcs-radius); background: var(--lcs-glass-bg);
                backdrop-filter: none; }
              html[data-glass][data-chat-bg] .card { backdrop-filter: blur(var(--lcs-glass-strong-blur)) saturate(1.2); }
              .card:hover { background: rgba(32,28,43,.72); box-shadow: 0 1px 2px rgba(0,0,0,.28); }
              .bubble { width: 100%; padding: 18px; }
              .lf-ambient-host { display: contents; }
            </style></head><body><div data-component="ChatView"><div class="chat-body">
              <div data-component="MessageList" class="list"></div></div><div class="lf-ambient-host"></div>
            </div></body></html>''')
            if args.host_checkout:
                host = args.host_checkout / 'frontend/src/components/chat'
                for filename in ['BubbleMessage.module.css', 'MessageList.module.css']:
                    css = re.sub(r':global\(([^)]+)\)', r'\1', (host / filename).read_text())
                    page.add_style_tag(content=css)
            page.evaluate('''() => {
              for (let i = 0; i < 4; i++) {
                const card = document.createElement('div');
                card.className = 'card character'; card.dataset.component = 'BubbleMessage';
                card.dataset.messageId = 'message-' + i; card.dataset.part = 'character';
                const bubble = document.createElement('div'); bubble.className = 'bubble';
                for (let j = 0; j < 5; j++) {
                  const text = document.createElement('p');
                  text.textContent = 'The lights of the city reflect across the river as the music changes. '.repeat(3);
                  bubble.append(text);
                }
                card.append(bubble); document.querySelector('.list').append(card);
              }
              Object.defineProperty(document, 'hasFocus', {value: () => true});
            }''')
            page.add_script_tag(path=str(output / 'browser.js'))
            page.add_style_tag(content=page.evaluate('VIZ_CSS'))
            page.evaluate('''() => {
              window.settings = normalize({ viz: true, vizSource: 'demo', vizStereo: true, vizStyle: 'ribbons',
                vizBars: 96, vizSides: true, vizWindow: false, vizBg: false, smoothMotion: true, vizGlow: .5 });
              const ctx = { dom: { createElement: (tag, attrs) => {
                const el = document.createElement(tag); el.className = attrs.class; return el;
              } } };
              window.viz = new Visualizer(ctx, { settings: () => settings, update: patch => Object.assign(settings, patch),
                tap: () => null, palette: () => ['#a78bfa', '#38bdf8'], motionOk: () => true,
                saver: () => false, panels: () => false, onState() {} });
              window.paintCount = 0;
              const paint = viz.paint.bind(viz);
              viz.paint = (...args) => { paintCount++; return paint(...args); };
              document.querySelector('.lf-ambient-host').append(...viz.els);
              window.flairStyle = document.createElement('style'); document.head.append(flairStyle);
              const colours = document.createElement('style'); colours.textContent = colorVarsCss(settings, null, null);
              document.head.append(colours);
              window.apply = patch => {
                Object.assign(settings, patch); flairStyle.textContent = buildCss(settings);
                colours.textContent = colorVarsCss(settings, null, null); viz.sync(true);
              };
              window.look = () => { const s = getComputedStyle(document.querySelector('.card'), '::after');
                return {angle: s.getPropertyValue('--lf-angle'), ...Object.fromEntries(['animationName', 'animationPlayState',
                  'offsetPath', 'backgroundImage', 'width', 'height', 'maskImage', 'opacity', 'willChange',
                  'animationDuration'].map(k => [k, s[k]]))}; };
              window.canvasPixels = () => viz.els.slice(1).map(canvas => {
                const data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
                return data.some((value, index) => index % 4 === 3 && value > 20);
              });
              apply({hoverStyle: 'trace'});
            }''')
            session = page.context.new_cdp_session(page) if args.browser == 'chromium' else None

            def profile(name, move_pointer=None, animated_ring=False):
                # Let the hover fade and host background transition settle before measuring ongoing paint work.
                page.wait_for_timeout(500)
                paints_before = page.evaluate('paintCount')
                events = []
                collect = lambda value: events.extend(value['value'])
                if session:
                    session.on('Tracing.dataCollected', collect)
                    session.send('Tracing.start', {'categories': 'devtools.timeline,disabled-by-default-devtools.timeline',
                                                   'transferMode': 'ReportEvents'})
                if move_pointer:
                    move_pointer()
                else:
                    page.wait_for_timeout(1200)
                if session:
                    complete = []
                    session.once('Tracing.tracingComplete', lambda value: complete.append(True))
                    session.send('Tracing.end')
                    while not complete:
                        page.wait_for_timeout(10)
                    session.remove_listener('Tracing.dataCollected', collect)
                counts = Counter(event['name'] for event in events)
                result = {key: counts[key] for key in ['Paint', 'RasterTask', 'Layout', 'UpdateLayoutTree']}
                draws = page.evaluate('paintCount') - paints_before
                print(json.dumps({'browser': args.browser, 'case': name, 'events': result if session else None,
                                  'visualizerDraws': draws, 'look': page.evaluate('look()')}), flush=True)
                assert draws > 24, (name, draws)
                if session:
                    # The original edge trace animates its conic gradient and intentionally repaints.
                    if not move_pointer and not animated_ring:
                        assert counts['Paint'] <= 2, (name, result)
                        assert counts['RasterTask'] <= 4, (name, result)
                    assert counts['Layout'] == 0, (name, result)
                return result

            # Measure the pointer transitions themselves, including the user's no-glass/no-glow case.
            page.evaluate('''() => {
              document.documentElement.removeAttribute('data-glass');
              apply({hoverStyle: 'none', streamingAura: false, spotlight: false});
            }''')
            assert page.evaluate('getComputedStyle(document.querySelector(".card")).backdropFilter') == 'none'
            assert page.evaluate('getComputedStyle(document.querySelector(".card")).transitionProperty') == 'opacity'
            comparison = page.add_style_tag(content='''
              :root[data-lf-viz-active] :is([data-component="BubbleMessage"],[data-component="MinimalMessage"])[data-message-id] {
                transition: box-shadow .25s ease, background 120ms ease, opacity .35s ease, filter .35s ease;
              }''')

            def cross_messages():
                for index in range(30):
                    page.mouse.move(800, 90 + index % 9 * 85)
                    page.wait_for_timeout(45)

            page.mouse.move(10, 10)
            old = profile('crossing messages: previous transitions, no glass or Flair glow', cross_messages)
            comparison.evaluate('(style) => style.remove()')
            page.mouse.move(10, 10)
            new = profile('crossing messages: active visualizer transitions, no glass or Flair glow', cross_messages)
            if session:
                assert new['Paint'] < old['Paint'] * .5, (old, new)
                assert new['RasterTask'] < old['RasterTask'] * .5, (old, new)
            assert page.evaluate('canvasPixels()') == [True, True]
            # Embedded HTML relaxes the host card's paint containment. The sidebar strips must retain their
            # own paint boundaries and leave message hit testing alone while this content is hovered.
            page.evaluate('''() => {
              const html = document.createElement('div');
              html.dataset.lumiverseHtmlIsland = '';
              html.innerHTML = '<article style="padding:24px;border-radius:20px;background:linear-gradient(135deg,#183a4a,#402552);box-shadow:0 8px 24px #0006">'
                + '<h3>Album details</h3><p>Embedded HTML with gradients, shadows and interactive controls.</p>'
                + '<button type="button">Details</button></article>';
              document.querySelector('.bubble').append(html);
            }''')
            for kind in ['bars', 'wave', 'ribbons']:
                page.evaluate('(vizStyle) => apply({vizStyle})', kind)
                for canvas in page.locator('canvas.lf-vz-side').all():
                    layer = canvas.evaluate('el => { const s = getComputedStyle(el); return {contain:s.contain,transform:s.transform,pointer:s.pointerEvents}; }')
                    assert 'paint' in layer['contain'] and layer['transform'] != 'none', layer
                    assert layer['pointer'] == 'none', layer
                page.mouse.move(10, 10)
                profile(kind + ': crossing messages with embedded HTML', cross_messages)
                assert page.evaluate('canvasPixels()') == [True, True]
                assert page.evaluate('document.elementFromPoint(800, 180).closest("[data-component=BubbleMessage]") !== null')
            page.evaluate('viz.sync(false)')
            normal = page.evaluate('getComputedStyle(document.querySelector(".card")).transitionProperty')
            assert 'background' in normal and 'box-shadow' in normal, normal
            assert not page.evaluate('document.documentElement.hasAttribute("data-lf-viz-active")')
            page.evaluate('''() => {
              document.documentElement.setAttribute('data-glass', '');
              apply({hoverStyle: 'trace', streamingAura: true});
            }''')

            page.mouse.move(800, 240)
            profile('trace with stereo sidebar ribbons, 96 bars, high DPI, glass', animated_ring=True)
            before = page.evaluate('look()')
            page.wait_for_timeout(150)
            after = page.evaluate('look()')
            assert before['angle'] != after['angle'], (before, after)
            assert after['animationName'] == 'lf-spin' and after['maskImage'] != 'none', after
            assert after['backgroundImage'].startswith('conic-gradient(') and after['offsetPath'] == 'none', after
            card_size = page.evaluate('({w: document.querySelector(".card").offsetWidth, h: document.querySelector(".card").offsetHeight})')
            assert abs(float(after['width'].removesuffix('px')) - card_size['w']) <= 2, (after, card_size)
            assert abs(float(after['height'].removesuffix('px')) - card_size['h']) <= 2, (after, card_size)
            assert page.evaluate('canvasPixels()') == [True, True]

            page.mouse.move(10, 10)
            page.wait_for_timeout(400)
            hidden = page.evaluate('look()')
            assert hidden['opacity'] == '0' and hidden['animationPlayState'] == 'paused', hidden
            assert hidden['willChange'] == 'auto', hidden
            page.mouse.move(800, 240)
            for component in ['MinimalMessage', 'BubbleMessage']:
                page.evaluate('(component) => document.querySelector(".card").dataset.component = component', component)
                profile(component + ' trace', animated_ring=True)

            page.evaluate('document.querySelector(".card").dataset.part = "streaming"')
            profile('streaming aura with stereo sidebar ribbons', animated_ring=True)
            assert page.evaluate('look().animationName') == 'lf-spin, lf-breathe'
            page.evaluate('document.querySelector(".card").dataset.part = "character"')
            page.emulate_media(reduced_motion='reduce')
            reduced = page.evaluate('look()')
            assert reduced['animationName'] == 'none' and reduced['offsetPath'] == 'none', reduced
            assert reduced['maskImage'] != 'none', reduced
            page.evaluate('apply({respectReducedMotion: false})')
            assert page.evaluate('look().animationName') == 'lf-spin'
            page.emulate_media(reduced_motion='no-preference')

            page.set_viewport_size({'width': 1300, 'height': 800})
            page.evaluate('apply({hoverTarget: "user"})')
            assert page.evaluate('look().animationName') == 'none'
            page.evaluate('document.querySelector(".card").dataset.part = "user"')
            page.mouse.move(650, 240)
            page.evaluate('apply({traceSpeed: 1})')
            assert page.evaluate('look().animationDuration') == '1s'
            profile('resized user-target trace', animated_ring=True)
            for style in ['glow', 'neon', 'none']:
                page.evaluate('(style) => apply({hoverStyle: style})', style)
                profile(style + ' with stereo sidebar ribbons')

            page.evaluate('flairStyle.textContent = exportableCss({...settings, hoverStyle: "trace", hoverTarget: "all"})')
            assert page.evaluate('look().animationName') == 'lf-spin'
            profile('exported theme pack trace', animated_ring=True)
            page.evaluate('apply({enabled: false})')
            assert page.evaluate('look().animationName') == 'none'
            page.evaluate('viz.destroy()')
            assert not errors, errors
            browser.close()
            print('Hover rendering checks passed.')


if __name__ == '__main__':
    main()
