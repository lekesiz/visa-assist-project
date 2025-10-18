import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Mock user object for authenticated requests
export const mockUser = {
  id: 'test-user-123',
  email: 'test@example.com',
  user_metadata: {
    full_name: 'Test User'
  },
  aud: 'authenticated',
  role: 'authenticated',
  created_at: '2024-01-01T00:00:00.000Z'
}

// Mock Supabase client factory
export function createMockSupabaseClient(overrides = {}) {
  const mockClient: any = {
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: mockUser }, error: null })
    }
  }

  // Create chainable query builder
  const queryBuilder: any = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
    gt: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    is: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
    upsert: jest.fn().mockResolvedValue({ data: null, error: null }),
    count: jest.fn().mockResolvedValue({ count: 0, error: null }),
    ...overrides
  }
  
  // Make insert() return a chainable object with select()
  queryBuilder.insert.mockImplementation(() => ({
    ...queryBuilder,
    select: jest.fn().mockReturnThis(),
    single: queryBuilder.single
  }))

  // Make from() return the query builder
  mockClient.from = jest.fn(() => queryBuilder)

  // Add all query methods to the main client too for direct access
  Object.assign(mockClient, queryBuilder)

  return mockClient
}

// Helper to create authenticated NextRequest
export function createAuthenticatedRequest(
  url: string,
  options: RequestInit = {},
  user = mockUser
) {
  const headers = new Headers(options.headers || {})
  headers.set('Authorization', `Bearer mock-token-${user.id}`)
  
  return new NextRequest(url, {
    ...options,
    headers
  })
}

// Helper to create request with JSON body
export function createRequestWithBody(
  url: string,
  body: any,
  options: RequestInit = {}
) {
  return new NextRequest(url, {
    ...options,
    method: options.method || 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    body: JSON.stringify(body)
  })
}

// Mock environment variables
export function mockEnvironment(vars: Record<string, string>) {
  const originalEnv = process.env
  
  beforeEach(() => {
    process.env = { ...originalEnv, ...vars }
  })
  
  afterEach(() => {
    process.env = originalEnv
  })
  
  return originalEnv
}

// Helper to test error responses
export async function expectErrorResponse(
  response: Response,
  expectedStatus: number,
  expectedMessage?: string
) {
  expect(response.status).toBe(expectedStatus)
  
  const data = await response.json()
  expect(data.error).toBeDefined()
  
  if (expectedMessage) {
    expect(data.error).toContain(expectedMessage)
  }
}

// Helper to test success responses
export async function expectSuccessResponse(
  response: Response,
  expectedData?: any
) {
  expect(response.status).toBe(200)
  
  const data = await response.json()
  
  if (expectedData !== undefined) {
    expect(data).toMatchObject(expectedData)
  }
  
  return data
}

// Mock file for file upload tests
export function createMockFile(
  content: string = 'test content',
  filename: string = 'test.pdf',
  type: string = 'application/pdf'
): File {
  const blob = new Blob([content], { type })
  const file = new File([blob], filename, { type })
  return file
}

// Helper to wait for async operations
export function waitFor(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Mock FormData for file upload tests
export function createMockFormData(fields: Record<string, any>): FormData {
  const formData = new FormData()
  
  Object.entries(fields).forEach(([key, value]) => {
    if (value instanceof File) {
      formData.append(key, value)
    } else {
      formData.append(key, String(value))
    }
  })
  
  return formData
}