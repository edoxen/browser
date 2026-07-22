import { describe, expect, it } from 'vitest'

import { loadYamlTranslations } from './load-translations.js'

describe('loadYamlTranslations', () => {
  it('parses a flat key:value YAML mapping', () => {
    const yaml = `
      'nav.home': Home
      'nav.about': 'About'
    `
    const out = loadYamlTranslations(yaml)
    expect(out).toEqual({
      'nav.home': 'Home',
      'nav.about': 'About',
    })
  })

  it('preserves unicode, single quotes, and special characters', () => {
    // YAML single-quote escaping: literal ' inside a single-quoted scalar
    // must be doubled (''). Double-quoted scalars can use either.
    const yaml = `
      'meeting.type.plenary': 'Plénière'
      'phrase': 'L''archive'
      'greeting': '今日は — welcome'
    `
    const out = loadYamlTranslations(yaml)
    expect(out['meeting.type.plenary']).toBe('Plénière')
    expect(out['phrase']).toBe("L'archive")
    expect(out['greeting']).toBe('今日は — welcome')
  })

  it('returns an empty record for empty input', () => {
    expect(loadYamlTranslations('')).toEqual({})
    expect(loadYamlTranslations('---')).toEqual({})
  })

  it('ignores non-string values (arrays, objects, numbers)', () => {
    const yaml = `
      'valid': 'ok'
      'nested':
        key: value
      'list': [a, b]
      'number': 42
    `
    const out = loadYamlTranslations(yaml)
    expect(out).toEqual({ valid: 'ok' })
  })

  it('throws on top-level non-mapping YAML', () => {
    expect(() => loadYamlTranslations('- item1\n- item2')).toThrow(/mapping/)
  })

  it('result is frozen (translators get a read-only view)', () => {
    const out = loadYamlTranslations("'k': 'v'")
    expect(Object.isFrozen(out)).toBe(true)
  })
})
