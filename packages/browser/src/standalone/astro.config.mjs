// Standalone Astro root for @edoxen/browser.
//
// This config powers the zero-astro.config consumption mode: the
// edoxen-browser CLI points Astro at this directory and bridges the
// consumer's resolved edoxen.config.ts through environment variables:
//
//   EDOXEN_CONFIG_JSON   JSON-stringified, fully-resolved EdoxenConfig
//                        (data paths already absolute)
//   EDOXEN_OUT_DIR       Absolute output directory (consumer cwd + output.dir)
//   EDOXEN_PUBLIC_DIR    Optional consumer public/ directory
//
// Routes come entirely from the integration's route injection, so this
// root needs no src/pages of its own.
import { defineConfig } from 'astro/config'
import sitemap from '@astrojs/sitemap'
import { existsSync } from 'node:fs'
import browser from '@edoxen/browser/integration'

const raw = process.env.EDOXEN_CONFIG_JSON
if (!raw) {
  throw new Error(
    '[edoxen:config] EDOXEN_CONFIG_JSON is not set — run this root through `edoxen-browser build` (or dev/preview)',
  )
}
const cfg = JSON.parse(raw)

const outDir = process.env.EDOXEN_OUT_DIR
const publicDir = process.env.EDOXEN_PUBLIC_DIR

// The prerender/ssr server chunks are written under the CONSUMER's
// outDir, so bare imports must be bundled in — Node would not resolve
// the package's own runtime deps from there. 'zod/v4' is listed
// explicitly: Astro's runtime imports it by that exact specifier and
// the externalizer matches strings exactly.
const BUNDLE_DEPS = ['@edoxen/browser', '@edoxen/edoxen', '@asciidoctor/core', 'zod', 'zod/v4', 'yaml']

// Set noExternal via the configEnvironment plugin hook rather than the
// vite.environments config key: Astro resolves the Vite config once per
// environment builder, and its own build config shallow-replaces
// environments.prerender — dropping user config in later resolutions.
// Plugin configEnvironment hooks run in every resolution (this is how
// @astro/plugin-build-internals' own noExternal values survive too).
function bundleRuntimeDepsPlugin() {
  return {
    name: 'edoxen:bundle-runtime-deps',
    configEnvironment(environmentName) {
      if (environmentName === 'prerender' || environmentName === 'ssr') {
        return {
          resolve: {
            noExternal: [...BUNDLE_DEPS],
          },
        }
      }
    },
  }
}

export default defineConfig({
  site: cfg.site.url,
  base: cfg.site.basePath === '/' ? undefined : cfg.site.basePath,
  ...(outDir ? { outDir } : {}),
  ...(publicDir && existsSync(publicDir) ? { publicDir } : {}),
  integrations: [browser({ config: cfg }), sitemap()],
  vite: {
    plugins: [bundleRuntimeDepsPlugin()],
  },
})
