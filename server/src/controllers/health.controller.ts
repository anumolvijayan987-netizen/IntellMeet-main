import { Request, Response } from 'express'
import { ApiResponse } from '../utils/apiResponse'
import { db } from '../config/db'
import { getSocketServer } from '../sockets/socketHandler'

const startTime = Date.now()

export const getHealth = (req: Request, res: Response): void => {
  const io = getSocketServer()
  const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000)
  const memUsage = process.memoryUsage()

  const dbStatus = db.getStatus()
  const overallStatus =
    dbStatus === 'connected'
      ? 'healthy'
      : dbStatus === 'fallback_in_memory'
      ? 'healthy'
      : 'degraded'

  const healthData = {
    status: overallStatus,
    service: 'IntellMeet Enterprise Real-time & Collaboration Platform',
    version: '1.0.0',
    uptimeSeconds,
    timestamp: new Date().toISOString(),
    database: {
      status: dbStatus,
      uriMasked: db.getMaskedUri(),
    },
    socket: {
      activeConnections: io ? io.engine.clientsCount : 0,
      activeRooms: io ? io.sockets.adapter.rooms.size : 0,
    },
    system: {
      nodeVersion: process.version,
      platform: process.platform,
      memoryUsageMB: {
        rss: Math.round(memUsage.rss / 1024 / 1024),
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      },
    },
  }

  ApiResponse.success(res, healthData, 'IntellMeet service is healthy')
}
