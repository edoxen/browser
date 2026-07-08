import { buildProject, type EdoxenProject } from '@edoxen/edoxen'

import type { LoadedData } from './load.js'

export function buildProjectFromLoaded(data: LoadedData): EdoxenProject {
  return buildProject({
    decisions: data.decisions?.decisions,
    meetings: data.meetings?.meetings,
    committee: data.meetings?.series?.[0] ?? null,
  })
}
