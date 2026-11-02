import { UserRole, WorkspaceRole } from '../constants/roles'

export interface IUser {
  _id: string
  name: string
  email: string
  avatarUrl?: string
  role: UserRole
  organizationId?: string
  isActive: boolean
  preferences?: {
    theme?: 'light' | 'dark' | 'system'
    defaultMicEnabled?: boolean
    defaultCamEnabled?: boolean
    transcriptionLanguage?: string
  }
  createdAt: string
  updatedAt: string
}

export interface IOrganization {
  _id: string
  name: string
  slug: string
  logoUrl?: string
  ownerId: string
  tier: 'starter' | 'pro' | 'enterprise'
  maxMeetingDurationMinutes: number
  maxParticipantsPerMeeting: number
  createdAt: string
  updatedAt: string
}

export interface IWorkspace {
  _id: string
  organizationId: string
  name: string
  slug: string
  description?: string
  isPrivate: boolean
  defaultRole: WorkspaceRole
  createdAt: string
  updatedAt: string
}

export interface IWorkspaceMember {
  _id: string
  workspaceId: string
  userId: string
  role: WorkspaceRole
  joinedAt: string
}

export interface INotification {
  _id: string
  recipientId: string
  senderId?: string
  type: 'meeting_invite' | 'meeting_summary_ready' | 'action_item_assigned' | 'system_alert'
  title: string
  message: string
  link?: string
  read: boolean
  readAt?: string
  createdAt: string
}
