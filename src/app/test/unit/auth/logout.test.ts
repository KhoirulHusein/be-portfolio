import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST as registerHandler } from '@/app/api/v1/auth/register/route'
import { POST as loginHandler } from '@/app/api/v1/auth/login/route'
import { POST as logoutHandler } from '@/app/api/v1/auth/logout/route'
import { jsonRequest, readJson } from '@/app/test/setup/request-helpers'
import { prisma } from '@/lib/prisma'

// Mock rate limiting
vi.mock('@/lib/auth/rate-limit', () => ({
  checkLoginRateLimit: vi.fn().mockResolvedValue(undefined),
}))

describe('POST /api/v1/auth/logout', () => {
  const testUser = {
    email: 'logout@example.com',
    username: 'logoutuser',
    password: 'LogoutPassword123!',
    name: 'Logout User'
  }

  let refreshToken: string

  beforeEach(async () => {
    // Create test user and get refresh token
    await registerHandler(jsonRequest('http://localhost:4000/api/v1/auth/register', 'POST', testUser) as any)
    
    const loginResponse = await loginHandler(jsonRequest('http://localhost:4000/api/v1/auth/login', 'POST', {
      emailOrUsername: testUser.email,
      password: testUser.password
    }) as any)
    
    const { json } = await readJson(loginResponse)
    refreshToken = json.data.refreshToken
  })

  it('should logout successfully and revoke refresh token', async () => {
    const req = jsonRequest('http://localhost:4000/api/v1/auth/logout', 'POST', {
      refreshToken
    })

    const response = await logoutHandler(req as any)
    const { status, json } = await readJson(response)

    expect(status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.data.message).toBe('Logged out successfully')

    // Verify refresh token was revoked
    const token = await prisma.refreshToken.findUnique({
      where: { token: refreshToken }
    })
    expect(token?.revoked).toBe(true)
  })

  it('should return 401 for invalid refresh token', async () => {
    const req = jsonRequest('http://localhost:4000/api/v1/auth/logout', 'POST', {
      refreshToken: 'invalid-refresh-token'
    })

    const response = await logoutHandler(req as any)
    const { status, json } = await readJson(response)

    expect(status).toBe(401)
    expect(json.success).toBe(false)
    expect(json.error.code).toBe('UNAUTHORIZED')
  })

  it('should handle already revoked refresh token gracefully', async () => {
    // First revoke the token
    await prisma.refreshToken.update({
      where: { token: refreshToken },
      data: { revoked: true }
    })

    const req = jsonRequest('http://localhost:4000/api/v1/auth/logout', 'POST', {
      refreshToken
    })

    const response = await logoutHandler(req as any)
    const { status, json } = await readJson(response)

    expect(status).toBe(401)
    expect(json.success).toBe(false)
    expect(json.error.code).toBe('UNAUTHORIZED')
  })

  it('should return 400 for missing refresh token', async () => {
    const req = jsonRequest('http://localhost:4000/api/v1/auth/logout', 'POST', {
      // missing refreshToken
    })

    const response = await logoutHandler(req as any)
    const { status, json } = await readJson(response)

    expect(status).toBe(400)
    expect(json.success).toBe(false)
    expect(json.error.code).toBe('VALIDATION_ERROR')
  })

  it('should handle OPTIONS request (CORS preflight)', async () => {
    const req = new Request('http://localhost:4000/api/v1/auth/logout', {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Method': 'POST'
      }
    })

    const response = await logoutHandler(req as any)
    
    expect(response.status).toBe(200)
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:3000')
  })
})
