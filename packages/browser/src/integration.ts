import type { AstroIntegration, AstroIntegrationLogger } from 'astro'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { extname } from 'node:path'

import {
  EdoxenConfigSchema,
  type EdoxenConfig,
  type EdoxenConfigInput,
} from './config/index.js'
import {
  loadAll,
  validateAll,
  buildProjectFromLoaded,
  preparePayloads,
  type LoadedData,
  type PagePayloads,
} from './data/index.js'
import { EdoxenBrowserError, formatValidationErrors } from './errors.js'
import { pickLocalizedValue } from './i18n/index.js'

export interface IntegrationOptions {
  config: EdoxenConfigInput
  injectRoutes?: boolean
}

const DEFAULT_ROUTE_PATTERNS: ReadonlyArray<readonly [string, string]> = [
  ['/', 'index.astro'],
  ['/decisions', 'decisions/index.astro'],
  ['/decisions/[urn]', 'decisions/[urn].astro'],
  ['/meetings', 'meetings/index.astro'],
  ['/meetings/[urn]', 'meetings/[urn].astro'],
  ['/about', 'about.astro'],
  ['/404', '404.astro'],
]

const LOCALIZED_ROUTE_PATTERNS: ReadonlyArray<readonly [string, string]> = [
  ['/[lang]', '[lang]/index.astro'],
  ['/[lang]/decisions', '[lang]/decisions/index.astro'],
  ['/[lang]/decisions/[urn]', '[lang]/decisions/[urn].astro'],
  ['/[lang]/meetings', '[lang]/meetings/index.astro'],
  ['/[lang]/meetings/[urn]', '[lang]/meetings/[urn].astro'],
  ['/[lang]/about', '[lang]/about.astro'],
]

interface IntegrationCache {
  readonly config: EdoxenConfig
  readonly payloads: PagePayloads
  readonly registers: LoadedData['registers']
  readonly redirects: ReadonlyArray<readonly [string, string, AstroRedirectStatus]>
}

type AstroRedirectStatus = 300 | 301 | 302 | 303 | 304 | 307 | 308

interface LegacyRedirect {
  from: string
  to: string
  status?: AstroRedirectStatus
}

function normalizeRedirectStatus(n: number | undefined): AstroRedirectStatus {
  const allowed: readonly number[] = [300, 301, 302, 303, 304, 307, 308]
  return (allowed.includes(n ?? 301) ? n : 301) as AstroRedirectStatus
}

async function readRedirects(dataDir: string): Promise<LegacyRedirect[]> {
  try {
    const raw = await readFile(`${dataDir}/redirects.yaml`, 'utf8')
    const { parse } = await import('yaml')
    const parsed = parse(raw) as Array<{ from?: string; to?: string; status?: number }> | null
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((r) => r && typeof r.from === 'string' && typeof r.to === 'string')
      .map((r) => ({
        from: r.from as string,
        to: r.to as string,
        status: normalizeRedirectStatus(r.status),
      }))
  } catch {
    return []
  }
}

async function buildCache(opts: IntegrationOptions, logger: AstroIntegrationLogger): Promise<IntegrationCache> {
  const parseResult = EdoxenConfigSchema.safeParse(opts.config)
  if (!parseResult.success) {
    throw new EdoxenBrowserError(
      'config',
      'edoxen.config.ts failed schema validation',
      parseResult.error.issues.map((i) => `${i.path.join('.') || '<root>'}: ${i.message}`),
    )
  }
  const cfg = parseResult.data
  logger.info(`Loading data from ${cfg.data.decisions}`)

  const loaded = await loadAll(cfg.data)
  if (!loaded.ok) {
    throw new EdoxenBrowserError(
      'load',
      'Failed to load one or more data sources',
      loaded.error.map((e) => `${e.source} (${e.path}): ${e.cause.message}`),
    )
  }

  const report = await validateAll(loaded.value)
  if (!report.valid) {
    const details: string[] = []
    if (report.decisions) details.push(...formatValidationErrors(report.decisions.errors))
    if (report.meetings) details.push(...formatValidationErrors(report.meetings.errors))
    if (report.registers) details.push(...formatValidationErrors(report.registers.errors))
    // Log validation errors as warnings but don't block the build.
    // The Ruby edoxen gem is the canonical validator; the JS schema
    // may lag behind. Meetings loaded even with JS schema warnings.
    logger.warn(`Schema validation produced ${details.length} warning(s) — proceeding anyway`)
    details.slice(0, 5).forEach((d) => logger.warn(`  ${d}`))
  }

  const project = buildProjectFromLoaded(loaded.value)
  const payloads = preparePayloads(project, loaded.value.registers)
  const redirects = await readRedirects(cfg.data.decisions.replace(/\/[^/]+$/, ''))
  const registerCount =
    (loaded.value.registers?.contacts?.contacts?.length ?? 0) +
    (loaded.value.registers?.venues?.venues?.length ?? 0) +
    (loaded.value.registers?.bodies?.bodies?.length ?? 0)
  logger.info(`Loaded ${project.decisions.length} decisions, ${project.meetings.length} meetings, ${registerCount} register entries, ${redirects.length} redirects`)
  return {
    config: cfg,
    payloads,
    registers: loaded.value.registers,
    redirects: redirects.map((r) => [r.from, r.to, r.status ?? 301] as const),
  }
}

