export type Suggestion = {
  type: 'grammar' | 'style' | 'clarity' | 'structure' | 'content'
  original: string
  suggested: string
  explanation: string
}

export type QualityResult = {
  score: number
  issues: string[]
  strengths: string[]
}

export type SuggestionContext = {
  action?: string
  tone?: string
  length?: string
  language?: string
  instructions?: string
}

export async function generateSuggestions(content: string, context: SuggestionContext): Promise<Suggestion[]> {
  throw new Error('not implemented')
}

export async function applySuggestions(content: string, suggestions: Suggestion[]): Promise<string> {
  throw new Error('not implemented')
}

export async function summarizeContent(content: string, maxLength?: number): Promise<string> {
  throw new Error('not implemented')
}

export async function checkContent(content: string): Promise<QualityResult> {
  throw new Error('not implemented')
}

export function isConfigured(): boolean {
  throw new Error('not implemented')
}
