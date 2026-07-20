import type { Decision, Meeting, LocalizedString } from '@edoxen/edoxen'

import type { DecisionListItem, MeetingListItem } from '../data/index.js'
import { urnToPath } from '../urn.js'

export interface SeoContext {
  readonly siteUrl: string
  readonly siteTitle: string
  readonly defaultLocale: string
  /** Route segment of the decision pages (config decisionsSlug). */
  readonly decisionsSlug?: string
}

export interface JsonLd {
  readonly '@context': 'https://schema.org'
  readonly '@type': string
  readonly [key: string]: unknown
}

function firstLocalizedValue(list: readonly LocalizedString[] | undefined, fallback: string): string {
  return list?.[0]?.value ?? fallback
}

export function decisionJsonLd(decision: Decision, ctx: SeoContext): JsonLd {
  const title = firstLocalizedValue(decision.title, decision.urn ?? '')
  const url = `${ctx.siteUrl}/${ctx.decisionsSlug ?? 'decisions'}/${urnToPath(decision.urn ?? '')}`
  const sameAs = decision.doi ? `https://doi.org/${decision.doi}` : undefined
  const datePublished = (decision.dates ?? []).find((d) => d.type === 'published')?.date
  const legislationDate = (decision.dates ?? []).find((d) => d.type === 'effective')?.date

  return {
    '@context': 'https://schema.org',
    '@type': 'Legislation',
    name: title,
    identifier: decision.urn,
    url,
    sameAs,
    datePublished,
    legislationDate,
    legislationPassedBy: decision.meeting?.venue ?? undefined,
    keywords: (decision.categories ?? []).join(', ') || undefined,
  }
}

export function decisionListItemJsonLd(item: DecisionListItem, ctx: SeoContext): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'Legislation',
    name: item.title,
    identifier: item.urn,
    url: `${ctx.siteUrl}/${ctx.decisionsSlug ?? 'decisions'}/${urnToPath(item.urn)}`,
    legislationType: item.kind || undefined,
  }
}

export function meetingJsonLd(meeting: Meeting, ctx: SeoContext): JsonLd {
  const title = firstLocalizedValue(meeting.title, meeting.urn ?? '')
  const url = `${ctx.siteUrl}/meetings/${urnToPath(meeting.urn ?? '')}`
  const eventStatus = meeting.status === 'completed'
    ? 'https://schema.org/EventCompleted'
    : 'https://schema.org/EventScheduled'

  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: title,
    identifier: meeting.urn,
    url,
    startDate: meeting.scheduled_date_range?.start,
    endDate: meeting.scheduled_date_range?.end,
    eventStatus,
    location: meeting.city
      ? { '@type': 'Place', address: { '@type': 'PostalAddress', addressCountry: meeting.country_code } }
      : undefined,
  }
}

export function meetingListItemJsonLd(item: MeetingListItem, ctx: SeoContext): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: item.title,
    identifier: item.urn,
    url: `${ctx.siteUrl}/meetings/${urnToPath(item.urn)}`,
    startDate: item.startDate,
    endDate: item.endDate,
  }
}
