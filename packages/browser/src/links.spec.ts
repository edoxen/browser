import { describe, expect, it } from 'vitest'

import { decisionHref, decisionsBase } from './links.js'

describe('decisionsBase', () => {
  it('joins the locale prefix and the configured slug', () => {
    expect(decisionsBase({ decisionsSlug: 'decisions' }, '/')).toBe('/decisions')
    expect(decisionsBase({ decisionsSlug: 'resolutions' }, '/')).toBe('/resolutions')
    expect(decisionsBase({ decisionsSlug: 'resolutions' }, '/fr/')).toBe('/fr/resolutions')
    expect(decisionsBase({ decisionsSlug: 'resolutions' }, '/base/')).toBe('/base/resolutions')
  })
})

describe('decisionHref', () => {
  it('builds a detail href under the slug, urnToPath-encoding the URN', () => {
    expect(decisionHref({ decisionsSlug: 'resolutions' }, '/', 'urn:test:resolution:1'))
      .toBe('/resolutions/urn:test:resolution:1')
    expect(decisionHref({ decisionsSlug: 'decisions' }, '/fr/', 'urn:test:resolution:1'))
      .toBe('/fr/decisions/urn:test:resolution:1')
  })

  it('encodes characters that must not survive in a path segment', () => {
    expect(decisionHref({ decisionsSlug: 'decisions' }, '/', 'urn:x:decision:a/b?c'))
      .toBe('/decisions/urn:x:decision:a%2Fb%3Fc')
  })
})
