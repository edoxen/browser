import { urnToPath } from '../urn.js'
import {
  VIRTUAL_COUNTRY,
  type FilterState,
  type SearchableItem,
  decodeState,
  encodeState,
  filterItems,
  toggle,
} from './search-filter-core.js'

interface FetchResponse {
  items: SearchableItem[]
}

type SearchMode = 'decisions' | 'meetings'

/** Humanize an action verb for display: 'calls-upon' → 'Calls upon'. */
function humanize(type: string): string {
  const words = type.replace(/[-_]+/g, ' ')
  return words.charAt(0).toUpperCase() + words.slice(1)
}

/** ISO 3166-1 alpha-2 → regional-indicator flag emoji ('NO' → '🇳🇴'). */
function flagEmoji(countryCode: string): string {
  const cc = countryCode.trim().toUpperCase()
  if (!/^[A-Z]{2}$/.test(cc)) return ''
  return String.fromCodePoint(...[...cc].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65))
}

// Locale-aware country names straight from ICU — no data file needed.
const displayNamesCache = new Map<string, Intl.DisplayNames>()
function regionName(countryCode: string, lang: string): string {
  const cc = countryCode.trim().toUpperCase()
  if (!/^[A-Z]{2}$/.test(cc)) return countryCode
  let dn = displayNamesCache.get(lang)
  if (!dn) {
    try {
      dn = new Intl.DisplayNames([lang], { type: 'region' })
    } catch {
      dn = new Intl.DisplayNames(['en'], { type: 'region' })
    }
    displayNamesCache.set(lang, dn)
  }
  try {
    return dn.of(cc) ?? countryCode
  } catch {
    return countryCode
  }
}

/** Best display name for a meeting's place in `lang`. */
function cityName(item: SearchableItem, lang: string): string {
  const city = item.city ?? ''
  if (!city) return ''
  const names = item.cityNames
  return names?.[lang] ?? names?.[lang.slice(0, 2)] ?? names?.en ?? (names ? Object.values(names)[0] : undefined) ?? city
}

function formatDate(iso: string, lang: string): string {
  if (!iso) return ''
  const d = new Date(iso.length === 4 ? `${iso}-01-01` : iso)
  if (Number.isNaN(d.getTime())) return iso
  const yearOnly = iso.length === 4
  return new Intl.DateTimeFormat(lang, {
    ...(yearOnly ? {} : { day: 'numeric', month: 'long' }),
    year: 'numeric',
    timeZone: 'UTC',
  }).format(d)
}

function formatRange(start: string | undefined, end: string | undefined, lang: string): string {
  if (!start) return end ? formatDate(end, lang) : ''
  if (!end || end === start) return formatDate(start, lang)
  return `${formatDate(start, lang)} – ${formatDate(end, lang)}`
}

function makeBadge(text: string, className: string): HTMLSpanElement {
  const span = document.createElement('span')
  span.className = className
  span.textContent = text
  return span
}

function buildResultShell(): { li: HTMLLIElement; main: HTMLDivElement; meta: HTMLDivElement } {
  const li = document.createElement('li')
  li.className = 'edoxen-search-filter__result'
  const main = document.createElement('div')
  main.className = 'edoxen-search-filter__result-main'
  const meta = document.createElement('div')
  meta.className = 'edoxen-search-filter__result-meta'
  return { li, main, meta }
}

function buildDecisionListItem(
  item: SearchableItem,
  basePath: string,
  meetingsBasePath: string,
  lang: string,
  meetingLabel: string,
): HTMLLIElement {
  const { li, main, meta } = buildResultShell()

  if (item.identifier) meta.appendChild(makeBadge(item.identifier, 'edoxen-search-filter__result-id'))
  if (item.kind) meta.appendChild(makeBadge(item.kind, 'edoxen-badge'))
  for (const action of (item.actionTypes ?? []).slice(0, 3)) {
    meta.appendChild(makeBadge(humanize(action), 'edoxen-badge edoxen-badge--action'))
  }
  if (item.date) meta.appendChild(makeBadge(formatDate(item.date, lang), 'edoxen-search-filter__result-date'))
  if (meta.childElementCount > 0) main.appendChild(meta)

  const link = document.createElement('a')
  link.className = 'edoxen-search-filter__result-title'
  link.href = `${basePath}/${urnToPath(item.urn)}`
  link.textContent = item.title || item.urn
  main.appendChild(link)

  if (item.snippet) {
    const snippet = document.createElement('p')
    snippet.className = 'edoxen-search-filter__result-snippet'
    snippet.textContent = item.snippet
    main.appendChild(snippet)
  }

  li.appendChild(main)

  if (item.meetingUrn) {
    const chip = document.createElement('a')
    chip.className = 'edoxen-search-filter__meeting-chip'
    chip.href = `${meetingsBasePath}/${urnToPath(item.meetingUrn)}`
    chip.textContent = meetingLabel
    chip.setAttribute('aria-label', `${meetingLabel} for ${item.title || item.urn}`)
    li.appendChild(chip)
  } else if (item.bodyType) {
    li.appendChild(makeBadge(item.bodyType, 'edoxen-badge'))
  }
  return li
}

