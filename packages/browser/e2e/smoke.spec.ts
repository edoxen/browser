import { expect, test } from '@playwright/test'

// Integration-mode fixture site (test/e2e-app) on the default baseURL.

test.describe('fixture site — navigation and rendering', () => {
  test('home renders the site title', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('h1')).toContainText('E2E Fixture Site')
  })

  test('dark theme is applied pre-paint by an inline script (no hydration wait)', async ({ page }) => {
    // Emulate a dark-mode visitor. The inline head script must set
    // data-theme synchronously — i.e. it must be real, executable JS
    // (a previous version shipped the template literal verbatim).
    await page.emulateMedia({ colorScheme: 'dark' })
    await page.goto('/')
    const theme = await page.evaluate(() => document.documentElement.dataset.theme)
    expect(theme).toBe('dark')
    // And the script itself must be parseable JS (not template text —
    // a previous version shipped the template literal verbatim and
    // never executed). hasText uses visible-text semantics which
    // exclude <script> contents, so read the raw document instead.
    const html = await page.content()
    const m = html.match(/<script[^>]*>([\s\S]*?edoxen-theme[\s\S]*?)<\/script>/)
    expect(m).toBeTruthy()
    const src = m?.[1] ?? ''
    expect(src).not.toContain('`')
    expect(src.trimStart().startsWith('(function')).toBe(true)
  })

  test('decisions list navigates to a decision detail page', async ({ page }) => {
    await page.goto('/decisions')
    const link = page.locator('main a[href="/decisions/urn:test:resolution:1"]').first()
    await expect(link).toBeVisible()
    await link.click()
    await expect(page).toHaveURL(/\/decisions\/urn:test:resolution:1/)
    await expect(page.locator('h1')).toContainText('First test decision')
  })

  test('meetings list navigates to a meeting detail page', async ({ page }) => {
    await page.goto('/meetings')
    const link = page.locator('main a[href="/meetings/urn:test:meeting:2025"]').first()
    await expect(link).toBeVisible()
    await link.click()
    await expect(page).toHaveURL(/\/meetings\/urn:test:meeting:2025/)
    await expect(page.locator('h1')).toContainText('2025 Refs Plenary')
  })

  test('decision detail back-link points at the decisions index', async ({ page }) => {
    await page.goto('/decisions/urn:test:resolution:1')
    const back = page.locator('article a', { hasText: '← Resolutions' })
    await expect(back).toHaveAttribute('href', '/decisions')
  })
})

