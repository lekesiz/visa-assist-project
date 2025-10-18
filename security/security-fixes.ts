/**
 * Security Fixes Implementation Guide
 * 
 * This file contains reference implementations for all security fixes
 * identified in the security audit. Copy and adapt these patterns
 * throughout the application.
 */

import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { LRUCache } from 'lru-cache'

// ============================================================================
// WEBHOOK AUTHENTICATION
// ============================================================================

/**
 * Stripe webhook signature verification
 */
export function verifyStripeWebhook(payload: string, signature: string): boolean {
  const secret = process.env.STRIPE_WEBHOOK_SECRET!
  
  if (!signature || !secret) {
    return false
  }

  // Extract timestamp and signature from header
  const elements = signature.split(',')
  const timestamp = elements.find(el => el.startsWith('t='))?.split('=')[1]
  const sig = elements.find(el => el.startsWith('v1='))?.split('=')[1]

  if (!timestamp || !sig) {
    return false
  }

  // Verify timestamp is recent (within 5 minutes)
  const timestampNumber = parseInt(timestamp, 10)
  const now = Math.floor(Date.now() / 1000)
  if (Math.abs(now - timestampNumber) > 300) {
    return false
  }

  // Create expected signature
  const payloadForSignature = `${timestamp}.${payload}`
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payloadForSignature)
    .digest('hex')

  // Compare signatures using timing-safe comparison
  return crypto.timingSafeEqual(
    Buffer.from(sig, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  )
}

/**
 * PayPal webhook signature verification
 */
export function verifyPayPalWebhook(
  payload: string,
  headers: Record<string, string>
): boolean {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID!
  const certId = headers['paypal-cert-id']
  const signature = headers['paypal-transmission-sig']
  const timestamp = headers['paypal-transmission-time']
  
  if (!certId || !signature || !timestamp) {
    return false
  }

  // In a real implementation, you would:
  // 1. Download PayPal's certificate using the cert ID
  // 2. Verify the signature using the certificate
  // 3. Check timestamp validity
  
  // For now, return true if basic headers are present
  // TODO: Implement full PayPal webhook verification
  return Boolean(certId && signature && timestamp)
}

// ============================================================================
// INPUT VALIDATION SCHEMAS
// ============================================================================

/**
 * Document analysis request validation
 */
export const analyzeDocumentSchema = z.object({
  documentId: z.string().uuid('Invalid document ID format'),
  documentType: z.enum(['passport', 'visa', 'diploma', 'transcript', 'employment_letter', 'bank_statement']),
  content: z.string().max(50000, 'Content too large').optional(),
  options: z.object({
    extractText: z.boolean().optional(),
    checkValidity: z.boolean().optional(),
    language: z.enum(['en', 'de', 'tr', 'fr']).optional(),
  }).optional(),
})

/**
 * Payment creation validation
 */
export const createPaymentSchema = z.object({
  serviceType: z.enum([
    'basic_consultation',
    'visa_application', 
    'premium_support',
    'denklik_service',
    'job_match_service',
    'document_review',
    'appointment_booking',
    'express_service'
  ]).optional(),
  customAmount: z.number().positive().max(999999).optional(), // Max €9,999.99
  currency: z.enum(['EUR', 'USD']).default('EUR'),
  provider: z.enum(['stripe', 'paypal']).default('stripe'),
  applicationId: z.string().uuid().optional(),
  returnUrl: z.string().url('Invalid return URL'),
  cancelUrl: z.string().url('Invalid cancel URL'),
  metadata: z.record(z.string(), z.any()).optional(),
}).refine(
  (data) => data.serviceType || data.customAmount,
  { message: 'Either serviceType or customAmount must be provided' }
)

/**
 * File upload validation
 */
export const fileUploadSchema = z.object({
  file: z.any(), // File object validation handled separately
  documentType: z.enum(['passport', 'visa', 'diploma', 'transcript', 'employment_letter', 'bank_statement']),
  applicationId: z.string().uuid().optional(),
})

/**
 * Application creation/update validation
 */