function buildMeetingListItem(
  item: SearchableItem,
  basePath: string,
  lang: string,
  decisionsLabel: string,
  virtualLabel: string,
): HTMLLIElement {
  const { li, main, meta } = buildResultShell()

  if (item.identifier) meta.appendChild(makeBadge(item.identifier, 'edoxen-search-filter__result-id'))
  const dates = formatRange(item.startDate, item.endDate, lang)
  if (dates) meta.appendChild(makeBadge(dates, 'edoxen-search-filter__result-date'))
  if (item.type) meta.appendChild(makeBadge(humanize(item.type), 'edoxen-search-filter__result-meeting-type'))
  if (item.committeeCode) meta.appendChild(makeBadge(item.committeeCode, 'edoxen-badge'))
  if (item.decisionCount != null && item.decisionCount > 0) {
    meta.appendChild(makeBadge(`${item.decisionCount} ${decisionsLabel}`, 'edoxen-badge'))
  }
  if (meta.childElementCount > 0) main.appendChild(meta)

  // Headline mirrors MeetingCard: place (City, Country) when known, else
  // localized "Virtual", else the entity title. The meta row already shows
  // dates and committee — don't repeat them in the headline.
  const link = document.createElement('a')
  link.className = 'edoxen-search-filter__result-title'
  link.href = `${basePath}/${urnToPath(item.urn)}`
  const city = cityName(item, lang)
  const country = item.countryCode ? regionName(item.countryCode, lang) : ''
  const place = [city, country].filter(Boolean).join(', ')
  const flag = item.countryCode ? flagEmoji(item.countryCode) : ''
  if (!item.city && !item.countryCode) {
    link.textContent = `\u{1F310} ${virtualLabel}`
  } else if (place) {
    link.textContent = flag ? `${flag} ${place}` : place
  } else {
    link.textContent = item.title || item.urn
  }
  if (item.title) link.title = item.title
  main.appendChild(link)

  li.appendChild(main)

  if (item.bodyType) {
    li.appendChild(makeBadge(item.bodyType, 'edoxen-badge'))
  }
  return li
}

function makeFacetChip(label: string, count: number, active: boolean, onToggle: () => void): HTMLElement {
  const btn = document.createElement('button')
  btn.type = 'button'
  btn.className = 'edoxen-search-filter__facet'
  btn.setAttribute('aria-pressed', active ? 'true' : 'false')
  btn.textContent = `${label} (${count})`
  btn.addEventListener('click', onToggle)
  return btn
}

// Long-tailed vocabularies (36+ wild action verbs) would flood the facet
// row; cap it at the most common entries, ordered by frequency.
const MAX_ACTION_FACETS = 12

class SearchFilter extends HTMLElement {
  private items: SearchableItem[] = []
  private state: FilterState = decodeState('')
  private mode: SearchMode = 'decisions'
  private basePath = '/decisions'
  private meetingsBasePath = '/meetings'
  private endpoint = '/data/decisions.json'
  private placeholder = 'Search…'
  private searchAriaLabel = 'Search decisions'
  private emptyLabel = 'No matches found.'
  private meetingLabel = 'Meeting'
  private decisionsLabel = 'Resolutions'
  private virtualLabel = 'Virtual'
  private groupYearLabel = 'Year'
  private groupLocationLabel = 'Location'
  private groupTypeLabel = 'Type'
  private groupActionsLabel = 'Actions'
  private groupBodyLabel = 'Body'
  private dateFromLabel = 'From'
  private dateToLabel = 'To'
  private showMoreLabel = 'Show more'
  /** features.pagination: cap rendered results, growing by pageSize per
      'Show more' click. 0 = render everything (flag off). */
  private pageSize = 0
  private visible = 0
  private lastSignature: string | null = null

