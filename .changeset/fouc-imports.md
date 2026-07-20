---
"@edoxen/browser": patch
---

Fix FOUC on every navigation when a consumer override has external
@import URLs (e.g. webfonts): they are stripped from the bundled CSS
and emitted as parallel <head> links instead, so the stylesheet
applies immediately and fonts swap in non-blocking.
