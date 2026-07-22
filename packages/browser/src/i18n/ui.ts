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

function toThreeChar(locale: string): string {
  const lower = locale.toLowerCase()
  if (lower.length === 3) return lower
  return TWO_TO_THREE[lower] ?? lower.slice(0, 3)
}

export function normalizeUiLocale(locale: string): string {
  return toThreeChar(locale)
}

export function isRtl(locale: string, extraRtlLocales: readonly string[] = []): boolean {
  const code = normalizeUiLocale(locale)
  return RTL_LOCALES.includes(code) || extraRtlLocales.includes(code) || extraRtlLocales.includes(locale.toLowerCase())
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
export function t(
  key: string,
  locale: string,
  customStrings?: CustomUiStrings,
  terminology?: Partial<Terminology>,
): string {
  const code = normalizeUiLocale(locale)
  const custom = customStrings?.[code]?.[key]
  if (custom) return custom
  const builtIn = STRINGS[code]?.[key]
  if (builtIn && code !== 'eng') return builtIn
  const english = builtIn ?? STRINGS.eng?.[key]
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
  const override = terminology?.meetingTypes?.[code]?.[type]
  if (override) return override
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
