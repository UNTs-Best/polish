export type UploadResult = {
  path: string
  url: string
  fileName: string
}

export async function uploadFile(
  filePath: string,
  originalName: string,
  userId: string,
): Promise<UploadResult> {
  throw new Error('not implemented')
}

export async function deleteFile(storagePath: string): Promise<void> {
  throw new Error('not implemented')
}

export async function getPresignedUrl(storagePath: string, expiresIn?: number): Promise<string> {
  throw new Error('not implemented')
}
