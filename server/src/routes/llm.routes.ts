import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { suggestions, applyAll, summary, quality, chat, updateContent } from '../controllers/llm.controller.js'

export const llmRouter = Router()

llmRouter.use(requireAuth)

llmRouter.get('/documents/:documentId/suggestions', suggestions)
llmRouter.post('/documents/:documentId/apply-suggestions', applyAll)
llmRouter.get('/documents/:documentId/summary', summary)
llmRouter.get('/documents/:documentId/quality', quality)
llmRouter.post('/documents/:documentId/chat', chat)
llmRouter.put('/documents/:documentId/content', updateContent)
