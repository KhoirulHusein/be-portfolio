import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ok, noContent, error, handleError } from '@/lib/utils/response'
import { setCORSHeaders } from '@/lib/auth/cors'
import { validateUpdateProject } from '@/lib/utils/validators/project'
import { getAuthUserOrThrow } from '@/middleware/auth-middleware'
import { userHasPermission } from '@/lib/auth/rbac'

export const runtime = 'nodejs'

/**
 * GET /api/v1/admin/projects/[id] - Get project by ID for admin
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    console.log('🔍 [GET /api/v1/admin/projects/[id]] Starting request processing', {
      method: 'GET',
      path: `/api/v1/admin/projects/${id}`,
      projectId: id,
      origin: request.headers.get('origin'),
      timestamp: new Date().toISOString()
    })

    // Check authentication
    const user = await getAuthUserOrThrow(request)
    
    console.log('👤 [GET /api/v1/admin/projects/[id]] User authenticated', {
      userId: user.id,
      projectId: id,
      timestamp: new Date().toISOString()
    })
    
    // Check permission
    const hasPermission = await userHasPermission(user.id, 'project:read')
    if (!hasPermission) {
      console.warn('🚫 [GET /api/v1/admin/projects/[id]] Permission denied', {
        userId: user.id,
        permission: 'project:read',
        projectId: id,
        timestamp: new Date().toISOString()
      })
      const response = error('Access denied. Required permission: project:read', 'FORBIDDEN', 403)
      setCORSHeaders(response, request.headers.get('origin'))
      return response
    }

    if (!id) {
      console.warn('⚠️ [GET /api/v1/admin/projects/[id]] Missing project ID')
      const response = error('Project ID is required', 'VALIDATION_ERROR', 400)
      setCORSHeaders(response, request.headers.get('origin'))
      return response
    }

    // Get project by ID (admin can see all, not just published)
    const project = await prisma.project.findUnique({
      where: { id },
    })

    if (!project) {
      const response = error('Project not found', 'NOT_FOUND', 404)
      setCORSHeaders(response, request.headers.get('origin'))
      return response
    }

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
 * PATCH /api/v1/admin/projects/[id] - Update project by ID
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
    const validatedData = validateUpdateProject(body)

    // Check for duplicate slug if slug is being updated
    if (validatedData.slug && validatedData.slug !== existingProject.slug) {
      const duplicateProject = await prisma.project.findUnique({
        where: { slug: validatedData.slug },
      })

      if (duplicateProject) {
        const response = error('Project with this slug already exists', 'VALIDATION_ERROR', 409)
        setCORSHeaders(response, request.headers.get('origin'))
        return response
      }
    }

    const project = await prisma.project.update({
      where: { id },
      data: {
        ...validatedData,
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
 * DELETE /api/v1/admin/projects/[id] - Delete project by ID
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const user = await getAuthUserOrThrow(request)
    
    // Check permission
    const hasPermission = await userHasPermission(user.id, 'project:delete')
    if (!hasPermission) {
      const response = error('Access denied. Required permission: project:delete', 'FORBIDDEN', 403)
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

    await prisma.project.delete({
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
 * OPTIONS /api/v1/admin/projects/[id] - CORS preflight
 */
export async function OPTIONS(request: Request) {
  const response = new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Methods': 'GET, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  })
  setCORSHeaders(response, request.headers.get('origin'))
  return response
}