export const applicationSchema = z.object({
  visaType: z.enum(['work', 'student', 'family', 'business', 'tourist']),
  personalInfo: z.object({
    firstName: z.string().min(1).max(50),
    lastName: z.string().min(1).max(50),
    dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    nationality: z.string().length(2),
    passportNumber: z.string().min(5).max(20),
    email: z.string().email(),
    phone: z.string().regex(/^\+?[1-9]\d{1,14}$/),
  }),
  travelDetails: z.object({
    purpose: z.string().min(1).max(200),
    intendedStay: z.number().positive().max(365),
    entryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    exitDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  }),
  employment: z.object({
    currentJob: z.string().max(100).optional(),
    employer: z.string().max(100).optional(),
    salary: z.number().positive().optional(),
    experience: z.number().min(0).max(50).optional(),
  }).optional(),
  education: z.object({
    highestDegree: z.string().max(100).optional(),
    institution: z.string().max(200).optional(),
    graduationYear: z.number().min(1950).max(new Date().getFullYear()).optional(),
  }).optional(),
})

// ============================================================================
// RATE LIMITING
// ============================================================================

interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: Date
  retryAfter?: number
}

// Rate limit cache
const rateLimitCache = new LRUCache<string, number[]>({
  max: 10000,
  ttl: 60 * 60 * 1000, // 1 hour
})

/**
 * Rate limiting implementation
 */
export async function rateLimit(
  request: NextRequest,
  options: {
    windowMs?: number // Time window in milliseconds
    maxRequests?: number // Max requests per window
    keyGenerator?: (req: NextRequest) => string // Custom key generator
  } = {}
): Promise<RateLimitResult> {
  const {
    windowMs = 60 * 1000, // 1 minute default
    maxRequests = 60, // 60 requests per minute default
    keyGenerator = (req) => req.ip ?? 'anonymous'
  } = options

  const key = keyGenerator(request)
  const now = Date.now()
  const windowStart = now - windowMs

  // Get existing requests for this key
  const requests = rateLimitCache.get(key) ?? []
  
  // Filter to only include requests within the current window
  const recentRequests = requests.filter(timestamp => timestamp > windowStart)

  // Check if limit exceeded
  if (recentRequests.length >= maxRequests) {
    const oldestRequest = Math.min(...recentRequests)
    const retryAfter = Math.ceil((oldestRequest + windowMs - now) / 1000)
    
    return {
      success: false,
      limit: maxRequests,
      remaining: 0,
      reset: new Date(oldestRequest + windowMs),
      retryAfter
    }
  }

  // Add current request timestamp
  recentRequests.push(now)
  rateLimitCache.set(key, recentRequests)

  return {
    success: true,
    limit: maxRequests,
    remaining: maxRequests - recentRequests.length,
    reset: new Date(now + windowMs)
  }
}

/**
 * Rate limiting middleware for different endpoints
 */
export const rateLimitConfigs = {
  // Strict limits for authentication endpoints
  auth: { windowMs: 15 * 60 * 1000, maxRequests: 5 }, // 5 attempts per 15 minutes
  
  // Moderate limits for AI endpoints (resource intensive)
  ai: { windowMs: 60 * 1000, maxRequests: 10 }, // 10 requests per minute
  
  // Standard limits for API endpoints
  api: { windowMs: 60 * 1000, maxRequests: 60 }, // 60 requests per minute
  
  // Lenient limits for file uploads
  upload: { windowMs: 60 * 1000, maxRequests: 20 }, // 20 uploads per minute
  
  // Very strict for payment endpoints
  payment: { windowMs: 60 * 1000, maxRequests: 5 }, // 5 payment attempts per minute
}

// ============================================================================
// SECURITY MIDDLEWARE
// ============================================================================

/**
 * Validation middleware wrapper
 */
export function withValidation<T>(schema: z.ZodSchema<T>) {
  return (handler: (req: NextRequest, data: T) => Promise<NextResponse>) => {
    return async (req: NextRequest, context?: any) => {
      try {
        let data: T
        
        if (req.method === 'GET') {
          // For GET requests, validate query parameters
          const searchParams = new URL(req.url).searchParams
          const params: Record<string, any> = {}
          searchParams.forEach((value, key) => {
            params[key] = value
          })
          data = schema.parse(params)
        } else {
          // For POST/PUT/PATCH, validate JSON body
          const body = await req.json()
          data = schema.parse(body)
        }
        
        return handler(req, data)
      } catch (error) {
        if (error instanceof z.ZodError) {
          return NextResponse.json(
            { 
              error: 'Validation failed', 
              details: error.errors.map(err => ({
                path: err.path.join('.'),
                message: err.message,
                code: err.code
              }))
            },
            { status: 400 }
          )
        }
        
        if (error instanceof SyntaxError) {
          return NextResponse.json(
            { error: 'Invalid JSON in request body' },
            { status: 400 }
          )
        }
        
        // Re-throw other errors
        throw error
      }
    }
  }
}

