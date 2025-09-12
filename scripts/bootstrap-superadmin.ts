#!/usr/bin/env tsx

import { prisma } from '../src/lib/prisma'
import { ensureAdminOwnsAllPermissions } from '../src/lib/auth/rbac'
import bcrypt from 'bcrypt'

const SUPERADMIN_KEY = 'SUPERADMIN_USER_ID'

// Safety guard: prevent running in test environment
if (process.env.NODE_ENV === 'test') {
  console.error('❌ Cannot run bootstrap-superadmin in test environment!')
  console.error('   This script modifies database and should not run during tests.')
  process.exit(1)
}

// Display database URL (masked for security)
const databaseUrl = process.env.DATABASE_URL
if (databaseUrl) {
  const maskedUrl = databaseUrl.replace(/:\/\/([^:]+):([^@]+)@/, '://***:***@')
  console.log(`📊 Target database: ${maskedUrl}`)
  
  // Production safety check
  if (process.env.NODE_ENV === 'production' && databaseUrl.includes('localhost')) {
    console.warn('⚠️  WARNING: Running production environment with localhost database')
    console.warn('   Make sure this is intentional!')
  }
}

async function bootstrapSuperadmin() {
  try {
    // Check required environment variables
    const email = process.env.BOOTSTRAP_ADMIN_EMAIL
    const username = process.env.BOOTSTRAP_ADMIN_USERNAME
    const password = process.env.BOOTSTRAP_ADMIN_PASSWORD

    if (!email || !username || !password) {
      console.error('❌ Missing required environment variables:')
      console.error('   BOOTSTRAP_ADMIN_EMAIL')
      console.error('   BOOTSTRAP_ADMIN_USERNAME') 
      console.error('   BOOTSTRAP_ADMIN_PASSWORD')
      process.exit(1)
    }

    console.log('🔒 Starting superadmin bootstrap...')

    // Check if superadmin already exists
    const existingSetting = await prisma.setting.findUnique({
      where: { key: SUPERADMIN_KEY }
    })

    if (existingSetting) {
      console.error('❌ Superadmin already exists! Bootstrap can only be run once.')
      console.error(`   Existing superadmin ID: ${existingSetting.value}`)
      process.exit(1)
    }

    // Check if user with email already exists
    const existingUser = await prisma.user.findFirst({
      where: { 
        OR: [
          { email },
          { username }
        ]
      }
    })

    if (existingUser) {
      console.error('❌ User with this email or username already exists')
      process.exit(1)
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12)

    // Create superadmin user
    const superadmin = await prisma.user.create({
      data: {
        email,
        username,
        passwordHash
      }
    })

    console.log(`✅ Created superadmin user: ${superadmin.email}`)

    // Ensure ADMIN role exists
    const adminRole = await prisma.role.upsert({
      where: { name: 'ADMIN' },
      update: {},
      create: { 
        name: 'ADMIN', 
        description: 'Superuser role with all permissions' 
      }
    })

    // Assign ADMIN role to superadmin
    await prisma.userRole.create({
      data: {
        userId: superadmin.id,
        roleId: adminRole.id
      }
    })

    console.log('✅ Assigned ADMIN role to superadmin')

    // Ensure admin has all permissions
    await ensureAdminOwnsAllPermissions()

    // Mark superadmin as created
    await prisma.setting.create({
      data: {
        key: SUPERADMIN_KEY,
        value: superadmin.id
      }
    })

    console.log('✅ Superadmin bootstrap completed successfully')
    console.log(`📊 Superadmin ID: ${superadmin.id}`)
    console.log(`🔒 Bootstrap locked - cannot be run again`)

  } catch (error) {
    console.error('❌ Failed to bootstrap superadmin:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

bootstrapSuperadmin()
