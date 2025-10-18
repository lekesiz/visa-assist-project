import { LRUCache } from 'lru-cache'
import { NextResponse } from 'next/server'

export type RateLimitOptions = {
  uniqueTokenPerInterval?: number
  interval?: number
}

export function rateLimit(options?: RateLimitOptions) {
  const tokenCache = new LRUCache<string, number[]>({
    max: options?.uniqueTokenPerInterval || 500,
    ttl: options?.interval || 60000, // 1 minute default
  })

  return {
    check: (limit: number, token: string) =>
      new Promise<void>((resolve, reject) => {
        const tokenCount = tokenCache.get(token) || [0]
        
        if (tokenCount[0] === 0) {
          tokenCache.set(token, [1])
        } else {
          tokenCache.set(token, [tokenCount[0] + 1])
        }

        const currentUsage = tokenCache.get(token)![0]
        
        if (currentUsage > limit) {
          reject(new Error('Rate limit exceeded'))
        } else {
          resolve()
        }
      }),
  }
}

// Helper function for API routes
export async function checkRateLimit(
  request: Request,
  options: {
    limit?: number
    interval?: number
    uniqueTokenPerInterval?: number
  } = {}
) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const limiter = rateLimit({
    interval: options.interval || 60000, // 1 minute
    uniqueTokenPerInterval: options.uniqueTokenPerInterval || 500,
  })

  try {
    await limiter.check(options.limit || 10, `api_${ip}`)
    return { success: true }
  } catch {
    return { 
      success: false, 
      error: NextResponse.json(
        { 
          error: 'Too many requests', 
          message: 'Please try again later' 
        },
        { 
          status: 429,
          headers: {
            'Retry-After': String(options.interval || 60),
          },
        }
      )
    }
  }
}

// Rate limit configurations for different endpoints
export const RATE_LIMITS = {
  // Very restrictive for auth endpoints
  auth: { limit: 5, interval: 300000 }, // 5 requests per 5 minutes
  
  // Moderate for AI endpoints (expensive operations)
  ai: { limit: 10, interval: 60000 }, // 10 requests per minute
  
  // Standard for general API
  api: { limit: 30, interval: 60000 }, // 30 requests per minute
  
  // Relaxed for read operations
  read: { limit: 60, interval: 60000 }, // 60 requests per minute
  
  // Strict for file uploads
  upload: { limit: 5, interval: 300000 }, // 5 uploads per 5 minutes
}