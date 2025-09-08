import { NextRequest, NextResponse } from 'next/server'
import { applyCORS, setCORSHeaders } from '../../../../../lib/auth/cors'
import { handleError, ok, methodNotAllowed } from '../../../../../lib/utils/response'
import { validateLogin } from '../../../../../lib/utils/validators/auth'
import { comparePassword } from '../../../../../lib/auth/password'
import { signAccessToken, generateRefreshToken, getRefreshTokenExpiry } from '../../../../../lib/auth/jwt'
import { prisma } from '../../../../../lib/prisma'
import { InvalidCredentialsError } from '../../../../../lib/auth/errors'
import { getClientIP } from '../../../../../middleware/auth-middleware'
import { checkLoginRateLimit } from '../../../../../lib/auth/rate-limit'

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // Handle CORS
    const corsResponse = applyCORS(req)
    if (corsResponse) return corsResponse

    const clientIP = getClientIP(req)
    checkLoginRateLimit(clientIP)

    const body = await req.json()
    const { emailOrUsername, password } = validateLogin(body)

    // Find user by email or username
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: emailOrUsername },
          { username: emailOrUsername }
        ]
      }
    })

    if (!user) {
      throw new InvalidCredentialsError()
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.passwordHash)
    if (!isValidPassword) {
      throw new InvalidCredentialsError()
    }

    // Generate tokens
    const accessToken = signAccessToken({
      sub: user.id,
      username: user.username,
      email: user.email
    })

    const refreshToken = generateRefreshToken()
    const expiresAt = getRefreshTokenExpiry()

    // Store refresh token
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt
      }
    })

    const responseData = {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username
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
