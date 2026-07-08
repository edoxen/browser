import { describe, expect, it } from 'vitest'
import type { Decision, Meeting } from '@edoxen/edoxen'

import { decisionJsonLd, meetingJsonLd } from './index.js'

const ctx = { siteUrl: 'https://example.org', siteTitle: 'X', defaultLocale: 'en' }

const decision = {
  identifier: [{ prefix: 'TEST', number: '1' }],
  kind: 'resolution',
  urn: 'urn:test:resolution:1',
  body_type: 'committee',
  doi: '10.63493/test',
  dates: [
    { type: 'effective', date: '2024-06-15' },
    { type: 'published', date: '2024-06-20' },
  ],
  title: [{ spelling: 'eng', value: 'First test decision' }],
  categories: ['Tests'],
} as unknown as Decision

const meeting = {
  identifier: [{ prefix: 'TEST', number: '2024' }],
  type: 'plenary',
  urn: 'urn:test:meeting:2024',
  body_type: 'committee',
  status: 'completed',
  date_range: { start: '2024-06-15', end: '2024-06-20' },
  city: 'CNSHA',
  country_code: 'DE',
  title: [{ spelling: 'eng', value: '2024 Plenary' }],
} as unknown as Meeting

describe('decisionJsonLd', () => {
  it('produces a Legislation document with the canonical URL', () => {
    const jsonld = decisionJsonLd(decision, ctx)
    expect(jsonld['@type']).toBe('Legislation')
    expect(jsonld['@context']).toBe('https://schema.org')
    expect(jsonld.name).toBe('First test decision')
    expect(jsonld.identifier).toBe('urn:test:resolution:1')
    expect(jsonld.url).toBe('https://example.org/decisions/urn%3Atest%3Aresolution%3A1')
  })

  it('links the DOI as sameAs', () => {
    expect(decisionJsonLd(decision, ctx).sameAs).toBe('https://doi.org/10.63493/test')
  })

  it('exposes effective + published dates', () => {
    const jsonld = decisionJsonLd(decision, ctx)
    expect(jsonld.legislationDate).toBe('2024-06-15')
    expect(jsonld.datePublished).toBe('2024-06-20')
  })

  it('emits undefined sameAs when no DOI', () => {
    const noDoi = { ...decision, doi: undefined } as Decision
    expect(decisionJsonLd(noDoi, ctx).sameAs).toBeUndefined()
  })
})

describe('meetingJsonLd', () => {
  it('produces an Event document with start/end dates', () => {
    const jsonld = meetingJsonLd(meeting, ctx)
    expect(jsonld['@type']).toBe('Event')
    expect(jsonld.startDate).toBe('2024-06-15')
    expect(jsonld.endDate).toBe('2024-06-20')
    expect(jsonld.eventStatus).toBe('https://schema.org/EventCompleted')
  })

  it('includes a Place when city + country are present', () => {
    const jsonld = meetingJsonLd(meeting, ctx)
    expect(jsonld.location).toEqual({
      '@type': 'Place',
      address: { '@type': 'PostalAddress', addressCountry: 'DE' },
    })
  })
})
