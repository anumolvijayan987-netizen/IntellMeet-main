import { Router } from 'express'
import { getCalendarEvents } from '../controllers/calendar.controller'
import { asyncHandler } from '../utils/asyncHandler'
import { authenticateOptional } from '../middleware/auth.middleware'

const router = Router()

router.get('/events', authenticateOptional, asyncHandler(getCalendarEvents))

export default router
