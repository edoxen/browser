import { z } from 'zod'

// Validation patterns. Centralised so call sites stay DRY and the rules
// can be swapped for `@iso24229/iso639-data` lookups when that package
// publishes (see TODO.browser/25-audit-and-improvements.md §7.5).
const LOCALE_RE = /^[a-z]{2,3}$/
const SCRIPT_RE = /^[A-Z][a-z]{3}$/
const HEX_RE = /^#[0-9a-fA-F]{3,8}$/
const BODY_CODE_RE = /^[a-z][a-z0-9_-]*$/
const HREF_RE = /^(\/[^/]*|https?:|mailto:)/
const PATH_RE = /.+/

export const SiteSchema = z.object({
  title: z.string().min(1),
  // Small uppercase line under the brand title (e.g. the committee's
  // working field, "Industrial data"). Omit to keep the single-line brand.
  subtitle: z.string().optional(),
  description: z.string().default(''),
  url: z.string().url(),
  basePath: z.string().regex(/^\/.*\/$|^\/$/, 'must be a root "/" or "/path/"').default('/'),
  locale: z.string().regex(LOCALE_RE, 'must be an ISO 639-1/3 code').default('en'),
})
export type SiteConfig = z.infer<typeof SiteSchema>

export const DataSchema = z.object({
  decisions: z.string().regex(PATH_RE),
  meetings: z.string().regex(PATH_RE).optional(),
  contacts: z.string().regex(PATH_RE).optional(),
  venues: z.string().regex(PATH_RE).optional(),
  bodies: z.string().regex(PATH_RE).optional(),
  agendas: z.string().regex(PATH_RE).optional(),
  minutes: z.string().regex(PATH_RE).optional(),
  committee: z.string().regex(PATH_RE).optional(),
  // UN/LOCODE → localized place names (YAML or JSON):
  //   NOSVG: { en: Stavanger, fr: Stavanger }
  // Meeting `city` codes resolve against it; unknown codes render raw.
  unlocodes: z.string().regex(PATH_RE).optional(),
})
export type DataConfig = z.infer<typeof DataSchema>

export const OutputSchema = z.object({
  dir: z.string().default('./dist'),
  sitemap: z.boolean().default(true),
  robots: z.boolean().default(true),
})
export type OutputConfig = z.infer<typeof OutputSchema>

export const BodySchema = z.object({
  code: z.string().regex(BODY_CODE_RE, 'lowercase letters, digits, _ or -'),
  name: z.string().min(1),
  color: z.string().regex(HEX_RE).optional(),
  textColor: z.string().regex(HEX_RE).optional(),
  icon: z.string().optional(),
})
export type BodyEntry = z.infer<typeof BodySchema>

export const LocaleEntrySchema = z.object({
  code: z.string().regex(LOCALE_RE, 'must be an ISO 639-1/3 code'),
  label: z.string().min(1),
  routePrefix: z.string().default(''),
  rtl: z.boolean().default(false),
})
export type LocaleEntry = z.infer<typeof LocaleEntrySchema>

const colorFields = z.string().regex(HEX_RE)

// Default palette: "elegant professional warm". Light theme is a warm
// paper canvas (#faf8f6) with warm charcoal ink (stone) and a deep
// warm teal accent; the dark theme is a warm deep charcoal (never
// blue-black) with a bright teal accent. All defaults meet WCAG AA
// against their paired background.
export const ThemeSchema = z.object({
  primary: colorFields.default('#1c1917'),
  accent: colorFields.default('#0f766e'),
  surface: colorFields.default('#ffffff'),
  background: colorFields.default('#faf8f6'),
  text: colorFields.default('#292524'),
  muted: colorFields.default('#78716c'),
  border: colorFields.default('#e7e5e4'),
  success: colorFields.default('#15803d'),
  warning: colorFields.default('#b45309'),
  danger: colorFields.default('#b91c1c'),
  dark: z.object({
    primary: colorFields.default('#f5f5f4'),
    accent: colorFields.default('#2dd4bf'),
    surface: colorFields.default('#292524'),
    background: colorFields.default('#1c1917'),
    text: colorFields.default('#e7e5e4'),
    muted: colorFields.default('#a8a29e'),
    border: colorFields.default('#44403c'),
  }).default({}),
  logos: z.object({
    primary: z.string().optional(),
    footer: z.string().optional(),
    favicon: z.string().optional(),
  }).default({}),
  fontFamily: z.string().optional(),
  radius: z.string().default('0.5rem'),
  customProperties: z.record(z.string()).default({}),
  // Path to a consumer stylesheet override, resolved against the
  // consumer root. When unset, `<root>/src/styles/override.css` is
  // used if present. Imported after the package's base.css.
  customCss: z.string().optional(),
})
export type ThemeConfig = z.infer<typeof ThemeSchema>

export const NavItemSchema = z.object({
  label: z.string().min(1),
  href: z.string().regex(HREF_RE, 'must start with "/", "http:", "https:", or "mailto:"'),
  locale: z.string().regex(LOCALE_RE).optional(),
})
export type NavItem = z.infer<typeof NavItemSchema>

