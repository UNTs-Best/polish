import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGenerateContent = vi.hoisted(() => vi.fn())

vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn().mockImplementation(function () {
    return {
      getGenerativeModel: vi.fn().mockReturnValue({
        generateContent: mockGenerateContent,
      }),
    }
  }),
}))

const mockPrisma = vi.hoisted(() => ({
  aiInteraction: { create: vi.fn() },
}))

vi.mock('../../../src/config/db.js', () => ({ prisma: mockPrisma }))
vi.mock('../../../src/config/redis.js', () => ({
  redis: { on: vi.fn(), ping: vi.fn(), quit: vi.fn() },
}))

import {
  generateSuggestions,
  applySuggestions,
  summarizeDocument,
  scoreDocumentQuality,
  chatWithDocument,
  logInteraction,
} from '../../../src/services/llm.service.js'

function mockLlm(text: string) {
  mockGenerateContent.mockResolvedValue({
    response: {
      text: () => text,
      usageMetadata: { totalTokenCount: 50 },
    },
  })
}

beforeEach(() => vi.clearAllMocks())

describe('generateSuggestions', () => {
  it('returns parsed array of suggestions', async () => {
    const suggestions = [
      { type: 'grammar', original: 'I writed code', suggestion: 'I wrote code', explanation: 'Past tense' },
    ]
    mockLlm(JSON.stringify(suggestions))

    const result = await generateSuggestions('I writed code', 'resume')
    expect(result).toHaveLength(1)
    expect(result[0].type).toBe('grammar')
    expect(result[0].original).toBe('I writed code')
  })

  it('strips markdown code fences before parsing', async () => {
    const suggestions = [{ type: 'style', original: 'x', suggestion: 'y', explanation: 'z' }]
    mockLlm('```json\n' + JSON.stringify(suggestions) + '\n```')

    const result = await generateSuggestions('content', 'resume')
    expect(result).toHaveLength(1)
  })

  it('returns empty array when LLM returns non-JSON text', async () => {
    mockLlm('I cannot process this document.')
    const result = await generateSuggestions('content', 'resume')
    expect(result).toEqual([])
  })

  it('passes the custom API key to the Google client', async () => {
    mockLlm('[]')
    const { GoogleGenerativeAI } = await import('@google/generative-ai')

    await generateSuggestions('content', 'resume', 'custom-key-123')
    expect(vi.mocked(GoogleGenerativeAI)).toHaveBeenCalledWith('custom-key-123')
  })
})

describe('applySuggestions', () => {
  it('replaces each original with the suggested text', async () => {
    const content = 'I am a hardworking developer. I love coding.'
    const suggestions = [
      { type: 'style' as const, original: 'I am a hardworking developer', suggestion: 'Results-driven developer', explanation: '' },
      { type: 'style' as const, original: 'I love coding', suggestion: 'Passionate about software engineering', explanation: '' },
    ]
    const result = await applySuggestions(content, suggestions)
    expect(result).toBe('Results-driven developer. Passionate about software engineering.')
  })

  it('leaves content unchanged when suggestions array is empty', async () => {
    const content = 'Original content.'
    const result = await applySuggestions(content, [])
    expect(result).toBe(content)
  })

  it('skips suggestions whose original text is not found in content', async () => {
    const content = 'Hello world.'
    const suggestions = [
      { type: 'grammar' as const, original: 'text not in document', suggestion: 'replacement', explanation: '' },
    ]
    const result = await applySuggestions(content, suggestions)
    expect(result).toBe(content)
  })
})

describe('summarizeDocument', () => {
  it('returns trimmed summary text', async () => {
    mockLlm('  Experienced engineer with 5 years in web.  ')
    const result = await summarizeDocument('My resume content')
    expect(result).toBe('Experienced engineer with 5 years in web.')
  })
})

describe('scoreDocumentQuality', () => {
  it('returns parsed score, issues, and strengths', async () => {
    const scoreObj = { score: 7, issues: ['Missing metrics'], strengths: ['Clear summary'] }
    mockLlm(JSON.stringify(scoreObj))

    const result = await scoreDocumentQuality('resume content', 'resume')
    expect(result.score).toBe(7)
    expect(result.issues).toContain('Missing metrics')
    expect(result.strengths).toContain('Clear summary')
  })

  it('strips markdown code fences before parsing', async () => {
    const scoreObj = { score: 8, issues: [], strengths: ['Good'] }
    mockLlm('```json\n' + JSON.stringify(scoreObj) + '\n```')

    const result = await scoreDocumentQuality('content', 'resume')
    expect(result.score).toBe(8)
  })

  it('returns fallback score=5 when response is not valid JSON', async () => {
    mockLlm('This document is average.')
    const result = await scoreDocumentQuality('content', 'resume')
    expect(result.score).toBe(5)
    expect(result.issues).toContain('Could not analyze document')
    expect(result.strengths).toEqual([])
  })
})

describe('chatWithDocument', () => {
  it('returns message text without a changes block', async () => {
    mockLlm('Your resume looks great! Consider adding more metrics.')
    const result = await chatWithDocument('How is my resume?', 'resume content')
    expect(result.message).toBe('Your resume looks great! Consider adding more metrics.')
    expect(result.suggestedChanges).toBeUndefined()
  })

  it('extracts suggestedChanges from the <changes> block and removes it from the message', async () => {
    const changes = {
      type: 'improvement',
      description: 'Stronger verbs',
      changes: [{ section: 'experience', original: 'worked on', updated: 'engineered' }],
    }
    mockLlm(`Here are my suggestions.\n<changes>${JSON.stringify(changes)}</changes>`)

    const result = await chatWithDocument('Improve my bullets', 'resume content')
    expect(result.message).toBe('Here are my suggestions.')
    expect(result.suggestedChanges?.type).toBe('improvement')
    expect(result.suggestedChanges?.changes[0].updated).toBe('engineered')
  })

  it('returns message without suggestedChanges when <changes> block contains invalid JSON', async () => {
    mockLlm('Some advice.\n<changes>not valid json</changes>')
    const result = await chatWithDocument('help', 'resume')
    expect(result.message).toBe('Some advice.')
    expect(result.suggestedChanges).toBeUndefined()
  })

  it('includes selectedText in the prompt when provided', async () => {
    mockLlm('Good point.')
    await chatWithDocument('Improve this', 'resume content', 'selected sentence')
    expect(mockGenerateContent).toHaveBeenCalledWith(
      expect.stringContaining('selected sentence')
    )
  })
})

describe('logInteraction', () => {
  it('creates an AI interaction record in the database', async () => {
    mockPrisma.aiInteraction.create.mockResolvedValue({})

    await logInteraction('user-001', 'doc-001', 'prompt text', 'response text', 100, 'suggestion')

    expect(mockPrisma.aiInteraction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-001',
          documentId: 'doc-001',
          interactionType: 'suggestion',
          totalTokens: 100,
        }),
      })
    )
  })

  it('truncates prompt to 2000 chars and response to 5000 chars', async () => {
    mockPrisma.aiInteraction.create.mockResolvedValue({})

    const longPrompt = 'p'.repeat(3000)
    const longResponse = 'r'.repeat(6000)
    await logInteraction('user-001', null, longPrompt, longResponse, 0)

    const { data } = mockPrisma.aiInteraction.create.mock.calls[0][0]
    expect(data.prompt).toHaveLength(2000)
    expect(data.response).toHaveLength(5000)
  })
})
