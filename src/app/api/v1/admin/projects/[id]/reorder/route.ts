import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ok, error, handleError } from '@/lib/utils/response'
import { setCORSHeaders } from '@/lib/auth/cors'
import { validateReorderProject } from '@/lib/utils/validators/project'
import { getAuthUserOrThrow } from '@/middleware/auth-middleware'
import { userHasPermission } from '@/lib/auth/rbac'

export const runtime = 'nodejs'

/**
 * PATCH /api/v1/admin/projects/[id]/reorder - Set project order
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const user = await getAuthUserOrThrow(request)
    
    // Check permission
    const hasPermission = await userHasPermission(user.id, 'project:update')
    if (!hasPermission) {
      const response = error('Access denied. Required permission: project:update', 'FORBIDDEN', 403)
      setCORSHeaders(response, request.headers.get('origin'))
      return response
    }

    const { id } = await params

    if (!id) {
      const response = error('Project ID is required', 'VALIDATION_ERROR', 400)
      setCORSHeaders(response, request.headers.get('origin'))
      return response
    }

    // Check if project exists
    const existingProject = await prisma.project.findUnique({
      where: { id },
    })

    if (!existingProject) {
      const response = error('Project not found', 'NOT_FOUND', 404)
      setCORSHeaders(response, request.headers.get('origin'))
      return response
    }

    const body = await request.json()
    const validatedData = validateReorderProject(body)

    const project = await prisma.project.update({
      where: { id },
      data: {
        order: validatedData.order,
        updatedBy: user.id,
      },
    })

    const response = ok(project)
    setCORSHeaders(response, request.headers.get('origin'))
    return response

  } catch (err) {
    const response = handleError(err)
    setCORSHeaders(response, request.headers.get('origin'))
    return response
  }
}

/**
 * OPTIONS /api/v1/admin/projects/[id]/reorder - CORS preflight
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