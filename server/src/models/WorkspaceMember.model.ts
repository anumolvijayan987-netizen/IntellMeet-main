import { Schema, model, Document } from 'mongoose'

export interface IWorkspaceMemberDocument extends Document {
  workspaceId: Schema.Types.ObjectId
  userId: Schema.Types.ObjectId
  role: 'owner' | 'admin' | 'member' | 'guest'
  permissions: string[]
  joinedAt: Date
  createdAt: Date
  updatedAt: Date
}

const WorkspaceMemberSchema = new Schema<IWorkspaceMemberDocument>(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: 'Workspace',
      required: [true, 'Workspace ID is required'],
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    role: {
      type: String,
      enum: ['owner', 'admin', 'member', 'guest'],
      default: 'member',
    },
    permissions: {
      type: [String],
      default: ['create_meeting', 'view_meetings', 'join_meetings'],
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
)

WorkspaceMemberSchema.index({ workspaceId: 1, userId: 1 }, { unique: true })

export const WorkspaceMember = model<IWorkspaceMemberDocument>('WorkspaceMember', WorkspaceMemberSchema)
