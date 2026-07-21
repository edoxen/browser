export interface SearchableItem {
  readonly urn: string
  readonly title: string
  readonly identifier?: string
  readonly bodyType?: string
  readonly kind?: string
  readonly year?: number
  readonly status?: string
  /** Distinct action verbs (e.g. 'approves') — powers the action facet. */
  readonly actionTypes?: readonly string[]
  /** Adoption (or first dated) ISO date. */
  readonly date?: string
  /** Every typed date on the record — the date-range filter checks them all. */
  readonly dates?: readonly { readonly type?: string; readonly date: string }[]
  /** URN of the meeting page this item links to. */
  readonly meetingUrn?: string
  /** First action message, flattened for the island's result cards. */
  readonly snippet?: string
  // Meetings-mode fields (the same island consumes /data/meetings.json).
  /** Meeting start (or only) ISO date. */
  readonly startDate?: string
  readonly endDate?: string
  readonly city?: string
  readonly countryCode?: string
  /** Localized names for the UN/LOCODE in `city` (from data.unlocodes). */
  readonly cityNames?: Readonly<Record<string, string>>
  /** Resolved committee code — searched and shown as a chip. */
  readonly committeeCode?: string
  readonly decisionCount?: number
}

export interface FilterState {
  readonly query: string
  readonly bodies: ReadonlySet<string>
  readonly kinds: ReadonlySet<string>
  readonly years: ReadonlySet<number>
  readonly actions: ReadonlySet<string>
  readonly decades: ReadonlySet<number>
  readonly countries: ReadonlySet<string>
  /** Inclusive range bounds: an ISO date ('2024-06-15') or a bare year
      ('2024'). Either side may be omitted. */
  readonly dateFrom?: string
  readonly dateTo?: string
}

export const EMPTY_STATE: FilterState = {
  query: '',
  bodies: new Set(),
  kinds: new Set(),
  years: new Set(),
  actions: new Set(),
  decades: new Set(),
  countries: new Set(),
}

export function decadeOfYear(year: number): number {
  return Math.floor(year / 10) * 10
}

// Meetings without a country code are online meetings; the Location
// facet groups them under this sentinel (rendered as "🌐 Virtual").
export const VIRTUAL_COUNTRY = 'virtual'

// 'YYYY' or 'YYYY-MM-DD' — anything else is ignored as a range bound.
const DATE_INPUT_RE = /^\d{4}(-\d{2}-\d{2})?$/

/** Expand a date string to a comparable [lo, hi] pair (bare year → full year). */
function dateBounds(iso: string): { lo: string; hi: string } | null {
  if (!iso) return null
  if (iso.length === 4) return { lo: `${iso}-01-01`, hi: `${iso}-12-31` }
  return { lo: iso, hi: iso }
}

function rangeBounds(state: FilterState): { lo?: string; hi?: string } {
  const from = state.dateFrom?.trim() ?? ''
  const to = state.dateTo?.trim() ?? ''
  return {
    lo: DATE_INPUT_RE.test(from) ? dateBounds(from)?.lo : undefined,
    hi: DATE_INPUT_RE.test(to) ? dateBounds(to)?.hi : undefined,
  }
}

/** An item matches when any of its dates overlaps the (inclusive) range. */
function inDateRange(item: SearchableItem, state: FilterState): boolean {
  const { lo, hi } = rangeBounds(state)
  if (!lo && !hi) return true
  const candidates = [item.date, ...(item.dates ?? []).map((d) => d.date)]
  for (const candidate of candidates) {
    if (!candidate) continue
    const bounds = dateBounds(candidate)
    if (!bounds) continue
    if (lo && bounds.hi < lo) continue
    if (hi && bounds.lo > hi) continue
    return true
  }
  return false
}

