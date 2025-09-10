import { ok, error, noContent, handleError } from '@/lib/utils/response'
import { getAuthUserOrThrow } from '@/middleware/auth-middleware'
import { userHasPermission } from '@/lib/auth/rbac'
import { validateUpdateAbout } from '@/lib/utils/validators/about'
import { prisma } from '@/lib/prisma'
import { setCORSHeaders } from '@/lib/auth/cors'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * PUT /api/v1/admin/about/[id] - Update about entry
 */
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    // Await params first
    const { id } = await params

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
    const validatedData = validateUpdateAbout(body)

    // Check if about exists
    const existingAbout = await prisma.about.findUnique({
      where: { id },
    })

    if (!existingAbout) {
      const response = error('About entry not found', 'NOT_FOUND', 404)
      setCORSHeaders(response, request.headers.get('origin'))
      return response
    }

    // Update about
    const about = await prisma.about.update({
      where: { id },
      data: {
        ...validatedData,
        updatedBy: user.id,
      },
    })

    const response = ok(about)
    setCORSHeaders(response, request.headers.get('origin'))
    return response

  } catch (err) {
    const response = handleError(err)
    setCORSHeaders(response, request.headers.get('origin'))
    return response
  }
}

/**
 * DELETE /api/v1/admin/about/[id] - Delete about entry
 */
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    // Await params first
    const { id } = await params

    // Check authentication
    const user = await getAuthUserOrThrow(request)
    
    // Check permission
    const hasPermission = await userHasPermission(user.id, 'about:delete')
    if (!hasPermission) {
      const response = error('Access denied. Required permission: about:delete', 'FORBIDDEN', 403)
      setCORSHeaders(response, request.headers.get('origin'))
      return response
    }

    // Check if about exists
    const existingAbout = await prisma.about.findUnique({
      where: { id },
    })

    if (!existingAbout) {
      const response = error('About entry not found', 'NOT_FOUND', 404)
      setCORSHeaders(response, request.headers.get('origin'))
      return response
    }

    // Delete about
    await prisma.about.delete({
      where: { id },
    })

    const response = noContent()
    setCORSHeaders(response, request.headers.get('origin'))
    return response

  } catch (err) {
    const response = handleError(err)
    setCORSHeaders(response, request.headers.get('origin'))
    return response
  }
}

/**
 * OPTIONS /api/v1/admin/about/[id] - Handle CORS preflight
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
