import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockPrisma = vi.hoisted(() => ({
  version: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    count: vi.fn(),
  },
  document: { update: vi.fn() },
}))

vi.mock('../../../src/config/db.js', () => ({ prisma: mockPrisma }))
vi.mock('../../../src/config/redis.js', () => ({
  redis: { on: vi.fn(), ping: vi.fn(), quit: vi.fn() },
}))

import {
  createVersion,
  getVersionsByDocument,
  getPaginatedHistory,
  getVersionById,
  restoreVersion,
  compareVersions,
} from '../../../src/services/version.service.js'

const documentId = 'doc-001'
const userId = 'user-001'

const v1 = { id: 'ver-001', documentId, createdBy: userId, versionNumber: 1, content: 'First version', changeSummary: 'Initial', createdAt: new Date() }
const v2 = { id: 'ver-002', documentId, createdBy: userId, versionNumber: 2, content: 'Second version', changeSummary: null, createdAt: new Date() }

beforeEach(() => vi.clearAllMocks())

describe('createVersion', () => {
  it('starts at version 1 when there is no previous version', async () => {
    mockPrisma.version.findFirst.mockResolvedValue(null)
    mockPrisma.version.create.mockResolvedValue({ ...v1, versionNumber: 1 })

    await createVersion(documentId, 'First version', userId, 'Initial')

    expect(mockPrisma.version.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ versionNumber: 1 }) })
    )
  })

  it('increments the version number from the last version', async () => {
    mockPrisma.version.findFirst.mockResolvedValue(v1)
    mockPrisma.version.create.mockResolvedValue({ ...v2, versionNumber: 2 })

    await createVersion(documentId, 'Second version', userId)

    expect(mockPrisma.version.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ versionNumber: 2 }) })
    )
  })

  it('stores the changeSummary when provided', async () => {
    mockPrisma.version.findFirst.mockResolvedValue(null)
    mockPrisma.version.create.mockResolvedValue(v1)

    await createVersion(documentId, 'content', userId, 'My summary')

    expect(mockPrisma.version.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ changeSummary: 'My summary' }) })
    )
  })
})

describe('getVersionsByDocument', () => {
  it('returns versions ordered by versionNumber desc', async () => {
    mockPrisma.version.findMany.mockResolvedValue([v2, v1])
    const result = await getVersionsByDocument(documentId)
    expect(result).toHaveLength(2)
    expect(mockPrisma.version.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { documentId }, orderBy: { versionNumber: 'desc' } })
    )
  })
})

describe('getPaginatedHistory', () => {
  it('calculates skip correctly and returns pagination metadata', async () => {
    mockPrisma.version.findMany.mockResolvedValue([v1, v2])
    mockPrisma.version.count.mockResolvedValue(25)

    const result = await getPaginatedHistory(documentId, 3, 10)

    expect(mockPrisma.version.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 20, take: 10 })
    )
    expect(result.page).toBe(3)
    expect(result.limit).toBe(10)
    expect(result.total).toBe(25)
    expect(result.pages).toBe(3)
  })

  it('returns pages=1 when there are no versions', async () => {
    mockPrisma.version.findMany.mockResolvedValue([])
    mockPrisma.version.count.mockResolvedValue(0)

    const result = await getPaginatedHistory(documentId, 1, 20)
    expect(result.pages).toBe(0)
    expect(result.total).toBe(0)
  })
})

describe('getVersionById', () => {
  it('returns the version when found', async () => {
    mockPrisma.version.findUnique.mockResolvedValue(v1)
    const result = await getVersionById('ver-001')
    expect(result.id).toBe('ver-001')
  })

  it('throws AppError 404 when version does not exist', async () => {
    mockPrisma.version.findUnique.mockResolvedValue(null)
    await expect(getVersionById('missing')).rejects.toMatchObject({ statusCode: 404 })
  })
})

describe('restoreVersion', () => {
  it('updates the document content and creates a new version', async () => {
    mockPrisma.version.findUnique.mockResolvedValue(v1)
    mockPrisma.document.update.mockResolvedValue({})
    mockPrisma.version.findFirst.mockResolvedValue(v2)
    mockPrisma.version.create.mockResolvedValue({ ...v2, versionNumber: 3, changeSummary: 'Restored from version 1' })

    const result = await restoreVersion(documentId, 'ver-001', userId)

    expect(mockPrisma.document.update).toHaveBeenCalledWith({
      where: { id: documentId },
      data: { content: v1.content },
    })
    expect(result.changeSummary).toMatch(/restored from version 1/i)
  })

  it('throws AppError 400 when the version belongs to a different document', async () => {
    mockPrisma.version.findUnique.mockResolvedValue({ ...v1, documentId: 'other-doc' })

    await expect(restoreVersion(documentId, 'ver-001', userId)).rejects.toMatchObject({ statusCode: 400 })
    expect(mockPrisma.document.update).not.toHaveBeenCalled()
  })
})

describe('compareVersions', () => {
  it('marks identical lines as unchanged', async () => {
    const a = { ...v1, content: 'line1\nline2\nline3' }
    const b = { ...v2, content: 'line1\nline2\nline3' }
    mockPrisma.version.findUnique.mockResolvedValueOnce(a).mockResolvedValueOnce(b)

    const { diff } = await compareVersions('ver-001', 'ver-002')
    expect(diff.every((d: { type: string }) => d.type === 'unchanged')).toBe(true)
    expect(diff).toHaveLength(3)
  })

  it('marks differing lines as removed/added', async () => {
    const a = { ...v1, content: 'same\noriginal\nsame' }
    const b = { ...v2, content: 'same\nchanged\nsame' }
    mockPrisma.version.findUnique.mockResolvedValueOnce(a).mockResolvedValueOnce(b)

    const { diff } = await compareVersions('ver-001', 'ver-002')
    const removed = diff.filter((d: { type: string }) => d.type === 'removed')
    const added = diff.filter((d: { type: string }) => d.type === 'added')
    expect(removed).toHaveLength(1)
    expect(removed[0].content).toBe('original')
    expect(added).toHaveLength(1)
    expect(added[0].content).toBe('changed')
  })

  it('handles version 2 being longer than version 1', async () => {
    const a = { ...v1, content: 'line1' }
    const b = { ...v2, content: 'line1\nnew line' }
    mockPrisma.version.findUnique.mockResolvedValueOnce(a).mockResolvedValueOnce(b)

    const { diff } = await compareVersions('ver-001', 'ver-002')
    const added = diff.filter((d: { type: string }) => d.type === 'added')
    expect(added[0].content).toBe('new line')
  })

  it('handles version 1 being longer than version 2', async () => {
    const a = { ...v1, content: 'line1\nremoved line' }
    const b = { ...v2, content: 'line1' }
    mockPrisma.version.findUnique.mockResolvedValueOnce(a).mockResolvedValueOnce(b)

    const { diff } = await compareVersions('ver-001', 'ver-002')
    const removed = diff.filter((d: { type: string }) => d.type === 'removed')
    expect(removed[0].content).toBe('removed line')
  })

  it('throws AppError 404 when either version does not exist', async () => {
    mockPrisma.version.findUnique.mockResolvedValue(null)
    await expect(compareVersions('missing', 'ver-002')).rejects.toMatchObject({ statusCode: 404 })
  })
})
