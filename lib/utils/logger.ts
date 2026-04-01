import * as Sentry from '@sentry/nextjs'

type LogLevel = 'info' | 'warn' | 'error'

interface LogContext {
    [key: string]: any
}

class Logger {
    private isDev = process.env.NODE_ENV === 'development'

    info(message: string, context?: LogContext) {
        if (this.isDev) {
            console.log(`ℹ️ [INFO] ${message}`, context || '')
        } else {
            // In production, structured logging for cloud providers (Vercel/AWS)
            console.log(JSON.stringify({ level: 'info', message, ...context }))
        }
    }

    warn(message: string, context?: LogContext) {
        if (this.isDev) {
            console.warn(`⚠️ [WARN] ${message}`, context || '')
        } else {
            console.warn(JSON.stringify({ level: 'warn', message, ...context }))
            Sentry.captureMessage(message, { level: 'warning', extra: context })
        }
    }

    error(message: string, error?: any, context?: LogContext) {
        if (this.isDev) {
            console.error(`❌ [ERROR] ${message}`, error, context || '')
        } else {
            // Log to stdout so it appears in server logs
            console.error(JSON.stringify({
                level: 'error',
                message,
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
                ...context
            }))

            // Send to Sentry
            Sentry.captureException(error || new Error(message), {
                extra: { ...context, customMessage: message }
            })
        }
    }
}

export const logger = new Logger()
