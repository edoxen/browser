declare module 'virtual:edoxen-config' {
  import type { EdoxenConfig } from './config/index.js'
  const config: EdoxenConfig & { customCssImports?: string[] }
  export default config
}

declare module 'virtual:edoxen-payloads' {
  import type { PagePayloads } from './data/index.js'
  const payloads: PagePayloads
  export default payloads
}

declare module 'virtual:edoxen-custom-css'
