import { fileURLToPath } from 'node:url'
import { defineConfig } from '@edoxen/browser/config'

// E2E fixture app, terminology/slug/flags variant — same data as
// e2e-app but with the records renamed to "Resolutions", served from
// /resolutions, and the search feature switched off.
const fixture = (p: string): string => fileURLToPath(new URL(`../fixtures/${p}`, import.meta.url))

export default defineConfig({
  site: {
    title: 'E2E Custom Site',
    description: 'Fixture site exercising terminology, decisionsSlug and feature flags.',
    url: 'http://localhost:4804',
  },
  data: {
    decisions: fixture('decisions/sample.yaml'),
    meetings: fixture('meetings/with-refs-meeting.yaml'),
    contacts: fixture('registers/contacts.yaml'),
    venues: fixture('registers/venues.yaml'),
    bodies: fixture('registers/bodies.yaml'),
  },
  terminology: {
    decision: 'resolution',
    decisions: 'Resolutions',
  },
  decisionsSlug: 'resolutions',
  features: {
    search: false,
  },
})
