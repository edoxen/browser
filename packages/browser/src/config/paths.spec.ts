import { describe, expect, it } from 'vitest'

import { activeDataKeys, resolveDataPaths } from './paths.js'
import type { DataConfig } from './schema.js'

function cfg(data: DataConfig): DataConfig {
  return data
}

describe('resolveDataPaths', () => {
  it('returns decisions plus null for omitted entities', () => {
    const paths = resolveDataPaths(cfg({ decisions: './data/decisions' }))
    expect(paths).toEqual({
      decisions: './data/decisions',
      meetings: null,
      contacts: null,
      venues: null,
      bodies: null,
      agendas: null,
      minutes: null,
      committee: null,
    })
  })

  it('preserves every provided entity path', () => {
    const paths = resolveDataPaths(cfg({
      decisions: './data/decisions',
      meetings: './data/meetings',
      contacts: './data/contacts.yaml',
      venues: './data/venues.yaml',
      bodies: './data/bodies.yaml',
      agendas: './data/agendas',
      minutes: './data/minutes',
      committee: './data/committee.yaml',
    }))
    expect(paths.committee).toBe('./data/committee.yaml')
    expect(paths.minutes).toBe('./data/minutes')
    expect(paths.contacts).toBe('./data/contacts.yaml')
    expect(paths.venues).toBe('./data/venues.yaml')
    expect(paths.bodies).toBe('./data/bodies.yaml')
  })
})

describe('activeDataKeys', () => {
  it('lists only keys that have a path', () => {
    expect(activeDataKeys(cfg({ decisions: './data/decisions' }))).toEqual(['decisions'])
  })

  it('lists every key when all are present, in canonical order', () => {
    const keys = activeDataKeys(cfg({
      decisions: './d',
      meetings: './m',
      contacts: './c.yaml',
      venues: './v.yaml',
      bodies: './b.yaml',
      agendas: './a',
      minutes: './min',
      committee: './c.yaml',
    }))
    expect(keys).toEqual(['decisions', 'meetings', 'contacts', 'venues', 'bodies', 'agendas', 'minutes', 'committee'])
  })

  it('keeps stable order regardless of object key order', () => {
    const keys = activeDataKeys(cfg({
      committee: './c.yaml',
      decisions: './d',
      meetings: './m',
      venues: './v.yaml',
    }))
    expect(keys).toEqual(['decisions', 'meetings', 'venues', 'committee'])
  })
})
