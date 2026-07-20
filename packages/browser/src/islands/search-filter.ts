import { urnToPath } from '../urn.js'
import {
  type FilterState,
  type SearchableItem,
  decodeState,
  decadeOfYear,
  encodeState,
  filterItems,
  toggle,
} from './search-filter-core.js'

interface FetchResponse {
  items: SearchableItem[]
  facetBodies?: string[]
  facetKinds?: string[]
  facetYears?: number[]
  facetActions?: string[]
  facetDecades?: number[]
  facetCountries?: string[]
}

type SearchMode = 'decisions' | 'meetings'

/** Humanize an action verb for display: 'calls-upon' → 'Calls upon'. */
function humanize(type: string): string {
  const words = type.replace(/[-_]+/g, ' ')
  return words.charAt(0).toUpperCase() + words.slice(1)
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
): HTMLLIElement {
  const { li, main, meta } = buildResultShell()

  if (item.identifier) meta.appendChild(makeBadge(item.identifier, 'edoxen-search-filter__result-id'))
  const dates = formatRange(item.startDate, item.endDate, lang)
  if (dates) meta.appendChild(makeBadge(dates, 'edoxen-search-filter__result-date'))
  if (item.committeeCode) meta.appendChild(makeBadge(item.committeeCode, 'edoxen-badge'))
  const place = [item.city, item.countryCode].filter(Boolean).join(', ')
  if (place) meta.appendChild(makeBadge(place, 'edoxen-search-filter__result-date'))
  if (item.decisionCount != null && item.decisionCount > 0) {
    meta.appendChild(makeBadge(`${item.decisionCount} ${decisionsLabel}`, 'edoxen-badge'))
  }
  if (meta.childElementCount > 0) main.appendChild(meta)

  const link = document.createElement('a')
  link.className = 'edoxen-search-filter__result-title'
  link.href = `${basePath}/${urnToPath(item.urn)}`
  link.textContent = item.title || item.urn
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
  private dateFromLabel = 'From'
  private dateToLabel = 'To'

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
    this.dateFromLabel = this.dataset.dateFromLabel ?? this.dateFromLabel
    this.dateToLabel = this.dataset.dateToLabel ?? this.dateToLabel
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

  private renderFacets(facetsEl: Element): void {
    const bodies = new Map<string, number>()
    const kinds = new Map<string, number>()
    const actions = new Map<string, number>()
    const decades = new Map<number, number>()
    const countries = new Map<string, number>()
    for (const item of this.items) {
      if (item.bodyType) bodies.set(item.bodyType, (bodies.get(item.bodyType) ?? 0) + 1)
      if (item.kind) kinds.set(item.kind, (kinds.get(item.kind) ?? 0) + 1)
      for (const a of item.actionTypes ?? []) actions.set(a, (actions.get(a) ?? 0) + 1)
      if (typeof item.year === 'number') {
        const decade = decadeOfYear(item.year)
        decades.set(decade, (decades.get(decade) ?? 0) + 1)
      }
      if (item.countryCode) countries.set(item.countryCode, (countries.get(item.countryCode) ?? 0) + 1)
    }

    if (this.mode === 'meetings') {
      // Decades newest-first, mirroring the decade timeline below.
      for (const decade of [...decades.keys()].sort((a, b) => b - a)) {
        const chip = makeFacetChip(`${decade}s`, decades.get(decade) ?? 0, this.state.decades.has(decade), () => {
          this.state = { ...this.state, decades: toggle(this.state.decades, decade) }
          this.syncHash()
          this.render()
        })
        chip.classList.add('edoxen-search-filter__facet--decade')
        facetsEl.appendChild(chip)
      }
      for (const country of [...countries.keys()].sort()) {
        const chip = makeFacetChip(country, countries.get(country) ?? 0, this.state.countries.has(country), () => {
          this.state = { ...this.state, countries: toggle(this.state.countries, country) }
          this.syncHash()
          this.render()
        })
        chip.classList.add('edoxen-search-filter__facet--country')
        facetsEl.appendChild(chip)
      }
    }

    for (const body of [...bodies.keys()].sort()) {
      const chip = makeFacetChip(body, bodies.get(body) ?? 0, this.state.bodies.has(body), () => {
        this.state = { ...this.state, bodies: toggle(this.state.bodies, body) }
        this.syncHash()
        this.render()
      })
      facetsEl.appendChild(chip)
    }

    if (this.mode === 'decisions') {
      for (const kind of [...kinds.keys()].sort()) {
        const chip = makeFacetChip(kind, kinds.get(kind) ?? 0, this.state.kinds.has(kind), () => {
          this.state = { ...this.state, kinds: toggle(this.state.kinds, kind) }
          this.syncHash()
          this.render()
        })
        facetsEl.appendChild(chip)
      }
      const topActions = [...actions.entries()]
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .slice(0, MAX_ACTION_FACETS)
      for (const [action, count] of topActions) {
        const chip = makeFacetChip(humanize(action), count, this.state.actions.has(action), () => {
          this.state = { ...this.state, actions: toggle(this.state.actions, action) }
          this.syncHash()
          this.render()
        })
        chip.classList.add('edoxen-search-filter__facet--action')
        facetsEl.appendChild(chip)
      }
    }
  }

  private render(): void {
    const facetsEl = this.querySelector('[data-role="facets"]')
    const resultsEl = this.querySelector('[data-role="results"]')
    if (!facetsEl || !resultsEl) return

    facetsEl.replaceChildren()
    this.renderFacets(facetsEl)

    resultsEl.replaceChildren()
    const matches = filterItems(this.items, this.state)
    if (matches.length === 0) {
      const empty = document.createElement('li')
      empty.className = 'edoxen-empty'
      empty.textContent = this.emptyLabel
      resultsEl.replaceChildren(empty)
      return
    }
    const lang = document.documentElement.lang || 'en'
    resultsEl.replaceChildren(...matches.map((item) => (
      this.mode === 'meetings'
        ? buildMeetingListItem(item, this.basePath, lang, this.decisionsLabel)
        : buildDecisionListItem(item, this.basePath, this.meetingsBasePath, lang, this.meetingLabel)
    )))
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
