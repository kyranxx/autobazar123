import { createClient } from '@/lib/supabase/server'

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'critical'
export type LogCategory = 'api' | 'auth' | 'payment' | 'search' | 'system' | 'admin'

export interface LogEntry {
  level: LogLevel
  category: LogCategory
  message: string
  requestId?: string
  userId?: string
  metadata?: Record<string, unknown>
  error?: Error | unknown
}

interface StoredLog {
  level: LogLevel
  category: LogCategory
  message: string
  request_id: string | null
  user_id: string | null
  metadata: Record<string, unknown> | null
  error_stack: string | null
  created_at: string
}

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  critical: 4,
}

const LOG_LEVEL_COLORS: Record<LogLevel, string> = {
  debug: '\x1b[36m',
  info: '\x1b[32m',
  warn: '\x1b[33m',
  error: '\x1b[31m',
  critical: '\x1b[35m',
}

const RESET_COLOR = '\x1b[0m'

function getMinLogLevel(): LogLevel {
  const envLevel = process.env.LOG_LEVEL as LogLevel | undefined
  return envLevel && LOG_LEVEL_PRIORITY[envLevel] !== undefined ? envLevel : 'info'
}

function shouldLog(level: LogLevel): boolean {
  const minLevel = getMinLogLevel()
  return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[minLevel]
}

export function generateRequestId(): string {
  const timestamp = Date.now().toString(36)
  const randomPart = Math.random().toString(36).substring(2, 10)
  return `req_${timestamp}_${randomPart}`
}

function formatError(error: unknown): string | null {
  if (!error) return null
  if (error instanceof Error) {
    return `${error.name}: ${error.message}\n${error.stack || ''}`
  }
  return String(error)
}

function logToConsole(entry: LogEntry & { timestamp: string }): void {
  const color = LOG_LEVEL_COLORS[entry.level]
  const levelStr = `[${entry.level.toUpperCase()}]`.padEnd(10)
  const categoryStr = `[${entry.category}]`.padEnd(10)
  const requestStr = entry.requestId ? `[${entry.requestId}]` : ''
  const userStr = entry.userId ? `[user:${entry.userId}]` : ''

  const prefix = `${color}${entry.timestamp} ${levelStr}${categoryStr}${requestStr}${userStr}${RESET_COLOR}`
  
  console.log(`${prefix} ${entry.message}`)
  
  if (entry.metadata && Object.keys(entry.metadata).length > 0) {
    console.log(`  metadata:`, entry.metadata)
  }
  
  if (entry.error) {
    console.log(`  error:`, formatError(entry.error))
  }
}

async function logToDatabase(entry: LogEntry & { timestamp: string }): Promise<void> {
  try {
    const supabase = await createClient()
    
    const storedLog: StoredLog = {
      level: entry.level,
      category: entry.category,
      message: entry.message,
      request_id: entry.requestId || null,
      user_id: entry.userId || null,
      metadata: entry.metadata || null,
      error_stack: formatError(entry.error),
      created_at: entry.timestamp,
    }

    const { error } = await supabase.from('system_logs').insert(storedLog)
    
    if (error) {
      console.error('Failed to write log to database:', error)
    }
  } catch (err) {
    console.error('Error writing log to database:', err)
  }
}

function createLogFunction(level: LogLevel) {
  return function (
    category: LogCategory,
    message: string,
    options?: Omit<LogEntry, 'level' | 'category' | 'message'>
  ): void {
    if (!shouldLog(level)) return

    const timestamp = new Date().toISOString()
    const entry: LogEntry & { timestamp: string } = {
      level,
      category,
      message,
      timestamp,
      ...options,
    }

    logToConsole(entry)

    if (process.env.NODE_ENV === 'production' || process.env.LOG_TO_DB === 'true') {
      logToDatabase(entry).catch(() => {})
    }
  }
}

export const logger = {
  debug: createLogFunction('debug'),
  info: createLogFunction('info'),
  warn: createLogFunction('warn'),
  error: createLogFunction('error'),
  critical: createLogFunction('critical'),
  
  withContext(context: { requestId?: string; userId?: string }) {
    return {
      debug: (category: LogCategory, message: string, options?: Omit<LogEntry, 'level' | 'category' | 'message' | 'requestId' | 'userId'>) =>
        logger.debug(category, message, { ...context, ...options }),
      info: (category: LogCategory, message: string, options?: Omit<LogEntry, 'level' | 'category' | 'message' | 'requestId' | 'userId'>) =>
        logger.info(category, message, { ...context, ...options }),
      warn: (category: LogCategory, message: string, options?: Omit<LogEntry, 'level' | 'category' | 'message' | 'requestId' | 'userId'>) =>
        logger.warn(category, message, { ...context, ...options }),
      error: (category: LogCategory, message: string, options?: Omit<LogEntry, 'level' | 'category' | 'message' | 'requestId' | 'userId'>) =>
        logger.error(category, message, { ...context, ...options }),
      critical: (category: LogCategory, message: string, options?: Omit<LogEntry, 'level' | 'category' | 'message' | 'requestId' | 'userId'>) =>
        logger.critical(category, message, { ...context, ...options }),
    }
  },
}

export default logger
