import { convert } from 'asciidoctor'

const OPTIONS = {
  safe: 'server',
  attributes: {
    showtitle: false,
    'icons!': '',
    'toc!': '',
    sectanchors: false,
    'source-highlighter!': '',
  },
} as const

export async function renderAdoc(text: string | undefined | null): Promise<string> {
  if (!text || text.trim().length === 0) return ''
  const result = await convert(text, OPTIONS)
  return typeof result === 'string' ? result : ''
}
