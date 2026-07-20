import { describe, expect, it } from 'vitest'

import {
  DEFAULT_TERMINOLOGY,
  applyTerminology,
  t,
} from './ui.js'

describe('applyTerminology', () => {
  const term = { ...DEFAULT_TERMINOLOGY, decision: 'resolution', decisions: 'Resolutions' }

  it('replaces whole words, preserving first-letter case', () => {
    expect(applyTerminology('Decisions on record', term)).toBe('Resolutions on record')
    expect(applyTerminology('No decisions.', term)).toBe('No resolutions.')
    expect(applyTerminology('Decision detail', term)).toBe('Resolution detail')
  })

  it('does not touch substrings of longer words', () => {
    // \b keeps 'decision' inside 'indecision' untouched.
    expect(applyTerminology('indecision', term)).toBe('indecision')
  })

  it('replaces meeting words too', () => {
    const t2 = { ...DEFAULT_TERMINOLOGY, meetings: 'Sessions' }
    expect(applyTerminology('Meetings documented', t2)).toBe('Sessions documented')
    expect(applyTerminology('No meetings.', t2)).toBe('No sessions.')
  })

  it('is a no-op with the default terminology', () => {
    expect(applyTerminology('Decisions and Meetings', DEFAULT_TERMINOLOGY)).toBe('Decisions and Meetings')
  })

  it('never re-processes a replacement containing a terminology word', () => {
    const t3 = { ...DEFAULT_TERMINOLOGY, decisions: 'meeting minutes' }
    // 'Decisions' is capitalized, so its replacement is — but the
    // 'meeting' inside the replacement is not substituted a second time.
    expect(applyTerminology('Latest Decisions', t3)).toBe('Latest Meeting minutes')
  })
})

describe('t() terminology resolution', () => {
  const term = { decision: 'resolution', decisions: 'Resolutions' }

  it('leaves built-in English untouched without terminology', () => {
    expect(t('nav.decisions', 'en')).toBe('Resolutions')
    expect(t('page.home.stats.decisions', 'en')).toBe('Decisions on record')
  })

  it('maps pure label keys onto the terminology', () => {
    expect(t('section.adoptedDecisions', 'en', undefined, term)).toBe('Resolutions')
    expect(t('about.stats.decisions', 'en', undefined, term)).toBe('Resolutions')
  })

  it('substitutes decision words inside sentences', () => {
    expect(t('page.home.stats.decisions', 'en', undefined, term)).toBe('Resolutions on record')
    expect(t('page.home.latestDecisions', 'en', undefined, term)).toBe('Latest Resolutions')
    expect(t('decisions.empty', 'en', undefined, term)).toBe('No resolutions.')
    expect(t('search.ariaLabel', 'en', undefined, term)).toBe('Search resolutions')
  })

  it('keeps the built-in wording when the term is the default one', () => {
    // 'nav.decisions' is 'Resolutions' by design; a consumer who did not
    // rename the record must not get 'Decisions'.
    expect(t('nav.decisions', 'en', undefined, DEFAULT_TERMINOLOGY)).toBe('Resolutions')
    expect(t('nav.decisions', 'en', undefined, { meetings: 'Sessions' })).toBe('Resolutions')
  })

  it('renames nav.decisions when the consumer renamed the record', () => {
    expect(t('nav.decisions', 'en', undefined, { decisions: 'Acts' })).toBe('Acts')
    expect(t('nav.meetings', 'en', undefined, { meetings: 'Sessions' })).toBe('Sessions')
    expect(t('label.meeting', 'en', undefined, { meeting: 'session' })).toBe('Session')
  })

  it('uiStrings win over terminology', () => {
    const uiStrings = { eng: { 'nav.decisions': 'Beschlüsse' } }
    expect(t('nav.decisions', 'en', uiStrings, term)).toBe('Beschlüsse')
  })

  it('non-English locales keep their built-ins', () => {
    expect(t('nav.decisions', 'fr', undefined, term)).toBe('Résolutions')
    expect(t('page.home.stats.decisions', 'fr', undefined, term)).toBe('Décisions enregistrées')
  })

  it('applies terminology on the English fallback for unknown locales', () => {
    expect(t('page.home.latestDecisions', 'de', undefined, term)).toBe('Latest Resolutions')
  })
})
