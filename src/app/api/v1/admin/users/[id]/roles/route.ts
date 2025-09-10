import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'
import { applyCORS, setCORSHeaders, assignRole, NotFoundError } from '@/lib/auth'
import { ok, methodNotAllowed, handleError } from '@/lib/utils'
import { withAuth } from '@/middleware/require-auth'

export const runtime = 'nodejs'

export type AssignRoleParams = { params: Promise<{ id: string }> }

async function assignRoleToUser(req: NextRequest, { params }: AssignRoleParams): Promise<NextResponse> {
  // Handle CORS
  const corsResponse = applyCORS(req)
  if (corsResponse) return corsResponse

  const { id: userId } = await params
  const body = await req.json()
  const { roleName } = body

  if (!roleName || typeof roleName !== 'string') {
    const response = NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Role name is required'
        }
      },
      { status: 400 }
    )
    return setCORSHeaders(response, req.headers.get('origin'))
  }

  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { id: userId }
  })

  if (!user) {
    throw new NotFoundError('User')
  }

  // Check if role exists
  const role = await prisma.role.findUnique({
    where: { name: roleName }
  })

  if (!role) {
    throw new NotFoundError('Role')
  }

  // Assign role
  await assignRole(userId, roleName)

  const response = ok({
    message: `Role ${roleName} assigned to user ${user.username}`,
    userId: user.id,
    roleName
  })

  return setCORSHeaders(response, req.headers.get('origin'))
}

// Wrap with permission requirement
export const POST = withAuth(assignRoleToUser, { permissions: ['role:assign'] })

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
