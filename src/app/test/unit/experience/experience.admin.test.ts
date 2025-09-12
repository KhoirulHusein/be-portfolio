import { describe, it, expect, beforeEach } from 'vitest'
import { GET as adminExperiencesHandler, POST as adminCreateExperienceHandler, OPTIONS as adminExperiencesOptionsHandler } from '@/app/api/v1/admin/experiences/route'
import { jsonRequest, readJson } from '@/app/test/setup/request-helpers'
import { cleanupTestData, createExperience, createAdminUser, createUser } from '@/app/test/setup/factories'
import { signAccessToken } from '@/lib/auth/jwt'

describe('Admin Experience Routes', () => {
  beforeEach(async () => {
    await cleanupTestData()
  })

  describe('GET /api/v1/admin/experiences', () => {
    it('should return all experiences for admin (published and unpublished)', async () => {
      // Create admin user
      const admin = await createAdminUser({
        email: 'admin@test.com',
        username: 'admin',
        password: 'password123'
      })

      // Create experiences with different published states
      const experiences = [
        {
          company: 'Published Corp',
          role: 'Developer',
          startDate: new Date('2023-01-01'),
          published: true,
          createdBy: admin.id
        },
        {
          company: 'Unpublished Corp',
          role: 'Engineer',
          startDate: new Date('2022-01-01'),
          published: false,
          createdBy: admin.id
        }
      ]

      for (const expData of experiences) {
        await createExperience(expData)
      }

      // Generate admin token
      const token = signAccessToken({ 
        sub: admin.id, 
        username: admin.username, 
        email: admin.email 
      })

      // Test GET request
      const request = new Request('http://localhost:4000/api/v1/admin/experiences', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const response = await adminExperiencesHandler(request as any)
      const { status, json } = await readJson(response)

      expect(status).toBe(200)
      expect(json.success).toBe(true)
      expect(json.data.items).toHaveLength(2)
      expect(json.data.total).toBe(2)
      
      // Should include both published and unpublished
      const companies = json.data.items.map((exp: any) => exp.company)
      expect(companies).toContain('Published Corp')
      expect(companies).toContain('Unpublished Corp')
    })

    it('should filter by published status', async () => {
      const admin = await createAdminUser({
        email: 'admin@test.com',
        username: 'admin',
        password: 'password123'
      })

      await createExperience({
        company: 'Published Corp',
        role: 'Developer',
        startDate: new Date('2023-01-01'),
        published: true,
        createdBy: admin.id
      })

      await createExperience({
        company: 'Unpublished Corp',
        role: 'Engineer',
        startDate: new Date('2022-01-01'),
        published: false,
        createdBy: admin.id
      })

      const token = signAccessToken({ 
        sub: admin.id, 
        username: admin.username, 
        email: admin.email 
      })

      // Test filtering published only
      const request = new Request('http://localhost:4000/api/v1/admin/experiences?published=true', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const response = await adminExperiencesHandler(request as any)
      const { status, json } = await readJson(response)

      expect(status).toBe(200)
      expect(json.data.total).toBe(1)
      expect(json.data.items[0].company).toBe('Published Corp')
    })

    it('should deny access to regular users', async () => {
      const user = await createUser({
        email: 'user@test.com',
        username: 'user',
        password: 'password123'
      })

      const token = signAccessToken({ 
        sub: user.id, 
        username: user.username, 
        email: user.email 
      })

      const request = new Request('http://localhost:4000/api/v1/admin/experiences', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const response = await adminExperiencesHandler(request as any)
      const { status, json } = await readJson(response)

      expect(status).toBe(403)
      expect(json.success).toBe(false)
      expect(json.error.code).toBe('FORBIDDEN')
      expect(json.error.message).toContain('experience:read')
    })

    it('should deny access without authentication', async () => {
      const request = jsonRequest('http://localhost:4000/api/v1/admin/experiences', 'GET')
      const response = await adminExperiencesHandler(request as any)
      const { status, json } = await readJson(response)

      expect(status).toBe(401)
      expect(json.success).toBe(false)
      expect(json.error.code).toBe('UNAUTHORIZED')
    })
  })

  describe('POST /api/v1/admin/experiences', () => {
    it('should create new experience for admin', async () => {
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

      const experienceData = {
        company: 'New Tech Corp',
        role: 'Senior Backend Engineer',
        companyLogoUrl: 'https://example.com/logo.png',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        location: 'San Francisco, CA',
        employmentType: 'Full-time',
        summary: 'Building scalable backend systems',
        highlights: ['Built microservices', 'Led team of 5'],
        techStack: ['Node.js', 'TypeScript', 'PostgreSQL'],
        order: 1,
        published: true
      }

      const request = jsonRequest('http://localhost:4000/api/v1/admin/experiences', 'POST', experienceData, {
        'Authorization': `Bearer ${token}`
      })
      const response = await adminCreateExperienceHandler(request as any)
      const { status, json } = await readJson(response)

      expect(status).toBe(201)
      expect(json.success).toBe(true)
      expect(json.data).toMatchObject({
        company: experienceData.company,
        role: experienceData.role,
        companyLogoUrl: experienceData.companyLogoUrl,
        location: experienceData.location,
        employmentType: experienceData.employmentType,
        summary: experienceData.summary,
        highlights: experienceData.highlights,
        techStack: experienceData.techStack,
        order: experienceData.order,
        published: experienceData.published,
        createdBy: admin.id,
        updatedBy: admin.id
      })

      expect(json.data.id).toBeDefined()
      expect(json.data.startDate).toBeDefined()
      expect(json.data.endDate).toBeDefined()
    })

    it('should validate required fields', async () => {
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

      // Missing required fields
      const invalidData = {
        // company is missing
        role: 'Developer'
        // startDate is missing
      }

      const request = jsonRequest('http://localhost:4000/api/v1/admin/experiences', 'POST', invalidData, {
        'Authorization': `Bearer ${token}`
      })
      const response = await adminCreateExperienceHandler(request as any)
      const { status, json } = await readJson(response)

      expect(status).toBe(400)
      expect(json.success).toBe(false)
      expect(json.error.code).toBe('VALIDATION_ERROR')
      expect(json.error.message).toContain('Company is required')
    })

    it('should validate employment type', async () => {
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

      const invalidData = {
        company: 'Tech Corp',
        role: 'Developer',
        startDate: '2024-01-01',
        employmentType: 'Invalid Type'
      }

      const request = jsonRequest('http://localhost:4000/api/v1/admin/experiences', 'POST', invalidData, {
        'Authorization': `Bearer ${token}`
      })
      const response = await adminCreateExperienceHandler(request as any)
      const { status, json } = await readJson(response)

      expect(status).toBe(400)
      expect(json.success).toBe(false)
      expect(json.error.code).toBe('VALIDATION_ERROR')
      expect(json.error.message).toContain('Employment type must be one of')
    })

    it('should validate date relationships', async () => {
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

      const invalidData = {
        company: 'Tech Corp',
        role: 'Developer',
        startDate: '2024-01-01',
        endDate: '2023-01-01' // End date before start date
      }

      const request = jsonRequest('http://localhost:4000/api/v1/admin/experiences', 'POST', invalidData, {
        'Authorization': `Bearer ${token}`
      })
      const response = await adminCreateExperienceHandler(request as any)
      const { status, json } = await readJson(response)

      expect(status).toBe(400)
      expect(json.success).toBe(false)
      expect(json.error.code).toBe('VALIDATION_ERROR')
      expect(json.error.message).toContain('End date must be greater than or equal to start date')
    })

    it('should validate URL format', async () => {
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

      const invalidData = {
        company: 'Tech Corp',
        role: 'Developer',
        startDate: '2024-01-01',
        companyLogoUrl: 'invalid-url'
      }

      const request = jsonRequest('http://localhost:4000/api/v1/admin/experiences', 'POST', invalidData, {
        'Authorization': `Bearer ${token}`
      })
      const response = await adminCreateExperienceHandler(request as any)
      const { status, json } = await readJson(response)

      expect(status).toBe(400)
      expect(json.success).toBe(false)
      expect(json.error.code).toBe('VALIDATION_ERROR')
      expect(json.error.message).toContain('Company logo URL must be a valid URL')
    })

    it('should deny access to regular users', async () => {
      const user = await createUser({
        email: 'user@test.com',
        username: 'user',
        password: 'password123'
      })

      const token = signAccessToken({ 
        sub: user.id, 
        username: user.username, 
        email: user.email 
      })

      const experienceData = {
        company: 'Tech Corp',
        role: 'Developer',
        startDate: '2024-01-01'
      }

      const request = jsonRequest('http://localhost:4000/api/v1/admin/experiences', 'POST', experienceData, {
        'Authorization': `Bearer ${token}`
      })
      const response = await adminCreateExperienceHandler(request as any)
      const { status, json } = await readJson(response)

      expect(status).toBe(403)
      expect(json.success).toBe(false)
      expect(json.error.code).toBe('FORBIDDEN')
      expect(json.error.message).toContain('experience:create')
    })
  })

  describe('OPTIONS requests', () => {
    it('should handle CORS preflight for admin experiences route', async () => {
      const request = jsonRequest('http://localhost:4000/api/v1/admin/experiences', 'OPTIONS')
      const response = await adminExperiencesOptionsHandler(request as any)

      expect(response.status).toBe(204)
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('GET')
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST')
      expect(response.headers.get('Access-Control-Allow-Headers')).toContain('Authorization')
    })
  })
})
