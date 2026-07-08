import { defineConfig } from '@edoxen/browser/config'

export default defineConfig({
  site: {
    title: 'Multi-Body Example',
    description: 'Multi-body @edoxen/browser example with CIML + Conference + DC.',
    url: 'https://example.org',
  },
  data: {
    decisions: './data/decisions',
    meetings: './data/meetings',
  },
  bodies: [
    { code: 'ciml', name: 'CIML', color: '#1e40af', textColor: '#ffffff' },
    { code: 'conference', name: 'Conference', color: '#7c2d12', textColor: '#ffffff' },
    { code: 'dc', name: 'DC', color: '#065f46', textColor: '#ffffff' },
  ],
  features: {
    search: true,
    timeline: true,
    urnCopy: true,
    doi: false,
    darkMode: true,
    printStyles: true,
  },
})
