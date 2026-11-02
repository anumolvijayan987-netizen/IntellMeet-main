import { Schema, model, Document } from 'mongoose'

export interface IWorkspaceDocument extends Document {
  organizationId: Schema.Types.ObjectId
  name: string
  slug: string
  description?: string
  isPrivate: boolean
  defaultRole: 'owner' | 'admin' | 'member' | 'guest'
  createdAt: Date
  updatedAt: Date
}

const WorkspaceSchema = new Schema<IWorkspaceDocument>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Organization ID is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Workspace name is required'],
      trim: true,
      maxlength: [80, 'Workspace name cannot exceed 80 characters'],
    },
    slug: {
      type: String,
      required: [true, 'Workspace slug is required'],
      trim: true,
      lowercase: true,
    },
    description: {
      type: String,
      default: '',
      maxlength: [300, 'Description cannot exceed 300 characters'],
    },
    isPrivate: {
      type: Boolean,
      default: false,
    },
    defaultRole: {
      type: String,
      enum: ['owner', 'admin', 'member', 'guest'],
      default: 'member',
    },
  },
  {
    timestamps: true,
  }
)

WorkspaceSchema.index({ organizationId: 1, slug: 1 }, { unique: true })

export const Workspace = model<IWorkspaceDocument>('Workspace', WorkspaceSchema)
