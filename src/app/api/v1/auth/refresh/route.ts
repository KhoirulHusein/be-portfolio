import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'
import {
  applyCORS,
  setCORSHeaders,
  signAccessToken,
  generateRefreshToken,
  getRefreshTokenExpiry,
  UnauthorizedError,
  TokenRevokedError,
  checkRefreshRateLimit,
} from '@/lib/auth'
import { handleError, ok, methodNotAllowed } from '@/lib/utils'
import { validateRefresh } from '@/lib/validators'
import { getClientIP } from '@/middleware/auth-middleware'

export const runtime = 'nodejs'

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // Handle CORS
    const corsResponse = applyCORS(req)
    if (corsResponse) return corsResponse

    const clientIP = getClientIP(req)
    checkRefreshRateLimit(clientIP)

    const body = await req.json()
    const { refreshToken } = validateRefresh(body)

    // Find and validate refresh token
    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true }
    })

    if (!tokenRecord) {
      throw new UnauthorizedError('Invalid refresh token')
    }

    if (tokenRecord.revoked) {
      throw new TokenRevokedError()
    }

    if (new Date() > tokenRecord.expiresAt) {
      // Clean up expired token
      await prisma.refreshToken.delete({
        where: { id: tokenRecord.id }
      })
      throw new UnauthorizedError('Refresh token has expired')
    }

    // Generate new tokens
    const accessToken = signAccessToken({
      sub: tokenRecord.user.id,
      username: tokenRecord.user.username,
      email: tokenRecord.user.email
    })

    const newRefreshToken = generateRefreshToken()
    const expiresAt = getRefreshTokenExpiry()

    // Update database: revoke old token and create new one
    await prisma.$transaction([
      prisma.refreshToken.update({
        where: { id: tokenRecord.id },
        data: { revoked: true }
      }),
      prisma.refreshToken.create({
        data: {
          userId: tokenRecord.userId,
          token: newRefreshToken,
          expiresAt
        }
      })
    ])

    const responseData = {
      accessToken,
      refreshToken: newRefreshToken,
      user: {
        id: tokenRecord.user.id,
        email: tokenRecord.user.email,
        username: tokenRecord.user.username
      }
    }

    const response = ok(responseData)
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
