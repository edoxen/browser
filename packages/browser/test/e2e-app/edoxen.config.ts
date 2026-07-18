import { fileURLToPath } from 'node:url'
import { defineConfig } from '@edoxen/browser/config'

// E2E fixture app (integration mode). Data paths are absolute so the
// site builds identically no matter where astro is invoked from.
const fixture = (p: string): string => fileURLToPath(new URL(`../fixtures/${p}`, import.meta.url))

export default defineConfig({
  site: {
    title: 'E2E Fixture Site',
    description: 'Fixture site for the @edoxen/browser e2e suite.',
    url: 'http://localhost:4801',
  },
  data: {
    decisions: fixture('decisions/sample.yaml'),
    meetings: fixture('meetings/with-refs-meeting.yaml'),
    contacts: fixture('registers/contacts.yaml'),
    venues: fixture('registers/venues.yaml'),
    bodies: fixture('registers/bodies.yaml'),
  },
})
