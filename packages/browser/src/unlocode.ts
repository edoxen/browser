const UNLOCODE_CITY: Readonly<Record<string, string>> = {
  AUMEL: 'Melbourne',
  AUSYD: 'Sydney',
  CAPKS: 'Parksville',
  CATOR: 'Toronto',
  CHDVS: 'Davos',
  CHGVA: 'Geneva',
  CNBJS: 'Beijing',
  CNHGH: 'Hangzhou',
  CNSZH: 'Shenzhen',
  DEBAI: 'Berlin',
  DEBER: 'Berlin',
  DESTG: 'Stuttgart',
  ESVLC: 'Valencia',
  FRBLF: 'Belfort',
  FRBOD: 'Bordeaux',
  FRGNB: 'Grenoble',
  FRPAR: 'Paris',
  FRPIS: 'Pisa',
  FRSDN: 'Saoudan',
  FRTLS: 'Toulouse',
  GBBTH: 'Bath',
  GBLON: 'London',
  HKHKG: 'Hong Kong',
  ITFLR: 'Florence',
  ITNAP: 'Naples',
  ITTOA: 'Turin',
  JPHKT: 'Hakodate',
  JPHMZ: 'Hamamatsu',
  JPIBK: 'Ibaki',
  JPNGS: 'Nagasaki',
  JPSPK: 'Sapporo',
  JPTYO: 'Tokyo',
  JPUKB: 'Ube',
  KRGJU: 'Gyeongju',
  KRJEU: 'Jeju',
  KRPUS: 'Busan',
  KRSEL: 'Seoul',
  NLRTM: 'Rotterdam',
  NOLLM: 'Lillestrøm',
  NOOSL: 'Oslo',
  NOSVG: 'Stavanger',
  PTFNC: 'Funchal',
  SEGOT: 'Gothenburg',
  SESTO: 'Stockholm',
  USBAL: 'Baltimore',
  USBNP: 'Boa Nova',
  USCHI: 'Chicago',
  USCHS: 'Columbia',
  USDAL: 'Dallas',
  USFLL: 'Fort Lauderdale',
  USGAI: 'Gainesville',
  USGVL: 'Greenville',
  USHEH: 'Herndon',
  USLAX: 'Los Angeles',
  USLIT: 'Little Rock',
  USLOU: 'Louisville',
  USMIA: 'Miami',
  USMSY: 'New Orleans',
  USMYR: 'Myrtle Beach',
  USPDX: 'Portland',
  USPHL: 'Philadelphia',
  USRAH: 'Raleigh',
  USSAN: 'San Antonio',
  USSAR: 'Saratoga Springs',
  USSEA: 'Seattle',
  USSFO: 'San Francisco',
  ZASUN: 'Sun City',
}

export function cityFromUnlocode(code: string | undefined): string | undefined {
  if (!code) return undefined
  if (code.length !== 5) return undefined
  return UNLOCODE_CITY[code]
}

export function countryNameFromCode(code: string | undefined, locale: string): string | undefined {
  if (!code || code.length !== 2) return undefined
  try {
    const dn = new Intl.DisplayNames([locale], { type: 'region' })
    return dn.of(code.toUpperCase()) ?? undefined
  } catch {
    return undefined
  }
}

export function resolveLocation(
  city: string | undefined,
  countryCode: string | undefined,
  locale: string,
): { city?: string; country?: string; display: string } {
  const resolvedCity = cityFromUnlocode(city) ?? (city && city.length !== 5 ? city : undefined)
  const country = countryNameFromCode(countryCode, locale)
  const parts = [resolvedCity, country].filter((p): p is string => Boolean(p))
  return { city: resolvedCity, country, display: parts.join(', ') }
}
