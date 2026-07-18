import { defineConfig } from '@edoxen/browser/config'

// Showcase standalone site — exercises the full theming surface of
// @edoxen/browser: explicit theme colors (light + dark), radius, logos,
// nav, social, bodies with brand colors, and feature flags.
//
// The companion piece is src/styles/override.css, picked up by
// convention: a webfont, token overrides, and a custom rule loaded
// after the package's base stylesheet.
export default defineConfig({
  site: {
    title: 'Aurora Committee',
    description:
      'Standalone showcase: the whole site is driven by this config, data/, ' +
      'and src/styles/override.css — no astro.config required.',
    url: 'https://example.org',
  },
  data: {
    decisions: './data/decisions',
    meetings: './data/meetings',
    contacts: './data/registers/contacts.yaml',
    venues: './data/registers/venues.yaml',
    bodies: './data/registers/bodies.yaml',
  },
  theme: {
    // Warm sienna re-theme over the package defaults (deep warm teal).
    primary: '#1c1917',
    accent: '#9a3412',
    surface: '#ffffff',
    background: '#faf7f2',
    text: '#292524',
    muted: '#78716c',
    border: '#e8e2d9',
    dark: {
      primary: '#f5f5f4',
      accent: '#fdba74',
      surface: '#292524',
      background: '#1c1917',
      text: '#e7e5e4',
      muted: '#a8a29e',
      border: '#44403c',
    },
    radius: '0.625rem',
    logos: {
      primary: '/logo.svg',
      favicon: '/logo.svg',
    },
  },
  nav: [
    { label: 'Decisions', href: '/decisions' },
    { label: 'Meetings', href: '/meetings' },
    { label: 'About', href: '/about' },
  ],
  social: [
    { label: 'GitHub', href: 'https://github.com/edoxen', icon: 'github' },
    { label: 'Website', href: 'https://example.org', icon: 'website' },
  ],
  bodies: [
    { code: 'committee', name: 'Committee', color: '#9a3412', textColor: '#ffffff' },
    { code: 'secretariat', name: 'Secretariat', color: '#0f766e', textColor: '#ffffff' },
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
