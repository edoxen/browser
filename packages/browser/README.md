# `@edoxen/browser`

Astro-based browser for [edoxen](https://github.com/edoxen) YAML data.

Drop YAML into `data/`, point `edoxen.config.ts` at it, ship a static
site with resolutions, meetings, schedules, and full multilingual
support.

## Features

- **Resolutions & meetings** — list and detail pages generated from
  edoxen v3.0 YAML (per-field `LocalizedString[]`, `scheduled_date_range`).
- **Meeting schedules** — renders `components[]` with `starts_at`/`ends_at`
  as a day-grouped timetable with timezone labels.
- **AsciiDoc rendering** — action messages, considerations, and subject
  fields are converted from AsciiDoc to HTML at build time (tables,
  inline formatting, source blocks).
- **UN/LOCODE hydration** — meeting venues like `JPNGS, JP` are resolved
  to `Nagasaki, Japan` automatically. Country names localized per
  locale via `Intl.DisplayNames`.
- **Interface i18n** — 6 built-in UI languages (English, Français, 中文,
  Español, العربية, Русский) with RTL support. Add any language via
  `uiStrings`. Language switcher in the header.
- **Configurable terminology** — call them "Resolutions", "Decisions",
  "Recommendations" — your dataset, your labels.
- **Theme system** — colors, fonts, radius via CSS custom properties.
  Light/dark mode toggle.
- **View transitions** — smooth page navigation with no flash of
  unstyled content.
- **SEO** — JSON-LD (`Legislation` / `Event` schemas), Open Graph,
  canonical URLs, sitemap.

## Installation

```bash
pnpm add @edoxen/browser astro @edoxen/edoxen
```

## Quick start

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
    decisions: './data/resolutions',
    meetings: './data/meetings',
  },
  terminology: {
    decisionLabel: 'Resolution',
    decisionPluralLabel: 'Resolutions',
  },
})
```

```ts
// astro.config.ts
import { defineConfig } from 'astro/config'
import browser from '@edoxen/browser'

export default defineConfig({
  integrations: [browser()],
})
```

## Internationalization

### Built-in languages

English (`eng`), French (`fra`), Chinese (`zho`), Spanish (`spa`),
Arabic (`ara`, RTL), Russian (`rus`). Enable a subset via `locales`:

```ts
locales: [
  { code: 'eng', label: 'English', routePrefix: '' },
  { code: 'fra', label: 'Français', routePrefix: '/fra' },
  { code: 'ara', label: 'العربية', routePrefix: '/ara', rtl: true },
]
```

The language switcher in the header lets users navigate between locales.
Each locale gets its own URL prefix (e.g. `/fra/decisions/...`).

### Adding a custom language

Provide translations via `uiStrings`. Keys not provided fall back to
English automatically. See [`docs/i18n-keys.yaml`](./docs/i18n-keys.yaml)
for the full list of 54 translatable strings.

```ts
locales: [
  { code: 'eng', label: 'English', routePrefix: '' },
  { code: 'deu', label: 'Deutsch', routePrefix: '/deu' },
],
uiStrings: {
  deu: {
    'nav.home': 'Startseite',
    'nav.decisions': 'Beschlüsse',
    'section.venue': 'Veranstaltungsort',
    // ... see docs/i18n-keys.yaml for all keys
  },
}
```

### RTL languages

Set `rtl: true` on any locale entry. The `<html dir="rtl">` attribute
is applied automatically.

## Terminology

Different datasets call their entities different things. Use
`terminology` to match your domain:

```ts
terminology: {
  decisionLabel: 'Resolution',        // singular, shown as a badge
  decisionPluralLabel: 'Resolutions', // plural, shown in back-links
  meetingLabel: 'Meeting',
  meetingPluralLabel: 'Meetings',
}
```

## Theming

All visual tokens are CSS custom properties, overridable via `theme`
config or plain CSS:

```ts
theme: {
  primary: '#0a2540',
  accent: '#0d7377',
  surface: '#ffffff',
  background: '#faf9f7',
  // ... see src/config/schema.ts for all options
}
```

## Data format

The browser reads edoxen v3.0 YAML — per-field `LocalizedString[]`
(`{ spelling, value }`), `scheduled_date_range`, native `body_type`.
See the [edoxen model](https://github.com/edoxen/edoxen) for schema
details. Test fixtures are in `test/fixtures/`.

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

## License

BSD-2-Clause.
