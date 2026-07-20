# @edoxen/browser

## 0.4.2

### Patch Changes

- 994625f: The search island is DOM-bounded by default: `pagination.enabled`
  now defaults to `true` (pageSize 50 + "Show more") instead of
  mounting every matching card on hydration. Set
  `pagination: { enabled: false }` to render the full filtered list.

## 0.4.1

### Patch Changes

- ed8fb3c: Slim the decisions index and /data/decisions.json: lean island items
  (subject dropped, snippets clamped server-side) and a 200-card cap on
  the noscript fallback list with a note — the index no longer ships
  the whole archive twice (~3.8MB → ~1.1MB raw, ~400KB → ~140KB
  gzipped). Font preconnects added for Google Fonts overrides.

## 0.4.0

### Minor Changes

- 79c1fcb: Terminology, decisionsSlug, meetings search, date-range filter, and an
  honest feature-flag surface.

  - New `terminology` config ({ decision, decisions, meeting, meetings }):
    renames every user-facing English string — nav, page titles, section
    headings, stat strip, breadcrumbs, empty states, search placeholder —
    via a uiStrings → terminology → built-in resolution order in t().
  - New `decisionsSlug` config (default 'decisions'): moves the decisions
    index + detail routes and every generated decision link (cards,
    breadcrumbs, prev/next, agenda rows, JSON-LD); the default nav
    derives from terminology + slug when `nav` is unset. The /data/\*.json
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

## 0.3.2

### Patch Changes

- 75b8ab3: Fix dark-mode FOUC: a blocking inline script in <head> now sets
  data-theme from localStorage or prefers-color-scheme before first
  paint, instead of waiting for the theme-toggle island to hydrate.

## 0.3.1

### Patch Changes

- 5f907cd: Fix FOUC on every navigation when a consumer override has external
  @import URLs (e.g. webfonts): they are stripped from the bundled CSS
  and emitted as parallel <head> links instead, so the stylesheet
  applies immediately and fonts swap in non-blocking.

## 0.3.0

### Minor Changes

- 95478a2: Site chrome defaults: ship Meetings + Decisions + About as the
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

### Patch Changes

- 3e0d756: Render action/consideration/approval messages as AsciiDoc: tables
  (|===) and lists now render as real HTML instead of raw pipe-fence
  artifacts. New .edoxen-adoc styles (booktabs tables, lists, code,
  blockquotes) in both themes.

## 0.2.0

### Minor Changes

- 55901f1: Full-data editorial UX: every page now surfaces the complete decision and meeting records with full cross-navigation, restoring the legacy design DNA on the token system.

  - Decision cards: mono identifier, kind, humanized action-verb pills, full formatted date, subject line, 2-line action snippet, and a meeting chip deep-linking to the meeting page. The search island renders the same rich results and gains an action-type facet (top verbs by frequency); /data/decisions.json is extended with actionTypes, status, date, meetingUrn and snippet without breaking the existing contract.
  - Decision detail: reading-progress bar, Home › Decisions › id breadcrumb, metadata badge row (kind, status pill, all identifiers, labeled adoption date, acclamation marker, agenda-item chip to the meeting's agenda anchor, meeting-link badge with icon), serif display title + subject standfirst with working eng/fra LocaleTabs (now wired to the section-tabs island) on every localized field, URN bar with copy, DOI line, and headed sections for Actions (verb pill, localized message, effective date), Considerations, Approvals, Relations (resolved to decision links), Categories, Dates and Reference documents, plus prev/next navigation. JSON-LD preserved.
  - Meeting cards: human date range, status pill, resolved committee code chip, decision count, flag + city/country.
  - Meeting detail: committee resolved three-tier (code + localized name), venue cards (kind, name, address, unlocode, country, map url), officers (role, person, affiliation, contact methods), hosts (register-resolved), schedule with source-offset-correct times, deadlines table, agenda with #agenda-item-{label} anchors whose rows link to the decision they produced (and :target highlight), linked decisions when no agenda exists, declarations, minutes, labeled source documents, and note.
  - Home: editorial hero with data-driven stat strip (decisions / meetings / year span), browse-by-decade into anchored meeting sections, and the latest decisions + recent meetings as full cards.
  - Theme: dotted-grid radial motif on the page canvas (both themes, tinting via the ink token), eyebrow/standfirst/stat-strip/breadcrumb/meta-row primitives, accent action pills, status pills, shared card surface, staggered section entrances (reduced-motion safe), and a --edoxen-font-serif legacy alias for the display face so consumer font overrides keep working. All token-driven; dark parity throughout.

  Backward compatible: payload and endpoint shapes are extended, not changed; no new dependencies.

## 0.1.9

### Patch Changes

- a1963b6: Fix decision/meeting links 404ing on the Astro dev router: links were
  %3A-encoded via encodeURIComponent, which the dev router never decodes.
  All links now go through urnToPath() (raw colons, still RFC-3986-safe
  for genuinely unsafe characters) — detail pages work in dev, preview,
  and production.

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
