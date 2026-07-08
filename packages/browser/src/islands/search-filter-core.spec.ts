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
  { urn: 'urn:a:1', title: 'First decision', bodyType: 'ciml', kind: 'resolution', year: 2024 },
  { urn: 'urn:a:2', title: 'Second decision', bodyType: 'ciml', kind: 'recommendation', year: 2023 },
  { urn: 'urn:b:1', title: 'Other body decision', bodyType: 'conference', kind: 'resolution', year: 2024 },
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
})

describe('countFacets', () => {
  it('counts distinct bodies, kinds, years', () => {
    const facets = countFacets(items)
    expect(facets.bodies.get('ciml')).toBe(2)
    expect(facets.bodies.get('conference')).toBe(1)
    expect(facets.kinds.get('resolution')).toBe(2)
    expect(facets.years.get(2024)).toBe(2)
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
    }
    const hash = encodeState(state)
    const restored = decodeState(hash)
    expect(restored.query).toBe(state.query)
    expect([...restored.bodies].sort()).toEqual(['ciml', 'conference'])
    expect([...restored.kinds]).toEqual(['resolution'])
    expect([...restored.years].sort()).toEqual([2023, 2024])
  })

  it('returns empty state for empty hash', () => {
    const restored = decodeState('')
    expect(restored.query).toBe('')
    expect(restored.bodies.size).toBe(0)
  })
})
