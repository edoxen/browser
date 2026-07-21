---
"@edoxen/browser": patch
---

Fix the About page YAML sample: it was written as nested span markup
and the Astro compiler collapsed all inline whitespace, rendering it
as one run-on line. The sample is now built as a string (with proper
escaping and key/string highlighting) and emitted via <pre><code>,
so it renders with real line breaks. Also fixes extension-attribute
label casing (ISO, LinkedIn, GitHub, acronyms).
