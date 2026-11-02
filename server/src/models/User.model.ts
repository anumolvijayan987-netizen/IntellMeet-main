import { Schema, model, Document } from 'mongoose'
import bcrypt from 'bcryptjs'

export interface IUserDocument extends Document {
  name: string
  email: string
  passwordHash?: string
  avatarUrl?: string
  role: 'super_admin' | 'org_admin' | 'meeting_host' | 'member' | 'guest'
  organizationId?: Schema.Types.ObjectId
  workspaceId?: Schema.Types.ObjectId
  isActive: boolean
  isEmailVerified: boolean
  verificationCode?: string
  verificationExpires?: Date
  resetPasswordToken?: string
  resetPasswordExpires?: Date
  refreshToken?: string
  status: 'active' | 'away' | 'busy' | 'offline'
  preferences: {
    theme: 'light' | 'dark' | 'system'
    defaultMicEnabled: boolean
    defaultCamEnabled: boolean
    transcriptionLanguage: string
  }
  lastLoginAt?: Date
  createdAt: Date
  updatedAt: Date
  comparePassword(candidate: string): Promise<boolean>
}

const UserSchema = new Schema<IUserDocument>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
      index: true,
    },
    passwordHash: {
      type: String,
      select: false,
    },
    avatarUrl: {
      type: String,
      default: '',
    },
    role: {
      type: String,
      enum: ['super_admin', 'org_admin', 'meeting_host', 'member', 'guest'],
      default: 'member',
      index: true,
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
    isActive: {
      type: Boolean,
      default: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    verificationCode: {
      type: String,
      select: false,
    },
    verificationExpires: {
      type: Date,
      select: false,
    },
    resetPasswordToken: {
      type: String,
      select: false,
    },
    resetPasswordExpires: {
      type: Date,
      select: false,
    },
    refreshToken: {
      type: String,
      select: false,
    },
    status: {
      type: String,
      enum: ['active', 'away', 'busy', 'offline'],
      default: 'active',
    },
    preferences: {
      theme: {
        type: String,
        enum: ['light', 'dark', 'system'],
        default: 'light',
      },
      defaultMicEnabled: {
        type: Boolean,
        default: true,
      },
      defaultCamEnabled: {
        type: Boolean,
        default: true,
      },
      transcriptionLanguage: {
        type: String,
        default: 'en-US',
      },
    },
    lastLoginAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
)

UserSchema.index({ organizationId: 1, role: 1 })

// Instance method to check password with bcrypt
UserSchema.methods.comparePassword = async function (
  candidate: string
): Promise<boolean> {
  if (!this.passwordHash) return false
  return bcrypt.compare(candidate, this.passwordHash)
}

export const User = model<IUserDocument>('User', UserSchema)
