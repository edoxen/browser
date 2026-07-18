import type { DataConfig } from './schema.js'

export interface ResolvedDataPaths {
  readonly decisions: string
  readonly meetings: string | null
  readonly contacts: string | null
  readonly venues: string | null
  readonly bodies: string | null
  readonly agendas: string | null
  readonly minutes: string | null
  readonly committee: string | null
}

const KEYS = ['decisions', 'meetings', 'contacts', 'venues', 'bodies', 'agendas', 'minutes', 'committee'] as const
export type DataPathKey = (typeof KEYS)[number]

export function resolveDataPaths(data: DataConfig): ResolvedDataPaths {
  return {
    decisions: data.decisions,
    meetings: data.meetings ?? null,
    contacts: data.contacts ?? null,
    venues: data.venues ?? null,
    bodies: data.bodies ?? null,
    agendas: data.agendas ?? null,
    minutes: data.minutes ?? null,
    committee: data.committee ?? null,
  }
}

export function activeDataKeys(data: DataConfig): readonly DataPathKey[] {
  return KEYS.filter((k) => data[k] !== undefined)
}
