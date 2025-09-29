import 'node:test' // no-op, keep Node types happy
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as url from 'node:url'
import { config as loadEnv } from 'dotenv'
import { beforeAll, afterAll } from 'vitest'
import { prisma } from '@/lib/prisma'
import './prisma-clean' // registers hooks

// Load .env.test if present
const root = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '../../../..')
const envTest = path.join(root, '.env.test')
if (fs.existsSync(envTest)) {
  loadEnv({ path: envTest, override: true })
}

// Set NODE_ENV for test
Object.assign(process.env, { NODE_ENV: 'test' })

// Sanity check minimal env
const required = ['DATABASE_URL', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET']
for (const k of required) {
  if (!process.env[k]) {
    throw new Error(`[TEST ENV] Missing ${k} in .env.test`)
  }
}

// Optional: ensure prisma connects early & seed if needed
beforeAll(async () => {
  await prisma.$connect()
  
  // Check if we need to seed the test database
  const roleCount = await prisma.role.count()
  if (roleCount === 0) {
    console.log('🌱 Seeding test database...')
    try {
      // Create basic roles and permissions manually for test
      const adminRole = await prisma.role.create({ data: { name: 'ADMIN' } })
      const userRole = await prisma.role.create({ data: { name: 'USER' } })
      
      // Create basic permissions
      const permissions = [
        'about:read', 'about:write', 'about:delete', 'about:publish',
        'user:read', 'user:write', 'user:delete', 'portfolio:read', 'portfolio:write',
        'experience:read', 'experience:write', 'experience:delete', 'experience:publish',
        'project:read', 'project:write', 'project:delete', 'project:publish'
      ]
      
      for (const key of permissions) {
        await prisma.permission.create({ data: { key } })
      }
      
      console.log('✅ Test database seeded with roles and permissions')
    } catch (error) {
      console.warn('⚠️ Seeding failed:', error)
    }
  }
})

// Clean tables between tests is handled in prisma-clean.ts
afterAll(async () => {
  await prisma.$disconnect()
})
