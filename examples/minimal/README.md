# @edoxen/browser — minimal example

Single-locale, decisions + meetings only. Demonstrates the smallest
possible consumer setup.

## Layout

```
examples/minimal/
├── data/
│   ├── decisions/sample.yaml
│   ├── meetings/sample.yaml
│   └── redirects.yaml      # optional legacy-URL redirects
├── edoxen.config.ts        # site config (single SSOT)
├── astro.config.ts         # astro + browser() integration
└── package.json
```

## Run

```bash
pnpm install
pnpm -F @edoxen/browser-example-minimal dev
```

## What this exercises

- All `@edoxen/browser` default routes (injected automatically by the
  integration): `/`, `/decisions`, `/decisions/[urn]`, `/meetings`,
  `/meetings/[urn]`, `/about`, `/404`.
- Schema validation (fails the build if `data/` is invalid).
- Legacy URL redirects via `data/redirects.yaml`.
- Sitemap via `@astrojs/sitemap`.
- Islands: theme-toggle, urn-copy, search-filter, section-tabs,
  decade-scroller, print-button.

## Extend

- Add a `data/translations.fr.yaml` and a `/fr/` locale to make this
  bilingual (see `examples/bilingual/`).
- Add multiple `bodies` to make this multi-body (see `examples/multibody/`).
