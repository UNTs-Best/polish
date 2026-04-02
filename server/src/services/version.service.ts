import { prisma } from '../config/db.js'
import { AppError } from '../middleware/error.js'

export async function createVersion(
  documentId: string,
  content: string,
  userId: string,
  summary?: string
) {
  const last = await prisma.version.findFirst({
    where: { documentId },
    orderBy: { versionNumber: 'desc' },
  })

  return prisma.version.create({
    data: {
      documentId,
      createdBy: userId,
      versionNumber: (last?.versionNumber ?? 0) + 1,
      content,
      changeSummary: summary ?? null,
    },
  })
}

export async function getVersionsByDocument(documentId: string) {
  return prisma.version.findMany({
    where: { documentId },
    orderBy: { versionNumber: 'desc' },
    select: {
      id: true,
      versionNumber: true,
      changeSummary: true,
      createdAt: true,
      author: { select: { firstName: true, lastName: true } },
    },
  })
}

export async function getPaginatedHistory(documentId: string, page: number, limit: number) {
  const skip = (page - 1) * limit
  const [versions, total] = await Promise.all([
    prisma.version.findMany({
      where: { documentId },
      orderBy: { versionNumber: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        versionNumber: true,
        changeSummary: true,
        createdAt: true,
      },
    }),
    prisma.version.count({ where: { documentId } }),
  ])
  return { versions, total, page, limit, pages: Math.ceil(total / limit) }
}

export async function getVersionById(versionId: string) {
  const v = await prisma.version.findUnique({ where: { id: versionId } })
  if (!v) throw new AppError(404, 'Version not found')
  return v
}

export async function restoreVersion(documentId: string, versionId: string, userId: string) {
  const version = await getVersionById(versionId)
  if (version.documentId !== documentId) throw new AppError(400, 'Version does not belong to document')

  await prisma.document.update({
    where: { id: documentId },
    data: { content: version.content },
  })

  return createVersion(
    documentId,
    version.content,
    userId,
    `Restored from version ${version.versionNumber}`
  )
}

export async function compareVersions(versionId1: string, versionId2: string) {
  const [v1, v2] = await Promise.all([getVersionById(versionId1), getVersionById(versionId2)])

  const lines1 = v1.content.split('\n')
  const lines2 = v2.content.split('\n')

  const diff: Array<{ line: number; type: 'added' | 'removed' | 'unchanged'; content: string }> = []
  const maxLen = Math.max(lines1.length, lines2.length)

  for (let i = 0; i < maxLen; i++) {
    const l1 = lines1[i]
    const l2 = lines2[i]
    if (l1 === l2) {
      diff.push({ line: i + 1, type: 'unchanged', content: l1 ?? '' })
    } else {
      if (l1 !== undefined) diff.push({ line: i + 1, type: 'removed', content: l1 })
      if (l2 !== undefined) diff.push({ line: i + 1, type: 'added', content: l2 })
    }
  }

  return { version1: v1, version2: v2, diff }
}
