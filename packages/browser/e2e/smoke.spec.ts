import { expect, test } from '@playwright/test'

// Integration-mode fixture site (test/e2e-app) on the default baseURL.

test.describe('fixture site — navigation and rendering', () => {
  test('home renders the site title', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('h1')).toContainText('E2E Fixture Site')
  })

  test('decisions list navigates to a decision detail page', async ({ page }) => {
    await page.goto('/decisions')
    const link = page.locator('main a[href="/decisions/urn%3Atest%3Aresolution%3A1"]').first()
    await expect(link).toBeVisible()
    await link.click()
    await expect(page).toHaveURL(/\/decisions\/urn%3Atest%3Aresolution%3A1/)
    await expect(page.locator('h1')).toContainText('First test decision')
  })

  test('meetings list navigates to a meeting detail page', async ({ page }) => {
    await page.goto('/meetings')
    const link = page.locator('main a[href="/meetings/urn%3Atest%3Ameeting%3A2025"]').first()
    await expect(link).toBeVisible()
    await link.click()
    await expect(page).toHaveURL(/\/meetings\/urn%3Atest%3Ameeting%3A2025/)
    await expect(page.locator('h1')).toContainText('2025 Refs Plenary')
  })

  test('decision detail back-link points at the decisions index', async ({ page }) => {
    await page.goto('/decisions/urn%3Atest%3Aresolution%3A1')
    const back = page.locator('article a', { hasText: '← Decisions' })
    await expect(back).toHaveAttribute('href', '/decisions')
  })
})

test.describe('fixture site — register resolution on meeting pages', () => {
  test('register refs resolve: venue and committee from the registers', async ({ page }) => {
    await page.goto('/meetings/urn%3Atest%3Ameeting%3A2026')
    await expect(page.locator('section', { hasText: 'CICG Geneva' }).first()).toBeVisible()
    await expect(page.locator('section', { hasText: 'CIML' }).first()).toBeVisible()
  })

  test('local_ref resolves against the meeting-scoped collections', async ({ page }) => {
    await page.goto('/meetings/urn%3Atest%3Ameeting%3A2025')
    await expect(page.locator('section', { hasText: 'Grand Hall (inline)' }).first()).toBeVisible()
    await expect(page.locator('section', { hasText: 'SC 1 (inline)' }).first()).toBeVisible()
  })

  test('linked decisions render with a working absolute link', async ({ page }) => {
    await page.goto('/meetings/urn%3Atest%3Ameeting%3A2025')
    const section = page.locator('section', { has: page.locator('h2', { hasText: 'Resolutions' }) })
    const link = section.locator('a', { hasText: 'First test decision' })
    await expect(link).toHaveAttribute('href', '/decisions/urn%3Atest%3Aresolution%3A1')
    await link.click()
    await expect(page.locator('h1')).toContainText('First test decision')
  })
})

test.describe('fixture site — client islands and data endpoints', () => {
  test('search-filter island hydrates and filters', async ({ page }) => {
    await page.goto('/decisions')
    await expect(page.locator('search-filter')).toBeAttached()
    const input = page.locator('search-filter input[type="search"]')
    await expect(input).toBeVisible()
    await input.fill('Second')
    await expect(page.locator('search-filter .edoxen-search-filter__result')).toHaveCount(1)
  })

  test('JSON data endpoints are served from the built site', async ({ request }) => {
    const decisions = await request.get('/data/decisions.json')
    expect(decisions.ok()).toBeTruthy()
    const decisionsBody = (await decisions.json()) as { items: unknown[] }
    expect(decisionsBody.items.length).toBeGreaterThan(0)

    const meetings = await request.get('/data/meetings.json')
    expect(meetings.ok()).toBeTruthy()

    const registers = await request.get('/data/registers.json')
    expect(registers.ok()).toBeTruthy()
    const registersBody = (await registers.json()) as {
      contacts: { contacts: unknown[] }
      venues: { venues: unknown[] }
      bodies: { bodies: unknown[] }
    }
    expect(registersBody.contacts.contacts.length).toBe(1)
    expect(registersBody.venues.venues.length).toBe(2)
    expect(registersBody.bodies.bodies.length).toBe(2)
  })

  test('404 page renders', async ({ page }) => {
    await page.goto('/this-route-does-not-exist')
    await expect(page.locator('h1')).toContainText('404')
  })
})
