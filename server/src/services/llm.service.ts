import { GoogleGenerativeAI } from '@google/generative-ai'
import { env } from '../config/env.js'
import { prisma } from '../config/db.js'

const genAI = new GoogleGenerativeAI(env.GOOGLE_AI_API_KEY)
const MODEL = 'gemini-2.5-flash'

async function generate(prompt: string): Promise<{ text: string; tokens: number }> {
  const model = genAI.getGenerativeModel({ model: MODEL })
  const result = await model.generateContent(prompt)
  const text = result.response.text()
  const tokens = result.response.usageMetadata?.totalTokenCount ?? 0
  return { text, tokens }
}

export interface Suggestion {
  type: 'grammar' | 'style' | 'clarity' | 'structure' | 'content'
  original: string
  suggestion: string
  explanation: string
}

export async function generateSuggestions(
  content: string,
  documentType = 'resume'
): Promise<Suggestion[]> {
  const prompt = `You are an expert ${documentType} editor. Analyze the following ${documentType} and return a JSON array of improvement suggestions.

Each suggestion must follow this exact schema:
{ "type": "grammar"|"style"|"clarity"|"structure"|"content", "original": "exact text from document", "suggestion": "improved text", "explanation": "brief reason" }

Return ONLY a valid JSON array, no markdown, no extra text.

Document:
${content}`

  const { text } = await generate(prompt)

  try {
    const cleaned = text.replace(/```json\n?|\n?```/g, '').trim()
    return JSON.parse(cleaned) as Suggestion[]
  } catch {
    return []
  }
}

export async function applySuggestions(
  content: string,
  suggestions: Suggestion[]
): Promise<string> {
  let updated = content
  for (const s of suggestions) {
    updated = updated.replace(s.original, s.suggestion)
  }
  return updated
}

export async function summarizeDocument(content: string): Promise<string> {
  const prompt = `Summarize the following resume/document in 2-3 concise sentences highlighting the candidate's key strengths and experience. Return only the summary text.

Document:
${content}`

  const { text } = await generate(prompt)
  return text.trim()
}

export interface QualityScore {
  score: number
  issues: string[]
  strengths: string[]
}

export async function scoreDocumentQuality(
  content: string,
  documentType = 'resume'
): Promise<QualityScore> {
  const prompt = `You are an expert ${documentType} reviewer. Score the following ${documentType} and return a JSON object.

Schema: { "score": number 1-10, "issues": string[], "strengths": string[] }

Return ONLY valid JSON, no markdown.

Document:
${content}`

  const { text } = await generate(prompt)

  try {
    const cleaned = text.replace(/```json\n?|\n?```/g, '').trim()
    return JSON.parse(cleaned) as QualityScore
  } catch {
    return { score: 5, issues: ['Could not analyze document'], strengths: [] }
  }
}

export interface ChatResponse {
  message: string
  suggestedChanges?: {
    type: string
    description: string
    changes: Array<{ section: string; original: string; updated: string }>
  }
}

export async function chatWithDocument(
  userMessage: string,
  documentContent: string,
  selectedText?: string
): Promise<ChatResponse> {
  const contextPart = selectedText
    ? `\nThe user has highlighted this specific text: "${selectedText}"\n`
    : ''

  const prompt = `You are an expert resume editor AI assistant helping a user improve their resume.
${contextPart}
User message: ${userMessage}

Resume content:
${documentContent}

Respond helpfully and concisely. If you are making specific text changes, include a JSON block at the very end wrapped in <changes></changes> tags using this exact schema:
<changes>
{
  "type": "improvement",
  "description": "one-line description of the change",
  "changes": [
    { "section": "experience", "original": "exact original text", "updated": "improved text" }
  ]
}
</changes>

Only include the <changes> block if you have concrete text replacements. For general questions or analysis, respond without it.`

  const { text, tokens: _tokens } = await generate(prompt)

  const changesMatch = text.match(/<changes>([\s\S]*?)<\/changes>/)
  const messageText = text.replace(/<changes>[\s\S]*?<\/changes>/, '').trim()

  let suggestedChanges: ChatResponse['suggestedChanges']
  if (changesMatch) {
    try {
      suggestedChanges = JSON.parse(changesMatch[1].trim())
    } catch {
      // malformed JSON — no changes
    }
  }

  return { message: messageText, suggestedChanges }
}

export async function logInteraction(
  userId: string,
  documentId: string | null,
  prompt: string,
  response: string,
  tokens: number,
  interactionType = 'suggestion'
) {
  await prisma.aiInteraction.create({
    data: {
      userId,
      documentId,
      prompt: prompt.slice(0, 2000),
      response: response.slice(0, 5000),
      model: MODEL,
      totalTokens: tokens,
      interactionType,
    },
  })
}
