import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'
import {
  applyCORS,
  setCORSHeaders,
  comparePassword,
  hashPassword,
  InvalidCredentialsError,
} from '@/lib/auth'
import { handleError, ok, methodNotAllowed } from '@/lib/utils'
import { validateChangePassword } from '@/lib/validators'
import { extractUserFromToken } from '@/middleware/auth-middleware'

export const runtime = 'nodejs'

export async function PUT(req: NextRequest): Promise<NextResponse> {
  try {
    // Handle CORS
    const corsResponse = applyCORS(req)
    if (corsResponse) return corsResponse

    const payload = await extractUserFromToken(req)
    const body = await req.json()
    const { currentPassword, newPassword } = validateChangePassword(body)

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: payload.sub }
    })

    if (!user) {
      throw new InvalidCredentialsError()
    }

    // Verify current password
    const isValidPassword = await comparePassword(currentPassword, user.passwordHash)
    if (!isValidPassword) {
      throw new InvalidCredentialsError()
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword)

    // Update password and revoke all refresh tokens for security
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: newPasswordHash }
      }),
      prisma.refreshToken.updateMany({
        where: { userId: user.id },
        data: { revoked: true }
      })
    ])

    const response = ok({ message: 'Password changed successfully' })
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

export async function POST(): Promise<NextResponse> {
  return methodNotAllowed()
}

export async function DELETE(): Promise<NextResponse> {
  return methodNotAllowed()
}
