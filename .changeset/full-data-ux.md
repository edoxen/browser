---
"@edoxen/browser": minor
---

Full-data editorial UX: every page now surfaces the complete decision and meeting records with full cross-navigation, restoring the legacy design DNA on the token system.

- Decision cards: mono identifier, kind, humanized action-verb pills, full formatted date, subject line, 2-line action snippet, and a meeting chip deep-linking to the meeting page. The search island renders the same rich results and gains an action-type facet (top verbs by frequency); /data/decisions.json is extended with actionTypes, status, date, meetingUrn and snippet without breaking the existing contract.
- Decision detail: reading-progress bar, Home › Decisions › id breadcrumb, metadata badge row (kind, status pill, all identifiers, labeled adoption date, acclamation marker, agenda-item chip to the meeting's agenda anchor, meeting-link badge with icon), serif display title + subject standfirst with working eng/fra LocaleTabs (now wired to the section-tabs island) on every localized field, URN bar with copy, DOI line, and headed sections for Actions (verb pill, localized message, effective date), Considerations, Approvals, Relations (resolved to decision links), Categories, Dates and Reference documents, plus prev/next navigation. JSON-LD preserved.
- Meeting cards: human date range, status pill, resolved committee code chip, decision count, flag + city/country.
- Meeting detail: committee resolved three-tier (code + localized name), venue cards (kind, name, address, unlocode, country, map url), officers (role, person, affiliation, contact methods), hosts (register-resolved), schedule with source-offset-correct times, deadlines table, agenda with #agenda-item-{label} anchors whose rows link to the decision they produced (and :target highlight), linked decisions when no agenda exists, declarations, minutes, labeled source documents, and note.
- Home: editorial hero with data-driven stat strip (decisions / meetings / year span), browse-by-decade into anchored meeting sections, and the latest decisions + recent meetings as full cards.
- Theme: dotted-grid radial motif on the page canvas (both themes, tinting via the ink token), eyebrow/standfirst/stat-strip/breadcrumb/meta-row primitives, accent action pills, status pills, shared card surface, staggered section entrances (reduced-motion safe), and a --edoxen-font-serif legacy alias for the display face so consumer font overrides keep working. All token-driven; dark parity throughout.

Backward compatible: payload and endpoint shapes are extended, not changed; no new dependencies.
