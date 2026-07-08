import {
  loadDecisions,
  loadMeetings,
  type LoadedDecisions,
  type LoadedMeetings,
} from '@edoxen/edoxen'

import type { DataConfig } from '../config/schema.js'

export interface LoadedData {
  decisions?: LoadedDecisions
  meetings?: LoadedMeetings
}

export type DataSource = 'decisions' | 'meetings'

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

  return errors.length === 0 ? { ok: true, value: out } : { ok: false, error: errors }
}
