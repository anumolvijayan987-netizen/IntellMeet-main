import { Router } from 'express'
import {
  getMeetings,
  getMeetingByRoom,
  saveMeeting,
  createMeeting,
  scheduleMeeting,
  updateMeeting,
  cancelMeeting,
  getUpcomingMeetings,
  getMeetingHistory,
  validateMeetingAccess,
  getSfuToken,
  endMeeting,
} from '../controllers/meeting.controller'
import { asyncHandler } from '../utils/asyncHandler'
import { authenticateOptional } from '../middleware/auth.middleware'

const router = Router()

router.get('/', asyncHandler(getMeetings))
router.get('/upcoming', asyncHandler(getUpcomingMeetings))
router.get('/history', asyncHandler(getMeetingHistory))
router.post('/schedule', authenticateOptional, asyncHandler(scheduleMeeting))
router.post('/', asyncHandler(saveMeeting))
router.post('/create', authenticateOptional, asyncHandler(createMeeting))
router.patch('/:id', asyncHandler(updateMeeting))
router.post('/:id/cancel', asyncHandler(cancelMeeting))
router.get('/validate/:roomId', authenticateOptional, asyncHandler(validateMeetingAccess))
router.get('/:roomId/token', authenticateOptional, asyncHandler(getSfuToken))
router.post('/:roomId/end', authenticateOptional, asyncHandler(endMeeting))
router.get('/:roomId', asyncHandler(getMeetingByRoom))

export default router
