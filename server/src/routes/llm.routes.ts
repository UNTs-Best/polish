import { Router } from 'express'
import * as llmController from '../controllers/llm.controller'
import { requireAuth } from '../middleware/auth'

const router = Router()

router.post('/documents/:documentId/suggestions', requireAuth, llmController.generateSuggestions)
router.post('/documents/:documentId/apply-suggestions', requireAuth, llmController.applySuggestions)
router.get('/documents/:documentId/summary', requireAuth, llmController.summarizeDocument)
router.get('/documents/:documentId/quality', requireAuth, llmController.checkDocumentQuality)
router.put('/documents/:documentId/content', requireAuth, llmController.updateDocumentContent)

export default router
