export interface MeetingRecord {
  id?: string
  _id?: string
  roomId: string
  title?: string
  hostName: string
  participantsCount?: number
  participantsList?: string[]
  participants?: string[]
  summary?: string
  keyDecisions?: string[]
  actionItems?: ActionItem[]
  createdAt: string
  status?: string
}

export interface ActionItem {
  id: string | number
  text: string
  assignee: string
  completed: boolean
  priority?: 'low' | 'medium' | 'high'
}

export interface ChatMessage {
  id: string
  meetingId?: string
  sender: string
  text: string
  isSystem?: boolean
  timestamp: string
}

export interface TranscriptEntry {
  speaker: string
  text: string
  timestamp: string
}

export interface AiSummaryPayload {
  summary: string
  executiveSummary: string
  keyDecisions: string[]
  actionItems: ActionItem[]
  topicsDiscussed: string[]
  sentiment: string
  generatedBy: string
  generatedAt: string
}

export interface SystemHealth {
  status: string
  service: string
  uptimeSeconds: number
  database: {
    status: string
    uriMasked: string
  }
  socket: {
    activeConnections: number
    activeRooms: number
  }
  system: {
    nodeVersion: string
    memoryUsageMB: {
      rss: number
      heapTotal: number
      heapUsed: number
    }
  }
}