test.describe('fixture site — decision detail full record', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/decisions/urn:test:resolution:1')
  })

  test('breadcrumb renders Home › Resolutions › identifier', async ({ page }) => {
    const crumbs = page.locator('nav[aria-label="Breadcrumb"]')
    await expect(crumbs).toContainText('Home')
    await expect(crumbs).toContainText('Resolutions')
    await expect(crumbs).toContainText('TEST-1')
    await expect(crumbs.locator('a', { hasText: 'Resolutions' })).toHaveAttribute('href', '/decisions')
  })

  test('badge row carries status, mono ids, date and the meeting cross-link', async ({ page }) => {
    const header = page.locator('article header')
    await expect(header.locator('.edoxen-badge--status')).toHaveText('decided')
    await expect(header.locator('.edoxen-badge--mono')).toHaveText('TEST-1')
    await expect(header.locator('.edoxen-decision__adopted')).toContainText('June 15, 2024')
    const meetingLink = header.locator('a.edoxen-meeting-link', { hasText: '2025 Refs Plenary' })
    await expect(meetingLink).toHaveAttribute('href', '/meetings/urn:test:meeting:2025')
  })

  test('agenda-item chip deep-links to the meeting agenda anchor', async ({ page }) => {
    const chip = page.locator('article header a.edoxen-meeting-link', { hasText: 'Agenda 2' })
    await expect(chip).toHaveAttribute('href', '/meetings/urn:test:meeting:2025#agenda-item-2')
  })

  test('locale tabs switch the title spelling', async ({ page }) => {
    const tabs = page.locator('section-tabs[data-field="decision-title"]')
    await expect(tabs.locator('button')).toHaveCount(2)
    await expect(page.locator('h1 span[data-spelling="eng"]')).toBeVisible()
    await tabs.locator('button[data-spelling="fra"]').click()
    await expect(page.locator('h1 span[data-spelling="fra"]')).toBeVisible()
    await expect(page.locator('h1 span[data-spelling="eng"]')).toBeHidden()
  })

  test('actions, considerations, approvals and relations sections render', async ({ page }) => {
    const actions = page.locator('section', { has: page.locator('h2', { hasText: 'Actions' }) })
    await expect(actions.locator('.edoxen-action-card')).toHaveCount(2)
    await expect(actions.locator('.edoxen-badge--action').first()).toHaveText('Publishes')
    await expect(actions).toContainText('Publishes the test standard.')
    await expect(actions).toContainText('Thanks the drafting group')
    // AsciiDoc tables in messages render as real tables
    const adocTable = actions.locator('.edoxen-adoc table')
    await expect(adocTable).toHaveCount(1)
    await expect(adocTable.locator('thead th').first()).toHaveText('Part')
    await expect(adocTable).toContainText('Test methods')

    const considerations = page.locator('section', { has: page.locator('h2', { hasText: 'Considerations' }) })
    await expect(considerations).toContainText('well-documented test fixture')

    const approvals = page.locator('section', { has: page.locator('h2', { hasText: 'Approvals' }) })
    await expect(approvals).toContainText('unanimous')

    const related = page.locator('section', { has: page.locator('h2', { hasText: 'Related' }) })
    await expect(related.locator('a', { hasText: 'TEST-2' })).toHaveAttribute('href', '/decisions/urn:test:resolution:2')
  })

  test('URN bar, DOI, categories and reference documents render', async ({ page }) => {
    await expect(page.locator('.edoxen-urn-bar')).toContainText('urn:test:resolution:1')
    await expect(page.locator('.edoxen-decision__doi a')).toHaveAttribute('href', 'https://doi.org/10.1234/test.2024.1')
    await expect(page.locator('section', { has: page.locator('h2', { hasText: 'Categories' }) })).toContainText('Governance')
    const refs = page.locator('section', { has: page.locator('h2', { hasText: 'Reference documents' }) })
    await expect(refs.locator('a')).toHaveAttribute('href', 'https://example.org/docs/test-1')
  })

  test('JSON-LD and prev/next navigation are preserved', async ({ page }) => {
    const jsonld = await page.locator('script[type="application/ld+json"]').textContent()
    expect(jsonld).toContain('"@type":"Legislation"')
    const nav = page.locator('nav.edoxen-prev-next')
    await expect(nav.locator('a[rel="prev"]')).toContainText('Second test decision')
  })
})

