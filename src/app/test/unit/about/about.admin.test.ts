import { describe, it, expect, beforeEach } from 'vitest'
import { GET as adminAboutGetHandler, POST as adminAboutPostHandler, OPTIONS as adminAboutOptionsHandler } from '@/app/api/v1/admin/about/route'
import { PUT as adminAboutUpdateHandler, DELETE as adminAboutDeleteHandler } from '@/app/api/v1/admin/about/[id]/route'
import { PATCH as adminAboutPublishHandler } from '@/app/api/v1/admin/about/[id]/publish/route'
import { jsonRequest, readJson } from '@/app/test/setup/request-helpers'
import { cleanupTestData, createAbout, createAdminUser, createUser } from '@/app/test/setup/factories'
import { prisma } from '@/lib/prisma'
import { signAccessToken } from '@/lib/auth/jwt'

describe('Admin About Routes', () => {
  let adminUser: any
  let regularUser: any
  let adminToken: string
  let userToken: string

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

  describe('GET /api/v1/admin/about', () => {
    it('should return all about entries for admin', async () => {
      // Create test about entries
      const about1 = await createAbout({
        headline: 'First About',
        bio: 'First bio',
        published: true,
        createdBy: adminUser.id
      })

      const about2 = await createAbout({
        headline: 'Second About',
        bio: 'Second bio',
        published: false,
        createdBy: adminUser.id
      })

      const request = jsonRequest('http://localhost:4000/api/v1/admin/about', 'GET', null, {
        'Authorization': `Bearer ${adminToken}`
      })

      const response = await adminAboutGetHandler(request as any)
      const { status, json } = await readJson(response)

      expect(status).toBe(200)
      expect(json.success).toBe(true)
      expect(json.data.about).toHaveLength(2)
    })

    it('should deny access to regular users', async () => {
      const request = jsonRequest('http://localhost:4000/api/v1/admin/about', 'GET', null, {
        'Authorization': `Bearer ${userToken}`
      })

      const response = await adminAboutGetHandler(request as any)
      const { status, json } = await readJson(response)

      expect(status).toBe(403)
    })

    it('should deny access without authentication', async () => {
      const request = jsonRequest('http://localhost:4000/api/v1/admin/about', 'GET', null)

      const response = await adminAboutGetHandler(request as any)
      const { status, json } = await readJson(response)

      expect(status).toBe(401)
    })
  })

  describe('POST /api/v1/admin/about', () => {
    it('should create new about entry for admin', async () => {
      const aboutData = {
        headline: 'New About',
        subheadline: 'A subheadline',
        bio: 'This is a new bio',
        avatarUrl: 'https://example.com/avatar.jpg',
        skills: ['JavaScript', 'TypeScript', 'Node.js']
      }

      const request = jsonRequest('/api/v1/admin/about', 'POST', aboutData, {
        'Authorization': `Bearer ${adminToken}`
      })

      const response = await adminAboutPostHandler(request)
      const { status, json } = await readJson(response)

      expect(response.status).toBe(201)
      expect(json.success).toBe(true)
      expect(json.data.headline).toBe(aboutData.headline)
      expect(json.data.bio).toBe(aboutData.bio)
      expect(json.data.skills).toEqual(aboutData.skills)
    })

    it('should validate required fields', async () => {
      const invalidData = {
        // missing headline and bio
        skills: ['JavaScript']
      }

      const request = jsonRequest('/api/v1/admin/about', 'POST', invalidData, {
        'Authorization': `Bearer ${adminToken}`
      })

      const response = await adminAboutPostHandler(request)

      expect(response.status).toBe(400)
    })

    it('should deny access to regular users', async () => {
      const aboutData = {
        headline: 'New About',
        bio: 'This is a bio'
      }

      const request = jsonRequest('/api/v1/admin/about', 'POST', aboutData, {
        'Authorization': `Bearer ${userToken}`
      })

      const response = await adminAboutPostHandler(request)

      expect(response.status).toBe(403)
    })
  })

  describe('PUT /api/v1/admin/about/[id]', () => {
    it('should update existing about entry', async () => {
      const about = await createAbout({
        headline: 'Original About',
        bio: 'Original bio',
        published: false,
        createdBy: adminUser.id
      })

      const updateData = {
        headline: 'Updated About',
        bio: 'Updated bio',
        skills: ['React', 'Next.js']
      }

      const request = jsonRequest(`/api/v1/admin/about/${about.id}`, 'PUT', updateData, {
        'Authorization': `Bearer ${adminToken}`
      })

      const response = await adminAboutUpdateHandler(request, { params: Promise.resolve({ id: about.id }) })
      const { status, json } = await readJson(response)

      expect(response.status).toBe(200)
      expect(json.success).toBe(true)
      expect(json.data.headline).toBe(updateData.headline)
      expect(json.data.bio).toBe(updateData.bio)
    })

    it('should return 404 for non-existent about', async () => {
      const updateData = {
        headline: 'Updated About',
        bio: 'Updated bio'
      }

      const request = jsonRequest('/api/v1/admin/about/nonexistent', 'PUT', updateData, {
        'Authorization': `Bearer ${adminToken}`
      })

      const response = await adminAboutUpdateHandler(request, { params: Promise.resolve({ id: 'nonexistent' }) })

      expect(response.status).toBe(404)
    })
  })

  describe('DELETE /api/v1/admin/about/[id]', () => {
    it('should delete existing about entry', async () => {
      const about = await createAbout({
        headline: 'To Delete',
        bio: 'Will be deleted',
        published: false,
        createdBy: adminUser.id
      })

      const request = jsonRequest(`/api/v1/admin/about/${about.id}`, 'DELETE', null, {
        'Authorization': `Bearer ${adminToken}`
      })

      const response = await adminAboutDeleteHandler(request, { params: Promise.resolve({ id: about.id }) })

      expect(response.status).toBe(204)

      // Verify deletion
      const deletedAbout = await prisma.about.findUnique({
        where: { id: about.id }
      })
      expect(deletedAbout).toBeNull()
    })

    it('should return 404 for non-existent about', async () => {
      const request = jsonRequest('/api/v1/admin/about/nonexistent', 'DELETE', null, {
        'Authorization': `Bearer ${adminToken}`
      })

      const response = await adminAboutDeleteHandler(request, { params: Promise.resolve({ id: 'nonexistent' }) })

      expect(response.status).toBe(404)
    })
  })

  describe('PATCH /api/v1/admin/about/[id]/publish', () => {
    it('should publish about entry', async () => {
      const about = await createAbout({
        headline: 'To Publish',
        bio: 'Will be published',
        published: false,
        createdBy: adminUser.id
      })

      const publishData = { published: true }

      const request = jsonRequest(`/api/v1/admin/about/${about.id}/publish`, 'PATCH', publishData, {
        'Authorization': `Bearer ${adminToken}`
      })

      const response = await adminAboutPublishHandler(request, { params: Promise.resolve({ id: about.id }) })
      const { status, json } = await readJson(response)

      expect(response.status).toBe(200)
      expect(json.success).toBe(true)
      expect(json.data.published).toBe(true)
    })

    it('should unpublish other entries when publishing new one', async () => {
      // Create two about entries, one published
      const publishedAbout = await createAbout({
        headline: 'Published About',
        bio: 'Currently published',
        published: true,
        createdBy: adminUser.id
      })

      const unpublishedAbout = await createAbout({
        headline: 'Unpublished About',
        bio: 'Will be published',
        published: false,
        createdBy: adminUser.id
      })

      const publishData = { published: true }

      const request = jsonRequest(`/api/v1/admin/about/${unpublishedAbout.id}/publish`, 'PATCH', publishData, {
        'Authorization': `Bearer ${adminToken}`
      })

      const response = await adminAboutPublishHandler(request, { params: Promise.resolve({ id: unpublishedAbout.id }) })

      expect(response.status).toBe(200)

      // Verify the previously published is now unpublished
      const updatedPublishedAbout = await prisma.about.findUnique({
        where: { id: publishedAbout.id }
      })
      expect(updatedPublishedAbout?.published).toBe(false)

      // Verify the target is now published
      const updatedUnpublishedAbout = await prisma.about.findUnique({
        where: { id: unpublishedAbout.id }
      })
      expect(updatedUnpublishedAbout?.published).toBe(true)
    })
  })

  describe('OPTIONS requests', () => {
    it('should handle CORS preflight for admin about route', async () => {
      const request = new Request('http://localhost:3000/api/v1/admin/about', {
        method: 'OPTIONS',
        headers: {
          'Origin': 'http://localhost:3000',
          'Access-Control-Request-Method': 'GET'
        }
      })

      const response = await adminAboutOptionsHandler(request)

      expect(response.status).toBe(204)
      expect(response.headers.get('Access-Control-Allow-Origin')).toBeTruthy()
    })
  })
})
