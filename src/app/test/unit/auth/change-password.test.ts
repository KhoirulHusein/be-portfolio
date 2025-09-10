import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST as registerHandler } from '@/app/api/v1/auth/register/route'
import { POST as loginHandler } from '@/app/api/v1/auth/login/route'
import { PUT as changePasswordHandler } from '@/app/api/v1/auth/change-password/route'
import { jsonRequest, readJson } from '@/app/test/setup/request-helpers'
import { comparePassword } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Mock rate limiting
vi.mock('@/lib/auth/rate-limit', () => ({
  checkLoginRateLimit: vi.fn().mockResolvedValue(undefined),
}))

describe('PUT /api/v1/auth/change-password', () => {
  const testUser = {
    email: 'changepass@example.com',
    username: 'changepassuser',
    password: 'OldPassword123!',
    name: 'Change Pass User'
  }

  let accessToken: string
  let userId: string

  beforeEach(async () => {
    // Create test user and get access token
    await registerHandler(jsonRequest('http://localhost:4000/api/v1/auth/register', 'POST', testUser) as any)
    
    const loginResponse = await loginHandler(jsonRequest('http://localhost:4000/api/v1/auth/login', 'POST', {
      emailOrUsername: testUser.email,
      password: testUser.password
    }) as any)
    
    const { json } = await readJson(loginResponse)
    accessToken = json.data.accessToken
    userId = json.data.user.id
  })

  it('should change password successfully', async () => {
    const newPassword = 'NewPassword123!'
    
    const req = jsonRequest('http://localhost:4000/api/v1/auth/change-password', 'PUT', {
      currentPassword: testUser.password,
      newPassword
    }, {
      'Authorization': `Bearer ${accessToken}`
    })

    const response = await changePasswordHandler(req as any)
    const { status, json } = await readJson(response)

    expect(status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.data.message).toBe('Password changed successfully')

    // Verify password was changed in database
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })
    expect(user).toBeTruthy()
    
    const isNewPasswordValid = await comparePassword(newPassword, user!.passwordHash)
    expect(isNewPasswordValid).toBe(true)
    
    const isOldPasswordInvalid = await comparePassword(testUser.password, user!.passwordHash)
    expect(isOldPasswordInvalid).toBe(false)
  })

  it('should return 401 for invalid current password', async () => {
    const req = jsonRequest('http://localhost:4000/api/v1/auth/change-password', 'PUT', {
      currentPassword: 'WrongCurrentPassword123!',
      newPassword: 'NewPassword123!'
    }, {
      'Authorization': `Bearer ${accessToken}`
    })

    const response = await changePasswordHandler(req as any)
    const { status, json } = await readJson(response)

    expect(status).toBe(401)
    expect(json.success).toBe(false)
    expect(json.error.code).toBe('INVALID_CREDENTIALS')
  })

  it('should return 401 for missing authorization header', async () => {
    const req = jsonRequest('http://localhost:4000/api/v1/auth/change-password', 'PUT', {
      currentPassword: testUser.password,
      newPassword: 'NewPassword123!'
    })

    const response = await changePasswordHandler(req as any)
    const { status, json } = await readJson(response)

    expect(status).toBe(401)
    expect(json.success).toBe(false)
    expect(json.error.code).toBe('UNAUTHORIZED')
  })

  it('should return 400 for missing fields', async () => {
    const req = jsonRequest('http://localhost:4000/api/v1/auth/change-password', 'PUT', {
      currentPassword: testUser.password
      // missing newPassword
    }, {
      'Authorization': `Bearer ${accessToken}`
    })

    const response = await changePasswordHandler(req as any)
    const { status, json } = await readJson(response)

    expect(status).toBe(400)
    expect(json.success).toBe(false)
    expect(json.error.code).toBe('VALIDATION_ERROR')
  })

  it('should return 400 for weak new password', async () => {
    const req = jsonRequest('http://localhost:4000/api/v1/auth/change-password', 'PUT', {
      currentPassword: testUser.password,
      newPassword: 'weak' // too weak
    }, {
      'Authorization': `Bearer ${accessToken}`
    })

    const response = await changePasswordHandler(req as any)
    const { status, json } = await readJson(response)

    expect(status).toBe(400)
    expect(json.success).toBe(false)
    expect(json.error.code).toBe('VALIDATION_ERROR')
  })

  it('should handle OPTIONS request (CORS preflight)', async () => {
    const req = new Request('http://localhost:4000/api/v1/auth/change-password', {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Method': 'PUT'
      }
    })

    const response = await changePasswordHandler(req as any)
    
    expect(response.status).toBe(200)
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:3000')
  })
})
