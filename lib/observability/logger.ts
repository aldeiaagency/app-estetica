import 'server-only'

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

type LogContext = Record<string, unknown>

const SENSITIVE_KEYS = new Set([
  'password', 'token', 'authorization', 'cookie', 'secret', 'apiKey',
  'customerEmail', 'email', 'phone', 'customerPhone',
])

function redact(value: unknown, key?: string): unknown {
  if (key && SENSITIVE_KEYS.has(key)) return '[REDACTED]'
  if (Array.isArray(value)) return value.map(item => redact(item))
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([childKey, childValue]) => [childKey, redact(childValue, childKey)]),
    )
  }
  if (value instanceof Error) {
    return { name: value.name, message: value.message, stack: process.env.NODE_ENV === 'production' ? undefined : value.stack }
  }
  return value
}

function write(level: LogLevel, event: string, context: LogContext = {}) {
  const payload = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    event,
    service: 'app-estetica',
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? 'unknown',
    ...redact(context) as LogContext,
  })

  if (level === 'error') console.error(payload)
  else if (level === 'warn') console.warn(payload)
  else console.log(payload)
}

export const logger = {
  debug: (event: string, context?: LogContext) => write('debug', event, context),
  info: (event: string, context?: LogContext) => write('info', event, context),
  warn: (event: string, context?: LogContext) => write('warn', event, context),
  error: (event: string, error?: unknown, context?: LogContext) => write('error', event, { ...context, error }),
}

export async function reportOperationalError(event: string, error: unknown, context: LogContext = {}) {
  logger.error(event, error, context)
  const webhook = process.env.OBSERVABILITY_WEBHOOK_URL
  if (!webhook) return

  try {
    await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event,
        occurredAt: new Date().toISOString(),
        environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
        error: error instanceof Error ? { name: error.name, message: error.message } : String(error),
        context: redact(context),
      }),
      signal: AbortSignal.timeout(3000),
    })
  } catch (reportError) {
    logger.warn('observability.delivery_failed', { reportError })
  }
}
