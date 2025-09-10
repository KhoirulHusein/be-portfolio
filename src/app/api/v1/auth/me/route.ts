import { NextRequest, NextResponse } from 'next/server'

import { applyCORS, setCORSHeaders, getUserWithRoles } from '@/lib/auth'
import { handleError, ok, methodNotAllowed } from '@/lib/utils'
import { extractUserFromToken } from '@/middleware/auth-middleware'

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    // Handle CORS
    const corsResponse = applyCORS(req)
    if (corsResponse) return corsResponse

    const payload = await extractUserFromToken(req)
    
    // Get user with roles from database (real-time data)
    const user = await getUserWithRoles(payload.sub)
    
    if (!user) {
      const response = NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'User not found'
          }
        },
        { status: 404 }
      )
      return setCORSHeaders(response, req.headers.get('origin'))
    }

    const userData = {
      id: user.id,
      email: user.email,
      username: user.username,
      roles: user.roles,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
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
