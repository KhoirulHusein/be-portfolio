import { describe, it, expect, beforeAll } from 'vitest'
import { prisma } from '@/lib/prisma'
import { createAdminUser } from '@/app/test/setup/factories'

describe('Debug Test Environment', () => {
  beforeAll(async () => {
    console.log('DATABASE_URL:', process.env.DATABASE_URL)
    console.log('NODE_ENV:', process.env.NODE_ENV)
  })

  it('should connect to database and find roles', async () => {
    const roles = await prisma.role.findMany()
    console.log('Found roles:', roles.map(r => r.name))
    expect(roles.length).toBeGreaterThan(0)
    expect(roles.some(r => r.name === 'USER')).toBe(true)
    expect(roles.some(r => r.name === 'ADMIN')).toBe(true)
  })

  it('should create admin user', async () => {
    const admin = await createAdminUser({
      email: 'test@example.com',
      username: 'testuser',
      password: 'password123'
    })
    
    expect(admin.email).toBe('test@example.com')
    expect(admin.username).toBe('testuser')
  })
})
