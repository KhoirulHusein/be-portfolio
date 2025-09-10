import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST as registerHandler } from '@/app/api/v1/auth/register/route'
import { POST as loginHandler } from '@/app/api/v1/auth/login/route'
import { POST as assignRoleHandler } from '@/app/api/v1/admin/users/[id]/roles/route'
import { DELETE as revokeRoleHandler } from '@/app/api/v1/admin/users/[id]/roles/[role]/route'
import { GET as adminUsersHandler } from '@/app/api/v1/admin/users/route'
import { jsonRequest, readJson } from '@/app/test/setup/request-helpers'
import { prisma } from '@/lib/prisma'

// Mock rate limiting
vi.mock('@/lib/auth/rate-limit', () => ({
  checkLoginRateLimit: vi.fn().mockResolvedValue(undefined),
}))

describe('DELETE /api/v1/admin/users/[id]/roles/[role]', () => {
  const testUser = {
    email: 'rbac.revoke.user@example.com',
    username: 'rbacrevokeuser',
    password: 'RbacRevokePassword123!',
    name: 'RBAC Revoke User'
  }

  const testAdmin = {
    email: 'rbac.revoke.admin@example.com',
    username: 'rbacrevokeadmin',
    password: 'RbacRevokeAdminPassword123!',
    name: 'RBAC Revoke Admin'
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

  it('should allow ADMIN to revoke role from user', async () => {
    // First assign ADMIN role to testUser
    const assignReq = new Request(`http://localhost:4000/api/v1/admin/users/${testUserId}/roles`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminAccessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ roleName: 'ADMIN' })
    })

    await assignRoleHandler(assignReq as any, { params: Promise.resolve({ id: testUserId }) })

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
    expect(json.data.message).toContain('ADMIN')
    expect(json.data.message).toContain('revoked')
    expect(json.data.userId).toBe(testUserId)
    expect(json.data.roleName).toBe('ADMIN')
  })

  it('should verify user cannot access admin endpoint after role revocation', async () => {
    // First assign ADMIN role to testUser
    const assignReq = new Request(`http://localhost:4000/api/v1/admin/users/${testUserId}/roles`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminAccessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ roleName: 'ADMIN' })
    })

    await assignRoleHandler(assignReq as any, { params: Promise.resolve({ id: testUserId }) })

    // Then revoke ADMIN role
    await revokeRoleHandler(
      new Request(`http://localhost:4000/api/v1/admin/users/${testUserId}/roles/ADMIN`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${adminAccessToken}`,
          'Content-Type': 'application/json'
        }
      }) as any,
      { params: Promise.resolve({ id: testUserId, role: 'ADMIN' }) }
    )

    // Now test if user can access admin endpoint (should fail)
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
  })

  it('should reject role revocation from non-admin user', async () => {
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
  })

  it('should prevent removing USER role', async () => {
    const req = new Request(`http://localhost:4000/api/v1/admin/users/${testUserId}/roles/USER`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${adminAccessToken}`,
        'Content-Type': 'application/json'
      }
    })

    const response = await revokeRoleHandler(req as any, { params: Promise.resolve({ id: testUserId, role: 'USER' }) })
    const { status, json } = await readJson(response)

    expect(status).toBe(403)
    expect(json.success).toBe(false)
    expect(json.error.code).toBe('FORBIDDEN')
    expect(json.error.message).toContain('Cannot remove default USER role')
  })

  it('should return 404 for non-existent user', async () => {
    const fakeUserId = 'fake-user-id'
    const req = new Request(`http://localhost:4000/api/v1/admin/users/${fakeUserId}/roles/ADMIN`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${adminAccessToken}`,
        'Content-Type': 'application/json'
      }
    })

    const response = await revokeRoleHandler(req as any, { params: Promise.resolve({ id: fakeUserId, role: 'ADMIN' }) })
    const { status, json } = await readJson(response)

    expect(status).toBe(404)
    expect(json.success).toBe(false)
    expect(json.error.code).toBe('NOT_FOUND')
  })
})
