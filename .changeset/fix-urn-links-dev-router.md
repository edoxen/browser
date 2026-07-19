---
"@edoxen/browser": patch
---

Fix decision/meeting links 404ing on the Astro dev router: links were
%3A-encoded via encodeURIComponent, which the dev router never decodes.
All links now go through urnToPath() (raw colons, still RFC-3986-safe
for genuinely unsafe characters) — detail pages work in dev, preview,
and production.
