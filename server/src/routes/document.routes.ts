import { Router } from 'express'
import multer from 'multer'
import * as documentController from '../controllers/document.controller'
import { requireAuth } from '../middleware/auth'

const router = Router()
const upload = multer({ dest: 'uploads/' })

router.get('/', requireAuth, documentController.listDocuments)
router.post('/', requireAuth, upload.single('file'), documentController.createDocument)
router.put('/:id', requireAuth, documentController.updateDocument)
router.delete('/:id', requireAuth, documentController.deleteDocument)

export default router
