import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST as registerHandler } from '@/app/api/v1/auth/register/route'
import { POST as loginHandler } from '@/app/api/v1/auth/login/route'
import { GET as adminUsersHandler, OPTIONS as adminUsersOptionsHandler } from '@/app/api/v1/admin/users/route'
import { jsonRequest, readJson } from '@/app/test/setup/request-helpers'
import { prisma } from '@/lib/prisma'

// Mock rate limiting
vi.mock('@/lib/auth/rate-limit', () => ({
  checkLoginRateLimit: vi.fn().mockResolvedValue(undefined),
}))

describe('GET /api/v1/admin/users - RBAC', () => {
  const testUser = {
    email: 'rbac.user@example.com',
    username: 'rbacuser',
    password: 'RbacPassword123!',
    name: 'RBAC User'
  }

  const testAdmin = {
    email: 'rbac.admin@example.com',
    username: 'rbacadmin',
    password: 'RbacAdminPassword123!',
    name: 'RBAC Admin'
  }

  let userAccessToken: string
  let adminAccessToken: string
  let adminUserId: string

  beforeEach(async () => {
    // Create regular user
    await registerHandler(jsonRequest('http://localhost:4000/api/v1/auth/register', 'POST', testUser) as any)
    
    const userLoginResponse = await loginHandler(jsonRequest('http://localhost:4000/api/v1/auth/login', 'POST', {
      emailOrUsername: testUser.email,
      password: testUser.password
    }) as any)
    
    const { json: userLoginJson } = await readJson(userLoginResponse)
    userAccessToken = userLoginJson.data.accessToken

    // Create admin user
    const adminRegisterResponse = await registerHandler(jsonRequest('http://localhost:4000/api/v1/auth/register', 'POST', testAdmin) as any)
    const { json: adminRegisterJson } = await readJson(adminRegisterResponse)
    adminUserId = adminRegisterJson.data.id

    // Manually assign ADMIN role to admin user
    await prisma.userRole.create({
      data: {
        userId: adminUserId,
        roleId: (await prisma.role.findUnique({ where: { name: 'ADMIN' } }))!.id
      }
    })

    const adminLoginResponse = await loginHandler(jsonRequest('http://localhost:4000/api/v1/auth/login', 'POST', {
      emailOrUsername: testAdmin.email,
      password: testAdmin.password
    }) as any)
    
    const { json: adminLoginJson } = await readJson(adminLoginResponse)
    adminAccessToken = adminLoginJson.data.accessToken
  })

  it('should deny access to admin endpoint for regular USER', async () => {
    const req = new Request('http://localhost:4000/api/v1/admin/users', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${userAccessToken}`,
        'Content-Type': 'application/json'
      }
    })

    const response = await adminUsersHandler(req as any)
    const { status, json } = await readJson(response)

    expect(status).toBe(403)
    expect(json.success).toBe(false)
    expect(json.error.code).toBe('FORBIDDEN')
    expect(json.error.message).toContain('users:read')
  })

  it('should allow access to admin endpoint for ADMIN user', async () => {
    const req = new Request('http://localhost:4000/api/v1/admin/users', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminAccessToken}`,
        'Content-Type': 'application/json'
      }
    })

    const response = await adminUsersHandler(req as any)
    const { status, json } = await readJson(response)

    expect(status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.data.users).toBeDefined()
    expect(Array.isArray(json.data.users)).toBe(true)
    expect(json.data.pagination).toBeDefined()
  })

  it('should return proper user list with roles for admin', async () => {
    const req = new Request('http://localhost:4000/api/v1/admin/users', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminAccessToken}`,
        'Content-Type': 'application/json'
      }
    })

    const response = await adminUsersHandler(req as any)
    const { status, json } = await readJson(response)

    expect(status).toBe(200)
    expect(json.data.users.length).toBeGreaterThan(0)
    
    // Check that users have roles
    const adminUser = json.data.users.find((u: any) => u.email === testAdmin.email)
    expect(adminUser).toBeDefined()
    expect(adminUser.roles).toContain('ADMIN')
    expect(adminUser.roles).toContain('USER') // Should have both

    const regularUser = json.data.users.find((u: any) => u.email === testUser.email)
    expect(regularUser).toBeDefined()
    expect(regularUser.roles).toContain('USER')
    expect(regularUser.roles).not.toContain('ADMIN')
  })

  it('should handle OPTIONS request for admin endpoint', async () => {
    const req = new Request('http://localhost:4000/api/v1/admin/users', {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Method': 'GET'
      }
    })

    const response = await adminUsersOptionsHandler(req as any)
    expect(response.status).toBe(204)
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')
  })
})
