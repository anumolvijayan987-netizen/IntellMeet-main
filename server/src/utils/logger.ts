type LogLevel = 'error' | 'warn' | 'info' | 'http' | 'debug'

const LOG_LEVELS: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
}

const currentLogLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) || 'info'

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  magenta: '\x1b[35m',
  gray: '\x1b[90m',
}

function formatMessage(level: LogLevel, message: string, meta?: unknown): string {
  const timestamp = new Date().toISOString()
  let color = colors.reset
  let badge = `[${level.toUpperCase()}]`

  switch (level) {
    case 'error':
      color = colors.red
      badge = '❌ [ERROR]'
      break
    case 'warn':
      color = colors.yellow
      badge = '⚠️  [WARN] '
      break
    case 'info':
      color = colors.cyan
      badge = 'ℹ️  [INFO] '
      break
    case 'http':
      color = colors.magenta
      badge = '🌐 [HTTP] '
      break
    case 'debug':
      color = colors.gray
      badge = '🐛 [DEBUG]'
      break
  }

  const metaString = meta ? ` ${JSON.stringify(meta)}` : ''
  return `${colors.gray}${timestamp}${colors.reset} ${color}${badge}${colors.reset} ${message}${metaString}`
}

export const logger = {
  error(message: string, meta?: unknown) {
    if (LOG_LEVELS.error <= LOG_LEVELS[currentLogLevel]) {
      console.error(formatMessage('error', message, meta))
    }
  },
  warn(message: string, meta?: unknown) {
    if (LOG_LEVELS.warn <= LOG_LEVELS[currentLogLevel]) {
      console.warn(formatMessage('warn', message, meta))
    }
  },
  info(message: string, meta?: unknown) {
    if (LOG_LEVELS.info <= LOG_LEVELS[currentLogLevel]) {
      console.log(formatMessage('info', message, meta))
    }
  },
  http(message: string, meta?: unknown) {
    if (LOG_LEVELS.http <= LOG_LEVELS[currentLogLevel]) {
      console.log(formatMessage('http', message, meta))
    }
  },
  debug(message: string, meta?: unknown) {
    if (LOG_LEVELS.debug <= LOG_LEVELS[currentLogLevel]) {
      console.log(formatMessage('debug', message, meta))
    }
  },
}
