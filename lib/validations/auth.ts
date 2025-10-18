import { z } from 'zod'
import { emailSchema, passwordSchema, phoneSchema } from './common'

// User registration schema
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  phone: phoneSchema,
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: 'You must accept the terms and conditions',
  }),
  marketingConsent: z.boolean().default(false),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

// User login schema
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().default(false),
})

// Password reset request schema
export const resetPasswordRequestSchema = z.object({
  email: emailSchema,
})

// Password reset schema
export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

// Change password schema (for logged-in users)
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.newPassword !== data.currentPassword, {
  message: "New password must be different from current password",
  path: ['newPassword'],
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

// Update profile schema
export const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  phone: phoneSchema,
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  nationality: z.string().length(2).optional(),
  preferredLanguage: z.enum(['en', 'de', 'tr', 'fr']).optional(),
  bio: z.string().max(500).optional(),
})

// Email verification schema
export const verifyEmailSchema = z.object({
  token: z.string().min(1),
})

// Two-factor authentication schemas
export const enable2FASchema = z.object({
  password: z.string().min(1, 'Password is required for security'),
})

export const verify2FASchema = z.object({
  code: z.string().length(6, 'Code must be 6 digits').regex(/^\d+$/, 'Code must contain only numbers'),
})

// Session validation schema
export const sessionSchema = z.object({
  userId: z.string().uuid(),
  email: emailSchema,
  role: z.enum(['user', 'admin', 'consultant']),
  permissions: z.array(z.string()).optional(),
  expiresAt: z.string().datetime(),
})