import { describe, it, expect, beforeEach } from 'vitest'
import { GET as projectsHandler } from '@/app/api/v1/projects/route'
import { jsonRequest, readJson } from '@/app/test/setup/request-helpers'
import { cleanupTestData, createProject, createAdminUser } from '@/app/test/setup/factories'

describe('Public Project List Routes', () => {
  beforeEach(async () => {
    await cleanupTestData()
  })

  describe('GET /api/v1/projects', () => {
    it('should return only published projects', async () => {
      // Create admin user for project creation
      const admin = await createAdminUser({
        email: 'admin@test.com',
        username: 'admin',
        password: 'password123'
      })

      // Create one published project
      await createProject({
        title: 'Published Project',
        slug: 'published-project',
        summary: 'A published project for testing',
        techStack: ['React', 'TypeScript'],
        tags: ['web', 'frontend'],
        status: 'COMPLETED',
        published: true,
        createdBy: admin.id
      })

      // Create one unpublished project
      await createProject({
        title: 'Draft Project',
        slug: 'draft-project',
        summary: 'A draft project for testing',
        techStack: ['Node.js'],
        tags: ['backend'],
        status: 'ONGOING',
        published: false,
        createdBy: admin.id
      })

      // Test GET request
      const request = jsonRequest('http://localhost:4000/api/v1/projects', 'GET')
      const response = await projectsHandler(request as any)
      const { status, json } = await readJson(response)

      expect(status).toBe(200)
      expect(json.success).toBe(true)
      expect(json.data).toHaveProperty('items')
      expect(json.data).toHaveProperty('total', 1) // Only published ones
      expect(json.data.items).toHaveLength(1)
      expect(json.data.items[0].title).toBe('Published Project')
      expect(json.data.items[0]).toHaveProperty('id')
      expect(json.data.items[0]).toHaveProperty('slug', 'published-project')
      expect(json.data.items[0]).toHaveProperty('techStack')
      expect(json.data.items[0].techStack).toContain('React')
    })

    it('should filter projects by tech stack', async () => {
      const admin = await createAdminUser({
        email: 'admin@test.com',
        username: 'admin',
        password: 'password123'
      })

      // Create projects with different tech stacks
      await createProject({
        title: 'React Project',
        techStack: ['React', 'TypeScript'],
        published: true,
        createdBy: admin.id
      })

      await createProject({
        title: 'Vue Project',
        techStack: ['Vue', 'JavaScript'],
        published: true,
        createdBy: admin.id
      })

      // Test filtering by tech
      const request = jsonRequest('http://localhost:4000/api/v1/projects?tech=React', 'GET')
      const response = await projectsHandler(request as any)
      const { status, json } = await readJson(response)

      expect(status).toBe(200)
      expect(json.data.total).toBe(1)
      expect(json.data.items[0].title).toBe('React Project')
    })

    it('should filter projects by tag', async () => {
      const admin = await createAdminUser({
        email: 'admin@test.com',
        username: 'admin',
        password: 'password123'
      })

      // Create projects with different tags
      await createProject({
        title: 'Web Project',
        tags: ['web', 'frontend'],
        published: true,
        createdBy: admin.id
      })

      await createProject({
        title: 'Mobile Project',
        tags: ['mobile', 'app'],
        published: true,
        createdBy: admin.id
      })

      // Test filtering by tag
      const request = jsonRequest('http://localhost:4000/api/v1/projects?tag=web', 'GET')
      const response = await projectsHandler(request as any)
      const { status, json } = await readJson(response)

      expect(status).toBe(200)
      expect(json.data.total).toBe(1)
      expect(json.data.items[0].title).toBe('Web Project')
    })

    it('should filter projects by status', async () => {
      const admin = await createAdminUser({
        email: 'admin@test.com',
        username: 'admin',
        password: 'password123'
      })

      // Create projects with different statuses
      await createProject({
        title: 'Completed Project',
        status: 'COMPLETED',
        published: true,
        createdBy: admin.id
      })

      await createProject({
        title: 'Ongoing Project',
        status: 'ONGOING',
        published: true,
        createdBy: admin.id
      })

      // Test filtering by status
      const request = jsonRequest('http://localhost:4000/api/v1/projects?status=COMPLETED', 'GET')
      const response = await projectsHandler(request as any)
      const { status, json } = await readJson(response)

      expect(status).toBe(200)
      expect(json.data.total).toBe(1)
      expect(json.data.items[0].title).toBe('Completed Project')
    })

    it('should filter projects by featured flag', async () => {
      const admin = await createAdminUser({
        email: 'admin@test.com',
        username: 'admin',
        password: 'password123'
      })

      // Create featured and non-featured projects
      await createProject({
        title: 'Featured Project',
        featured: true,
        published: true,
        createdBy: admin.id
      })

      await createProject({
        title: 'Regular Project',
        featured: false,
        published: true,
        createdBy: admin.id
      })

      // Test filtering by featured
      const request = jsonRequest('http://localhost:4000/api/v1/projects?featured=true', 'GET')
      const response = await projectsHandler(request as any)
      const { status, json } = await readJson(response)

      expect(status).toBe(200)
      expect(json.data.total).toBe(1)
      expect(json.data.items[0].title).toBe('Featured Project')
      expect(json.data.items[0].featured).toBe(true)
    })

    it('should search projects by title and summary', async () => {
      const admin = await createAdminUser({
        email: 'admin@test.com',
        username: 'admin',
        password: 'password123'
      })

      // Create projects with searchable content
      await createProject({
        title: 'E-commerce Platform',
        summary: 'Online shopping website',
        published: true,
        createdBy: admin.id
      })

      await createProject({
        title: 'Chat Application',
        summary: 'Real-time messaging app',
        published: true,
        createdBy: admin.id
      })

      // Test search by title
      const request1 = jsonRequest('http://localhost:4000/api/v1/projects?q=commerce', 'GET')
      const response1 = await projectsHandler(request1 as any)
      const { status: status1, json: json1 } = await readJson(response1)

      expect(status1).toBe(200)
      expect(json1.data.total).toBe(1)
      expect(json1.data.items[0].title).toBe('E-commerce Platform')

      // Test search by summary
      const request2 = jsonRequest('http://localhost:4000/api/v1/projects?q=messaging', 'GET')
      const response2 = await projectsHandler(request2 as any)
      const { status: status2, json: json2 } = await readJson(response2)

      expect(status2).toBe(200)
      expect(json2.data.total).toBe(1)
      expect(json2.data.items[0].title).toBe('Chat Application')
    })

    it('should handle pagination correctly', async () => {
      const admin = await createAdminUser({
        email: 'admin@test.com',
        username: 'admin',
        password: 'password123'
      })

      // Create multiple projects
      for (let i = 1; i <= 5; i++) {
        await createProject({
          title: `Project ${i}`,
          published: true,
          createdBy: admin.id
        })
      }

      // Test first page with limit 2
      const request1 = jsonRequest('http://localhost:4000/api/v1/projects?page=1&limit=2', 'GET')
      const response1 = await projectsHandler(request1 as any)
      const { status: status1, json: json1 } = await readJson(response1)

      expect(status1).toBe(200)
      expect(json1.data.items).toHaveLength(2)
      expect(json1.data.page).toBe(1)
      expect(json1.data.limit).toBe(2)
      expect(json1.data.total).toBe(5)
      expect(json1.data.totalPages).toBe(3)

      // Test second page
      const request2 = jsonRequest('http://localhost:4000/api/v1/projects?page=2&limit=2', 'GET')
      const response2 = await projectsHandler(request2 as any)
      const { status: status2, json: json2 } = await readJson(response2)

      expect(status2).toBe(200)
      expect(json2.data.items).toHaveLength(2)
      expect(json2.data.page).toBe(2)
    })

    it('should sort projects correctly', async () => {
      const admin = await createAdminUser({
        email: 'admin@test.com',
        username: 'admin',
        password: 'password123'
      })

      // Create projects with different dates
      const project1 = await createProject({
        title: 'Old Project',
        published: true,
        createdBy: admin.id
      })

      // Wait a bit to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10))

      const project2 = await createProject({
        title: 'New Project',
        published: true,
        createdBy: admin.id
      })

      // Test default sort (newest first)
      const request1 = jsonRequest('http://localhost:4000/api/v1/projects', 'GET')
      const response1 = await projectsHandler(request1 as any)
      const { status: status1, json: json1 } = await readJson(response1)

      expect(status1).toBe(200)
      expect(json1.data.items[0].title).toBe('New Project')
      expect(json1.data.items[1].title).toBe('Old Project')

      // Test ascending sort by title
      const request2 = jsonRequest('http://localhost:4000/api/v1/projects?sort=title', 'GET')
      const response2 = await projectsHandler(request2 as any)
      const { status: status2, json: json2 } = await readJson(response2)

      expect(status2).toBe(200)
      expect(json2.data.items[0].title).toBe('New Project') // 'New' comes before 'Old'
      expect(json2.data.items[1].title).toBe('Old Project')
    })

    it('should return cache headers', async () => {
      const admin = await createAdminUser({
        email: 'admin@test.com',
        username: 'admin',
        password: 'password123'
      })

      await createProject({
        title: 'Test Project',
        published: true,
        createdBy: admin.id
      })

      const request = jsonRequest('http://localhost:4000/api/v1/projects', 'GET')
      const response = await projectsHandler(request as any)

      expect(response.headers.get('Cache-Control')).toBe('public, max-age=300')
    })

    it('should handle invalid pagination parameters', async () => {
      const request = jsonRequest('http://localhost:4000/api/v1/projects?page=0&limit=-1', 'GET')
      const response = await projectsHandler(request as any)
      const { status, json } = await readJson(response)

      expect(status).toBe(400)
      expect(json.success).toBe(false)
      expect(json.error.message).toContain('Invalid pagination parameters')
    })

    it('should handle invalid sort parameter', async () => {
      const request = jsonRequest('http://localhost:4000/api/v1/projects?sort=invalid_field', 'GET')
      const response = await projectsHandler(request as any)
      const { status, json } = await readJson(response)

      expect(status).toBe(400)
      expect(json.success).toBe(false)
      expect(json.error.message).toContain('Invalid sort parameter')
    })

    it('should handle invalid status parameter', async () => {
      const request = jsonRequest('http://localhost:4000/api/v1/projects?status=INVALID', 'GET')
      const response = await projectsHandler(request as any)
      const { status, json } = await readJson(response)

      expect(status).toBe(400)
      expect(json.success).toBe(false)
      expect(json.error.message).toContain('Invalid status parameter')
    })
  })
})