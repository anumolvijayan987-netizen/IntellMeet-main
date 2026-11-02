export interface ApiResponse<T = unknown> {
  success: boolean
  message: string
  data?: T
  error?: ApiErrorPayload
  meta?: ApiMetaPayload
  timestamp: string
}

export interface ApiErrorPayload {
  code: string
  details?: unknown
  stack?: string
}

export interface ApiMetaPayload {
  page?: number
  limit?: number
  total?: number
  totalPages?: number
  [key: string]: unknown
}

export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy'
  service: string
  version: string
  uptimeSeconds: number
  timestamp: string
  database: {
    status: 'connected' | 'connecting' | 'disconnected' | 'fallback_in_memory'
    uriMasked: string
  }
  socket: {
    activeConnections: number
    activeRooms: number
  }
  system: {
    nodeVersion: string
    memoryUsageMB: {
      rss: number
      heapTotal: number
      heapUsed: number
    }
  }
}