test.describe('fixture site — meeting detail full record', () => {
  test('register refs resolve: venue and committee from the registers', async ({ page }) => {
    await page.goto('/meetings/urn:test:meeting:2026')
    await expect(page.locator('section', { hasText: 'CICG Geneva' }).first()).toBeVisible()
    await expect(page.locator('section', { hasText: 'CIML' }).first()).toBeVisible()
  })

  test('local_ref resolves against the meeting-scoped collections', async ({ page }) => {
    await page.goto('/meetings/urn:test:meeting:2025')
    await expect(page.locator('section', { hasText: 'Grand Hall (inline)' }).first()).toBeVisible()
    await expect(page.locator('section', { hasText: 'SC 1 (inline)' }).first()).toBeVisible()
  })

  test('venue card, officers, hosts, deadlines and note render', async ({ page }) => {
    await page.goto('/meetings/urn:test:meeting:2025')

    const venue = page.locator('section', { has: page.locator('h2', { hasText: 'Venue' }) })
    await expect(venue).toContainText('Grand Hall (inline)')
    await expect(venue).toContainText('1 Testplatz, Berlin')
    await expect(venue).toContainText('DEBER')
    await expect(venue.locator('a[href="https://example.org/map/grand-hall"]')).toBeVisible()

    const officers = page.locator('section', { has: page.locator('h2', { hasText: 'Officers' }) })
    await expect(officers).toContainText('Ada Test-Chair')
    await expect(officers).toContainText('Test Standards Body')
    await expect(officers.locator('a[href="mailto:ada@example.org"]')).toBeVisible()

    const hosts = page.locator('section', { has: page.locator('h2', { hasText: 'Hosts' }) })
    await expect(hosts).toContainText('J. Doe')

    const deadlines = page.locator('section', { has: page.locator('h2', { hasText: 'Deadlines' }) })
    await expect(deadlines).toContainText('Registration closes')

    const schedule = page.locator('section', { has: page.locator('h2', { hasText: 'Schedule' }) })
    await expect(schedule).toContainText('Opening plenary')

    const sources = page.locator('section', { has: page.locator('h2', { hasText: 'Source documents' }) })
    await expect(sources.locator('a[href="https://example.org/meetings/2025/agenda.pdf"]')).toBeVisible()
    await expect(sources).toContainText('eng')

    const note = page.locator('section', { has: page.locator('h2', { hasText: 'Note' }) })
    await expect(note).toContainText('Registration closes two weeks')
  })

  test('agenda rows anchor and cross-link to their decisions', async ({ page }) => {
    await page.goto('/meetings/urn:test:meeting:2025')
    const row = page.locator('tr#agenda-item-2')
    const link = row.locator('a', { hasText: 'Adoption of TEST-1' })
    await expect(link).toHaveAttribute('href', '/decisions/urn:test:resolution:1')
    await link.click()
    await expect(page).toHaveURL(/\/decisions\/urn:test:resolution:1/)
    await expect(page.locator('h1')).toContainText('First test decision')
  })

  test('decision page agenda chip lands on the highlighted agenda row', async ({ page }) => {
    await page.goto('/decisions/urn:test:resolution:1')
    await page.locator('article header a.edoxen-meeting-link', { hasText: 'Agenda 2' }).click()
    await expect(page).toHaveURL(/\/meetings\/urn:test:meeting:2025#agenda-item-2/)
    await expect(page.locator('tr#agenda-item-2')).toBeVisible()
  })
})

test.describe('fixture site — home, lists and data endpoints', () => {
  test('home hero renders the stat strip from real data', async ({ page }) => {
    await page.goto('/')
    const stats = page.locator('.edoxen-stat-strip')
    await expect(stats).toContainText('2')
    await expect(stats).toContainText('2023–2024')
  })

  test('home renders recent decision cards with action pills and meeting chips', async ({ page }) => {
    await page.goto('/')
    const card = page.locator('.edoxen-decision-card').first()
    await expect(card.locator('.edoxen-decision-card__id')).toHaveText('TEST-1')
    await expect(card.locator('.edoxen-badge--action').first()).toHaveText('Publishes')
    await expect(card.locator('.edoxen-decision-card__meeting')).toHaveAttribute('href', '/meetings/urn:test:meeting:2025')
    await expect(card.locator('.edoxen-decision-card__snippet')).toContainText('Publishes the test standard.')
  })

  test('meetings index groups meetings under decade anchors', async ({ page }) => {
    await page.goto('/meetings')
    await expect(page.locator('section#decade-2020')).toBeVisible()
    const card = page.locator('.edoxen-meeting-card', { has: page.locator('a[href="/meetings/urn:test:meeting:2025"]') })
    await expect(card.locator('.edoxen-meeting-card__committee')).toHaveText('sc-1')
    await expect(card.locator('.edoxen-meeting-card__count')).toContainText('1 Resolutions')
    await expect(page.locator('.edoxen-decade-timeline__link').first()).toHaveAttribute('href', '#decade-2020')
  })

  test('search-filter island hydrates, filters, and exposes an action facet', async ({ page }) => {
    await page.goto('/decisions')
    await expect(page.locator('search-filter')).toBeAttached()
    const input = page.locator('search-filter input[type="search"]')
    await expect(input).toBeVisible()
    await input.fill('Second')
    await expect(page.locator('search-filter .edoxen-search-filter__result')).toHaveCount(1)
    await input.fill('')

    const actionFacet = page.locator('search-filter .edoxen-search-filter__facet--action', { hasText: 'Publishes' })
    await expect(actionFacet).toContainText('(1)')
    await actionFacet.click()
    await expect(page.locator('search-filter .edoxen-search-filter__result')).toHaveCount(1)
    const result = page.locator('search-filter .edoxen-search-filter__result').first()
    await expect(result).toContainText('Publishes the test standard.')
    await expect(result.locator('.edoxen-search-filter__meeting-chip')).toHaveAttribute('href', '/meetings/urn:test:meeting:2025')
  })

  test('date-range inputs narrow the decisions results and round-trip via hash', async ({ page }) => {
    await page.goto('/decisions')
    const island = page.locator('search-filter')
    const results = island.locator('.edoxen-search-filter__result')
    const from = island.locator('input[aria-label="From"]')
    const to = island.locator('input[aria-label="To"]')
    await expect(from).toBeVisible()
    await expect(to).toBeVisible()
    await expect(results).toHaveCount(2)

    // Bare year expands to the whole calendar year: 2024 keeps TEST-1 only.
    await from.fill('2024')
    await expect(results).toHaveCount(1)
    await expect(results.first()).toContainText('First test decision')
    await expect(page).toHaveURL(/#.*from=2024/)

    // A full ISO upper bound keeps TEST-2 (2023-09-12) only.
    await from.fill('')
    await to.fill('2023-12-31')
    await expect(results).toHaveCount(1)
    await expect(results.first()).toContainText('Second test decision')
    await expect(page).toHaveURL(/#.*to=2023-12-31/)

    // Clearing the range restores every result.
    await to.fill('')
    await expect(results).toHaveCount(2)
  })

  test('meetings search island renders, filters by text, country and decade', async ({ page }) => {
    await page.goto('/meetings')
    const island = page.locator('search-filter[data-mode="meetings"]')
    await expect(island).toBeAttached()
    const results = island.locator('.edoxen-search-filter__result')

    // Text search hits the flattened title and the committee code.
    const input = island.locator('input[type="search"]')
    await expect(input).toBeVisible()
    await input.fill('sc-1')
    await expect(results).toHaveCount(1)
    await expect(results.first()).toContainText('2025 Refs Plenary')
    await expect(results.first().locator('a.edoxen-search-filter__result-title'))
      .toHaveAttribute('href', '/meetings/urn:test:meeting:2025')
    await input.fill('')
    await expect(results).toHaveCount(2)

    // Country facet narrows to the Geneva meeting; the hash follows.
    const chChip = island.locator('.edoxen-search-filter__facet--country', { hasText: 'CH' })
    await expect(chChip).toContainText('(1)')
    await chChip.click()
    await expect(results).toHaveCount(1)
    await expect(results.first()).toContainText('2026 Register Refs Plenary')
    await expect(page).toHaveURL(/#.*countries=CH/)
    await chChip.click()
    await expect(results).toHaveCount(2)

    // Both meetings sit in the 2020s — a single decade chip.
    const decadeChip = island.locator('.edoxen-search-filter__facet--decade', { hasText: '2020s' })
    await expect(decadeChip).toContainText('(2)')
    await decadeChip.click()
    await expect(results).toHaveCount(2)

    // The decade scroller and the server-rendered list stay put.
    await expect(page.locator('decade-scroller')).toBeAttached()
    await expect(page.locator('section#decade-2020')).toBeVisible()
  })

  test('JSON data endpoints are served from the built site', async ({ request }) => {
    const decisions = await request.get('/data/decisions.json')
    expect(decisions.ok()).toBeTruthy()
    const decisionsBody = (await decisions.json()) as {
      items: Array<Record<string, unknown>>
      facetActions: string[]
    }
    expect(decisionsBody.items.length).toBeGreaterThan(0)
    const first = decisionsBody.items.find((i) => i['urn'] === 'urn:test:resolution:1')
    expect(first?.['actionTypes']).toEqual(['publishes', 'thanks'])
    expect(first?.['date']).toBe('2024-06-15')
    expect(first?.['snippet']).toContain('Publishes the test standard')
    expect(first?.['meetingUrn']).toBe('urn:test:meeting:2025')
    expect(decisionsBody.facetActions).toContain('publishes')

    const meetings = await request.get('/data/meetings.json')
    expect(meetings.ok()).toBeTruthy()
    const meetingsBody = (await meetings.json()) as { items: Array<Record<string, unknown>> }
    const m2025 = meetingsBody.items.find((i) => i['urn'] === 'urn:test:meeting:2025')
    // The island searches the flattened title + committee code + city.
    expect(typeof m2025?.['title']).toBe('string')
    expect(m2025?.['committeeCode']).toBe('sc-1')
    expect(m2025?.['city']).toBe('DEBER')
    expect(m2025?.['countryCode']).toBe('DE')

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
