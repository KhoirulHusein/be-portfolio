import { NextRequest, NextResponse } from 'next/server'

const ALLOWED_ORIGINS = process.env.CORS_ORIGINS?.split(',') || ['*']

export function applyCORS(req: NextRequest): NextResponse | null {
  const origin = req.headers.get('origin')
  const method = req.method

  // Handle preflight OPTIONS requests
  if (method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 200 })
    
    if (ALLOWED_ORIGINS.includes('*') || !origin || ALLOWED_ORIGINS.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin || '*')
      response.headers.set('Access-Control-Allow-Credentials', 'true')
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
      response.headers.set('Access-Control-Max-Age', '86400')
    }
    
    return response
  }

  return null
}

export function setCORSHeaders(response: NextResponse, origin?: string | null): NextResponse {
  if (ALLOWED_ORIGINS.includes('*') || !origin || ALLOWED_ORIGINS.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin || '*')
    response.headers.set('Access-Control-Allow-Credentials', 'true')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
  }
  
  return response
}
