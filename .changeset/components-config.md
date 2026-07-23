---
'@edoxen/browser': minor
---

Config-driven component layout.

New `components` config block exposes visibility and (for the card meta row) order via three list-shaped fields, each backed by a closed Zod enum for typo safety:

- **`components.meetingCard.metaItems`** — iterates in the configured order. Fully reorderable. Drop an item to hide it. Default: `['date', 'type', 'status', 'committee', 'count']`.
- **`components.meetingDetail.sections`** — visibility filter (`includes()` check). Source order preserved. Default: the 13 sections already on the page.
- **`components.decisionDetail.sections`** — visibility filter. Default: the 8 sections already on the page.

Adding a new meta item type = extending the `MeetingCardMetaItem` union + adding a branch in the renderer. OCP-compliant: the renderer is a generic `.map()` over the configured list, not a switch that grows.

Defaults preserve current behavior — existing consumers see no change unless they opt in.

### Why meetingCard iterates but detail sections only filter

The card meta items are simple inline elements that fit cleanly in a `.map()`. The detail sections are 21 complex blocks with deep conditional logic (resolving committees, three-tier venue resolution, agenda+decisions interplay, etc.). Full reorder for detail sections requires extracting each section to its own component file — tracked separately in https://github.com/edoxen/browser/issues/53.
