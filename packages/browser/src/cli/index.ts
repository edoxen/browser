#!/usr/bin/env node
import { parseArgs } from 'node:util'
import { existsSync } from 'node:fs'
import { resolve, extname } from 'node:path'
import { pathToFileURL, fileURLToPath } from 'node:url'

import { EdoxenConfigSchema } from '../config/index.js'
import { loadAll, validateAll, lintProject, buildProjectFromLoaded } from '../data/index.js'
import { EdoxenBrowserError, formatValidationErrors } from '../errors.js'

const HELP = `edoxen-browser — CLI for the @edoxen/browser package

Usage:
  edoxen-browser <command> [options]

Commands:
  validate       Validate the data + config without building.
  lint           Run structural lint (duplicate URNs, broken relations).
  check          validate + lint in one shot.
  config         Print the resolved config as JSON.
  build          Build the static site.
  dev            Start the Astro dev server.
  preview        Preview the built site.

  build/dev/preview run in two modes:
    - If the working directory has an astro.config.*, the bare astro CLI
      is spawned there (integration mode, unchanged behaviour).
    - Otherwise the package's bundled standalone Astro root is used and
      the resolved edoxen.config.ts is bridged in via environment
      variables — no consumer astro.config or src/ needed.
  help           Show this help.

Options:
  --config <path>   Path to edoxen.config.ts (default: ./edoxen.config.ts)
  --cwd <path>      Working directory (default: process.cwd())
  --strict          Treat warnings as errors (lint only).
  --port <n>        Port for dev/preview (default: 4321).
  --host [addr]     Expose dev/preview server on the network.
  -h, --help        Show this help.
`

interface ParsedArgs {
  command: string
  configPath: string
  cwd: string
  strict: boolean
  port: number
  host: string | boolean
}

function parseCliArgs(argv: string[]): ParsedArgs {
  const [command, ...rest] = argv.slice(2)
  const { values } = parseArgs({
    args: rest,
    options: {
      config: { type: 'string', default: './edoxen.config.ts' },
      cwd: { type: 'string', default: process.cwd() },
      strict: { type: 'boolean', default: false },
      port: { type: 'string', default: '4321' },
      host: { type: 'string' },
      help: { type: 'boolean', short: 'h', default: false },
    },
    allowPositionals: true,
  })
  if (values.help || !command || command === 'help') {
    process.stdout.write(HELP)
    process.exit(0)
  }
  return {
    command,
    configPath: String(values.config),
    cwd: String(values.cwd),
    strict: Boolean(values.strict),
    port: Number(values.port) || 4321,
    host: typeof values.host === 'string' ? values.host : Boolean(values.host),
  }
}

async function loadConfigFile(configPath: string, cwd: string): Promise<unknown> {
  const absolute = resolve(cwd, configPath)
  if (!existsSync(absolute)) {
    throw new EdoxenBrowserError('config', `Config file not found: ${absolute}`, [])
  }
  const ext = extname(absolute)
  if (ext === '.ts' || ext === '.tsx' || ext === '.mts') {
    const { createJiti } = await import('jiti')
    const jiti = createJiti(import.meta.url, { interopDefault: true })
    const mod = (await jiti.import(absolute)) as { default?: unknown }
    return mod.default
  }
  const url = pathToFileURL(absolute).href
  const mod = (await import(url)) as { default?: unknown }
  if (!mod.default) {
    throw new EdoxenBrowserError('config', `Config file ${absolute} does not export a default config`, [])
  }
  return mod.default
}

async function loadValidatedConfig(args: ParsedArgs) {
  const raw = await loadConfigFile(args.configPath, args.cwd)
  const parseResult = EdoxenConfigSchema.safeParse(raw)
  if (!parseResult.success) {
    throw new EdoxenBrowserError(
      'config',
      'edoxen.config.ts failed schema validation',
      parseResult.error.issues.map((i) => `${i.path.join('.') || '<root>'}: ${i.message}`),
    )
  }
  const cfg = parseResult.data
  return {
    ...cfg,
    data: {
      decisions: resolve(args.cwd, cfg.data.decisions),
      ...(cfg.data.meetings ? { meetings: resolve(args.cwd, cfg.data.meetings) } : {}),
      ...(cfg.data.contacts ? { contacts: resolve(args.cwd, cfg.data.contacts) } : {}),
      ...(cfg.data.venues ? { venues: resolve(args.cwd, cfg.data.venues) } : {}),
      ...(cfg.data.bodies ? { bodies: resolve(args.cwd, cfg.data.bodies) } : {}),
      ...(cfg.data.agendas ? { agendas: resolve(args.cwd, cfg.data.agendas) } : {}),
      ...(cfg.data.minutes ? { minutes: resolve(args.cwd, cfg.data.minutes) } : {}),
      ...(cfg.data.committee ? { committee: resolve(args.cwd, cfg.data.committee) } : {}),
    },
  }
}

async function runValidate(args: ParsedArgs): Promise<void> {
  const cfg = await loadValidatedConfig(args)
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
    if (report.decisions) details.push(...report.decisions.errors.map((e) => e.message))
    if (report.meetings) details.push(...report.meetings.errors.map((e) => e.message))
    if (report.registers) details.push(...report.registers.errors.map((e) => e.message))
    throw new EdoxenBrowserError('validate', 'Schema validation failed', details)
  }
  process.stdout.write(`OK — schema validation passed for ${cfg.data.decisions}\n`)
}

