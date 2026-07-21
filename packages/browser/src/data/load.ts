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

import type { DataConfig } from '../config/schema.js'

export interface LoadedData {
  decisions?: LoadedDecisions
  meetings?: LoadedMeetings
  registers?: LoadedRegisters
  /** Committee MeetingSeries from data.committee (merged into project.committee). */
  committee?: LoadedMeetings
}

export type DataSource = 'decisions' | 'meetings' | 'contacts' | 'venues' | 'bodies'

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
