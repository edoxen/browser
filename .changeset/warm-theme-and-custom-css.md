---
"@edoxen/browser": patch
---

Consumer stylesheet override + warm default theme revamp.

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
