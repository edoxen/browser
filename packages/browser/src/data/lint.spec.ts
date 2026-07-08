import { describe, expect, it } from 'vitest'
import { buildProject, type Decision, type Meeting } from '@edoxen/edoxen'

import { lintProject } from './lint.js'

function decision(urn: string, extra: Partial<Decision> = {}): Decision {
  return {
    identifier: [{ prefix: 'TEST', number: urn }],
    kind: 'resolution',
    urn,
    localizations: [{ language_code: 'eng', title: urn }],
    ...extra,
  } as Decision
}

function meeting(urn: string, extra: Partial<Meeting> = {}): Meeting {
  return {
    identifier: [{ prefix: 'TEST', number: urn }],
    type: 'plenary',
    urn,
    ...extra,
  } as Meeting
}

describe('lintProject', () => {
  it('returns ok=true with no findings for clean data', () => {
    const project = buildProject({
      decisions: [decision('urn:test:1')],
      meetings: [],
    })
    const report = lintProject(project)
    expect(report.ok).toBe(true)
    expect(report.findings).toEqual([])
  })

  it('flags duplicate decision URNs as errors', () => {
    const project = buildProject({
      decisions: [decision('urn:test:dup'), decision('urn:test:dup')],
    })
    const report = lintProject(project)
    expect(report.ok).toBe(false)
    expect(report.findings.some((f) => f.code === 'DUPLICATE_DECISION_URN')).toBe(true)
  })

  it('warns on relations pointing to unknown decisions', () => {
    const project = buildProject({
      decisions: [
        decision('urn:test:1', {
          relations: [{ source: { prefix: 'TEST', number: '1' }, destination: { prefix: 'TEST', number: 'missing' }, type: 'cites' }],
        }),
      ],
    })
    const report = lintProject(project)
    expect(report.ok).toBe(true)
    expect(report.findings.some((f) => f.code === 'BROKEN_DECISION_RELATION')).toBe(true)
  })

  it('warns when a decision references an unknown meeting date', () => {
    const project = buildProject({
      decisions: [
        decision('urn:test:1', { meeting: { date: '2024-06-15' } }),
      ],
      meetings: [meeting('urn:test:m1', { date_range: { start: '2024-06-15', end: '2024-06-15' } })],
    })
    const report = lintProject(project)
    expect(report.findings.some((f) => f.code === 'ORPHAN_DECISION_MEETING')).toBe(true)
  })

  it('does not flag a decision whose meeting date matches a real meeting', () => {
    const project = buildProject({
      decisions: [
        decision('urn:test:1', { meeting: { date: '2024-06-15' } }),
      ],
      meetings: [meeting('urn:test:meeting-1', { urn: '2024-06-15', date_range: { start: '2024-06-15', end: '2024-06-15' } })],
    })
    const report = lintProject(project)
    expect(report.findings.some((f) => f.code === 'ORPHAN_DECISION_MEETING')).toBe(false)
  })
})
