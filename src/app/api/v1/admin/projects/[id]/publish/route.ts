import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ok, error, handleError } from '@/lib/utils/response'
import { setCORSHeaders, createCORSHeaders } from '@/lib/auth/cors'
import { validatePublishProject } from '@/lib/utils/validators/project'
import { getAuthUserOrThrow } from '@/middleware/auth-middleware'
import { userHasPermission } from '@/lib/auth/rbac'

export const runtime = 'nodejs'

/**
 * PATCH /api/v1/admin/projects/[id]/publish - Toggle publish status of project
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const origin = request.headers.get('origin')
    
    // Check authentication
    const user = await getAuthUserOrThrow(request)
    
    // Check permission
    const hasPermission = await userHasPermission(user.id, 'project:publish')
    if (!hasPermission) {
      const corsHeaders = createCORSHeaders(origin)
      const response = error('Access denied. Required permission: project:publish', 'FORBIDDEN', 403, corsHeaders)
      return response
    }

    const { id } = await params

    if (!id) {
      const corsHeaders = createCORSHeaders(origin)
      const response = error('Project ID is required', 'VALIDATION_ERROR', 400, corsHeaders)
      return response
    }

    // Check if project exists
    const existingProject = await prisma.project.findUnique({
      where: { id },
    })

    if (!existingProject) {
      const corsHeaders = createCORSHeaders(origin)
      const response = error('Project not found', 'NOT_FOUND', 404, corsHeaders)
      return response
    }

    const body = await request.json()
    const validatedData = validatePublishProject(body)

    const project = await prisma.project.update({
      where: { id },
      data: {
        published: validatedData.published,
        updatedBy: user.id,
      },
    })

    const corsHeaders = createCORSHeaders(origin)
    const response = ok(project, 200, corsHeaders)
    return response

  } catch (err) {
    const origin = request.headers.get('origin')
    const corsHeaders = createCORSHeaders(origin)
    const response = handleError(err, corsHeaders)
    return response
  }
}

/**
 * OPTIONS /api/v1/admin/projects/[id]/publish - CORS preflight
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