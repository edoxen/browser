export function urnToPath(urn: string): string {
  return encodeURIComponent(urn).replace(/%3A/g, ':')
}
