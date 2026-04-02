import { Router } from 'express'
import multer from 'multer'
import { requireAuth } from '../middleware/auth.js'
import { list, get, create, update, remove } from '../controllers/document.controller.js'

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
    cb(null, allowed.includes(file.mimetype))
  },
})

export const documentRouter = Router()

documentRouter.use(requireAuth)

documentRouter.get('/', list)
documentRouter.post('/', upload.single('file'), create)
documentRouter.get('/:id', get)
documentRouter.put('/:id', update)
documentRouter.delete('/:id', remove)
