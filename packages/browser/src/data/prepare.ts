import type {
  Action,
  Approval,
  Body,
  Consideration,
  Contact,
  Decision,
  EdoxenProject,
  LoadedRegisters,
  LocalizedString,
  Meeting,
  StructuredIdentifier,
  Venue,
} from '@edoxen/edoxen'

export interface DecisionListItem {
  readonly urn: string
  readonly identifier: string
  readonly title: readonly LocalizedString[]
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
  readonly title: readonly LocalizedString[]
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

export interface DecisionMeetingLink {
  readonly meetingUrn: string
  readonly kind?: string
}

export interface AgendaItemLink {
  readonly meetingUrn: string
  readonly agendaItemUrn: string
  readonly label: string
}

export interface PagePayloads {
  readonly decisionsList: DecisionListPayload
  readonly meetingsList: MeetingListPayload
  readonly decisionByUrn: Readonly<Record<string, Decision>>
  readonly meetingByUrn: Readonly<Record<string, Meeting>>
  readonly decisionsByMeetingUrn: Readonly<Record<string, readonly DecisionListItem[]>>
  readonly meetingLinkByDecisionId: Readonly<Record<string, DecisionMeetingLink>>
  readonly agendaItemByUrn: Readonly<Record<string, AgendaItemLink>>
  readonly contactByUrn: Readonly<Record<string, Contact>>
  readonly venueByUrn: Readonly<Record<string, Venue>>
  readonly bodyByCode: Readonly<Record<string, Body>>
}

const AGENDA_SEGMENT = 'agenda'

function agendaItemUrnOf(meetingUrn: string, label: string): string {
  return `${meetingUrn}:${AGENDA_SEGMENT}:${label}`
}

function formatIdentifier(ids: readonly StructuredIdentifier[] | undefined): string {
  if (!ids || ids.length === 0) return ''
  const head = ids[0]
  if (!head) return ''
  return `${head.prefix}-${head.number}`
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
  const start = m.scheduled_date_range?.start
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
    title: d.title ?? [],
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
    title: m.title ?? [],
    startDate: m.scheduled_date_range?.start,
    endDate: m.scheduled_date_range?.end,
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

function buildMeetingLinkByDecisionId(meetings: readonly Meeting[]): Readonly<Record<string, DecisionMeetingLink>> {
  const out: Record<string, DecisionMeetingLink> = {}
  for (const m of meetings) {
    const urn = m.urn
    if (!urn) continue
    for (const ref of m.decisions ?? []) {
      const refObj = ref as { identifier?: { prefix?: string; number?: string }[]; prefix?: string; number?: string; kind?: string }
      const id = refObj.identifier?.[0]
      const prefix = id?.prefix ?? refObj.prefix
      const number = id?.number ?? refObj.number
      if (!prefix || !number) continue
      const key = `${prefix}-${number}`
      if (!out[key]) {
        const kind = refObj.kind
        out[key] = { meetingUrn: urn, ...(kind ? { kind } : {}) }
      }
    }
  }
  return out
}

// Walk every meeting's agenda items and compute a first-class URN for each.
// Items that already carry their URN in source data are kept as-is; the rest
// are derived from the parent meeting URN + label so consumers can deep-link
// to /meetings/{meeting}#agenda-{label} via a stable identifier.
function buildAgendaItemByUrn(meetings: readonly Meeting[]): Readonly<Record<string, AgendaItemLink>> {
  const out: Record<string, AgendaItemLink> = {}
  for (const m of meetings) {
    const meetingUrn = m.urn
    if (!meetingUrn) continue
    const items = (m.agenda as { items?: readonly { urn?: string; label?: string }[] } | undefined)?.items
    if (!items) continue
    for (const item of items) {
      const label = item.label
      if (!label) continue
      const urn = item.urn && item.urn.length > 0 ? item.urn : agendaItemUrnOf(meetingUrn, label)
      if (!out[urn]) {
        out[urn] = { meetingUrn, agendaItemUrn: urn, label }
      }
    }
  }
  return out
}

function buildContactByUrn(contacts: readonly Contact[]): Readonly<Record<string, Contact>> {
  const out: Record<string, Contact> = {}
  for (const c of contacts) {
    if (c.urn && !out[c.urn]) out[c.urn] = c
  }
  return out
}

function buildVenueByUrn(venues: readonly Venue[]): Readonly<Record<string, Venue>> {
  const out: Record<string, Venue> = {}
  for (const v of venues) {
    if (v.urn && !out[v.urn]) out[v.urn] = v
  }
  return out
}

// Bodies carry no urn of their own — the gem's BodyRegister#find_by_urn
// matches on `code` OR `ref`, so the map is keyed by both.
function buildBodyByCode(bodies: readonly Body[]): Readonly<Record<string, Body>> {
  const out: Record<string, Body> = {}
  for (const b of bodies) {
    if (b.code && !out[b.code]) out[b.code] = b
    if (b.ref && !out[b.ref]) out[b.ref] = b
  }
  return out
}

// Three-tier entity resolution, mirroring the gem's EntityResolver:
//   1. Inline — no ref/local_ref: the entity carries full data already.
//   2. local_ref — look up in the document-scoped collection (e.g.
//      Meeting#venues) by matching the member's key (urn; code for Body).
//   3. ref — look up in the global register map.
// Unresolvable references fall back to the entity as given.
interface ReferencedEntity {
  readonly ref?: string
  readonly local_ref?: string
}

function resolveEntity<T extends ReferencedEntity>(
  entity: T,
  keyOf: (member: T) => string | undefined,
  scoped: readonly T[] | undefined,
  register: Readonly<Record<string, T>>,
): T {
  if (entity.local_ref && entity.local_ref.length > 0) {
    const hit = scoped?.find((m) => keyOf(m) === entity.local_ref)
    if (hit) return hit
  }
  if (entity.ref && entity.ref.length > 0) {
    const hit = register[entity.ref]
    if (hit) return hit
  }
  return entity
}

export function resolveVenue(
  venue: Venue,
  scoped: readonly Venue[] | undefined,
  register: Readonly<Record<string, Venue>>,
): Venue {
  return resolveEntity(venue, (v) => v.urn, scoped, register)
}

export function resolveContact(
  contact: Contact,
  scoped: readonly Contact[] | undefined,
  register: Readonly<Record<string, Contact>>,
): Contact {
  return resolveEntity(contact, (c) => c.urn, scoped, register)
}

export function resolveBody(
  body: Body,
  scoped: readonly Body[] | undefined,
  register: Readonly<Record<string, Body>>,
): Body {
  return resolveEntity(body, (b) => b.code, scoped, register)
}

export function preparePayloads(project: EdoxenProject, registers?: LoadedRegisters): PagePayloads {
  const decisionByUrn: Record<string, Decision> = {}
  for (const d of project.decisions) {
    if (d.urn) decisionByUrn[d.urn] = d
  }
  const meetingByUrn: Record<string, Meeting> = {}
  for (const m of project.meetings) {
    if (m.urn) meetingByUrn[m.urn] = m
  }

  const meetingLinkByDecisionId = buildMeetingLinkByDecisionId(project.meetings)
  const agendaItemByUrn = buildAgendaItemByUrn(project.meetings)

  const decisionsList = prepareDecisionsList(project)
  const decisionsByMeetingUrn: Record<string, readonly DecisionListItem[]> = {}
  for (const item of decisionsList.items) {
    const link = meetingLinkByDecisionId[item.identifier]
    if (!link) continue
    const list = decisionsByMeetingUrn[link.meetingUrn]
    if (list) (list as DecisionListItem[]).push(item)
    else decisionsByMeetingUrn[link.meetingUrn] = [item]
  }

  return {
    decisionsList,
    meetingsList: prepareMeetingsList(project),
    decisionByUrn,
    meetingByUrn,
    decisionsByMeetingUrn,
    meetingLinkByDecisionId,
    agendaItemByUrn,
    contactByUrn: buildContactByUrn(registers?.contacts?.contacts ?? []),
    venueByUrn: buildVenueByUrn(registers?.venues?.venues ?? []),
    bodyByCode: buildBodyByCode(registers?.bodies?.bodies ?? []),
  }
}

export type { Action, Approval, Consideration }
