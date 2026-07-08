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
  FeaturesSchema,
  defineConfig,
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
  type FeaturesConfig,
} from './schema.js'

export {
  resolveDataPaths,
  activeDataKeys,
  type ResolvedDataPaths,
  type DataPathKey,
} from './paths.js'

export { generateCssTokens } from './tokens.js'
