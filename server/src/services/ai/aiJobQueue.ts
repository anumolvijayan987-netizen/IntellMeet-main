import crypto from 'crypto'
import { logger } from '../../utils/logger'
import { JobStatus } from './ai.types'

export class AiJobQueue {
  private static jobs: Map<string, JobStatus> = new Map()

  public static enqueueJob(
    type: JobStatus['type'],
    workerFn: () => Promise<any>
  ): JobStatus {
    const jobId = `job_${crypto.randomUUID()}`
    const job: JobStatus = {
      jobId,
      type,
      status: 'queued',
      progress: 0,
      createdAt: new Date().toISOString(),
    }

    this.jobs.set(jobId, job)
    logger.info(`📋 [AI JobQueue] Enqueued ${type} job: ${jobId}`)

    // Execute asynchronously in background
    setTimeout(async () => {
      job.status = 'processing'
      job.progress = 25

      try {
        const result = await workerFn()
        job.status = 'completed'
        job.progress = 100
        job.result = result
        job.completedAt = new Date().toISOString()
        logger.info(`✅ [AI JobQueue] Completed job: ${jobId}`)
      } catch (err: any) {
        job.status = 'failed'
        job.error = err.message || 'Background execution failed'
        job.completedAt = new Date().toISOString()
        logger.error(`❌ [AI JobQueue] Job ${jobId} failed:`, err)
      }
    }, 10)

    return job
  }

  public static getJob(jobId: string): JobStatus | null {
    return this.jobs.get(jobId) || null
  }
}
