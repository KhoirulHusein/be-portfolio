import { prisma } from '@/lib/prisma'
import { ok, created, error, handleError } from '@/lib/utils/response'
import { setCORSHeaders } from '@/lib/auth/cors'
import { validateCreateExperience } from '@/lib/utils/validators/experience'
import { getAuthUserOrThrow } from '@/middleware/auth-middleware'
import { userHasPermission } from '@/lib/auth/rbac'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

/**
 * GET /api/v1/admin/experiences - Get all experiences for admin (published or draft)
 */
export async function GET(request: Request) {
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

    const url = new URL(request.url)
    
    // Parse query parameters
    const page = parseInt(url.searchParams.get('page') || '1', 10)
    const pageSize = Math.min(parseInt(url.searchParams.get('pageSize') || '20', 10), 100) // Max 100 per page
    const sort = url.searchParams.get('sort') || 'startDate:desc'
    const company = url.searchParams.get('company')
    const role = url.searchParams.get('role')
    const published = url.searchParams.get('published')

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

    // Build where clause (admin can see all experiences, not just published)
    const where: any = {}

    // Search filters
    if (company) {
      where.company = { contains: company, mode: 'insensitive' }
    }
    if (role) {
      where.role = { contains: role, mode: 'insensitive' }
    }
    if (published === 'true') {
      where.published = true
    } else if (published === 'false') {
      where.published = false
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
    const response = handleError(err)
    setCORSHeaders(response, request.headers.get('origin'))
    return response
  }
}

/**
 * POST /api/v1/admin/experiences - Create new experience
 */
export async function POST(request: Request) {
  try {
    // Check authentication
    const user = await getAuthUserOrThrow(request)
    
    // Check permission
    const hasPermission = await userHasPermission(user.id, 'experience:create')
    if (!hasPermission) {
      const response = error('Access denied. Required permission: experience:create', 'FORBIDDEN', 403)
      setCORSHeaders(response, request.headers.get('origin'))
      return response
    }

    const body = await request.json()
    const validatedData = validateCreateExperience(body)

    // Convert dates to Date objects
    const experienceData = {
      ...validatedData,
      startDate: new Date(validatedData.startDate),
      endDate: validatedData.endDate ? new Date(validatedData.endDate) : null,
      createdBy: user.id,
      updatedBy: user.id,
    }

    const experience = await prisma.experience.create({
      data: experienceData,
    })

    const response = created(experience)
    setCORSHeaders(response, request.headers.get('origin'))
    return response

  } catch (err) {
    const response = handleError(err)
    setCORSHeaders(response, request.headers.get('origin'))
    return response
  }
}

/**
 * OPTIONS /api/v1/admin/experiences - CORS preflight
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
