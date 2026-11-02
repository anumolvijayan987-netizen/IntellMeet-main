import { Request, Response } from 'express'
import { AiService } from '../services/ai.service'
import { AiJobQueue } from '../services/ai/aiJobQueue'
import { ApiResponse } from '../utils/apiResponse'
import { AppError } from '../utils/appError'

export const summarizeMeeting = async (req: Request, res: Response): Promise<void> => {
  const { roomName = 'IntellMeet Session', transcript = [], messages = [], asyncMode = false } = req.body

  if (asyncMode) {
    const job = AiJobQueue.enqueueJob('summarization', () =>
      AiService.summarizeMeeting(roomName, transcript, messages)
    )
    ApiResponse.created(res, job, 'Summarization job enqueued in background.')
    return
  }

  const result = await AiService.summarizeMeeting(roomName, transcript, messages)
  ApiResponse.success(res, result, 'Meeting intelligence summary generated.')
}

export const extractTasks = async (req: Request, res: Response): Promise<void> => {
  const { meetingId = 'session', transcript = [] } = req.body

  const tasks = await AiService.extractTasks(meetingId, transcript)
  ApiResponse.created(res, tasks, 'Action items extracted successfully.')
}

export const askAssistant = async (req: Request, res: Response): Promise<void> => {
  const { meetingId, roomName } = req.body
  const question = (req.body.question || req.body.query || '').trim()

  if (!question) {
    throw AppError.badRequest('Question text is required.')
  }

  const answer = await AiService.askAssistant(meetingId || roomName || 'general', question)
  ApiResponse.success(res, answer, 'Assistant response generated.')
}

export const transcribeAudio = async (req: Request, res: Response): Promise<void> => {
  if (!req.file) {
    throw AppError.badRequest('No audio file provided for transcription.')
  }

  const meetingId = String(req.body.meetingId || 'meeting')
  const language = req.body.language || 'en'
  const asyncMode = req.body.asyncMode === 'true' || req.body.asyncMode === true

  if (asyncMode) {
    const job = AiService.enqueueTranscriptionJob(
      meetingId,
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    )
    ApiResponse.created(res, job, 'Transcription job enqueued in background.')
    return
  }

  const segments = await AiService.transcribeAudio(
    meetingId,
    req.file.buffer,
    req.file.originalname,
    req.file.mimetype,
    language
  )

  ApiResponse.created(res, segments, 'Audio transcription completed and segments persisted.')
}

export const getJobStatus = async (req: Request, res: Response): Promise<void> => {
  const jobId = String(req.params.jobId)

  const job = AiJobQueue.getJob(jobId)
  if (!job) {
    throw AppError.notFound(`Job with ID ${jobId} not found.`)
  }

  ApiResponse.success(res, job, 'Job status retrieved.')
}

export const getInsights = async (req: Request, res: Response): Promise<void> => {
  const meetingId = String(req.params.meetingId)

  const insights = await AiService.getInsights(meetingId)
  ApiResponse.success(res, insights, 'Meeting insights aggregated successfully.')
}
