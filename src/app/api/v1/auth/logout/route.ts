import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'
import { applyCORS, setCORSHeaders } from '@/lib/auth'
import { handleError, ok, methodNotAllowed } from '@/lib/utils'
import { validateRefresh } from '@/lib/validators'

export const runtime = 'nodejs'

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // Handle CORS
    const corsResponse = applyCORS(req)
    if (corsResponse) return corsResponse

    const body = await req.json()
    const { refreshToken } = validateRefresh(body)

    // Find and revoke refresh token
    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { token: refreshToken }
    })

    // Return 401 if token doesn't exist or is already revoked
    if (!tokenRecord || tokenRecord.revoked) {
      const response = NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Invalid or revoked refresh token'
          }
        },
        { status: 401 }
      )
      return setCORSHeaders(response, req.headers.get('origin'))
    }

    // Revoke the token
    await prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: { revoked: true }
    })

    // Return success
    const response = ok({ message: 'Logged out successfully' })
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
export async function GET(): Promise<NextResponse> {
  return methodNotAllowed()
}

export async function PUT(): Promise<NextResponse> {
  return methodNotAllowed()
}

export async function DELETE(): Promise<NextResponse> {
  return methodNotAllowed()
}
