import { describe, expect, it } from 'vitest'

import {
  BodySchema,
  EdoxenConfigSchema,
  FeaturesSchema,
  FooterSchema,
  LocaleEntrySchema,
  NavItemSchema,
  SocialItemSchema,
  defineConfig,
  resolveFooter,
} from './schema.js'

describe('EdoxenConfigSchema', () => {
  describe('site', () => {
    it('accepts a minimal config and applies defaults', () => {
      const cfg = EdoxenConfigSchema.parse({
        site: { title: 'X', url: 'https://x.org' },
        data: { decisions: './data/decisions' },
      })

      expect(cfg.site.title).toBe('X')
      expect(cfg.site.description).toBe('')
      expect(cfg.site.basePath).toBe('/')
      expect(cfg.site.locale).toBe('en')
    })

    it('rejects an empty title', () => {
      expect(() =>
        EdoxenConfigSchema.parse({
          site: { title: '', url: 'https://x.org' },
          data: { decisions: './data/decisions' },
        }),
      ).toThrow()
    })

    it('rejects an invalid URL', () => {
      expect(() =>
        EdoxenConfigSchema.parse({
          site: { title: 'X', url: 'bad' },
          data: { decisions: './data/decisions' },
        }),
      ).toThrow()
    })

    it('rejects a malformed basePath', () => {
      expect(() =>
        EdoxenConfigSchema.parse({
          site: { title: 'X', url: 'https://x.org', basePath: 'resolutions' },
          data: { decisions: './data/decisions' },
        }),
      ).toThrow()
    })

    it('rejects a non-ISO-639 locale', () => {
      expect(() =>
        EdoxenConfigSchema.parse({
          site: { title: 'X', url: 'https://x.org', locale: 'english' },
          data: { decisions: './data/decisions' },
        }),
      ).toThrow()
    })
  })

  describe('data', () => {
    it('requires decisions path; other entities optional', () => {
      const cfg = EdoxenConfigSchema.parse({
        site: { title: 'X', url: 'https://x.org' },
        data: { decisions: './data/decisions' },
      })
      expect(cfg.data.decisions).toBe('./data/decisions')
      expect(cfg.data.meetings).toBeUndefined()
    })

    it('accepts all entity paths', () => {
      const cfg = EdoxenConfigSchema.parse({
        site: { title: 'X', url: 'https://x.org' },
        data: {
          decisions: './data/decisions',
          meetings: './data/meetings',
          agendas: './data/agendas',
          minutes: './data/minutes',
          committee: './data/committee.yaml',
        },
      })
      expect(cfg.data.committee).toBe('./data/committee.yaml')
    })

    it('rejects config without decisions path', () => {
      expect(() =>
        EdoxenConfigSchema.parse({
          site: { title: 'X', url: 'https://x.org' },
          data: {},
        }),
      ).toThrow()
    })
  })

  describe('bodies', () => {
    it('defaults to a single committee body', () => {
      const cfg = EdoxenConfigSchema.parse({
        site: { title: 'X', url: 'https://x.org' },
        data: { decisions: './data/decisions' },
      })
      expect(cfg.bodies).toEqual([{ code: 'committee', name: 'Committee' }])
    })

    it('accepts OIML-style multi-body with colors', () => {
      const cfg = EdoxenConfigSchema.parse({
        site: { title: 'X', url: 'https://x.org' },
        data: { decisions: './data/decisions' },
        bodies: [
          { code: 'ciml', name: 'CIML', color: '#1e40af', textColor: '#ffffff' },
          { code: 'conference', name: 'Conference', color: '#7c2d12' },
        ],
      })
      expect(cfg.bodies[0]?.code).toBe('ciml')
      expect(cfg.bodies[1]?.color).toBe('#7c2d12')
    })

    it('rejects an invalid body code', () => {
      expect(() =>
        BodySchema.parse({ code: 'CIML', name: 'CIML' }),
      ).toThrow()
    })

    it('rejects a non-hex color', () => {
      expect(() =>
        BodySchema.parse({ code: 'ciml', name: 'CIML', color: 'blue' }),
      ).toThrow()
    })
  })

  describe('locales', () => {
    it('defaults to a single English locale', () => {
      const cfg = EdoxenConfigSchema.parse({
        site: { title: 'X', url: 'https://x.org' },
        data: { decisions: './data/decisions' },
      })
      expect(cfg.locales).toEqual([{ code: 'en', label: 'English', routePrefix: '', rtl: false }])
    })

    it('accepts bilingual EN/FR with route prefix', () => {
      const cfg = EdoxenConfigSchema.parse({
        site: { title: 'X', url: 'https://x.org' },
        data: { decisions: './data/decisions' },
        locales: [
          { code: 'en', label: 'English' },
          { code: 'fr', label: 'Français', routePrefix: '/fr' },
        ],
      })
      expect(cfg.locales[1]?.routePrefix).toBe('/fr')
    })

    it('rejects a 4-letter locale code', () => {
      expect(() => LocaleEntrySchema.parse({ code: 'eng1', label: 'X' })).toThrow()
    })
  })

  describe('theme', () => {
    it('applies full defaults when omitted', () => {
      const cfg = EdoxenConfigSchema.parse({
        site: { title: 'X', url: 'https://x.org' },
        data: { decisions: './data/decisions' },
      })
      expect(cfg.theme.primary).toBe('#1c1917')
      expect(cfg.theme.dark.surface).toBe('#292524')
      expect(cfg.theme.radius).toBe('0.5rem')
    })

    it('rejects a non-hex theme color', () => {
      const cfg = {
        site: { title: 'X', url: 'https://x.org' },
        data: { decisions: './data/decisions' },
        theme: { primary: 'red' },
      }
      expect(() => EdoxenConfigSchema.parse(cfg)).toThrow()
    })

    it('accepts custom properties for consumer overrides', () => {
      const cfg = EdoxenConfigSchema.parse({
        site: { title: 'X', url: 'https://x.org' },
        data: { decisions: './data/decisions' },
        theme: { customProperties: { 'font-display': 'Inter, sans-serif' } },
      })
      expect(cfg.theme.customProperties['font-display']).toBe('Inter, sans-serif')
    })
  })

  describe('nav', () => {
    it('rejects an href that is not absolute or http(s)/mailto', () => {
      expect(() =>
        NavItemSchema.parse({ label: 'Home', href: 'relative/path' }),
      ).toThrow()
    })

    it('accepts absolute path, http, https, and mailto', () => {
      expect(NavItemSchema.parse({ label: 'A', href: '/' }).href).toBe('/')
      expect(NavItemSchema.parse({ label: 'B', href: '/decisions' }).href).toBe('/decisions')
      expect(NavItemSchema.parse({ label: 'C', href: 'https://example.org' }).href).toBe('https://example.org')
      expect(NavItemSchema.parse({ label: 'D', href: 'mailto:x@y.org' }).href).toBe('mailto:x@y.org')
    })
  })

  describe('social', () => {
    it('accepts a known icon enum', () => {
      expect(SocialItemSchema.parse({ label: 'GH', href: 'https://gh.org', icon: 'github' }).icon).toBe('github')
    })

    it('rejects an unknown icon', () => {
      expect(() =>
        SocialItemSchema.parse({ label: 'X', href: 'https://x.org', icon: 'myspace' }),
      ).toThrow()
    })

    it('rejects a non-URL href', () => {
      expect(() =>
        SocialItemSchema.parse({ label: 'X', href: '/relative' }),
      ).toThrow()
    })
  })

  describe('features', () => {
    it('applies defaults', () => {
      const f = FeaturesSchema.parse({})
      expect(f.search).toBe(true)
      expect(f.doi).toBe(false)
      expect(f.pagination.enabled).toBe(false)
      expect(f.pagination.pageSize).toBe(50)
    })

    it('accepts pagination override', () => {
      const f = FeaturesSchema.parse({ pagination: { enabled: true, pageSize: 100 } })
      expect(f.pagination.pageSize).toBe(100)
    })

    it('rejects a non-positive page size', () => {
      expect(() =>
        FeaturesSchema.parse({ pagination: { enabled: true, pageSize: 0 } }),
      ).toThrow()
    })

    it('applies home section defaults', () => {
      const f = FeaturesSchema.parse({})
      expect(f.home).toEqual({ stats: true, recentDecisions: 5, recentMeetings: 3, browseByDecade: true })
    })

    it('accepts home section overrides, including zero recent counts', () => {
      const f = FeaturesSchema.parse({ home: { stats: false, recentDecisions: 0, recentMeetings: 10, browseByDecade: false } })
      expect(f.home.stats).toBe(false)
      expect(f.home.recentDecisions).toBe(0)
      expect(f.home.recentMeetings).toBe(10)
      expect(f.home.browseByDecade).toBe(false)
    })

    it('rejects a negative recent count', () => {
      expect(() => FeaturesSchema.parse({ home: { recentDecisions: -1 } })).toThrow()
    })
  })

  describe('terminology', () => {
    it('defaults to decision/decisions/meeting/meetings', () => {
      const cfg = EdoxenConfigSchema.parse({
        site: { title: 'X', url: 'https://x.org' },
        data: { decisions: './data/decisions' },
      })
      expect(cfg.terminology).toEqual({
        decision: 'decision',
        decisions: 'decisions',
        meeting: 'meeting',
        meetings: 'meetings',
      })
    })

    it('accepts a partial override and fills the rest', () => {
      const cfg = EdoxenConfigSchema.parse({
        site: { title: 'X', url: 'https://x.org' },
        data: { decisions: './data/decisions' },
        terminology: { decisions: 'Resolutions' },
      })
      expect(cfg.terminology.decisions).toBe('Resolutions')
      expect(cfg.terminology.decision).toBe('decision')
    })

    it('rejects empty terminology words', () => {
      expect(() =>
        EdoxenConfigSchema.parse({
          site: { title: 'X', url: 'https://x.org' },
          data: { decisions: './data/decisions' },
          terminology: { decisions: '' },
        }),
      ).toThrow()
    })
  })

  describe('decisionsSlug', () => {
    it("defaults to 'decisions'", () => {
      const cfg = EdoxenConfigSchema.parse({
        site: { title: 'X', url: 'https://x.org' },
        data: { decisions: './data/decisions' },
      })
      expect(cfg.decisionsSlug).toBe('decisions')
    })

    it('accepts a custom slug', () => {
      const cfg = EdoxenConfigSchema.parse({
        site: { title: 'X', url: 'https://x.org' },
        data: { decisions: './data/decisions' },
        decisionsSlug: 'resolutions',
      })
      expect(cfg.decisionsSlug).toBe('resolutions')
    })

    it('rejects slashes, leading dashes and uppercase', () => {
      for (const slug of ['/decisions', 'decisions/x', '-x', 'Decisions']) {
        expect(() =>
          EdoxenConfigSchema.parse({
            site: { title: 'X', url: 'https://x.org' },
            data: { decisions: './data/decisions' },
            decisionsSlug: slug,
          }),
        ).toThrow()
      }
    })
  })

  describe('defineConfig', () => {
    it('returns a parsed config with defaults filled in', () => {
      const cfg = defineConfig({
        site: { title: 'My Site', url: 'https://mine.org' },
        data: { decisions: './data/decisions' },
      })
      expect(cfg.site.title).toBe('My Site')
      expect(cfg.site.locale).toBe('en')
      expect(cfg.features.search).toBe(true)
    })

    it('throws on invalid input with a ZodError', () => {
      expect(() =>
        EdoxenConfigSchema.parse({
          site: { title: 'X' },
          data: { decisions: './data/decisions' },
        }),
      ).toThrow()
    })

    it('ships Meetings + Decisions + About as the default nav', () => {
      const cfg = defineConfig({
        site: { title: 'X', url: 'https://x.org' },
        data: { decisions: './data/decisions' },
      })
      expect(cfg.nav.map((n) => n.label)).toEqual([
        'Meetings',
        'Decisions',
        'About',
      ])
      expect(cfg.nav.map((n) => n.href)).toEqual([
        '/meetings',
        '/decisions',
        '/about',
      ])
    })

    it('derives the default nav labels + href from terminology and decisionsSlug', () => {
      const cfg = defineConfig({
        site: { title: 'X', url: 'https://x.org' },
        data: { decisions: './data/decisions' },
        terminology: { decision: 'resolution', decisions: 'Resolutions' },
        decisionsSlug: 'resolutions',
      })
      expect(cfg.nav).toEqual([
        { label: 'Meetings', href: '/meetings' },
        { label: 'Resolutions', href: '/resolutions' },
        { label: 'About', href: '/about' },
      ])
    })

    it('replaces the default nav wholesale when provided', () => {
      const cfg = defineConfig({
        site: { title: 'X', url: 'https://x.org' },
        data: { decisions: './data/decisions' },
        nav: [{ label: 'Members', href: '/members' }],
      })
      expect(cfg.nav).toEqual([{ label: 'Members', href: '/members' }])
    })
  })

  describe('footer', () => {
    it('applies the showEdoxenAttribution=true default', () => {
      const f = FooterSchema.parse({})
      expect(f.showEdoxenAttribution).toBe(true)
    })

    it('respects explicit overrides', () => {
      const f = FooterSchema.parse({
        message: 'Hello',
        copyright: '© 1999 X',
        showEdoxenAttribution: false,
      })
      expect(f).toEqual({
        message: 'Hello',
        copyright: '© 1999 X',
        showEdoxenAttribution: false,
      })
    })

    it('auto-generates a tagline + copyright from site title', () => {
      const f = resolveFooter('TC 154', FooterSchema.parse({}), 2026)
      expect(f.message).toMatch(/Edoxen-powered registry/)
      expect(f.copyright).toBe('Copyright © 2026 TC 154.')
    })

    it('respects an explicit message + copyright', () => {
      const resolved = resolveFooter(
        'TC 154',
        FooterSchema.parse({ message: 'Maintained by X', copyright: '© 2000 X' }),
      )
      expect(resolved.message).toBe('Maintained by X')
      expect(resolved.copyright).toBe('© 2000 X')
    })

    it('honours showEdoxenAttribution=false from the config', () => {
      const resolved = resolveFooter(
        'X',
        FooterSchema.parse({ showEdoxenAttribution: false }),
      )
      expect(resolved.showEdoxenAttribution).toBe(false)
    })
  })
})
