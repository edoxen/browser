# @edoxen/browser — multi-body example

Three bodies (CIML, Conference, DC) with distinct colors. Body badge
on every list item + detail page; search-filter facets by body.

## Notes

- `body_type` is a native gem v1.0 field on Decision + Meeting +
  MeetingSeries. The browser reads it directly.
- `cfg.bodies` declares presentation (name, color, textColor). The
  browser joins `entity.body_type` against this list at render time.
