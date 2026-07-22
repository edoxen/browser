// YAML-first i18n loader.
//
// Translators prefer YAML over JS literals — flat key:value files, one
// per locale. This module:
//   * Parses a YAML string into a UiStrings record.
//   * Loads built-in locale files from ./strings/<locale>.yaml at build
//     time (Vite ?raw imports + parse).
//
// Consumers can load their own YAML files the same way via
// `loadYamlTranslations(content)` in their edoxen.config.ts.

import { parse } from 'yaml'

import engStrings from './strings/eng.yaml?raw'
import fraStrings from './strings/fra.yaml?raw'
import zhoStrings from './strings/zho.yaml?raw'
import spaStrings from './strings/spa.yaml?raw'
import araStrings from './strings/ara.yaml?raw'
import rusStrings from './strings/rus.yaml?raw'

export type UiStrings = Readonly<Record<string, string>>

/** Parse a YAML string of `'key': 'value'` pairs into a UiStrings record. */
export function loadYamlTranslations(yaml: string): UiStrings {
  const parsed: unknown = parse(yaml)
  if (parsed == null) return {}
  if (typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(`Expected a YAML mapping of key: value pairs, got ${typeof parsed}`)
  }
  const out: Record<string, string> = {}
  for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
    if (typeof value === 'string') out[key] = value
  }
  return Object.freeze(out)
}

// Built-in strings — kept private; consumers use the `t()` and
// `meetingTypeLabel()` helpers rather than reading the table directly.
export const BUILTIN_STRINGS: Readonly<Record<string, UiStrings>> = Object.freeze({
  eng: loadYamlTranslations(engStrings),
  fra: loadYamlTranslations(fraStrings),
  zho: loadYamlTranslations(zhoStrings),
  spa: loadYamlTranslations(spaStrings),
  ara: loadYamlTranslations(araStrings),
  rus: loadYamlTranslations(rusStrings),
})
