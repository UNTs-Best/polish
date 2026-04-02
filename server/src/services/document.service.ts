import { prisma } from '../config/db.js'
import { AppError } from '../middleware/error.js'
import { uploadFile, deleteFile } from '../utils/storage.js'
import { createVersion } from './version.service.js'

export async function getUserDocuments(userId: string) {
  return prisma.document.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      title: true,
      documentType: true,
      fileUrl: true,
      createdAt: true,
      updatedAt: true,
    },
  })
}

export async function getDocumentById(id: string, userId: string) {
  const doc = await prisma.document.findUnique({ where: { id } })
  if (!doc) throw new AppError(404, 'Document not found')
  if (doc.userId !== userId) throw new AppError(403, 'Forbidden')
  return doc
}

export async function createDocument(
  userId: string,
  data: { title: string; content?: string; documentType?: string },
  file?: Express.Multer.File
) {
  let fileUrl: string | undefined
  let fileName: string | undefined
  let fileSize: number | undefined
  let mimeType: string | undefined

  if (file) {
    const key = `documents/${userId}/${Date.now()}-${file.originalname}`
    await uploadFile(file.buffer, key, file.mimetype)
    fileUrl = key
    fileName = file.originalname
    fileSize = file.size
    mimeType = file.mimetype
  }

  const doc = await prisma.document.create({
    data: {
      userId,
      title: data.title,
      content: data.content ?? '',
      documentType: data.documentType,
      fileUrl,
      fileName,
      fileSize,
      mimeType,
    },
  })

  if (doc.content) {
    await createVersion(doc.id, doc.content, userId, 'Initial version')
  }

  return doc
}

export async function updateDocument(
  id: string,
  userId: string,
  data: { title?: string; content?: string; documentType?: string }
) {
  await getDocumentById(id, userId)

  const updated = await prisma.document.update({
    where: { id },
    data,
  })

  if (data.content !== undefined) {
    await createVersion(id, data.content, userId)
  }

  return updated
}

export async function deleteDocument(id: string, userId: string) {
  const doc = await getDocumentById(id, userId)

  if (doc.fileUrl) {
    await deleteFile(doc.fileUrl).catch(() => {})
  }

  await prisma.document.delete({ where: { id } })
}
