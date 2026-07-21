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

export function availableSpellings(list: readonly LocalizedString[] | undefined): readonly string[] {
  if (!list) return []
  return [...new Set(list.map((ls) => ls.spelling).filter((s): s is string => Boolean(s)))].sort()
}

export {
  t,
  normalizeUiLocale,
  isRtl,
  availableUiLocales,
  applyTerminology,
  DEFAULT_TERMINOLOGY,
  SUPPORTED_UI_LOCALES,
  LOCALE_LABELS,
  type UiLocale,
  type UiStrings,
  type CustomUiStrings,
} from './ui.js'

/**
 * Compute the full URL prefix for a given locale: basePath + localePrefix.
 * Use this to build hrefs that work under a sub-path deployment.
 *
 *   urlPrefix(config, 'en') → '/resolutions/'
 *   urlPrefix(config, 'fr') → '/resolutions/fr/'
 */
export function urlPrefix(
  config: { site: { basePath: string }; locales: ReadonlyArray<{ code: string; routePrefix?: string }> },
  locale: string,
): string {
  const base = config.site.basePath
  const entry = config.locales.find((l) => l.code === locale)
  const rp = entry?.routePrefix ?? ''
  const localePrefix = rp ? `/${rp}` : ''
  return `${base}${localePrefix}/`.replace(/\/{2,}/g, '/')
}

// Re-export pickLocalizedValue with a guard for non-array input
// (some legacy data may carry scalar strings instead of LocalizedString[])

export function pickLocalizedValue(
  list: readonly LocalizedString[] | undefined | string,
  locale: string,
  fallback = '',
): string {
  if (typeof list === 'string') return list
  if (!Array.isArray(list)) return fallback
  return pickLocalizedString(list, locale)?.value ?? fallback
}

/** Human-format an ISO date for display: '2024-05-15' → '15 May 2024'.
 * Year-only values ('2024') render as '2024'. Falls back to the raw
 * string when unparseable. Dates are rendered in UTC so ISO calendar
 * dates never shift a day across visitor timezones. */
export function formatDate(iso: string | undefined, locale: string): string {
  if (!iso) return ''
  const normalized = iso.length === 4 ? `${iso}-01-01` : iso
  const d = new Date(normalized)
  if (Number.isNaN(d.getTime())) return iso
  const bcp47 = threeToTwo(locale.toLowerCase())
  return new Intl.DateTimeFormat(bcp47, {
    ...(iso.length === 4 ? {} : { day: 'numeric', month: 'long' }),
    year: 'numeric',
    timeZone: 'UTC',
  }).format(d)
}

/** Human-format a start/end pair: '10–14 March 2025' when possible. */
export function formatDateRange(
  start: string | undefined,
  end: string | undefined,
  locale: string,
): string {
  if (!start) return formatDate(end, locale)
  if (!end || end === start) return formatDate(start, locale)
  const bcp47 = threeToTwo(locale.toLowerCase())
  const s = new Date(start)
  const e = new Date(end)
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) {
    return `${formatDate(start, locale)} – ${formatDate(end, locale)}`
  }
  const parts = new Intl.DateTimeFormat(bcp47, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
  return parts.formatRange(s, e)
}

/** Humanize an action verb for display: 'calls-upon' → 'Calls upon'. */
export function humanizeVerb(type: string | undefined): string {
  if (!type) return ''
  const words = type.replace(/[-_]+/g, ' ')
  return words.charAt(0).toUpperCase() + words.slice(1)
}

// Locale-aware country names from ICU (full-ICU Node + every modern
// browser) — no bundled data file. 'NO' + 'fr' → 'Norvège'.
const displayNamesCache = new Map<string, Intl.DisplayNames>()
export function regionName(countryCode: string | undefined, locale: string): string {
  if (!countryCode) return ''
  const cc = countryCode.trim().toUpperCase()
  if (!/^[A-Z]{2}$/.test(cc)) return countryCode
  const bcp47 = threeToTwo(locale.toLowerCase())
  let dn = displayNamesCache.get(bcp47)
  if (!dn) {
    try {
      dn = new Intl.DisplayNames([bcp47], { type: 'region' })
    } catch {
      dn = new Intl.DisplayNames(['en'], { type: 'region' })
    }
    displayNamesCache.set(bcp47, dn)
  }
  try {
    return dn.of(cc) ?? countryCode
  } catch {
    return countryCode
  }
}
