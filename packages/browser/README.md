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
- **Search & facets** — client-side search islands over build-time
  JSON payloads. The decisions index offers text search, body/kind/
  action facet chips and an inclusive date-range filter (ISO date or
  bare year); the meetings index offers text search over title,
  committee code and city, with decade/body/country facet chips.
  Filter state round-trips through the URL hash. Works without JS via
  server-rendered list fallbacks.
- **Interface i18n** — 6 built-in UI languages (English, Français, 中文,
  Español, العربية, Русский), overridable and extensible via `uiStrings`.
  Localized routes (`/[lang]/...`) for every non-default locale.
- **Terminology & routing** — call your records what they are
  (`terminology`: "Resolutions", "Acts", …) and serve them from a
  matching route segment (`decisionsSlug`: `/resolutions`). Nav, page
  titles, headings, breadcrumbs, empty states and every decision link
  follow.
- **Warm professional theme** — complete default look (serif display
  headings, warm paper palette, dark mode) driven by `--edoxen-*`
  tokens; re-theme via config or a consumer override stylesheet.
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

Translations live in **YAML files** — one per locale. Translators work
in YAML, not JS literals. Two ways to load them:

**Option A — read the file in your `edoxen.config.ts` (recommended).**
Reference paths you control; the build picks up changes on reload:

```ts
// edoxen.config.ts
import { readFileSync } from 'node:fs'
import { loadYamlTranslations } from '@edoxen/browser'

const deu = loadYamlTranslations(readFileSync('./translations/deu.yaml', 'utf8'))
const zho = loadYamlTranslations(readFileSync('./translations/zho.yaml', 'utf8'))

export default {
  // …
  uiStrings: {
    deu,
    zho,
  },
}
```

**Option B — inline (still works for small overrides).** Use JS object
literals directly when you only need to tweak a handful of strings:

```ts
uiStrings: {
  deu: {
    'nav.home': 'Startseite',
    'nav.decisions': 'Beschlüsse',
    'section.adoptedDecisions': 'Beschlüsse',
  },
}
```

Missing keys fall back to English automatically. See
[`docs/i18n-keys.yaml`](./docs/i18n-keys.yaml) for the **translation
template** — copy the block for your locale, fill in values, save as
`<locale>.yaml`, point `uiStrings` at it. Built-in English + French
ship in [`src/i18n/strings/`](./packages/browser/src/i18n/strings/) as
YAML — translators can read those as worked examples.

YAML escaping rules worth knowing:

- Inside single-quoted scalars, escape a literal `'` by doubling it:
  `'L''archive'`
- Or use double-quoted scalars with backslash escapes: `"L'archive"`
- Unicode is fine in either form: `'Plénière'`, `'全体会议'`

### Terminology — renaming "decisions" and "meetings"

Committees call their records different things (TC 184/SC 4 adopts
"Resolutions"). Set `terminology` once and every user-facing English
string follows — nav, page titles, section headings, the home stat
strip, breadcrumbs, empty states, the search placeholder and the
default nav labels:

```ts
terminology: {
  decision: 'resolution',   // singular
  decisions: 'Resolutions', // plural
  meeting: 'meeting',       // defaults shown
  meetings: 'meetings',
},
decisionsSlug: 'resolutions',
```

Resolution order for each UI string: `uiStrings[locale][key]` →
`terminology` override → built-in locale table. Terminology shapes the
**English** rendering only — other locales keep their built-in
translations unless you override them per-locale via `uiStrings`.

`decisionsSlug` (default `'decisions'`) moves the decisions index and
detail routes — the example above serves `/resolutions` and
`/resolutions/<urn>`. Every generated decision link (cards, detail
pages, breadcrumbs, prev/next, agenda rows, the search island's
results, home "view all", JSON-LD urls) follows the slug, as do the
default nav hrefs. The `/data/*.json` endpoint names stay fixed.

When `nav` is not configured, the default nav (Meetings / Decisions /
About) is derived from `terminology` + `decisionsSlug` — the example
above yields Meetings / Resolutions / About with a `/resolutions` link.

#### `terminology.meetingTypes` — translating meeting type labels

