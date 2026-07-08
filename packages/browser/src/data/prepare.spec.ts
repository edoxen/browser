import { describe, expect, it } from 'vitest'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

import { loadAll } from './load.js'
import { validateAll } from './validate.js'
import { buildProjectFromLoaded } from './project.js'
import { prepareDecisionsList, prepareMeetingsList, preparePayloads } from './prepare.js'
import type { DataConfig } from '../config/schema.js'

const here = dirname(fileURLToPath(import.meta.url))
const fixtures = resolve(here, '../../test/fixtures')

const cfg: DataConfig = {
  decisions: resolve(fixtures, './decisions'),
  meetings: resolve(fixtures, './meetings'),
}

describe('validateAll', () => {
  it('returns valid=true for clean fixtures', async () => {
    const loaded = await loadAll(cfg)
    if (!loaded.ok) throw new Error('load failed')
    const report = await validateAll(loaded.value)
    expect(report.valid).toBe(true)
  })

  it('returns the per-source ValidateResult for inspection', async () => {
    const loaded = await loadAll(cfg)
    if (!loaded.ok) throw new Error('load failed')
    const report = await validateAll(loaded.value)
    expect(report.decisions?.valid).toBe(true)
    expect(report.meetings?.valid).toBe(true)
  })
})

describe('buildProjectFromLoaded', () => {
  it('joins decisions + meetings + committee into an EdoxenProject', async () => {
    const loaded = await loadAll(cfg)
    if (!loaded.ok) throw new Error('load failed')
    const project = buildProjectFromLoaded(loaded.value)
    expect(project.decisions.length).toBe(2)
    expect(project.meetings.length).toBe(2)
    expect(project.committee).toBeNull()
  })
})

describe('prepareDecisionsList', () => {
  it('produces a list sorted by date descending', async () => {
    const loaded = await loadAll(cfg)
    if (!loaded.ok) throw new Error('load failed')
    const project = buildProjectFromLoaded(loaded.value)
    const payload = prepareDecisionsList(project)
    expect(payload.items.map((i) => i.urn)).toEqual([
      'urn:test:resolution:1',
      'urn:test:resolution:2',
    ])
  })

  it('derives identifier from prefix + number', async () => {
    const loaded = await loadAll(cfg)
    if (!loaded.ok) throw new Error('load failed')
    const payload = prepareDecisionsList(buildProjectFromLoaded(loaded.value))
    expect(payload.items[0]?.identifier).toBe('TEST-1')
  })

  it('surfaces body_type for join against cfg.bodies', async () => {
    const loaded = await loadAll(cfg)
    if (!loaded.ok) throw new Error('load failed')
    const payload = prepareDecisionsList(buildProjectFromLoaded(loaded.value))
    expect(payload.items.every((i) => i.bodyType === 'committee')).toBe(true)
    expect(payload.facets.bodies).toEqual(['committee'])
  })

  it('exposes year + kind facets from the data', async () => {
    const loaded = await loadAll(cfg)
    if (!loaded.ok) throw new Error('load failed')
    const payload = prepareDecisionsList(buildProjectFromLoaded(loaded.value))
    expect(payload.facets.years).toEqual([2023, 2024])
    expect(payload.facets.kinds).toEqual(['recommendation', 'resolution'])
  })

  it('carries meetingUrn (meeting date key) for back-links to /meetings/[urn]', async () => {
    const loaded = await loadAll(cfg)
    if (!loaded.ok) throw new Error('load failed')
    const payload = prepareDecisionsList(buildProjectFromLoaded(loaded.value))
    expect(payload.items[0]?.meetingUrn).toBe('2024-06-15')
  })
})

describe('prepareMeetingsList', () => {
  it('produces a list sorted by start date descending', async () => {
    const loaded = await loadAll(cfg)
    if (!loaded.ok) throw new Error('load failed')
    const payload = prepareMeetingsList(buildProjectFromLoaded(loaded.value))
    expect(payload.items.map((i) => i.urn)).toEqual([
      'urn:test:meeting:2024',
      'urn:test:meeting:2023',
    ])
  })

  it('exposes decade + body + country facets', async () => {
    const loaded = await loadAll(cfg)
    if (!loaded.ok) throw new Error('load failed')
    const payload = prepareMeetingsList(buildProjectFromLoaded(loaded.value))
    expect(payload.facets.decades).toEqual([2020])
    expect(payload.facets.bodies).toEqual(['committee'])
    expect(payload.facets.countries).toEqual(['DE', 'FR'])
  })

  it('exposes year + city for display', async () => {
    const loaded = await loadAll(cfg)
    if (!loaded.ok) throw new Error('load failed')
    const payload = prepareMeetingsList(buildProjectFromLoaded(loaded.value))
    expect(payload.items[0]?.year).toBe(2024)
    expect(payload.items[0]?.city).toBe('CNSHA')
  })
})

describe('preparePayloads', () => {
  it('returns both list payloads in one call', async () => {
    const loaded = await loadAll(cfg)
    if (!loaded.ok) throw new Error('load failed')
    const payloads = preparePayloads(buildProjectFromLoaded(loaded.value))
    expect(payloads.decisionsList.items.length).toBe(2)
    expect(payloads.meetingsList.items.length).toBe(2)
  })

  it('exposes decisionByUrn and meetingByUrn maps for detail pages', async () => {
    const loaded = await loadAll(cfg)
    if (!loaded.ok) throw new Error('load failed')
    const payloads = preparePayloads(buildProjectFromLoaded(loaded.value))
    expect(payloads.decisionByUrn['urn:test:resolution:1']).toBeDefined()
    expect(payloads.decisionByUrn['urn:test:resolution:1']?.body_type).toBe('committee')
    expect(payloads.meetingByUrn['urn:test:meeting:2024']).toBeDefined()
    expect(payloads.meetingByUrn['urn:test:meeting:2024']?.city).toBe('CNSHA')
  })
})
