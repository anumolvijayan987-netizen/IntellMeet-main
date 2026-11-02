import { Router } from 'express'
import {
  getParticipants,
  logParticipantJoin,
  logParticipantLeave,
} from '../controllers/participant.controller'
import { asyncHandler } from '../utils/asyncHandler'

const router = Router()

router.get('/', asyncHandler(getParticipants))
router.post('/', asyncHandler(logParticipantJoin))
router.patch('/:id/leave', asyncHandler(logParticipantLeave))

export default router
