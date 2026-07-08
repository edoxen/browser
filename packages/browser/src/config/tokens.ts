import type { ThemeConfig } from './schema.js'

const TOKEN_NAME_OVERRIDES: Record<string, string | null> = {
  customProperties: null,
  logos: null,
  dark: null,
  fontFamily: '--edoxen-font-sans',
  radius: '--edoxen-radius-sm',
}

function tokenName(key: string): string | null {
  const override = TOKEN_NAME_OVERRIDES[key]
  if (override === null) return null
  if (override) return override
  return `--edoxen-color-${kebab(key)}`
}

function kebab(s: string): string {
  return s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
}

export function generateCssTokens(theme: ThemeConfig): string {
  const lines: string[] = [':root {']

  for (const [key, value] of Object.entries(theme)) {
    if (typeof value !== 'string') continue
    const name = tokenName(key)
    if (name) lines.push(`  ${name}: ${value};`)
  }

  lines.push('}')

  for (const [key, value] of Object.entries(theme.dark)) {
    if (typeof value !== 'string') continue
    const name = tokenName(key)
    if (name) lines.push(`:root[data-theme="dark"] { ${name}: ${value}; }`)
  }

  if (theme.customProperties && Object.keys(theme.customProperties).length > 0) {
    lines.push(':root {')
    for (const [k, v] of Object.entries(theme.customProperties)) {
      lines.push(`  --edoxen-${kebab(k)}: ${v};`)
    }
    lines.push('}')
  }

  return lines.join('\n')
}
