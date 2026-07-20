---
"@edoxen/browser": minor
---

Terminology, decisionsSlug, meetings search, date-range filter, and an
honest feature-flag surface.

- New `terminology` config ({ decision, decisions, meeting, meetings }):
  renames every user-facing English string — nav, page titles, section
  headings, stat strip, breadcrumbs, empty states, search placeholder —
  via a uiStrings → terminology → built-in resolution order in t().
- New `decisionsSlug` config (default 'decisions'): moves the decisions
  index + detail routes and every generated decision link (cards,
  breadcrumbs, prev/next, agenda rows, JSON-LD); the default nav
  derives from terminology + slug when `nav` is unset. The /data/*.json
  endpoint names stay fixed.
- The meetings index gains the search/filter island (parity with
  decisions): text search over flattened title/committee code/city with
  decade, body and country facet chips; hash state round-trips.
- The decisions search island gains an inclusive date-range filter
  (ISO date or bare year) checked against every date on the record.
- Feature flags now do what the schema always promised: `search`,
  `timeline`, `printStyles` (print CSS omitted entirely when off),
  `urnCopy`, and `pagination` — implemented honestly as pageSize
  capping with a 'Show more' control in the island, not full numbered
  pagination. New `features.home` configures the stat strip,
  recent-item counts and browse-by-decade section.
