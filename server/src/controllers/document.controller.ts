import type { Response, NextFunction } from 'express'
import { z } from 'zod'
import {
  getUserDocuments,
  getDocumentById,
  createDocument,
  updateDocument,
  deleteDocument,
} from '../services/document.service.js'
import type { AuthRequest } from '../middleware/auth.js'

export async function list(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const docs = await getUserDocuments(req.user!.id)
    res.json({ documents: docs })
  } catch (err) {
    next(err)
  }
}

export async function get(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const doc = await getDocumentById(req.params.id!, req.user!.id)
    res.json({ document: doc })
  } catch (err) {
    next(err)
  }
}

export async function create(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = z
      .object({
        title: z.string().min(1),
        content: z.string().optional(),
        documentType: z.string().optional(),
      })
      .parse(req.body)

    const doc = await createDocument(req.user!.id, data, req.file)
    res.status(201).json({ document: doc })
  } catch (err) {
    next(err)
  }
}

export async function update(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = z
      .object({
        title: z.string().min(1).optional(),
        content: z.string().optional(),
        documentType: z.string().optional(),
      })
      .parse(req.body)

    const doc = await updateDocument(req.params.id!, req.user!.id, data)
    res.json({ document: doc })
  } catch (err) {
    next(err)
  }
}

export async function remove(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await deleteDocument(req.params.id!, req.user!.id)
    res.json({ message: 'Document deleted' })
  } catch (err) {
    next(err)
  }
}
