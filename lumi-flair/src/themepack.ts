import type { SpindleFrontendContext } from 'lumiverse-spindle-types'
import type { FlairSettings } from './settings'
import { exportableCss } from './styles'

function download(bytes: Uint8Array | string, filename: string, type: string) {
  const blob = new Blob([bytes as BlobPart], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

/**
 * Turn the CSS-only parts of Flair (hover glow, edge trace, streaming aura)
 * into a shareable `.lumitheme` via Lumiverse's own pack codec. Hosts
 * without `theme-packs-v1` get a plain `.css` file to paste into Custom CSS.
 */
export async function exportThemePack(ctx: SpindleFrontendContext, s: FlairSettings): Promise<'pack' | 'css'> {
  const css = exportableCss(s)
  const canPack = (ctx.host?.capabilities?.['theme-packs-v1'] ?? 0) >= 1 && !!ctx.theme?.packs
  if (canPack) {
    try {
      const bytes = await ctx.theme.packs.exportDraft({
        name: 'Lumi Flair Glow',
        author: 'Lumi Flair',
        description: `Hover ${s.hoverStyle} glow${s.streamingAura ? ' + streaming aura' : ''}, exported from Lumi Flair.`,
        globalCSS: css,
      })
      download(bytes, 'lumi-flair-glow.lumitheme', 'application/octet-stream')
      return 'pack'
    } catch (err) {
      console.warn('[Lumi Flair] Theme pack export failed, falling back to CSS', err)
    }
  }
  download(css, 'lumi-flair-glow.css', 'text/css')
  return 'css'
}
