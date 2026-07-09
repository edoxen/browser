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
}

function buildListItem(item: SearchableItem, basePath: string): HTMLLIElement {
  const li = document.createElement('li')
  li.className = 'edoxen-search-filter__result'
  const link = document.createElement('a')
  link.href = `${basePath}/${encodeURIComponent(item.urn)}`
  link.textContent = item.title || item.urn
  li.appendChild(link)
  if (item.bodyType) {
    const badge = document.createElement('span')
    badge.className = 'edoxen-badge'
    badge.textContent = item.bodyType
    li.appendChild(badge)
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

class SearchFilter extends HTMLElement {
  private items: SearchableItem[] = []
  private state: FilterState = { ...EMPTY_STATE, bodies: new Set(), kinds: new Set(), years: new Set() }
  private basePath = '/decisions'
  private endpoint = '/data/decisions.json'

  async connectedCallback(): Promise<void> {
    this.endpoint = this.dataset.endpoint ?? this.endpoint
    this.basePath = this.dataset.basePath ?? this.basePath
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
    const bodies = new Set<string>()
    const kinds = new Set<string>()
    const years = new Set<number>()
    for (const item of this.items) {
      if (item.bodyType) bodies.add(item.bodyType)
      if (item.kind) kinds.add(item.kind)
      if (typeof item.year === 'number') years.add(item.year)
    }

    for (const body of [...bodies].sort()) {
      const chip = makeFacetChip(body, this.items.filter((i) => i.bodyType === body).length, this.state.bodies.has(body), () => {
        this.state = { ...this.state, bodies: toggle(this.state.bodies, body) }
        this.syncHash()
        this.render()
      })
      facetsEl.appendChild(chip)
    }
    for (const kind of [...kinds].sort()) {
      const chip = makeFacetChip(kind, this.items.filter((i) => i.kind === kind).length, this.state.kinds.has(kind), () => {
        this.state = { ...this.state, kinds: toggle(this.state.kinds, kind) }
        this.syncHash()
        this.render()
      })
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
    resultsEl.replaceChildren(...matches.map((item) => buildListItem(item, this.basePath)))
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
