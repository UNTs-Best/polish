import type { Document } from '@prisma/client'

type CreateDocumentData = {
  userId: string
  title: string
  content?: string
  documentType?: string
  fileName?: string
  fileUrl?: string
  fileSize?: number
  mimeType?: string
}

type UpdateDocumentData = Partial<Pick<Document, 'title' | 'content' | 'status'>>

export async function createDocument(data: CreateDocumentData): Promise<Document> {
  throw new Error('not implemented')
}

export async function getUserDocuments(userId: string): Promise<Document[]> {
  throw new Error('not implemented')
}

export async function getDocumentById(id: string): Promise<Document | null> {
  throw new Error('not implemented')
}

export async function updateDocument(id: string, updates: UpdateDocumentData, updatedBy: string): Promise<Document> {
  throw new Error('not implemented')
}

export async function deleteDocument(id: string): Promise<void> {
  throw new Error('not implemented')
}
