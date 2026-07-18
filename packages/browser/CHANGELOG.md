# @edoxen/browser

## 0.1.7

### Patch Changes

- 8b90f77: Register dataset support, standalone CLI mode, basePath link fixes, and a proper e2e suite.

  - **Registers**: new optional `data.contacts` / `data.venues` / `data.bodies` config keys (requires `@edoxen/edoxen` ^0.2.3). Loaded and validated alongside decisions/meetings, exposed to templates as `contactByUrn` / `venueByUrn` / `bodyByCode` lookup maps, served at `/data/registers.json`, and used by meeting detail pages to resolve venue and committee references with the gem's three-tier semantics (inline → meeting-scoped `local_ref` → register `ref`).
  - **Standalone mode**: `edoxen-browser build` / `dev` / `preview` now work in a downstream repo that has only `edoxen.config.ts` + data — no `astro.config.ts`, no `src/`. The CLI runs Astro programmatically against the package's bundled standalone root and bridges the resolved config via environment variables. When a consumer `astro.config.*` exists, the CLI keeps deferring to it (integration mode unchanged).
  - **basePath fixes**: list pages, layouts, meeting linked-decision links, and the search-filter island now build hrefs from a single `urlPrefix(config, locale)` helper, so every link is correct under a sub-path deployment.
  - **Crash fix**: meeting detail pages no longer read the nonexistent `cfg.terminology.decisionPluralLabel` (which threw whenever a meeting had linked decisions); the section title comes from `uiStrings` via `t('section.adoptedDecisions')`.
  - **Search fix**: `/data/decisions.json` and `/data/meetings.json` now serve plain-string titles instead of raw `LocalizedString[]`, matching the search-filter island's contract.
  - **Validation**: the integration and CLI warn instead of throwing on JS schema validation errors (the Ruby gem is the canonical validator); the `validate` command stays strict.
  - **e2e**: package-level Playwright suite (integration mode, basePath variant, standalone mode) wired into CI as a separate job; `pnpm test` stays unit-only, `pnpm test:e2e` runs the browser tests.

## 0.1.6

### Patch Changes

- 29cae5e: Add interface i18n (6 built-in languages + custom via uiStrings), AsciiDoc rendering for decision content, UN/LOCODE venue resolution, configurable terminology, meeting schedule timetable, and language switcher.

## 0.2.0

### Minor Changes

- f9e2f59: Bootstrap the `@edoxen/browser` monorepo. Adds the root pnpm workspace,
  the `packages/browser/` package skeleton, a hello-world Astro page that
  imports from `@edoxen/edoxen`, a sample Vitest spec for the config
  schema, and the CI workflow. No user-visible features yet — those land
  in subsequent TODOs.

### Patch Changes

- 29cae5e: Add interface i18n (6 built-in languages + custom via uiStrings), AsciiDoc rendering for decision content, UN/LOCODE venue resolution, configurable terminology, meeting schedule timetable, and language switcher.

## 0.2.0

### Minor Changes

- f9e2f59: Bootstrap the `@edoxen/browser` monorepo. Adds the root pnpm workspace,
  the `packages/browser/` package skeleton, a hello-world Astro page that
  imports from `@edoxen/edoxen`, a sample Vitest spec for the config
  schema, and the CI workflow. No user-visible features yet — those land
  in subsequent TODOs.

### Patch Changes

- 29cae5e: Add interface i18n (6 built-in languages + custom via uiStrings), AsciiDoc rendering for decision content, UN/LOCODE venue resolution, configurable terminology, meeting schedule timetable, and language switcher.
