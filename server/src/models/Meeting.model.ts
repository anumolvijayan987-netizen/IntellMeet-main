import { Schema, model, Document } from 'mongoose'

export interface IMeetingDocument extends Document {
  title: string
  description?: string
  roomId: string
  passCode?: string
  hostId?: Schema.Types.ObjectId
  hostName: string
  organizationId?: Schema.Types.ObjectId
  workspaceId?: Schema.Types.ObjectId
  scheduledStartTime?: Date
  actualStartTime?: Date
  endTime?: Date
  durationMinutes?: number
  timezone?: string
  recurrence?: 'none' | 'daily' | 'weekly' | 'monthly'
  participantInvitations?: string[]
  status: 'scheduled' | 'live' | 'completed' | 'cancelled'
  type: 'instant' | 'scheduled' | 'recurring'
  participantsCount: number
  participantsList: string[]
  recordingUrl?: string
  transcriptSnippet?: string
  settings: {
    isMutedOnEntry: boolean
    isCamOffOnEntry: boolean
    allowScreenSharing: boolean
    enableTranscription: boolean
    enableAiSummaries: boolean
  }
  summary?: string
  keyDecisions: string[]
  actionItems: Array<{
    id: string | number
    text: string
    assignee: string
    completed: boolean
  }>
  createdAt: Date
  updatedAt: Date
}

const MeetingSchema = new Schema<IMeetingDocument>(
  {
    title: {
      type: String,
      default: 'IntellMeet Collaborative Session',
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    roomId: {
      type: String,
      required: [true, 'Room ID is required'],
      unique: true,
      trim: true,
      index: true,
    },
    passCode: {
      type: String,
      trim: true,
    },
    hostId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    hostName: {
      type: String,
      default: 'Anonymous Host',
      trim: true,
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      index: true,
    },
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: 'Workspace',
      index: true,
    },
    scheduledStartTime: {
      type: Date,
      index: true,
    },
    actualStartTime: {
      type: Date,
      default: Date.now,
    },
    endTime: {
      type: Date,
    },
    durationMinutes: {
      type: Number,
      default: 45,
    },
    timezone: {
      type: String,
      default: 'UTC',
    },
    recurrence: {
      type: String,
      enum: ['none', 'daily', 'weekly', 'monthly'],
      default: 'none',
    },
    participantInvitations: {
      type: [String],
      default: [],
    },
    recordingUrl: {
      type: String,
      default: '',
    },
    transcriptSnippet: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['scheduled', 'live', 'completed', 'cancelled'],
      default: 'live',
      index: true,
    },
    type: {
      type: String,
      enum: ['instant', 'scheduled', 'recurring'],
      default: 'instant',
    },
    participantsCount: {
      type: Number,
      default: 1,
    },
    participantsList: {
      type: [String],
      default: [],
    },
    settings: {
      isMutedOnEntry: { type: Boolean, default: false },
      isCamOffOnEntry: { type: Boolean, default: false },
      allowScreenSharing: { type: Boolean, default: true },
      enableTranscription: { type: Boolean, default: true },
      enableAiSummaries: { type: Boolean, default: true },
    },
    summary: {
      type: String,
      default: '',
    },
    keyDecisions: {
      type: [String],
      default: [],
    },
    actionItems: [
      {
        id: Schema.Types.Mixed,
        text: String,
        assignee: String,
        completed: { type: Boolean, default: false },
      },
    ],
  },
  {
    timestamps: true,
  }
)

MeetingSchema.index({ workspaceId: 1, status: 1, createdAt: -1 })
MeetingSchema.index({ hostId: 1, createdAt: -1 })
MeetingSchema.index({ status: 1, scheduledStartTime: 1 })
MeetingSchema.index({ roomId: 1, status: 1 })
MeetingSchema.index({ organizationId: 1, createdAt: -1 })

export const Meeting = model<IMeetingDocument>('Meeting', MeetingSchema)
