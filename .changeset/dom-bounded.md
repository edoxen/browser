---
"@edoxen/browser": patch
---

The search island is DOM-bounded by default: `pagination.enabled`
now defaults to `true` (pageSize 50 + "Show more") instead of
mounting every matching card on hydration. Set
`pagination: { enabled: false }` to render the full filtered list.
