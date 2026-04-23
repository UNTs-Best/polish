import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockPrisma = vi.hoisted(() => ({
  document: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  version: { findFirst: vi.fn(), create: vi.fn() },
}))

vi.mock('../../../src/config/db.js', () => ({ prisma: mockPrisma }))
vi.mock('../../../src/config/redis.js', () => ({
  redis: { on: vi.fn(), ping: vi.fn(), quit: vi.fn() },
}))
vi.mock('../../../src/utils/storage.js', () => ({
  uploadFile: vi.fn().mockResolvedValue('documents/user-001/file.pdf'),
  deleteFile: vi.fn().mockResolvedValue(undefined),
  s3Enabled: false,
}))

import {
  getUserDocuments,
  getDocumentById,
  createDocument,
  updateDocument,
  deleteDocument,
} from '../../../src/services/document.service.js'
import { uploadFile, deleteFile } from '../../../src/utils/storage.js'

const userId = 'user-001'

const baseDoc = {
  id: 'doc-001',
  userId,
  title: 'My Resume',
  content: 'Resume content',
  documentType: 'resume',
  fileName: null,
  fileUrl: null,
  fileSize: null,
  mimeType: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}

beforeEach(() => {
  vi.clearAllMocks()
  mockPrisma.version.findFirst.mockResolvedValue(null)
  mockPrisma.version.create.mockResolvedValue({ id: 'v1', versionNumber: 1 })
})

describe('getUserDocuments', () => {
  it('returns all documents for the user ordered by updatedAt desc', async () => {
    mockPrisma.document.findMany.mockResolvedValue([baseDoc])
    const result = await getUserDocuments(userId)
    expect(result).toEqual([baseDoc])
    expect(mockPrisma.document.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId }, orderBy: { updatedAt: 'desc' } })
    )
  })
})

describe('getDocumentById', () => {
  it('returns the document when it belongs to the user', async () => {
    mockPrisma.document.findUnique.mockResolvedValue(baseDoc)
    const result = await getDocumentById('doc-001', userId)
    expect(result).toEqual(baseDoc)
  })

  it('throws AppError 404 when document does not exist', async () => {
    mockPrisma.document.findUnique.mockResolvedValue(null)
    await expect(getDocumentById('missing', userId)).rejects.toMatchObject({ statusCode: 404 })
  })

  it('throws AppError 403 when document belongs to a different user', async () => {
    mockPrisma.document.findUnique.mockResolvedValue({ ...baseDoc, userId: 'other-user' })
    await expect(getDocumentById('doc-001', userId)).rejects.toMatchObject({ statusCode: 403 })
  })
})

describe('createDocument', () => {
  it('creates a document and an initial version when content is provided', async () => {
    mockPrisma.document.create.mockResolvedValue(baseDoc)

    const result = await createDocument(userId, { title: 'My Resume', content: 'Resume content', documentType: 'resume' })

    expect(mockPrisma.document.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId, title: 'My Resume', content: 'Resume content' }),
      })
    )
    expect(mockPrisma.version.create).toHaveBeenCalledOnce()
    expect(result.id).toBe('doc-001')
  })

  it('does not create a version when content is empty', async () => {
    mockPrisma.document.create.mockResolvedValue({ ...baseDoc, content: '' })

    await createDocument(userId, { title: 'Empty Doc' })

    expect(mockPrisma.version.create).not.toHaveBeenCalled()
  })

  it('uploads a file when provided and stores the key as fileUrl', async () => {
    const fileDoc = { ...baseDoc, fileUrl: 'documents/user-001/resume.pdf', fileName: 'resume.pdf', fileSize: 1024, mimeType: 'application/pdf' }
    mockPrisma.document.create.mockResolvedValue(fileDoc)

    const file = { originalname: 'resume.pdf', buffer: Buffer.from('pdf'), size: 1024, mimetype: 'application/pdf' } as Express.Multer.File
    await createDocument(userId, { title: 'My Resume' }, file)

    expect(vi.mocked(uploadFile)).toHaveBeenCalledWith(file.buffer, expect.stringContaining('resume.pdf'), 'application/pdf')
    expect(mockPrisma.document.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ fileName: 'resume.pdf', fileSize: 1024, mimeType: 'application/pdf' }),
      })
    )
  })
})

describe('updateDocument', () => {
  it('updates the document fields', async () => {
    mockPrisma.document.findUnique.mockResolvedValue(baseDoc)
    mockPrisma.document.update.mockResolvedValue({ ...baseDoc, title: 'New Title' })

    const result = await updateDocument('doc-001', userId, { title: 'New Title' })
    expect(result.title).toBe('New Title')
    expect(mockPrisma.document.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'doc-001' }, data: { title: 'New Title' } })
    )
  })

  it('creates a new version when content is updated', async () => {
    mockPrisma.document.findUnique.mockResolvedValue(baseDoc)
    mockPrisma.document.update.mockResolvedValue({ ...baseDoc, content: 'Updated content' })

    await updateDocument('doc-001', userId, { content: 'Updated content' })

    expect(mockPrisma.version.create).toHaveBeenCalledOnce()
  })

  it('does not create a version when content is not part of the update', async () => {
    mockPrisma.document.findUnique.mockResolvedValue(baseDoc)
    mockPrisma.document.update.mockResolvedValue({ ...baseDoc, title: 'New Title' })

    await updateDocument('doc-001', userId, { title: 'New Title' })

    expect(mockPrisma.version.create).not.toHaveBeenCalled()
  })
})

describe('deleteDocument', () => {
  it('deletes the document from the database', async () => {
    mockPrisma.document.findUnique.mockResolvedValue(baseDoc)
    mockPrisma.document.delete.mockResolvedValue(baseDoc)

    await deleteDocument('doc-001', userId)
    expect(mockPrisma.document.delete).toHaveBeenCalledWith({ where: { id: 'doc-001' } })
  })

  it('deletes the file from storage before removing the document', async () => {
    const docWithFile = { ...baseDoc, fileUrl: 'documents/user-001/resume.pdf' }
    mockPrisma.document.findUnique.mockResolvedValue(docWithFile)
    mockPrisma.document.delete.mockResolvedValue(docWithFile)

    await deleteDocument('doc-001', userId)
    expect(vi.mocked(deleteFile)).toHaveBeenCalledWith('documents/user-001/resume.pdf')
  })

  it('still deletes the document even if S3 deletion fails', async () => {
    const docWithFile = { ...baseDoc, fileUrl: 'documents/user-001/resume.pdf' }
    mockPrisma.document.findUnique.mockResolvedValue(docWithFile)
    mockPrisma.document.delete.mockResolvedValue(docWithFile)
    vi.mocked(deleteFile).mockRejectedValue(new Error('S3 error'))

    await expect(deleteDocument('doc-001', userId)).resolves.not.toThrow()
    expect(mockPrisma.document.delete).toHaveBeenCalled()
  })
})
