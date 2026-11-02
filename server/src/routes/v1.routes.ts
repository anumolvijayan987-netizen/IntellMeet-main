import { Router } from 'express'
import healthRoutes from './health.routes'
import meetingRoutes from './meeting.routes'
import aiRoutes from './ai.routes'

const router = Router()

router.use('/health', healthRoutes)
router.use('/meetings', meetingRoutes)
router.use('/ai', aiRoutes)

export default router
