import { Schema, model, Document } from 'mongoose'

export interface IMessageDocument extends Document {
  meetingId: Schema.Types.ObjectId
  workspaceId?: Schema.Types.ObjectId
  senderId?: Schema.Types.ObjectId
  senderName: string
  content: string
  type: 'text' | 'file' | 'system' | 'code'
  attachments: Array<{
    fileName: string
    fileUrl: string
    fileSizeBytes: number
    mimeType: string
  }>
  reactions: Array<{
    emoji: string
    userId: Schema.Types.ObjectId
  }>
  isSystem: boolean
  createdAt: Date
  updatedAt: Date
}

const MessageSchema = new Schema<IMessageDocument>(
  {
    meetingId: {
      type: Schema.Types.ObjectId,
      ref: 'Meeting',
      required: [true, 'Meeting ID is required'],
      index: true,
    },
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: 'Workspace',
      index: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    senderName: {
      type: String,
      required: [true, 'Sender name is required'],
      trim: true,
    },
    content: {
      type: String,
      required: [true, 'Message content is required'],
      trim: true,
      maxlength: [4000, 'Message cannot exceed 4000 characters'],
    },
    type: {
      type: String,
      enum: ['text', 'file', 'system', 'code'],
      default: 'text',
    },
    attachments: [
      {
        fileName: String,
        fileUrl: String,
        fileSizeBytes: Number,
        mimeType: String,
      },
    ],
    reactions: [
      {
        emoji: String,
        userId: { type: Schema.Types.ObjectId, ref: 'User' },
      },
    ],
    isSystem: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
)

MessageSchema.index({ meetingId: 1, createdAt: 1 })

export const Message = model<IMessageDocument>('Message', MessageSchema)
