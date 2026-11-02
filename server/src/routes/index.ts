import { Router } from 'express'
import authRoutes from './auth.routes'
import userRoutes from './user.routes'
import organizationRoutes from './organization.routes'
import workspaceRoutes from './workspace.routes'
import meetingRoutes from './meeting.routes'
import participantRoutes from './participant.routes'
import messageRoutes from './message.routes'
import transcriptRoutes from './transcript.routes'
import summaryRoutes from './summary.routes'
import actionItemRoutes from './actionItem.routes'
import recordingRoutes from './recording.routes'
import notificationRoutes from './notification.routes'
import aiRoutes from './ai.routes'
import healthRoutes from './health.routes'
import calendarRoutes from './calendar.routes'
import v1Routes from './v1.routes'

const rootRouter = Router()

// Direct API routes
rootRouter.use('/auth', authRoutes)
rootRouter.use('/users', userRoutes)
rootRouter.use('/organizations', organizationRoutes)
rootRouter.use('/workspaces', workspaceRoutes)
rootRouter.use('/meetings', meetingRoutes)
rootRouter.use('/participants', participantRoutes)
rootRouter.use('/messages', messageRoutes)
rootRouter.use('/transcripts', transcriptRoutes)
rootRouter.use('/summaries', summaryRoutes)
rootRouter.use('/action-items', actionItemRoutes)
rootRouter.use('/recordings', recordingRoutes)
rootRouter.use('/notifications', notificationRoutes)
rootRouter.use('/ai', aiRoutes)
rootRouter.use('/health', healthRoutes)
rootRouter.use('/calendar', calendarRoutes)

// Legacy / versioned namespace support
rootRouter.use('/v1', v1Routes)

export default rootRouter
