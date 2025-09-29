import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'
import { applyCORS, setCORSHeaders } from '@/lib/auth'
import { handleError, methodNotAllowed } from '@/lib/utils'
import { extractUserFromToken } from '@/middleware/auth-middleware'
import { clearSessionCookie, getSessionCookieName, getAppEnvironment } from '@/lib/utils/session-cookie'

export const runtime = 'nodejs'

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // Handle CORS
    const corsResponse = applyCORS(req)
    if (corsResponse) return corsResponse

    // Try to get user from session cookie (optional - logout should work even if session invalid)
    let userId: string | null = null
    try {
      const payload = await extractUserFromToken(req)
      userId = payload.sub
    } catch {
      // Ignore error - user might already be logged out or session invalid
    }

    // Clear session cookie
    const clearCookie = clearSessionCookie(getAppEnvironment())

    // If we have a user ID, revoke all their refresh tokens for extra security
    if (userId) {
      await prisma.refreshToken.updateMany({
        where: { 
          userId: userId,
          revoked: false 
        },
        data: { revoked: true }
      })
    }

    // Return 204 No Content with cleared cookie
    const response = new NextResponse(null, { status: 204 })
    response.cookies.set(clearCookie)
    return setCORSHeaders(response, req.headers.get('origin'), true)
  } catch (error) {
    const errorResponse = handleError(error)
    return setCORSHeaders(errorResponse, req.headers.get('origin'), true)
  }
}

export async function OPTIONS(req: NextRequest): Promise<NextResponse> {
  const corsResponse = applyCORS(req)
  return corsResponse || new NextResponse(null, { status: 200 })
}

// Handle unsupported methods
export async function GET(): Promise<NextResponse> {
  return methodNotAllowed()
}

export async function PUT(): Promise<NextResponse> {
  return methodNotAllowed()
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  // Same logic as POST for logout
  return POST(req)
}
