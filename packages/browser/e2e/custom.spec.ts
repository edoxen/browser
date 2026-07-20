import { expect, test } from '@playwright/test'

// Terminology/slug/flags variant (test/e2e-app-custom): the fixture
// records are renamed to "Resolutions", served from /resolutions via
// decisionsSlug, with features.search switched off.

const CUSTOM_URL = `http://127.0.0.1:${Number(process.env.E2E_CUSTOM_PORT ?? 4804)}`

test.use({ baseURL: CUSTOM_URL })

test.describe('custom site — terminology override', () => {
  test('the default nav derives labels + hrefs from terminology and decisionsSlug', async ({ page }) => {
    await page.goto('/')
    const nav = page.locator('nav[aria-label="Primary"]')
    await expect(nav.locator('a', { hasText: 'Resolutions' })).toHaveAttribute('href', '/resolutions')
    await expect(nav.locator('a', { hasText: 'Meetings' })).toHaveAttribute('href', '/meetings')
    await expect(nav.locator('a', { hasText: 'Decisions' })).toHaveCount(0)
  })

  test('terminology appears in the page title, h1, stat strip and section headings', async ({ page }) => {
    await page.goto('/resolutions')
    await expect(page).toHaveTitle(/Resolutions — E2E Custom Site/)
    await expect(page.locator('h1')).toHaveText('Resolutions')

    await page.goto('/')
    await expect(page.locator('.edoxen-stat-strip')).toContainText('Resolutions on record')
    await expect(page.locator('h2', { hasText: 'Latest Resolutions' })).toBeVisible()
  })

  test('breadcrumbs and the back-link carry the terminology', async ({ page }) => {
    await page.goto('/resolutions/urn:test:resolution:1')
    const crumbs = page.locator('nav[aria-label="Breadcrumb"]')
    await expect(crumbs.locator('a', { hasText: 'Resolutions' })).toHaveAttribute('href', '/resolutions')
    await expect(page.locator('a.edoxen-back-link')).toContainText('Resolutions')
  })
})

test.describe('custom site — decisionsSlug routes and links', () => {
  test('the index is served from /resolutions and detail links follow the slug', async ({ page }) => {
    await page.goto('/resolutions')
    const link = page.locator('main a[href="/resolutions/urn:test:resolution:1"]').first()
    await expect(link).toBeVisible()
    await link.click()
    await expect(page).toHaveURL(/\/resolutions\/urn:test:resolution:1/)
    await expect(page.locator('h1')).toContainText('First test decision')
  })

  test('prev/next navigation and relation links use the slug', async ({ page }) => {
    await page.goto('/resolutions/urn:test:resolution:1')
    await expect(page.locator('nav.edoxen-prev-next a[rel="prev"]'))
      .toHaveAttribute('href', '/resolutions/urn:test:resolution:2')
    const related = page.locator('section', { has: page.locator('h2', { hasText: 'Related' }) })
    await expect(related.locator('a', { hasText: 'TEST-2' }))
      .toHaveAttribute('href', '/resolutions/urn:test:resolution:2')
  })

  test('meeting pages cross-link into the renamed route space', async ({ page }) => {
    await page.goto('/meetings/urn:test:meeting:2025')
    const row = page.locator('tr#agenda-item-2')
    await expect(row.locator('a').first()).toHaveAttribute('href', '/resolutions/urn:test:resolution:1')
  })

  test('the old /decisions route space is gone', async ({ page }) => {
    const response = await page.goto('/decisions')
    expect(response?.status()).toBe(404)
    await expect(page.locator('h1')).toContainText('404')
  })
})

test.describe('custom site — feature flags', () => {
  test('features.search: false hides the island but keeps the list', async ({ page }) => {
    await page.goto('/resolutions')
    await expect(page.locator('search-filter')).toHaveCount(0)
    await expect(page.locator('.edoxen-decision-card').first()).toBeVisible()

    await page.goto('/meetings')
    await expect(page.locator('search-filter')).toHaveCount(0)
    await expect(page.locator('.edoxen-meeting-card').first()).toBeVisible()
  })
})
