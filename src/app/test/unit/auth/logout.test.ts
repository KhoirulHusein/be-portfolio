import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST as registerHandler } from '@/app/api/v1/auth/register/route'
import { POST as loginHandler } from '@/app/api/v1/auth/login/route'
import { POST as logoutHandler, DELETE as logoutDeleteHandler } from '@/app/api/v1/auth/logout/route'
import { jsonRequest, readJson } from '@/app/test/setup/request-helpers'
import { extractCookie, requestWithCookie, checkCookieAttributes } from '@/app/test/setup/cookie-helpers'
import { prisma } from '@/lib/prisma'

// Mock rate limiting
vi.mock('@/lib/auth/rate-limit', () => ({
  checkLoginRateLimit: vi.fn().mockResolvedValue(undefined),
}))

describe('POST/DELETE /api/v1/auth/logout', () => {
  const testUser = {
    email: 'logout@example.com',
    username: 'logoutuser',
    password: 'LogoutPassword123!',
    name: 'Logout User'
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

  it('should logout successfully and clear session cookie', async () => {
    const req = requestWithCookie('http://localhost:4000/api/v1/auth/logout', 'POST', 'portfolio_session', sessionCookie)

    const response = await logoutHandler(req as any)

    expect(response.status).toBe(204) // No Content

    // Should clear session cookie
    const clearedCookie = extractCookie(response, 'portfolio_session')
    expect(clearedCookie).toBe('') // Empty value

    // Check cookie attributes for clearing
    expect(checkCookieAttributes(response, 'portfolio_session', ['Max-Age=0'])).toBe(true)
  })

  it('should work with DELETE method', async () => {
    const req = requestWithCookie('http://localhost:4000/api/v1/auth/logout', 'DELETE', 'portfolio_session', sessionCookie)

    const response = await logoutDeleteHandler(req as any)

    expect(response.status).toBe(204) // No Content

    // Should clear session cookie
    const clearedCookie = extractCookie(response, 'portfolio_session')
    expect(clearedCookie).toBe('') // Empty value
  })

  it('should work even without valid session cookie', async () => {
    const req = new Request('http://localhost:4000/api/v1/auth/logout', {
      method: 'POST'
    })

    const response = await logoutHandler(req as any)

    expect(response.status).toBe(204) // No Content

    // Should still set clear cookie header
    const clearedCookie = extractCookie(response, 'portfolio_session')
    expect(clearedCookie).toBe('') // Empty value
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
    expect(response.headers.get('Access-Control-Allow-Credentials')).toBe('true')
  })

  it('should set CORS headers on logout response', async () => {
    const req = requestWithCookie('http://localhost:4000/api/v1/auth/logout', 'POST', 'portfolio_session', sessionCookie)
    req.headers.set('Origin', 'http://localhost:3000')

    const response = await logoutHandler(req as any)
    
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:3000')
    expect(response.headers.get('Access-Control-Allow-Credentials')).toBe('true')
  })
})
