import { prisma } from '@/lib/prisma'
import { ok, created, error, handleError } from '@/lib/utils/response'
import { setCORSHeaders } from '@/lib/auth/cors'
import { validateCreateAbout } from '@/lib/utils/validators/about'
import { getAuthUserOrThrow } from '@/middleware/auth-middleware'
import { userHasPermission } from '@/lib/auth/rbac'

export const runtime = 'nodejs'

/**
 * GET /api/v1/admin/about - Get about information for admin (published or draft)
 */
export async function GET(request: Request) {
  try {
    // Check authentication
    const user = await getAuthUserOrThrow(request)
    
    // Check permission
    const hasPermission = await userHasPermission(user.id, 'about:read')
    if (!hasPermission) {
      const response = error('Access denied. Required permission: about:read', 'FORBIDDEN', 403)
      setCORSHeaders(response, request.headers.get('origin'))
      return response
    }

    // Get all about entries for admin (regardless of published status)
    const aboutEntries = await prisma.about.findMany({
      orderBy: { updatedAt: 'desc' },
    })

    const response = ok({ about: aboutEntries })
    setCORSHeaders(response, request.headers.get('origin'))
    return response

  } catch (err) {
    const response = handleError(err)
    setCORSHeaders(response, request.headers.get('origin'))
    return response
  }
}

/**
 * POST /api/v1/admin/about - Create or update about information
 */
export async function POST(request: Request) {
  try {
    // Check authentication
    const user = await getAuthUserOrThrow(request)
    
    // Check permission
    const hasPermission = await userHasPermission(user.id, 'about:write')
    if (!hasPermission) {
      const response = error('Access denied. Required permission: about:write', 'FORBIDDEN', 403)
      setCORSHeaders(response, request.headers.get('origin'))
      return response
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = validateCreateAbout(body)

    // Check if about already exists
    const existingAbout = await prisma.about.findFirst({
      orderBy: { updatedAt: 'desc' },
    })

    let about
    if (existingAbout) {
      // Update existing
      about = await prisma.about.update({
        where: { id: existingAbout.id },
        data: {
          ...validatedData,
          updatedBy: user.id,
        },
      })
    } else {
      // Create new
      about = await prisma.about.create({
        data: {
          ...validatedData,
          createdBy: user.id,
          updatedBy: user.id,
        },
      })
    }

    const response = existingAbout ? ok(about) : created(about)
    setCORSHeaders(response, request.headers.get('origin'))
    return response

  } catch (err) {
    const response = handleError(err)
    setCORSHeaders(response, request.headers.get('origin'))
    return response
  }
}

/**
 * OPTIONS /api/v1/admin/about - Handle CORS preflight
 */
export async function OPTIONS(request: Request) {
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
