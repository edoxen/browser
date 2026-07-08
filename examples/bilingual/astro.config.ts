import { defineConfig } from 'astro/config'
import sitemap from '@astrojs/sitemap'
import browser from '@edoxen/browser/integration'
import cfg from './edoxen.config'

export default defineConfig({
  site: cfg.site.url,
  integrations: [browser({ config: cfg }), sitemap()],
})
