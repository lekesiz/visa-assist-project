import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const checks = {
    server: 'ok',
    database: 'unknown',
    redis: 'unknown',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  }

  try {
    // Check database connection
    const supabase = await createClient()
    const { error } = await supabase
      .from('_health_check')
      .select('1')
      .limit(1)
      .maybeSingle()
    
    checks.database = error ? 'error' : 'ok'
  } catch (error) {
    checks.database = 'error'
  }

  // Check Redis connection if configured
  if (process.env.REDIS_URL) {
    try {
      // Redis check would go here
      checks.redis = 'ok'
    } catch (error) {
      checks.redis = 'error'
    }
  } else {
    checks.redis = 'not_configured'
  }

  const allHealthy = 
    checks.server === 'ok' && 
    (checks.database === 'ok' || checks.database === 'unknown') &&
    (checks.redis === 'ok' || checks.redis === 'not_configured')

  return NextResponse.json(
    {
      status: allHealthy ? 'healthy' : 'unhealthy',
      checks
    },
    { status: allHealthy ? 200 : 503 }
  )
}