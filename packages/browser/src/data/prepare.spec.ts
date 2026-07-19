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
  decisions: resolve(fixtures, 'decisions/sample.yaml'),
  meetings: resolve(fixtures, 'meetings/sample.yaml'),
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

// Rich card/detail surfaces — exercised against the enriched fixture set
// (decisions with actions/considerations/approvals/agenda_item, meetings
// with agenda + committee refs + registers).
const richCfg: DataConfig = {
  decisions: resolve(fixtures, 'decisions/sample.yaml'),
  meetings: resolve(fixtures, 'meetings/with-refs-meeting.yaml'),
  contacts: resolve(fixtures, 'registers/contacts.yaml'),
  venues: resolve(fixtures, 'registers/venues.yaml'),
  bodies: resolve(fixtures, 'registers/bodies.yaml'),
}

async function richPayloads() {
  const loaded = await loadAll(richCfg)
  if (!loaded.ok) throw new Error('load failed')
  return preparePayloads(buildProjectFromLoaded(loaded.value), loaded.value.registers)
}

describe('rich list payloads', () => {
  it('decision items carry actionTypes, status, date and a snippet', async () => {
    const payloads = await richPayloads()
    const first = payloads.decisionsList.items.find((i) => i.urn === 'urn:test:resolution:1')
    expect(first?.actionTypes).toEqual(['publishes', 'thanks'])
    expect(first?.status).toBe('decided')
    expect(first?.date).toBe('2024-06-15')
    expect(first?.year).toBe(2024)
    expect(first?.snippet[0]?.value).toContain('Publishes the test standard')
    expect(first?.subject.length).toBeGreaterThan(0)
  })

  it('exposes actionTypes + statuses facets', async () => {
    const payloads = await richPayloads()
    expect(payloads.decisionsList.facets.actionTypes).toEqual(['publishes', 'recommends', 'thanks'])
    expect(payloads.decisionsList.facets.statuses).toEqual(['decided'])
  })

  it('resolves meetingPageUrn through the meeting decision refs', async () => {
    const payloads = await richPayloads()
    const first = payloads.decisionsList.items.find((i) => i.urn === 'urn:test:resolution:1')
    expect(first?.meetingPageUrn).toBe('urn:test:meeting:2025')
    const second = payloads.decisionsList.items.find((i) => i.urn === 'urn:test:resolution:2')
    expect(second?.meetingPageUrn).toBeUndefined()
  })

  it('maps agenda items to the decision they produced', async () => {
    const payloads = await richPayloads()
    const hit = payloads.decisionByAgendaItem['urn:test:meeting:2025::2']
    expect(hit?.urn).toBe('urn:test:resolution:1')
    expect(payloads.decisionByAgendaItem['urn:test:meeting:2025::1']).toBeUndefined()
  })

  it('meeting items carry resolved committeeCode and decisionCount', async () => {
    const payloads = await richPayloads()
    const m2025 = payloads.meetingsList.items.find((i) => i.urn === 'urn:test:meeting:2025')
    expect(m2025?.committeeCode).toBe('sc-1')
    expect(m2025?.decisionCount).toBe(1)
    const m2026 = payloads.meetingsList.items.find((i) => i.urn === 'urn:test:meeting:2026')
    expect(m2026?.committeeCode).toBe('ciml')
    expect(m2026?.decisionCount).toBeUndefined()
  })

  it('groups linked decisions under their meeting', async () => {
    const payloads = await richPayloads()
    const linked = payloads.decisionsByMeetingUrn['urn:test:meeting:2025'] ?? []
    expect(linked.map((d) => d.urn)).toEqual(['urn:test:resolution:1'])
    expect(linked[0]?.meetingPageUrn).toBe('urn:test:meeting:2025')
  })
})
