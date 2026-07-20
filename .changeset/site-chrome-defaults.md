---
'@edoxen/browser': minor
---

Site chrome defaults: ship Meetings + Decisions + About as the
default top-nav, add a `footer` config block with auto-generated
message + copyright, and make the "Powered by Edoxen" attribution
toggleable.

- `nav` default is now `[{ Meetings }, { Decisions }, { About }]`
  instead of empty. Zero-config consumers see the three primary
  concepts in the header immediately.
- `footer: { message, copyright, showEdoxenAttribution }` is a new
  config block. When `message` / `copyright` are unset, the package
  auto-generates them from the site title + current year.
- `showEdoxenAttribution` defaults to true. Set to false only when
  the consumer's licence / brand terms require it.
- `resolveFooter()` helper exported from `@edoxen/browser/config`
  for downstream consumers that want to mirror the auto-generation.
