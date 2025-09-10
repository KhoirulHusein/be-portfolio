import { NextRequest } from 'next/server'

import { prisma } from '@/lib/prisma'
import { verifyAccessToken, UnauthorizedError } from '@/lib/auth'

import type { JWTPayload } from '@/lib/auth/jwt'

export interface AuthUser {
  id: string
  email: string
  username: string
}

export interface AuthenticatedRequest extends NextRequest {
  user: AuthUser
}

export async function extractUserFromToken(req: NextRequest): Promise<JWTPayload> {
  const authHeader = req.headers.get('authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('Missing or invalid authorization header')
  }

  const token = authHeader.substring(7) // Remove 'Bearer ' prefix
  
  try {
    const payload = verifyAccessToken(token)
    
    // Verify user still exists
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, username: true }
    })
    
    if (!user) {
      throw new UnauthorizedError('User not found')
    }
    
    return payload
  } catch (error) {
    if (error instanceof Error && error.name === 'TokenExpiredError') {
      throw new UnauthorizedError('Token has expired')
    }
    if (error instanceof Error && error.name === 'JsonWebTokenError') {
      throw new UnauthorizedError('Invalid token')
    }
    throw error
  }
}

/**
 * Extract user from standard Request object (for route handlers)
 * Throws UnauthorizedError if token is invalid/missing
 */
export async function getAuthUserOrThrow(req: Request): Promise<AuthUser> {
  const authHeader = req.headers.get('authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('Authorization required')
  }

  const token = authHeader.substring(7) // Remove 'Bearer ' prefix
  
  try {
    const payload = verifyAccessToken(token)
    
    // Verify user still exists
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, username: true }
    })
    
    if (!user) {
      throw new UnauthorizedError('User not found')
    }
    
    return {
      id: payload.sub,
      email: payload.email,
      username: payload.username
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'TokenExpiredError') {
      throw new UnauthorizedError('Token has expired')
    }
    if (error instanceof Error && error.name === 'JsonWebTokenError') {
      throw new UnauthorizedError('Invalid token')
    }
    throw error
  }
}

export function getClientIP(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for')
  const real = req.headers.get('x-real-ip')
  const ip = req.headers.get('x-client-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  return real || ip || '127.0.0.1'
}
