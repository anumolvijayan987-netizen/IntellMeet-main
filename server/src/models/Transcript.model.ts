import { Schema, model, Document } from 'mongoose'

export interface ITranscriptDocument extends Document {
  meetingId: Schema.Types.ObjectId
  speakerId?: Schema.Types.ObjectId
  speakerName: string
  text: string
  startTime: number
  endTime?: number
  confidence?: number
  language: string
  isFinal: boolean
  createdAt: Date
  updatedAt: Date
}

const TranscriptSchema = new Schema<ITranscriptDocument>(
  {
    meetingId: {
      type: Schema.Types.ObjectId,
      ref: 'Meeting',
      required: [true, 'Meeting ID is required'],
      index: true,
    },
    speakerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    speakerName: {
      type: String,
      required: [true, 'Speaker name is required'],
      trim: true,
    },
    text: {
      type: String,
      required: [true, 'Transcript text is required'],
      trim: true,
    },
    startTime: {
      type: Number,
      required: true,
      default: 0,
    },
    endTime: {
      type: Number,
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.95,
    },
    language: {
      type: String,
      default: 'en-US',
    },
    isFinal: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
)

TranscriptSchema.index({ meetingId: 1, startTime: 1 })

export const Transcript = model<ITranscriptDocument>('Transcript', TranscriptSchema)
