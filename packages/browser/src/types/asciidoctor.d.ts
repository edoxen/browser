declare module 'asciidoctor' {
  export interface ConvertOptions {
    safe?: string | number
    attributes?: Record<string, string | boolean>
  }
  export function convert(text: string, options?: ConvertOptions): Promise<string>
  export function convertFile(filename: string, options?: ConvertOptions): Promise<string>
}
