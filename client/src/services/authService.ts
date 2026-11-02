import { apiRequest } from './apiClient'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: string
  avatarUrl?: string
  status?: string
  organizationId?: string
  workspaceId?: string
  isEmailVerified?: boolean
  preferences?: {
    theme?: string
    defaultAudio?: boolean
    defaultVideo?: boolean
    language?: string
    emailNotifications?: boolean
  }
}

export interface AuthResponse {
  user: AuthUser
  accessToken?: string
  refreshToken?: string
  verificationCode?: string
}

export const authService = {
  async register(data: {
    name: string
    email: string
    password: string
    role?: string
    organizationName?: string
  }): Promise<AuthResponse> {
    const res = await apiRequest<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    if (res.accessToken) {
      localStorage.setItem('access_token', res.accessToken)
    }
    return res
  },

  async login(data: { email: string; password: string }): Promise<AuthResponse> {
    const res = await apiRequest<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    if (res.accessToken) {
      localStorage.setItem('access_token', res.accessToken)
    }
    return res
  },

  async logout(): Promise<void> {
    try {
      await apiRequest('/auth/logout', { method: 'POST' })
    } finally {
      localStorage.removeItem('access_token')
    }
  },

  async getMe(): Promise<AuthUser> {
    return apiRequest<AuthUser>('/auth/me')
  },

  async verifyEmail(email: string, code: string): Promise<AuthResponse> {
    const res = await apiRequest<AuthResponse>('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    })
    if (res.accessToken) {
      localStorage.setItem('access_token', res.accessToken)
    }
    return res
  },

  async forgotPassword(email: string): Promise<{ message: string; resetToken?: string }> {
    return apiRequest<{ message: string; resetToken?: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    })
  },

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    return apiRequest<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    })
  },

  async updateProfile(data: { name?: string; avatarUrl?: string; status?: string }): Promise<AuthUser> {
    return apiRequest<AuthUser>('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },

  async uploadAvatar(file: File): Promise<{ avatarUrl: string }> {
    const formData = new FormData()
    formData.append('avatar', file)
    return apiRequest<{ avatarUrl: string }>('/users/me/avatar', {
      method: 'POST',
      body: formData,
    })
  },

  async changePassword(data: { currentPassword: string; newPassword: string }): Promise<{ updated: boolean }> {
    return apiRequest<{ updated: boolean }>('/users/me/password', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async updatePreferences(preferences: Record<string, unknown>): Promise<Record<string, unknown>> {
    return apiRequest<Record<string, unknown>>('/users/me/preferences', {
      method: 'PATCH',
      body: JSON.stringify(preferences),
    })
  },
}
