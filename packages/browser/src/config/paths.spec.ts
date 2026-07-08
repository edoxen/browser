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
      agendas: null,
      minutes: null,
      committee: null,
    })
  })

  it('preserves every provided entity path', () => {
    const paths = resolveDataPaths(cfg({
      decisions: './data/decisions',
      meetings: './data/meetings',
      agendas: './data/agendas',
      minutes: './data/minutes',
      committee: './data/committee.yaml',
    }))
    expect(paths.committee).toBe('./data/committee.yaml')
    expect(paths.minutes).toBe('./data/minutes')
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
      agendas: './a',
      minutes: './min',
      committee: './c.yaml',
    }))
    expect(keys).toEqual(['decisions', 'meetings', 'agendas', 'minutes', 'committee'])
  })

  it('keeps stable order regardless of object key order', () => {
    const keys = activeDataKeys(cfg({
      committee: './c.yaml',
      decisions: './d',
      meetings: './m',
    }))
    expect(keys).toEqual(['decisions', 'meetings', 'committee'])
  })
})
