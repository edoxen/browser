import type {
  Action,
  Approval,
  Consideration,
  Decision,
  EdoxenProject,
  LocalizedString,
  Meeting,
  StructuredIdentifier,
} from '@edoxen/edoxen'

export interface DecisionListItem {
  readonly urn: string
  readonly identifier: string
  readonly title: string
  readonly kind: string
  readonly dates: readonly { readonly type: string; readonly date: string }[]
  readonly meetingUrn?: string
  readonly bodyType?: string
}

export interface DecisionListFacets {
  readonly years: readonly number[]
  readonly kinds: readonly string[]
  readonly bodies: readonly string[]
  readonly meetingUrns: readonly string[]
}

export interface DecisionListPayload {
  readonly items: readonly DecisionListItem[]
  readonly facets: DecisionListFacets
}

export interface MeetingListItem {
  readonly urn: string
  readonly identifier: string
  readonly title: string
  readonly startDate?: string
  readonly endDate?: string
  readonly year?: number
  readonly bodyType?: string
  readonly city?: string
  readonly countryCode?: string
  readonly status?: string
}

export interface MeetingListFacets {
  readonly decades: readonly number[]
  readonly bodies: readonly string[]
  readonly countries: readonly string[]
}

export interface MeetingListPayload {
  readonly items: readonly MeetingListItem[]
  readonly facets: MeetingListFacets
}

export interface PagePayloads {
  readonly decisionsList: DecisionListPayload
  readonly meetingsList: MeetingListPayload
  readonly decisionByUrn: Readonly<Record<string, Decision>>
  readonly meetingByUrn: Readonly<Record<string, Meeting>>
}

function formatIdentifier(ids: readonly StructuredIdentifier[] | undefined): string {
  if (!ids || ids.length === 0) return ''
  const head = ids[0]
  if (!head) return ''
  return `${head.prefix}-${head.number}`
}

function primaryValue(list: readonly LocalizedString[] | undefined, fallback: string): string {
  const first = list?.[0]?.value
  return first && first.length > 0 ? first : fallback
}

function meetingKeyOf(d: Decision): string | undefined {
  return d.meeting?.date ?? d.meeting?.venue
}

function effectiveYearOf(d: Decision): number | null {
  for (const dt of d.dates ?? []) {
    const v = dt.date
    if (typeof v === 'string' && v.length >= 4) {
      const year = Number(v.slice(0, 4))
      if (Number.isInteger(year)) return year
    }
  }
  return null
}

function yearOfMeeting(m: Meeting): number | null {
  const start = m.date_range?.start
  if (typeof start !== 'string' || start.length < 4) return null
  const year = Number(start.slice(0, 4))
  return Number.isInteger(year) ? year : null
}

function decadeOf(year: number): number {
  return Math.floor(year / 10) * 10
}

function uniqSorted(values: Iterable<string>): readonly string[] {
  const set = new Set<string>()
  for (const v of values) if (v && v.length > 0) set.add(v)
  return [...set].sort()
}

function uniqSortedNumbers(values: Iterable<number>): readonly number[] {
  const set = new Set<number>()
  for (const v of values) if (Number.isFinite(v)) set.add(v)
  return [...set].sort((a, b) => a - b)
}

function toDecisionListItem(d: Decision): DecisionListItem {
  const meetingKey = meetingKeyOf(d)
  return {
    urn: d.urn ?? '',
    identifier: formatIdentifier(d.identifier),
    title: primaryValue(d.title, d.urn ?? formatIdentifier(d.identifier)),
    kind: d.kind ?? '',
    dates: (d.dates ?? []).map((dt) => ({ type: dt.type ?? '', date: dt.date ?? '' })),
    meetingUrn: meetingKey,
    bodyType: d.body_type,
  }
}

function toMeetingListItem(m: Meeting): MeetingListItem {
  const year = yearOfMeeting(m)
  return {
    urn: m.urn ?? '',
    identifier: formatIdentifier(m.identifier),
    title: primaryValue(m.title, m.urn ?? formatIdentifier(m.identifier)),
    startDate: m.date_range?.start,
    endDate: m.date_range?.end,
    year: year ?? undefined,
    bodyType: m.body_type,
    city: m.city,
    countryCode: m.country_code,
    status: m.status,
  }
}

export function prepareDecisionsList(project: EdoxenProject): DecisionListPayload {
  const items = [...project.decisions]
    .map(toDecisionListItem)
    .sort((a, b) => (b.dates[0]?.date ?? '').localeCompare(a.dates[0]?.date ?? ''))

  return {
    items,
    facets: {
      years: uniqSortedNumbers(project.decisions.map((d) => effectiveYearOf(d) ?? -1).filter((y) => y > 0)),
      kinds: uniqSorted(project.decisions.map((d) => d.kind ?? '')),
      bodies: uniqSorted(project.decisions.map((d) => d.body_type ?? '')),
      meetingUrns: uniqSorted(project.decisions.map((d) => meetingKeyOf(d) ?? '')),
    },
  }
}

export function prepareMeetingsList(project: EdoxenProject): MeetingListPayload {
  const items = [...project.meetings]
    .map(toMeetingListItem)
    .sort((a, b) => (b.startDate ?? '').localeCompare(a.startDate ?? ''))

  const decadesSet = new Set<number>()
  for (const m of project.meetings) {
    const y = yearOfMeeting(m)
    if (y !== null) decadesSet.add(decadeOf(y))
  }

  return {
    items,
    facets: {
      decades: uniqSortedNumbers(decadesSet),
      bodies: uniqSorted(project.meetings.map((m) => m.body_type ?? '')),
      countries: uniqSorted(project.meetings.map((m) => m.country_code ?? '')),
    },
  }
}

export function preparePayloads(project: EdoxenProject): PagePayloads {
  const decisionByUrn: Record<string, Decision> = {}
  for (const d of project.decisions) {
    if (d.urn) decisionByUrn[d.urn] = d
  }
  const meetingByUrn: Record<string, Meeting> = {}
  for (const m of project.meetings) {
    if (m.urn) meetingByUrn[m.urn] = m
  }

  return {
    decisionsList: prepareDecisionsList(project),
    meetingsList: prepareMeetingsList(project),
    decisionByUrn,
    meetingByUrn,
  }
}

export type { Action, Approval, Consideration }
