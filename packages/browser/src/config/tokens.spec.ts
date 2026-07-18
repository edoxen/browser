import { describe, expect, it } from 'vitest'

import { generateCssTokens } from './tokens.js'
import { ThemeSchema } from './schema.js'

function parseTheme(input: Record<string, unknown>) {
  return ThemeSchema.parse(input)
}

describe('generateCssTokens', () => {
  it('emits a :root block with every default color token', () => {
    const theme = parseTheme({})
    const css = generateCssTokens(theme)
    expect(css).toContain(':root {')
    expect(css).toContain('--edoxen-color-primary: #1c1917;')
    expect(css).toContain('--edoxen-color-accent: #0f766e;')
    expect(css).toContain('--edoxen-color-success: #15803d;')
    expect(css).toContain('--edoxen-radius-sm: 0.5rem;')
  })

  it('does not double-emit radius as a color', () => {
    const theme = parseTheme({})
    const css = generateCssTokens(theme)
    expect(css).not.toContain('--edoxen-color-radius')
    expect(css).not.toContain('--edoxen-color-font-family')
  })

  it('emits font-family token under --edoxen-font-sans', () => {
    const theme = parseTheme({ fontFamily: 'Inter, sans-serif' })
    expect(generateCssTokens(theme)).toContain('--edoxen-font-sans: Inter, sans-serif;')
  })

  it('emits dark-mode tokens under [data-theme="dark"]', () => {
    const theme = parseTheme({})
    const css = generateCssTokens(theme)
    expect(css).toContain(':root[data-theme="dark"] { --edoxen-color-surface: #292524; }')
    expect(css).toContain(':root[data-theme="dark"] { --edoxen-color-background: #1c1917; }')
  })

  it('reflects consumer overrides', () => {
    const theme = parseTheme({ primary: '#ff0000' })
    expect(generateCssTokens(theme)).toContain('--edoxen-color-primary: #ff0000;')
  })

  it('emits custom properties as --edoxen-* kebab-case tokens', () => {
    const theme = parseTheme({ customProperties: { fontDisplay: 'Inter', 'hero-size': '4rem' } })
    const css = generateCssTokens(theme)
    expect(css).toContain('--edoxen-font-display: Inter;')
    expect(css).toContain('--edoxen-hero-size: 4rem;')
  })

  it('skips nested object fields from the root :root block', () => {
    const theme = parseTheme({})
    const css = generateCssTokens(theme)
    expect(css).not.toContain('[object Object]')
  })
})
