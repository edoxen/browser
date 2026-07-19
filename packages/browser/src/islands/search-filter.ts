import { urnToPath } from '../urn.js'
import {
  type FilterState,
  type SearchableItem,
  EMPTY_STATE,
  decodeState,
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
}

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

function makeBadge(text: string, className: string): HTMLSpanElement {
  const span = document.createElement('span')
  span.className = className
  span.textContent = text
  return span
}

function buildListItem(item: SearchableItem, basePath: string, meetingsBasePath: string, lang: string): HTMLLIElement {
  const li = document.createElement('li')
  li.className = 'edoxen-search-filter__result'

  const main = document.createElement('div')
  main.className = 'edoxen-search-filter__result-main'

  const meta = document.createElement('div')
  meta.className = 'edoxen-search-filter__result-meta'
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
    chip.textContent = 'Meeting'
    chip.setAttribute('aria-label', `Meeting for ${item.title || item.urn}`)
    li.appendChild(chip)
  } else if (item.bodyType) {
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
  private state: FilterState = { ...EMPTY_STATE, bodies: new Set(), kinds: new Set(), years: new Set(), actions: new Set() }
  private basePath = '/decisions'
  private meetingsBasePath = '/meetings'
  private endpoint = '/data/decisions.json'

  async connectedCallback(): Promise<void> {
    this.endpoint = this.dataset.endpoint ?? this.endpoint
    this.basePath = this.dataset.basePath ?? this.basePath
    this.meetingsBasePath = this.dataset.meetingsBasePath ?? this.basePath.replace(/decisions\/?$/, 'meetings')
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
    input.placeholder = 'Search…'
    input.value = this.state.query
    input.setAttribute('aria-label', 'Search decisions')
    input.addEventListener('input', () => {
      this.state = { ...this.state, query: input.value }
      this.syncHash()
      this.render()
    })
    form.appendChild(input)

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

  private render(): void {
    const facetsEl = this.querySelector('[data-role="facets"]')
    const resultsEl = this.querySelector('[data-role="results"]')
    if (!facetsEl || !resultsEl) return

    facetsEl.replaceChildren()
    const bodies = new Map<string, number>()
    const kinds = new Map<string, number>()
    const actions = new Map<string, number>()
    for (const item of this.items) {
      if (item.bodyType) bodies.set(item.bodyType, (bodies.get(item.bodyType) ?? 0) + 1)
      if (item.kind) kinds.set(item.kind, (kinds.get(item.kind) ?? 0) + 1)
      for (const a of item.actionTypes ?? []) actions.set(a, (actions.get(a) ?? 0) + 1)
    }

    for (const body of [...bodies.keys()].sort()) {
      const chip = makeFacetChip(body, bodies.get(body) ?? 0, this.state.bodies.has(body), () => {
        this.state = { ...this.state, bodies: toggle(this.state.bodies, body) }
        this.syncHash()
        this.render()
      })
      facetsEl.appendChild(chip)
    }
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

    resultsEl.replaceChildren()
    const matches = filterItems(this.items, this.state)
    if (matches.length === 0) {
      const empty = document.createElement('li')
      empty.className = 'edoxen-empty'
      empty.textContent = 'No matches.'
      resultsEl.replaceChildren(empty)
      return
    }
    const lang = document.documentElement.lang || 'en'
    resultsEl.replaceChildren(...matches.map((item) => buildListItem(item, this.basePath, this.meetingsBasePath, lang)))
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
