import { Notification, INotificationDocument } from '../models/Notification.model'
import { db } from '../config/db'
import { logger } from '../utils/logger'
import { getSocketServer } from '../sockets/socketHandler'

export interface CreateNotificationInput {
  recipientId?: string
  senderId?: string
  type:
    | 'meeting_invite'
    | 'meeting_reminder'
    | 'meeting_update'
    | 'action_item_assigned'
    | 'deadline_approaching'
    | 'meeting_summary_ready'
    | 'recording_ready'
    | 'system_alert'
  title: string
  message: string
  link?: string
  metadata?: Record<string, unknown>
}

export const inMemoryNotifications: any[] = [
  {
    _id: 'notif_default_1',
    id: 'notif_default_1',
    recipientId: 'usr_sarah',
    type: 'meeting_summary_ready',
    title: 'AI Summary Available',
    message: 'Structured executive minutes and action items are ready for Sprint Q4 Review.',
    link: '/app/insights?meetingId=room_default_demo',
    read: false,
    createdAt: new Date(Date.now() - 3600000),
  },
  {
    _id: 'notif_default_2',
    id: 'notif_default_2',
    recipientId: 'usr_sarah',
    type: 'action_item_assigned',
    title: 'Action Item Assigned',
    message: 'David Miller assigned you: Finalize WebRTC peer connection signaling pipeline.',
    link: '/app/tasks',
    read: true,
    createdAt: new Date(Date.now() - 7200000),
  },
  {
    _id: 'notif_default_3',
    id: 'notif_default_3',
    recipientId: 'usr_sarah',
    type: 'meeting_reminder',
    title: 'Meeting in 10 Minutes',
    message: 'Upcoming: Sprint Planning Session with Core Engineering begins shortly.',
    link: '/room/sprint-plan-q4',
    read: false,
    createdAt: new Date(Date.now() - 600000),
  },
]

export class NotificationService {
  /**
   * Creates a notification, saves to database (or in-memory store), and broadcasts via Socket.io
   */
  public static async createNotification(input: CreateNotificationInput): Promise<any> {
    const formatted = {
      ...input,
      read: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    let savedNotif: any = null

    if (db.isConnected()) {
      try {
        savedNotif = await Notification.create(formatted)
      } catch (err) {
        logger.warn('Failed to save notification to MongoDB, using memory fallback:', err)
      }
    }

    if (!savedNotif) {
      savedNotif = {
        _id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        id: `notif_${Date.now()}`,
        ...formatted,
      }
      inMemoryNotifications.unshift(savedNotif)
    }

    // Broadcast in real-time via Socket.io
    const io = getSocketServer()
    if (io) {
      io.emit('notification', savedNotif)
      logger.info(`🔔 [Notification Broadcast] ${input.type}: "${input.title}"`)
    }

    return savedNotif
  }

  public static async getNotificationsForUser(recipientId?: string): Promise<any[]> {
    if (db.isConnected() && recipientId) {
      try {
        const list = await Notification.find({ recipientId }).sort({ createdAt: -1 }).limit(30).lean()
        if (list && list.length > 0) return list
      } catch (err) {
        logger.warn('Failed querying notifications from MongoDB:', err)
      }
    }

    return inMemoryNotifications
  }

  public static async markRead(id: string): Promise<any> {
    if (db.isConnected()) {
      try {
        const updated = await Notification.findByIdAndUpdate(
          id,
          { $set: { read: true, readAt: new Date() } },
          { new: true }
        )
        if (updated) return updated
      } catch {}
    }

    const item = inMemoryNotifications.find((n) => n._id === id || n.id === id)
    if (item) {
      item.read = true
      item.readAt = new Date()
      return item
    }

    return { id, read: true }
  }

  public static async markAllRead(recipientId?: string): Promise<void> {
    if (db.isConnected() && recipientId) {
      try {
        await Notification.updateMany({ recipientId, read: false }, { $set: { read: true, readAt: new Date() } })
      } catch {}
    }

    for (const n of inMemoryNotifications) {
      n.read = true
      n.readAt = new Date()
    }
  }
}
