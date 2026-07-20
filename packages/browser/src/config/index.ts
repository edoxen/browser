export {
  EdoxenConfigSchema,
  SiteSchema,
  DataSchema,
  OutputSchema,
  BodySchema,
  LocaleEntrySchema,
  ThemeSchema,
  NavItemSchema,
  SocialItemSchema,
  FooterSchema,
  FeaturesSchema,
  TerminologySchema,
  defineConfig,
  resolveFooter,
  type EdoxenConfig,
  type EdoxenConfigInput,
  type SiteConfig,
  type DataConfig,
  type OutputConfig,
  type BodyEntry,
  type LocaleEntry,
  type ThemeConfig,
  type NavItem,
  type SocialItem,
  type FooterConfig,
  type FeaturesConfig,
  type Terminology,
} from './schema.js'

export {
  resolveDataPaths,
  activeDataKeys,
  type ResolvedDataPaths,
  type DataPathKey,
} from './paths.js'

export { generateCssTokens } from './tokens.js'
