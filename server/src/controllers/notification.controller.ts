import { Request, Response } from 'express'
import { NotificationService } from '../services/notification.service'
import { ApiResponse } from '../utils/apiResponse'

export const getNotifications = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.userId || 'usr_sarah'
  const list = await NotificationService.getNotificationsForUser(userId)
  ApiResponse.success(res, list, 'Notifications retrieved.')
}

export const createNotification = async (req: Request, res: Response): Promise<void> => {
  const data = req.body
  const notif = await NotificationService.createNotification(data)
  ApiResponse.created(res, notif, 'Notification created and dispatched.')
}

export const markNotificationRead = async (req: Request, res: Response): Promise<void> => {
  const id = String(req.params.id)
  const updated = await NotificationService.markRead(id)
  ApiResponse.success(res, updated, 'Notification marked as read.')
}

export const markAllNotificationsRead = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.userId || 'usr_sarah'
  await NotificationService.markAllRead(userId)
  ApiResponse.success(res, { success: true }, 'All notifications marked as read.')
}
