import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST as registerHandler } from '@/app/api/v1/auth/register/route'
import { POST as loginHandler } from '@/app/api/v1/auth/login/route'
import { POST as refreshHandler } from '@/app/api/v1/auth/refresh/route'
import { jsonRequest, readJson } from '@/app/test/setup/request-helpers'
import { prisma } from '@/lib/prisma'

// Mock rate limiting
vi.mock('@/lib/auth/rate-limit', () => ({
  checkLoginRateLimit: vi.fn().mockResolvedValue(undefined),
  checkRefreshRateLimit: vi.fn().mockResolvedValue(undefined),
}))

describe('POST /api/v1/auth/refresh', () => {
  const testUser = {
    email: 'refresh@example.com',
    username: 'refreshuser',
    password: 'RefreshPassword123!',
    name: 'Refresh User'
  }

  let refreshToken: string
  let userId: string

  beforeEach(async () => {
    // Create test user
    await registerHandler(jsonRequest('http://localhost:4000/api/v1/auth/register', 'POST', testUser) as any)
    
    const loginResponse = await loginHandler(jsonRequest('http://localhost:4000/api/v1/auth/login', 'POST', {
      emailOrUsername: testUser.email,
      password: testUser.password
    }) as any)
    
    const { json } = await readJson(loginResponse)
    userId = json.data.user.id
    
    // Get refresh token from database since it's not returned in response for security
    const tokenRecord = await prisma.refreshToken.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    })
    refreshToken = tokenRecord!.token
  })

  it('should refresh tokens successfully', async () => {
    const req = jsonRequest('http://localhost:4000/api/v1/auth/refresh', 'POST', {
      refreshToken
    })

    const response = await refreshHandler(req as any)
    const { status, json } = await readJson(response)

    expect(status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.data.accessToken).toBeDefined()
    expect(json.data.refreshToken).toBeDefined()
    expect(json.data.user).toMatchObject({
      email: testUser.email,
      username: testUser.username
    })

    // Verify old refresh token was revoked
    const oldToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken }
    })
    expect(oldToken?.revoked).toBe(true)

    // Verify new refresh token was created
    const newToken = await prisma.refreshToken.findUnique({
      where: { token: json.data.refreshToken }
    })
    expect(newToken).toBeTruthy()
    expect(newToken?.revoked).toBe(false)
  })

  it('should return 401 for invalid refresh token', async () => {
    const req = jsonRequest('http://localhost:4000/api/v1/auth/refresh', 'POST', {
      refreshToken: 'invalid-refresh-token'
    })

    const response = await refreshHandler(req as any)
    const { status, json } = await readJson(response)

    expect(status).toBe(401)
    expect(json.success).toBe(false)
    expect(json.error.code).toBe('UNAUTHORIZED')
  })

  it('should return 401 for revoked refresh token', async () => {
    // First revoke the token
    await prisma.refreshToken.update({
      where: { token: refreshToken },
      data: { revoked: true }
    })

    const req = jsonRequest('http://localhost:4000/api/v1/auth/refresh', 'POST', {
      refreshToken
    })

    const response = await refreshHandler(req as any)
    const { status, json } = await readJson(response)

    expect(status).toBe(401)
    expect(json.success).toBe(false)
    expect(json.error.code).toBe('TOKEN_REVOKED')
  })

  it('should return 400 for missing refresh token', async () => {
    const req = jsonRequest('http://localhost:4000/api/v1/auth/refresh', 'POST', {
      // missing refreshToken
    })

    const response = await refreshHandler(req as any)
    const { status, json } = await readJson(response)

    expect(status).toBe(400)
    expect(json.success).toBe(false)
    expect(json.error.code).toBe('VALIDATION_ERROR')
  })

  it('should handle OPTIONS request (CORS preflight)', async () => {
    const req = new Request('http://localhost:4000/api/v1/auth/refresh', {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Method': 'POST'
      }
    })

    const response = await refreshHandler(req as any)
    
    expect(response.status).toBe(200)
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:3000')
  })
})