export function filterItems<T extends SearchableItem>(
  items: readonly T[],
  state: FilterState,
): T[] {
  const q = state.query.trim().toLowerCase()
  return items.filter((item) => {
    if (state.bodies.size > 0 && !state.bodies.has(item.bodyType ?? '')) return false
    if (state.kinds.size > 0 && !state.kinds.has(item.kind ?? '')) return false
    if (state.years.size > 0 && !state.years.has(item.year ?? -1)) return false
    if (state.actions.size > 0 && !(item.actionTypes ?? []).some((a) => state.actions.has(a))) return false
    if (state.decades.size > 0 && !state.decades.has(typeof item.year === 'number' ? decadeOfYear(item.year) : -1)) return false
    // Items with no country code (online meetings) match the Virtual chip.
    if (state.countries.size > 0 && !state.countries.has(item.countryCode ?? VIRTUAL_COUNTRY)) return false
    if (!inDateRange(item, state)) return false
    if (q) {
      const hay = `${item.title} ${item.urn} ${item.identifier ?? ''} ${item.snippet ?? ''} ${item.committeeCode ?? ''} ${item.city ?? ''}`.toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  })
}

export interface FacetCounts {
  readonly bodies: ReadonlyMap<string, number>
  readonly kinds: ReadonlyMap<string, number>
  readonly years: ReadonlyMap<number, number>
  readonly actions: ReadonlyMap<string, number>
  readonly decades: ReadonlyMap<number, number>
  readonly countries: ReadonlyMap<string, number>
}

export function countFacets<T extends SearchableItem>(items: readonly T[]): FacetCounts {
  const bodies = new Map<string, number>()
  const kinds = new Map<string, number>()
  const years = new Map<number, number>()
  const actions = new Map<string, number>()
  const decades = new Map<number, number>()
  const countries = new Map<string, number>()
  for (const item of items) {
    if (item.bodyType) bodies.set(item.bodyType, (bodies.get(item.bodyType) ?? 0) + 1)
    if (item.kind) kinds.set(item.kind, (kinds.get(item.kind) ?? 0) + 1)
    if (typeof item.year === 'number') {
      years.set(item.year, (years.get(item.year) ?? 0) + 1)
      const decade = decadeOfYear(item.year)
      decades.set(decade, (decades.get(decade) ?? 0) + 1)
    }
    const country = item.countryCode ?? (item.startDate ? VIRTUAL_COUNTRY : undefined)
    if (country) countries.set(country, (countries.get(country) ?? 0) + 1)
    for (const a of item.actionTypes ?? []) actions.set(a, (actions.get(a) ?? 0) + 1)
  }
  return { bodies, kinds, years, actions, decades, countries }
}

export function toggle<K>(set: ReadonlySet<K>, key: K): Set<K> {
  const next = new Set(set)
  if (next.has(key)) next.delete(key)
  else next.add(key)
  return next
}

export function encodeState(state: FilterState): string {
  const params = new URLSearchParams()
  if (state.query) params.set('q', state.query)
  if (state.bodies.size > 0) params.set('bodies', [...state.bodies].sort().join(','))
  if (state.kinds.size > 0) params.set('kinds', [...state.kinds].sort().join(','))
  if (state.years.size > 0) params.set('years', [...state.years].sort().map(String).join(','))
  if (state.actions.size > 0) params.set('actions', [...state.actions].sort().join(','))
  if (state.decades.size > 0) params.set('decades', [...state.decades].sort().map(String).join(','))
  if (state.countries.size > 0) params.set('countries', [...state.countries].sort().join(','))
  if (state.dateFrom) params.set('from', state.dateFrom)
  if (state.dateTo) params.set('to', state.dateTo)
  const s = params.toString()
  return s ? `#${s}` : ''
}

export function decodeState(hash: string): FilterState {
  const trimmed = hash.startsWith('#') ? hash.slice(1) : hash
  if (!trimmed) return freshEmptyState()
  const params = new URLSearchParams(trimmed)
  const bodies = (params.get('bodies') ?? '').split(',').filter(Boolean)
  const kinds = (params.get('kinds') ?? '').split(',').filter(Boolean)
  const years = (params.get('years') ?? '').split(',').filter(Boolean).map(Number).filter(Number.isFinite)
  const actions = (params.get('actions') ?? '').split(',').filter(Boolean)
  const decades = (params.get('decades') ?? '').split(',').filter(Boolean).map(Number).filter(Number.isFinite)
  const countries = (params.get('countries') ?? '').split(',').filter(Boolean)
  return {
    query: params.get('q') ?? '',
    bodies: new Set(bodies),
    kinds: new Set(kinds),
    years: new Set(years),
    actions: new Set(actions),
    decades: new Set(decades),
    countries: new Set(countries),
    dateFrom: params.get('from') ?? undefined,
    dateTo: params.get('to') ?? undefined,
  }
}

function freshEmptyState(): FilterState {
  return {
    query: '',
    bodies: new Set(),
    kinds: new Set(),
    years: new Set(),
    actions: new Set(),
    decades: new Set(),
    countries: new Set(),
  }
}