// What a site calls its records. A committee that adopts "resolutions"
// rather than "decisions" sets `terminology` once and every user-facing
// English string (nav, page titles, section headings, stat strip,
// breadcrumbs, empty states, search placeholder) follows — see t() in
// src/i18n/ui.ts for the resolution order.
export const TerminologySchema = z.object({
  decision: z.string().min(1).default('decision'),
  decisions: z.string().min(1).default('decisions'),
  meeting: z.string().min(1).default('meeting'),
  meetings: z.string().min(1).default('meetings'),
})
export type Terminology = z.infer<typeof TerminologySchema>

// Default nav: Meetings + Decisions + About, labelled and linked from
// the configured terminology + decisionsSlug. A zero-config consumer
// sees these three top-level entries; overriding `nav` in the config
// replaces them wholesale.
function defaultNav(terminology: Terminology, decisionsSlug: string): NavItem[] {
  const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1)
  return [
    { label: cap(terminology.meetings), href: '/meetings' },
    { label: cap(terminology.decisions), href: `/${decisionsSlug}` },
    { label: 'About', href: '/about' },
  ]
}

export const SocialItemSchema = z.object({
  label: z.string().min(1),
  href: z.string().url(),
  icon: z.enum(['github', 'email', 'linkedin', 'twitter', 'website', 'rss']).optional(),
})
export type SocialItem = z.infer<typeof SocialItemSchema>

// Footer config block. When `message` and `copyright` are unset the
// package auto-generates them from the site title + current year, so a
// zero-config consumer gets a sensible footer without lifting a finger.
export const FooterSchema = z.object({
  message: z.string().optional(),
  copyright: z.string().optional(),
  showEdoxenAttribution: z.boolean().default(true),
})
export type FooterConfig = z.infer<typeof FooterSchema>

/**
 * Auto-generate the footer message + copyright lines for a given site
 * title. Used by BaseLayout when the consumer hasn't supplied them.
 */
export function resolveFooter(
  siteTitle: string,
  footer: FooterConfig,
  year: number = new Date().getFullYear(),
): Required<Pick<FooterConfig, 'message' | 'copyright'>> & Pick<FooterConfig, 'showEdoxenAttribution'> {
  return {
    message: footer.message ?? `An Edoxen-powered registry of meetings and decisions.`,
    copyright: footer.copyright ?? `Copyright © ${year} ${siteTitle}.`,
    showEdoxenAttribution: footer.showEdoxenAttribution,
  }
}

export const FeaturesSchema = z.object({
  search: z.boolean().default(true),
  timeline: z.boolean().default(true),
  urnCopy: z.boolean().default(true),
  doi: z.boolean().default(false),
  darkMode: z.boolean().default(true),
  printStyles: z.boolean().default(true),
  pagination: z.object({
    // Bounded DOM by default: the search island renders pageSize cards
    // and grows by "Show more" instead of mounting thousands of cards.
    // Set enabled: false to render the full filtered list (DOM-heavy
    // for large archives).
    enabled: z.boolean().default(true),
    pageSize: z.number().int().positive().default(50),
  }).default({}),
  home: z.object({
    stats: z.boolean().default(true),
    recentDecisions: z.number().int().nonnegative().default(5),
    recentMeetings: z.number().int().nonnegative().default(3),
    browseByDecade: z.boolean().default(true),
  }).default({}),
})
export type FeaturesConfig = z.infer<typeof FeaturesSchema>

// Route segment of the decisions index + detail pages. Renaming it
// (e.g. 'resolutions') moves every decision route and every generated
// decision link; the /data/*.json endpoint names stay fixed.
const SLUG_RE = /^[a-z0-9][a-z0-9-]*$/

export const EdoxenConfigSchema = z.object({
  site: SiteSchema,
  data: DataSchema,
  output: OutputSchema.default({}),
  bodies: z.array(BodySchema).default([{ code: 'committee', name: 'Committee' }]),
  locales: z.array(LocaleEntrySchema).default([{ code: 'en', label: 'English', routePrefix: '' }]),
  theme: ThemeSchema.default({}),
  nav: z.array(NavItemSchema).optional(),
  social: z.array(SocialItemSchema).default([]),
  footer: FooterSchema.default({}),
  features: FeaturesSchema.default({}),
  uiStrings: z.record(z.string(), z.record(z.string(), z.string())).default({}),
  terminology: TerminologySchema.default({}),
  decisionsSlug: z.string().regex(SLUG_RE, 'lowercase letters, digits or -').default('decisions'),
}).transform((cfg) => ({
  ...cfg,
  nav: cfg.nav ?? defaultNav(cfg.terminology, cfg.decisionsSlug),
}))

export type EdoxenConfig = z.infer<typeof EdoxenConfigSchema>
export type EdoxenConfigInput = z.input<typeof EdoxenConfigSchema>

export function defineConfig(config: EdoxenConfigInput): EdoxenConfig {
  return EdoxenConfigSchema.parse(config)
}
