/**
 * Rate Limiting Middleware - Story 4.2: Dynamic Dialogue Generation
 *
 * Efficient rate limiting implementation with periodic cleanup to prevent memory leaks.
 */

import { Request, Response, NextFunction } from 'express'

interface ClientData {
  count: number
  resetTime: number
  lastCleanup: number
}

/**
 * Efficient rate limiter with periodic cleanup
 */
export function createRateLimiter(windowMs: number = 60000, maxRequests: number = 100) {
  const requests = new Map<string, ClientData>()
  const CLEANUP_INTERVAL = 300000 // 5 minutes
  const MAX_CLIENTS = 10000 // Prevent memory bloat

  // Periodic cleanup function (runs every 5 minutes)
  const periodicCleanup = () => {
    const now = Date.now()
    const entriesToDelete: string[] = []

    // Find expired entries in a single pass
    for (const [id, data] of requests.entries()) {
      if (now > data.resetTime && now - data.lastCleanup > CLEANUP_INTERVAL) {
        entriesToDelete.push(id)
      }
    }

    // Delete expired entries
    entriesToDelete.forEach(id => requests.delete(id))

    // Prevent memory bloat
    if (requests.size > MAX_CLIENTS) {
      const entriesToRemove = Array.from(requests.keys()).slice(0, requests.size - MAX_CLIENTS)
      entriesToRemove.forEach(id => requests.delete(id))
    }
  }

  // Start periodic cleanup
  const cleanupInterval = setInterval(periodicCleanup, CLEANUP_INTERVAL)

  return (req: Request, res: Response, next: NextFunction) => {
    const clientId = req.ip || req.connection.remoteAddress || 'unknown'
    const now = Date.now()

    // Check current client (no full iteration needed)
    const clientData = requests.get(clientId)

    if (!clientData) {
      // First request from this client
      requests.set(clientId, {
        count: 1,
        resetTime: now + windowMs,
        lastCleanup: now
      })
      return next()
    }

    // Check if window has reset for this specific client
    if (now > clientData.resetTime) {
      // Reset the window
      clientData.count = 1
      clientData.resetTime = now + windowMs
      clientData.lastCleanup = now
      return next()
    }

    // Check if rate limit exceeded
    if (clientData.count >= maxRequests) {
      return res.status(429).json({
        error: 'Too many requests',
        message: `Rate limit exceeded. Maximum ${maxRequests} requests per ${windowMs / 1000} seconds.`,
        retryAfter: Math.ceil((clientData.resetTime - now) / 1000)
      })
    }

    // Increment request count
    clientData.count++
    next()
  }
}

/**
 * Default rate limiter for dialogue endpoints
 */
export const rateLimiter = createRateLimiter(60000, 100) // 100 requests per minute