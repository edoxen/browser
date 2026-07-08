import type { EdoxenProject } from '@edoxen/edoxen'

export type LintSeverity = 'error' | 'warning'

export interface LintFinding {
  readonly code: string
  readonly severity: LintSeverity
  readonly message: string
}

export interface LintReport {
  readonly findings: readonly LintFinding[]
  readonly ok: boolean
}

function uniq<T>(values: Iterable<T>): T[] {
  return [...new Set(values)]
}

function decisionIdentifierKey(d: { identifier?: { prefix: string; number: string }[] }): string {
  const head = d.identifier?.[0]
  return head ? `${head.prefix}-${head.number}` : ''
}

export function lintProject(project: EdoxenProject): LintReport {
  const findings: LintFinding[] = []

  const urnCounts = new Map<string, number>()
  for (const d of project.decisions) {
    if (!d.urn) continue
    urnCounts.set(d.urn, (urnCounts.get(d.urn) ?? 0) + 1)
  }
  for (const [urn, count] of urnCounts) {
    if (count > 1) {
      findings.push({
        code: 'DUPLICATE_DECISION_URN',
        severity: 'error',
        message: `Decision URN ${urn} appears ${count} times`,
      })
    }
  }

  const decisionIds = new Set<string>()
  for (const d of project.decisions) {
    const key = decisionIdentifierKey(d)
    if (key) decisionIds.add(key)
  }
  for (const d of project.decisions) {
    for (const r of d.relations ?? []) {
      const key = decisionIdentifierKey({ identifier: [r.destination] })
      if (key && !decisionIds.has(key)) {
        findings.push({
          code: 'BROKEN_DECISION_RELATION',
          severity: 'warning',
          message: `Decision ${d.urn} references unknown decision ${key}`,
        })
      }
    }
  }

  const meetingUrns = new Set(project.meetings.map((m) => m.urn).filter((u): u is string => Boolean(u)))
  for (const d of project.decisions) {
    const meetingDate = d.meeting?.date
    if (meetingDate && !meetingUrns.has(meetingDate) && !project.meetingByUrn(meetingDate)) {
      findings.push({
        code: 'ORPHAN_DECISION_MEETING',
        severity: 'warning',
        message: `Decision ${d.urn} references unknown meeting key ${meetingDate}`,
      })
    }
  }

  return {
    findings: uniq(findings),
    ok: !findings.some((f) => f.severity === 'error'),
  }
}
