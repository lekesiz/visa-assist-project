import { NextRequest, NextResponse } from 'next/server'
import { GET } from '@/app/api/health/route'
import { createClient } from '@/lib/supabase/server'

// Mock the Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn()
}))

describe('/api/health', () => {
  let mockSupabaseClient: any
  let originalEnv: NodeJS.ProcessEnv

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks()
    
    // Save original environment
    originalEnv = process.env
    process.env = { ...originalEnv }
    // Set the npm_package_version to match package.json
    process.env.npm_package_version = '0.1.0'

    // Setup default mock behavior
    mockSupabaseClient = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null })
    }
    
    ;(createClient as jest.Mock).mockResolvedValue(mockSupabaseClient)
  })

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv
  })

  it('should return healthy status when all services are ok', async () => {
    const request = new NextRequest('http://localhost:3000/api/health')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.status).toBe('healthy')
    expect(data.checks).toMatchObject({
      server: 'ok',
      database: 'ok',
      redis: 'not_configured',
      timestamp: expect.any(String),
      version: '0.1.0'
    })
  })

  it('should return unhealthy status when database is down', async () => {
    // Mock database error
    mockSupabaseClient.maybeSingle.mockResolvedValue({
      data: null,
      error: new Error('Database connection failed')
    })

    const request = new NextRequest('http://localhost:3000/api/health')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(503)
    expect(data.status).toBe('unhealthy')
    expect(data.checks.database).toBe('error')
  })

  it('should handle database connection exceptions', async () => {
    // Mock createClient to throw an error
    ;(createClient as jest.Mock).mockRejectedValue(new Error('Failed to create client'))

    const request = new NextRequest('http://localhost:3000/api/health')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(503)
    expect(data.status).toBe('unhealthy')
    expect(data.checks.database).toBe('error')
  })

  it('should check Redis when REDIS_URL is configured', async () => {
    // Set Redis URL
    process.env.REDIS_URL = 'redis://localhost:6379'

    const request = new NextRequest('http://localhost:3000/api/health')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.status).toBe('healthy')
    expect(data.checks.redis).toBe('ok')
  })

  it('should include version from environment or default', async () => {
    // Test with environment variable
    process.env.npm_package_version = '2.0.0'

    const request = new NextRequest('http://localhost:3000/api/health')
    const response = await GET(request)
    const data = await response.json()

    expect(data.checks.version).toBe('2.0.0')

    // Test without environment variable
    delete process.env.npm_package_version

    const response2 = await GET(request)
    const data2 = await response2.json()

    expect(data2.checks.version).toBe('1.0.0')
  })

  it('should include timestamp in ISO format', async () => {
    const request = new NextRequest('http://localhost:3000/api/health')
    const response = await GET(request)
    const data = await response.json()

    // Check if timestamp is valid ISO string
    const timestamp = new Date(data.checks.timestamp)
    expect(timestamp.toISOString()).toBe(data.checks.timestamp)
  })

  it('should return proper status codes', async () => {
    // Test healthy scenario
    const request = new NextRequest('http://localhost:3000/api/health')
    const response = await GET(request)
    
    expect(response.status).toBe(200)
    expect(response instanceof NextResponse).toBe(true)

    // Test unhealthy scenario
    mockSupabaseClient.maybeSingle.mockResolvedValue({
      data: null,
      error: new Error('Database error')
    })

    const response2 = await GET(request)
    expect(response2.status).toBe(503)
  })
})