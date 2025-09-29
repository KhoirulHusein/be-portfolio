import { describe, it, expect, beforeEach } from 'vitest'
import { 
  GET as adminProjectGetHandler, 
  PATCH as adminProjectUpdateHandler,
  DELETE as adminProjectDeleteHandler 
} from '@/app/api/v1/admin/projects/[id]/route'
import { jsonRequest, readJson } from '@/app/test/setup/request-helpers'
import { cleanupTestData, createProject, createAdminUser, createUser } from '@/app/test/setup/factories'
import { signAccessToken } from '@/lib/auth/jwt'

describe('Admin Project Individual Routes', () => {
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

  describe('GET /api/v1/admin/projects/[id]', () => {
    it('should return project by ID for admin', async () => {
      const project = await createProject({
        title: 'Test Project',
        summary: 'Test summary',
        description: 'Test description',
        techStack: ['React', 'TypeScript'],
        tags: ['web'],
        status: 'ONGOING',
        featured: true,
        published: false,
        createdBy: adminUser.id
      })

      // adminToken from setup
      const request = jsonRequest(`http://localhost:4000/api/v1/admin/projects/${project.id}`, 'GET', undefined, {
        "Authorization": `Bearer ${adminToken}`
      })
      const response = await adminProjectGetHandler(request as any, { 
        params: Promise.resolve({ id: project.id }) 
      })
      const { status, json } = await readJson(response)

      expect(status).toBe(200)
      expect(json.success).toBe(true)
      expect(json.data.id).toBe(project.id)
      expect(json.data.title).toBe('Test Project')
      expect(json.data.published).toBe(false) // Admin can see unpublished
    })

    it('should return 404 for non-existent project', async () => {
      // adminToken from setup
      const request = jsonRequest('http://localhost:4000/api/v1/admin/projects/non-existent-id', 'GET', undefined, {
        "Authorization": `Bearer ${adminToken}`
      })
      const response = await adminProjectGetHandler(request as any, { 
        params: Promise.resolve({ id: 'non-existent-id' }) 
      })
      const { status, json } = await readJson(response)

      expect(status).toBe(404)
      expect(json.success).toBe(false)
      expect(json.error.message).toBe('Project not found')
    })

    it('should return 403 for user without permission', async () => {

      const project = await createProject({
        title: 'Test Project',
        createdBy: adminUser.id
      })

      // userToken from setup
      const request = jsonRequest(`http://localhost:4000/api/v1/admin/projects/${project.id}`, 'GET', undefined, {
        "Authorization": `Bearer ${userToken}`
      })
      const response = await adminProjectGetHandler(request as any, { 
        params: Promise.resolve({ id: project.id }) 
      })
      const { status, json } = await readJson(response)

      expect(status).toBe(403)
      expect(json.success).toBe(false)
      expect(json.error.message).toBe('Access denied. Required permission: project:read')
    })
  })

  describe('PATCH /api/v1/admin/projects/[id]', () => {
    it('should update project successfully', async () => {
      const project = await createProject({
        title: 'Original Title',
        summary: 'Original summary',
        status: 'ONGOING',
        createdBy: adminUser.id
      })

      const updateData = {
        title: 'Updated Title',
        summary: 'Updated summary',
        status: 'COMPLETED',
        techStack: ['Vue', 'JavaScript'],
        tags: ['frontend', 'spa']
      }

      // adminToken from setup
      const request = jsonRequest(`http://localhost:4000/api/v1/admin/projects/${project.id}`, 'PATCH', updateData, {
        "Authorization": `Bearer ${adminToken}`
      })
      const response = await adminProjectUpdateHandler(request as any, { 
        params: Promise.resolve({ id: project.id }) 
      })
      const { status, json } = await readJson(response)

      expect(status).toBe(200)
      expect(json.success).toBe(true)
      expect(json.data.title).toBe('Updated Title')
      expect(json.data.summary).toBe('Updated summary')
      expect(json.data.status).toBe('COMPLETED')
      expect(json.data.techStack).toEqual(['Vue', 'JavaScript'])
      expect(json.data.tags).toEqual(['frontend', 'spa'])
      expect(json.data.updatedBy).toBe(adminUser.id)
    })

    it('should update slug successfully', async () => {

      const project = await createProject({
        title: 'Test Project',
        slug: 'original-slug',
        createdBy: adminUser.id
      })

      const updateData = {
        slug: 'new-slug'
      }

      // adminToken from setup
      const request = jsonRequest(`http://localhost:4000/api/v1/admin/projects/${project.id}`, 'PATCH', updateData, {
        "Authorization": `Bearer ${adminToken}`
      })
      const response = await adminProjectUpdateHandler(request as any, { 
        params: Promise.resolve({ id: project.id }) 
      })
      const { status, json } = await readJson(response)

      expect(status).toBe(200)
      expect(json.data.slug).toBe('new-slug')
    })

    it('should return 409 for duplicate slug', async () => {

      // Create two projects
      const project1 = await createProject({
        title: 'Project 1',
        slug: 'existing-slug',
        createdBy: adminUser.id
      })

      const project2 = await createProject({
        title: 'Project 2',
        slug: 'different-slug',
        createdBy: adminUser.id
      })

      // Try to update project2 to use project1's slug
      const updateData = {
        slug: 'existing-slug'
      }

      // adminToken from setup
      const request = jsonRequest(`http://localhost:4000/api/v1/admin/projects/${project2.id}`, 'PATCH', updateData, {
        "Authorization": `Bearer ${adminToken}`
      })
      const response = await adminProjectUpdateHandler(request as any, { 
        params: Promise.resolve({ id: project2.id }) 
      })
      const { status, json } = await readJson(response)

      expect(status).toBe(409)
      expect(json.success).toBe(false)
      expect(json.error.message).toBe('Project with this slug already exists')
    })

    it('should validate URLs in update', async () => {

      const project = await createProject({
        title: 'Test Project',
        createdBy: adminUser.id
      })

      const updateData = {
        repoUrl: 'invalid-url',
        liveUrl: 'also-invalid'
      }

      // adminToken from setup
      const request = jsonRequest(`http://localhost:4000/api/v1/admin/projects/${project.id}`, 'PATCH', updateData, {
        "Authorization": `Bearer ${adminToken}`
      })
      const response = await adminProjectUpdateHandler(request as any, { 
        params: Promise.resolve({ id: project.id }) 
      })
      const { status, json } = await readJson(response)

      expect(status).toBe(400)
      expect(json.success).toBe(false)
      expect(json.error.message).toContain('Repository URL must be a valid URL')
    })

    it('should return 404 for non-existent project', async () => {

      const updateData = {
        title: 'Updated Title'
      }

      // adminToken from setup
      const request = jsonRequest('http://localhost:4000/api/v1/admin/projects/non-existent-id', 'PATCH', updateData, {
        "Authorization": `Bearer ${adminToken}`
      })
      const response = await adminProjectUpdateHandler(request as any, { 
        params: Promise.resolve({ id: 'non-existent-id' }) 
      })
      const { status, json } = await readJson(response)

      expect(status).toBe(404)
      expect(json.success).toBe(false)
      expect(json.error.message).toBe('Project not found')
    })

    it('should return 403 for user without permission', async () => {

      const user = await createUser({
        email: 'user@test.com',
        username: 'user',
        password: 'password123'
      })

      const project = await createProject({
        title: 'Test Project',
        createdBy: adminUser.id
      })

      const updateData = {
        title: 'Unauthorized Update'
      }

      // userToken from setup
      const request = jsonRequest(`http://localhost:4000/api/v1/admin/projects/${project.id}`, 'PATCH', updateData, {
        "Authorization": `Bearer ${userToken}`
      })
      const response = await adminProjectUpdateHandler(request as any, { 
        params: Promise.resolve({ id: project.id }) 
      })
      const { status, json } = await readJson(response)

      expect(status).toBe(403)
      expect(json.success).toBe(false)
      expect(json.error.message).toBe('Access denied. Required permission: project:update')
    })
  })

  describe('DELETE /api/v1/admin/projects/[id]', () => {
    it('should delete project successfully', async () => {

      const project = await createProject({
        title: 'Project to Delete',
        createdBy: adminUser.id
      })

      // adminToken from setup
      const request = jsonRequest(`http://localhost:4000/api/v1/admin/projects/${project.id}`, 'DELETE', undefined, {
        "Authorization": `Bearer ${adminToken}`
      })
      const response = await adminProjectDeleteHandler(request as any, { 
        params: Promise.resolve({ id: project.id }) 
      })

      expect(response.status).toBe(204)

      // Verify project is actually deleted
      const getRequest = jsonRequest(`http://localhost:4000/api/v1/admin/projects/${project.id}`, 'GET', undefined, {
        "Authorization": `Bearer ${adminToken}`
      })
      const getResponse = await adminProjectGetHandler(getRequest as any, { 
        params: Promise.resolve({ id: project.id }) 
      })
      const { status: getStatus } = await readJson(getResponse)

      expect(getStatus).toBe(404)
    })

    it('should return 404 for non-existent project', async () => {

      // adminToken from setup
      const request = jsonRequest('http://localhost:4000/api/v1/admin/projects/non-existent-id', 'DELETE', undefined, {
        "Authorization": `Bearer ${adminToken}`
      })
      const response = await adminProjectDeleteHandler(request as any, { 
        params: Promise.resolve({ id: 'non-existent-id' }) 
      })
      const { status, json } = await readJson(response)

      expect(status).toBe(404)
      expect(json.success).toBe(false)
      expect(json.error.message).toBe('Project not found')
    })

    it('should return 403 for user without permission', async () => {

      const user = await createUser({
        email: 'user@test.com',
        username: 'user',
        password: 'password123'
      })

      const project = await createProject({
        title: 'Protected Project',
        createdBy: adminUser.id
      })

      // userToken from setup
      const request = jsonRequest(`http://localhost:4000/api/v1/admin/projects/${project.id}`, 'DELETE', undefined, {
        "Authorization": `Bearer ${userToken}`
      })
      const response = await adminProjectDeleteHandler(request as any, { 
        params: Promise.resolve({ id: project.id }) 
      })
      const { status, json } = await readJson(response)

      expect(status).toBe(403)
      expect(json.success).toBe(false)
      expect(json.error.message).toBe('Access denied. Required permission: project:delete')
    })

    it('should return 401 for unauthenticated request', async () => {

      const project = await createProject({
        title: 'Protected Project',
        createdBy: adminUser.id
      })

      const request = jsonRequest(`http://localhost:4000/api/v1/admin/projects/${project.id}`, 'DELETE')
      const response = await adminProjectDeleteHandler(request as any, { 
        params: Promise.resolve({ id: project.id }) 
      })
      const { status, json } = await readJson(response)

      expect(status).toBe(401)
      expect(json.success).toBe(false)
    })
  })
})