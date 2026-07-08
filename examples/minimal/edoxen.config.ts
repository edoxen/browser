import { defineConfig } from '@edoxen/browser/config'

export default defineConfig({
  site: {
    title: 'Example Committee',
    description: 'A minimal @edoxen/browser site — one language, decisions only.',
    url: 'https://example.org',
  },
  data: {
    decisions: './data/decisions',
    meetings: './data/meetings',
  },
  features: {
    search: true,
    timeline: true,
    urnCopy: true,
    doi: false,
    darkMode: true,
    printStyles: true,
  },
})
