import { ok, error, handleError } from '@/lib/utils/response'
import { setCORSHeaders } from '@/lib/auth/cors'
import { getAuthUserOrThrow } from '@/middleware/auth-middleware'
import { userHasPermission } from '@/lib/auth/rbac'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * PATCH /api/v1/admin/about/[id]/publish - Toggle publish status
 */
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    // Await params first
    const { id } = await params

    // Check authentication
    const user = await getAuthUserOrThrow(request)
    
    // Check permission
    const hasPermission = await userHasPermission(user.id, 'about:update')
    if (!hasPermission) {
      const response = error('Insufficient permissions', 'FORBIDDEN', 403)
      setCORSHeaders(response, request.headers.get('origin'))
      return response
    }

    // Get current about entry
    const existingAbout = await prisma.about.findUnique({
      where: { id },
    })

    if (!existingAbout) {
      const response = error('About entry not found', 'NOT_FOUND', 404)
      setCORSHeaders(response, request.headers.get('origin'))
      return response
    }

    // Toggle published status
    const about = await prisma.$transaction(async (tx) => {
      // If we're publishing this entry, unpublish all others first
      if (!existingAbout.published) {
        await tx.about.updateMany({
          where: { 
            published: true,
            id: { not: id }
          },
          data: { published: false }
        })
      }

      // Update the target entry
      return await tx.about.update({
        where: { id },
        data: {
          published: !existingAbout.published,
          updatedBy: user.id,
        },
      })
    })

    const response = ok(about)
    setCORSHeaders(response, request.headers.get('origin'))
    return response

  } catch (error) {
    const response = handleError(error)
    setCORSHeaders(response, request.headers.get('origin'))
    return response
  }
}

/**
 * OPTIONS handler for CORS preflight
 */
export async function OPTIONS(request: Request) {
  try {
    const response = NextResponse.json(null, { status: 204 })
    setCORSHeaders(response, request.headers.get('origin'))
    return response
  } catch (error) {
    const response = handleError(error)
    setCORSHeaders(response, request.headers.get('origin'))
    return response
  }
}
