import { NextRequest, NextResponse } from 'next/server'
import { applyCORS, setCORSHeaders } from '../../../../../lib/auth/cors'
import { handleError, ok, methodNotAllowed } from '../../../../../lib/utils/response'
import { extractUserFromToken } from '../../../../../middleware/auth-middleware'

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    // Handle CORS
    const corsResponse = applyCORS(req)
    if (corsResponse) return corsResponse

    const payload = await extractUserFromToken(req)
    
    const userData = {
      id: payload.sub,
      email: payload.email,
      username: payload.username
    }

    const response = ok(userData)
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
