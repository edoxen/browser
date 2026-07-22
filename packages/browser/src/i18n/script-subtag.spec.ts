import { describe, expect, it } from 'vitest'

import {
  isRtl,
  meetingTypeLabel,
  normalizeUiLocale,
  t,
} from './ui.js'

describe('normalizeUiLocale — script subtag preservation', () => {
  it('passes bare 3-char codes through unchanged', () => {
    expect(normalizeUiLocale('eng')).toBe('eng')
    expect(normalizeUiLocale('fra')).toBe('fra')
    expect(normalizeUiLocale('zho')).toBe('zho')
  })

  it('folds 2-char codes to their 3-char form', () => {
    expect(normalizeUiLocale('en')).toBe('eng')
    expect(normalizeUiLocale('fr')).toBe('fra')
    expect(normalizeUiLocale('zh')).toBe('zho')
  })

  it('preserves the script subtag on composite codes', () => {
    // The whole point of this change: zho-Hant and zho-Hans no longer
    // collapse into zho (losing the script distinction).
    expect(normalizeUiLocale('zho-Hant')).toBe('zho-hant')
    expect(normalizeUiLocale('zho-Hans')).toBe('zho-hans')
    expect(normalizeUiLocale('zh-Hant')).toBe('zho-hant')
  })

  it('canonicalizes the language subtag on composite codes', () => {
    expect(normalizeUiLocale('en-Latn-US')).toBe('eng-latn-us')
    expect(normalizeUiLocale('fr-CA')).toBe('fra-ca')
  })

  it('is case-insensitive', () => {
    expect(normalizeUiLocale('ENG')).toBe('eng')
    expect(normalizeUiLocale('zho-HANT')).toBe('zho-hant')
    expect(normalizeUiLocale('Fr-cA')).toBe('fra-ca')
  })
})

describe('t — script-bearing locale fallback', () => {
  it('returns the bare-language string when no script-specific entry exists', () => {
    // eng table has 'nav.home' -> 'Home'. Asking under zho-Hant (which has no
    // built-in Hant table) should fall through to zho's built-in.
    const result = t('nav.home', 'zho-Hant')
    expect(result).toBe(t('nav.home', 'zho'))
  })

  it('honors a script-specific consumer override', () => {
    // Consumer supplies a zho-Hant block; t() should pick it up before
    // falling back to zho.
    const custom = {
      'zho-hant': { 'meeting.type.plenary': '全體會議' },
      'zho': { 'meeting.type.plenary': '全体会议' },
    }
    expect(t('meeting.type.plenary', 'zho-Hant', custom)).toBe('全體會議')
    expect(t('meeting.type.plenary', 'zho', custom)).toBe('全体会议')
    expect(t('meeting.type.plenary', 'zho-Hans', custom)).toBe('全体会议')
  })

  it('falls back to English when neither script nor base language has the key', () => {
    expect(t('nav.home', 'de-Latn-DE')).toBe('Home')
  })
})

describe('meetingTypeLabel — script-bearing locale', () => {
  it('honors per-script terminology override', () => {
    const terminology = {
      meetingTypes: {
        'zho-hant': { plenary: '全體會議' },
        'zho': { plenary: '全体会议' },
      },
    }
    expect(meetingTypeLabel('plenary', 'zho-Hant', terminology)).toBe('全體會議')
    expect(meetingTypeLabel('plenary', 'zho-Hans', terminology)).toBe('全体会议')
  })
})

describe('isRtl — script-bearing locale', () => {
  it('detects RTL via the base language when a script-bearing code is supplied', () => {
    expect(isRtl('ara-Arab')).toBe(true)
    expect(isRtl('ara-Latn')).toBe(true)
  })
})
