import { Schema, model, Document } from 'mongoose'

export interface IMeetingSummaryDocument extends Document {
  meetingId: Schema.Types.ObjectId
  executiveSummary: string
  keyDecisions: string[]
  topicsDiscussed: string[]
  nextSteps: string[]
  sentiment: 'positive' | 'neutral' | 'constructive' | 'mixed'
  generatedBy: 'openai' | 'rule_based_nlp' | 'manual'
  tokensUsed?: number
  processingDurationMs?: number
  createdAt: Date
  updatedAt: Date
}

const MeetingSummarySchema = new Schema<IMeetingSummaryDocument>(
  {
    meetingId: {
      type: Schema.Types.ObjectId,
      ref: 'Meeting',
      required: [true, 'Meeting ID is required'],
      unique: true,
      index: true,
    },
    executiveSummary: {
      type: String,
      required: [true, 'Executive summary is required'],
      trim: true,
    },
    keyDecisions: {
      type: [String],
      default: [],
    },
    topicsDiscussed: {
      type: [String],
      default: [],
    },
    nextSteps: {
      type: [String],
      default: [],
    },
    sentiment: {
      type: String,
      enum: ['positive', 'neutral', 'constructive', 'mixed'],
      default: 'neutral',
    },
    generatedBy: {
      type: String,
      enum: ['openai', 'rule_based_nlp', 'manual'],
      default: 'rule_based_nlp',
    },
    tokensUsed: {
      type: Number,
      default: 0,
    },
    processingDurationMs: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
)

export const MeetingSummary = model<IMeetingSummaryDocument>(
  'MeetingSummary',
  MeetingSummarySchema
)