  async connectedCallback(): Promise<void> {
    this.mode = this.dataset.mode === 'meetings' ? 'meetings' : 'decisions'
    this.endpoint = this.dataset.endpoint ?? (this.mode === 'meetings' ? '/data/meetings.json' : this.endpoint)
    this.basePath = this.dataset.basePath ?? (this.mode === 'meetings' ? '/meetings' : this.basePath)
    this.meetingsBasePath = this.dataset.meetingsBasePath ?? this.basePath.replace(/decisions\/?$/, 'meetings')
    this.placeholder = this.dataset.placeholder ?? this.placeholder
    this.searchAriaLabel = this.dataset.ariaLabel ?? (this.mode === 'meetings' ? 'Search meetings' : this.searchAriaLabel)
    this.emptyLabel = this.dataset.emptyLabel ?? this.emptyLabel
    this.meetingLabel = this.dataset.meetingLabel ?? this.meetingLabel
    this.decisionsLabel = this.dataset.decisionsLabel ?? this.decisionsLabel
    this.virtualLabel = this.dataset.virtualLabel ?? this.virtualLabel
    this.groupYearLabel = this.dataset.groupYearLabel ?? this.groupYearLabel
    this.groupLocationLabel = this.dataset.groupLocationLabel ?? this.groupLocationLabel
    this.groupTypeLabel = this.dataset.groupTypeLabel ?? this.groupTypeLabel
    this.groupActionsLabel = this.dataset.groupActionsLabel ?? this.groupActionsLabel
    this.groupBodyLabel = this.dataset.groupBodyLabel ?? this.groupBodyLabel
    this.dateFromLabel = this.dataset.dateFromLabel ?? this.dateFromLabel
    this.dateToLabel = this.dataset.dateToLabel ?? this.dateToLabel
    this.showMoreLabel = this.dataset.showMoreLabel ?? this.showMoreLabel
    const pageSize = Number(this.dataset.pageSize ?? '0')
    this.pageSize = Number.isFinite(pageSize) && pageSize > 0 ? Math.floor(pageSize) : 0
    this.state = decodeState(window.location.hash)

    this.renderShell()

    if (this.dataset.items) {
      this.handlePayload(JSON.parse(this.dataset.items) as FetchResponse)
    } else {
      try {
        const res = await fetch(this.endpoint)
        const payload = (await res.json()) as FetchResponse
        this.handlePayload(payload)
      } catch {
        this.renderError(`Failed to load ${this.endpoint}`)
      }
    }
  }

  private handlePayload(payload: FetchResponse): void {
    this.items = payload.items
    this.render()
  }

  private renderShell(): void {
    const form = document.createElement('form')
    form.className = 'edoxen-search-filter__form'
    form.setAttribute('role', 'search')

    const input = document.createElement('input')
    input.type = 'search'
    input.placeholder = this.placeholder
    input.value = this.state.query
    input.setAttribute('aria-label', this.searchAriaLabel)
    input.addEventListener('input', () => {
      this.state = { ...this.state, query: input.value }
      this.syncHash()
      this.render()
    })
    form.appendChild(input)

    if (this.mode === 'decisions') {
      // Finer control next to the year facet state: an inclusive
      // date-range, each side an ISO date or a bare year.
      const range = document.createElement('div')
      range.className = 'edoxen-search-filter__date-range'
      range.setAttribute('data-role', 'date-range')
      range.appendChild(this.makeDateInput(this.dateFromLabel, this.state.dateFrom ?? '', (value) => {
        this.state = { ...this.state, dateFrom: value || undefined }
        this.syncHash()
        this.render()
      }))
      range.appendChild(this.makeDateInput(this.dateToLabel, this.state.dateTo ?? '', (value) => {
        this.state = { ...this.state, dateTo: value || undefined }
        this.syncHash()
        this.render()
      }))
      form.appendChild(range)
    }

    const facets = document.createElement('div')
    facets.className = 'edoxen-search-filter__facets'
    facets.setAttribute('data-role', 'facets')
    form.appendChild(facets)

    const results = document.createElement('ul')
    results.className = 'edoxen-search-filter__results'
    results.setAttribute('data-role', 'results')
    form.appendChild(results)

    if (this.pageSize > 0) {
      const more = document.createElement('button')
      more.type = 'button'
      more.className = 'edoxen-search-filter__more'
      more.setAttribute('data-role', 'more')
      more.textContent = this.showMoreLabel
      more.hidden = true
      more.addEventListener('click', () => {
        this.visible += this.pageSize
        this.render()
      })
      form.appendChild(more)
    }

    this.replaceChildren(form)
  }

