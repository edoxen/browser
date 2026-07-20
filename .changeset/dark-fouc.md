---
"@edoxen/browser": patch
---

Fix dark-mode FOUC: a blocking inline script in <head> now sets
data-theme from localStorage or prefers-color-scheme before first
paint, instead of waiting for the theme-toggle island to hydrate.
