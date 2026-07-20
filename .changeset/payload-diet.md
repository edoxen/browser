---
"@edoxen/browser": patch
---

Slim the decisions index and /data/decisions.json: lean island items
(subject dropped, snippets clamped server-side) and a 200-card cap on
the noscript fallback list with a note — the index no longer ships
the whole archive twice (~3.8MB → ~1.1MB raw, ~400KB → ~140KB
gzipped). Font preconnects added for Google Fonts overrides.
