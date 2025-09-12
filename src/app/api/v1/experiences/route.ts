import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ok, error } from '@/lib/utils/response'
import { applyCORS, setCORSHeaders } from '@/lib/auth/cors'

export const runtime = 'nodejs'

/**
 * GET /api/v1/experiences - Public endpoint to get published experiences
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    
    // Parse query parameters
    const page = parseInt(url.searchParams.get('page') || '1', 10)
    const pageSize = Math.min(parseInt(url.searchParams.get('pageSize') || '10', 10), 100) // Max 100 per page
    const sort = url.searchParams.get('sort') || 'startDate:desc'
    const current = url.searchParams.get('current')
    const company = url.searchParams.get('company')
    const role = url.searchParams.get('role')

    // Validate pagination
    if (page < 1 || pageSize < 1) {
      const response = error('Invalid pagination parameters', 'VALIDATION_ERROR', 400)
      setCORSHeaders(response, request.headers.get('origin'))
      return response
    }

    // Parse sort parameter
    const [sortField, sortOrder] = sort.split(':')
    const validSortFields = ['startDate', 'endDate', 'company', 'role', 'order', 'createdAt', 'updatedAt']
    const validSortOrders = ['asc', 'desc']
    
    if (!validSortFields.includes(sortField) || !validSortOrders.includes(sortOrder || 'desc')) {
      const response = error('Invalid sort parameter', 'VALIDATION_ERROR', 400)
      setCORSHeaders(response, request.headers.get('origin'))
      return response
    }

    // Build where clause
    const where: any = { published: true }

    // Filter by current position
    if (current === 'true') {
      where.endDate = null
    } else if (current === 'false') {
      where.endDate = { not: null }
    }

    // Search filters
    if (company) {
      where.company = { contains: company, mode: 'insensitive' }
    }
    if (role) {
      where.role = { contains: role, mode: 'insensitive' }
    }

    // Build order by clause
    const orderBy: any = {}
    orderBy[sortField] = sortOrder

    // Calculate offset
    const skip = (page - 1) * pageSize

    // Get total count
    const total = await prisma.experience.count({ where })

    // Get experiences
    const experiences = await prisma.experience.findMany({
      where,
      orderBy,
      skip,
      take: pageSize,
      select: {
        id: true,
        company: true,
        role: true,
        companyLogoUrl: true,
        startDate: true,
        endDate: true,
        location: true,
        employmentType: true,
        summary: true,
        highlights: true,
        techStack: true,
        order: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    const response = ok({
      items: experiences,
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    })
    
    setCORSHeaders(response, request.headers.get('origin'))
    return response

  } catch (err) {
    console.error('Error getting experiences:', err)
    const response = error('Failed to get experiences', 'INTERNAL_ERROR')
    setCORSHeaders(response, request.headers.get('origin'))
    return response
  }
}

/**
 * OPTIONS /api/v1/experiences - CORS preflight
 */
export async function OPTIONS(request: NextRequest) {
  return applyCORS(request) || new NextResponse(null, { status: 204 })
}
