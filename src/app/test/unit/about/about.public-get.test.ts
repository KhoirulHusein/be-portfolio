import { describe, it, expect, beforeEach } from 'vitest'
import { GET as aboutHandler, OPTIONS as aboutOptionsHandler } from '@/app/api/v1/about/route'
import { jsonRequest, readJson } from '@/app/test/setup/request-helpers'
import { cleanupTestData, createAbout, createAdminUser } from '@/app/test/setup/factories'

describe('GET /api/v1/about - Public', () => {
  beforeEach(async () => {
    await cleanupTestData()
  })

  it('should return published about information', async () => {
    // Create admin user
    const admin = await createAdminUser({
      email: 'admin@test.com',
      username: 'admin',
      password: 'password123'
    })

    // Create published about
    const aboutData = {
      headline: 'Backend Engineer',
      subheadline: 'Passionate about APIs',
      bio: 'I love building scalable backend systems and APIs.',
      avatarUrl: 'https://example.com/avatar.jpg',
      location: 'San Francisco, CA',
      emailPublic: 'john@example.com',
      phonePublic: '+1-555-123-4567',
      links: {
        github: 'https://github.com/johndoe',
        linkedin: 'https://linkedin.com/in/johndoe'
      },
      skills: ['Node.js', 'TypeScript', 'PostgreSQL'],
      published: true,
      createdBy: admin.id
    }

    const about = await createAbout(aboutData)

    // Test GET request
    const request = jsonRequest('http://localhost:4000/api/v1/about', 'GET')
    const response = await aboutHandler(request as any)
    const { status, json } = await readJson(response)

    expect(status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.data).toMatchObject({
      id: about.id,
      headline: aboutData.headline,
      subheadline: aboutData.subheadline,
      bio: aboutData.bio,
      avatarUrl: aboutData.avatarUrl,
      location: aboutData.location,
      emailPublic: aboutData.emailPublic,
      phonePublic: aboutData.phonePublic,
      links: aboutData.links,
      skills: aboutData.skills
    })
    expect(json.data.updatedAt).toBeDefined()

    // Check ETag header
    expect(response.headers.get('ETag')).toBeDefined()
    expect(response.headers.get('Cache-Control')).toBe('public, max-age=60')
  })

  it('should return 404 when no published about exists', async () => {
    // Create admin user
    const admin = await createAdminUser({
      email: 'admin@test.com',
      username: 'admin',
      password: 'password123'
    })

    // Create unpublished about
    await createAbout({
      headline: 'Backend Engineer',
      bio: 'I love building scalable backend systems.',
      published: false,
      createdBy: admin.id
    })

    const request = jsonRequest('http://localhost:4000/api/v1/about', 'GET')
    const response = await aboutHandler(request as any)
    const { status, json } = await readJson(response)

    expect(status).toBe(404)
    expect(json.success).toBe(false)
    expect(json.error?.code).toBe('NOT_FOUND')
  })

  it('should return 404 when no about exists at all', async () => {
    const request = jsonRequest('http://localhost:4000/api/v1/about', 'GET')
    const response = await aboutHandler(request as any)
    const { status, json } = await readJson(response)

    expect(status).toBe(404)
    expect(json.success).toBe(false)
    expect(json.error?.code).toBe('NOT_FOUND')
  })

  it('should return most recent published about when multiple exist', async () => {
    // Create admin user
    const admin = await createAdminUser({
      email: 'admin@test.com',
      username: 'admin',
      password: 'password123'
    })

    // Create first about
    const firstAbout = await createAbout({
      headline: 'Old Title',
      bio: 'Old bio',
      published: true,
      createdBy: admin.id
    })

    // Wait a bit to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10))

    // Create second (more recent) about
    const secondAbout = await createAbout({
      headline: 'New Title',
      bio: 'New bio',
      published: true,
      createdBy: admin.id
    })

    const request = jsonRequest('http://localhost:4000/api/v1/about', 'GET')
    const response = await aboutHandler(request as any)
    const { status, json } = await readJson(response)

    expect(status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.data.id).toBe(secondAbout.id)
    expect(json.data.headline).toBe('New Title')
  })

  it('should return 304 for matching ETag', async () => {
    // Create admin user
    const admin = await createAdminUser({
      email: 'admin@test.com',
      username: 'admin',
      password: 'password123'
    })

    // Create published about
    const about = await createAbout({
      headline: 'Backend Engineer',
      bio: 'I love building scalable backend systems.',
      published: true,
      createdBy: admin.id
    })

    // First request to get ETag
    const firstRequest = jsonRequest('http://localhost:4000/api/v1/about', 'GET')
    const firstResponse = await aboutHandler(firstRequest as any)
    const etag = firstResponse.headers.get('ETag')

    expect(etag).toBeDefined()

    // Second request with If-None-Match header
    const secondRequest = jsonRequest('http://localhost:4000/api/v1/about', 'GET', undefined, {
      'If-None-Match': etag!
    })
    const secondResponse = await aboutHandler(secondRequest as any)

    expect(secondResponse.status).toBe(304)
    expect(secondResponse.headers.get('ETag')).toBe(etag)
  })

  it('should handle OPTIONS request (CORS preflight)', async () => {
    const request = jsonRequest('http://localhost:4000/api/v1/about', 'OPTIONS')
    const response = await aboutOptionsHandler(request as any)

    expect(response.status).toBe(200)
    expect(response.headers.get('Access-Control-Allow-Methods')).toContain('GET')
    expect(response.headers.get('Access-Control-Allow-Headers')).toContain('Content-Type')
  })
})
