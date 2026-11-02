import { apiRequest } from './apiClient'
import { ChatMessage, TranscriptEntry } from '../types'

export interface SummarizeParams {
  roomName: string
  transcript: Array<{ speaker: string; text: string; timestamp?: string }> | TranscriptEntry[]
  messages: Array<{ sender?: string; speaker?: string; text: string; timestamp?: string }> | ChatMessage[]
  asyncMode?: boolean
}

export interface StructuredAiSummary {
  meetingOverview: string
  discussionPoints: string[]
  importantDecisions: string[]
  keyHighlights: string[]
  problemsDiscussed: string[]
  proposedSolutions: string[]
  followUpRequirements: string[]
  topicsDiscussed: string[]
  sentiment: 'positive' | 'neutral' | 'constructive' | 'mixed'
  generatedBy: 'openai' | 'contextual_nlp'
  createdAt: string
}

export interface ExtractedActionItem {
  id?: string | number
  title: string
  description?: string
  assignee: string
  dueDate?: string | null
  priority: 'low' | 'medium' | 'high'
  relatedDiscussion?: string
  status: 'pending' | 'in_progress' | 'completed'
}

export interface AssistantAnswer {
  question: string
  answer: string
  citations: string[]
  confidence: number
  generatedBy: string
}

export interface MeetingInsightsData {
  meetingId: string
  durationFormatted: string
  topicsDiscussed: string[]
  actionItemsCount: number
  completedTasksCount: number
  pendingTasksCount: number
  summary: StructuredAiSummary
  actionItems: ExtractedActionItem[]
}

export const aiService = {
  async summarize(params: SummarizeParams): Promise<{
    summary: StructuredAiSummary
    actionItems: ExtractedActionItem[]
  }> {
    return apiRequest<{
      summary: StructuredAiSummary
      actionItems: ExtractedActionItem[]
    }>('/ai/summarize', {
      method: 'POST',
      body: JSON.stringify(params),
    })
  },

  async extractTasks(meetingId: string, transcript: any[]): Promise<ExtractedActionItem[]> {
    return apiRequest<ExtractedActionItem[]>('/ai/extract-tasks', {
      method: 'POST',
      body: JSON.stringify({ meetingId, transcript }),
    })
  },

  async askAssistant(meetingId: string, question: string): Promise<AssistantAnswer> {
    return apiRequest<AssistantAnswer>('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ meetingId, question }),
    })
  },

  async getInsights(meetingId: string): Promise<MeetingInsightsData> {
    return apiRequest<MeetingInsightsData>(`/ai/insights/${meetingId}`)
  },

  async transcribeAudio(formData: FormData): Promise<any> {
    return apiRequest<any>('/ai/transcribe', {
      method: 'POST',
      body: formData,
    })
  },

  async getJobStatus(jobId: string): Promise<any> {
    return apiRequest<any>(`/ai/jobs/${jobId}`)
  },
}
