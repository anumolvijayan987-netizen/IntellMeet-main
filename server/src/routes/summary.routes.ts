import { Router } from 'express'
import { getMeetingSummary, saveMeetingSummary } from '../controllers/summary.controller'
import { asyncHandler } from '../utils/asyncHandler'

const router = Router()

router.get('/:meetingId', asyncHandler(getMeetingSummary))
router.post('/', asyncHandler(saveMeetingSummary))

export default router
