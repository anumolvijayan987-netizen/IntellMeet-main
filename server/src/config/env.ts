import dotenv from 'dotenv'
import { z } from 'zod'

dotenv.config()

// Normalize environment variable aliases across providers
const rawMongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/intellimeet'
const rawCorsOrigins = [process.env.CLIENT_URL, process.env.CORS_ORIGIN, 'http://localhost:5173,http://localhost:3000']
  .filter(Boolean)
  .join(',')
const rawStorageEndpoint = process.env.STORAGE_ENDPOINT || process.env.S3_ENDPOINT || ''
const rawStorageBucket = process.env.STORAGE_BUCKET || process.env.S3_BUCKET_NAME || 'intellmeet-recordings'
const rawStorageAccessKey = process.env.STORAGE_ACCESS_KEY || process.env.S3_ACCESS_KEY_ID || ''
const rawStorageSecretKey = process.env.STORAGE_SECRET_KEY || process.env.S3_SECRET_ACCESS_KEY || ''
const rawVideoApiKey = process.env.VIDEO_PROVIDER_API_KEY || process.env.LIVEKIT_API_KEY || 'devkey_intellmeet'
const rawVideoApiSecret = process.env.VIDEO_PROVIDER_API_SECRET || process.env.LIVEKIT_API_SECRET || 'secret_intellmeet_key_abcdef123456'
const rawTurnServers = process.env.TURN_SERVER_URL || process.env.TURN_SERVERS || ''
const rawAiProvider = process.env.AI_PROVIDER || 'builtin'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  API_PREFIX: z.string().default('/api'),
  CORS_ORIGIN: z.string().default(rawCorsOrigins),
  MONGO_URI: z.string().default(rawMongoUri),
  JWT_SECRET: z.string().default('intellmeet_access_jwt_secret_key_12345'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_SECRET: z.string().default('intellmeet_refresh_jwt_secret_key_67890'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  COOKIE_SECRET: z.string().default('intellmeet_cookie_signing_secret_999'),
  OPENAI_API_KEY: z.string().optional().default(''),
  AI_PROVIDER: z.string().default(rawAiProvider),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'debug']).default('info'),
  RATE_LIMIT_MAX: z.coerce.number().default(200),
  LIVEKIT_URL: z.string().default('wss://livekit.intellmeet.internal'),
  LIVEKIT_API_KEY: z.string().default(rawVideoApiKey),
  LIVEKIT_API_SECRET: z.string().default(rawVideoApiSecret),
  STUN_SERVERS: z.string().default('stun:stun.l.google.com:19302,stun:stun1.l.google.com:19302,stun:stun2.l.google.com:19302'),
  TURN_SERVERS: z.string().optional().default(rawTurnServers),
  TURN_USERNAME: z.string().optional().default(''),
  TURN_CREDENTIAL: z.string().optional().default(''),
  S3_ENDPOINT: z.string().optional().default(rawStorageEndpoint),
  S3_REGION: z.string().default('auto'),
  S3_BUCKET_NAME: z.string().default(rawStorageBucket),
  S3_ACCESS_KEY_ID: z.string().optional().default(rawStorageAccessKey),
  S3_SECRET_ACCESS_KEY: z.string().optional().default(rawStorageSecretKey),
  S3_PUBLIC_URL: z.string().default('https://storage.intellmeet.io/recordings'),
})

const parsedEnv = envSchema.safeParse(process.env)

if (!parsedEnv.success) {
  console.error('❌ Invalid environment configuration:', parsedEnv.error.format())
  process.exit(1)
}

const rawCors = parsedEnv.data.CORS_ORIGIN
const splitCors = rawCors.includes(',')
  ? rawCors.split(',').map((o) => o.trim()).filter(Boolean)
  : [rawCors.trim()]

export const env = {
  ...parsedEnv.data,
  corsOrigins: Array.from(new Set(splitCors)),
  isDev: parsedEnv.data.NODE_ENV === 'development',
  isProd: parsedEnv.data.NODE_ENV === 'production',
  isTest: parsedEnv.data.NODE_ENV === 'test',
}

export type EnvConfig = typeof env
