import {
  loadBodies,
  loadContacts,
  loadDecisions,
  loadMeetings,
  loadVenues,
  type LoadedDecisions,
  type LoadedMeetings,
  type LoadedRegisters,
} from '@edoxen/edoxen'
import { readFile } from 'node:fs/promises'
import { parse as parseYaml } from 'yaml'

import type { DataConfig } from '../config/schema.js'

/** UN/LOCODE → per-locale place name (`NOSVG → { en: 'Stavanger' }`). */
export type UnlocodeNames = Readonly<Record<string, Readonly<Record<string, string>>>>

export interface LoadedData {
  decisions?: LoadedDecisions
  meetings?: LoadedMeetings
  registers?: LoadedRegisters
  /** Committee MeetingSeries from data.committee (merged into project.committee). */
  committee?: LoadedMeetings
  unlocodes?: UnlocodeNames
}

export type DataSource = 'decisions' | 'meetings' | 'contacts' | 'venues' | 'bodies' | 'unlocodes'

export interface LoadError {
  readonly source: DataSource
  readonly path: string
  readonly cause: Error
}

export type LoadResult =
  | { readonly ok: true; readonly value: LoadedData }
  | { readonly ok: false; readonly error: LoadError[] }

function wrapError(source: DataSource, path: string, e: unknown): LoadError {
  return { source, path, cause: e instanceof Error ? e : new Error(String(e)) }
}

// YAML or JSON by extension; entries are `CODE: { locale: name }` maps.
// Non-conforming values are dropped rather than failing the build — a
// bad entry degrades to the raw code at render time.
async function loadUnlocodes(path: string): Promise<UnlocodeNames> {
  const raw = await readFile(path, 'utf8')
  const doc: unknown = path.endsWith('.json') ? JSON.parse(raw) : parseYaml(raw)
  const out: Record<string, Record<string, string>> = {}
  if (doc && typeof doc === 'object' && !Array.isArray(doc)) {
    for (const [code, names] of Object.entries(doc as Record<string, unknown>)) {
      if (!names || typeof names !== 'object' || Array.isArray(names)) continue
      const localized: Record<string, string> = {}
      for (const [locale, name] of Object.entries(names as Record<string, unknown>)) {
        if (typeof name === 'string' && name) localized[locale] = name
      }
      if (Object.keys(localized).length > 0) out[code.toUpperCase()] = localized
    }
  }
  return out
}

const REGISTER_LOADERS = {
  contacts: loadContacts,
  venues: loadVenues,
  bodies: loadBodies,
} as const

export async function loadAll(data: DataConfig): Promise<LoadResult> {
  const errors: LoadError[] = []
  const out: LoadedData = {}

  try {
    out.decisions = await loadDecisions(data.decisions)
  } catch (e) {
    errors.push(wrapError('decisions', data.decisions, e))
  }

  if (data.meetings) {
    try {
      out.meetings = await loadMeetings(data.meetings)
    } catch (e) {
      errors.push(wrapError('meetings', data.meetings, e))
    }
  }

  // data.committee: a MeetingSeries document for the owning body
  // (About-page committee facts). loadMeetings detects series docs.
  if (data.committee) {
    try {
      out.committee = await loadMeetings(data.committee)
    } catch (e) {
      errors.push(wrapError('meetings', data.committee, e))
    }
  }

  if (data.unlocodes) {
    try {
      out.unlocodes = await loadUnlocodes(data.unlocodes)
    } catch (e) {
      errors.push(wrapError('unlocodes', data.unlocodes, e))
    }
  }

  const registers: LoadedRegisters = {}
  for (const key of Object.keys(REGISTER_LOADERS) as Array<keyof typeof REGISTER_LOADERS>) {
    const path = data[key]
    if (!path) continue
    try {
      registers[key] = await REGISTER_LOADERS[key](path)
    } catch (e) {
      errors.push(wrapError(key, path, e))
    }
  }
  if (Object.keys(registers).length > 0) {
    out.registers = registers
  }

  return errors.length === 0 ? { ok: true, value: out } : { ok: false, error: errors }
}
