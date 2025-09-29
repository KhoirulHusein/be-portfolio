import { NextRequest, NextResponse } from 'next/server'

const ALLOWED_ORIGINS = process.env.CORS_ORIGINS?.split(',') || ['*']
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:3000'

export function applyCORS(req: NextRequest): NextResponse | null {
  const origin = req.headers.get('origin')
  const method = req.method

  // Handle preflight OPTIONS requests
  if (method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 200 })
    
    // For auth routes, use specific frontend origin for credentials support
    const isAuthRoute = req.url.includes('/auth/')
    const allowedOrigin = isAuthRoute ? FRONTEND_ORIGIN : (
      ALLOWED_ORIGINS.includes('*') || !origin || ALLOWED_ORIGINS.includes(origin) ? (origin || '*') : null
    )
    
    if (allowedOrigin) {
      response.headers.set('Access-Control-Allow-Origin', allowedOrigin)
      response.headers.set('Access-Control-Allow-Credentials', 'true')
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
      response.headers.set('Access-Control-Max-Age', '86400')
    }
    
    return response
  }

  return null
}

export function setCORSHeaders(response: NextResponse, origin?: string | null, isAuthRoute: boolean = false): NextResponse {
  // For auth routes, always use specific frontend origin for credentials support
  const allowedOrigin = isAuthRoute ? FRONTEND_ORIGIN : (
    ALLOWED_ORIGINS.includes('*') || !origin || ALLOWED_ORIGINS.includes(origin) ? (origin || '*') : null
  )
  
  if (allowedOrigin) {
    response.headers.set('Access-Control-Allow-Origin', allowedOrigin)
    response.headers.set('Access-Control-Allow-Credentials', 'true')
    
    // Only set methods header if not already set (preserve endpoint-specific methods)
    if (!response.headers.get('Access-Control-Allow-Methods')) {
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    }
    
    if (!response.headers.get('Access-Control-Allow-Headers')) {
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
    }
  }
  
  return response
}

export function createCORSHeaders(origin?: string | null, isAuthRoute: boolean = false): Headers {
  const headers = new Headers()
  
  // For auth routes, always use specific frontend origin for credentials support
  const allowedOrigin = isAuthRoute ? FRONTEND_ORIGIN : (
    ALLOWED_ORIGINS.includes('*') || !origin || ALLOWED_ORIGINS.includes(origin) ? (origin || '*') : null
  )
  
  if (allowedOrigin) {
    headers.set('Access-Control-Allow-Origin', allowedOrigin)
    headers.set('Access-Control-Allow-Credentials', 'true')
  }
  
  return headers
}

/**
 * Create auth-specific CORS headers for session cookie support
 * Always uses FRONTEND_ORIGIN to ensure credentials work properly
 */
export function createAuthCORSHeaders(): Headers {
  const headers = new Headers()
  headers.set('Access-Control-Allow-Origin', FRONTEND_ORIGIN)
  headers.set('Access-Control-Allow-Credentials', 'true')
  headers.set('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  headers.set('Access-Control-Max-Age', '86400')
  
  return headers
}
