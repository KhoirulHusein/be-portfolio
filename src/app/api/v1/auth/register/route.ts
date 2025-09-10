import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'
import {
  applyCORS,
  setCORSHeaders,
  hashPassword,
  UserExistsError,
  assignRole,
} from '@/lib/auth'
import { handleError, created, methodNotAllowed } from '@/lib/utils'
import { validateRegister } from '@/lib/validators'
import { getClientIP } from '@/middleware/auth-middleware'

export const runtime = 'nodejs'

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // Handle CORS
    const corsResponse = applyCORS(req)
    if (corsResponse) return corsResponse

    const body = await req.json()
    const { email, username, password } = validateRegister(body)

    // Check if user already exists (email or username)
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username }
        ]
      }
    })

    if (existingUser) {
      if (existingUser.email === email) {
        throw new UserExistsError('email')
      } else {
        throw new UserExistsError('username')
      }
    }

    // Hash password
    const passwordHash = await hashPassword(password)

    // Create user (with try-catch for race conditions)
    try {
      const user = await prisma.user.create({
        data: {
          email,
          username,
          passwordHash
        },
        select: {
          id: true,
          email: true,
          username: true,
          createdAt: true
        }
      })

      // Auto-assign USER role to new user
      await assignRole(user.id, 'USER')

      const response = created(user)
      return setCORSHeaders(response, req.headers.get('origin'))
    } catch (error: any) {
      // Handle Prisma unique constraint violations (race conditions)
      if (error.code === 'P2002') {
        const target = error.meta?.target
        if (target?.includes('email')) {
          throw new UserExistsError('email')
        } else if (target?.includes('username')) {
          throw new UserExistsError('username')
        }
      }
      throw error // Re-throw other errors
    }
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
