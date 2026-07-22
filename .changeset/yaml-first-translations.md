---
'@edoxen/browser': minor
---

YAML-first translations.

Translators work in YAML, not JS literals. The runtime i18n table now ships as six per-locale YAML files (`src/i18n/strings/<locale>.yaml`) parsed at build time via Vite's `?raw` import + the `yaml` package. Consumer overrides gain a symmetric loader.

### Added
- `loadYamlTranslations(yamlString)` helper, exported from `@edoxen/browser`. Parses a YAML mapping of `'key': 'value'` pairs into a frozen `UiStrings` record. Throws clearly on non-mapping input, ignores non-string values, returns `{}` for empty input.
- `src/i18n/load-translations.spec.ts` — six tests covering happy path, unicode/quote escaping, empty input, malformed input, freeze guarantee.

### Changed
- `src/i18n/strings/{eng,fra,zho,spa,ara,rus}.yaml` — built-in locale tables extracted from the TS literal that used to live inline in `ui.ts`. Same keys, same values, just YAML. Translators can read these as worked examples.
- `src/i18n/ui.ts` — `STRINGS` const now references `BUILTIN_STRINGS` (loaded from YAML); the 557-line inline table is gone. `loadYamlTranslations` is re-exported for consumers.
- `src/virtual.d.ts` — declares `*.yaml?raw` and `*.yml?raw` modules so TypeScript accepts Vite's raw YAML imports.
- README §Custom translations rewritten to make YAML the primary path: Option A (file-based, recommended) loads via `readFileSync` + `loadYamlTranslations`; Option B (inline literals) still works for small overrides. Includes YAML escaping rules (`'` doubling inside single-quoted scalars, or backslash escapes in double-quoted).

### Migration notes for consumers
No breaking changes — inline `uiStrings: { fra: {...} }` literals still work. Consumers who want file-based translations can adopt the new helper without touching existing config. Built-in English + French values are unchanged.
