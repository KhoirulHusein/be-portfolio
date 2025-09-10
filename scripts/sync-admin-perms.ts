#!/usr/bin/env tsx

import { prisma } from '../src/lib/prisma'
import { ensureAdminOwnsAllPermissions } from '../src/lib/auth/rbac'

async function syncAdminPermissions() {
  try {
    console.log('🔄 Starting admin permissions synchronization...')
    
    await ensureAdminOwnsAllPermissions()
    
    console.log('✅ Admin permissions synchronization completed successfully')
    
    // Show current permissions count
    const permCount = await prisma.permission.count()
    const adminRolePerms = await prisma.rolePermission.count({
      where: { 
        role: { name: 'ADMIN' }
      }
    })
    
    console.log(`📊 Total permissions: ${permCount}`)
    console.log(`📊 Admin role permissions: ${adminRolePerms}`)
    
  } catch (error) {
    console.error('❌ Failed to sync admin permissions:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

syncAdminPermissions()
