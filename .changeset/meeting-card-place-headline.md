---
'@edoxen/browser': minor
---

Expose Meeting.type as an i18n'd badge + filterable Type facet.

- `MeetingListItem` carries `type` (MeetingType enum) and `MeetingListFacets` exposes a `types[]` list. `/data/meetings.json` now includes the type per item.
- `MeetingCard` renders a type badge in the meta row (small caps muted label), resolved through the new `meetingTypeLabel()` helper.
- `MeetingDetail` badge row uses the helper instead of the raw enum value.
- The search island adds a Type facet (between Year and Location, meetings mode) — chip labels are humanized enum values; selection round-trips via `#types=plenary,working_group` in the URL hash. The facet text is also part of the search haystack so typing "plenary" filters meetings.
- Card headline is composed from place (flag + "City, Country" or "🌐 Virtual"), with the entity title carried as the link's `title` attribute tooltip. Detail h1, JSON-LD, sitemaps, and `<title>` continue to use the entity title. Falls back to the title when no place data is present.
- New config knob: `terminology.meetingTypes` — per-locale overrides (`{ eng: { plenary: 'Plénière CIML' } }`). Resolution order: consumer override → built-in i18n table (`meeting.type.<value>`) → humanized enum value. The built-in table ships English + French for all 17 MeetingType values; other locales fall back to English until they're translated.

`@edoxen/edoxen` (separate package) gains a symmetric `meetingTypeLabel(type)` helper + `MEETING_TYPE_LABELS` constant, mirroring the existing `actionTypeLabel` pattern.
