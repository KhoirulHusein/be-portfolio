import { prisma } from '@/lib/prisma'
import { setCORSHeaders } from '@/lib/auth/cors'
import { ok, methodNotAllowed, error } from '@/lib/utils/response'
import { getAuthUserOrThrow } from '@/middleware/auth-middleware'
import { userHasPermission } from '@/lib/auth/rbac'

export const runtime = 'nodejs'

/**
 * GET /api/v1/admin/users - List all users (admin only)
 */
export async function GET(request: Request): Promise<Response> {
  try {
    // Check authentication
    const user = await getAuthUserOrThrow(request)
    
    // Check permission  
    const hasPermission = await userHasPermission(user.id, 'users:read')
    if (!hasPermission) {
      const response = error('Access denied. Required permission: users:read', 'FORBIDDEN', 403)
      setCORSHeaders(response, request.headers.get('origin'))
      return response
    }

    // Get query parameters for pagination
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1', 10)
    const limit = parseInt(url.searchParams.get('limit') || '10', 10)
    const skip = (page - 1) * limit

    // Get users with their roles
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          username: true,
          createdAt: true,
          updatedAt: true,
          roles: {
            include: {
              role: {
                select: {
                  name: true,
                  description: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.user.count()
    ])

    // Transform users data to include role names
    const formattedUsers = users.map(user => ({
      id: user.id,
      email: user.email,
      username: user.username,
      roles: user.roles.map(ur => ur.role.name),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }))

    const response = ok({
      users: formattedUsers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

    setCORSHeaders(response, request.headers.get('origin'))
    return response

  } catch (err) {
    const response = error('Internal server error', 'INTERNAL_ERROR', 500)
    setCORSHeaders(response, request.headers.get('origin'))
    return response
  }
}

/**
 * OPTIONS /api/v1/admin/users - Handle CORS preflight
 */
export async function OPTIONS(request: Request): Promise<Response> {
  return new Response(null, { 
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Allow-Credentials': 'true'
    }
  })
}

/**
 * Handle unsupported methods
 */
export async function POST(): Promise<Response> {
  return methodNotAllowed()
}

export async function PUT(): Promise<Response> {
  return methodNotAllowed()
}

export async function DELETE(): Promise<Response> {
  return methodNotAllowed()
}
