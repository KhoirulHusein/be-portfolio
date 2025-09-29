import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST as registerHandler } from '@/app/api/v1/auth/register/route'
import { POST as loginHandler } from '@/app/api/v1/auth/login/route'
import { GET as meHandler } from '@/app/api/v1/auth/me/route'
import { jsonRequest, readJson } from '@/app/test/setup/request-helpers'
import { extractCookie, requestWithCookie } from '@/app/test/setup/cookie-helpers'

// Mock rate limiting
vi.mock('@/lib/auth/rate-limit', () => ({
  checkLoginRateLimit: vi.fn().mockResolvedValue(undefined),
}))

describe('GET /api/v1/auth/me', () => {
  const testUser = {
    email: 'me@example.com',
    username: 'meuser',
    password: 'MePassword123!',
    name: 'Me User'
  }

  let sessionCookie: string

  beforeEach(async () => {
    // Create test user and get session cookie
    await registerHandler(jsonRequest('http://localhost:4000/api/v1/auth/register', 'POST', testUser) as any)
    
    const loginResponse = await loginHandler(jsonRequest('http://localhost:4000/api/v1/auth/login', 'POST', {
      emailOrUsername: testUser.email,
      password: testUser.password
    }) as any)
    
    sessionCookie = extractCookie(loginResponse, 'portfolio_session') || ''
  })

  it('should return user data with valid session cookie', async () => {
    const req = requestWithCookie('http://localhost:4000/api/v1/auth/me', 'GET', 'portfolio_session', sessionCookie)

    const response = await meHandler(req as any)
    const { status, json } = await readJson(response)

    expect(status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.data).toMatchObject({
      email: testUser.email,
      username: testUser.username
    })
    expect(json.data.id).toBeDefined()
  })

  it('should return 401 for missing session cookie', async () => {
    const req = new Request('http://localhost:4000/api/v1/auth/me', {
      method: 'GET'
    })

    const response = await meHandler(req as any)
    const { status, json } = await readJson(response)

    expect(status).toBe(401)
    expect(json.success).toBe(false)
    expect(json.error.code).toBe('UNAUTHORIZED')
  })

  it('should return 401 for invalid session cookie', async () => {
    const req = requestWithCookie('http://localhost:4000/api/v1/auth/me', 'GET', 'portfolio_session', 'invalid-cookie-value')

    const response = await meHandler(req as any)
    const { status, json } = await readJson(response)

    expect(status).toBe(401)
    expect(json.success).toBe(false)
    expect(json.error.code).toBe('UNAUTHORIZED')
  })

  it('should still support Bearer token as fallback', async () => {
    // First login to get a session token for testing Bearer fallback
    const loginResponse = await loginHandler(jsonRequest('http://localhost:4000/api/v1/auth/login', 'POST', {
      emailOrUsername: testUser.email,
      password: testUser.password
    }) as any)
    
    const loginCookie = extractCookie(loginResponse, 'portfolio_session') || ''
    
    const req = new Request('http://localhost:4000/api/v1/auth/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${loginCookie}` // Use session token as Bearer
      }
    })

    const response = await meHandler(req as any)
    const { status, json } = await readJson(response)

    expect(status).toBe(200)
    expect(json.success).toBe(true)
  })

  it('should handle OPTIONS request (CORS preflight)', async () => {
    const req = new Request('http://localhost:4000/api/v1/auth/me', {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Method': 'GET'
      }
    })

    const response = await meHandler(req as any)
    
    expect(response.status).toBe(200)
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:3000')
    expect(response.headers.get('Access-Control-Allow-Credentials')).toBe('true')
  })
})
