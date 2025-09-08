import { NextRequest, NextResponse } from 'next/server'
import { applyCORS, setCORSHeaders } from '../../../../lib/auth/cors'
import { handleError, ok, methodNotAllowed } from '../../../../lib/utils/response'

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    // Handle CORS
    const corsResponse = applyCORS(req)
    if (corsResponse) return corsResponse

    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0'
    }

    const response = ok(health)
    return setCORSHeaders(response, req.headers.get('origin'))
  } catch (error) {
    const errorResponse = handleError(error)
    return setCORSHeaders(errorResponse, req.headers.get('origin'))
  }
}

export async function OPTIONS(req: NextRequest): Promise<NextResponse> {
  const corsResponse = applyCORS(req)
  return corsResponse || new NextResponse(null, { status: 200 })
}

// Handle unsupported methods
export async function POST(): Promise<NextResponse> {
  return methodNotAllowed()
}

export async function PUT(): Promise<NextResponse> {
  return methodNotAllowed()
}

export async function DELETE(): Promise<NextResponse> {
  return methodNotAllowed()
}
