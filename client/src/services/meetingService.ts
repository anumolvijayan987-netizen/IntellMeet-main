import { apiRequest } from './apiClient'
import { MeetingRecord, SystemHealth } from '../types'

export interface CreateMeetingPayload {
  title?: string
  isPrivate?: boolean
  passcode?: string
  workspaceId?: string
}

export interface ScheduleMeetingPayload {
  title: string
  description?: string
  date: string
  time: string
  timezone: string
  durationMinutes?: number
  recurrence?: 'none' | 'daily' | 'weekly' | 'monthly'
  attendees?: string
  settings?: {
    isMutedOnEntry?: boolean
    isCamOffOnEntry?: boolean
    allowScreenSharing?: boolean
    enableTranscription?: boolean
    enableAiSummaries?: boolean
  }
}

export interface MeetingAccessResponse {
  meeting: any
  isHost: boolean
  iceServers: RTCIceServer[]
}

export interface MeetingHistoryResponse {
  meetings: any[]
  total: number
  page: number
  totalPages: number
}

export const meetingService = {
  async getMeetings(): Promise<MeetingRecord[]> {
    return apiRequest<MeetingRecord[]>('/meetings')
  },

  async getUpcomingMeetings(workspaceId?: string): Promise<any[]> {
    const query = workspaceId ? `?workspaceId=${workspaceId}` : ''
    return apiRequest<any[]>(`/meetings/upcoming${query}`)
  },

  async getMeetingHistory(params?: {
    search?: string
    status?: string
    startDate?: string
    endDate?: string
    sort?: string
    page?: number
    limit?: number
  }): Promise<MeetingHistoryResponse> {
    const query = new URLSearchParams()
    if (params?.search) query.set('search', params.search)
    if (params?.status) query.set('status', params.status)
    if (params?.startDate) query.set('startDate', params.startDate)
    if (params?.endDate) query.set('endDate', params.endDate)
    if (params?.sort) query.set('sort', params.sort)
    if (params?.page) query.set('page', String(params.page))
    if (params?.limit) query.set('limit', String(params.limit))

    return apiRequest<MeetingHistoryResponse>(`/meetings/history?${query.toString()}`)
  },

  async getMeetingByRoomId(roomId: string): Promise<MeetingRecord> {
    return apiRequest<MeetingRecord>(`/meetings/${roomId}`)
  },

  async createMeeting(payload: CreateMeetingPayload): Promise<any> {
    return apiRequest<any>('/meetings/create', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  async scheduleMeeting(payload: ScheduleMeetingPayload): Promise<any> {
    return apiRequest<any>('/meetings/schedule', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  async updateMeeting(id: string, updates: Partial<ScheduleMeetingPayload & { status?: string }>): Promise<any> {
    return apiRequest<any>(`/meetings/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    })
  },

  async cancelMeeting(id: string): Promise<any> {
    return apiRequest<any>(`/meetings/${id}/cancel`, {
      method: 'POST',
    })
  },

  async validateMeeting(roomId: string): Promise<MeetingAccessResponse> {
    return apiRequest<MeetingAccessResponse>(`/meetings/validate/${roomId}`)
  },

  async getSfuToken(roomId: string): Promise<any> {
    return apiRequest<any>(`/meetings/${roomId}/token`)
  },

  async endMeeting(roomId: string): Promise<any> {
    return apiRequest<any>(`/meetings/${roomId}/end`, {
      method: 'POST',
    })
  },

  async getMeetingMessages(roomId: string): Promise<any[]> {
    return apiRequest<any[]>(`/messages?meetingId=${roomId}`)
  },

  async saveMeeting(payload: Partial<MeetingRecord>): Promise<MeetingRecord> {
    return apiRequest<MeetingRecord>('/meetings', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  async uploadRecording(formData: FormData): Promise<any> {
    return apiRequest<any>('/recordings/upload', {
      method: 'POST',
      body: formData,
    })
  },

  async getHealth(): Promise<SystemHealth> {
    return apiRequest<SystemHealth>('/health')
  },
}
