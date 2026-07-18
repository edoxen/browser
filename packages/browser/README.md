# `@edoxen/browser`

Astro-based static site generator for [edoxen](https://github.com/edoxen)
YAML data: point it at decisions, meetings, and register YAML and ship a
resolutions archive site — list and detail pages, search, facets, i18n,
SEO, and JSON data endpoints.

## Features

- **Resolutions & meetings** — list and detail pages generated from
  edoxen YAML (per-field `LocalizedString[]`, `scheduled_date_range`).
- **Meeting detail pages** — scheduled/occurred date ranges,
  declarations, venue, officers, schedule components, agenda table,
  deadlines, minutes sections, adopted decisions, and source documents.
- **Register datasets** — contacts, venues, and bodies registers with
  three-tier reference resolution (inline → meeting-scoped `local_ref`
  → register `ref`) on meeting pages.
- **Search & facets** — client-side search island over a build-time
  JSON payload, with body/kind/year facet chips. Works without JS via a
  server-rendered list fallback.
- **Interface i18n** — 6 built-in UI languages (English, Français, 中文,
  Español, العربية, Русский), overridable and extensible via `uiStrings`.
  Localized routes (`/[lang]/...`) for every non-default locale.
- **Theme system** — colors, fonts, radius via CSS custom properties.
  Light/dark mode toggle.
- **SEO** — JSON-LD (`Legislation` / `Event`), Open Graph, canonical
  URLs, sitemap.
- **JSON data endpoints** — `/data/decisions.json`,
  `/data/meetings.json`, `/data/registers.json` are served in dev and
  written into the build output for client-side use.
- **Two consumption modes** — embed as an Astro integration, or run
  standalone from just a config file and data (see below).

## Installation

```bash
pnpm add @edoxen/browser
```

Peer dependencies you need in an integration (mode A) app: `astro`,
`@edoxen/edoxen`. In standalone mode (mode B) the CLI brings its own
Astro pipeline.

## Mode A — Astro integration

Use this when you already have (or want) your own Astro app:

```ts
// edoxen.config.ts
import { defineConfig } from '@edoxen/browser/config'

export default defineConfig({
  site: {
    title: 'My Committee Resolutions',
    description: 'Resolutions and meetings of My Committee.',
    url: 'https://example.org',
  },
  data: {
    decisions: './data/decisions',
    meetings: './data/meetings',
  },
})
```

```ts
// astro.config.ts
import { defineConfig } from 'astro/config'
import sitemap from '@astrojs/sitemap'
import browser from '@edoxen/browser/integration'
import cfg from './edoxen.config'

export default defineConfig({
  site: cfg.site.url,
  base: cfg.site.basePath === '/' ? undefined : cfg.site.basePath,
  integrations: [browser({ config: cfg }), sitemap()],
})
```

Then `astro dev` / `astro build` as usual. The integration injects all
routes (home, decisions, meetings, about, 404, plus `/[lang]/...`
variants for every non-default locale), loads and validates the data,
and serves the JSON endpoints. See `examples/minimal` and
`examples/bilingual`.

## Mode B — standalone (no Astro app)

A downstream repo needs only a config file and data — no
`astro.config.ts`, no `src/`:

```
my-archive/
├── edoxen.config.ts     # same shape as mode A
├── data/
│   ├── decisions/
│   ├── meetings/
│   └── registers/
└── package.json
```

```json
{
  "scripts": {
    "dev": "edoxen-browser dev",
    "build": "edoxen-browser build",
    "preview": "edoxen-browser preview"
  },
  "dependencies": {
    "@edoxen/browser": "^0.1.6"
  }
}
```

The CLI runs the full Astro pipeline against the package's bundled
standalone root, bridging your resolved config (site, base path, output
dir → `./dist` under your repo) and absolute data paths. See
`examples/standalone`.

`edoxen-browser build` detects the layout automatically: when an
`astro.config.*` exists in the working directory it defers to the bare
`astro` CLI (mode A behavior); otherwise it builds standalone.

## CLI reference

```
edoxen-browser <command> [options]

Commands:
  validate       Validate the data + config without building (strict).
  lint           Structural lint (duplicate URNs, broken relations).
  check          validate + lint in one shot.
  config         Print the resolved config as JSON.
  build          Build the static site.
  dev            Start the Astro dev server.
  preview        Preview the built site.

Options:
  --config <path>   Path to edoxen.config.ts (default: ./edoxen.config.ts)
  --cwd <path>      Working directory (default: process.cwd())
  --strict          Treat warnings as errors (lint only).
  --port <n>        Port for dev/preview (default: 4321).
  --host [addr]     Expose dev/preview server on the network.
```

Note: `build`/`dev`/`preview` warn on schema validation errors and
proceed (the Ruby edoxen gem is the canonical validator and the JS
schema may lag); `validate` stays strict.

## Data

All data keys accept a single YAML file or a directory of `*.yaml`
files:

```ts
data: {
  decisions: './data/decisions',        // required
  meetings: './data/meetings',          // optional
  contacts: './data/registers/contacts.yaml',  // optional register
  venues: './data/registers/venues.yaml',      // optional register
  bodies: './data/registers/bodies.yaml',      // optional register
}
```

### Registers and reference resolution

Registers are scoped collections of reusable entities
(`ContactRegister` / `VenueRegister` / `BodyRegister` from
`@edoxen/edoxen`). Meetings (and other documents) can reference
register entries instead of inlining them:

```yaml
venues:
  - ref: urn:edoxen:venue:example:geneva-cicg   # → venues register
committee:
  ref: tc-154                                    # → bodies register (code)
```

Meeting pages resolve references the same way the Ruby gem's
`EntityResolver` does, with graceful fallback to inline data:

1. **Inline** — the entity carries full data (no `ref`/`local_ref`).
2. **`local_ref`** — looked up in the meeting's own collections
   (e.g. `meeting.venues`, matched by `urn`; bodies matched by `code`).
3. **`ref`** — looked up in the global register (contacts/venues by
   `urn`; bodies by `code` OR `ref`, mirroring
   `BodyRegister#find_by_urn`).

Resolved venues and committees render on the meeting detail page;
unresolvable references fall back to whatever inline data is present.

`data.agendas`, `data.minutes`, and `data.committee` are accepted by
the config schema for forward compatibility but are **not currently
loaded** — agendas and minutes belong inside meeting documents.

## JSON data endpoints

Both dev server and build output expose:

- `GET /data/decisions.json` — decision list items (plain-string
  titles) + facet values, consumed by the search island.
- `GET /data/meetings.json` — meeting list items + facet values.
- `GET /data/registers.json` — `{ contacts, venues, bodies }` register
  documents (`null` when not configured).

Under a `site.basePath` deployment the endpoints live under the prefix
(e.g. `/resolutions/data/decisions.json`).

## Internationalization

### Built-in languages

English (`eng`), French (`fra`), Chinese (`zho`), Spanish (`spa`),
Arabic (`ara`), Russian (`rus`). Enable a subset via `locales`:

```ts
locales: [
  { code: 'eng', label: 'English', routePrefix: '' },
  { code: 'fra', label: 'Français', routePrefix: 'fra' },
]
```

Every locale with a non-empty `routePrefix` gets its own URL prefix
(e.g. `/fra/decisions/...`). Decision detail pages show title-language
tabs when a decision carries multiple spellings.

### Custom translations

Provide translations via `uiStrings`; missing keys fall back to
English. See [`docs/i18n-keys.yaml`](./docs/i18n-keys.yaml) for the full
list of translatable strings — including section titles such as
`section.adoptedDecisions` ("Resolutions"), which is how you rename the
adopted-decisions section on meeting pages.

```ts
uiStrings: {
  deu: {
    'nav.home': 'Startseite',
    'nav.decisions': 'Beschlüsse',
    'section.adoptedDecisions': 'Beschlüsse',
  },
}
```

## Theming

All visual tokens are CSS custom properties, overridable via `theme`
config or plain CSS:

```ts
theme: {
  primary: '#0a2540',
  accent: '#0d7377',
  // ... see src/config/schema.ts for all options
}
```

## Config reference

| Key | Type | Default | Notes |
| --- | --- | --- | --- |
| `site.title` | string | — | required |
| `site.description` | string | `''` | meta description fallback |
| `site.url` | string (URL) | — | required; used for canonical/OG/sitemap |
| `site.basePath` | string | `'/'` | deploy prefix, e.g. `/resolutions/` |
| `site.locale` | string | `'en'` | default locale (ISO 639-1/3) |
| `data.decisions` | path | — | required |
| `data.meetings` | path | — | optional |
| `data.contacts` / `data.venues` / `data.bodies` | path | — | optional register datasets |
| `data.agendas` / `data.minutes` / `data.committee` | path | — | reserved; not loaded |
| `output.dir` | string | `'./dist'` | build output directory (used by the CLI in standalone mode; mode A uses Astro's own `outDir`) |
| `output.sitemap` / `output.robots` | boolean | `true` | reserved; sitemap is wired in the Astro configs, not via this flag |
| `bodies` | array | `[{ code: 'committee', name: 'Committee' }]` | body badge labels/colors |
| `locales` | array | `[{ code: 'en', label: 'English', routePrefix: '' }]` | UI locales; non-empty `routePrefix` adds `/[lang]/` routes |
| `theme` | object | defaults | color/font/radius tokens |
| `nav` | array | `[]` | header nav items (`label`, `href`, optional `locale`) |
| `social` | array | `[]` | footer social links |
| `features` | object | defaults | feature flags; only `darkMode` is currently wired — the rest (`search`, `timeline`, `urnCopy`, `doi`, `printStyles`, `pagination`) are accepted but not yet honored |
| `uiStrings` | record | `{}` | per-locale UI string overrides |

## Known limitations

The package is **config-driven**, not **component-driven**. It does
not yet provide:

- Component slot/override mechanism (cannot swap `DecisionList` for a
  custom component without forking)
- Render hooks or lifecycle callbacks
- Programmatic data access API (querying decisions from consumer code)
- Per-component behavior props (`pageSize`, `sortBy`, filter presets)

Consumers who need full layout/behavior control should fork the
components or wait for the planned component-override API.

## Development

```bash
pnpm install
pnpm -F @edoxen/browser test        # unit tests (vitest)
pnpm typecheck                      # tsc across the workspace
pnpm test:e2e                       # playwright suite (needs chromium:
                                    #   pnpm -F @edoxen/browser exec playwright install chromium)
```

## License

BSD-2-Clause.
