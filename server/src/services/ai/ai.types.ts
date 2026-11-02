export interface DialogueSegment {
  speaker: string
  speakerName?: string
  text: string
  startTime?: number
  endTime?: number
  timestamp?: string
  language?: string
}

export interface StructuredSummary {
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
  tokensUsed?: number
  processingDurationMs?: number
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

export interface MeetingInsights {
  meetingId: string
  durationFormatted: string
  topicsDiscussed: string[]
  actionItemsCount: number
  completedTasksCount: number
  pendingTasksCount: number
  summary: StructuredSummary
  actionItems: ExtractedActionItem[]
}

export interface JobStatus {
  jobId: string
  type: 'transcription' | 'summarization' | 'action_items'
  status: 'queued' | 'processing' | 'completed' | 'failed'
  progress: number
  result?: any
  error?: string
  createdAt: string
  completedAt?: string
}
