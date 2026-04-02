import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { suggestions, applyAll, summary, quality, updateContent } from '../controllers/llm.controller.js'

export const llmRouter = Router()

llmRouter.use(requireAuth)

llmRouter.get('/documents/:documentId/suggestions', suggestions)
llmRouter.post('/documents/:documentId/apply-suggestions', applyAll)
llmRouter.get('/documents/:documentId/summary', summary)
llmRouter.get('/documents/:documentId/quality', quality)
llmRouter.put('/documents/:documentId/content', updateContent)
