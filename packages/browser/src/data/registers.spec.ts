import { describe, expect, it } from 'vitest'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import type { Body, Contact, Venue } from '@edoxen/edoxen'

import { loadAll, type LoadedData } from './load.js'
import { validateAll } from './validate.js'
import { buildProjectFromLoaded } from './project.js'
import { preparePayloads, resolveBody, resolveContact, resolveVenue } from './prepare.js'
import type { DataConfig } from '../config/schema.js'

const here = dirname(fileURLToPath(import.meta.url))
const fixtures = resolve(here, '../../test/fixtures')

const cfg: DataConfig = {
  decisions: resolve(fixtures, 'decisions/sample.yaml'),
  meetings: resolve(fixtures, 'meetings/with-refs-meeting.yaml'),
  contacts: resolve(fixtures, 'registers/contacts.yaml'),
  venues: resolve(fixtures, 'registers/venues.yaml'),
  bodies: resolve(fixtures, 'registers/bodies.yaml'),
}

async function loadFixture() {
  const loaded = await loadAll(cfg)
  if (!loaded.ok) throw new Error(`load failed: ${loaded.error.map((e) => e.cause.message).join('; ')}`)
  return loaded.value
}

describe('loadAll with registers', () => {
  it('loads contacts, venues and bodies registers', async () => {
    const data = await loadFixture()
    expect(data.registers?.contacts?.contacts?.length).toBe(1)
    expect(data.registers?.venues?.venues?.length).toBe(2)
    expect(data.registers?.bodies?.bodies?.length).toBe(2)
  })

  it('omits registers entirely when no register paths are configured', async () => {
    const loaded = await loadAll({ decisions: resolve(fixtures, 'decisions/sample.yaml') })
    if (!loaded.ok) throw new Error('load failed')
    expect(loaded.value.registers).toBeUndefined()
  })

  it('reports a structured error per failing register source', async () => {
    const loaded = await loadAll({
      decisions: resolve(fixtures, 'decisions/sample.yaml'),
      venues: resolve(fixtures, 'registers/missing.yaml'),
    })
    expect(loaded.ok).toBe(false)
    if (loaded.ok) return
    expect(loaded.error.map((e) => e.source)).toEqual(['venues'])
    expect(loaded.error[0]?.path).toMatch(/registers\/missing\.yaml$/)
  })
})

describe('validateAll with registers', () => {
  it('validates loaded register documents', async () => {
    const report = await validateAll(await loadFixture())
    expect(report.registers?.valid).toBe(true)
    expect(report.valid).toBe(true)
  })

  it('flags malformed register members and prefixes errors with the register key', async () => {
    const malformed = {
      venues: { venues: [{ capacity: 'not-a-number' }] },
    } as unknown as NonNullable<LoadedData['registers']>
    const report = await validateAll({ registers: malformed })
    expect(report.valid).toBe(false)
    expect(report.registers?.valid).toBe(false)
    expect(report.registers?.errors[0]?.path).toMatch(/^venues/)
  })

  it('skips register validation when no registers are loaded', async () => {
    const report = await validateAll({})
    expect(report.registers).toBeUndefined()
    expect(report.valid).toBe(true)
  })
})

describe('preparePayloads register maps', () => {
  it('indexes contacts and venues by urn, bodies by code and ref', async () => {
    const payloads = preparePayloads(buildProjectFromLoaded(await loadFixture()), (await loadFixture()).registers)
    expect(payloads.contactByUrn['urn:edoxen:contact:test:j-doe']?.role).toBe('chair')
    expect(payloads.venueByUrn['urn:edoxen:venue:test:geneva-cicg']?.city).toBe('Geneva')
    // BodyRegister#find_by_urn semantics: match on code OR ref.
    expect(payloads.bodyByCode['tc-154']?.kind).toBe('technical-committee')
    expect(payloads.bodyByCode['ciml']?.kind).toBe('committee')
    expect(payloads.bodyByCode['urn:edoxen:body:test:ciml']?.code).toBe('ciml')
  })

  it('produces empty maps when no registers are provided', async () => {
    const payloads = preparePayloads(buildProjectFromLoaded(await loadFixture()))
    expect(payloads.contactByUrn).toEqual({})
    expect(payloads.venueByUrn).toEqual({})
    expect(payloads.bodyByCode).toEqual({})
  })
})

describe('three-tier entity resolution', () => {
  const scopedVenues: readonly Venue[] = [
    { urn: 'urn:test:meeting:2025:venue:grand-hall', city: 'Berlin' },
  ]
  const venueRegister: Readonly<Record<string, Venue>> = {
    'urn:edoxen:venue:test:geneva-cicg': { urn: 'urn:edoxen:venue:test:geneva-cicg', city: 'Geneva' },
  }

  it('returns inline venues as-is when no ref/local_ref is set', () => {
    const inline: Venue = { kind: 'physical', city: 'Paris' }
    expect(resolveVenue(inline, scopedVenues, venueRegister)).toBe(inline)
  })

  it('resolves local_ref against the document-scoped collection by urn', () => {
    const resolved = resolveVenue({ local_ref: 'urn:test:meeting:2025:venue:grand-hall' }, scopedVenues, venueRegister)
    expect(resolved.city).toBe('Berlin')
  })

  it('resolves ref against the global register', () => {
    const resolved = resolveVenue({ ref: 'urn:edoxen:venue:test:geneva-cicg' }, scopedVenues, venueRegister)
    expect(resolved.city).toBe('Geneva')
  })

  it('falls back to the given entity when a reference cannot be resolved', () => {
    const stub: Venue = { ref: 'urn:edoxen:venue:test:missing' }
    expect(resolveVenue(stub, scopedVenues, venueRegister)).toBe(stub)
  })

  it('prefers local_ref over ref when both are set and resolvable', () => {
    const resolved = resolveVenue(
      { local_ref: 'urn:test:meeting:2025:venue:grand-hall', ref: 'urn:edoxen:venue:test:geneva-cicg' },
      scopedVenues,
      venueRegister,
    )
    expect(resolved.city).toBe('Berlin')
  })

  const scopedBodies: readonly Body[] = [{ code: 'sc-1', kind: 'subcommittee' }]
  const bodyRegister: Readonly<Record<string, Body>> = {
    'ciml': { code: 'ciml', kind: 'committee' },
    'urn:edoxen:body:test:ciml': { code: 'ciml', kind: 'committee' },
  }

  it('resolves body local_ref against scoped bodies by code', () => {
    expect(resolveBody({ local_ref: 'sc-1' }, scopedBodies, bodyRegister).kind).toBe('subcommittee')
  })

  it('resolves body ref against the register (keyed by code or ref)', () => {
    expect(resolveBody({ ref: 'ciml' }, scopedBodies, bodyRegister).kind).toBe('committee')
    expect(resolveBody({ ref: 'urn:edoxen:body:test:ciml' }, scopedBodies, bodyRegister).code).toBe('ciml')
  })

  it('resolves contact ref against the global register by urn', () => {
    const register: Readonly<Record<string, Contact>> = {
      'urn:edoxen:contact:test:j-doe': { urn: 'urn:edoxen:contact:test:j-doe', role: 'chair' },
    }
    expect(resolveContact({ ref: 'urn:edoxen:contact:test:j-doe' }, [], register).role).toBe('chair')
  })
})
