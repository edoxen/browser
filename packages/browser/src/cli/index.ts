#!/usr/bin/env node
import { parseArgs } from 'node:util'
import { existsSync } from 'node:fs'
import { resolve, extname } from 'node:path'
import { pathToFileURL } from 'node:url'

import { EdoxenConfigSchema } from '../config/index.js'
import { loadAll, validateAll, lintProject, buildProjectFromLoaded } from '../data/index.js'
import { EdoxenBrowserError } from '../errors.js'

const HELP = `edoxen-browser — CLI for the @edoxen/browser package

Usage:
  edoxen-browser <command> [options]

Commands:
  validate       Validate the data + config without building.
  lint           Run structural lint (duplicate URNs, broken relations).
  check          validate + lint in one shot.
  config         Print the resolved config as JSON.
  build          Run astro build (thin wrapper).
  help           Show this help.

Options:
  --config <path>   Path to edoxen.config.ts (default: ./edoxen.config.ts)
  --cwd <path>      Working directory (default: process.cwd())
  --strict          Treat warnings as errors (lint only).
  -h, --help        Show this help.
`

interface ParsedArgs {
  command: string
  configPath: string
  cwd: string
  strict: boolean
}

function parseCliArgs(argv: string[]): ParsedArgs {
  const [command, ...rest] = argv.slice(2)
  const { values } = parseArgs({
    args: rest,
    options: {
      config: { type: 'string', default: './edoxen.config.ts' },
      cwd: { type: 'string', default: process.cwd() },
      strict: { type: 'boolean', default: false },
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

async function runBuild(args: ParsedArgs): Promise<void> {
  await runValidate(args)
  const { spawnSync } = await import('node:child_process')
  const result = spawnSync('astro', ['build'], { stdio: 'inherit', cwd: args.cwd })
  if (result.status !== 0) {
    throw new EdoxenBrowserError('build', `astro build exited with status ${result.status ?? 'null'}`)
  }
}

async function main(): Promise<void> {
  const args = parseCliArgs(process.argv)
  switch (args.command) {
    case 'validate': return await runValidate(args)
    case 'lint': return await runLint(args)
    case 'check': return await runCheck(args)
    case 'config': return await runConfig(args)
    case 'build': return await runBuild(args)
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
