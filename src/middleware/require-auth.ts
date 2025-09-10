import { NextRequest, NextResponse } from 'next/server'
import { extractUserFromToken } from '@/middleware/auth-middleware'
import { hasRole, hasPermission } from '@/lib/auth/rbac'
import { setCORSHeaders } from '@/lib/auth'
import { handleError } from '@/lib/utils'

interface AuthOptions {
  roles?: string[]
  permissions?: string[]
}

/**
 * Higher-order function for route handlers with RBAC
 */
export function withAuth<T extends any[]>(
  handler: (req: NextRequest, ...args: T) => Promise<NextResponse>,
  options?: AuthOptions
) {
  return async (req: NextRequest, ...args: T): Promise<NextResponse> => {
    try {
      // Skip auth for OPTIONS requests (CORS preflight)
      if (req.method === 'OPTIONS') {
        return await handler(req, ...args)
      }

      // Extract user from JWT token
      const payload = await extractUserFromToken(req)
      const userId = payload.sub

      // Check role requirements
      if (options?.roles && options.roles.length > 0) {
        const hasRequiredRole = await hasRole(userId, options.roles)
        if (!hasRequiredRole) {
          const response = NextResponse.json(
            {
              success: false,
              error: {
                code: 'FORBIDDEN',
                message: `Access denied. Required roles: ${options.roles.join(', ')}`
              }
            },
            { status: 403 }
          )
          return setCORSHeaders(response, req.headers.get('origin'))
        }
      }

      // Check permission requirements
      if (options?.permissions && options.permissions.length > 0) {
        const hasRequiredPermission = await hasPermission(userId, options.permissions)
        if (!hasRequiredPermission) {
          const response = NextResponse.json(
            {
              success: false,
              error: {
                code: 'PERMISSION_DENIED',
                message: `Access denied. Required permissions: ${options.permissions.join(', ')}`
              }
            },
            { status: 403 }
          )
          return setCORSHeaders(response, req.headers.get('origin'))
        }
      }

      // Set user context in headers for handler access
      req.headers.set('x-user-id', userId)
      req.headers.set('x-user-sub', payload.sub)

      // Call the original handler
      return await handler(req, ...args)
    } catch (error) {
      const errorResponse = handleError(error)
      return setCORSHeaders(errorResponse, req.headers.get('origin'))
    }
  }
}

/**
 * Extract user ID from request headers (set by withAuth)
 */
export function getUserIdFromRequest(req: NextRequest): string | null {
  return req.headers.get('x-user-id')
}
