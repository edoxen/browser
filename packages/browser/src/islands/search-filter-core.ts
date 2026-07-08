export interface SearchableItem {
  readonly urn: string
  readonly title: string
  readonly identifier?: string
  readonly bodyType?: string
  readonly kind?: string
  readonly year?: number
}

export interface FilterState {
  readonly query: string
  readonly bodies: ReadonlySet<string>
  readonly kinds: ReadonlySet<string>
  readonly years: ReadonlySet<number>
}

export const EMPTY_STATE: FilterState = {
  query: '',
  bodies: new Set(),
  kinds: new Set(),
  years: new Set(),
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
    if (q) {
      const hay = `${item.title} ${item.urn} ${item.identifier ?? ''}`.toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  })
}

export interface FacetCounts {
  readonly bodies: ReadonlyMap<string, number>
  readonly kinds: ReadonlyMap<string, number>
  readonly years: ReadonlyMap<number, number>
}

export function countFacets<T extends SearchableItem>(items: readonly T[]): FacetCounts {
  const bodies = new Map<string, number>()
  const kinds = new Map<string, number>()
  const years = new Map<number, number>()
  for (const item of items) {
    if (item.bodyType) bodies.set(item.bodyType, (bodies.get(item.bodyType) ?? 0) + 1)
    if (item.kind) kinds.set(item.kind, (kinds.get(item.kind) ?? 0) + 1)
    if (typeof item.year === 'number') years.set(item.year, (years.get(item.year) ?? 0) + 1)
  }
  return { bodies, kinds, years }
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
  const s = params.toString()
  return s ? `#${s}` : ''
}

export function decodeState(hash: string): FilterState {
  const trimmed = hash.startsWith('#') ? hash.slice(1) : hash
  if (!trimmed) return { ...EMPTY_STATE, bodies: new Set(), kinds: new Set(), years: new Set() }
  const params = new URLSearchParams(trimmed)
  const bodies = (params.get('bodies') ?? '').split(',').filter(Boolean)
  const kinds = (params.get('kinds') ?? '').split(',').filter(Boolean)
  const years = (params.get('years') ?? '').split(',').filter(Boolean).map(Number).filter(Number.isFinite)
  return {
    query: params.get('q') ?? '',
    bodies: new Set(bodies),
    kinds: new Set(kinds),
    years: new Set(years),
  }
}
