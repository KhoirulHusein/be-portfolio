import { describe, it, expect, beforeEach } from 'vitest'
import { GET as adminExperienceGetHandler, PUT as adminExperienceUpdateHandler, DELETE as adminExperienceDeleteHandler, OPTIONS as adminExperienceOptionsHandler } from '@/app/api/v1/admin/experiences/[id]/route'
import { jsonRequest, readJson } from '@/app/test/setup/request-helpers'
import { cleanupTestData, createExperience, createAdminUser, createUser } from '@/app/test/setup/factories'
import { signAccessToken } from '@/lib/auth/jwt'

describe('Admin Experience Individual Routes', () => {
  beforeEach(async () => {
    await cleanupTestData()
  })

  describe('GET /api/v1/admin/experiences/[id]', () => {
    it('should return experience by id for admin', async () => {
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

      const request = new Request(`http://localhost:4000/api/v1/admin/experiences/${experience.id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const response = await adminExperienceGetHandler(request as any, { params: Promise.resolve({ id: experience.id }) })
      const { status, json } = await readJson(response)

      expect(status).toBe(200)
      expect(json.success).toBe(true)
      expect(json.data).toMatchObject({
        id: experience.id,
        company: 'Test Corp',
        role: 'Engineer',
        published: false
      })
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

      const request = new Request('http://localhost:4000/api/v1/admin/experiences/non-existent-id', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const response = await adminExperienceGetHandler(request as any, { params: Promise.resolve({ id: 'non-existent-id' }) })
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

      const request = new Request(`http://localhost:4000/api/v1/admin/experiences/${experience.id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const response = await adminExperienceGetHandler(request as any, { params: Promise.resolve({ id: experience.id }) })
      const { status, json } = await readJson(response)

      expect(status).toBe(403)
      expect(json.success).toBe(false)
      expect(json.error.code).toBe('FORBIDDEN')
    })
  })

  describe('PUT /api/v1/admin/experiences/[id]', () => {
    it('should update experience for admin', async () => {
      const admin = await createAdminUser({
        email: 'admin@test.com',
        username: 'admin',
        password: 'password123'
      })

      const experience = await createExperience({
        company: 'Old Corp',
        role: 'Engineer',
        startDate: new Date('2023-01-01'),
        createdBy: admin.id
      })

      const token = signAccessToken({ 
        sub: admin.id, 
        username: admin.username, 
        email: admin.email 
      })

      const updateData = {
        company: 'Updated Corp',
        role: 'Senior Engineer',
        location: 'New York, NY',
        summary: 'Updated summary'
      }

      const request = jsonRequest(`http://localhost:4000/api/v1/admin/experiences/${experience.id}`, 'PUT', updateData, {
        'Authorization': `Bearer ${token}`
      })
      const response = await adminExperienceUpdateHandler(request as any, { params: Promise.resolve({ id: experience.id }) })
      const { status, json } = await readJson(response)

      expect(status).toBe(200)
      expect(json.success).toBe(true)
      expect(json.data).toMatchObject({
        id: experience.id,
        company: 'Updated Corp',
        role: 'Senior Engineer',
        location: 'New York, NY',
        summary: 'Updated summary',
        updatedBy: admin.id
      })
    })

    it('should validate update data', async () => {
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

      const invalidUpdateData = {
        employmentType: 'Invalid Type'
      }

      const request = jsonRequest(`http://localhost:4000/api/v1/admin/experiences/${experience.id}`, 'PUT', invalidUpdateData, {
        'Authorization': `Bearer ${token}`
      })
      const response = await adminExperienceUpdateHandler(request as any, { params: Promise.resolve({ id: experience.id }) })
      const { status, json } = await readJson(response)

      expect(status).toBe(400)
      expect(json.success).toBe(false)
      expect(json.error.code).toBe('VALIDATION_ERROR')
      expect(json.error.message).toContain('Employment type must be one of')
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

      const updateData = {
        company: 'Updated Corp'
      }

      const request = jsonRequest('http://localhost:4000/api/v1/admin/experiences/non-existent-id', 'PUT', updateData, {
        'Authorization': `Bearer ${token}`
      })
      const response = await adminExperienceUpdateHandler(request as any, { params: Promise.resolve({ id: 'non-existent-id' }) })
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

      const updateData = {
        company: 'Updated Corp'
      }

      const request = jsonRequest(`http://localhost:4000/api/v1/admin/experiences/${experience.id}`, 'PUT', updateData, {
        'Authorization': `Bearer ${token}`
      })
      const response = await adminExperienceUpdateHandler(request as any, { params: Promise.resolve({ id: experience.id }) })
      const { status, json } = await readJson(response)

      expect(status).toBe(403)
      expect(json.success).toBe(false)
      expect(json.error.code).toBe('FORBIDDEN')
    })
  })

  describe('DELETE /api/v1/admin/experiences/[id]', () => {
    it('should delete experience for admin', async () => {
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

      const request = jsonRequest(`http://localhost:4000/api/v1/admin/experiences/${experience.id}`, 'DELETE', {}, {
        'Authorization': `Bearer ${token}`
      })
      const response = await adminExperienceDeleteHandler(request as any, { params: Promise.resolve({ id: experience.id }) })

      expect(response.status).toBe(204)
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

      const request = jsonRequest('http://localhost:4000/api/v1/admin/experiences/non-existent-id', 'DELETE', {}, {
        'Authorization': `Bearer ${token}`
      })
      const response = await adminExperienceDeleteHandler(request as any, { params: Promise.resolve({ id: 'non-existent-id' }) })
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

      const request = jsonRequest(`http://localhost:4000/api/v1/admin/experiences/${experience.id}`, 'DELETE', {}, {
        'Authorization': `Bearer ${token}`
      })
      const response = await adminExperienceDeleteHandler(request as any, { params: Promise.resolve({ id: experience.id }) })
      const { status, json } = await readJson(response)

      expect(status).toBe(403)
      expect(json.success).toBe(false)
      expect(json.error.code).toBe('FORBIDDEN')
    })
  })

  describe('OPTIONS requests', () => {
    it('should handle CORS preflight for admin experience individual route', async () => {
      const request = jsonRequest('http://localhost:4000/api/v1/admin/experiences/test-id', 'OPTIONS')
      const response = await adminExperienceOptionsHandler(request as any)

      expect(response.status).toBe(204)
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('GET')
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('PUT')
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('DELETE')
      expect(response.headers.get('Access-Control-Allow-Headers')).toContain('Authorization')
    })
  })
})