  private makeDateInput(label: string, value: string, onInput: (value: string) => void): HTMLLabelElement {
    const wrapper = document.createElement('label')
    wrapper.className = 'edoxen-search-filter__date-field'
    const caption = document.createElement('span')
    caption.textContent = label
    const input = document.createElement('input')
    input.type = 'text'
    input.inputMode = 'numeric'
    input.pattern = '\\d{4}(-\\d{2}-\\d{2})?'
    input.placeholder = 'YYYY-MM-DD'
    input.value = value
    input.setAttribute('aria-label', label)
    input.addEventListener('input', () => onInput(input.value.trim()))
    wrapper.appendChild(caption)
    wrapper.appendChild(input)
    return wrapper
  }

  /** A labeled facet family ("Year", "Location", …) — chips never mix. */
  private makeFacetGroup(label: string, chips: HTMLElement[]): HTMLElement | null {
    if (chips.length === 0) return null
    const group = document.createElement('div')
    group.className = 'edoxen-search-filter__facet-group'
    const caption = document.createElement('span')
    caption.className = 'edoxen-search-filter__facet-label'
    caption.textContent = label
    const row = document.createElement('div')
    row.className = 'edoxen-search-filter__facet-chips'
    row.append(...chips)
    group.append(caption, row)
    return group
  }

  private renderFacets(facetsEl: Element): void {
    const bodies = new Map<string, number>()
    const kinds = new Map<string, number>()
    const actions = new Map<string, number>()
    const years = new Map<number, number>()
    const countries = new Map<string, number>()
    const types = new Map<string, number>()
    for (const item of this.items) {
      if (item.bodyType) bodies.set(item.bodyType, (bodies.get(item.bodyType) ?? 0) + 1)
      if (item.kind) kinds.set(item.kind, (kinds.get(item.kind) ?? 0) + 1)
      for (const a of item.actionTypes ?? []) actions.set(a, (actions.get(a) ?? 0) + 1)
      if (typeof item.year === 'number') years.set(item.year, (years.get(item.year) ?? 0) + 1)
      // Meetings without a country code are online — the Virtual chip.
      const country = item.countryCode ?? (this.mode === 'meetings' ? VIRTUAL_COUNTRY : undefined)
      if (country) countries.set(country, (countries.get(country) ?? 0) + 1)
      if (item.type) types.set(item.type, (types.get(item.type) ?? 0) + 1)
    }
    const lang = document.documentElement.lang || 'en'
    const groups: HTMLElement[] = []

    if (this.mode === 'meetings') {
      // Year chips, newest first.
      const yearChips = [...years.keys()].sort((a, b) => b - a).map((year) => {
        const chip = makeFacetChip(String(year), years.get(year) ?? 0, this.state.years.has(year), () => {
          this.state = { ...this.state, years: toggle(this.state.years, year) }
          this.syncHash()
          this.render()
        })
        chip.classList.add('edoxen-search-filter__facet--year')
        return chip
      })
      // Meeting-type chips: humanize the enum value (plenary → Plenary).
      const typeChips = [...types.keys()].sort().map((type) => {
        const chip = makeFacetChip(humanize(type), types.get(type) ?? 0, this.state.types.has(type), () => {
          this.state = { ...this.state, types: toggle(this.state.types, type) }
          this.syncHash()
          this.render()
        })
        chip.classList.add('edoxen-search-filter__facet--meeting-type')
        return chip
      })
      // Location chips: flag + country name, "🌐 Virtual" sorted last.
      const countryChips = [...countries.keys()]
        .sort((a, b) => (a === VIRTUAL_COUNTRY ? 1 : b === VIRTUAL_COUNTRY ? -1 : regionName(a, lang).localeCompare(regionName(b, lang))))
        .map((country) => {
          const label = country === VIRTUAL_COUNTRY
            ? `\u{1F310} ${this.virtualLabel}`
            : `${flagEmoji(country)} ${regionName(country, lang)}`
          const chip = makeFacetChip(label.trim(), countries.get(country) ?? 0, this.state.countries.has(country), () => {
            this.state = { ...this.state, countries: toggle(this.state.countries, country) }
            this.syncHash()
            this.render()
          })
          chip.classList.add('edoxen-search-filter__facet--country')
          if (country === VIRTUAL_COUNTRY) chip.classList.add('edoxen-search-filter__facet--virtual')
          return chip
        })
      const yearGroup = this.makeFacetGroup(this.groupYearLabel, yearChips)
      const typeGroup = this.makeFacetGroup(this.groupTypeLabel, typeChips)
      const locationGroup = this.makeFacetGroup(this.groupLocationLabel, countryChips)
      if (yearGroup) groups.push(yearGroup)
      if (typeGroup) groups.push(typeGroup)
      if (locationGroup) groups.push(locationGroup)
    }

    const bodyChips = [...bodies.keys()].sort().map((body) =>
      makeFacetChip(body, bodies.get(body) ?? 0, this.state.bodies.has(body), () => {
        this.state = { ...this.state, bodies: toggle(this.state.bodies, body) }
        this.syncHash()
        this.render()
      }))
    const bodyGroup = this.makeFacetGroup(this.groupBodyLabel, bodyChips)
    if (bodyGroup) groups.push(bodyGroup)

    if (this.mode === 'decisions') {
      const kindChips = [...kinds.keys()].sort().map((kind) =>
        makeFacetChip(kind, kinds.get(kind) ?? 0, this.state.kinds.has(kind), () => {
          this.state = { ...this.state, kinds: toggle(this.state.kinds, kind) }
          this.syncHash()
          this.render()
        }))
      const topActions = [...actions.entries()]
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .slice(0, MAX_ACTION_FACETS)
      const actionChips = topActions.map(([action, count]) => {
        const chip = makeFacetChip(humanize(action), count, this.state.actions.has(action), () => {
          this.state = { ...this.state, actions: toggle(this.state.actions, action) }
          this.syncHash()
          this.render()
        })
        chip.classList.add('edoxen-search-filter__facet--action')
        return chip
      })
      const typeGroup = this.makeFacetGroup(this.groupTypeLabel, kindChips)
      const actionsGroup = this.makeFacetGroup(this.groupActionsLabel, actionChips)
      if (typeGroup) groups.push(typeGroup)
      if (actionsGroup) groups.push(actionsGroup)
    }

    facetsEl.append(...groups)
  }

