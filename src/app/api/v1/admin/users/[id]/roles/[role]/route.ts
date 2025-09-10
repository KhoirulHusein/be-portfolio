import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'
import { applyCORS, setCORSHeaders, revokeRole, NotFoundError } from '@/lib/auth'
import { ok, methodNotAllowed } from '@/lib/utils'
import { withAuth } from '@/middleware/require-auth'

export const runtime = 'nodejs'

export type RevokeRoleParams = { params: Promise<{ id: string; role: string }> }

async function revokeRoleFromUser(req: NextRequest, { params }: RevokeRoleParams): Promise<NextResponse> {
  // Handle CORS
  const corsResponse = applyCORS(req)
  if (corsResponse) return corsResponse

  const { id: userId, role: roleName } = await params

  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { id: userId }
  })

  if (!user) {
    throw new NotFoundError('User')
  }

  // Prevent removing USER role (default role)
  if (roleName === 'USER') {
    const response = NextResponse.json(
      {
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Cannot remove default USER role'
        }
      },
      { status: 403 }
    )
    return setCORSHeaders(response, req.headers.get('origin'))
  }

  // Revoke role
  await revokeRole(userId, roleName)

  const response = ok({
    message: `Role ${roleName} revoked from user ${user.username}`,
    userId: user.id,
    roleName
  })

  return setCORSHeaders(response, req.headers.get('origin'))
}

// Wrap with permission requirement
export const DELETE = withAuth(revokeRoleFromUser, { permissions: ['role:revoke'] })

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

export async function PUT(): Promise<NextResponse> {
  return methodNotAllowed()
}
