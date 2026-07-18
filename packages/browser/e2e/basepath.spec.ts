import { expect, test } from '@playwright/test'

// basePath variant (test/e2e-app-basepath) — served under /resolutions/.
// Regression coverage for the urlPrefix refactor: every link a visitor
// can click must carry the deployment sub-path.

const BASEPATH_URL = `http://127.0.0.1:${Number(process.env.E2E_BASEPATH_PORT ?? 4802)}`
const BASE = '/resolutions'

test.use({ baseURL: BASEPATH_URL })

test.describe('basePath site — links carry the deployment prefix', () => {
  test('home renders and the brand link points at the prefixed root', async ({ page }) => {
    await page.goto(`${BASE}/`)
    await expect(page.locator('h1')).toContainText('E2E Basepath Site')
    await expect(page.locator('a.edoxen-header__brand')).toHaveAttribute('href', `${BASE}/`)
  })

  test('home recent-item links carry the prefix', async ({ page }) => {
    await page.goto(`${BASE}/`)
    await expect(page.locator(`main a[href^="${BASE}/decisions/urn%3A"]`).first()).toBeVisible()
    await expect(page.locator(`main a[href^="${BASE}/meetings/urn%3A"]`).first()).toBeVisible()
  })

  test('decision list links are prefixed and navigable', async ({ page }) => {
    await page.goto(`${BASE}/decisions`)
    const link = page.locator(`main a[href="${BASE}/decisions/urn%3Atest%3Aresolution%3A1"]`).first()
    await expect(link).toBeVisible()
    await link.click()
    await expect(page).toHaveURL(new RegExp(`${BASE}/decisions/urn%3Atest%3Aresolution%3A1`))
    await expect(page.locator('h1')).toContainText('First test decision')
    await expect(page.locator('article a', { hasText: '← Decisions' })).toHaveAttribute('href', `${BASE}/decisions`)
  })

  test('meeting list and detail links are prefixed', async ({ page }) => {
    await page.goto(`${BASE}/meetings`)
    const link = page.locator(`main a[href="${BASE}/meetings/urn%3Atest%3Ameeting%3A2025"]`).first()
    await expect(link).toBeVisible()
    await link.click()
    await expect(page.locator('h1')).toContainText('2025 Refs Plenary')
    await expect(page.locator('article a', { hasText: '← Meetings' })).toHaveAttribute('href', `${BASE}/meetings`)
  })

  test('linked decisions on a meeting page are prefixed', async ({ page }) => {
    await page.goto(`${BASE}/meetings/urn%3Atest%3Ameeting%3A2025`)
    const link = page.locator('section a', { hasText: 'First test decision' })
    await expect(link).toHaveAttribute('href', `${BASE}/decisions/urn%3Atest%3Aresolution%3A1`)
  })

  test('search-filter fetches data and builds result links under the prefix', async ({ page }) => {
    await page.goto(`${BASE}/decisions`)
    await expect(page.locator('search-filter')).toHaveAttribute('data-base-path', `${BASE}/decisions`)
    const input = page.locator('search-filter input[type="search"]')
    await expect(input).toBeVisible()
    await input.fill('Second')
    await expect(page.locator('search-filter .edoxen-search-filter__result')).toHaveCount(1)
    const resultLink = page.locator('search-filter .edoxen-search-filter__result a').first()
    await expect(resultLink).toHaveAttribute('href', new RegExp(`^${BASE}/decisions/`))
  })

  test('JSON data endpoints are reachable under the prefix', async ({ request }) => {
    const response = await request.get(`${BASE}/data/decisions.json`)
    expect(response.ok()).toBeTruthy()
    const registers = await request.get(`${BASE}/data/registers.json`)
    expect(registers.ok()).toBeTruthy()
  })
})
