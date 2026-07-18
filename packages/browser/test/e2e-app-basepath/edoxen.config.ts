import { fileURLToPath } from 'node:url'
import { defineConfig } from '@edoxen/browser/config'

// E2E fixture app, basePath variant — same data as e2e-app but served
// under /resolutions/ to regression-test basePath-aware links.
const fixture = (p: string): string => fileURLToPath(new URL(`../fixtures/${p}`, import.meta.url))

export default defineConfig({
  site: {
    title: 'E2E Basepath Site',
    description: 'Fixture site served under a sub-path.',
    url: 'http://localhost:4802',
    basePath: '/resolutions/',
  },
  data: {
    decisions: fixture('decisions/sample.yaml'),
    meetings: fixture('meetings/with-refs-meeting.yaml'),
    contacts: fixture('registers/contacts.yaml'),
    venues: fixture('registers/venues.yaml'),
    bodies: fixture('registers/bodies.yaml'),
  },
})