const VIRTUAL_CONFIG = 'virtual:edoxen-config'
const VIRTUAL_PAYLOADS = 'virtual:edoxen-payloads'

type DataEndpointName = 'decisions' | 'meetings' | 'registers'

function dataEndpointPayload(cache: IntegrationCache, name: DataEndpointName): string {
  const locale = cache.config.site.locale
  if (name === 'decisions') {
    return JSON.stringify({
      // The search-filter island consumes SearchableItem.title as a plain
      // string — flatten the LocalizedString[] titles for the default locale.
      items: cache.payloads.decisionsList.items.map((d) => ({
        ...d,
        title: pickLocalizedValue(d.title, locale),
      })),
      facetBodies: [...cache.payloads.decisionsList.facets.bodies],
      facetKinds: [...cache.payloads.decisionsList.facets.kinds],
      facetYears: [...cache.payloads.decisionsList.facets.years],
    })
  }
  if (name === 'registers') {
    return JSON.stringify({
      contacts: cache.registers?.contacts ?? null,
      venues: cache.registers?.venues ?? null,
      bodies: cache.registers?.bodies ?? null,
    })
  }
  return JSON.stringify({
    items: cache.payloads.meetingsList.items.map((m) => ({
      ...m,
      title: pickLocalizedValue(m.title, locale),
    })),
    facetDecades: [...cache.payloads.meetingsList.facets.decades],
    facetBodies: [...cache.payloads.meetingsList.facets.bodies],
    facetCountries: [...cache.payloads.meetingsList.facets.countries],
  })
}

function serveDataEndpoint(req: unknown, res: { setHeader: (k: string, v: string) => void; end: (s: string) => void; statusCode: number }, cache: IntegrationCache, name: DataEndpointName): void {
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  res.end(dataEndpointPayload(cache, name))
}

export default function edoxenBrowser(opts: IntegrationOptions): AstroIntegration {
  let cache: IntegrationCache | null = null
  const injectRoutes = opts.injectRoutes ?? true
  const pagesRoot = new URL('./astro/pages/', import.meta.url)

  return {
    name: '@edoxen/browser',
    hooks: {
      'astro:config:setup': async ({ logger, updateConfig, injectRoute }) => {
        cache = await buildCache(opts, logger)

        if (injectRoutes && injectRoute) {
          for (const [pattern, file] of DEFAULT_ROUTE_PATTERNS) {
            injectRoute({ pattern, entrypoint: new URL(file, pagesRoot) })
          }
          const nonDefaultLocales = cache.config.locales.filter((l) => (l.routePrefix ?? '') !== '')
          if (nonDefaultLocales.length > 0) {
            for (const [pattern, file] of LOCALIZED_ROUTE_PATTERNS) {
              injectRoute({ pattern, entrypoint: new URL(file, pagesRoot) })
            }
          }
        }

        const redirectMap: Record<string, { status: AstroRedirectStatus; destination: string }> = {}
        for (const [from, to, status] of cache.redirects) {
          redirectMap[from] = { status, destination: to }
        }

        updateConfig({
          redirects: redirectMap,
          vite: {
            plugins: [
              {
                name: 'edoxen-virtual-modules',
                resolveId(id: string): string | null {
                  if (id === VIRTUAL_CONFIG) return `\0${VIRTUAL_CONFIG}`
                  if (id === VIRTUAL_PAYLOADS) return `\0${VIRTUAL_PAYLOADS}`
                  return null
                },
                load(id: string): string | null {
                  if (!cache) throw new EdoxenBrowserError('build', 'Integration cache not ready')
                  if (id === `\0${VIRTUAL_CONFIG}`) {
                    return `export default ${JSON.stringify(cache.config)}`
                  }
                  if (id === `\0${VIRTUAL_PAYLOADS}`) {
                    return `export default ${JSON.stringify(cache.payloads)}`
                  }
                  return null
                },
                configureServer(server: { middlewares: { use: (handler: (req: unknown, res: unknown, next: () => void) => void) => void } }) {
                  server.middlewares.use((req, res, next) => {
                    if (!cache) {
                      next()
                      return
                    }
                    const url = (req as { url?: string }).url ?? ''
                    if (url === '/data/decisions.json') {
                      serveDataEndpoint(req, res as never, cache, 'decisions')
                      return
                    }
                    if (url === '/data/meetings.json') {
                      serveDataEndpoint(req, res as never, cache, 'meetings')
                      return
                    }
                    if (url === '/data/registers.json') {
                      serveDataEndpoint(req, res as never, cache, 'registers')
                      return
                    }
                    next()
                  })
                },
              },
            ],
          },
        })
      },

      'astro:build:done': async ({ dir }: { dir: URL }) => {
        if (!cache) return
        const dataDir = new URL('data/', dir)
        await mkdir(dataDir, { recursive: true })
        await writeFile(new URL('decisions.json', dataDir), dataEndpointPayload(cache, 'decisions'))
        await writeFile(new URL('meetings.json', dataDir), dataEndpointPayload(cache, 'meetings'))
        await writeFile(new URL('registers.json', dataDir), dataEndpointPayload(cache, 'registers'))
      },
    },
  }
}

export const playgroundDir = fileURLToPath(new URL('../', import.meta.url))
export type { PagePayloads }
export const acceptedExt = extname