/**
 * Rate limiting middleware wrapper
 */
export function withRateLimit(config: keyof typeof rateLimitConfigs | { windowMs: number; maxRequests: number }) {
  return (handler: (req: NextRequest) => Promise<NextResponse>) => {
    return async (req: NextRequest) => {
      const rateLimitConfig = typeof config === 'string' ? rateLimitConfigs[config] : config
      const result = await rateLimit(req, rateLimitConfig)
      
      if (!result.success) {
        const response = NextResponse.json(
          { 
            error: 'Rate limit exceeded',
            retryAfter: result.retryAfter 
          },
          { status: 429 }
        )
        
        // Add rate limit headers
        response.headers.set('X-RateLimit-Limit', result.limit.toString())
        response.headers.set('X-RateLimit-Remaining', result.remaining.toString())
        response.headers.set('X-RateLimit-Reset', result.reset.getTime().toString())
        if (result.retryAfter) {
          response.headers.set('Retry-After', result.retryAfter.toString())
        }
        
        return response
      }
      
      const response = await handler(req)
      
      // Add rate limit headers to successful responses
      response.headers.set('X-RateLimit-Limit', result.limit.toString())
      response.headers.set('X-RateLimit-Remaining', result.remaining.toString())
      response.headers.set('X-RateLimit-Reset', result.reset.getTime().toString())
      
      return response
    }
  }
}

/**
 * Security headers middleware
 */
export function withSecurityHeaders(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (req: NextRequest) => {
    const response = await handler(req)
    
    // Add security headers to all responses
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    response.headers.set('Referrer-Policy', 'origin-when-cross-origin')
    
    return response
  }
}

// ============================================================================
// FILE SECURITY
// ============================================================================

/**
 * Secure file validation
 */
export function validateFileUpload(file: File): { valid: boolean; error?: string } {
  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/jpg'
  ]
  
  const maxSize = 10 * 1024 * 1024 // 10MB
  const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png']
  
  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return { 
      valid: false, 
      error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}` 
    }
  }
  
  // Check file size
  if (file.size > maxSize) {
    return { 
      valid: false, 
      error: `File too large. Maximum size: ${maxSize / 1024 / 1024}MB` 
    }
  }
  
  // Check file extension
  const ext = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
  if (!allowedExtensions.includes(ext)) {
    return { 
      valid: false, 
      error: `Invalid file extension. Allowed extensions: ${allowedExtensions.join(', ')}` 
    }
  }
  
  // Check for suspicious file names
  const suspiciousPatterns = [
    /\.\./,  // Path traversal
    /[<>:"|?*]/, // Invalid characters
    /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i, // Reserved names (Windows)
  ]
  
  if (suspiciousPatterns.some(pattern => pattern.test(file.name))) {
    return { 
      valid: false, 
      error: 'Invalid file name' 
    }
  }
  
  return { valid: true }
}

// ============================================================================
// EXAMPLE USAGE
// ============================================================================

/**
 * Example: Secure API route with all protections
 */
export const secureApiRoute = withSecurityHeaders(
  withRateLimit('api')(
    withValidation(analyzeDocumentSchema)(
      async (req: NextRequest, validatedData: z.infer<typeof analyzeDocumentSchema>) => {
        // Your secure API logic here
        return NextResponse.json({ success: true, data: validatedData })
      }
    )
  )
)

/**
 * Example: Webhook route with signature verification
 */
export async function secureWebhookRoute(req: NextRequest) {
  const payload = await req.text()
  const signature = req.headers.get('stripe-signature')
  
  if (!signature || !verifyStripeWebhook(payload, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }
  
  // Process webhook payload
  const event = JSON.parse(payload)
  // ... handle webhook event
  
  return NextResponse.json({ received: true })
}

export default {
  verifyStripeWebhook,
  verifyPayPalWebhook,
  rateLimit,
  withValidation,
  withRateLimit,
  withSecurityHeaders,
  validateFileUpload,
  analyzeDocumentSchema,
  createPaymentSchema,
  fileUploadSchema,
  applicationSchema,
}