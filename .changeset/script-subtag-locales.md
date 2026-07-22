---
'@edoxen/browser': minor
---

Script-subtag locale support.

`normalizeUiLocale` now preserves the script subtag instead of truncating to the first 3 chars. Composite codes like `zho-Hant`, `zh-Hans-SG`, `fr-CA` resolve to distinct buckets so consumers can register Simplified + Traditional as separate routed locales (`/zho-Hans/…`, `/zho-Hant/…`).

`t()`, `meetingTypeLabel()`, and `isRtl()` walk a fallback chain (`zho-hant` → `zho` → English), so script-specific overrides win, the base-language built-in is the next fallback, then English.

### Changed
- `normalizeUiLocale` — new `toCanonical` helper that handles 2-char folding (`en` → `eng`), bare 3-char passthrough, and composite codes (`zh-Hant` → `zho-hant`).
- `t()` — walks the locale chain (`localeChain(code)`) so script-bearing locales fall back to the base language before English.
- `meetingTypeLabel()` — walks the same chain for `terminology.meetingTypes` overrides.
- `isRtl()` — walks the chain so `ara-Latn` still resolves to RTL via `ara`.

### Added
- `src/i18n/script-subtag.spec.ts` — 10 tests covering normalization, fallback, per-script override, RTL detection.

### Migration notes
No breaking changes for existing consumers. Bare 3-char codes (`eng`, `fra`) behave identically. 2-char codes (`en`, `fr`) still fold to 3-char. The only behavioral change is that composite codes (`zho-Hant`) no longer collapse to their base — which was the documented limitation this lifts.
