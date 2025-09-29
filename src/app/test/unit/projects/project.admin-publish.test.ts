import { describe, it, expect, beforeEach } from 'vitest'
import { PATCH as adminProjectPublishHandler } from '@/app/api/v1/admin/projects/[id]/publish/route'
import { jsonRequest, readJson } from '@/app/test/setup/request-helpers'
import { cleanupTestData, createProject, createAdminUser, createUser } from '@/app/test/setup/factories'
import { signAccessToken } from '@/lib/auth/jwt'

describe('Admin Project Publish Routes', () => {
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

  describe('PATCH /api/v1/admin/projects/[id]/publish', () => {
    it('should successfully publish project', async () => {

      const project = await createProject({
        title: 'Draft Project',
        published: false,
        createdBy: adminUser.id
      })

      const publishData = {
        published: true
      }

      // adminToken from setup
      const request = jsonRequest(`http://localhost:4000/api/v1/admin/projects/${project.id}/publish`, 'PATCH', publishData, {
        "Authorization": `Bearer ${adminToken}`
      })
      const response = await adminProjectPublishHandler(request as any, { 
        params: Promise.resolve({ id: project.id }) 
      })
      const { status, json } = await readJson(response)

      expect(status).toBe(200)
      expect(json.success).toBe(true)
      expect(json.data.published).toBe(true)
      expect(json.data.updatedBy).toBe(adminUser.id)
    })

    it('should successfully unpublish project', async () => {

      const project = await createProject({
        title: 'Published Project',
        published: true,
        createdBy: adminUser.id
      })

      const unpublishData = {
        published: false
      }

      // adminToken from setup
      const request = jsonRequest(`http://localhost:4000/api/v1/admin/projects/${project.id}/publish`, 'PATCH', unpublishData, {
        "Authorization": `Bearer ${adminToken}`
      })
      const response = await adminProjectPublishHandler(request as any, { 
        params: Promise.resolve({ id: project.id }) 
      })
      const { status, json } = await readJson(response)

      expect(status).toBe(200)
      expect(json.success).toBe(true)
      expect(json.data.published).toBe(false)
      expect(json.data.updatedBy).toBe(adminUser.id)
    })

    it('should return 400 for invalid published value', async () => {

      const project = await createProject({
        title: 'Test Project',
        createdBy: adminUser.id
      })

      const invalidData = {
        published: 'invalid' // Should be boolean
      }

      // adminToken from setup
      const request = jsonRequest(`http://localhost:4000/api/v1/admin/projects/${project.id}/publish`, 'PATCH', invalidData, {
        "Authorization": `Bearer ${adminToken}`
      })
      const response = await adminProjectPublishHandler(request as any, { 
        params: Promise.resolve({ id: project.id }) 
      })
      const { status, json } = await readJson(response)

      expect(status).toBe(400)
      expect(json.success).toBe(false)
      expect(json.error.message).toContain('Published must be a boolean')
    })

    it('should return 400 for missing published field', async () => {

      const project = await createProject({
        title: 'Test Project',
        createdBy: adminUser.id
      })

      const invalidData = {
        // Missing published field
      }

      // adminToken from setup
      const request = jsonRequest(`http://localhost:4000/api/v1/admin/projects/${project.id}/publish`, 'PATCH', invalidData, {
        "Authorization": `Bearer ${adminToken}`
      })
      const response = await adminProjectPublishHandler(request as any, { 
        params: Promise.resolve({ id: project.id }) 
      })
      const { status, json } = await readJson(response)

      expect(status).toBe(400)
      expect(json.success).toBe(false)
      expect(json.error.message).toContain('Published field is required')
    })

    it('should return 404 for non-existent project', async () => {

      const publishData = {
        published: true
      }

      // adminToken from setup
      const request = jsonRequest('http://localhost:4000/api/v1/admin/projects/non-existent-id/publish', 'PATCH', publishData, {
        "Authorization": `Bearer ${adminToken}`
      })
      const response = await adminProjectPublishHandler(request as any, { 
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

      const publishData = {
        published: true
      }

      // userToken from setup
      const request = jsonRequest(`http://localhost:4000/api/v1/admin/projects/${project.id}/publish`, 'PATCH', publishData, {
        "Authorization": `Bearer ${userToken}`
      })
      const response = await adminProjectPublishHandler(request as any, { 
        params: Promise.resolve({ id: project.id }) 
      })
      const { status, json } = await readJson(response)

      expect(status).toBe(403)
      expect(json.success).toBe(false)
      expect(json.error.message).toBe('Access denied. Required permission: project:publish')
    })

    it('should return 401 for unauthenticated request', async () => {

      const project = await createProject({
        title: 'Protected Project',
        createdBy: adminUser.id
      })

      const publishData = {
        published: true
      }

      const request = jsonRequest(`http://localhost:4000/api/v1/admin/projects/${project.id}/publish`, 'PATCH', publishData)
      const response = await adminProjectPublishHandler(request as any, { 
        params: Promise.resolve({ id: project.id }) 
      })
      const { status, json } = await readJson(response)

      expect(status).toBe(401)
      expect(json.success).toBe(false)
    })

    it('should handle CORS preflight for PATCH method', async () => {

      const project = await createProject({
        title: 'Test Project',
        createdBy: adminUser.id
      })

      // Import OPTIONS handler
      const { OPTIONS: adminProjectPublishOptionsHandler } = await import('@/app/api/v1/admin/projects/[id]/publish/route')

      const request = jsonRequest(`http://localhost:4000/api/v1/admin/projects/${project.id}/publish`, 'OPTIONS', undefined, {
        'Origin': 'https://example.com',
        'Access-Control-Request-Method': 'PATCH',
        'Access-Control-Request-Headers': 'Content-Type, Authorization'
      })
      
      const response = await adminProjectPublishOptionsHandler(request as any)

      expect(response.status).toBe(204)
      expect(response.headers.get('Access-Control-Allow-Methods')).toBe('PATCH, OPTIONS')
      expect(response.headers.get('Access-Control-Allow-Headers')).toBe('Content-Type, Authorization')
    })

    it('should set CORS headers on response', async () => {

      const project = await createProject({
        title: 'Test Project',
        published: false,
        createdBy: adminUser.id
      })

      const publishData = {
        published: true
      }

      // adminToken from setup
      const request = jsonRequest(`http://localhost:4000/api/v1/admin/projects/${project.id}/publish`, 'PATCH', publishData, {
        "Authorization": `Bearer ${adminToken}`,
        'Origin': 'https://example.com'
      })
      const response = await adminProjectPublishHandler(request as any, { 
        params: Promise.resolve({ id: project.id }) 
      })

      // Debug: Check actual headers in response
      // CORS headers should be set by setCORSHeaders function
      expect(response.headers.has('Access-Control-Allow-Origin')).toBeTruthy()
    })
  })
})