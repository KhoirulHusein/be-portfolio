import { NextRequest, NextResponse } from 'next/server'
import { applyCORS, setCORSHeaders } from '../../../../../lib/auth/cors'
import { handleError, created, methodNotAllowed } from '../../../../../lib/utils/response'
import { validateRegister } from '../../../../../lib/utils/validators/auth'
import { hashPassword } from '../../../../../lib/auth/password'
import { prisma } from '../../../../../lib/prisma'
import { UserExistsError } from '../../../../../lib/auth/errors'
import { getClientIP } from '../../../../../middleware/auth-middleware'

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // Handle CORS
    const corsResponse = applyCORS(req)
    if (corsResponse) return corsResponse

    const body = await req.json()
    const { email, username, password } = validateRegister(body)

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        email
      }
    })

    if (existingUser) {
      throw new UserExistsError('email')
    }

    // Hash password
    const passwordHash = await hashPassword(password)

    // Create user
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

    const response = created(user)
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
