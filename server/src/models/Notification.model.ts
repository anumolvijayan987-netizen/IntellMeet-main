import { Schema, model, Document } from 'mongoose'

export interface INotificationDocument extends Document {
  recipientId: Schema.Types.ObjectId
  senderId?: Schema.Types.ObjectId
  type:
    | 'meeting_invite'
    | 'meeting_reminder'
    | 'meeting_update'
    | 'action_item_assigned'
    | 'deadline_approaching'
    | 'meeting_summary_ready'
    | 'recording_ready'
    | 'system_alert'
  title: string
  message: string
  link?: string
  read: boolean
  readAt?: Date
  metadata?: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
}

const NotificationSchema = new Schema<INotificationDocument>(
  {
    recipientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recipient ID is required'],
      index: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    type: {
      type: String,
      enum: [
        'meeting_invite',
        'meeting_reminder',
        'meeting_update',
        'action_item_assigned',
        'deadline_approaching',
        'meeting_summary_ready',
        'recording_ready',
        'system_alert',
      ],
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Notification title is required'],
      trim: true,
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    message: {
      type: String,
      required: [true, 'Notification message is required'],
      trim: true,
      maxlength: [500, 'Message cannot exceed 500 characters'],
    },
    link: {
      type: String,
      trim: true,
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
)

NotificationSchema.index({ recipientId: 1, read: 1, createdAt: -1 })

export const Notification = model<INotificationDocument>('Notification', NotificationSchema)
