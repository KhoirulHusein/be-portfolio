import { prisma } from '@/lib/prisma'
import { ok, created, error, handleError } from '@/lib/utils/response'
import { setCORSHeaders } from '@/lib/auth/cors'
import { validateCreateProject } from '@/lib/utils/validators/project'
import { getAuthUserOrThrow } from '@/middleware/auth-middleware'
import { userHasPermission } from '@/lib/auth/rbac'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

/**
 * GET /api/v1/admin/projects - Get all projects for admin (published or draft)
 */
export async function GET(request: Request) {
  try {
    console.log('🔍 [GET /api/v1/admin/projects] Starting request processing', {
      method: 'GET',
      path: '/api/v1/admin/projects',
      origin: request.headers.get('origin'),
      timestamp: new Date().toISOString()
    })

    // Check authentication
    const user = await getAuthUserOrThrow(request)
    
    console.log('👤 [GET /api/v1/admin/projects] User authenticated', {
      userId: user.id,
      timestamp: new Date().toISOString()
    })
    
    // Check permission
    const hasPermission = await userHasPermission(user.id, 'project:read')
    if (!hasPermission) {
      console.warn('🚫 [GET /api/v1/admin/projects] Permission denied', {
        userId: user.id,
        permission: 'project:read',
        timestamp: new Date().toISOString()
      })
      const response = error('Access denied. Required permission: project:read', 'FORBIDDEN', 403)
      setCORSHeaders(response, request.headers.get('origin'))
      return response
    }

    const url = new URL(request.url)
    
    // Parse query parameters
    const page = parseInt(url.searchParams.get('page') || '1', 10)
    const pageSize = Math.min(parseInt(url.searchParams.get('pageSize') || '20', 10), 100) // Max 100 per page
    const sort = url.searchParams.get('sort') || 'updatedAt:desc'
    const title = url.searchParams.get('title')
    const status = url.searchParams.get('status')
    const published = url.searchParams.get('published')
    const featured = url.searchParams.get('featured')
    const tag = url.searchParams.get('tag')
    const tech = url.searchParams.get('tech')

    // Validate pagination
    if (page < 1 || pageSize < 1) {
      const response = error('Invalid pagination parameters', 'VALIDATION_ERROR', 400)
      setCORSHeaders(response, request.headers.get('origin'))
      return response
    }

    // Parse sort parameter
    const [sortField, sortOrder] = sort.split(':')
    const validSortFields = ['title', 'status', 'featured', 'order', 'startDate', 'endDate', 'createdAt', 'updatedAt']
    const validSortOrders = ['asc', 'desc']
    
    if (!validSortFields.includes(sortField) || !validSortOrders.includes(sortOrder || 'desc')) {
      const response = error('Invalid sort parameter', 'VALIDATION_ERROR', 400)
      setCORSHeaders(response, request.headers.get('origin'))
      return response
    }

    // Build where clause
    const where: any = {}

    // Search filters
    if (title) {
      where.title = { contains: title, mode: 'insensitive' }
    }

    if (status) {
      const validStatuses = ['ONGOING', 'COMPLETED', 'ARCHIVED']
      if (!validStatuses.includes(status)) {
        const response = error('Invalid status parameter', 'VALIDATION_ERROR', 400)
        setCORSHeaders(response, request.headers.get('origin'))
        return response
      }
      where.status = status
    }

    if (published === 'true') {
      where.published = true
    } else if (published === 'false') {
      where.published = false
    }

    if (featured === 'true') {
      where.featured = true
    } else if (featured === 'false') {
      where.featured = false
    }

    if (tag) {
      where.tags = { has: tag }
    }

    if (tech) {
      where.techStack = { has: tech }
    }

    // Build order by clause
    const orderBy: any = {}
    orderBy[sortField] = sortOrder

    // Calculate offset
    const skip = (page - 1) * pageSize

    // Get total count
    const total = await prisma.project.count({ where })

    // Get projects
    const projects = await prisma.project.findMany({
      where,
      orderBy,
      skip,
      take: pageSize,
      select: {
        id: true,
        title: true,
        slug: true,
        summary: true,
        coverImageUrl: true,
        repoUrl: true,
        liveUrl: true,
        videoUrl: true,
        techStack: true,
        tags: true,
        status: true,
        featured: true,
        order: true,
        startDate: true,
        endDate: true,
        published: true,
        createdBy: true,
        updatedBy: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    const response = ok({
      items: projects,
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    })
    
    setCORSHeaders(response, request.headers.get('origin'))
    return response

  } catch (err) {
    console.error('❌ [GET /api/v1/admin/projects] Error occurred:', {
      error: err instanceof Error ? err.message : 'Unknown error',
      errorName: err instanceof Error ? err.constructor.name : 'Unknown',
      stack: err instanceof Error ? err.stack?.split('\n').slice(0, 3).join('\n') : undefined,
      timestamp: new Date().toISOString()
    })
    const response = handleError(err)
    setCORSHeaders(response, request.headers.get('origin'))
    return response
  }
}

/**
 * POST /api/v1/admin/projects - Create new project
 */
export async function POST(request: Request) {
  try {
    console.log('🔍 [POST /api/v1/admin/projects] Starting request processing', {
      method: 'POST',
      path: '/api/v1/admin/projects',
      origin: request.headers.get('origin'),
      timestamp: new Date().toISOString()
    })

    // Check authentication
    const user = await getAuthUserOrThrow(request)
    
    console.log('👤 [POST /api/v1/admin/projects] User authenticated', {
      userId: user.id,
      timestamp: new Date().toISOString()
    })
    
    // Check permission
    const hasPermission = await userHasPermission(user.id, 'project:create')
    if (!hasPermission) {
      console.warn('🚫 [POST /api/v1/admin/projects] Permission denied', {
        userId: user.id,
        permission: 'project:create',
        timestamp: new Date().toISOString()
      })
      const response = error('Access denied. Required permission: project:create', 'FORBIDDEN', 403)
      setCORSHeaders(response, request.headers.get('origin'))
      return response
    }

    const body = await request.json()
    
    console.log('📝 [POST /api/v1/admin/projects] Request body received', {
      bodyKeys: Object.keys(body || {}),
      bodyLength: JSON.stringify(body || {}).length,
      timestamp: new Date().toISOString()
    })
    
    const validatedData = validateCreateProject(body)

    // Check for duplicate slug
    const existingProject = await prisma.project.findUnique({
      where: { slug: validatedData.slug },
    })

    if (existingProject) {
      const response = error('Project with this slug already exists', 'VALIDATION_ERROR', 409)
      setCORSHeaders(response, request.headers.get('origin'))
      return response
    }

    const project = await prisma.project.create({
      data: {
        ...validatedData,
        createdBy: user.id,
        updatedBy: user.id,
      },
    })

    const response = created(project)
    setCORSHeaders(response, request.headers.get('origin'))
    return response

  } catch (err) {
    console.error('❌ [POST /api/v1/admin/projects] Error occurred:', {
      error: err instanceof Error ? err.message : 'Unknown error',
      errorName: err instanceof Error ? err.constructor.name : 'Unknown',
      stack: err instanceof Error ? err.stack?.split('\n').slice(0, 3).join('\n') : undefined,
      timestamp: new Date().toISOString()
    })
    const response = handleError(err)
    setCORSHeaders(response, request.headers.get('origin'))
    return response
  }
}

/**
 * OPTIONS /api/v1/admin/projects - CORS preflight
 */
export async function OPTIONS(request: Request) {
  const response = new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  })
  setCORSHeaders(response, request.headers.get('origin'))
  return response
}