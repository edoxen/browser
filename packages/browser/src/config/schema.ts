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
  description: z.string().default(''),
  url: z.string().url(),
  basePath: z.string().regex(/^\/.*\/$|^\/$/, 'must be a root "/" or "/path/"').default('/'),
  locale: z.string().regex(LOCALE_RE, 'must be an ISO 639-1/3 code').default('en'),
})
export type SiteConfig = z.infer<typeof SiteSchema>

export const DataSchema = z.object({
  decisions: z.string().regex(PATH_RE),
  meetings: z.string().regex(PATH_RE).optional(),
  agendas: z.string().regex(PATH_RE).optional(),
  minutes: z.string().regex(PATH_RE).optional(),
  committee: z.string().regex(PATH_RE).optional(),
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
})
export type LocaleEntry = z.infer<typeof LocaleEntrySchema>

const colorFields = z.string().regex(HEX_RE)

export const ThemeSchema = z.object({
  primary: colorFields.default('#1f2937'),
  accent: colorFields.default('#3b82f6'),
  surface: colorFields.default('#ffffff'),
  background: colorFields.default('#f9fafb'),
  text: colorFields.default('#1f2937'),
  muted: colorFields.default('#6b7280'),
  border: colorFields.default('#e5e7eb'),
  success: colorFields.default('#10b981'),
  warning: colorFields.default('#f59e0b'),
  danger: colorFields.default('#ef4444'),
  dark: z.object({
    primary: colorFields.default('#f9fafb'),
    accent: colorFields.default('#3b82f6'),
    surface: colorFields.default('#1f2937'),
    background: colorFields.default('#111827'),
    text: colorFields.default('#f9fafb'),
    muted: colorFields.default('#9ca3af'),
    border: colorFields.default('#374151'),
  }).default({}),
  logos: z.object({
    primary: z.string().optional(),
    footer: z.string().optional(),
    favicon: z.string().optional(),
  }).default({}),
  fontFamily: z.string().optional(),
  radius: z.string().default('0.25rem'),
  customProperties: z.record(z.string()).default({}),
})
export type ThemeConfig = z.infer<typeof ThemeSchema>

export const NavItemSchema = z.object({
  label: z.string().min(1),
  href: z.string().regex(HREF_RE, 'must start with "/", "http:", "https:", or "mailto:"'),
  locale: z.string().regex(LOCALE_RE).optional(),
})
export type NavItem = z.infer<typeof NavItemSchema>

export const SocialItemSchema = z.object({
  label: z.string().min(1),
  href: z.string().url(),
  icon: z.enum(['github', 'email', 'linkedin', 'twitter', 'website', 'rss']).optional(),
})
export type SocialItem = z.infer<typeof SocialItemSchema>

export const FeaturesSchema = z.object({
  search: z.boolean().default(true),
  timeline: z.boolean().default(true),
  urnCopy: z.boolean().default(true),
  doi: z.boolean().default(false),
  darkMode: z.boolean().default(true),
  printStyles: z.boolean().default(true),
  pagination: z.object({
    enabled: z.boolean().default(false),
    pageSize: z.number().int().positive().default(50),
  }).default({}),
})
export type FeaturesConfig = z.infer<typeof FeaturesSchema>

export const EdoxenConfigSchema = z.object({
  site: SiteSchema,
  data: DataSchema,
  output: OutputSchema.default({}),
  bodies: z.array(BodySchema).default([{ code: 'committee', name: 'Committee' }]),
  locales: z.array(LocaleEntrySchema).default([{ code: 'en', label: 'English', routePrefix: '' }]),
  theme: ThemeSchema.default({}),
  nav: z.array(NavItemSchema).default([]),
  social: z.array(SocialItemSchema).default([]),
  features: FeaturesSchema.default({}),
})

export type EdoxenConfig = z.infer<typeof EdoxenConfigSchema>
export type EdoxenConfigInput = z.input<typeof EdoxenConfigSchema>

export function defineConfig(config: EdoxenConfigInput): EdoxenConfig {
  return EdoxenConfigSchema.parse(config)
}
