import { apiClient } from './apiClient'

export interface NotificationDto {
  _id: string
  id?: string
  recipientId?: string
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
  read: boolean
  readAt?: string | Date
  metadata?: Record<string, unknown>
  createdAt: string | Date
}

export const notificationService = {
  async getNotifications(): Promise<NotificationDto[]> {
    return apiClient.get<NotificationDto[]>('/notifications')
  },

  async markAsRead(id: string): Promise<NotificationDto> {
    return apiClient.patch<NotificationDto>(`/notifications/${id}/read`, {})
  },

  async markAllAsRead(): Promise<void> {
    return apiClient.patch('/notifications/read-all', {})
  },
}
