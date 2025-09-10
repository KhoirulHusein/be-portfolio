import { describe, it, expect, vi } from 'vitest'
import { POST as registerHandler } from '@/app/api/v1/auth/register/route'
import { jsonRequest, readJson } from '@/app/test/setup/request-helpers'
import { prisma } from '@/lib/prisma'

// Mock rate limiting to avoid test interference
vi.mock('@/lib/auth/rate-limit', () => ({
  checkLoginRateLimit: vi.fn().mockResolvedValue(undefined),
}))

describe('POST /api/v1/auth/register', () => {
  it('should register a new user successfully', async () => {
    const req = jsonRequest('http://localhost:4000/api/v1/auth/register', 'POST', {
      email: 'register1@example.com',
      username: 'registeruser1',
      password: 'TestPassword123!',
      name: 'Test User'
    })

    const response = await registerHandler(req as any)
    const { status, json } = await readJson(response)

    expect(status).toBe(201)
    expect(json.success).toBe(true)
    expect(json.data).toMatchObject({
      email: 'register1@example.com',
      username: 'registeruser1'
    })
    expect(json.data.id).toBeDefined()
    expect(json.data.createdAt).toBeDefined()

    // Verify user was created in database
    const user = await prisma.user.findUnique({
      where: { email: 'register1@example.com' }
    })
    expect(user).toBeTruthy()
    expect(user?.username).toBe('registeruser1')
  })

  it('should return 400 for missing required fields', async () => {
    const req = jsonRequest('http://localhost:4000/api/v1/auth/register', 'POST', {
      email: 'register2@example.com',
      // missing username and password
    })

    const response = await registerHandler(req as any)
    const { status, json } = await readJson(response)

    expect(status).toBe(400)
    expect(json.success).toBe(false)
    expect(json.error.code).toBe('VALIDATION_ERROR')
  })

  it('should return 409 for duplicate email', async () => {
    // Create first user
    await registerHandler(jsonRequest('http://localhost:4000/api/v1/auth/register', 'POST', {
      email: 'duplicate@example.com',
      username: 'user1',
      password: 'TestPassword123!',
      name: 'User 1'
    }) as any)

    // Try to create user with same email
    const req = jsonRequest('http://localhost:4000/api/v1/auth/register', 'POST', {
      email: 'duplicate@example.com',
      username: 'user2',
      password: 'TestPassword123!',
      name: 'User 2'
    })

    const response = await registerHandler(req as any)
    const { status, json } = await readJson(response)

    expect(status).toBe(409)
    expect(json.success).toBe(false)
    expect(json.error.code).toBe('USER_EXISTS')
  })

  it('should return 409 for duplicate username', async () => {
    // Create first user
    await registerHandler(jsonRequest('http://localhost:4000/api/v1/auth/register', 'POST', {
      email: 'user3@example.com',
      username: 'duplicateuser',
      password: 'TestPassword123!',
      name: 'User 1'
    }) as any)

    // Try to create user with same username
    const req = jsonRequest('http://localhost:4000/api/v1/auth/register', 'POST', {
      email: 'user4@example.com',
      username: 'duplicateuser',
      password: 'TestPassword123!',
      name: 'User 2'
    })

    const response = await registerHandler(req as any)
    const { status, json } = await readJson(response)

    expect(status).toBe(409)
    expect(json.success).toBe(false)
    expect(json.error.code).toBe('USER_EXISTS')
  })

  it('should handle OPTIONS request (CORS preflight)', async () => {
    const req = new Request('http://localhost:4000/api/v1/auth/register', {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'content-type'
      }
    })

    const response = await registerHandler(req as any)
    
    expect(response.status).toBe(200)
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:3000')
    expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST')
  })
})
