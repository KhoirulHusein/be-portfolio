import { TooManyRequestsError } from './errors'

interface RateLimitEntry {
  count: number
  resetTime: number
}

class InMemoryRateLimit {
  private store = new Map<string, RateLimitEntry>()
  private maxRequests: number
  private windowMs: number

  constructor(maxRequests = 5, windowMs = 60000) {
    this.maxRequests = maxRequests
    this.windowMs = windowMs
    
    // Clean up expired entries every 5 minutes
    setInterval(() => {
      this.cleanup()
    }, 5 * 60 * 1000)
  }

  check(key: string): boolean {
    const now = Date.now()
    const entry = this.store.get(key)

    if (!entry || now > entry.resetTime) {
      // First request or window expired
      this.store.set(key, {
        count: 1,
        resetTime: now + this.windowMs
      })
      return true
    }

    if (entry.count >= this.maxRequests) {
      return false
    }

    entry.count++
    return true
  }

  private cleanup() {
    const now = Date.now()
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key)
      }
    }
  }
}

// Global rate limiters
const loginRateLimit = new InMemoryRateLimit(
  parseInt(process.env.RATE_LIMIT_LOGIN_MAX || '5'),
  parseInt(process.env.RATE_LIMIT_LOGIN_WINDOW || '60000')
)

const refreshRateLimit = new InMemoryRateLimit(10, 60000) // 10 requests per minute

export function checkLoginRateLimit(ip: string): void {
  if (!loginRateLimit.check(ip)) {
    throw new TooManyRequestsError('Too many login attempts. Please try again later.')
  }
}

export function checkRefreshRateLimit(ip: string): void {
  if (!refreshRateLimit.check(ip)) {
    throw new TooManyRequestsError('Too many refresh attempts. Please try again later.')
  }
}
