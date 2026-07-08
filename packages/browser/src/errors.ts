export type IntegrationStage = 'config' | 'load' | 'validate' | 'build' | 'smoke' | 'lint'

export class EdoxenBrowserError extends Error {
  override readonly name = 'EdoxenBrowserError'
  readonly stage: IntegrationStage
  readonly details: readonly string[]

  constructor(stage: IntegrationStage, message: string, details: readonly string[] = []) {
    super(message)
    this.stage = stage
    this.details = details
  }

  override toString(): string {
    const head = `[edoxen:${this.stage}] ${this.message}`
    if (this.details.length === 0) return head
    return `${head}\n${this.details.map((d) => `  - ${d}`).join('\n')}`
  }
}

export function formatValidationErrors(
  errors: readonly { readonly path: string; readonly message: string }[],
): readonly string[] {
  return errors.map((e) => (e.path ? `${e.path}: ${e.message}` : e.message))
}
