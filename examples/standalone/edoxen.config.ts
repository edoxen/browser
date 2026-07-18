import { defineConfig } from '@edoxen/browser/config'

export default defineConfig({
  site: {
    title: 'Standalone Example',
    description: 'Standalone mode: the whole site is driven by this config + data/.',
    url: 'https://example.org',
  },
  data: {
    decisions: './data/decisions',
    meetings: './data/meetings',
    contacts: './data/registers/contacts.yaml',
    venues: './data/registers/venues.yaml',
    bodies: './data/registers/bodies.yaml',
  },
  features: {
    search: true,
    timeline: true,
    urnCopy: true,
  },
})
