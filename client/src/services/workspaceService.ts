import { apiClient } from './apiClient'

export interface WorkspaceDto {
  _id: string
  id?: string
  name: string
  slug: string
  description?: string
  isPrivate: boolean
  defaultRole?: string
  createdAt?: string | Date
}

export interface WorkspaceMemberDto {
  _id: string
  id?: string
  workspaceId: string
  role: 'owner' | 'admin' | 'member' | 'guest'
  status?: string
  userId: {
    _id?: string
    name: string
    email: string
    avatarUrl?: string
    status?: string
  }
  joinedAt?: string | Date
}

export interface WorkspaceDashboardStats {
  workspaceId: string
  name: string
  memberCount: number
  activeMeetingsCount: number
  pendingTasksCount: number
  completedMeetingsCount: number
  storageUsedGb: number
  storageLimitGb: number
  plan: string
}

export interface WorkspaceActivityItem {
  id: string
  type: string
  title: string
  actorName: string
  timestamp: string
  details?: string
}

export const workspaceService = {
  async getWorkspaces(): Promise<WorkspaceDto[]> {
    return apiClient.get<WorkspaceDto[]>('/workspaces')
  },

  async createWorkspace(payload: {
    name: string
    slug: string
    description?: string
    isPrivate?: boolean
    organizationId?: string
  }): Promise<WorkspaceDto> {
    return apiClient.post<WorkspaceDto>('/workspaces', payload)
  },

  async getDashboard(workspaceId = 'ws_general'): Promise<WorkspaceDashboardStats> {
    return apiClient.get<WorkspaceDashboardStats>(`/workspaces/${workspaceId}/dashboard`)
  },

  async getActivity(workspaceId = 'ws_general'): Promise<WorkspaceActivityItem[]> {
    return apiClient.get<WorkspaceActivityItem[]>(`/workspaces/${workspaceId}/activity`)
  },

  async getMembers(workspaceId = 'ws_general'): Promise<WorkspaceMemberDto[]> {
    return apiClient.get<WorkspaceMemberDto[]>(`/workspaces/${workspaceId}/members`)
  },

  async inviteMember(
    workspaceId: string,
    email: string,
    role: 'owner' | 'admin' | 'member' | 'guest' = 'member'
  ): Promise<any> {
    return apiClient.post(`/workspaces/${workspaceId}/members`, { email, role })
  },

  async updateMemberRole(
    workspaceId: string,
    memberId: string,
    role: 'owner' | 'admin' | 'member' | 'guest'
  ): Promise<any> {
    return apiClient.patch(`/workspaces/${workspaceId}/members/${memberId}`, { role })
  },

  async removeMember(workspaceId: string, memberId: string): Promise<any> {
    return apiClient.delete(`/workspaces/${workspaceId}/members/${memberId}`)
  },

  async updateSettings(
    workspaceId: string,
    updates: Partial<{ name: string; slug: string; description: string; isPrivate: boolean }>
  ): Promise<any> {
    return apiClient.patch(`/workspaces/${workspaceId}`, updates)
  },
}