  private render(): void {
    const facetsEl = this.querySelector('[data-role="facets"]')
    const resultsEl = this.querySelector('[data-role="results"]')
    if (!facetsEl || !resultsEl) return

    facetsEl.replaceChildren()
    this.renderFacets(facetsEl)

    resultsEl.replaceChildren()
    const matches = filterItems(this.items, this.state)

    // Meetings mode: the server-rendered decade sections below ARE the
    // browse view. While no filter is active the island renders no
    // duplicate list; once filtering, it flags itself so CSS can hide
    // the static sections in favor of the matches.
    const pristine = encodeState(this.state) === ''
    if (this.mode === 'meetings') {
      if (pristine) delete this.dataset.filtering
      else this.dataset.filtering = 'true'
      if (pristine) {
        this.updateMoreButton(0, 0)
        return
      }
    }

    if (matches.length === 0) {
      const empty = document.createElement('li')
      empty.className = 'edoxen-empty'
      empty.textContent = this.emptyLabel
      resultsEl.replaceChildren(empty)
      this.updateMoreButton(0, 0)
      return
    }
    // Any filter change rewinds the capped view to the first page.
    const signature = encodeState(this.state)
    if (signature !== this.lastSignature) {
      this.visible = this.pageSize
      this.lastSignature = signature
    }
    const shown = this.pageSize > 0 ? matches.slice(0, this.visible) : matches
    const lang = document.documentElement.lang || 'en'
    resultsEl.replaceChildren(...shown.map((item) => (
      this.mode === 'meetings'
        ? buildMeetingListItem(item, this.basePath, lang, this.decisionsLabel, this.virtualLabel)
        : buildDecisionListItem(item, this.basePath, this.meetingsBasePath, lang, this.meetingLabel)
    )))
    this.updateMoreButton(matches.length, shown.length)
  }

  private updateMoreButton(total: number, shown: number): void {
    const more = this.querySelector('[data-role="more"]')
    if (more instanceof HTMLButtonElement) {
      more.hidden = this.pageSize === 0 || shown >= total
    }
  }

  private syncHash(): void {
    const hash = encodeState(this.state)
    if (hash !== window.location.hash) {
      window.history.replaceState(null, '', hash || window.location.pathname)
    }
  }

  private renderError(message: string): void {
    const p = document.createElement('p')
    p.className = 'edoxen-search-filter__error'
    p.textContent = message
    this.replaceChildren(p)
  }
}

customElements.define('search-filter', SearchFilter)
