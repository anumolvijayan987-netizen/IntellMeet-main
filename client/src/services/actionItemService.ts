import { apiClient } from './apiClient'

export interface ActionItemDto {
  _id: string
  id?: string
  text?: string
  title?: string
  meetingId?: string
  meetingTitle?: string
  assigneeName?: string
  assignee?: string
  dueDate?: string | Date
  priority: 'low' | 'medium' | 'high'
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  relatedDiscussion?: string
  createdAt?: string | Date
  updatedAt?: string | Date
}

export const actionItemService = {
  async getActionItems(params?: { meetingId?: string; status?: string }): Promise<ActionItemDto[]> {
    const query = new URLSearchParams()
    if (params?.meetingId) query.set('meetingId', params.meetingId)
    if (params?.status) query.set('status', params.status)

    return apiClient.get<ActionItemDto[]>(`/action-items?${query.toString()}`)
  },

  async createActionItem(item: Partial<ActionItemDto>): Promise<ActionItemDto> {
    return apiClient.post<ActionItemDto>('/action-items', item)
  },

  async updateActionItem(id: string, updates: Partial<ActionItemDto>): Promise<ActionItemDto> {
    return apiClient.patch<ActionItemDto>(`/action-items/${id}`, updates)
  },
}
