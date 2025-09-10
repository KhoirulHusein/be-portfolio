import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ok, error } from '@/lib/utils/response'
import { applyCORS, setCORSHeaders } from '@/lib/auth/cors'
import { generateETag } from '@/lib/utils/etag'

export const runtime = 'nodejs'

/**
 * GET /api/v1/about - Public endpoint to get published about information
 */
export async function GET(request: NextRequest) {
  try {
    // Get published about entry (most recent)
    const about = await prisma.about.findFirst({
      where: { published: true },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        headline: true,
        subheadline: true,
        bio: true,
        avatarUrl: true,
        location: true,
        emailPublic: true,
        phonePublic: true,
        links: true,
        skills: true,
        updatedAt: true,
      },
    })

    if (!about) {
      const response = error('No published about information found', 'NOT_FOUND', 404)
      setCORSHeaders(response, request.headers.get('origin'))
      return response
    }

    // Generate ETag from updatedAt + id
    const etag = generateETag(`${about.id}-${about.updatedAt.getTime()}`)
    
    // Check If-None-Match header
    const ifNoneMatch = request.headers.get('if-none-match')
    if (ifNoneMatch === etag) {
      const response = new NextResponse(null, { 
        status: 304,
        headers: {
          'ETag': etag,
          'Cache-Control': 'public, max-age=60',
        }
      })
      setCORSHeaders(response, request.headers.get('origin'))
      return response
    }

    const response = ok(about)
    response.headers.set('ETag', etag)
    response.headers.set('Cache-Control', 'public, max-age=60')
    setCORSHeaders(response, request.headers.get('origin'))
    return response

  } catch (err) {
    console.error('Error getting about:', err)
    const response = error('Failed to get about information', 'INTERNAL_ERROR')
    setCORSHeaders(response, request.headers.get('origin'))
    return response
  }
}

/**
 * OPTIONS /api/v1/about - CORS preflight
 */
export async function OPTIONS(request: NextRequest) {
  return applyCORS(request) || new Response(null, { status: 204 })
}
