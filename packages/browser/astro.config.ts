import { defineConfig } from 'astro/config'
import sitemap from '@astrojs/sitemap'
import { fileURLToPath } from 'node:url'
import browser from './src/integration.ts'

const here = fileURLToPath(new URL('.', import.meta.url))
const fixtures = `${here}test/fixtures`

export default defineConfig({
  site: 'http://localhost:4321',
  srcDir: './src/astro',
  outDir: './dist-playground',
  trailingSlash: 'ignore',
  integrations: [
    browser({
      config: {
        site: {
          title: '@edoxen/browser playground',
          description: 'Dev playground for the @edoxen/browser package.',
          url: 'http://localhost:4321',
        },
        data: {
          decisions: `${fixtures}/decisions`,
          meetings: `${fixtures}/meetings`,
        },
        features: {
          search: true,
          timeline: true,
          urnCopy: true,
          doi: false,
          darkMode: true,
          printStyles: true,
        },
      },
      injectRoutes: false,
    }),
    sitemap(),
  ],
})
