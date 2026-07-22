# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working
with code in this repository.

## What this repo is

`edoxen/browser` is a **greenfield Astro-based browser package** for the
edoxen information model. When finished it will ship on npm as
`@edoxen/browser` — a single static-site browser that combines every
feature of the three existing downstream sites (tc184sc4, OIML, tc154),
so a new consumer only has to drop YAML into `data/`, point
`edoxen.config.ts` at it, and ship.

**Status:** planning. No source code exists yet. The execution plan
lives in `TODO.browser/` (gitignored — see below). Work proceeds through
TODOs `01` → `24` in dependency order; see
`TODO.browser/24-execution-order.md`.

## The plan is the source of truth

`TODO.browser/` is a 25-file execution plan. It is **gitignored and
never committed** — it's working scratch for the build. Always read the
relevant TODO before starting work:

- `TODO.browser/00-overview.md` — architecture, scope, non-goals,
  separation guarantees, release cadence.
- `TODO.browser/24-execution-order.md` — dependency graph, critical
  path, parallelism opportunities, blockers.
- `TODO.browser/23-verification-and-acceptance.md` — cross-cutting test
  gates that apply to every TODO.

When in doubt about what a TODO means, read the TODO file. Don't
improvise.

## Architecture (planned)

```
edoxen/browser/                           # pnpm-workspace monorepo
├── packages/browser/                     # npm: "@edoxen/browser"
│   ├── src/
│   │   ├── astro/                        # .astro components, layouts, pages
│   │   ├── islands/                      # client-side web components
│   │   ├── config/                       # Zod schema for EdoxenConfig
│   │   ├── data/                         # build-time data layer (wraps @edoxen/edoxen)
│   │   ├── i18n/                         # bilingual corpus + helpers
│   │   ├── body/                         # multi-body support
│   │   ├── theme/                        # CSS custom property bridge (no Tailwind)
│   │   └── integration.ts                # Astro integration entry
│   ├── styles/                           # scoped base CSS (no Tailwind config owned here)
│   └── astro.config.ts
├── examples/
│   ├── minimal/                          # one-language, decisions-only
│   ├── bilingual/                        # EN/FR like OIML
│   └── multibody/                        # CIML + Conference + DC
├── docs/                                 # vitepress docs site
├── scripts/scaffold.ts                   # `pnpm create @edoxen/browser`
├── TODO.browser/                         # gitignored plan
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

See `TODO.browser/00-overview.md` § Architecture for the full file tree.

### Separation guarantees (do not violate)

1. **Config is SSOT.** `edoxen.config.ts` (consumer-side) — colors,
   nav, social, body types, locales, site URL, base path. Zod-validated.
2. **Branding via config keys.** Logos live in consumer `public/`,
   referenced by `theme.logos.primary` / `theme.logos.footer`. No logo
   paths hard-coded in components.
3. **Theming via CSS custom properties.** Every component uses
   `--edoxen-*`. Default tokens in `theme/tokens.css`. Consumer overrides
   via plain CSS. The library **does not own a Tailwind config** —
   consumers may bring their own.
4. **Data is YAML only.** No parsing-from-filename, no derivation, no
   backcompat. If it isn't in the YAML, it isn't shown.
5. **Validation fails the build.** `edoxen validate` runs JSON Schema
   (from the gem) via `@edoxen/edoxen`. No silent drops.

### Non-goals

- **Vue is not the target.** Astro is. Vue adapters stay in
  `@edoxen/vue` for existing consumers until they migrate.
- **No committee-management UI.** tc154's group/member/standards/projects
  modules stay in tc154 (or move to a separate `@edoxen/iso-tc` package
  later). Only the edoxen-generic subset ships here.
- **Read-only browsing.** No authoring/editor UI.

## Sibling repos

| Repo | Path | Role |
|---|---|---|
| `edoxen/edoxen` | `~/src/edoxen/edoxen/` | Ruby gem — canonical YAML schemas (`schema/edoxen.yaml`, `schema/meeting.yaml`), CLI, fixtures in `spec/fixtures/`. **The browser's bundled schemas must be byte-equal to the gem's.** |
| `edoxen/edoxen-js` | `~/src/edoxen/edoxen-js/` | TS monorepo — `@edoxen/edoxen` (loaders, transforms, validation, URN, i18n core, body registry), `@edoxen/astro` (integration primitives), `@edoxen/vue` (Vue adapter for existing consumers). |
| `edoxen/edoxen.github.io` | `~/src/edoxen/edoxen.github.io/` | Docs site, served at `https://www.edoxen.org/` (custom domain; `edoxen.github.io` 301-redirects to it). The browser's About page links to `https://www.edoxen.org/`. |
| `isotc184sc4/resolutions` | `~/src/isotc184sc4/resolutions/` | **Canary** for migration (TODO 18). 86 decision fixtures in `plenary/*.yaml`. |
| `oimlsmart/resolutions-data` | `~/src/oimlsmart/resolutions-data/` | **Richest feature set.** First-class `resolutions/`, `meetings/`, `agendas/`, `minutes/`. Bilingual EN/FR, multi-body. Migration target in TODO 19. |
| `isotc154/www.isotc154.org` | `~/src/isotc154/www.isotc154.org/` | **Richest existing site (~20K LOC).** Source of `createCollection`, `useFilteredCollection`, `ScheduleCalendar`, `ReferenceDocuments`, `PrevNextNav`. tc154-specific UI stays in tc154. Migration target in TODO 20. |

