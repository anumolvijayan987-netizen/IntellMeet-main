import { API_BASE_URL } from '../utils/constants'

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

let isRefreshing = false
let refreshSubscribers: ((token: string) => void)[] = []

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb)
}

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token))
  refreshSubscribers = []
}

export function buildApiUrl(endpoint: string): string {
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  // If API_BASE_URL is relative (e.g. '/api')
  if (API_BASE_URL.startsWith('/')) {
    if (normalizedEndpoint.startsWith('/api')) {
      return normalizedEndpoint
    }
    const cleanBase = API_BASE_URL.replace(/\/+$/, '')
    return `${cleanBase}${normalizedEndpoint}`
  }

  // If API_BASE_URL is absolute (e.g. 'https://backend.com' or 'https://backend.com/api')
  const baseWithoutTrailingSlash = API_BASE_URL.replace(/\/+$/, '')
  if (normalizedEndpoint.startsWith('/api')) {
    const rootDomain = baseWithoutTrailingSlash.replace(/\/api$/, '')
    return `${rootDomain}${normalizedEndpoint}`
  }
  const prefix = baseWithoutTrailingSlash.endsWith('/api')
    ? baseWithoutTrailingSlash
    : `${baseWithoutTrailingSlash}/api`
  return `${prefix}${normalizedEndpoint}`
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = buildApiUrl(endpoint)

  const headers = new Headers(options.headers || {})
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  // Attach Access Token if available
  const token = localStorage.getItem('access_token')
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // allow HTTP-only cookies to be sent
  })

  // Handle Token Refresh on 401 Unauthorized (unless it's already an auth route)
  if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh')) {
    if (!isRefreshing) {
      isRefreshing = true
      try {
        const refreshRes = await fetch(buildApiUrl('/auth/refresh'), {
          method: 'POST',
          credentials: 'include',
        })
        const refreshData = await refreshRes.json()
        if (refreshRes.ok && refreshData.data?.accessToken) {
          const newToken = refreshData.data.accessToken
          localStorage.setItem('access_token', newToken)
          isRefreshing = false
          onRefreshed(newToken)

          // Retry original request with new token
          headers.set('Authorization', `Bearer ${newToken}`)
          return apiRequest<T>(endpoint, { ...options, headers })
        }
      } catch {
        // Refresh failed, proceed to logout or error
      } finally {
        isRefreshing = false
      }
    } else {
      // Queue requests until refresh completes
      return new Promise<T>((resolve, reject) => {
        subscribeTokenRefresh((newToken) => {
          headers.set('Authorization', `Bearer ${newToken}`)
          apiRequest<T>(endpoint, { ...options, headers }).then(resolve).catch(reject)
        })
      })
    }
  }

  let payload: any
  try {
    payload = await response.json()
  } catch {
    payload = null
  }

  if (!response.ok) {
    throw new ApiError(
      response.status,
      payload?.error?.code || 'UNKNOWN_ERROR',
      payload?.message || `HTTP error ${response.status}`,
      payload?.error?.details
    )
  }

  return (payload.data !== undefined ? payload.data : payload) as T
}

export const apiClient = {
  get: <T>(endpoint: string, options?: RequestInit) =>
    apiRequest<T>(endpoint, { ...options, method: 'GET' }),
  post: <T>(endpoint: string, body?: any, options?: RequestInit) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
  patch: <T>(endpoint: string, body?: any, options?: RequestInit) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  delete: <T>(endpoint: string, options?: RequestInit) =>
    apiRequest<T>(endpoint, { ...options, method: 'DELETE' }),
}
