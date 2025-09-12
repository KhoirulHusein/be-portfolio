import { describe, it, expect, beforeEach } from 'vitest'
import { GET as experienceHandler, OPTIONS as experienceOptionsHandler } from '@/app/api/v1/experiences/[id]/route'
import { jsonRequest, readJson } from '@/app/test/setup/request-helpers'
import { cleanupTestData, createExperience, createAdminUser } from '@/app/test/setup/factories'

describe('GET /api/v1/experiences/[id] - Public', () => {
  beforeEach(async () => {
    await cleanupTestData()
  })

  it('should return published experience by ID', async () => {
    // Create admin user
    const admin = await createAdminUser({
      email: 'admin@test.com',
      username: 'admin',
      password: 'password123'
    })

    // Create published experience
    const experienceData = {
      company: 'Tech Corp',
      role: 'Senior Developer',
      companyLogoUrl: 'https://example.com/logo.png',
      startDate: new Date('2023-01-01'),
      endDate: null,
      location: 'Remote',
      employmentType: 'Full-time',
      summary: 'Leading backend development team',
      highlights: ['Built scalable APIs', 'Improved performance by 40%'],
      techStack: ['Node.js', 'TypeScript', 'PostgreSQL'],
      order: 1,
      published: true,
      createdBy: admin.id
    }

    const experience = await createExperience(experienceData)

    // Test GET request
    const request = jsonRequest(`http://localhost:4000/api/v1/experiences/${experience.id}`, 'GET')
    const response = await experienceHandler(request as any, { params: Promise.resolve({ id: experience.id }) })
    const { status, json } = await readJson(response)

    expect(status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.data).toMatchObject({
      id: experience.id,
      company: experienceData.company,
      role: experienceData.role,
      companyLogoUrl: experienceData.companyLogoUrl,
      location: experienceData.location,
      employmentType: experienceData.employmentType,
      summary: experienceData.summary,
      highlights: experienceData.highlights,
      techStack: experienceData.techStack,
      order: experienceData.order
    })

    expect(json.data.startDate).toBeDefined()
    expect(json.data.endDate).toBeNull()
    expect(json.data.createdAt).toBeDefined()
    expect(json.data.updatedAt).toBeDefined()
  })

  it('should return 404 for unpublished experience', async () => {
    // Create admin user
    const admin = await createAdminUser({
      email: 'admin@test.com',
      username: 'admin',
      password: 'password123'
    })

    // Create unpublished experience
    const experience = await createExperience({
      company: 'Private Corp',
      role: 'Developer',
      startDate: new Date('2023-01-01'),
      published: false, // Not published
      createdBy: admin.id
    })

    // Test GET request
    const request = jsonRequest(`http://localhost:4000/api/v1/experiences/${experience.id}`, 'GET')
    const response = await experienceHandler(request as any, { params: Promise.resolve({ id: experience.id }) })
    const { status, json } = await readJson(response)

    expect(status).toBe(404)
    expect(json.success).toBe(false)
    expect(json.error.code).toBe('NOT_FOUND')
    expect(json.error.message).toBe('Experience not found')
  })

  it('should return 404 for non-existent experience', async () => {
    const nonExistentId = 'non-existent-id'

    const request = jsonRequest(`http://localhost:4000/api/v1/experiences/${nonExistentId}`, 'GET')
    const response = await experienceHandler(request as any, { params: Promise.resolve({ id: nonExistentId }) })
    const { status, json } = await readJson(response)

    expect(status).toBe(404)
    expect(json.success).toBe(false)
    expect(json.error.code).toBe('NOT_FOUND')
    expect(json.error.message).toBe('Experience not found')
  })

  it('should return 400 for empty experience ID', async () => {
    const request = jsonRequest('http://localhost:4000/api/v1/experiences/', 'GET')
    const response = await experienceHandler(request as any, { params: Promise.resolve({ id: '' }) })
    const { status, json } = await readJson(response)

    expect(status).toBe(400)
    expect(json.success).toBe(false)
    expect(json.error.code).toBe('VALIDATION_ERROR')
    expect(json.error.message).toBe('Experience ID is required')
  })

  it('should support ETag caching', async () => {
    // Create admin user
    const admin = await createAdminUser({
      email: 'admin@test.com',
      username: 'admin',
      password: 'password123'
    })

    // Create published experience
    const experience = await createExperience({
      company: 'Tech Corp',
      role: 'Developer',
      startDate: new Date('2023-01-01'),
      published: true,
      createdBy: admin.id
    })

    // First request to get ETag
    const request1 = jsonRequest(`http://localhost:4000/api/v1/experiences/${experience.id}`, 'GET')
    const response1 = await experienceHandler(request1 as any, { params: Promise.resolve({ id: experience.id }) })
    const { status: status1 } = await readJson(response1)
    
    expect(status1).toBe(200)
    const etag = response1.headers.get('ETag')
    expect(etag).toBeDefined()

    // Second request with If-None-Match header
    const request2 = new Request(`http://localhost:4000/api/v1/experiences/${experience.id}`, {
      method: 'GET',
      headers: {
        'If-None-Match': etag!
      }
    })
    const response2 = await experienceHandler(request2 as any, { params: Promise.resolve({ id: experience.id }) })

    expect(response2.status).toBe(304)
    expect(response2.headers.get('ETag')).toBe(etag)
  })

  it('should have appropriate cache headers', async () => {
    // Create admin user
    const admin = await createAdminUser({
      email: 'admin@test.com',
      username: 'admin',
      password: 'password123'
    })

    // Create published experience
    const experience = await createExperience({
      company: 'Tech Corp',
      role: 'Developer',
      startDate: new Date('2023-01-01'),
      published: true,
      createdBy: admin.id
    })

    const request = jsonRequest(`http://localhost:4000/api/v1/experiences/${experience.id}`, 'GET')
    const response = await experienceHandler(request as any, { params: Promise.resolve({ id: experience.id }) })
    const { status } = await readJson(response)

    expect(status).toBe(200)
    expect(response.headers.get('ETag')).toBeDefined()
    expect(response.headers.get('Cache-Control')).toBe('public, max-age=300')
  })

  it('should handle OPTIONS request (CORS preflight)', async () => {
    const request = new Request('http://localhost:4000/api/v1/experiences/test-id', {
      method: 'OPTIONS'
    })
    const response = await experienceOptionsHandler(request as any)

    expect(response.status).toBe(200)
    expect(response.headers.get('Access-Control-Allow-Methods')).toContain('GET')
    expect(response.headers.get('Access-Control-Allow-Headers')).toContain('Content-Type')
  })
})
