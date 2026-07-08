import { defineConfig } from '@edoxen/browser/config'

export default defineConfig({
  site: {
    title: 'Comité bilingue / Bilingual Committee',
    description: 'Bilingual EN/FR @edoxen/browser example.',
    url: 'https://example.org',
    locale: 'en',
  },
  data: {
    decisions: './data/decisions',
    meetings: './data/meetings',
  },
  locales: [
    { code: 'en', label: 'English', routePrefix: '' },
    { code: 'fr', label: 'Français', routePrefix: '/fr' },
  ],
  features: {
    search: true,
    timeline: true,
    urnCopy: true,
    doi: true,
    darkMode: true,
    printStyles: true,
  },
})
