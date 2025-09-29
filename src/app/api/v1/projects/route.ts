import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ok, error } from '@/lib/utils/response'
import { applyCORS, setCORSHeaders } from '@/lib/auth/cors'

export const runtime = 'nodejs'

/**
 * GET /api/v1/projects - Public endpoint to get published projects
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [GET /api/v1/projects] Starting request processing', {
      method: 'GET',
      path: '/api/v1/projects',
      userAgent: request.headers.get('user-agent')?.slice(0, 50),
      origin: request.headers.get('origin'),
      timestamp: new Date().toISOString()
    })

    const url = new URL(request.url)
    
    // Parse query parameters
    const page = parseInt(url.searchParams.get('page') || '1', 10)
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '12', 10), 100) // Max 100 per page
    const sort = url.searchParams.get('sort') || '-updatedAt'
    const q = url.searchParams.get('q') // search query
    const tag = url.searchParams.get('tag') // single tag filter
    const tech = url.searchParams.get('tech') // single tech filter
    const status = url.searchParams.get('status') // status filter
    const featured = url.searchParams.get('featured') // featured filter

    // Validate pagination
    if (page < 1 || limit < 1) {
      const response = error('Invalid pagination parameters', 'VALIDATION_ERROR', 400)
      setCORSHeaders(response, request.headers.get('origin'))
      return response
    }

    // Parse sort parameter
    let sortField = 'updatedAt'
    let sortOrder: 'asc' | 'desc' = 'desc'
    
    if (sort.startsWith('-')) {
      sortField = sort.substring(1)
      sortOrder = 'desc'
    } else {
      sortField = sort
      sortOrder = 'asc'
    }

    const validSortFields = ['updatedAt', 'title', 'order', 'startDate', 'endDate', 'createdAt']
    
    if (!validSortFields.includes(sortField)) {
      const response = error('Invalid sort parameter', 'VALIDATION_ERROR', 400)
      setCORSHeaders(response, request.headers.get('origin'))
      return response
    }

    // Build where clause
    const where: any = { published: true }

    // Search filter (title and summary)
    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { summary: { contains: q, mode: 'insensitive' } },
      ]
    }

    // Tag filter
    if (tag) {
      where.tags = {
        has: tag
      }
    }

    // Tech stack filter
    if (tech) {
      where.techStack = {
        has: tech
      }
    }

    // Status filter
    if (status) {
      const validStatuses = ['ONGOING', 'COMPLETED', 'ARCHIVED']
      if (!validStatuses.includes(status)) {
        const response = error('Invalid status parameter', 'VALIDATION_ERROR', 400)
        setCORSHeaders(response, request.headers.get('origin'))
        return response
      }
      where.status = status
    }

    // Featured filter
    if (featured === 'true') {
      where.featured = true
    } else if (featured === 'false') {
      where.featured = false
    }

    // Build order by clause
    const orderBy: any = {}
    orderBy[sortField] = sortOrder

    // Calculate offset
    const skip = (page - 1) * limit

    // Get total count
    const total = await prisma.project.count({ where })

    // Get projects
    const projects = await prisma.project.findMany({
      where,
      orderBy,
      skip,
      take: limit,
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
        createdAt: true,
        updatedAt: true,
      },
    })

    const response = ok({
      items: projects,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    })
    
    // Add cache headers
    response.headers.set('Cache-Control', 'public, max-age=300') // 5 minutes
    setCORSHeaders(response, request.headers.get('origin'))
    return response

  } catch (err) {
    console.error('❌ [GET /api/v1/projects] Error occurred:', {
      error: err instanceof Error ? err.message : 'Unknown error',
      errorName: err instanceof Error ? err.constructor.name : 'Unknown',
      stack: err instanceof Error ? err.stack?.split('\n').slice(0, 3).join('\n') : undefined,
      timestamp: new Date().toISOString()
    })
    const response = error('Failed to get projects', 'INTERNAL_ERROR')
    setCORSHeaders(response, request.headers.get('origin'))
    return response
  }
}

/**
 * OPTIONS /api/v1/projects - CORS preflight
 */
export async function OPTIONS(request: NextRequest) {
  return applyCORS(request) || new NextResponse(null, { status: 204 })
}