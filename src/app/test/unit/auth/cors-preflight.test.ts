import { describe, it, expect } from 'vitest'
import { POST as registerHandler } from '@/app/api/v1/auth/register/route'
import { POST as loginHandler } from '@/app/api/v1/auth/login/route'
import { GET as meHandler } from '@/app/api/v1/auth/me/route'
import { POST as refreshHandler } from '@/app/api/v1/auth/refresh/route'
import { POST as logoutHandler } from '@/app/api/v1/auth/logout/route'
import { PUT as changePasswordHandler } from '@/app/api/v1/auth/change-password/route'

describe('POST /api/v1/auth/CORS Preflight', () => {
  const corsOrigins = ['http://localhost:3000', 'http://localhost:4000']

  describe('OPTIONS requests should be handled for all auth endpoints', () => {
    it('should handle OPTIONS for register endpoint', async () => {
      const req = new Request('http://localhost:4000/api/v1/auth/register', {
        method: 'OPTIONS',
        headers: {
          'Origin': corsOrigins[0],
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'content-type,authorization'
        }
      })

      const response = await registerHandler(req as any)
      
      expect(response.status).toBe(200)
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe(corsOrigins[0])
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST')
      expect(response.headers.get('Access-Control-Allow-Headers')?.toLowerCase()).toContain('content-type')
    })

    it('should handle OPTIONS for login endpoint', async () => {
      const req = new Request('http://localhost:4000/api/v1/auth/login', {
        method: 'OPTIONS',
        headers: {
          'Origin': corsOrigins[0], // Login uses auth-specific CORS (frontend origin only)
          'Access-Control-Request-Method': 'POST'
        }
      })

      const response = await loginHandler(req as any)
      
      expect(response.status).toBe(200)
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe(corsOrigins[0])
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST')
    })

    it('should handle OPTIONS for me endpoint', async () => {
      const req = new Request('http://localhost:4000/api/v1/auth/me', {
        method: 'OPTIONS',
        headers: {
          'Origin': corsOrigins[0],
          'Access-Control-Request-Method': 'GET',
          'Access-Control-Request-Headers': 'authorization'
        }
      })

      const response = await meHandler(req as any)
      
      expect(response.status).toBe(200)
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe(corsOrigins[0])
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('GET')
      expect(response.headers.get('Access-Control-Allow-Headers')?.toLowerCase()).toContain('authorization')
    })

    it('should handle OPTIONS for refresh endpoint', async () => {
      const req = new Request('http://localhost:4000/api/v1/auth/refresh', {
        method: 'OPTIONS',
        headers: {
          'Origin': corsOrigins[0],
          'Access-Control-Request-Method': 'POST'
        }
      })

      const response = await refreshHandler(req as any)
      
      expect(response.status).toBe(200)
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe(corsOrigins[0])
    })

    it('should handle OPTIONS for logout endpoint', async () => {
      const req = new Request('http://localhost:4000/api/v1/auth/logout', {
        method: 'OPTIONS',
        headers: {
          'Origin': corsOrigins[0],
          'Access-Control-Request-Method': 'POST'
        }
      })

      const response = await logoutHandler(req as any)
      
      expect(response.status).toBe(200)
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe(corsOrigins[0])
    })

    it('should handle OPTIONS for change-password endpoint', async () => {
      const req = new Request('http://localhost:4000/api/v1/auth/change-password', {
        method: 'OPTIONS',
        headers: {
          'Origin': corsOrigins[0],
          'Access-Control-Request-Method': 'PUT',
          'Access-Control-Request-Headers': 'content-type,authorization'
        }
      })

      const response = await changePasswordHandler(req as any)
      
      expect(response.status).toBe(200)
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe(corsOrigins[0])
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('PUT')
    })
  })

  describe('CORS headers should be present for allowed origins', () => {
    it('should allow configured frontend origin for register', async () => {
      // Register endpoint uses standard CORS, should allow http://localhost:3000
      const req = new Request('http://localhost:4000/api/v1/auth/register', {
        method: 'OPTIONS',
        headers: {
          'Origin': corsOrigins[0], // http://localhost:3000
          'Access-Control-Request-Method': 'POST'
        }
      })

      const response = await registerHandler(req as any)
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe(corsOrigins[0])
    })

    it('should use frontend origin for auth routes regardless of request origin', async () => {
      // For auth routes, CORS always returns FRONTEND_ORIGIN for credential support
      const req = new Request('http://localhost:4000/api/v1/auth/register', {
        method: 'OPTIONS',
        headers: {
          'Origin': 'http://malicious-site.com',
          'Access-Control-Request-Method': 'POST'
        }
      })

      const response = await registerHandler(req as any)
      // Auth routes always return FRONTEND_ORIGIN (localhost:3000) for credentials
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe(corsOrigins[0])
    })
  })

  describe('Standard CORS headers should be included', () => {
    it('should include proper CORS headers', async () => {
      const req = new Request('http://localhost:4000/api/v1/auth/register', {
        method: 'OPTIONS',
        headers: {
          'Origin': corsOrigins[0],
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'content-type,authorization'
        }
      })

      const response = await registerHandler(req as any)
      
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe(corsOrigins[0])
      expect(response.headers.get('Access-Control-Allow-Methods')).toBeTruthy()
      expect(response.headers.get('Access-Control-Allow-Headers')).toBeTruthy()
      expect(response.headers.get('Access-Control-Max-Age')).toBeTruthy()
    })
  })
})
