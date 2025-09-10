import { NextRequest, NextResponse } from 'next/server'
import { extractUserFromToken } from '@/middleware/auth-middleware'
import { userHasPermission } from '@/lib/auth/rbac'
import { generateErrorResponse } from '@/lib/utils/response'

export interface AuthResult {
  user: {
    id: string
    sub: string
  }
}

export interface AuthErrorResult {
  error: true
  response: NextResponse
}

/**
 * Require authentication and permission for a request
 */
export async function requireAuth(request: NextRequest, permission?: string): Promise<AuthResult | AuthErrorResult> {
  try {
    // Extract user from JWT token
    const payload = await extractUserFromToken(request)
    const userId = payload.sub

    // Check permission if specified (with admin bypass)
    if (permission) {
      const hasRequiredPermission = await userHasPermission(userId, permission)
      if (!hasRequiredPermission) {
        return {
          error: true,
          response: generateErrorResponse([`Access denied. Required permission: ${permission}`], 403)
        }
      }
    }

    return {
      user: {
        id: userId,
        sub: payload.sub,
      },
    }

  } catch (err) {
    if (err instanceof Error && err.message.includes('authorization')) {
      return {
        error: true,
        response: generateErrorResponse(['Missing or invalid authorization header'], 401)
      }
    }
    return {
      error: true,
      response: generateErrorResponse(['Authentication failed'], 401)
    }
  }
}