## Build, test, lint (target commands)

These land with TODO 01 and grow as features arrive:

```bash
pnpm install                              # first-time setup
pnpm dev                                  # dev server (any workspace)
pnpm -F @edoxen/browser dev               # package playground only
pnpm typecheck                            # tsc --noEmit across workspaces
pnpm test                                 # vitest (unit + integration)
pnpm -F @edoxen/browser run check:schema  # byte-equality vs gem schemas
pnpm -F "./examples/*" build              # build all 3 examples
pnpm -F "./examples/*" exec playwright test   # e2e smoke per example
pnpm changeset                            # add a changeset before merging
```

## Hard rules (project-specific)

These extend the global rules in `~/.claude/CLAUDE.md`. They are
non-negotiable.

### Wire shape and data

- **v2.2 wire shape only.** No backcompat shims for v0.7.x or v2.1
  data. If the YAML doesn't have a field, the page doesn't render it.
- **No parsing from filenames.** No derivation. No fallbacks.
- **Wire names are `snake_case`.** This mirrors the gem — even when
  LUTAML notation uses camelCase, the YAML wire form is `snake_case`.
- **No hand-rolled serialization.** All model (de)serialization goes
  through the framework — `lutaml-model` in Ruby, `json-schema-to-typescript`
  in TS. Never write `to_h` / `from_h` / `to_json` / `from_json` on a
  model class.
- **Schemas are byte-equal to the gem.** `packages/browser/data/schemas/*.yaml`
  must match `~/src/edoxen/edoxen/schema/*.yaml` byte-for-byte. The
  schema-sync spec enforces this in CI.

### Specs and tests

- **No `double()` in specs.** Use real instances and real fixtures from
  `~/src/edoxen/edoxen/spec/fixtures/`.
- **Test behavior, not interactions.** Assert on output and state, not
  on "should have received" method call counts.

### Git discipline

- **No commits to `main`.** Never `git commit` while on `main`.
- **No push to `main`.** Never `git push origin main`.
- **No tag pushes.** Tags are releases — the user decides when and what.
- **No force-push.** Use `--force-with-lease` only to fix your own
  branch, never on shared branches.
- **All changes via PR.** Branch → push → open PR. Every time.
- **No AI attribution.** No `Co-authored-by:` trailers, no "Generated
  with Claude" footers, no AI emoji. Commits should look like normal
  human work.

### Files

- **Never delete source files.** Flag and ask; never `rm` what you
  didn't create. "Unused by code" does not mean dispensable.
- **`TODO.browser/` is gitignored.** Never commit TODO files. Verify
  with `git status` before any commit.
- **No backcompat cleanup as a side quest.** If the user asked for a
  bug fix, fix the bug. Don't also tidy nearby code.

### UI specifics

- **Established year is plain text.** No count-up animation, no
  `Intl.NumberFormat`.
- **Edoxen link goes to `https://www.edoxen.org`** (canonical custom domain; `edoxen.github.io` redirects to it).

## Verification gates (every TODO is "done" only when)

1. `pnpm typecheck` passes.
2. `pnpm test` (unit + integration) passes.
3. `pnpm -F @edoxen/browser run check:schema` passes (byte-equality
   with gem schemas).
4. All 3 `examples/` build clean.
5. Playwright e2e smoke passes on at least one example.
6. Changeset added.
7. No AI attribution in the commit message.

See `TODO.browser/23-verification-and-acceptance.md` for the full
matrix including bundle budgets, round-trip fixture coverage, and lychee
baselines per downstream site.

## Critical path to first npm publish

```
01 bootstrap → 02 config → 03 data → 05 build → 06 routing
            → 09 home → 17 examples → 18 tc184sc4 canary → 21 npm publish
```

TODO 21 (`npm publish` for `@edoxen/browser@0.1.0`) is blocked on TODO
18 (tc184sc4 migration as the canary). Do not attempt to publish before
the canary lands.

## Before starting TODO 01

Verify these are still true (don't assume — check):

- `@edoxen/edoxen` is published at `^0.1.x` (or usable as `workspace:*`
  from `edoxen-js`).
- `@edoxen/astro` is at `^0.1.x` (or usable as `workspace:*`).
- The gem's `schema/edoxen.yaml` and `schema/meeting.yaml` are at
  v2.1.3+ (no duplicate keys, camelCase wire names for
  `ExtensionAttribute`).
- tc184sc4 fixtures all validate against the gem —
  `bundle exec exe/edoxen validate "spec/fixtures/*.yaml"` from
  `~/src/edoxen/edoxen/` is clean.

If any are false, fix them before starting TODO 01.
