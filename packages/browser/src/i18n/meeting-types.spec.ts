// Drift detection: every canonical MeetingType enum value (mirrored from
// Edoxen::Enums::MEETING_TYPE) must have a `meeting.type.<value>` entry
// in the built-in English i18n table. When the gem adds a new value,
// this spec fails until the i18n table catches up.
//
// The canonical list lives in
// /Users/mulgogi/src/edoxen/edoxen-model/models/meeting_type.lutaml and
// propagates: gem (lib/edoxen/enums.rb) → schema ($defs/MeetingType) →
// generated TS type (MeetingType, in @edoxen/edoxen). The i18n table
// here is hand-maintained; this spec is the guardrail.

import { describe, expect, it } from 'vitest'

import { t, meetingTypeLabel } from './ui.js'

const CANONICAL_MEETING_TYPES = [
  'plenary',
  'working_group',
  'task_group',
  'ad_hoc',
  'joint',
  'general_assembly',
  'committee',
  'subcommittee',
  'conference',
  'workshop',
  'seminar',
  'webinar',
  'hearing',
  'markup',
  'board_meeting',
  'annual_general_meeting',
  'other',
] as const

describe('MeetingType i18n coverage', () => {
  it('every canonical enum value has an English meeting.type.* string', () => {
    const missing = CANONICAL_MEETING_TYPES.filter((type) => {
      const label = t(`meeting.type.${type}`, 'eng')
      return !label || label === `meeting.type.${type}`
    })
    expect(missing, `Missing English i18n for: ${missing.join(', ')}`).toEqual([])
  })

  it('French locale has at least the common subset translated', () => {
    const requiredFra = ['plenary', 'committee', 'subcommittee', 'other']
    const missing = requiredFra.filter((type) => {
      const label = t(`meeting.type.${type}`, 'fra')
      return !label || label === `meeting.type.${type}` || label === t(`meeting.type.${type}`, 'eng')
    })
    expect(missing, `Missing French translations for: ${missing.join(', ')}`).toEqual([])
  })
})

describe('meetingTypeLabel resolution', () => {
  it('returns the curated English label for known values', () => {
    expect(meetingTypeLabel('plenary', 'eng')).toBe('Plenary')
    expect(meetingTypeLabel('annual_general_meeting', 'eng')).toBe('Annual General Meeting')
  })

  it('returns empty string for nullish input', () => {
    expect(meetingTypeLabel(undefined, 'eng')).toBe('')
    expect(meetingTypeLabel('', 'eng')).toBe('')
  })

  it('falls back to humanize for unknown values', () => {
    expect(meetingTypeLabel('some_future_type', 'eng')).toBe('Some Future Type')
  })

  it('honors terminology.meetingTypes overrides per locale', () => {
    const terminology = {
      meetingTypes: {
        eng: { plenary: 'Plénière CIML' },
      },
    }
    expect(meetingTypeLabel('plenary', 'eng', terminology)).toBe('Plénière CIML')
    // Non-overridden values still resolve normally.
    expect(meetingTypeLabel('committee', 'eng', terminology)).toBe('Committee')
  })
})
