import { expect, test } from '@playwright/test'
import { spawn, spawnSync, type ChildProcess } from 'node:child_process'
import { cp, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// Standalone mode end-to-end: a bare directory with only edoxen.config.ts
// + data/ — no astro.config, no src/, no node_modules — is built by the
// packaged CLI and served by `edoxen-browser preview`.

const here = dirname(fileURLToPath(import.meta.url))
const packageRoot = resolve(here, '..')
const cliPath = join(packageRoot, 'dist', 'cli.js')
const fixturesDir = join(packageRoot, 'test', 'fixtures')
const port = Number(process.env.E2E_STANDALONE_PORT ?? 4803)
const origin = `http://127.0.0.1:${port}`

const CONFIG = `export default {
  site: {
    title: 'Standalone E2E Site',
    description: 'Built by the CLI with no astro.config present.',
    url: '${origin}',
  },
  data: {
    decisions: './data/decisions.yaml',
    meetings: './data/meetings.yaml',
    venues: './data/venues.yaml',
    bodies: './data/bodies.yaml',
  },
}
`

let workdir: string
let preview: ChildProcess | null = null

async function waitForServer(url: string, timeoutMs = 60_000): Promise<void> {
  const deadline = Date.now() + timeoutMs
  let lastError: unknown
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url)
      if (res.ok) return
    } catch (e) {
      lastError = e
    }
    await new Promise((r) => setTimeout(r, 500))
  }
  throw new Error(`Timed out waiting for ${url}${lastError ? `: ${String(lastError)}` : ''}`)
}

test.describe('standalone mode — CLI build with no consumer astro.config', () => {
  test.describe.configure({ mode: 'serial', timeout: 300_000 })

  test.beforeAll(async () => {
    // The standalone build takes well over the 30s default hook timeout.
    test.setTimeout(300_000)
    if (!existsSync(cliPath)) {
      throw new Error(`${cliPath} is missing — run \`pnpm -F @edoxen/browser build:cli\` first`)
    }
    workdir = await mkdtemp(join(tmpdir(), 'edoxen-standalone-e2e-'))
    await cp(join(fixturesDir, 'decisions/sample.yaml'), join(workdir, 'data/decisions.yaml'))
    await cp(join(fixturesDir, 'meetings/with-refs-meeting.yaml'), join(workdir, 'data/meetings.yaml'))
    await cp(join(fixturesDir, 'registers/venues.yaml'), join(workdir, 'data/venues.yaml'))
    await cp(join(fixturesDir, 'registers/bodies.yaml'), join(workdir, 'data/bodies.yaml'))
    await writeFile(join(workdir, 'edoxen.config.ts'), CONFIG)

    const build = spawnSync(process.execPath, [cliPath, 'build'], {
      cwd: workdir,
      stdio: 'pipe',
      timeout: 240_000,
    })
    if (build.status !== 0) {
      throw new Error(
        `standalone build failed (${build.status}):\n${build.stdout?.toString()}\n${build.stderr?.toString()}`,
      )
    }

    preview = spawn(process.execPath, [cliPath, 'preview', '--port', String(port), '--host', '127.0.0.1'], {
      cwd: workdir,
      stdio: 'ignore',
    })
    await waitForServer(origin)
  })

  test.afterAll(async () => {
    preview?.kill('SIGTERM')
    preview = null
    if (workdir) await rm(workdir, { recursive: true, force: true })
  })

  test('build emitted a real site with decision detail pages', () => {
    expect(existsSync(join(workdir, 'dist/index.html'))).toBe(true)
    expect(existsSync(join(workdir, 'dist/decisions/urn:test:resolution:1/index.html'))).toBe(true)
    expect(existsSync(join(workdir, 'dist/meetings/urn:test:meeting:2026/index.html'))).toBe(true)
    expect(existsSync(join(workdir, 'dist/data/registers.json'))).toBe(true)
  })

  test('home and decision detail render over preview', async ({ page }) => {
    await page.goto(origin)
    await expect(page.locator('h1')).toContainText('Standalone E2E Site')

    await page.goto(`${origin}/decisions/urn:test:resolution:1`)
    await expect(page.locator('h1')).toContainText('First test decision')
  })

  test('meeting page resolves register refs', async ({ page }) => {
    await page.goto(`${origin}/meetings/urn:test:meeting:2026`)
    await expect(page.locator('section', { hasText: 'CICG Geneva' }).first()).toBeVisible()
    await expect(page.locator('section', { hasText: 'CIML' }).first()).toBeVisible()
  })

  test('register data endpoint is served', async ({ request }) => {
    const response = await request.get(`${origin}/data/registers.json`)
    expect(response.ok()).toBeTruthy()
    const body = (await response.json()) as { venues: { venues: unknown[] } }
    expect(body.venues.venues.length).toBe(2)
  })
})
