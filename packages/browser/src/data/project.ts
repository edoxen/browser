import { buildProject, type EdoxenProject } from '@edoxen/edoxen'

import type { LoadedData } from './load.js'

export function buildProjectFromLoaded(data: LoadedData): EdoxenProject {
  return buildProject({
    decisions: data.decisions?.decisions,
    meetings: data.meetings?.meetings,
    // data.committee (explicit MeetingSeries doc) wins over any series
    // found inside the meetings collection.
    committee: data.committee?.series?.[0] ?? data.meetings?.series?.[0] ?? null,
  })
}
