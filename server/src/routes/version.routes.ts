import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { list, history, getOne, restore, compare } from '../controllers/version.controller.js'

export const versionRouter = Router()

versionRouter.use(requireAuth)

versionRouter.get('/document/:documentId', list)
versionRouter.get('/document/:documentId/history', history)
versionRouter.get('/:versionId', getOne)
versionRouter.post('/document/:documentId/restore/:versionId', restore)
versionRouter.get('/compare/:versionId1/:versionId2', compare)
