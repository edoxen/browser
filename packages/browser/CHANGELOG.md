# @edoxen/browser

## 0.1.8

### Patch Changes

- e44eec2: Consumer stylesheet override + warm default theme revamp.

  - The integration now detects a consumer stylesheet — `theme.customCss`
    (explicit path, resolved against the site root) or
    `src/styles/override.css` (convention) — and bundles it after the
    package's `base.css`, so consumers can re-token and restyle without
    ejecting (works in both integration and standalone modes).
  - The bare default look is replaced with a complete "elegant
    professional warm" theme: warm paper canvas (#faf8f6), warm charcoal
    ink, serif display headings from system font stacks (no webfont
    needed), a deep warm teal accent (#0f766e), pill nav/badges/facet
    chips, soft-shadow cards with hover lift, booktabs-style tables, a
    dotted decade timeline, visible focus rings, and an ink-safe print
    stylesheet. Dark mode is a warm charcoal with a bright teal accent.
    All palette defaults live in `theme` schema defaults and meet WCAG AA.
  - New default token values (light): primary #1c1917, accent #0f766e,
    background #faf8f6, text #292524, muted #78716c, border #e7e5e4,
    success #15803d, warning #b45309, danger #b91c1c, radius 0.5rem;
    (dark): primary #f5f5f4, accent #2dd4bf, surface #292524,
    background #1c1917, text #e7e5e4, muted #a8a29e, border #44403c.
  - `examples/standalone` is now the full theming showcase (explicit
    palette, radius, logos, nav, social, features) with a commented
    `src/styles/override.css` reference; README's Theming section
    documents the cascade, grouped token reference, override convention,
    and dark mode.

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
