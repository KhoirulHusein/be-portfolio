import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ok, error } from '@/lib/utils/response'
import { applyCORS, setCORSHeaders, createCORSHeaders } from '@/lib/auth/cors'
import { generateETag } from '@/lib/utils/etag'

export const runtime = 'nodejs'

/**
 * GET /api/v1/projects/[slug] - Public endpoint to get published project by slug
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const origin = request.headers.get('origin')
    const { slug } = await params

    console.log('🔍 [GET /api/v1/projects/[slug]] Starting request processing', {
      method: 'GET',
      path: `/api/v1/projects/${slug}`,
      slug,
      origin,
      timestamp: new Date().toISOString()
    })

    if (!slug) {
      console.warn('⚠️ [GET /api/v1/projects/[slug]] Missing slug parameter')
      const corsHeaders = createCORSHeaders(origin)
      const response = error('Project slug is required', 'VALIDATION_ERROR', 400, corsHeaders)
      return response
    }

    // Get published project by slug
    const project = await prisma.project.findFirst({
      where: { 
        slug,
        published: true 
      },
      select: {
        id: true,
        title: true,
        slug: true,
        summary: true,
        description: true,
        coverImageUrl: true,
        galleryUrls: true,
        repoUrl: true,
        liveUrl: true,
        videoUrl: true,
        links: true,
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

    if (!project) {
      const corsHeaders = createCORSHeaders(origin)
      const response = error('Project not found', 'NOT_FOUND', 404, corsHeaders)
      return response
    }

    // Generate ETag from updatedAt + slug
    const etag = generateETag(`${project.slug}-${project.updatedAt.getTime()}`)
    
    // Check If-None-Match header
    const ifNoneMatch = request.headers.get('if-none-match')
    if (ifNoneMatch === etag) {
      const corsHeaders = createCORSHeaders(origin)
      corsHeaders.set('ETag', etag)
      corsHeaders.set('Cache-Control', 'public, max-age=300') // 5 minutes
      
      const response = new NextResponse(null, { 
        status: 304,
        headers: corsHeaders
      })
      return response
    }

    const corsHeaders = createCORSHeaders(origin)
    corsHeaders.set('ETag', etag)
    corsHeaders.set('Cache-Control', 'public, max-age=300') // 5 minutes
    
    const response = ok(project, 200, corsHeaders)
    return response

  } catch (err) {
    console.error('❌ [GET /api/v1/projects/[slug]] Error occurred:', {
      error: err instanceof Error ? err.message : 'Unknown error',
      errorName: err instanceof Error ? err.constructor.name : 'Unknown',
      stack: err instanceof Error ? err.stack?.split('\n').slice(0, 3).join('\n') : undefined,
      timestamp: new Date().toISOString()
    })
    const origin = request.headers.get('origin')
    const corsHeaders = createCORSHeaders(origin)
    const response = error('Failed to get project', 'INTERNAL_ERROR', 500, corsHeaders)
    return response
  }
}

/**
 * OPTIONS /api/v1/projects/[slug] - CORS preflight
 */
export async function OPTIONS(request: NextRequest) {
  return applyCORS(request) || new NextResponse(null, { status: 204 })
}