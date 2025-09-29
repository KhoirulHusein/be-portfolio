import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

/**
 * GET /api/health - Health check endpoint with environment info
 */
export async function GET(request: NextRequest) {
  try {
    // Log startup info
    console.log('🏥 [HEALTH] Environment check:', {
      nodeEnv: process.env.NODE_ENV,
      databaseUrl: process.env.DATABASE_URL ? 
        process.env.DATABASE_URL.replace(/:[^:@]*@/, ':***@') : 'Not set',
      timestamp: new Date().toISOString()
    })

    // Test database connection
    const dbCheck = await prisma.$queryRaw`SELECT 1 as connected`
    
    // Test permissions table exists
    const permissionsCount = await prisma.permission.count()
    
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      database: {
        connected: Boolean(dbCheck),
        permissions: permissionsCount
      }
    }

    console.log('✅ [HEALTH] System healthy:', health)
    
    return NextResponse.json(health, { status: 200 })
    
  } catch (error) {
    console.error('❌ [HEALTH] System unhealthy:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    })
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}