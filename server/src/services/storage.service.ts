import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import path from 'path'
import fs from 'fs'
import { env } from '../config/env'
import { logger } from '../utils/logger'
import { Recording, IRecordingDocument } from '../models/Recording.model'
import { db } from '../config/db'

export interface UploadRecordingOptions {
  meetingId: string
  title: string
  durationSeconds: number
  buffer: Buffer
  mimeType: string
  format?: 'mp4' | 'webm'
}

export class StorageService {
  private static s3Client: S3Client | null = null

  private static getClient(): S3Client | null {
    if (this.s3Client) return this.s3Client

    if (env.S3_ACCESS_KEY_ID && env.S3_SECRET_ACCESS_KEY) {
      this.s3Client = new S3Client({
        region: env.S3_REGION || 'auto',
        endpoint: env.S3_ENDPOINT || undefined,
        credentials: {
          accessKeyId: env.S3_ACCESS_KEY_ID,
          secretAccessKey: env.S3_SECRET_ACCESS_KEY,
        },
        forcePathStyle: true,
      })
      logger.info('☁️ Cloudflare R2 / S3 persistent storage client initialized.')
      return this.s3Client
    }

    return null
  }

  /**
   * Uploads recorded audio/video buffer to persistent S3 / Cloudflare R2 storage
   * and persists metadata in MongoDB.
   */
  public static async uploadRecording(
    options: UploadRecordingOptions
  ): Promise<any> {
    const { meetingId, title, durationSeconds, buffer, mimeType, format = 'webm' } = options
    const key = `recordings/${meetingId}/${Date.now()}.${format}`
    let publicUrl = `${env.S3_PUBLIC_URL}/${key}`

    const client = this.getClient()

    if (client) {
      // 1. Upload to Cloudflare R2 / AWS S3
      await client.send(
        new PutObjectCommand({
          Bucket: env.S3_BUCKET_NAME,
          Key: key,
          Body: buffer,
          ContentType: mimeType,
          Metadata: {
            meetingId,
            duration: String(durationSeconds),
          },
        })
      )
      logger.info(`📼 [Storage] Uploaded recording to S3/R2: ${key} (${buffer.length} bytes)`)
    } else {
      // Offline/Dev fallback: ensure persistent directory storage
      const uploadDir = path.resolve(process.cwd(), 'uploads', 'recordings', meetingId)
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true })
      }
      const localFilePath = path.join(uploadDir, `${Date.now()}.${format}`)
      fs.writeFileSync(localFilePath, buffer)
      publicUrl = `/uploads/recordings/${meetingId}/${path.basename(localFilePath)}`
      logger.info(`📼 [Storage] Persisted recording to storage: ${localFilePath} (${buffer.length} bytes)`)
    }

    // 2. Persist recording record in MongoDB
    if (db.isConnected()) {
      const record = await Recording.create({
        meetingId,
        title,
        url: publicUrl,
        durationSeconds,
        fileSize: buffer.length,
        format,
        status: 'ready',
      })
      return record
    }

    return {
      _id: `rec_${Date.now()}`,
      meetingId,
      title,
      url: publicUrl,
      durationSeconds,
      fileSize: buffer.length,
      format,
      status: 'ready',
      createdAt: new Date(),
    }
  }
}
