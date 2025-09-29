import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'
import {
  applyCORS,
  setCORSHeaders,
  comparePassword,
  signAccessToken,
  generateRefreshToken,
  getRefreshTokenExpiry,
  InvalidCredentialsError,
  checkLoginRateLimit,
} from '@/lib/auth'
import { handleError, ok, methodNotAllowed } from '@/lib/utils'
import { validateLogin } from '@/lib/validators'
import { getClientIP } from '@/middleware/auth-middleware'
import { buildSessionCookie, getAppEnvironment } from '@/lib/utils/session-cookie'

export const runtime = 'nodejs'

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

    // Set session cookie (HttpOnly)
    const sessionCookie = buildSessionCookie(accessToken, getAppEnvironment())

    // Response data (don't include tokens in body)
    const responseData = {
      user: {
        id: user.id,
        email: user.email,
        username: user.username
      },
      message: 'Login successful'
    }

    const response = ok(responseData)
    // Set the session cookie
    response.cookies.set(sessionCookie)
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

export async function DELETE(): Promise<NextResponse> {
  return methodNotAllowed()
}
