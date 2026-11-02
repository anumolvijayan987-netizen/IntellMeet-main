import { Router } from 'express'
import multer from 'multer'
import {
  summarizeMeeting,
  extractTasks,
  askAssistant,
  transcribeAudio,
  getJobStatus,
  getInsights,
} from '../controllers/ai.controller'
import { asyncHandler } from '../utils/asyncHandler'
import { AppError } from '../utils/appError'

const audioFileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  const allowed = [
    'audio/webm',
    'audio/wav',
    'audio/wave',
    'audio/x-wav',
    'audio/mpeg',
    'audio/mp3',
    'audio/ogg',
    'audio/m4a',
    'application/octet-stream',
  ]

  if (
    allowed.includes(file.mimetype) ||
    file.originalname.endsWith('.wav') ||
    file.originalname.endsWith('.webm') ||
    file.originalname.endsWith('.mp3')
  ) {
    cb(null, true)
  } else {
    cb(
      AppError.badRequest(
        `Unsupported audio format: ${file.mimetype}. Allowed formats: WAV, WEBM, MP3.`
      )
    )
  }
}

const audioUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB audio files
  fileFilter: audioFileFilter,
})

const router = Router()

router.post('/summarize', asyncHandler(summarizeMeeting))
router.post('/extract-tasks', asyncHandler(extractTasks))
router.post('/chat', asyncHandler(askAssistant))
router.post('/assistant', asyncHandler(askAssistant))
router.post('/query', asyncHandler(askAssistant))
router.post('/transcribe', audioUpload.single('audio'), asyncHandler(transcribeAudio))
router.get('/jobs/:jobId', asyncHandler(getJobStatus))
router.get('/insights/:meetingId', asyncHandler(getInsights))

export default router
