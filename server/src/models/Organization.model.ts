import { Schema, model, Document } from 'mongoose'

export interface IOrganizationDocument extends Document {
  name: string
  slug: string
  logoUrl?: string
  ownerId: Schema.Types.ObjectId
  tier: 'starter' | 'pro' | 'enterprise'
  maxMeetingDurationMinutes: number
  maxParticipantsPerMeeting: number
  billing: {
    status: 'active' | 'past_due' | 'canceled' | 'trialing'
    stripeCustomerId?: string
    subscriptionId?: string
  }
  settings: {
    allowGuestUsers: boolean
    enforceRecordingConsent: boolean
    retentionDays: number
  }
  createdAt: Date
  updatedAt: Date
}

const OrganizationSchema = new Schema<IOrganizationDocument>(
  {
    name: {
      type: String,
      required: [true, 'Organization name is required'],
      trim: true,
      maxlength: [100, 'Organization name cannot exceed 100 characters'],
    },
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    logoUrl: {
      type: String,
      default: '',
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Owner ID is required'],
      index: true,
    },
    tier: {
      type: String,
      enum: ['starter', 'pro', 'enterprise'],
      default: 'pro',
    },
    maxMeetingDurationMinutes: {
      type: Number,
      default: 240,
    },
    maxParticipantsPerMeeting: {
      type: Number,
      default: 100,
    },
    billing: {
      status: {
        type: String,
        enum: ['active', 'past_due', 'canceled', 'trialing'],
        default: 'trialing',
      },
      stripeCustomerId: String,
      subscriptionId: String,
    },
    settings: {
      allowGuestUsers: {
        type: Boolean,
        default: true,
      },
      enforceRecordingConsent: {
        type: Boolean,
        default: true,
      },
      retentionDays: {
        type: Number,
        default: 90,
      },
    },
  },
  {
    timestamps: true,
  }
)

export const Organization = model<IOrganizationDocument>('Organization', OrganizationSchema)
