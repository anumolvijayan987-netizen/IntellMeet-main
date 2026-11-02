export const USER_ROLES = {
  SUPER_ADMIN: 'super_admin',
  ORG_ADMIN: 'org_admin',
  MEETING_HOST: 'meeting_host',
  MEMBER: 'member',
  GUEST: 'guest',
} as const

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES]

export const MEETING_ROLES = {
  HOST: 'host',
  CO_HOST: 'co_host',
  PARTICIPANT: 'participant',
  VIEWER: 'viewer',
} as const

export type MeetingRole = typeof MEETING_ROLES[keyof typeof MEETING_ROLES]

export const WORKSPACE_ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  MEMBER: 'member',
  GUEST: 'guest',
} as const

export type WorkspaceRole = typeof WORKSPACE_ROLES[keyof typeof WORKSPACE_ROLES]

export const MEETING_STATUS = {
  SCHEDULED: 'scheduled',
  LIVE: 'live',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const

export type MeetingStatus = typeof MEETING_STATUS[keyof typeof MEETING_STATUS]
