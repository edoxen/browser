import { describe, expect, it } from 'vitest'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

import { loadAll } from './load.js'
import type { DataConfig } from '../config/schema.js'

const here = dirname(fileURLToPath(import.meta.url))
const fixtures = resolve(here, '../../test/fixtures')

function dataConfig(decisions = './decisions', meetings?: string): DataConfig {
  return {
    decisions: resolve(fixtures, decisions),
    ...(meetings ? { meetings: resolve(fixtures, meetings) } : {}),
  }
}

describe('loadAll', () => {
  it('loads every decision from a directory of fixtures', async () => {
    const result = await loadAll(dataConfig())
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.decisions?.decisions.length).toBe(2)
    expect(result.value.decisions?.decisions[0]?.urn).toBe('urn:test:resolution:1')
  })

  it('returns ok with no meetings when none requested', async () => {
    const result = await loadAll(dataConfig())
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.meetings).toBeUndefined()
  })

  it('loads meetings when configured', async () => {
    const result = await loadAll(dataConfig('./decisions', './meetings'))
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.meetings?.meetings.length).toBe(2)
    expect(result.value.meetings?.meetings[0]?.urn).toBe('urn:test:meeting:2024')
  })

  it('reports a structured error when the decisions path does not exist', async () => {
    const result = await loadAll(dataConfig('./missing-decisions'))
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error.length).toBeGreaterThanOrEqual(1)
    expect(result.error[0]?.source).toBe('decisions')
    expect(result.error[0]?.path).toMatch(/missing-decisions$/)
    expect(result.error[0]?.cause).toBeInstanceOf(Error)
  })

  it('reports one error per failing source', async () => {
    const result = await loadAll(dataConfig('./missing-decisions', './missing-meetings'))
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error.map((e) => e.source).sort()).toEqual(['decisions', 'meetings'])
  })
})
