import { expect, test } from '@playwright/test'

test.describe('minimal example — smoke', () => {
  test('home renders the site title', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('h1')).toContainText('Example Committee')
  })

  test('header carries the edoxen attribution link', async ({ page }) => {
    await page.goto('/')
    const footer = page.locator('footer.edoxen-footer')
    await expect(footer.locator('a[href="https://edoxen.github.io"]')).toBeVisible()
  })

  test('decision list links to a decision detail page', async ({ page }) => {
    await page.goto('/')
    const firstDecisionLink = page.locator('main a[href^="/decisions/urn:example:resolution:"]').first()
    await expect(firstDecisionLink).toBeVisible()
    await firstDecisionLink.click()
    await expect(page).toHaveURL(/\/decisions\/urn:example:resolution:\d+/)
    await expect(page.locator('h1')).toBeVisible()
  })

  test('meeting detail renders agenda table', async ({ page }) => {
    await page.goto('/meetings/urn%3Aexample%3Ameeting%3A2024')
    await expect(page.locator('h1')).toContainText('Plenary')
    await expect(page.locator('table.edoxen-agenda')).toBeVisible()
  })

  test('search-filter island hydrates', async ({ page }) => {
    await page.goto('/decisions')
    await expect(page.locator('search-filter')).toBeAttached()
    const input = page.locator('search-filter input[type="search"]')
    await expect(input).toBeVisible()
    await input.fill('second')
    await expect(page.locator('search-filter .edoxen-search-filter__result')).toHaveCount(1)
  })

  test('JSON data endpoint is reachable from the built site', async ({ request }) => {
    const response = await request.get('/data/decisions.json')
    expect(response.ok()).toBeTruthy()
    const body = (await response.json()) as { items: unknown[] }
    expect(Array.isArray(body.items)).toBe(true)
    expect(body.items.length).toBeGreaterThan(0)
  })

  test('404 page renders', async ({ page }) => {
    await page.goto('/this-route-does-not-exist')
    await expect(page.locator('h1')).toContainText('404')
  })

  test('URN copy button is present on decision detail', async ({ page }) => {
    await page.goto('/decisions/urn%3Aexample%3Aresolution%3A1')
    await expect(page.locator('urn-copy')).toBeAttached()
  })
})
