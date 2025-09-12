import { describe, it, expect, beforeEach } from 'vitest'
import { GET as experiencesHandler } from '@/app/api/v1/experiences/route'
import { jsonRequest, readJson } from '@/app/test/setup/request-helpers'
import { cleanupTestData, createExperience, createAdminUser } from '@/app/test/setup/factories'

describe('Public Experience List Routes', () => {
  beforeEach(async () => {
    await cleanupTestData()
  })

  describe('GET /api/v1/experiences', () => {
    it('should return only published experiences', async () => {
      // Create admin user for experience creation
      const admin = await createAdminUser({
        email: 'admin@test.com',
        username: 'admin',
        password: 'password123'
      })

      // Create one published experience
      await createExperience({
        company: 'Tech Corp',
        role: 'Senior Developer',
        startDate: new Date('2023-01-01'),
        published: true,
        createdBy: admin.id
      })

      // Create one unpublished experience
      await createExperience({
        company: 'Private Corp',
        role: 'Developer',
        startDate: new Date('2021-01-01'),
        published: false,
        createdBy: admin.id
      })

      // Test GET request
      const request = jsonRequest('http://localhost:4000/api/v1/experiences', 'GET')
      const response = await experiencesHandler(request as any)
      const { status, json } = await readJson(response)

      expect(status).toBe(200)
      expect(json.success).toBe(true)
      expect(json.data).toHaveProperty('items')
      expect(json.data).toHaveProperty('total', 1) // Only published ones
      expect(json.data.items).toHaveLength(1)
      expect(json.data.items[0].company).toBe('Tech Corp')
      expect(json.data.items[0]).toHaveProperty('id')
      expect(json.data.items[0]).toHaveProperty('role', 'Senior Developer')
    })
  })
})
