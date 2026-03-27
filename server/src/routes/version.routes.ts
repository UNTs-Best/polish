import { Router } from 'express'
import * as versionController from '../controllers/version.controller'
import { requireAuth } from '../middleware/auth'

const router = Router()

router.get('/document/:documentId', requireAuth, versionController.listVersions)
router.get('/document/:documentId/history', requireAuth, versionController.getVersionHistory)
router.get('/:versionId', requireAuth, versionController.getVersion)
router.post('/document/:documentId/restore/:versionId', requireAuth, versionController.restoreVersion)
router.get('/compare/:versionId1/:versionId2', requireAuth, versionController.compareVersions)

export default router
