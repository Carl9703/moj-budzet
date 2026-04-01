
/**
 * Simple In-Memory Rate Limiter using a Map.
 * Note: In a serverless environment (like Vercel), this state is local to the lambda instance.
 * For distributed rate limiting, consider using Redis (e.g., Upstash).
 */

interface RateLimitRecord {
    count: number
    expiresAt: number
}

const store = new Map<string, RateLimitRecord>()

// Defensive cleanup to prevent memory leaks in long-running processes
const MAX_STORE_SIZE = 10000

function pruneStore() {
    const now = Date.now()
    store.forEach((value, key) => {
        if (value.expiresAt < now) {
            store.delete(key)
        }
    })
    // Hard reset if still too large
    if (store.size > MAX_STORE_SIZE) {
        store.clear()
    }
}

export interface RateLimitConfig {
    limit: number
    windowMs: number
}

export interface RateLimitResult {
    success: boolean
    remaining: number
    reset?: number
}

export function rateLimit(identifier: string, config: RateLimitConfig): RateLimitResult {
    const now = Date.now()
    const record = store.get(identifier)

    // Lazy cleanup on every 100th new entry or so? 
    // Simplified: Just check current record.
    // If store grows too big, prune.
    if (store.size > MAX_STORE_SIZE) {
        pruneStore()
    }

    if (!record || record.expiresAt < now) {
        store.set(identifier, {
            count: 1,
            expiresAt: now + config.windowMs
        })
        return { success: true, remaining: config.limit - 1 }
    }

    if (record.count >= config.limit) {
        return {
            success: false,
            remaining: 0,
            reset: record.expiresAt
        }
    }

    record.count++
    return {
        success: true,
        remaining: config.limit - record.count
    }
}
