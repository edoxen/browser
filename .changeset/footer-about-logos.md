---
'@edoxen/browser': minor
---

Restore the committee-driven site footer and About sections, and fix logo 404s on subpath deployments.

- **Footer**: when a committee MeetingSeries is configured (`data.committee`), the footer now renders the original 4-column grid — brand (logo, committee name, tagline, scope), Committee facts (Secretariat, Chair, Established, Standards published, Members P/O), Explore (nav links), and Links (http-valued extension attributes) — plus a © bottom bar. Bare host refs (e.g. `ansi`) are humanized (`ANSI`). Sites without a committee keep the previous minimal footer.
- **About**: the committee section is back to identity + scope + facts only (people and external links moved to the footer). New data-driven sections: URN Identifiers (patterns + live examples from the actual dataset, RFC 5141 note) and Resolution Lifecycle (Considerations / Actions / Approvals).
- **Logos**: root-absolute `theme.logos.*` paths are now prefixed with `site.basePath`, fixing 404s on GitHub Pages project sites and other subpath hosts.
