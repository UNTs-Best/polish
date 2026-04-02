import type { Response, NextFunction } from 'express'
import { z } from 'zod'
import {
  generateSuggestions,
  applySuggestions,
  summarizeDocument,
  scoreDocumentQuality,
  chatWithDocument,
  logInteraction,
  type Suggestion,
} from '../services/llm.service.js'
import { getDocumentById, updateDocument } from '../services/document.service.js'
import type { AuthRequest } from '../middleware/auth.js'

export async function suggestions(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const doc = await getDocumentById(req.params.documentId!, req.user!.id)
    const result = await generateSuggestions(doc.content, doc.documentType ?? 'resume')
    await logInteraction(req.user!.id, doc.id, doc.content, JSON.stringify(result), 0, 'suggestion')
    res.json({ suggestions: result })
  } catch (err) {
    next(err)
  }
}

export async function applyAll(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { suggestions: incoming } = z
      .object({ suggestions: z.array(z.any()) })
      .parse(req.body)

    const doc = await getDocumentById(req.params.documentId!, req.user!.id)
    const newContent = await applySuggestions(doc.content, incoming as Suggestion[])
    const updated = await updateDocument(req.params.documentId!, req.user!.id, {
      content: newContent,
    })
    res.json({ document: updated })
  } catch (err) {
    next(err)
  }
}

export async function summary(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const doc = await getDocumentById(req.params.documentId!, req.user!.id)
    const text = await summarizeDocument(doc.content)
    await logInteraction(req.user!.id, doc.id, doc.content, text, 0, 'summary')
    res.json({ summary: text })
  } catch (err) {
    next(err)
  }
}

export async function quality(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const doc = await getDocumentById(req.params.documentId!, req.user!.id)
    const result = await scoreDocumentQuality(doc.content, doc.documentType ?? 'resume')
    await logInteraction(req.user!.id, doc.id, doc.content, JSON.stringify(result), 0, 'quality')
    res.json(result)
  } catch (err) {
    next(err)
  }
}

export async function chat(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { message, selectedText } = z
      .object({ message: z.string().min(1), selectedText: z.string().optional() })
      .parse(req.body)

    const doc = await getDocumentById(req.params.documentId!, req.user!.id)
    const result = await chatWithDocument(message, doc.content, selectedText)
    await logInteraction(req.user!.id, doc.id, message, result.message, 0, 'chat')
    res.json(result)
  } catch (err) {
    next(err)
  }
}

export async function updateContent(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { content } = z.object({ content: z.string() }).parse(req.body)
    const doc = await updateDocument(req.params.documentId!, req.user!.id, { content })
    res.json({ document: doc })
  } catch (err) {
    next(err)
  }
}
