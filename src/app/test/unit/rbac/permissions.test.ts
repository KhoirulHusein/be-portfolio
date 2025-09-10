import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST as registerHandler } from '@/app/api/v1/auth/register/route'
import { POST as loginHandler } from '@/app/api/v1/auth/login/route'
import { POST as assignRoleHandler } from '@/app/api/v1/admin/users/[id]/roles/route'
import { DELETE as revokeRoleHandler } from '@/app/api/v1/admin/users/[id]/roles/[role]/route'
import { jsonRequest, readJson } from '@/app/test/setup/request-helpers'
import { prisma } from '@/lib/prisma'

// Mock rate limiting
vi.mock('@/lib/auth/rate-limit', () => ({
  checkLoginRateLimit: vi.fn().mockResolvedValue(undefined),
}))

describe('RBAC Permissions', () => {
  const testUser = {
    email: 'rbac.permissions.user@example.com',
    username: 'rbacpermissionsuser',
    password: 'RbacPermissionsPassword123!',
    name: 'RBAC Permissions User'
  }

  const testAdmin = {
    email: 'rbac.permissions.admin@example.com',
    username: 'rbacpermissionsadmin',
    password: 'RbacPermissionsAdminPassword123!',
    name: 'RBAC Permissions Admin'
  }

  let userAccessToken: string
  let adminAccessToken: string
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
    
    const { json: userLoginJson } = await readJson(userLoginResponse)
    userAccessToken = userLoginJson.data.accessToken

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
    
    const { json: adminLoginJson } = await readJson(adminLoginResponse)
    adminAccessToken = adminLoginJson.data.accessToken
  })

  it('should allow ADMIN with role:assign permission to assign roles', async () => {
    const req = jsonRequest(`http://localhost:4000/api/v1/admin/users/${testUserId}/roles`, 'POST', {
      roleName: 'ADMIN'
    })
    
    req.headers.set('Authorization', `Bearer ${adminAccessToken}`)

    const response = await assignRoleHandler(req as any, { params: Promise.resolve({ id: testUserId }) })
    const { status, json } = await readJson(response)

    expect(status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.data.message).toContain('assigned')
  })

  it('should allow ADMIN with role:revoke permission to revoke roles', async () => {
    // First assign ADMIN role to test user
    const adminRole = await prisma.role.findUnique({ where: { name: 'ADMIN' } })
    await prisma.userRole.create({
      data: {
        userId: testUserId,
        roleId: adminRole!.id
      }
    })

    // Then revoke it
    const req = new Request(`http://localhost:4000/api/v1/admin/users/${testUserId}/roles/ADMIN`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${adminAccessToken}`,
        'Content-Type': 'application/json'
      }
    })

    const response = await revokeRoleHandler(req as any, { params: Promise.resolve({ id: testUserId, role: 'ADMIN' }) })
    const { status, json } = await readJson(response)

    expect(status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.data.message).toContain('revoked')
  })

  it('should deny role:assign permission to USER role', async () => {
    const req = jsonRequest(`http://localhost:4000/api/v1/admin/users/${testUserId}/roles`, 'POST', {
      roleName: 'ADMIN'
    })
    
    req.headers.set('Authorization', `Bearer ${userAccessToken}`)

    const response = await assignRoleHandler(req as any, { params: Promise.resolve({ id: testUserId }) })
    const { status, json } = await readJson(response)

    expect(status).toBe(403)
    expect(json.success).toBe(false)
    expect(json.error.code).toBe('PERMISSION_DENIED')
    expect(json.error.message).toContain('role:assign')
  })

  it('should deny role:revoke permission to USER role', async () => {
    const req = new Request(`http://localhost:4000/api/v1/admin/users/${testUserId}/roles/ADMIN`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${userAccessToken}`,
        'Content-Type': 'application/json'
      }
    })

    const response = await revokeRoleHandler(req as any, { params: Promise.resolve({ id: testUserId, role: 'ADMIN' }) })
    const { status, json } = await readJson(response)

    expect(status).toBe(403)
    expect(json.success).toBe(false)
    expect(json.error.code).toBe('PERMISSION_DENIED')
    expect(json.error.message).toContain('role:revoke')
  })

  it('should handle OPTIONS requests for permission-protected endpoints', async () => {
    const assignReq = new Request(`http://localhost:4000/api/v1/admin/users/${testUserId}/roles`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Method': 'POST'
      }
    })

    const assignResponse = await assignRoleHandler(assignReq as any, { params: Promise.resolve({ id: testUserId }) })
    expect(assignResponse.status).toBe(200)
    expect(assignResponse.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:3000')

    const revokeReq = new Request(`http://localhost:4000/api/v1/admin/users/${testUserId}/roles/ADMIN`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Method': 'DELETE'
      }
    })

    const revokeResponse = await revokeRoleHandler(revokeReq as any, { params: Promise.resolve({ id: testUserId, role: 'ADMIN' }) })
    expect(revokeResponse.status).toBe(200)
    expect(revokeResponse.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:3000')
  })
})
