import { Router } from 'express'
import { getTranscripts, saveTranscriptChunk } from '../controllers/transcript.controller'
import { asyncHandler } from '../utils/asyncHandler'

const router = Router()

router.get('/', asyncHandler(getTranscripts))
router.post('/', asyncHandler(saveTranscriptChunk))

export default router
