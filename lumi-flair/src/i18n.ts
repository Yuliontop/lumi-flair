/**
 * Tiny i18n: strings are keyed by their English text, so untranslated
 * strings simply fall back to English. Locale follows Lumiverse (ctx.locale).
 */
import { DICT } from './i18n-dict'

export type Locale = 'en' | 'zh' | 'zh-TW' | 'ja' | 'fr' | 'it'

let current: Locale = 'en'

export function setLocale(l: string | undefined | null) {
  current = (['zh', 'zh-TW', 'ja', 'fr', 'it'] as const).includes(l as never) ? (l as Locale) : 'en'
}

export function locale(): Locale {
  return current
}

export function tr(en: string): string {
  if (current === 'en') return en
  return DICT[current]?.[en] ?? en
}
