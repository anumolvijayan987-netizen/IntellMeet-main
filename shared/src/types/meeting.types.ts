import { MeetingRole, MeetingStatus } from '../constants/roles'

export interface IMeeting {
  _id: string
  title: string
  roomId: string
  passCode?: string
  hostId: string
  hostName: string
  organizationId?: string
  workspaceId?: string
  scheduledStartTime?: string
  actualStartTime?: string
  endTime?: string
  status: MeetingStatus
  type: 'instant' | 'scheduled' | 'recurring'
  participantsCount: number
  summary?: string
  keyDecisions?: string[]
  actionItems?: IActionItem[]
  createdAt: string
  updatedAt: string
}

export interface IMeetingParticipant {
  _id: string
  meetingId: string
  userId?: string
  guestName: string
  socketId: string
  peerId?: string
  role: MeetingRole
  joinedAt: string
  leftAt?: string
  audioEnabled: boolean
  videoEnabled: boolean
  screenSharing: boolean
}

export interface IChatMessage {
  _id?: string
  id?: string
  meetingId: string
  senderId: string
  senderName: string
  text: string
  isSystem?: boolean
  timestamp: string
}

export interface ITranscriptChunk {
  _id?: string
  meetingId: string
  speakerId: string
  speakerName: string
  text: string
  startTime: number
  endTime?: number
  confidence?: number
  language?: string
  isFinal?: boolean
  timestamp: string
}

export interface IActionItem {
  id?: string | number
  _id?: string
  meetingId?: string
  summaryId?: string
  text: string
  assignee: string
  assigneeId?: string
  dueDate?: string
  priority?: 'low' | 'medium' | 'high'
  completed: boolean
  completedAt?: string
  createdAt?: string
}

export interface IMeetingSummary {
  _id?: string
  meetingId: string
  executiveSummary: string
  keyDecisions: string[]
  actionItems: IActionItem[]
  topicsDiscussed?: string[]
  sentiment?: 'positive' | 'neutral' | 'constructive' | 'mixed'
  generatedBy?: 'openai' | 'rule_based_nlp' | 'manual'
  tokensUsed?: number
  generatedAt: string
}

export interface IRecording {
  _id: string
  meetingId: string
  storageUrl: string
  durationSeconds: number
  fileSizeBytes: number
  format: 'mp4' | 'webm'
  status: 'processing' | 'ready' | 'failed'
  transcriptionStatus: 'pending' | 'completed' | 'failed'
  createdAt: string
}
