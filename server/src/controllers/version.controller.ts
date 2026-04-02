import type { Response, NextFunction } from 'express'
import {
  getVersionsByDocument,
  getPaginatedHistory,
  getVersionById,
  restoreVersion,
  compareVersions,
} from '../services/version.service.js'
import { getDocumentById } from '../services/document.service.js'
import type { AuthRequest } from '../middleware/auth.js'

async function assertDocumentOwnership(documentId: string, userId: string) {
  await getDocumentById(documentId, userId)
}

export async function list(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await assertDocumentOwnership(req.params.documentId!, req.user!.id)
    const versions = await getVersionsByDocument(req.params.documentId!)
    res.json({ versions })
  } catch (err) {
    next(err)
  }
}

export async function history(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await assertDocumentOwnership(req.params.documentId!, req.user!.id)
    const page = Number(req.query.page ?? 1)
    const limit = Number(req.query.limit ?? 20)
    const result = await getPaginatedHistory(req.params.documentId!, page, limit)
    res.json(result)
  } catch (err) {
    next(err)
  }
}

export async function getOne(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const version = await getVersionById(req.params.versionId!)
    await assertDocumentOwnership(version.documentId, req.user!.id)
    res.json({ version })
  } catch (err) {
    next(err)
  }
}

export async function restore(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await assertDocumentOwnership(req.params.documentId!, req.user!.id)
    const version = await restoreVersion(
      req.params.documentId!,
      req.params.versionId!,
      req.user!.id
    )
    res.json({ version })
  } catch (err) {
    next(err)
  }
}

export async function compare(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await compareVersions(req.params.versionId1!, req.params.versionId2!)
    await assertDocumentOwnership(result.version1.documentId, req.user!.id)
    res.json(result)
  } catch (err) {
    next(err)
  }
}
