import type { AiInteraction } from '@prisma/client'

type LogInteractionData = {
  userId: string
  documentId?: string
  prompt: string
  response: string
  model: string
  promptTokens?: number
  completionTokens?: number
  totalTokens?: number
  cost?: number
  interactionType?: string
  meta?: Record<string, unknown>
}

export async function logInteraction(data: LogInteractionData): Promise<AiInteraction> {
  throw new Error('not implemented')
}

export async function getUserInteractions(userId: string, limit?: number): Promise<AiInteraction[]> {
  throw new Error('not implemented')
}

export async function getDocumentInteractions(documentId: string, limit?: number): Promise<AiInteraction[]> {
  throw new Error('not implemented')
}
