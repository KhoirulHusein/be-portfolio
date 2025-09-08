import { NextRequest, NextResponse } from 'next/server'
import { applyCORS, setCORSHeaders } from '../../../../../lib/auth/cors'
import { handleError, ok, methodNotAllowed } from '../../../../../lib/utils/response'
import { validateRefresh } from '../../../../../lib/utils/validators/auth'
import { prisma } from '../../../../../lib/prisma'

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

    if (tokenRecord && !tokenRecord.revoked) {
      await prisma.refreshToken.update({
        where: { id: tokenRecord.id },
        data: { revoked: true }
      })
    }

    // Always return success for logout (idempotent)
    const response = ok({ success: true })
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
