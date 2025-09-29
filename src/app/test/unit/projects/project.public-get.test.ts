import { describe, it, expect, beforeEach } from 'vitest'
import { GET as projectDetailHandler } from '@/app/api/v1/projects/[slug]/route'
import { jsonRequest, readJson } from '@/app/test/setup/request-helpers'
import { cleanupTestData, createProject, createAdminUser } from '@/app/test/setup/factories'

describe('Public Project Detail Routes', () => {
  beforeEach(async () => {
    await cleanupTestData()
  })

  describe('GET /api/v1/projects/[slug]', () => {
    it('should return published project by slug', async () => {
      const admin = await createAdminUser({
        email: 'admin@test.com',
        username: 'admin',
        password: 'password123'
      })

      const project = await createProject({
        title: 'Test Project',
        slug: 'test-project',
        summary: 'A test project',
        description: '# Test Project\n\nThis is a detailed description.',
        coverImageUrl: 'https://example.com/cover.jpg',
        galleryUrls: ['https://example.com/1.jpg', 'https://example.com/2.jpg'],
        repoUrl: 'https://github.com/user/repo',
        liveUrl: 'https://example.com',
        videoUrl: 'https://youtube.com/watch?v=123',
        links: { docs: 'https://docs.example.com' },
        techStack: ['React', 'TypeScript', 'Node.js'],
        tags: ['web', 'fullstack'],
        status: 'COMPLETED',
        featured: true,
        published: true,
        createdBy: admin.id
      })

      const request = jsonRequest('http://localhost:4000/api/v1/projects/test-project', 'GET')
      const response = await projectDetailHandler(request as any, { 
        params: Promise.resolve({ slug: 'test-project' }) 
      })
      const { status, json } = await readJson(response)

      expect(status).toBe(200)
      expect(json.success).toBe(true)
      expect(json.data).toHaveProperty('id')
      expect(json.data.title).toBe('Test Project')
      expect(json.data.slug).toBe('test-project')
      expect(json.data.summary).toBe('A test project')
      expect(json.data.description).toBe('# Test Project\n\nThis is a detailed description.')
      expect(json.data.coverImageUrl).toBe('https://example.com/cover.jpg')
      expect(json.data.galleryUrls).toEqual(['https://example.com/1.jpg', 'https://example.com/2.jpg'])
      expect(json.data.repoUrl).toBe('https://github.com/user/repo')
      expect(json.data.liveUrl).toBe('https://example.com')
      expect(json.data.videoUrl).toBe('https://youtube.com/watch?v=123')
      expect(json.data.links).toEqual({ docs: 'https://docs.example.com' })
      expect(json.data.techStack).toEqual(['React', 'TypeScript', 'Node.js'])
      expect(json.data.tags).toEqual(['web', 'fullstack'])
      expect(json.data.status).toBe('COMPLETED')
      expect(json.data.featured).toBe(true)
      expect(json.data).toHaveProperty('createdAt')
      expect(json.data).toHaveProperty('updatedAt')
    })

    it('should return 404 for unpublished project', async () => {
      const admin = await createAdminUser({
        email: 'admin@test.com',
        username: 'admin',
        password: 'password123'
      })

      await createProject({
        title: 'Draft Project',
        slug: 'draft-project',
        published: false,
        createdBy: admin.id
      })

      const request = jsonRequest('http://localhost:4000/api/v1/projects/draft-project', 'GET')
      const response = await projectDetailHandler(request as any, { 
        params: Promise.resolve({ slug: 'draft-project' }) 
      })
      const { status, json } = await readJson(response)

      expect(status).toBe(404)
      expect(json.success).toBe(false)
      expect(json.error.message).toBe('Project not found')
    })

    it('should return 404 for non-existent project', async () => {
      const request = jsonRequest('http://localhost:4000/api/v1/projects/non-existent', 'GET')
      const response = await projectDetailHandler(request as any, { 
        params: Promise.resolve({ slug: 'non-existent' }) 
      })
      const { status, json } = await readJson(response)

      expect(status).toBe(404)
      expect(json.success).toBe(false)
      expect(json.error.message).toBe('Project not found')
    })

    it('should return 400 for missing slug', async () => {
      const request = jsonRequest('http://localhost:4000/api/v1/projects/', 'GET')
      const response = await projectDetailHandler(request as any, { 
        params: Promise.resolve({ slug: '' }) 
      })
      const { status, json } = await readJson(response)

      expect(status).toBe(400)
      expect(json.success).toBe(false)
      expect(json.error.message).toBe('Project slug is required')
    })

    it('should include ETag header', async () => {
      const admin = await createAdminUser({
        email: 'admin@test.com',
        username: 'admin',
        password: 'password123'
      })

      await createProject({
        title: 'Test Project',
        slug: 'test-project',
        published: true,
        createdBy: admin.id
      })

      const request = jsonRequest('http://localhost:4000/api/v1/projects/test-project', 'GET')
      const response = await projectDetailHandler(request as any, { 
        params: Promise.resolve({ slug: 'test-project' }) 
      })

      expect(response.headers.get('ETag')).toBeTruthy()
      expect(response.headers.get('Cache-Control')).toBe('public, max-age=300')
    })

    it('should return 304 for matching ETag', async () => {
      const admin = await createAdminUser({
        email: 'admin@test.com',
        username: 'admin',
        password: 'password123'
      })

      const project = await createProject({
        title: 'Test Project',
        slug: 'test-project',
        published: true,
        createdBy: admin.id
      })

      // First request to get ETag
      const request1 = jsonRequest('http://localhost:4000/api/v1/projects/test-project', 'GET')
      const response1 = await projectDetailHandler(request1 as any, { 
        params: Promise.resolve({ slug: 'test-project' }) 
      })
      const etag = response1.headers.get('ETag')

      // Second request with If-None-Match header
      const request2 = jsonRequest('http://localhost:4000/api/v1/projects/test-project', 'GET', undefined, {
        'If-None-Match': etag || ''
      })
      const response2 = await projectDetailHandler(request2 as any, { 
        params: Promise.resolve({ slug: 'test-project' }) 
      })

      expect(response2.status).toBe(304)
      expect(response2.headers.get('ETag')).toBe(etag)
    })

    it('should handle CORS headers', async () => {
      const admin = await createAdminUser({
        email: 'admin@test.com',
        username: 'admin',
        password: 'password123'
      })

      await createProject({
        title: 'Test Project',
        slug: 'test-project',
        published: true,
        createdBy: admin.id
      })

      const request = jsonRequest('http://localhost:4000/api/v1/projects/test-project', 'GET', undefined, {
        'Origin': 'https://example.com'
      })
      const response = await projectDetailHandler(request as any, { 
        params: Promise.resolve({ slug: 'test-project' }) 
      })

      // Debug: Check actual headers in response
      // CORS headers should be set by setCORSHeaders function
      expect(response.headers.has('Access-Control-Allow-Origin')).toBeTruthy()
    })
  })
})