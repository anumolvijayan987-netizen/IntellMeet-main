import { Router } from 'express'
import multer from 'multer'
import {
  getRecordings,
  getRecordingById,
  createRecording,
  uploadRecordingFile,
} from '../controllers/recording.controller'
import { asyncHandler } from '../utils/asyncHandler'
import { AppError } from '../utils/appError'
import { authenticateOptional } from '../middleware/auth.middleware'

const recordingFileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  const allowedMimeTypes = [
    'video/webm',
    'video/mp4',
    'video/x-matroska',
    'video/quicktime',
    'application/octet-stream',
  ]

  if (
    allowedMimeTypes.includes(file.mimetype) ||
    file.originalname.endsWith('.webm') ||
    file.originalname.endsWith('.mp4')
  ) {
    cb(null, true)
  } else {
    cb(
      AppError.badRequest(
        `Unsupported recording format: ${file.mimetype}. Allowed formats: WEBM, MP4.`
      )
    )
  }
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit for recordings
  fileFilter: recordingFileFilter,
})

const router = Router()

router.get('/', asyncHandler(getRecordings))
router.get('/:id', authenticateOptional, asyncHandler(getRecordingById))
router.post('/', asyncHandler(createRecording))
router.post('/upload', upload.single('recording'), asyncHandler(uploadRecordingFile))

export default router
