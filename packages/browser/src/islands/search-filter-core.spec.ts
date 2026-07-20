import { describe, expect, it } from 'vitest'

import {
  EMPTY_STATE,
  countFacets,
  decodeState,
  encodeState,
  filterItems,
  toggle,
  type SearchableItem,
} from './search-filter-core.js'

const items: SearchableItem[] = [
  { urn: 'urn:a:1', title: 'First decision', bodyType: 'ciml', kind: 'resolution', year: 2024, actionTypes: ['approves'], snippet: 'Approves the plan.' },
  { urn: 'urn:a:2', title: 'Second decision', bodyType: 'ciml', kind: 'recommendation', year: 2023, actionTypes: ['recommends', 'requests'] },
  { urn: 'urn:b:1', title: 'Other body decision', bodyType: 'conference', kind: 'resolution', year: 2024, actionTypes: ['approves', 'welcomes'] },
]

const meetings: SearchableItem[] = [
  { urn: 'urn:m:1', title: '58th CIML Meeting', bodyType: 'committee', year: 2023, committeeCode: 'ciml', city: 'Berlin', countryCode: 'DE', startDate: '2023-10-16' },
  { urn: 'urn:m:2', title: '59th CIML Meeting', bodyType: 'committee', year: 2024, committeeCode: 'ciml', city: 'Geneva', countryCode: 'CH', startDate: '2024-10-14' },
  { urn: 'urn:m:3', title: '15th Conference', bodyType: 'conference', year: 2031, committeeCode: 'conf', city: 'Paris', countryCode: 'FR', startDate: '2031-11-06' },
]

describe('filterItems', () => {
  it('returns everything with an empty state', () => {
    expect(filterItems(items, EMPTY_STATE).length).toBe(3)
  })

  it('filters by substring query against title + urn', () => {
    expect(filterItems(items, { ...EMPTY_STATE, query: 'first' }).map((i) => i.urn)).toEqual(['urn:a:1'])
    expect(filterItems(items, { ...EMPTY_STATE, query: 'urn:b' }).map((i) => i.urn)).toEqual(['urn:b:1'])
  })

  it('filters by body', () => {
    const state = { ...EMPTY_STATE, bodies: new Set(['ciml']) }
    expect(filterItems(items, state).length).toBe(2)
  })

  it('combines query + body filters', () => {
    const state = { ...EMPTY_STATE, query: 'decision', bodies: new Set(['conference']) }
    expect(filterItems(items, state).map((i) => i.urn)).toEqual(['urn:b:1'])
  })

  it('is case-insensitive on the query', () => {
    expect(filterItems(items, { ...EMPTY_STATE, query: 'FIRST' }).map((i) => i.urn)).toEqual(['urn:a:1'])
  })

  it('matches against the snippet text', () => {
    expect(filterItems(items, { ...EMPTY_STATE, query: 'plan' }).map((i) => i.urn)).toEqual(['urn:a:1'])
  })

  it('filters by action type (any match per item)', () => {
    const state = { ...EMPTY_STATE, actions: new Set(['approves']) }
    expect(filterItems(items, state).map((i) => i.urn)).toEqual(['urn:a:1', 'urn:b:1'])
  })

  it('combines action + kind filters', () => {
    const state = { ...EMPTY_STATE, actions: new Set(['approves']), kinds: new Set(['recommendation']) }
    expect(filterItems(items, state).length).toBe(0)
  })
})

describe('filterItems — meetings mode', () => {
  it('filters by decade facet', () => {
    const state = { ...EMPTY_STATE, decades: new Set([2020]) }
    expect(filterItems(meetings, state).map((i) => i.urn)).toEqual(['urn:m:1', 'urn:m:2'])
  })

  it('filters by country facet', () => {
    const state = { ...EMPTY_STATE, countries: new Set(['CH']) }
    expect(filterItems(meetings, state).map((i) => i.urn)).toEqual(['urn:m:2'])
  })

  it('text search hits the committee code and the city', () => {
    expect(filterItems(meetings, { ...EMPTY_STATE, query: 'ciml' }).map((i) => i.urn))
      .toEqual(['urn:m:1', 'urn:m:2'])
    expect(filterItems(meetings, { ...EMPTY_STATE, query: 'geneva' }).map((i) => i.urn))
      .toEqual(['urn:m:2'])
  })

  it('combines decade + country + query', () => {
    const state = { ...EMPTY_STATE, decades: new Set([2020]), countries: new Set(['DE']), query: 'ciml' }
    expect(filterItems(meetings, state).map((i) => i.urn)).toEqual(['urn:m:1'])
  })

  it('excludes undated items when a decade facet is active', () => {
    const undated: SearchableItem[] = [{ urn: 'urn:m:x', title: 'TBD meeting' }]
    expect(filterItems(undated, { ...EMPTY_STATE, decades: new Set([2020]) }).length).toBe(0)
  })
})

describe('countFacets', () => {
  it('counts distinct bodies, kinds, years', () => {
    const facets = countFacets(items)
    expect(facets.bodies.get('ciml')).toBe(2)
    expect(facets.bodies.get('conference')).toBe(1)
    expect(facets.kinds.get('resolution')).toBe(2)
    expect(facets.years.get(2024)).toBe(2)
  })

  it('counts action types across items', () => {
    const facets = countFacets(items)
    expect(facets.actions.get('approves')).toBe(2)
    expect(facets.actions.get('recommends')).toBe(1)
  })

  it('counts decades and countries for meetings', () => {
    const facets = countFacets(meetings)
    expect(facets.decades.get(2020)).toBe(2)
    expect(facets.countries.get('DE')).toBe(1)
    expect(facets.countries.get('FR')).toBe(1)
  })
})

describe('toggle', () => {
  it('adds then removes a key', () => {
    const s1 = toggle(new Set<string>(), 'a')
    expect([...s1]).toEqual(['a'])
    const s2 = toggle(s1, 'a')
    expect([...s2]).toEqual([])
  })
})

describe('encodeState / decodeState', () => {
  it('round-trips a complex state through URL hash', () => {
    const state = {
      query: 'publishes',
      bodies: new Set(['ciml', 'conference']),
      kinds: new Set(['resolution']),
      years: new Set([2023, 2024]),
      actions: new Set(['approves']),
      decades: new Set([2020]),
      countries: new Set(['DE', 'CH']),
    }
    const hash = encodeState(state)
    const restored = decodeState(hash)
    expect(restored.query).toBe(state.query)
    expect([...restored.bodies].sort()).toEqual(['ciml', 'conference'])
    expect([...restored.kinds]).toEqual(['resolution'])
    expect([...restored.years].sort()).toEqual([2023, 2024])
    expect([...restored.actions]).toEqual(['approves'])
    expect([...restored.decades]).toEqual([2020])
    expect([...restored.countries].sort()).toEqual(['CH', 'DE'])
  })

  it('returns empty state for empty hash', () => {
    const restored = decodeState('')
    expect(restored.query).toBe('')
    expect(restored.bodies.size).toBe(0)
    expect(restored.decades.size).toBe(0)
    expect(restored.countries.size).toBe(0)
  })
})
