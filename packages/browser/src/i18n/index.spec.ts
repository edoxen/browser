import { describe, expect, it } from 'vitest'
import type { LocalizedString } from '@edoxen/edoxen'

import {
  availableSpellings,
  getLocaleFromUrl,
  localizedHref,
  pickLocalizedString,
  pickLocalizedValue,
  threeToTwo,
  twoToThree,
} from './index.js'

function ls(spelling: string, value: string): LocalizedString {
  return { spelling, value }
}

describe('twoToThree / threeToTwo', () => {
  it('maps ISO 639-1 to ISO 639-3', () => {
    expect(twoToThree('en')).toBe('eng')
    expect(twoToThree('fr')).toBe('fra')
  })

  it('passes through unknown codes', () => {
    expect(twoToThree('xx')).toBe('xx')
    expect(threeToTwo('xxx')).toBe('xxx')
  })

  it('round-trips for known codes', () => {
    expect(threeToTwo(twoToThree('en'))).toBe('en')
  })
})

describe('pickLocalizedString', () => {
  const list = [ls('eng', 'Hello'), ls('fra', 'Bonjour'), ls('zho-Hans', '你好')]

  it('matches the exact 2-letter locale via the 3-letter mapping', () => {
    expect(pickLocalizedString(list, 'en')?.value).toBe('Hello')
  })

  it('matches the exact 3-letter locale directly', () => {
    expect(pickLocalizedString(list, 'fra')?.value).toBe('Bonjour')
  })

  it('matches language+script combinations', () => {
    expect(pickLocalizedString(list, 'zh')?.value).toBe('你好')
  })

  it('falls back to the first entry when no match exists', () => {
    expect(pickLocalizedString(list, 'ja')?.value).toBe('Hello')
  })

  it('returns null when the list is empty', () => {
    expect(pickLocalizedString([], 'en')).toBeNull()
    expect(pickLocalizedString(undefined, 'en')).toBeNull()
  })
})

describe('pickLocalizedValue', () => {
  it('returns the value, not the wrapper', () => {
    expect(pickLocalizedValue([ls('eng', 'Hi')], 'en')).toBe('Hi')
  })

  it('falls back to the provided default', () => {
    expect(pickLocalizedValue([], 'en', 'none')).toBe('none')
  })
})

describe('availableSpellings', () => {
  it('lists distinct spellings in stable order', () => {
    expect(
      availableSpellings([ls('fra', 'a'), ls('eng', 'b'), ls('fra', 'c')]),
    ).toEqual(['eng', 'fra'])
  })

  it('omits empty spellings', () => {
    expect(availableSpellings([ls('', 'x')])).toEqual([])
  })
})

describe('getLocaleFromUrl', () => {
  const locales = [
    { code: 'en', routePrefix: '' },
    { code: 'fr', routePrefix: '/fr' },
    { code: 'de', routePrefix: '/de' },
  ]

  it('returns the default locale with no prefix for root paths', () => {
    expect(getLocaleFromUrl('/', locales, 'en')).toEqual({ locale: 'en', prefix: '' })
    expect(getLocaleFromUrl('/decisions/x', locales, 'en')).toEqual({ locale: 'en', prefix: '' })
  })

  it('detects the /fr prefix', () => {
    expect(getLocaleFromUrl('/fr', locales, 'en')).toEqual({ locale: 'fr', prefix: '/fr' })
    expect(getLocaleFromUrl('/fr/decisions/x', locales, 'en')).toEqual({ locale: 'fr', prefix: '/fr' })
  })

  it('handles prefix declared without leading slash', () => {
    const locs = [{ code: 'fr', routePrefix: 'fr' }]
    expect(getLocaleFromUrl('/fr/decisions', locs, 'en').locale).toBe('fr')
  })
})

describe('localizedHref', () => {
  const locales = [
    { code: 'en', routePrefix: '' },
    { code: 'fr', routePrefix: '/fr' },
  ]

  it('returns the href unchanged for the default locale', () => {
    expect(localizedHref('/decisions/x', 'en', locales, 'en')).toBe('/decisions/x')
  })

  it('prefixes the href for non-default locales', () => {
    expect(localizedHref('/decisions/x', 'fr', locales, 'en')).toBe('/fr/decisions/x')
  })

  it('handles hrefs without leading slash', () => {
    expect(localizedHref('decisions', 'fr', locales, 'en')).toBe('/fr/decisions')
  })
})
