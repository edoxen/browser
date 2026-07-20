import { urnToPath } from './urn.js'

// Single place that knows how decision URLs are built. Every decision
// link on the site — cards, detail pages, breadcrumbs, prev/next, the
// search island — honors `decisionsSlug`, so renaming the route segment
// ('decisions' → 'resolutions') moves the whole link graph with it.
// Meetings have no configurable slug; `${urlPrefix}meetings` stays the
// convention.

export function decisionsBase(
  config: { decisionsSlug: string },
  urlPrefix: string,
): string {
  return `${urlPrefix}${config.decisionsSlug}`
}

export function decisionHref(
  config: { decisionsSlug: string },
  urlPrefix: string,
  urn: string,
): string {
  return `${decisionsBase(config, urlPrefix)}/${urnToPath(urn)}`
}