async function runLint(args: ParsedArgs): Promise<void> {
  const cfg = await loadValidatedConfig(args)
  const loaded = await loadAll(cfg.data)
  if (!loaded.ok) {
    throw new EdoxenBrowserError(
      'load',
      'Failed to load data',
      loaded.error.map((e) => `${e.source}: ${e.cause.message}`),
    )
  }
  const project = buildProjectFromLoaded(loaded.value)
  const report = lintProject(project)
  if (report.findings.length === 0) {
    process.stdout.write('OK — no lint findings\n')
    return
  }
  for (const finding of report.findings) {
    const prefix = finding.severity === 'error' ? 'ERROR' : 'WARN'
    process.stdout.write(`${prefix} [${finding.code}] ${finding.message}\n`)
  }
  const hasErrors = args.strict
    ? report.findings.length > 0
    : report.findings.some((f) => f.severity === 'error')
  if (hasErrors) {
    throw new EdoxenBrowserError('lint', `Lint reported ${report.findings.length} finding(s)`)
  }
}

async function runCheck(args: ParsedArgs): Promise<void> {
  await runValidate(args)
  await runLint(args)
}

async function runConfig(args: ParsedArgs): Promise<void> {
  const cfg = await loadValidatedConfig(args)
  process.stdout.write(`${JSON.stringify(cfg, null, 2)}\n`)
}

const ASTRO_CONFIG_NAMES = [
  'astro.config.ts',
  'astro.config.mts',
  'astro.config.cts',
  'astro.config.mjs',
  'astro.config.js',
  'astro.config.cjs',
] as const

function consumerAstroConfig(cwd: string): string | null {
  for (const name of ASTRO_CONFIG_NAMES) {
    const candidate = resolve(cwd, name)
    if (existsSync(candidate)) return candidate
  }
  return null
}

// The bundled standalone Astro root. Lives in src/standalone/ both in the
// repo and in the published package (which ships src/); dist/cli.js sits
// one directory deeper, so probe both relative locations.
function standaloneRoot(): string {
  const candidates = [
    fileURLToPath(new URL('../standalone/', import.meta.url)),
    fileURLToPath(new URL('../src/standalone/', import.meta.url)),
  ]
  for (const dir of candidates) {
    if (existsSync(resolve(dir, 'astro.config.mjs'))) return dir
  }
  throw new EdoxenBrowserError('build', 'Bundled standalone Astro root not found', candidates)
}

// Load the config and data the way the integration does: hard-fail on
// unreadable data, warn (don't throw) on schema validation errors — the
// Ruby edoxen gem is the canonical validator and the JS schema may lag.
async function loadForSite(args: ParsedArgs) {
  const cfg = await loadValidatedConfig(args)
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
    process.stderr.write(`WARN — schema validation produced ${details.length} warning(s); proceeding anyway\n`)
    details.slice(0, 5).forEach((d) => process.stderr.write(`  ${d}\n`))
  }
  return cfg
}

type SiteCommand = 'build' | 'dev' | 'preview'

async function runSiteCommand(args: ParsedArgs, command: SiteCommand): Promise<void> {
  if (consumerAstroConfig(args.cwd)) {
    // Integration mode: the consumer's own astro.config drives Astro.
    const { spawnSync } = await import('node:child_process')
    const passthrough: string[] = [command]
    if (command !== 'build') {
      passthrough.push('--port', String(args.port))
      if (args.host) passthrough.push('--host', String(args.host))
    }
    const result = spawnSync('astro', passthrough, { stdio: 'inherit', cwd: args.cwd })
    if (result.status !== 0) {
      throw new EdoxenBrowserError('build', `astro ${command} exited with status ${result.status ?? 'null'}`)
    }
    return
  }

  // Standalone mode: run Astro programmatically against the bundled root,
  // bridging the resolved consumer config via environment variables.
  const cfg = await loadForSite(args)
  process.env.EDOXEN_CONFIG_JSON = JSON.stringify(cfg)
  process.env.EDOXEN_OUT_DIR = resolve(args.cwd, cfg.output.dir)
  process.env.EDOXEN_PUBLIC_DIR = resolve(args.cwd, 'public')

  const root = standaloneRoot()
  const astro = await import('astro')
  if (command === 'build') {
    await astro.build({ root })
    return
  }
  if (command === 'dev') {
    await astro.dev({ root, server: { port: args.port, ...(args.host ? { host: args.host } : {}) } })
    return
  }
  await astro.preview({ root, server: { port: args.port, ...(args.host ? { host: args.host } : {}) } })
}

async function runBuild(args: ParsedArgs): Promise<void> {
  await runSiteCommand(args, 'build')
}

async function runDev(args: ParsedArgs): Promise<void> {
  await runSiteCommand(args, 'dev')
}

async function runPreview(args: ParsedArgs): Promise<void> {
  await runSiteCommand(args, 'preview')
}

async function main(): Promise<void> {
  const args = parseCliArgs(process.argv)
  switch (args.command) {
    case 'validate': return await runValidate(args)
    case 'lint': return await runLint(args)
    case 'check': return await runCheck(args)
    case 'config': return await runConfig(args)
    case 'build': return await runBuild(args)
    case 'dev': return await runDev(args)
    case 'preview': return await runPreview(args)
    default:
      process.stderr.write(`Unknown command: ${args.command}\n\n${HELP}`)
      process.exit(1)
  }
}

main().catch((e: unknown) => {
  if (e instanceof EdoxenBrowserError) {
    process.stderr.write(`${e.toString()}\n`)
    process.exit(1)
  }
  process.stderr.write(`Unexpected error: ${e instanceof Error ? e.stack : String(e)}\n`)
  process.exit(1)
})

export const _cliExtAccept = extname
