import { Schema, model, Document } from 'mongoose'

export interface IMeetingParticipantDocument extends Document {
  meetingId: Schema.Types.ObjectId
  userId?: Schema.Types.ObjectId
  guestName: string
  socketId: string
  peerId?: string
  role: 'host' | 'co_host' | 'participant' | 'viewer'
  joinedAt: Date
  leftAt?: Date
  durationSeconds?: number
  audioEnabled: boolean
  videoEnabled: boolean
  screenSharing: boolean
  createdAt: Date
  updatedAt: Date
}

const MeetingParticipantSchema = new Schema<IMeetingParticipantDocument>(
  {
    meetingId: {
      type: Schema.Types.ObjectId,
      ref: 'Meeting',
      required: [true, 'Meeting ID is required'],
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    guestName: {
      type: String,
      required: [true, 'Guest name is required'],
      trim: true,
    },
    socketId: {
      type: String,
      required: [true, 'Socket ID is required'],
      index: true,
    },
    peerId: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: ['host', 'co_host', 'participant', 'viewer'],
      default: 'participant',
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    leftAt: {
      type: Date,
    },
    durationSeconds: {
      type: Number,
      default: 0,
    },
    audioEnabled: {
      type: Boolean,
      default: true,
    },
    videoEnabled: {
      type: Boolean,
      default: true,
    },
    screenSharing: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
)

MeetingParticipantSchema.index({ meetingId: 1, socketId: 1 })
MeetingParticipantSchema.index({ meetingId: 1, userId: 1 })

export const MeetingParticipant = model<IMeetingParticipantDocument>(
  'MeetingParticipant',
  MeetingParticipantSchema
)
