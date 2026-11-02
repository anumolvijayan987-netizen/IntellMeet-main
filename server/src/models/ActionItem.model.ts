import { Schema, model, Document } from 'mongoose'

export interface IActionItemDocument extends Document {
  meetingId: Schema.Types.ObjectId
  meetingTitle?: string
  summaryId?: Schema.Types.ObjectId
  text: string
  assigneeName: string
  assigneeId?: Schema.Types.ObjectId
  dueDate?: Date
  priority: 'low' | 'medium' | 'high'
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  aiGenerated?: boolean
  relatedDiscussion?: string
  completedAt?: Date
  completedBy?: Schema.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const ActionItemSchema = new Schema<IActionItemDocument>(
  {
    meetingId: {
      type: Schema.Types.ObjectId,
      ref: 'Meeting',
      required: [true, 'Meeting ID is required'],
      index: true,
    },
    meetingTitle: {
      type: String,
      default: '',
      trim: true,
    },
    summaryId: {
      type: Schema.Types.ObjectId,
      ref: 'MeetingSummary',
      index: true,
    },
    text: {
      type: String,
      required: [true, 'Action item text is required'],
      trim: true,
    },
    assigneeName: {
      type: String,
      default: 'Unassigned',
      trim: true,
    },
    assigneeId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    dueDate: {
      type: Date,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'cancelled'],
      default: 'pending',
      index: true,
    },
    aiGenerated: {
      type: Boolean,
      default: false,
    },
    relatedDiscussion: {
      type: String,
      default: '',
    },
    completedAt: {
      type: Date,
    },
    completedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
)

ActionItemSchema.index({ meetingId: 1, status: 1 })
ActionItemSchema.index({ assigneeId: 1, status: 1 })

export const ActionItem = model<IActionItemDocument>('ActionItem', ActionItemSchema)
