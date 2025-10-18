import { z } from 'zod'

// Common validation schemas
export const emailSchema = z
  .string()
  .email('Invalid email format')
  .max(255, 'Email too long')

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(100, 'Password too long')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character')

export const phoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
  .optional()

export const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')

export const urlSchema = z
  .string()
  .url('Invalid URL format')
  .max(2048, 'URL too long')

export const uuidSchema = z
  .string()
  .uuid('Invalid UUID format')

export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

export const searchSchema = z.object({
  query: z.string().min(1).max(100),
  filters: z.record(z.string(), z.any()).optional(),
  ...paginationSchema.shape,
})

// File upload validation
export const fileUploadSchema = z.object({
  name: z.string().max(255),
  type: z.string().max(100),
  size: z.number().max(10 * 1024 * 1024), // 10MB max
})

export const allowedFileTypes = {
  documents: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
    'image/jpg',
  ],
  images: ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'],
}

// Address schema
export const addressSchema = z.object({
  street: z.string().min(1).max(255),
  city: z.string().min(1).max(100),
  state: z.string().min(1).max(100),
  postalCode: z.string().min(1).max(20),
  country: z.string().length(2, 'Country code must be 2 characters'),
})

// Money/currency schema
export const moneySchema = z.object({
  amount: z.number().positive(),
  currency: z.string().length(3, 'Currency code must be 3 characters'),
})

// Language proficiency
export const languageProficiencySchema = z.object({
  language: z.string().min(2).max(50),
  level: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'Native']),
  certification: z.string().optional(),
  certificationDate: dateSchema.optional(),
})

// Helper function to validate and parse request body
export async function validateRequestBody<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<T> {
  try {
    const body = await request.json()
    return schema.parse(body)
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new z.ZodError([{
        code: 'custom',
        message: 'Invalid JSON in request body',
        path: [],
      }])
    }
    throw error
  }
}

// Helper function to validate query params
export function validateQueryParams<T>(
  searchParams: URLSearchParams,
  schema: z.ZodSchema<T>
): T {
  const params: Record<string, any> = {}
  
  searchParams.forEach((value, key) => {
    // Handle array params (e.g., ?tags=a&tags=b)
    if (params[key]) {
      if (Array.isArray(params[key])) {
        params[key].push(value)
      } else {
        params[key] = [params[key], value]
      }
    } else {
      params[key] = value
    }
  })
  
  return schema.parse(params)
}