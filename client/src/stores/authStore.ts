import { create } from 'zustand'
import { DEFAULT_USER } from '../utils/constants'
import { authService, AuthUser } from '../services/authService'

export interface UserProfile {
  id: string
  name: string
  email: string
  role: string
  avatarUrl: string
  status?: string
  organizationId?: string
  workspaceId?: string
}

interface AuthState {
  user: UserProfile
  accessToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  workspaceName: string
  organizationName: string
  setWorkspaceName: (name: string) => void
  setUserName: (name: string) => void
  setUser: (user: Partial<UserProfile>) => void
  setAccessToken: (token: string | null) => void
  initAuth: () => Promise<void>
  logout: () => Promise<void>
}

function getInitialUser(): UserProfile {
  try {
    const cached = localStorage.getItem('user_profile')
    if (cached) {
      return JSON.parse(cached)
    }
  } catch {}

  // Unique session identity for guest tabs so multiple tabs never have the exact same name
  let guestId = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('guest_id') : null
  let guestName = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('guest_name') : null

  if (!guestId || !guestName) {
    const randomNum = Math.floor(1000 + Math.random() * 9000)
    guestId = `guest_${Date.now().toString().slice(-4)}_${randomNum}`
    guestName = `Guest ${randomNum}`
    try {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('guest_id', guestId)
        sessionStorage.setItem('guest_name', guestName)
      }
    } catch {}
  }

  return {
    id: guestId,
    name: guestName,
    email: `${guestId}@guest.intellmeet.io`,
    role: 'guest',
    avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(guestName)}`,
    status: 'active',
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: getInitialUser(),
  accessToken: localStorage.getItem('access_token'),
  isAuthenticated: Boolean(localStorage.getItem('access_token')),
  isLoading: false,
  workspaceName: 'Engineering Sprint Workspace',
  organizationName: 'Enterprise Cloud Inc.',

  setWorkspaceName: (workspaceName: string) => set({ workspaceName }),

  setUserName: (name: string) =>
    set((state) => {
      const updated = { ...state.user, name }
      try {
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.setItem('guest_name', name)
        }
        if (state.isAuthenticated) {
          localStorage.setItem('user_profile', JSON.stringify(updated))
        }
      } catch {}
      return { user: updated }
    }),

  setUser: (updatedUser: Partial<UserProfile>) =>
    set((state) => {
      const newUser = { ...state.user, ...updatedUser }
      try {
        localStorage.setItem('user_profile', JSON.stringify(newUser))
      } catch {}
      return {
        user: newUser,
        isAuthenticated: true,
      }
    }),

  setAccessToken: (token: string | null) => {
    if (token) {
      localStorage.setItem('access_token', token)
      set({ accessToken: token, isAuthenticated: true })
    } else {
      localStorage.removeItem('access_token')
      localStorage.removeItem('user_profile')
      set({ accessToken: null, isAuthenticated: false })
    }
  },

  initAuth: async () => {
    const token = localStorage.getItem('access_token')
    if (!token) return

    set({ isLoading: true })
    try {
      const me = await authService.getMe()
      if (me) {
        set({
          user: {
            id: me.id,
            name: me.name,
            email: me.email,
            role: me.role,
            avatarUrl: me.avatarUrl || DEFAULT_USER.avatarUrl,
            status: me.status || 'active',
            organizationId: me.organizationId,
            workspaceId: me.workspaceId,
          },
          isAuthenticated: true,
        })
      }
    } catch {
      // If token expired and refresh fails, reset auth state
      localStorage.removeItem('access_token')
      set({ accessToken: null, isAuthenticated: false })
    } finally {
      set({ isLoading: false })
    }
  },

  logout: async () => {
    try {
      await authService.logout()
    } finally {
      set({
        accessToken: null,
        isAuthenticated: false,
        user: {
          id: '',
          name: 'Guest User',
          email: '',
          role: 'guest',
          avatarUrl: DEFAULT_USER.avatarUrl,
          status: 'offline',
        },
      })
    }
  },
}))