Every meeting carries a `type` from the
[`MeetingType` enum](https://github.com/edoxen/edoxen-model/blob/main/models/meeting_type.lutaml)
(`plenary`, `working_group`, `task_group`, …, 17 values total). The
browser renders this as a small-caps badge on meeting cards + the detail
page header, and as a `Type` facet chip in the search island.

Built-in labels cover **English + French**. Other locales (中文, Español,
العربية, Русский) fall back to English until you translate them.

Translate or override per-locale via `terminology.meetingTypes`:

```ts
terminology: {
  // …decision / decisions / meeting / meetings as above…
  meetingTypes: {
    eng: {
      plenary: 'Plenary',               // override an English label
      working_group: 'Working Group',   // committee-specific phrasing
    },
    fra: {
      plenary: 'Plénière CIML',         // French committee style
      working_group: 'Groupe de travail CIML',
    },
    zho: {                              // Simplified Chinese (简体中文)
      plenary: '全体会议',
      working_group: '工作组',
      subcommittee: '分技术委员会',
      task_group: '任务组',
      ad_hoc: '特设组',
      joint: '联席会议',
      other: '其他',
      // …translate as many of the 17 values as your committee uses
    },
    'zho-Hant': {                       // Traditional Chinese (繁體中文)
      plenary: '全體會議',
      working_group: '工作組',
      subcommittee: '分技術委員會',
      task_group: '任務組',
      ad_hoc: '特設組',
      joint: '聯席會議',
      other: '其他',
    },
  },
},
```

Resolution order for each type value:

1. **`terminology.meetingTypes[locale][type]`** — your per-locale override
2. **Built-in `meeting.type.<value>` string** — English + French ship
   out of the box; partial coverage for other locales
3. **Humanized enum value** — `'working_group'` → `'Working Group'`,
   never throws on data the gem hasn't categorized yet

So a committee whose meetings are commonly styled "Plenary Session" can
override just that one value and inherit the rest. The
[`src/i18n/meeting-types.spec.ts`](packages/browser/src/i18n/meeting-types.spec.ts)
drift guardrail fails the build if the gem adds a `MeetingType` value
that neither your override nor the built-in table covers.

> **Script variants note (e.g. 简体中文 vs 繁體中文)**: the built-in UI
> locale table uses ISO 639-3 codes and `normalizeUiLocale` currently
> truncates any code longer than 3 chars to its first 3 — so `zho-Hant`
> resolves into the same `zho` bucket as Simplified. The translation
> blocks above illustrate the labels you'd supply; serving both
> simultaneously as distinct routed locales needs a small change to
> `normalizeUiLocale` (preserve the script subtag) plus a `UiLocale`
> type widening. File a feature request if you need both served as
> separate `/zho-Hans/…` and `/zho-Hant/…` routes.

The same data drives the `Type` facet in the search island (chip labels
humanize on the client; pass localized labels to the island via
`data-*` attributes if you need them in non-English UIs).

## Theming

The default look is **elegant professional warm**: a warm paper canvas
(`#faf8f6`), warm charcoal ink, a serif display face for the site title
and headings (system stacks only — Georgia/Palatino/Iowan, no webfont
download), a deep warm teal accent (`#0f766e`), hairline borders, and
soft card shadows. It is complete out of the box — no consumer CSS
required — and meets WCAG AA contrast in both light and dark mode.

### How the cascade works

1. `generateCssTokens(theme)` emits a `:root` block of `--edoxen-*`
   custom properties from your config, inlined first in `<head>`.
2. The package's `base.css` consumes those tokens via
   `var(--edoxen-x, fallback)` — it never re-declares them, so config
   always wins over the stylesheet fallbacks.
3. Your override stylesheet (see below) loads last and wins everything.

### Token reference

Set via `theme.*` in `edoxen.config.ts` (emitted as `--edoxen-color-*`
etc.):

| Config key | Token | Light default | Dark default | Used for |
| --- | --- | --- | --- | --- |
| `theme.primary` | `--edoxen-color-primary` | `#1c1917` | `#f5f5f4` | headings, brand |
| `theme.accent` | `--edoxen-color-accent` | `#0f766e` | `#2dd4bf` | links, interactive |
| `theme.surface` | `--edoxen-color-surface` | `#ffffff` | `#292524` | cards, panels |
| `theme.background` | `--edoxen-color-background` | `#faf8f6` | `#1c1917` | page canvas |
| `theme.text` | `--edoxen-color-text` | `#292524` | `#e7e5e4` | body text |
| `theme.muted` | `--edoxen-color-muted` | `#78716c` | `#a8a29e` | secondary text |
| `theme.border` | `--edoxen-color-border` | `#e7e5e4` | `#44403c` | hairlines |
| `theme.success` | `--edoxen-color-success` | `#15803d` | — | status tints |
| `theme.warning` | `--edoxen-color-warning` | `#b45309` | — | status tints |
| `theme.danger` | `--edoxen-color-danger` | `#b91c1c` | — | status tints |
| `theme.fontFamily` | `--edoxen-font-sans` | system-ui stack | — | body font |
| `theme.radius` | `--edoxen-radius-sm` | `0.5rem` | — | corner radius |

Dark values come from `theme.dark.*` and apply under
`[data-theme="dark"]` (the header toggle persists the choice in
`localStorage`; the OS preference is the default). Status colors have
no dark override — they are only used in tinted chips that work in
both themes.

Additional hooks the config cannot set directly are available through
`theme.customProperties` (each entry becomes a `--edoxen-*` token):

| Token | Fallback in base.css | Used for |
| --- | --- | --- |
| `--edoxen-font-display` | Iowan/Palatino/Georgia serif stack | title + headings |
| `--edoxen-font-mono` | ui-monospace stack | URNs, dates, code |
| `--edoxen-spacing-page` | `1.5rem` | page side padding |
| `--edoxen-shadow-sm` / `--edoxen-shadow-md` | warm soft shadows | cards, hover lift |

```ts
theme: {
  accent: '#9a3412',
  customProperties: {
    fontDisplay: "'Fraunces', Georgia, serif",
  },
}
```

### Stylesheet override (`override.css` / `theme.customCss`)

For anything tokens cannot express, drop a stylesheet at
`src/styles/override.css` in your site root (convention), or point
`theme.customCss` at any path (resolved against the site root). The
file is bundled **after** the package's `base.css`, so it wins the
cascade — this is where webfont imports, token re-points, and bespoke
rules live:

```css
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400..700&display=swap');

:root {
  --edoxen-font-display: 'Fraunces', Georgia, serif;
}

.edoxen-header__brand {
  letter-spacing: -0.025em;
}
```

Works identically in both consumption modes (integration and
standalone). `examples/standalone/src/styles/override.css` is a
commented reference implementation.

### What the examples demonstrate

| Example | Demonstrates |
| --- | --- |
| `examples/minimal` | The default theme, untouched — one config, no CSS. |
| `examples/standalone` | Full showcase: explicit light+dark palette, radius, logos, social, `terminology` ("Resolutions") + `decisionsSlug` (`/resolutions`), pagination, and the `src/styles/override.css` convention (webfont + token overrides + custom rule). Standalone mode: no `astro.config`. |
| `examples/bilingual` | Localized routes (`/fr/...`) with the default theme. |
| `examples/multibody` | Multiple bodies with per-body badge colors. |

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
| `data.committee` | path | — | optional MeetingSeries document for the owning body; renders the committee-facts section on `/about` (name, description, term, hosts, contact, and any `extensions[]` attributes as stats/links) |
| `data.agendas` / `data.minutes` | path | — | reserved; not loaded |
| `output.dir` | string | `'./dist'` | build output directory (used by the CLI in standalone mode; mode A uses Astro's own `outDir`) |
| `output.sitemap` / `output.robots` | boolean | `true` | reserved; sitemap is wired in the Astro configs, not via this flag |
| `bodies` | array | `[{ code: 'committee', name: 'Committee' }]` | body badge labels/colors |
| `locales` | array | `[{ code: 'en', label: 'English', routePrefix: '' }]` | UI locales; non-empty `routePrefix` adds `/[lang]/` routes |
| `theme` | object | defaults | color/font/radius tokens, `customProperties`, `customCss` override — see Theming |
| `nav` | array | derived | header nav items (`label`, `href`, optional `locale`); default is Meetings + Decisions + About, labelled/linked from `terminology` + `decisionsSlug` |
| `social` | array | `[]` | footer social links |
| `terminology` | object | `decision(s)` / `meeting(s)` | what your records are called — renames every user-facing English string (see Terminology) |
| `decisionsSlug` | string | `'decisions'` | route segment for the decisions index + detail pages; every decision link follows (see Terminology) |
| `features.search` | boolean | `true` | `false` hides the search-filter island on the decisions + meetings indexes (server-rendered lists remain) |
| `features.timeline` | boolean | `true` | `false` hides the decade scroller on the meetings index |
| `features.urnCopy` | boolean | `true` | `false` hides the URN copy island on detail pages |
| `features.doi` | boolean | `false` | accepted; DOIs render when present in data regardless |
| `features.darkMode` | boolean | `true` | `false` hides the theme toggle and pins the light theme |
| `features.printStyles` | boolean | `true` | `false` omits the print stylesheet from the output |
| `features.pagination` | object | `{ enabled: false, pageSize: 50 }` | when enabled, the search island caps rendered results at `pageSize` behind a **'Show more'** control — full numbered pagination is not implemented; the noscript fallback always lists everything |
| `features.home` | object | `{ stats: true, recentDecisions: 5, recentMeetings: 3, browseByDecade: true }` | home page: stat strip on/off, recent-item counts (`0` hides the section), browse-by-decade section on/off |
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
