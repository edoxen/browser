import type { LocalizedString } from '@edoxen/edoxen'

const TWO_TO_THREE: Readonly<Record<string, string>> = {
  en: 'eng', fr: 'fra', de: 'deu', es: 'spa', it: 'ita',
  ja: 'jpn', zh: 'zho', ko: 'kor', ru: 'rus', pt: 'por',
  nl: 'nld', sv: 'swe', pl: 'pol', tr: 'tur', ar: 'ara',
  he: 'heb', hi: 'hin',
}

const THREE_TO_TWO: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(TWO_TO_THREE).map(([two, three]) => [three, two]),
)

export function twoToThree(code: string): string {
  return TWO_TO_THREE[code] ?? code
}

export function threeToTwo(code: string): string {
  return THREE_TO_TWO[code] ?? code
}

export interface LocaleResolution {
  readonly locale: string
  readonly prefix: string
}

export function getLocaleFromUrl(
  pathname: string,
  locales: ReadonlyArray<{ code: string; routePrefix?: string }>,
  defaultLocale: string,
): LocaleResolution {
  for (const entry of locales) {
    const prefix = entry.routePrefix ?? ''
    if (!prefix) continue
    const normalized = prefix.startsWith('/') ? prefix : `/${prefix}`
    if (pathname === normalized || pathname.startsWith(`${normalized}/`)) {
      return { locale: entry.code, prefix: normalized }
    }
  }
  return { locale: defaultLocale, prefix: '' }
}

export function localizedHref(
  href: string,
  locale: string,
  locales: ReadonlyArray<{ code: string; routePrefix?: string }>,
  defaultLocale: string,
): string {
  if (locale === defaultLocale) return href
  const entry = locales.find((l) => l.code === locale)
  const prefix = entry?.routePrefix ?? ''
  if (!prefix) return href
  const normalized = prefix.startsWith('/') ? prefix : `/${prefix}`
  const slash = href.startsWith('/') ? '' : '/'
  return `${normalized}${slash}${href}`
}

export function pickLocalizedString(
  list: readonly LocalizedString[] | undefined,
  locale: string,
): LocalizedString | null {
  if (!list || list.length === 0) return null

  const norm = locale.toLowerCase()
  const three = twoToThree(norm)

  let hit = list.find((ls) => (ls.spelling ?? '').toLowerCase() === norm || (ls.spelling ?? '').toLowerCase() === three)
  if (hit) return hit

  hit = list.find((ls) => {
    const sp = (ls.spelling ?? '').toLowerCase()
    return sp.startsWith(`${norm}-`) || sp.startsWith(`${three}-`) || sp.startsWith(`${three}:`)
  })
  if (hit) return hit

  return list[0] ?? null
}

export function pickLocalizedValue(
  list: readonly LocalizedString[] | undefined,
  locale: string,
  fallback = '',
): string {
  return pickLocalizedString(list, locale)?.value ?? fallback
}

export function availableSpellings(list: readonly LocalizedString[] | undefined): readonly string[] {
  if (!list) return []
  return [...new Set(list.map((ls) => ls.spelling).filter((s): s is string => Boolean(s)))].sort()
}

export {
  t,
  normalizeUiLocale,
  isRtl,
  availableUiLocales,
  SUPPORTED_UI_LOCALES,
  LOCALE_LABELS,
  type UiLocale,
  type UiStrings,
  type CustomUiStrings,
} from './ui.js'
