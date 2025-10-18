import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string,
    public details?: any
  ) {
    super(message)
    this.name = 'AppError'
    Error.captureStackTrace(this, this.constructor)
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(400, message, 'VALIDATION_ERROR', details)
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(401, message, 'AUTHENTICATION_ERROR')
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(403, message, 'AUTHORIZATION_ERROR')
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(404, `${resource} not found`, 'NOT_FOUND')
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: any) {
    super(409, message, 'CONFLICT', details)
  }
}

export class RateLimitError extends AppError {
  constructor(retryAfter?: number) {
    super(429, 'Too many requests', 'RATE_LIMIT_EXCEEDED', { retryAfter })
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, originalError?: any) {
    super(502, `External service error: ${service}`, 'EXTERNAL_SERVICE_ERROR', originalError)
  }
}

// Global error handler for API routes
export function handleError(error: unknown) {
  console.error('API Error:', error)

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: 'Validation error',
        code: 'VALIDATION_ERROR',
        details: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      },
      { status: 400 }
    )
  }

  // Handle custom AppError instances
  if (error instanceof AppError) {
    const response: any = {
      error: error.message,
      code: error.code,
    }

    if (error.details) {
      response.details = error.details
    }

    const headers: any = {}
    
    // Add retry-after header for rate limit errors
    if (error instanceof RateLimitError && error.details?.retryAfter) {
      headers['Retry-After'] = String(error.details.retryAfter)
    }

    return NextResponse.json(response, { 
      status: error.statusCode,
      headers 
    })
  }

  // Handle Supabase errors
  if (error && typeof error === 'object' && 'code' in error) {
    const supabaseError = error as any
    
    // Map common Supabase errors
    if (supabaseError.code === 'PGRST116') {
      return NextResponse.json(
        { error: 'Resource not found', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }
    
    if (supabaseError.code === '23505') {
      return NextResponse.json(
        { error: 'Resource already exists', code: 'CONFLICT' },
        { status: 409 }
      )
    }
  }

  // Handle generic errors
  const message = error instanceof Error ? error.message : 'Internal server error'
  
  // Don't expose internal error details in production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        code: 'INTERNAL_SERVER_ERROR' 
      },
      { status: 500 }
    )
  }

  // In development, include more details
  return NextResponse.json(
    { 
      error: message,
      code: 'INTERNAL_SERVER_ERROR',
      stack: error instanceof Error ? error.stack : undefined
    },
    { status: 500 }
  )
}

// Wrapper for async API route handlers
export function withErrorHandler<T extends any[], R>(
  handler: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R | NextResponse> => {
    try {
      return await handler(...args)
    } catch (error) {
      return handleError(error) as any
    }
  }
}

// Helper to extract user from request headers (set by middleware)
export function getUserFromHeaders(headers: Headers) {
  const userId = headers.get('x-user-id')
  const userEmail = headers.get('x-user-email')
  
  if (!userId) {
    throw new AuthenticationError()
  }
  
  return { id: userId, email: userEmail }
}