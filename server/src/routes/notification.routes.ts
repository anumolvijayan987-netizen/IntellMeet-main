import { Router } from 'express'
import {
  getNotifications,
  createNotification,
  markNotificationRead,
  markAllNotificationsRead,
} from '../controllers/notification.controller'
import { asyncHandler } from '../utils/asyncHandler'

const router = Router()

router.get('/', asyncHandler(getNotifications))
router.post('/', asyncHandler(createNotification))
router.patch('/read-all', asyncHandler(markAllNotificationsRead))
router.patch('/:id/read', asyncHandler(markNotificationRead))

export default router
