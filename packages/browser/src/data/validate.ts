import { validateDecisions, validateMeetings, validateRegisters, type ValidateResult } from '@edoxen/edoxen'

import type { LoadedData } from './load.js'

export interface ValidationReport {
  decisions?: ValidateResult
  meetings?: ValidateResult
  registers?: ValidateResult
  valid: boolean
}

function decisionsCollectionShape(data: NonNullable<LoadedData['decisions']>): unknown {
  return { metadata: data.metadata, decisions: data.decisions }
}

function meetingsCollectionShape(data: NonNullable<LoadedData['meetings']>): unknown {
  const out: Record<string, unknown> = { meetings: data.meetings }
  if (data.metadata) out.metadata = data.metadata
  return out
}

export async function validateAll(data: LoadedData): Promise<ValidationReport> {
  let valid = true
  const report: ValidationReport = { valid }

  if (data.decisions) {
    const result = await validateDecisions(decisionsCollectionShape(data.decisions))
    report.decisions = result
    if (!result.valid) valid = false
  }

  if (data.meetings) {
    const result = await validateMeetings(meetingsCollectionShape(data.meetings))
    report.meetings = result
    if (!result.valid) valid = false
  }

  if (data.registers) {
    const result = await validateRegisters({
      contacts: data.registers.contacts,
      venues: data.registers.venues,
      bodies: data.registers.bodies,
    })
    report.registers = result
    if (!result.valid) valid = false
  }

  return { decisions: report.decisions, meetings: report.meetings, registers: report.registers, valid }
}
