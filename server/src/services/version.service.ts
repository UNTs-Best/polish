import type { Version } from '@prisma/client'

type CreateVersionData = {
  content: string
  changeSummary?: string
  createdBy: string
}

type VersionDiff = {
  versionId1: string
  versionId2: string
  diff: string
}

export async function createVersion(documentId: string, data: CreateVersionData): Promise<Version> {
  throw new Error('not implemented')
}

export async function getDocumentVersions(documentId: string): Promise<Version[]> {
  throw new Error('not implemented')
}

export async function getLatestVersion(documentId: string): Promise<Version | null> {
  throw new Error('not implemented')
}

export async function getVersionById(versionId: string): Promise<Version | null> {
  throw new Error('not implemented')
}

export async function restoreVersion(documentId: string, versionId: string, restoredBy: string): Promise<Version> {
  throw new Error('not implemented')
}

export async function compareVersions(v1Id: string, v2Id: string): Promise<VersionDiff> {
  throw new Error('not implemented')
}

export async function getVersionHistory(documentId: string, limit: number): Promise<Version[]> {
  throw new Error('not implemented')
}
