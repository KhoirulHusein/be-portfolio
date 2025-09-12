import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ok, noContent, error, handleError } from '@/lib/utils/response'
import { setCORSHeaders } from '@/lib/auth/cors'
import { validateUpdateExperience } from '@/lib/utils/validators/experience'
import { getAuthUserOrThrow } from '@/middleware/auth-middleware'
import { userHasPermission } from '@/lib/auth/rbac'

export const runtime = 'nodejs'

/**
 * GET /api/v1/admin/experiences/[id] - Get experience by ID for admin
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const user = await getAuthUserOrThrow(request)
    
    // Check permission
    const hasPermission = await userHasPermission(user.id, 'experience:read')
    if (!hasPermission) {
      const response = error('Access denied. Required permission: experience:read', 'FORBIDDEN', 403)
      setCORSHeaders(response, request.headers.get('origin'))
      return response
    }

    const { id } = await params

    if (!id) {
      const response = error('Experience ID is required', 'VALIDATION_ERROR', 400)
      setCORSHeaders(response, request.headers.get('origin'))
      return response
    }

    // Get experience by ID (admin can see all, not just published)
    const experience = await prisma.experience.findUnique({
      where: { id },
    })

    if (!experience) {
      const response = error('Experience not found', 'NOT_FOUND', 404)
      setCORSHeaders(response, request.headers.get('origin'))
      return response
    }

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
 * PUT /api/v1/admin/experiences/[id] - Update experience by ID
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const user = await getAuthUserOrThrow(request)
    
    // Check permission
    const hasPermission = await userHasPermission(user.id, 'experience:update')
    if (!hasPermission) {
      const response = error('Access denied. Required permission: experience:update', 'FORBIDDEN', 403)
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
    const validatedData = validateUpdateExperience(body)

    // Convert dates to Date objects if provided
    const updateData: any = {
      ...validatedData,
      updatedBy: user.id,
    }

    if (validatedData.startDate) {
      updateData.startDate = new Date(validatedData.startDate)
    }
    if (validatedData.endDate !== undefined) {
      updateData.endDate = validatedData.endDate ? new Date(validatedData.endDate) : null
    }

    const experience = await prisma.experience.update({
      where: { id },
      data: updateData,
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
 * DELETE /api/v1/admin/experiences/[id] - Delete experience by ID
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const user = await getAuthUserOrThrow(request)
    
    // Check permission
    const hasPermission = await userHasPermission(user.id, 'experience:delete')
    if (!hasPermission) {
      const response = error('Access denied. Required permission: experience:delete', 'FORBIDDEN', 403)
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

    await prisma.experience.delete({
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
 * OPTIONS /api/v1/admin/experiences/[id] - CORS preflight
 */
export async function OPTIONS(request: Request) {
  const response = new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  })
  setCORSHeaders(response, request.headers.get('origin'))
  return response
}
