# `@edoxen/browser`

Astro-based browser for [edoxen](https://github.com/edoxen) YAML data.

**Status:** early development. Not yet published to npm.

## Goal

A single Astro-based browser that combines every feature of the three
existing downstream sites (tc184sc4, OIML, tc154). Drop YAML into
`data/`, point `edoxen.config.ts` at it, ship a static site.

## Installation (when shipped)

```bash
pnpm add @edoxen/browser astro @edoxen/edoxen
```

## Usage (sketch — full docs land in TODO 22)

```ts
// edoxen.config.ts
import { defineConfig } from '@edoxen/browser/config'

export default defineConfig({
  site: {
    title: 'My Committee',
    url: 'https://example.org',
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

## License

BSD-2-Clause.
