import { describe, expect, it } from 'vitest'

import { EdoxenConfigSchema } from './schema.js'

const baseConfig = {
  site: { title: 'X', url: 'https://x.org' },
  data: { decisions: './data/decisions' },
}

describe('components config', () => {
  it('defaults to the full current-order lists (backwards compatible)', () => {
    const cfg = EdoxenConfigSchema.parse(baseConfig)
    expect(cfg.components.meetingCard.metaItems).toEqual([
      'date', 'type', 'status', 'committee', 'count',
    ])
    expect(cfg.components.meetingDetail.sections).toEqual([
      'when', 'committee', 'venue', 'officers', 'hosts',
      'schedule', 'deadlines', 'agenda', 'decisions',
      'declarations', 'minutes', 'sourceDocs', 'note',
    ])
    expect(cfg.components.decisionDetail.sections).toEqual([
      'considering', 'actions', 'considerations', 'approvals',
      'related', 'categories', 'dates', 'referenceDocs',
    ])
  })

  it('accepts a partial override that replaces the default list wholesale', () => {
    const cfg = EdoxenConfigSchema.parse({
      ...baseConfig,
      components: {
        meetingCard: { metaItems: ['date', 'committee'] },
      },
    })
    // Partial at the meetingCard level replaces metaItems; other defaults hold.
    expect(cfg.components.meetingCard.metaItems).toEqual(['date', 'committee'])
    expect(cfg.components.meetingDetail.sections).toHaveLength(13)
  })

  it('rejects unknown meta item values (typo guard)', () => {
    expect(() => EdoxenConfigSchema.parse({
      ...baseConfig,
      components: { meetingCard: { metaItems: ['date', 'typo'] } },
    })).toThrow()
  })

  it('rejects unknown meeting-detail section values', () => {
    expect(() => EdoxenConfigSchema.parse({
      ...baseConfig,
      components: { meetingDetail: { sections: ['when', 'unknown'] } },
    })).toThrow()
  })

  it('rejects unknown decision-detail section values', () => {
    expect(() => EdoxenConfigSchema.parse({
      ...baseConfig,
      components: { decisionDetail: { sections: ['actions', 'made-up'] } },
    })).toThrow()
  })

  it('allows empty lists (consumer hides every meta item / section)', () => {
    const cfg = EdoxenConfigSchema.parse({
      ...baseConfig,
      components: {
        meetingCard: { metaItems: [] },
        meetingDetail: { sections: [] },
        decisionDetail: { sections: [] },
      },
    })
    expect(cfg.components.meetingCard.metaItems).toEqual([])
    expect(cfg.components.meetingDetail.sections).toEqual([])
    expect(cfg.components.decisionDetail.sections).toEqual([])
  })
})
