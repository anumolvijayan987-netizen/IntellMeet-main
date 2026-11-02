import { Schema, model, Document } from 'mongoose'

export interface IRecordingDocument extends Document {
  meetingId: Schema.Types.ObjectId
  storageUrl: string
  durationSeconds: number
  fileSizeBytes: number
  format: 'mp4' | 'webm'
  status: 'processing' | 'ready' | 'failed'
  transcriptionStatus: 'pending' | 'processing' | 'completed' | 'failed'
  accessControl: {
    isPublic: boolean
    allowedUserIds: Schema.Types.ObjectId[]
  }
  createdAt: Date
  updatedAt: Date
}

const RecordingSchema = new Schema<IRecordingDocument>(
  {
    meetingId: {
      type: Schema.Types.ObjectId,
      ref: 'Meeting',
      required: [true, 'Meeting ID is required'],
      index: true,
    },
    storageUrl: {
      type: String,
      required: [true, 'Storage URL is required'],
      trim: true,
    },
    durationSeconds: {
      type: Number,
      default: 0,
    },
    fileSizeBytes: {
      type: Number,
      default: 0,
    },
    format: {
      type: String,
      enum: ['mp4', 'webm'],
      default: 'webm',
    },
    status: {
      type: String,
      enum: ['processing', 'ready', 'failed'],
      default: 'processing',
      index: true,
    },
    transcriptionStatus: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },
    accessControl: {
      isPublic: { type: Boolean, default: false },
      allowedUserIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    },
  },
  {
    timestamps: true,
  }
)

RecordingSchema.index({ meetingId: 1, createdAt: -1 })
RecordingSchema.index({ status: 1, createdAt: -1 })

export const Recording = model<IRecordingDocument>('Recording', RecordingSchema)
