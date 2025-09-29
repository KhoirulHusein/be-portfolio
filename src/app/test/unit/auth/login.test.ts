import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST as registerHandler } from '@/app/api/v1/auth/register/route'
import { POST as loginHandler } from '@/app/api/v1/auth/login/route'
import { jsonRequest, readJson } from '@/app/test/setup/request-helpers'
import { extractCookie, checkCookieAttributes } from '@/app/test/setup/cookie-helpers'
import { prisma } from '@/lib/prisma'

// Mock rate limiting
vi.mock('@/lib/auth/rate-limit', () => ({
  checkLoginRateLimit: vi.fn().mockResolvedValue(undefined),
  checkRefreshRateLimit: vi.fn().mockResolvedValue(undefined),
}))

describe('POST /api/v1/auth/login', () => {
  const testUser = {
    email: 'login@example.com',
    username: 'loginuser',
    password: 'LoginPassword123!',
    name: 'Login User'
  }

  beforeEach(async () => {
    // Create test user for login tests
    await registerHandler(jsonRequest('http://localhost:4000/api/v1/auth/register', 'POST', testUser) as any)
  })

  it('should login with email successfully', async () => {
    const req = jsonRequest('http://localhost:4000/api/v1/auth/login', 'POST', {
      emailOrUsername: testUser.email,
      password: testUser.password
    })

    const response = await loginHandler(req as any)
    const { status, json } = await readJson(response)

    expect(status).toBe(200)
    expect(json.success).toBe(true)
    
    // Should NOT include tokens in response body anymore
    expect(json.data.accessToken).toBeUndefined()
    expect(json.data.refreshToken).toBeUndefined()
    expect(json.data.message).toBe('Login successful')
    expect(json.data.user).toMatchObject({
      email: testUser.email,
      username: testUser.username
    })

    // Should set session cookie with proper attributes
    const sessionCookie = extractCookie(response, 'portfolio_session')
    expect(sessionCookie).toBeDefined()
    expect(sessionCookie).not.toBe('')

    // Check cookie attributes for test environment
    const setCookieHeader = response.headers.get('set-cookie') || ''
    expect(setCookieHeader.toLowerCase()).toContain('httponly')
    expect(setCookieHeader.toLowerCase()).toContain('path=/')
    expect(setCookieHeader.toLowerCase()).toContain('samesite=lax')
    // Should NOT have Secure flag in test environment
    expect(setCookieHeader.toLowerCase()).not.toContain('secure')
  })

  it('should login with username successfully', async () => {
    const req = jsonRequest('http://localhost:4000/api/v1/auth/login', 'POST', {
      emailOrUsername: testUser.username,
      password: testUser.password
    })

    const response = await loginHandler(req as any)
    const { status, json } = await readJson(response)

    expect(status).toBe(200)
    expect(json.success).toBe(true)
    
    // Should set session cookie
    const sessionCookie = extractCookie(response, 'portfolio_session')
    expect(sessionCookie).toBeDefined()
    expect(sessionCookie).not.toBe('')
  })

  it('should return 401 for invalid email/username', async () => {
    const req = jsonRequest('http://localhost:4000/api/v1/auth/login', 'POST', {
      emailOrUsername: 'nonexistent@example.com',
      password: testUser.password
    })

    const response = await loginHandler(req as any)
    const { status, json } = await readJson(response)

    expect(status).toBe(401)
    expect(json.success).toBe(false)
    expect(json.error.code).toBe('INVALID_CREDENTIALS')
  })

  it('should return 401 for invalid password', async () => {
    const req = jsonRequest('http://localhost:4000/api/v1/auth/login', 'POST', {
      emailOrUsername: testUser.email,
      password: 'WrongPassword123!'
    })

    const response = await loginHandler(req as any)
    const { status, json } = await readJson(response)

    expect(status).toBe(401)
    expect(json.success).toBe(false)
    expect(json.error.code).toBe('INVALID_CREDENTIALS')
  })

  it('should return 400 for missing fields', async () => {
    const req = jsonRequest('http://localhost:4000/api/v1/auth/login', 'POST', {
      emailOrUsername: testUser.email
      // missing password
    })

    const response = await loginHandler(req as any)
    const { status, json } = await readJson(response)

    expect(status).toBe(400)
    expect(json.success).toBe(false)
    expect(json.error.code).toBe('VALIDATION_ERROR')
  })

  it('should handle OPTIONS request (CORS preflight)', async () => {
    const req = new Request('http://localhost:4000/api/v1/auth/login', {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Method': 'POST'
      }
    })

    const response = await loginHandler(req as any)
    
    expect(response.status).toBe(200)
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:3000')
    expect(response.headers.get('Access-Control-Allow-Credentials')).toBe('true')
    expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST')
    expect(response.headers.get('Access-Control-Allow-Headers')).toContain('Content-Type')
  })

  it('should set CORS headers on response', async () => {
    const req = jsonRequest('http://localhost:4000/api/v1/auth/login', 'POST', {
      emailOrUsername: testUser.email,
      password: testUser.password
    }, { 'Origin': 'http://localhost:3000' })

    const response = await loginHandler(req as any)
    
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:3000')
    expect(response.headers.get('Access-Control-Allow-Credentials')).toBe('true')
  })
})
