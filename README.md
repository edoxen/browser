# edoxen/browser

Astro-based browser package for [edoxen](https://github.com/edoxen) YAML
data. Drop your `data/` directory in, point `edoxen.config.ts` at it, and
ship a static resolutions archive site.

**Status:** early development. The execution plan lives in
`TODO.browser/` (gitignored). See `CLAUDE.md` for project conventions
and `TODO.browser/REMAINING.md` for current status.

## Monorepo layout

```
edoxen/browser/
├── packages/browser/        # npm: "@edoxen/browser"
├── examples/                # minimal, bilingual, multibody (TODO 17)
├── docs/                    # vitepress docs (TODO 22)
└── TODO.browser/            # execution plan (gitignored)
```

## Quick start (when shipped)

```bash
pnpm create @edoxen/browser my-site
cd my-site
pnpm install
pnpm dev
```

## Related

- [`edoxen/edoxen`](https://github.com/edoxen/edoxen) — Ruby gem,
  canonical JSON Schemas.
- [`edoxen/edoxen-js`](https://github.com/edoxen/edoxen-js) — TS data
  layer (`@edoxen/edoxen`, `@edoxen/astro`, `@edoxen/vue`).
- [Docs](https://www.edoxen.org/) — format documentation.

## License

BSD-2-Clause. See [LICENSE](./LICENSE).
