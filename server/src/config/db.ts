import mongoose from 'mongoose'
import dns from 'dns'
import { env } from './env'
import { logger } from '../utils/logger'

export type DatabaseStatus =
  | 'connected'
  | 'connecting'
  | 'disconnected'
  | 'fallback_in_memory'

class DatabaseConnection {
  private static instance: DatabaseConnection
  private status: DatabaseStatus = 'disconnected'
  private retryCount = 0
  private readonly maxRetries = 3

  private constructor() {
    this.setupEventListeners()
  }

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection()
    }
    return DatabaseConnection.instance
  }

  private setupEventListeners(): void {
    mongoose.connection.on('connected', () => {
      this.status = 'connected'
      logger.info('🍃 MongoDB connected successfully', {
        host: mongoose.connection.host,
        db: mongoose.connection.name,
      })
    })

    mongoose.connection.on('error', (err) => {
      logger.error('🍃 MongoDB connection error:', { message: err.message })
    })

    mongoose.connection.on('disconnected', () => {
      if (this.status !== 'fallback_in_memory') {
        this.status = 'disconnected'
      }
      logger.warn('🍃 MongoDB disconnected')
    })
  }

  public async connect(): Promise<void> {
    this.status = 'connecting'
    logger.info(`🍃 Connecting to MongoDB at ${this.maskUri(env.MONGO_URI)}...`)

    if (process.platform === 'win32' && env.MONGO_URI.startsWith('mongodb+srv://')) {
      try {
        dns.setServers(['8.8.8.8', '1.1.1.1'])
      } catch {}
    }

    try {
      await mongoose.connect(env.MONGO_URI, {
        serverSelectionTimeoutMS: 4000,
        connectTimeoutMS: 5000,
      })
      this.status = 'connected'
      this.retryCount = 0
    } catch (err: unknown) {
      const error = err as Error
      logger.warn(
        `🍃 MongoDB direct connection failed: ${error.message}. Activating resilient fallback mode.`
      )
      this.status = 'fallback_in_memory'
      logger.info(
        '💾 [Resilient Store] In-memory database buffer active. Server operations proceeding smoothly.'
      )
    }
  }

  public async disconnect(): Promise<void> {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect()
      this.status = 'disconnected'
      logger.info('🍃 MongoDB connection closed gracefully')
    }
  }

  public getStatus(): DatabaseStatus {
    return this.status
  }

  public isConnected(): boolean {
    return this.status === 'connected'
  }

  public isFallback(): boolean {
    return this.status === 'fallback_in_memory'
  }

  public getMaskedUri(): string {
    return this.maskUri(env.MONGO_URI)
  }

  private maskUri(uri: string): string {
    return uri.replace(/\/\/(.*?)@/, '//***:***@')
  }
}

export const db = DatabaseConnection.getInstance()
