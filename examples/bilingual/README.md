# @edoxen/browser — bilingual example

EN + FR content via per-field LocalizedString. Demonstrates the i18n
shape that OIML-class consumers use.

## Notes

- The default locale (`en`) renders at `/`; `fr` would render at `/fr/*`
  once locale-prefixed routing is implemented (TODO 07 next batch).
- The `LocaleTabs` component shows all available spellings for the
  title; consumers can wire up `<section-tabs>` to toggle content
  interactively.
