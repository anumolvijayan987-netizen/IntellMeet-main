import http from 'http'
import express, { Express } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import cookieParser from 'cookie-parser'
import { env } from './config/env'
import { corsOptions } from './config/cors'
import { db } from './config/db'
import { logger } from './utils/logger'
import { requestLogger } from './middleware/requestLogger.middleware'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.middleware'
import { apiRateLimiter } from './middleware/rateLimiter.middleware'
import { mongoSanitize } from './middleware/sanitize.middleware'
import rootRouter from './routes'
import { getHealth } from './controllers/health.controller'
import { initSocketServer } from './sockets/socketHandler'

export const createApp = (): { app: Express; server: http.Server } => {
  const app = express()
  const server = http.createServer(app)

  // Security & Utility Middleware
  app.use(helmet({ crossOriginResourcePolicy: false }))
  app.use(cors(corsOptions))
  app.use(cookieParser(env.COOKIE_SECRET))
  app.use(compression())
  app.use(express.json({ limit: '10mb' }))
  app.use(express.urlencoded({ extended: true, limit: '10mb' }))
  app.use(mongoSanitize)
  app.use(requestLogger)

  // Root welcome & status
  app.get('/', (req, res) => {
    res.json({
      service: 'IntellMeet Enterprise Collaboration Engine',
      version: '1.0.0',
      status: 'active',
      endpoints: {
        health: '/health',
        apiHealth: '/api/v1/health',
        meetings: '/api/v1/meetings',
        aiSummaries: '/api/v1/ai/summarize',
      },
    })
  })

  // Direct top-level health check endpoint for cloud load balancers & orchestrators
  app.get('/health', getHealth)

  // API Routes with rate limiting
  app.use('/api', apiRateLimiter, rootRouter)

  // 404 & Centralized Error Handler
  app.use(notFoundHandler)
  app.use(errorHandler)

  // Socket.io initialization
  initSocketServer(server)

  return { app, server }
}

export const startServer = async (): Promise<http.Server> => {
  const { server } = createApp()

  // Listen on PORT immediately so cloud load balancers & health checks pass without delay
  const port = env.PORT || 5000
  server.listen(port, '0.0.0.0', () => {
    logger.info(`🚀 IntellMeet Server running at http://0.0.0.0:${port}`)
    logger.info(`📡 Real-time Socket.io signaling active on port ${port}`)
    logger.info(`🩺 Health check accessible at http://0.0.0.0:${port}/api/v1/health`)
  })

  // Connect to Database
  try {
    await db.connect()
  } catch (err: any) {
    logger.error('Database connection failed during startup:', { error: err?.message })
  }

  // Graceful shutdown
  const handleShutdown = async (signal: string) => {
    logger.info(`Received ${signal}. Gracefully shutting down IntellMeet server...`)
    server.close(async () => {
      await db.disconnect()
      logger.info('IntellMeet server terminated gracefully.')
      process.exit(0)
    })
  }

  process.on('SIGTERM', () => handleShutdown('SIGTERM'))
  process.on('SIGINT', () => handleShutdown('SIGINT'))

  return server
}

// Start when executed directly
const isDirectExecution =
  Boolean(typeof require !== 'undefined' && require.main === module) ||
  Boolean(process.argv[1] && /[/\\](?:src[/\\])?index\.(ts|js)$/.test(process.argv[1]))

if (isDirectExecution) {
  startServer().catch((err) => {
    logger.error('Fatal error during server startup:', { error: err.message })
    process.exit(1)
  })
}
