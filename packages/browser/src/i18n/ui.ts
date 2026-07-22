import type { Terminology } from '../config/schema.js'
import { BUILTIN_STRINGS, loadYamlTranslations } from './load-translations.js'

export { loadYamlTranslations } from './load-translations.js'

export type UiLocale = 'eng' | 'fra' | 'zho' | 'spa' | 'ara' | 'rus'

export const SUPPORTED_UI_LOCALES: readonly UiLocale[] = ['eng', 'fra', 'zho', 'spa', 'ara', 'rus']

export const LOCALE_LABELS: Readonly<Record<UiLocale, string>> = {
  eng: 'English',
  fra: 'Français',
  zho: '中文',
  spa: 'Español',
  ara: 'العربية',
  rus: 'Русский',
}

export const RTL_LOCALES: readonly string[] = ['ara']

// Built-in locale strings live in src/i18n/strings/<locale>.yaml.
// See load-translations.ts for the YAML loader.
const STRINGS = BUILTIN_STRINGS


export type UiStrings = Readonly<Record<string, string>>
export type CustomUiStrings = Readonly<Record<string, UiStrings>>

const TWO_TO_THREE: Readonly<Record<string, string>> = {
  en: 'eng', fr: 'fra', zh: 'zho', es: 'spa', ar: 'ara', ru: 'rus',
  de: 'deu', ja: 'jpn', ko: 'kor', pt: 'por', it: 'ita', nl: 'nld',
}

// BCP 47: language (2-3 char) optionally followed by script (4 char) and/or
// region (2 char or 3 digits) subtags, separated by '-'.
//
// Examples this recognizes:
//   eng                → eng               (no script subtag, no fallback)
//   en                 → eng               (2-char folded to 3-char)
//   zho-Hant           → zho-hant          (script preserved for lookup)
//   zh-Hans-SG         → zho-hans-sg       (script + region preserved)
//   eng-Latn           → eng-latn          (script adds nothing for eng but is preserved)
const LOCALE_RE = /^([a-z]{2,3}|[a-z]{4})(?:-([a-z0-9]{2,4}))*$/i

function toCanonical(locale: string): string {
  const lower = locale.toLowerCase()
  if (lower.length === 2 && TWO_TO_THREE[lower]) return TWO_TO_THREE[lower]
  // 3-char bare code (eng, fra, ...) — most common path.
  if (lower.length === 3 && !lower.includes('-')) return lower
  if (!lower.includes('-')) return lower
  // Composite code: normalize the leading language subtag, keep the rest.
  const parts = lower.split('-')
  const head = parts[0] ?? lower
  const rest = lower.slice(head.length)
  const canonicalHead = TWO_TO_THREE[head] ?? head
  return `${canonicalHead}${rest}`
}

/**
 * Normalize a locale code for lookup.
 *
 * Bare 3-char codes pass through unchanged: `eng` → `eng`. Two-char codes
 * fold to their 3-char form: `en` → `eng`. Composite codes preserve
 * script/region subtags so consumers can register distinct locales for
 * `zho-Hans` and `zho-Hant`: `zh-Hant` → `zho-hant`.
 */
export function normalizeUiLocale(locale: string): string {
  return toCanonical(locale)
}

/**
 * Lookup fallback chain for a normalized locale: itself, then the bare
 * language code (drops script/region subtags). Used by `t()` so a
 * `zho-Hant` consumer with only `zho` strings still resolves.
 */
function localeChain(code: string): readonly string[] {
  if (!code.includes('-')) return [code]
  // split() always returns at least one element when called on a string.
  const base = code.split('-')[0] ?? code
  return base === code ? [code] : [code, base]
}

export function isRtl(locale: string, extraRtlLocales: readonly string[] = []): boolean {
  const code = normalizeUiLocale(locale)
  const chain = localeChain(code)
  return chain.some((c) => RTL_LOCALES.includes(c))
    || extraRtlLocales.includes(code)
    || extraRtlLocales.includes(locale.toLowerCase())
}

