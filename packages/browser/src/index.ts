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
  resolveDataPaths,
  activeDataKeys,
  generateCssTokens,
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
  type ResolvedDataPaths,
  type DataPathKey,
} from './config/index.js'

export {
  loadAll,
  validateAll,
  buildProjectFromLoaded,
  preparePayloads,
  prepareDecisionsList,
  prepareMeetingsList,
  lintProject,
  type LoadedData,
  type LoadError,
  type LoadResult,
  type DataSource,
  type ValidationReport,
  type DecisionListItem,
  type DecisionListPayload,
  type DecisionListFacets,
  type MeetingListItem,
  type MeetingListPayload,
  type MeetingListFacets,
  type PagePayloads,
  type LintReport,
  type LintFinding,
  type LintSeverity,
} from './data/index.js'

export {
  decisionJsonLd,
  decisionListItemJsonLd,
  meetingJsonLd,
  meetingListItemJsonLd,
  type SeoContext,
  type JsonLd,
} from './seo/index.js'

export {
  pickLocalizedString,
  pickLocalizedValue,
  availableSpellings,
  twoToThree,
  threeToTwo,
} from './i18n/index.js'

export { EdoxenBrowserError, formatValidationErrors } from './errors.js'
export { default as edoxenBrowser, type IntegrationOptions } from './integration.js'
