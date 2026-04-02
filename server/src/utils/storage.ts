import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { env } from '../config/env.js'

export const s3Enabled =
  !!env.S3_BUCKET && !!env.S3_ACCESS_KEY && !!env.S3_SECRET_KEY

export const s3 = s3Enabled
  ? new S3Client({
      region: env.S3_REGION,
      endpoint: env.S3_ENDPOINT,
      credentials: {
        accessKeyId: env.S3_ACCESS_KEY!,
        secretAccessKey: env.S3_SECRET_KEY!,
      },
      forcePathStyle: !!env.S3_ENDPOINT,
    })
  : null

export async function uploadFile(
  buffer: Buffer,
  key: string,
  mimeType: string
): Promise<string> {
  if (!s3 || !env.S3_BUCKET) throw new Error('Storage not configured')
  await s3.send(
    new PutObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    })
  )
  return key
}

export async function deleteFile(key: string): Promise<void> {
  if (!s3 || !env.S3_BUCKET) return
  await s3.send(new DeleteObjectCommand({ Bucket: env.S3_BUCKET, Key: key }))
}

export async function getPresignedUrl(key: string, expiresIn = 3600): Promise<string> {
  if (!s3 || !env.S3_BUCKET) throw new Error('Storage not configured')
  return getSignedUrl(
    s3,
    new GetObjectCommand({ Bucket: env.S3_BUCKET, Key: key }),
    { expiresIn }
  )
}

export async function checkS3Health(): Promise<boolean> {
  if (!s3 || !env.S3_BUCKET) return false
  try {
    await s3.send(new HeadBucketCommand({ Bucket: env.S3_BUCKET }))
    return true
  } catch {
    return false
  }
}
