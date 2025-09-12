import { describe, it, expect, beforeEach } from 'vitest'
import { PATCH as adminExperiencePublishHandler, OPTIONS as adminExperiencePublishOptionsHandler } from '@/app/api/v1/admin/experiences/[id]/publish/route'
import { jsonRequest, readJson } from '@/app/test/setup/request-helpers'
import { cleanupTestData, createExperience, createAdminUser, createUser } from '@/app/test/setup/factories'
import { signAccessToken } from '@/lib/auth/jwt'

describe('Admin Experience Publish Routes', () => {
  beforeEach(async () => {
    await cleanupTestData()
  })

  describe('PATCH /api/v1/admin/experiences/[id]/publish', () => {
    it('should publish experience for admin', async () => {
      const admin = await createAdminUser({
        email: 'admin@test.com',
        username: 'admin',
        password: 'password123'
      })

      const experience = await createExperience({
        company: 'Test Corp',
        role: 'Engineer',
        startDate: new Date('2023-01-01'),
        published: false,
        createdBy: admin.id
      })

      const token = signAccessToken({ 
        sub: admin.id, 
        username: admin.username, 
        email: admin.email 
      })

      const publishData = {
        published: true
      }

      const request = jsonRequest(`http://localhost:4000/api/v1/admin/experiences/${experience.id}/publish`, 'PATCH', publishData, {
        'Authorization': `Bearer ${token}`
      })
      const response = await adminExperiencePublishHandler(request as any, { params: Promise.resolve({ id: experience.id }) })
      const { status, json } = await readJson(response)

      expect(status).toBe(200)
      expect(json.success).toBe(true)
      expect(json.data).toMatchObject({
        id: experience.id,
        published: true,
        updatedBy: admin.id
      })
    })

    it('should unpublish experience for admin', async () => {
      const admin = await createAdminUser({
        email: 'admin@test.com',
        username: 'admin',
        password: 'password123'
      })

      const experience = await createExperience({
        company: 'Test Corp',
        role: 'Engineer',
        startDate: new Date('2023-01-01'),
        published: true,
        createdBy: admin.id
      })

      const token = signAccessToken({ 
        sub: admin.id, 
        username: admin.username, 
        email: admin.email 
      })

      const publishData = {
        published: false
      }

      const request = jsonRequest(`http://localhost:4000/api/v1/admin/experiences/${experience.id}/publish`, 'PATCH', publishData, {
        'Authorization': `Bearer ${token}`
      })
      const response = await adminExperiencePublishHandler(request as any, { params: Promise.resolve({ id: experience.id }) })
      const { status, json } = await readJson(response)

      expect(status).toBe(200)
      expect(json.success).toBe(true)
      expect(json.data).toMatchObject({
        id: experience.id,
        published: false,
        updatedBy: admin.id
      })
    })

    it('should validate published field is boolean', async () => {
      const admin = await createAdminUser({
        email: 'admin@test.com',
        username: 'admin',
        password: 'password123'
      })

      const experience = await createExperience({
        company: 'Test Corp',
        role: 'Engineer',
        startDate: new Date('2023-01-01'),
        createdBy: admin.id
      })

      const token = signAccessToken({ 
        sub: admin.id, 
        username: admin.username, 
        email: admin.email 
      })

      const invalidData = {
        published: 'invalid-boolean'
      }

      const request = jsonRequest(`http://localhost:4000/api/v1/admin/experiences/${experience.id}/publish`, 'PATCH', invalidData, {
        'Authorization': `Bearer ${token}`
      })
      const response = await adminExperiencePublishHandler(request as any, { params: Promise.resolve({ id: experience.id }) })
      const { status, json } = await readJson(response)

      expect(status).toBe(400)
      expect(json.success).toBe(false)
      expect(json.error.code).toBe('VALIDATION_ERROR')
      expect(json.error.message).toContain('Published must be a boolean')
    })

    it('should require published field', async () => {
      const admin = await createAdminUser({
        email: 'admin@test.com',
        username: 'admin',
        password: 'password123'
      })

      const experience = await createExperience({
        company: 'Test Corp',
        role: 'Engineer',
        startDate: new Date('2023-01-01'),
        createdBy: admin.id
      })

      const token = signAccessToken({ 
        sub: admin.id, 
        username: admin.username, 
        email: admin.email 
      })

      const emptyData = {}

      const request = jsonRequest(`http://localhost:4000/api/v1/admin/experiences/${experience.id}/publish`, 'PATCH', emptyData, {
        'Authorization': `Bearer ${token}`
      })
      const response = await adminExperiencePublishHandler(request as any, { params: Promise.resolve({ id: experience.id }) })
      const { status, json } = await readJson(response)

      expect(status).toBe(400)
      expect(json.success).toBe(false)
      expect(json.error.code).toBe('VALIDATION_ERROR')
      expect(json.error.message).toContain('Published field is required')
    })

    it('should return 404 for non-existent experience', async () => {
      const admin = await createAdminUser({
        email: 'admin@test.com',
        username: 'admin',
        password: 'password123'
      })

      const token = signAccessToken({ 
        sub: admin.id, 
        username: admin.username, 
        email: admin.email 
      })

      const publishData = {
        published: true
      }

      const request = jsonRequest('http://localhost:4000/api/v1/admin/experiences/non-existent-id/publish', 'PATCH', publishData, {
        'Authorization': `Bearer ${token}`
      })
      const response = await adminExperiencePublishHandler(request as any, { params: Promise.resolve({ id: 'non-existent-id' }) })
      const { status, json } = await readJson(response)

      expect(status).toBe(404)
      expect(json.success).toBe(false)
      expect(json.error.code).toBe('NOT_FOUND')
    })

    it('should deny access to regular users', async () => {
      const admin = await createAdminUser({
        email: 'admin@test.com',
        username: 'admin',
        password: 'password123'
      })

      const user = await createUser({
        email: 'user@test.com',
        username: 'user',
        password: 'password123'
      })

      const experience = await createExperience({
        company: 'Test Corp',
        role: 'Engineer',
        startDate: new Date('2023-01-01'),
        createdBy: admin.id
      })

      const token = signAccessToken({ 
        sub: user.id, 
        username: user.username, 
        email: user.email 
      })

      const publishData = {
        published: true
      }

      const request = jsonRequest(`http://localhost:4000/api/v1/admin/experiences/${experience.id}/publish`, 'PATCH', publishData, {
        'Authorization': `Bearer ${token}`
      })
      const response = await adminExperiencePublishHandler(request as any, { params: Promise.resolve({ id: experience.id }) })
      const { status, json } = await readJson(response)

      expect(status).toBe(403)
      expect(json.success).toBe(false)
      expect(json.error.code).toBe('FORBIDDEN')
      expect(json.error.message).toContain('experience:publish')
    })

    it('should deny access without authentication', async () => {
      const admin = await createAdminUser({
        email: 'admin@test.com',
        username: 'admin',
        password: 'password123'
      })

      const experience = await createExperience({
        company: 'Test Corp',
        role: 'Engineer',
        startDate: new Date('2023-01-01'),
        createdBy: admin.id
      })

      const publishData = {
        published: true
      }

      const request = jsonRequest(`http://localhost:4000/api/v1/admin/experiences/${experience.id}/publish`, 'PATCH', publishData)
      const response = await adminExperiencePublishHandler(request as any, { params: Promise.resolve({ id: experience.id }) })
      const { status, json } = await readJson(response)

      expect(status).toBe(401)
      expect(json.success).toBe(false)
      expect(json.error.code).toBe('UNAUTHORIZED')
    })
  })

  describe('OPTIONS requests', () => {
    it('should handle CORS preflight for admin experience publish route', async () => {
      const request = jsonRequest('http://localhost:4000/api/v1/admin/experiences/test-id/publish', 'OPTIONS')
      const response = await adminExperiencePublishOptionsHandler(request as any)

      expect(response.status).toBe(204)
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('PATCH')
      expect(response.headers.get('Access-Control-Allow-Headers')).toContain('Authorization')
    })
  })
})
