import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ok, error, handleError } from '@/lib/utils/response'
import { setCORSHeaders } from '@/lib/auth/cors'
import { validatePublishExperience } from '@/lib/utils/validators/experience'
import { getAuthUserOrThrow } from '@/middleware/auth-middleware'
import { userHasPermission } from '@/lib/auth/rbac'

export const runtime = 'nodejs'

/**
 * PATCH /api/v1/admin/experiences/[id]/publish - Toggle publish status of experience
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const user = await getAuthUserOrThrow(request)
    
    // Check permission
    const hasPermission = await userHasPermission(user.id, 'experience:publish')
    if (!hasPermission) {
      const response = error('Access denied. Required permission: experience:publish', 'FORBIDDEN', 403)
      setCORSHeaders(response, request.headers.get('origin'))
      return response
    }

    const { id } = await params

    if (!id) {
      const response = error('Experience ID is required', 'VALIDATION_ERROR', 400)
      setCORSHeaders(response, request.headers.get('origin'))
      return response
    }

    // Check if experience exists
    const existingExperience = await prisma.experience.findUnique({
      where: { id },
    })

    if (!existingExperience) {
      const response = error('Experience not found', 'NOT_FOUND', 404)
      setCORSHeaders(response, request.headers.get('origin'))
      return response
    }

    const body = await request.json()
    const validatedData = validatePublishExperience(body)

    const experience = await prisma.experience.update({
      where: { id },
      data: {
        published: validatedData.published,
        updatedBy: user.id,
      },
    })

    const response = ok(experience)
    setCORSHeaders(response, request.headers.get('origin'))
    return response

  } catch (err) {
    const response = handleError(err)
    setCORSHeaders(response, request.headers.get('origin'))
    return response
  }
}

/**
 * OPTIONS /api/v1/admin/experiences/[id]/publish - CORS preflight
 */
export async function OPTIONS(request: Request) {
  const response = new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Methods': 'PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  })
  setCORSHeaders(response, request.headers.get('origin'))
  return response
}
