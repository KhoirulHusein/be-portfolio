import { describe, it, expect, beforeEach } from 'vitest'
import { GET as adminProjectsListHandler, POST as adminProjectsCreateHandler } from '@/app/api/v1/admin/projects/route'
import { jsonRequest, readJson } from '@/app/test/setup/request-helpers'
import { cleanupTestData, createProject, createAdminUser, createUser } from '@/app/test/setup/factories'
import { signAccessToken } from '@/lib/auth/jwt'

describe('Admin Project Routes', () => {
  let adminToken: string
  let userToken: string
  let adminUser: any
  let regularUser: any

  beforeEach(async () => {
    await cleanupTestData()
    
    // Create test users
    adminUser = await createAdminUser({
      email: 'admin@test.com',
      username: 'admin',
      password: 'password123'
    })
    
    regularUser = await createUser({
      email: 'user@test.com',
      username: 'user',
      password: 'password123'
    })

    // Generate JWT tokens
    adminToken = signAccessToken({
      sub: adminUser.id,
      username: adminUser.username,
      email: adminUser.email
    })
    userToken = signAccessToken({
      sub: regularUser.id,
      username: regularUser.username,
      email: regularUser.email
    })
  })

  describe('GET /api/v1/admin/projects', () => {
    it('should return all projects for admin', async () => {

      // Create both published and unpublished projects
      await createProject({
        title: 'Published Project',
        published: true,
        createdBy: adminUser.id
      })

      await createProject({
        title: 'Draft Project',
        published: false,
        createdBy: adminUser.id
      })

      const request = jsonRequest('http://localhost:4000/api/v1/admin/projects', 'GET', undefined, {
        'Authorization': `Bearer ${adminToken}`
      })
      const response = await adminProjectsListHandler(request as any)
      const { status, json } = await readJson(response)

      expect(status).toBe(200)
      expect(json.success).toBe(true)
      expect(json.data.total).toBe(2) // Both published and unpublished
      expect(json.data.items).toHaveLength(2)
      
      const titles = json.data.items.map((p: any) => p.title)
      expect(titles).toContain('Published Project')
      expect(titles).toContain('Draft Project')
    })

    it('should filter projects by title', async () => {

      await createProject({
        title: 'React Project',
        createdBy: adminUser.id
      })

      await createProject({
        title: 'Vue Project',
        createdBy: adminUser.id
      })

      // adminToken from setup
      const request = jsonRequest('http://localhost:4000/api/v1/admin/projects?title=React', 'GET', undefined, {
        "Authorization": `Bearer ${adminToken}`
      })
      const response = await adminProjectsListHandler(request as any)
      const { status, json } = await readJson(response)

      expect(status).toBe(200)
      expect(json.data.total).toBe(1)
      expect(json.data.items[0].title).toBe('React Project')
    })

    it('should filter projects by status', async () => {

      await createProject({
        title: 'Completed Project',
        status: 'COMPLETED',
        createdBy: adminUser.id
      })

      await createProject({
        title: 'Ongoing Project',
        status: 'ONGOING',
        createdBy: adminUser.id
      })

      // adminToken from setup
      const request = jsonRequest('http://localhost:4000/api/v1/admin/projects?status=COMPLETED', 'GET', undefined, {
        "Authorization": `Bearer ${adminToken}`
      })
      const response = await adminProjectsListHandler(request as any)
      const { status, json } = await readJson(response)

      expect(status).toBe(200)
      expect(json.data.total).toBe(1)
      expect(json.data.items[0].title).toBe('Completed Project')
    })

    it('should filter projects by published status', async () => {

      await createProject({
        title: 'Published Project',
        published: true,
        createdBy: adminUser.id
      })

      await createProject({
        title: 'Draft Project',
        published: false,
        createdBy: adminUser.id
      })

      // adminToken from setup
      const request = jsonRequest('http://localhost:4000/api/v1/admin/projects?published=true', 'GET', undefined, {
        "Authorization": `Bearer ${adminToken}`
      })
      const response = await adminProjectsListHandler(request as any)
      const { status, json } = await readJson(response)

      expect(status).toBe(200)
      expect(json.data.total).toBe(1)
      expect(json.data.items[0].title).toBe('Published Project')
    })

    it('should return 403 for user without permission', async () => {

      // userToken from setup
      const request = jsonRequest('http://localhost:4000/api/v1/admin/projects', 'GET', undefined, {
        "Authorization": `Bearer ${userToken}`
      })
      const response = await adminProjectsListHandler(request as any)
      const { status, json } = await readJson(response)

      expect(status).toBe(403)
      expect(json.success).toBe(false)
      expect(json.error.message).toBe('Access denied. Required permission: project:read')
    })

    it('should return 401 for unauthenticated request', async () => {
      const request = jsonRequest('http://localhost:4000/api/v1/admin/projects', 'GET')
      const response = await adminProjectsListHandler(request as any)
      const { status, json } = await readJson(response)

      expect(status).toBe(401)
      expect(json.success).toBe(false)
    })
  })

  describe('POST /api/v1/admin/projects', () => {
    it('should create a new project', async () => {

      const projectData = {
        title: 'New Project',
        summary: 'A new test project',
        description: '# New Project\n\nProject description.',
        coverImageUrl: 'https://example.com/cover.jpg',
        galleryUrls: ['https://example.com/1.jpg'],
        repoUrl: 'https://github.com/user/repo',
        liveUrl: 'https://example.com',
        videoUrl: 'https://youtube.com/watch?v=123',
        links: { docs: 'https://docs.example.com' },
        techStack: ['React', 'TypeScript'],
        tags: ['web', 'frontend'],
        status: 'ONGOING',
        featured: true,
        order: 1,
        startDate: new Date('2024-01-01').toISOString(),
        published: false
      }

      // adminToken from setup
      const request = jsonRequest('http://localhost:4000/api/v1/admin/projects', 'POST', projectData, {
        "Authorization": `Bearer ${adminToken}`
      })
      const response = await adminProjectsCreateHandler(request as any)
      const { status, json } = await readJson(response)

      expect(status).toBe(201)
      expect(json.success).toBe(true)
      expect(json.data.title).toBe('New Project')
      expect(json.data.slug).toBe('new-project') // Auto-generated
      expect(json.data.summary).toBe('A new test project')
      expect(json.data.description).toBe('# New Project\n\nProject description.')
      expect(json.data.techStack).toEqual(['React', 'TypeScript'])
      expect(json.data.tags).toEqual(['web', 'frontend'])
      expect(json.data.status).toBe('ONGOING')
      expect(json.data.featured).toBe(true)
      expect(json.data.published).toBe(false)
      expect(json.data.createdBy).toBe(adminUser.id)
      expect(json.data.updatedBy).toBe(adminUser.id)
    })

    it('should create project with custom slug', async () => {

      const projectData = {
        title: 'Custom Project',
        slug: 'custom-project-slug'
      }

      // adminToken from setup
      const request = jsonRequest('http://localhost:4000/api/v1/admin/projects', 'POST', projectData, {
        "Authorization": `Bearer ${adminToken}`
      })
      const response = await adminProjectsCreateHandler(request as any)
      const { status, json } = await readJson(response)

      expect(status).toBe(201)
      expect(json.data.slug).toBe('custom-project-slug')
    })

    it('should return 409 for duplicate slug', async () => {

      // Create first project
      await createProject({
        title: 'First Project',
        slug: 'duplicate-slug',
        createdBy: adminUser.id
      })

      // Try to create second project with same slug
      const projectData = {
        title: 'Second Project',
        slug: 'duplicate-slug'
      }

      // adminToken from setup
      const request = jsonRequest('http://localhost:4000/api/v1/admin/projects', 'POST', projectData, {
        "Authorization": `Bearer ${adminToken}`
      })
      const response = await adminProjectsCreateHandler(request as any)
      const { status, json } = await readJson(response)

      expect(status).toBe(409)
      expect(json.success).toBe(false)
      expect(json.error.message).toBe('Project with this slug already exists')
    })

    it('should validate required fields', async () => {

      const invalidData = {
        // Missing title
        summary: 'Missing title'
      }

      // adminToken from setup
      const request = jsonRequest('http://localhost:4000/api/v1/admin/projects', 'POST', invalidData, {
        "Authorization": `Bearer ${adminToken}`
      })
      const response = await adminProjectsCreateHandler(request as any)
      const { status, json } = await readJson(response)

      expect(status).toBe(400)
      expect(json.success).toBe(false)
      expect(json.error.message).toContain('Title is required')
    })

    it('should validate URL fields', async () => {

      const invalidData = {
        title: 'Test Project',
        coverImageUrl: 'invalid-url',
        repoUrl: 'not-a-url'
      }

      // adminToken from setup
      const request = jsonRequest('http://localhost:4000/api/v1/admin/projects', 'POST', invalidData, {
        "Authorization": `Bearer ${adminToken}`
      })
      const response = await adminProjectsCreateHandler(request as any)
      const { status, json } = await readJson(response)

      expect(status).toBe(400)
      expect(json.success).toBe(false)
      expect(json.error.message).toContain('Cover image URL must be a valid URL')
    })

    it('should return 403 for user without permission', async () => {

      const projectData = {
        title: 'Unauthorized Project'
      }

      // userToken from setup
      const request = jsonRequest('http://localhost:4000/api/v1/admin/projects', 'POST', projectData, {
        "Authorization": `Bearer ${userToken}`
      })
      const response = await adminProjectsCreateHandler(request as any)
      const { status, json } = await readJson(response)

      expect(status).toBe(403)
      expect(json.success).toBe(false)
      expect(json.error.message).toBe('Access denied. Required permission: project:create')
    })

    it('should return 401 for unauthenticated request', async () => {
      const projectData = {
        title: 'Unauthenticated Project'
      }

      const request = jsonRequest('http://localhost:4000/api/v1/admin/projects', 'POST', projectData)
      const response = await adminProjectsCreateHandler(request as any)
      const { status, json } = await readJson(response)

      expect(status).toBe(401)
      expect(json.success).toBe(false)
    })
  })
})