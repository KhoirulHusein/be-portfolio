import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ok, error } from '@/lib/utils/response'
import { applyCORS, setCORSHeaders } from '@/lib/auth/cors'
import { generateETag } from '@/lib/utils/etag'

export const runtime = 'nodejs'

/**
 * GET /api/v1/experiences/[id] - Public endpoint to get published experience by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      const response = error('Experience ID is required', 'VALIDATION_ERROR', 400)
      setCORSHeaders(response, request.headers.get('origin'))
      return response
    }

    // Get published experience by ID
    const experience = await prisma.experience.findFirst({
      where: { 
        id,
        published: true 
      },
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

    if (!experience) {
      const response = error('Experience not found', 'NOT_FOUND', 404)
      setCORSHeaders(response, request.headers.get('origin'))
      return response
    }

    // Generate ETag from updatedAt + id
    const etag = generateETag(`${experience.id}-${experience.updatedAt.getTime()}`)
    
    // Check If-None-Match header
    const ifNoneMatch = request.headers.get('if-none-match')
    if (ifNoneMatch === etag) {
      const response = new NextResponse(null, { 
        status: 304,
        headers: {
          'ETag': etag,
          'Cache-Control': 'public, max-age=300', // 5 minutes
        }
      })
      setCORSHeaders(response, request.headers.get('origin'))
      return response
    }

    const response = ok(experience)
    response.headers.set('ETag', etag)
    response.headers.set('Cache-Control', 'public, max-age=300') // 5 minutes
    setCORSHeaders(response, request.headers.get('origin'))
    return response

  } catch (err) {
    console.error('Error getting experience:', err)
    const response = error('Failed to get experience', 'INTERNAL_ERROR')
    setCORSHeaders(response, request.headers.get('origin'))
    return response
  }
}

/**
 * OPTIONS /api/v1/experiences/[id] - CORS preflight
 */
export async function OPTIONS(request: NextRequest) {
  return applyCORS(request) || new NextResponse(null, { status: 204 })
}
