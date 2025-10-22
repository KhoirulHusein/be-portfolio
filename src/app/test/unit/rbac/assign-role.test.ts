import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST as registerHandler } from '@/app/api/v1/auth/register/route'
import { POST as loginHandler } from '@/app/api/v1/auth/login/route'
import { POST as assignRoleHandler } from '@/app/api/v1/admin/users/[id]/roles/route'
import { GET as adminUsersHandler } from '@/app/api/v1/admin/users/route'
import { jsonRequest, readJson } from '@/app/test/setup/request-helpers'
import { extractCookie, requestWithCookie } from '@/app/test/setup/cookie-helpers'
import { prisma } from '@/lib/prisma'

// Mock rate limiting
vi.mock('@/lib/auth/rate-limit', () => ({
  checkLoginRateLimit: vi.fn().mockResolvedValue(undefined),
}))

describe('POST /api/v1/admin/users/[id]/roles', () => {
  const testUser = {
    email: 'rbac.assign.user@example.com',
    username: 'rbacassignuser',
    password: 'RbacAssignPassword123!',
    name: 'RBAC Assign User'
  }

  const testAdmin = {
    email: 'rbac.assign.admin@example.com',
    username: 'rbacassignadmin',
    password: 'RbacAssignAdminPassword123!',
    name: 'RBAC Assign Admin'
  }

  let userSessionCookie: string
  let adminSessionCookie: string
  let adminUserId: string
  let testUserId: string

  beforeEach(async () => {
    // Create regular user
    const userRegisterResponse = await registerHandler(jsonRequest('http://localhost:4000/api/v1/auth/register', 'POST', testUser) as any)
    const { json: userRegisterJson } = await readJson(userRegisterResponse)
    testUserId = userRegisterJson.data.id
    
    const userLoginResponse = await loginHandler(jsonRequest('http://localhost:4000/api/v1/auth/login', 'POST', {
      emailOrUsername: testUser.email,
      password: testUser.password
    }) as any)
    
    userSessionCookie = extractCookie(userLoginResponse, 'portfolio_session') || ''

    // Create admin user
    const adminRegisterResponse = await registerHandler(jsonRequest('http://localhost:4000/api/v1/auth/register', 'POST', testAdmin) as any)
    const { json: adminRegisterJson } = await readJson(adminRegisterResponse)
    adminUserId = adminRegisterJson.data.id

    // Find ADMIN role and assign it
    const adminRole = await prisma.role.findUnique({ where: { name: 'ADMIN' } })
    await prisma.userRole.create({
      data: {
        userId: adminUserId,
        roleId: adminRole!.id
      }
    })

    const adminLoginResponse = await loginHandler(jsonRequest('http://localhost:4000/api/v1/auth/login', 'POST', {
      emailOrUsername: testAdmin.email,
      password: testAdmin.password
    }) as any)
    
    adminSessionCookie = extractCookie(adminLoginResponse, 'portfolio_session') || ''
  })

  it('should allow ADMIN to assign role to user', async () => {
    const req = requestWithCookie(`http://localhost:4000/api/v1/admin/users/${testUserId}/roles`, 'POST', 'portfolio_session', adminSessionCookie, {
      roleName: 'ADMIN'
    })

    const response = await assignRoleHandler(req as any, { params: Promise.resolve({ id: testUserId }) })
    const { status, json } = await readJson(response)

    expect(status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.data.message).toContain('ADMIN')
    expect(json.data.message).toContain('assigned')
    expect(json.data.userId).toBe(testUserId)
    expect(json.data.roleName).toBe('ADMIN')
  })

  it('should verify user can access admin endpoint after role assignment', async () => {
    // First assign ADMIN role
    await assignRoleHandler(
      requestWithCookie(`http://localhost:4000/api/v1/admin/users/${testUserId}/roles`, 'POST', 'portfolio_session', adminSessionCookie, {
        roleName: 'ADMIN'
      }) as any,
      { params: Promise.resolve({ id: testUserId }) }
    )

    // Now test if user can access admin endpoint
    const req = requestWithCookie('http://localhost:4000/api/v1/admin/users', 'GET', 'portfolio_session', userSessionCookie)

    const response = await adminUsersHandler(req as any)
    const { status, json } = await readJson(response)

    expect(status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.data.users).toBeDefined()
  })

  it('should reject role assignment from non-admin user', async () => {
    const req = requestWithCookie(`http://localhost:4000/api/v1/admin/users/${testUserId}/roles`, 'POST', 'portfolio_session', userSessionCookie, {
      roleName: 'ADMIN'
    })

    const response = await assignRoleHandler(req as any, { params: Promise.resolve({ id: testUserId }) })
    const { status, json } = await readJson(response)

    expect(status).toBe(403)
    expect(json.success).toBe(false)
    expect(json.error.code).toBe('PERMISSION_DENIED')
  })

  it('should return 400 for missing role name', async () => {
    const req = requestWithCookie(`http://localhost:4000/api/v1/admin/users/${testUserId}/roles`, 'POST', 'portfolio_session', adminSessionCookie, {})

    const response = await assignRoleHandler(req as any, { params: Promise.resolve({ id: testUserId }) })
    const { status, json } = await readJson(response)

    expect(status).toBe(400)
    expect(json.success).toBe(false)
    expect(json.error.code).toBe('VALIDATION_ERROR')
    expect(json.error.message).toContain('Role name is required')
  })

  it('should return 404 for non-existent user', async () => {
    const fakeUserId = 'fake-user-id'
    const req = requestWithCookie(`http://localhost:4000/api/v1/admin/users/${fakeUserId}/roles`, 'POST', 'portfolio_session', adminSessionCookie, {
      roleName: 'ADMIN'
    })

    const response = await assignRoleHandler(req as any, { params: Promise.resolve({ id: fakeUserId }) })
    const { status, json } = await readJson(response)

    expect(status).toBe(404)
    expect(json.success).toBe(false)
    expect(json.error.code).toBe('NOT_FOUND')
  })

  it('should return 404 for non-existent role', async () => {
    const req = requestWithCookie(`http://localhost:4000/api/v1/admin/users/${testUserId}/roles`, 'POST', 'portfolio_session', adminSessionCookie, {
      roleName: 'NONEXISTENT_ROLE'
    })

    const response = await assignRoleHandler(req as any, { params: Promise.resolve({ id: testUserId }) })
    const { status, json } = await readJson(response)

    expect(status).toBe(404)
    expect(json.success).toBe(false)
    expect(json.error.code).toBe('NOT_FOUND')
  })
})