export const DEFAULT_TERMINOLOGY: Terminology = {
  decision: 'decision',
  decisions: 'decisions',
  meeting: 'meeting',
  meetings: 'meetings',
  meetingTypes: {},
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

// Preserve the first-letter case of the replaced word: a lowercase
// mid-sentence 'decisions' takes the terminology in lowercase, a
// capitalized 'Decisions' takes it capitalized.
function matchCase(original: string, replacement: string): string {
  return original.charAt(0) === original.charAt(0).toUpperCase()
    ? capitalize(replacement)
    : replacement.charAt(0).toLowerCase() + replacement.slice(1)
}

const TERMINOLOGY_WORD_RE = /\bdecisions\b|\bDecisions\b|\bdecision\b|\bDecision\b|\bmeetings\b|\bMeetings\b|\bmeeting\b|\bMeeting\b/g

// Single-pass whole-word substitution, so replacement values that
// themselves contain 'meeting'/'decision' are never re-processed.
export function applyTerminology(text: string, term: Terminology): string {
  return text.replace(TERMINOLOGY_WORD_RE, (word) => {
    switch (word) {
      case 'decisions': return matchCase(word, term.decisions)
      case 'Decisions': return matchCase(word, term.decisions)
      case 'decision': return matchCase(word, term.decision)
      case 'Decision': return matchCase(word, term.decision)
      case 'meetings': return matchCase(word, term.meetings)
      case 'Meetings': return matchCase(word, term.meetings)
      case 'meeting': return matchCase(word, term.meeting)
      case 'Meeting': return matchCase(word, term.meeting)
      default: return word
    }
  })
}

// Keys that are pure record-name labels. Their built-in English values
// carry no 'decision'/'meeting' word to substitute ('nav.decisions' is
// 'Resolutions'), so they map onto the terminology directly — but only
// when the consumer actually renamed the record, otherwise the richer
// built-in wording keeps its say.
function terminologyLabel(key: string, term: Terminology): string | null {
  switch (key) {
    case 'nav.decisions':
    case 'section.adoptedDecisions':
    case 'about.stats.decisions':
      return term.decisions !== DEFAULT_TERMINOLOGY.decisions ? capitalize(term.decisions) : null
    case 'nav.meetings':
    case 'about.stats.meetings':
      return term.meetings !== DEFAULT_TERMINOLOGY.meetings ? capitalize(term.meetings) : null
    case 'label.meeting':
      return term.meeting !== DEFAULT_TERMINOLOGY.meeting ? capitalize(term.meeting) : null
    default:
      return null
  }
}

// Resolution order: uiStrings[locale][key] → terminology override →
// built-in locale table. Terminology shapes English rendering only —
// other locales keep their built-in translations unless the consumer
// overrides them per-locale via uiStrings.
//
// For script-bearing locales (e.g. zho-Hant), the chain walks
// `<full>` → `<base>` (e.g. zho) before falling back to English.
export function t(
  key: string,
  locale: string,
  customStrings?: CustomUiStrings,
  terminology?: Partial<Terminology>,
): string {
  const code = normalizeUiLocale(locale)
  for (const candidate of localeChain(code)) {
    const custom = customStrings?.[candidate]?.[key]
    if (custom) return custom
    const builtIn = STRINGS[candidate]?.[key]
    if (builtIn && candidate !== 'eng') return builtIn
  }
  const english = STRINGS[code]?.[key] ?? STRINGS.eng?.[key]
  if (!english) return key
  if (!terminology) return english
  const term = { ...DEFAULT_TERMINOLOGY, ...terminology }
  return terminologyLabel(key, term) ?? applyTerminology(english, term)
}

export function availableUiLocales(configuredLocales: readonly { code: string }[]): string[] {
  return configuredLocales.map((l) => normalizeUiLocale(l.code))
}

// Display label for a MeetingType enum value (plenary, working_group, …).
// Resolution order: terminology.meetingTypes[locale][type] → built-in
// `meeting.type.<value>` i18n string → humanized enum value. Consumers
// override per-locale via terminology.meetingTypes when their committee
// uses a different word (e.g. CIML meetings styled as "Plénière CIML").
export function meetingTypeLabel(
  type: string | undefined,
  locale: string,
  terminology?: Partial<Terminology>,
  customStrings?: CustomUiStrings,
): string {
  if (!type) return ''
  const code = normalizeUiLocale(locale)
  // Walk the locale chain so zho-Hant falls through to zho, then to
  // the built-in English table, before humanizing the enum value.
  for (const candidate of localeChain(code)) {
    const override = terminology?.meetingTypes?.[candidate]?.[type]
    if (override) return override
  }
  const i18n = t(`meeting.type.${type}`, locale, customStrings, terminology)
  if (i18n && i18n !== `meeting.type.${type}`) return i18n
  return humanizeEnum(type)
}

function humanizeEnum(value: string): string {
  return value
    .split('_')
    .map((part) => (part.length === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)))
    .join(' ')
}
