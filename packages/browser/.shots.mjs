// Screenshot review harness: serves a built site and captures the key
// pages in light + dark for visual review.
// Usage: node /tmp/edoxen-shots.mjs <distRoot> <port> <outDir> [basePath]
import { chromium } from '@playwright/test'
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join, extname, resolve } from 'node:path'
import { mkdir } from 'node:fs/promises'

const [distRoot, portArg, outDir, basePath = '/'] = process.argv.slice(2)
const port = Number(portArg ?? 4820)
if (!distRoot || !outDir) {
  console.error('usage: node edoxen-shots.mjs <distRoot> <port> <outDir> [basePath]')
  process.exit(1)
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.xml': 'application/xml',
  '.woff2': 'font/woff2',
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', 'http://x')
  let path = decodeURIComponent(url.pathname)
  if (path.endsWith('/')) path += 'index.html'
  let file = join(distRoot, path)
  if ((existsSync(file) && !extname(file)) || (!existsSync(file) && !extname(path))) {
    file = join(distRoot, path, 'index.html')
  }
  if (!existsSync(file)) {
    file = join(distRoot, '404.html')
    if (!existsSync(file)) {
      res.statusCode = 404
      res.end('not found')
      return
    }
    res.statusCode = 404
  }
  res.setHeader('Content-Type', MIME[extname(file)] ?? 'application/octet-stream')
  res.end(await readFile(file))
})

await new Promise((r) => server.listen(port, '127.0.0.1', r))
console.log(`serving ${distRoot} on http://127.0.0.1:${port}`)

const pages = [
  ['home', ''],
  ['decisions', 'decisions'],
  ['decision-detail', 'decisions/urn:test:resolution:1'],
  ['meetings', 'meetings'],
  ['meeting-detail', 'meetings/urn:test:meeting:2025'],
]

await mkdir(outDir, { recursive: true })
const browser = await chromium.launch()
for (const scheme of ['light', 'dark']) {
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 960 },
    colorScheme: scheme,
    deviceScaleFactor: 2,
  })
  const page = await ctx.newPage()
  for (const [name, route] of pages) {
    const url = `http://127.0.0.1:${port}${basePath}${route}`
    await page.goto(url, { waitUntil: 'networkidle' })
    await page.waitForTimeout(400)
    await page.screenshot({ path: join(outDir, `${name}-${scheme}.png`), fullPage: true })
    console.log(`captured ${name}-${scheme}.png`)
  }
  await ctx.close()
}
await browser.close()
server.close()
console.log('done')
