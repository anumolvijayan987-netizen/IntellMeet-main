import { apiClient } from './apiClient'

export interface TranscriptChunk {
  _id?: string
  meetingId: string
  speakerName: string
  speaker?: string
  text: string
  startTime: number
  endTime?: number
  time?: string
  language?: string
  confidence?: number
  createdAt?: string | Date
}

export const transcriptService = {
  async getTranscripts(params?: { meetingId?: string; search?: string }): Promise<TranscriptChunk[]> {
    const query = new URLSearchParams()
    if (params?.meetingId) query.set('meetingId', params.meetingId)
    if (params?.search) query.set('search', params.search)

    return apiClient.get<TranscriptChunk[]>(`/transcripts?${query.toString()}`)
  },

  async saveChunk(chunk: Partial<TranscriptChunk>): Promise<TranscriptChunk> {
    return apiClient.post<TranscriptChunk>('/transcripts', chunk)
  },
}
