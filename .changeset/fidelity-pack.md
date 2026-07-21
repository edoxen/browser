---
'@edoxen/browser': minor
---

Fidelity pack: UN/LOCODE place names, virtual-meeting display, labeled filter groups, and a redesigned About page.

- **UN/LOCODE resolution** (`data.unlocodes`): optional YAML/JSON map of `CODE: { locale: name }`. Meeting `city` codes now render as localized place names ("Stavanger" instead of `NOSVG`) on cards, detail pages, and island results; countries render as locale-aware names via `Intl.DisplayNames` (EN/FR out of the box). Unknown codes fall back to the raw code.
- **Virtual meetings**: a meeting with no city/country is presented as online — 🌐 + localized "Virtual" (`meeting.virtual`) on cards, detail pages, island results, and a "🌐 Virtual" chip (sorted last) in the Location facet.
- **Search filter — labeled facet groups**: meetings mode now groups **Year** chips and **Location** chips (flag + country name) under captions so date and place filters never mix; decisions mode groups **Type** / **Actions** / **Body**. Group labels are i18n'd (`search.group*`, eng + fra).
- **Meetings index**: the island no longer renders a duplicate flat list when idle — the server-rendered decade sections are the browse view; while filtering, the island flags itself (`data-filtering`) and CSS hides the static sections in favor of the matches.
- **About page redesign**: hero subtitle (data-driven count/terminology/committee/first-year), all sections inside a single container card — Edoxen Format (+ explainer paragraph), new **Action Types** pill grid colored semantically from the real data, URN Identifiers as tinted boxes with an RFC 5141 callout, Resolution Lifecycle with accent number circles, and the committee card restored to its full original form (title/scope/facts dl with Secretariat + Chair, 4-up stats grid, link pills).
- **`site.subtitle`**: optional small uppercase line under the header brand title.
