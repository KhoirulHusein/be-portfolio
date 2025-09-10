import { prisma } from '@/lib/prisma'

export type PermissionCode = string

/**
 * Check if user has admin role (bypass all permission checks)
 */
export async function isAdmin(userId: string): Promise<boolean> {
  try {
    const userRole = await prisma.userRole.findFirst({
      where: {
        userId,
        role: { name: 'ADMIN' }
      },
      select: { userId: true } // composite key - use field that exists
    })
    return !!userRole
  } catch (error) {
    console.error('Error checking admin status:', error)
    return false
  }
}

/**
 * Check if user has specific permission (or is admin)
 * Strategy A1: Admin bypass + A2: Permission sync
 */
export async function userHasPermission(userId: string, permissionCode: PermissionCode): Promise<boolean> {
  try {
    // A1: Admin bypass strategy
    if (await isAdmin(userId)) {
      return true
    }

    // A2: Check specific permission
    const permission = await prisma.rolePermission.findFirst({
      where: {
        role: {
          users: { some: { userId } } // 'users' is the relation name in Role model
        },
        permission: { key: permissionCode } // 'key' is the field name in Permission model
      },
      select: { permissionId: true } // composite key - use field that exists
    })

    return !!permission
  } catch (error) {
    console.error('Error checking user permission:', error)
    return false
  }
}

/**
 * Ensure admin role has all permissions (idempotent sync)
 * Strategy A2: Permission synchronization
 */
export async function ensureAdminOwnsAllPermissions(): Promise<void> {
  try {
    // Ensure admin role exists
    const adminRole = await prisma.role.upsert({
      where: { name: 'ADMIN' },
      update: {},
      create: {
        name: 'ADMIN',
        description: 'Administrator role with all permissions'
      }
    })

    // Get all permissions
    const allPermissions = await prisma.permission.findMany({
      select: { id: true }
    })

    if (allPermissions.length === 0) {
      console.log('No permissions found to sync')
      return
    }

    // Get existing role permissions for admin
    const existingRolePermissions = await prisma.rolePermission.findMany({
      where: { roleId: adminRole.id },
      select: { permissionId: true }
    })

    const existingPermissionIds = new Set(
      existingRolePermissions.map(rp => rp.permissionId)
    )

    // Find permissions that admin doesn't have yet
    const missingPermissions = allPermissions.filter(
      permission => !existingPermissionIds.has(permission.id)
    )

    // Add missing permissions to admin role
    if (missingPermissions.length > 0) {
      const rolePermissionsToCreate = missingPermissions.map(permission => ({
        roleId: adminRole.id,
        permissionId: permission.id
      }))

      await prisma.rolePermission.createMany({
        data: rolePermissionsToCreate,
        skipDuplicates: true
      })

      console.log(`Added ${missingPermissions.length} permissions to admin role`)
    } else {
      console.log('Admin role already has all permissions')
    }
  } catch (error) {
    console.error('Error syncing admin permissions:', error)
    throw error
  }
}

/**
 * Get user roles by user ID
 */
export async function getUserRoles(userId: string): Promise<string[]> {
  const rows = await prisma.userRole.findMany({
    where: { userId },
    include: { role: { select: { name: true } } },
  })
  return rows.map((r: { role: { name: string } }) => r.role.name)
}

/**
 * Get user permissions by user ID (includes admin bypass)
 */
export async function getUserPermissions(userId: string): Promise<string[]> {
  // If admin, return all permissions
  if (await isAdmin(userId)) {
    const allPerms = await prisma.permission.findMany({ select: { key: true } })
    return allPerms.map(p => p.key)
  }

  // Normal permission lookup
  const urs = await prisma.userRole.findMany({
    where: { userId },
    select: { roleId: true },
  })
  if (urs.length === 0) return []

  const roleIds = urs.map((x: { roleId: string }) => x.roleId)
  const rps = await prisma.rolePermission.findMany({
    where: { roleId: { in: roleIds } },
    include: { permission: { select: { key: true } } },
  })
  
  const keys = new Set<string>(rps.map((rp: { permission: { key: string } }) => rp.permission.key))
  return [...keys]
}

/**
 * Check if user has any of the specified roles
 */
export async function hasRole(
  userId: string,
  roles: string | string[]
): Promise<boolean> {
  const required = Array.isArray(roles) ? roles : [roles]
  const userRoles = await getUserRoles(userId)
  return required.some((r: string) => userRoles.includes(r))
}

/**
 * Check if user has any of the specified permissions (with admin bypass)
 */
export async function hasPermission(
  userId: string,
  perms: string | string[]
): Promise<boolean> {
  const required = Array.isArray(perms) ? perms : [perms]
  
  // Use the new dynamic permission checker for each permission
  for (const perm of required) {
    if (await userHasPermission(userId, perm)) {
      return true
    }
  }
  
  return false
}

/**
 * Assign role to user
 */
export async function assignRole(userId: string, roleName: string): Promise<void> {
  const role = await prisma.role.findUnique({
    where: { name: roleName }
  })

  if (!role) {
    throw new Error(`Role ${roleName} not found`)
  }

  await prisma.userRole.upsert({
    where: { 
      userId_roleId: { 
        userId, 
        roleId: role.id 
      } 
    },
    update: {},
    create: { 
      userId, 
      roleId: role.id 
    }
  })

  // If assigning ADMIN role, ensure all permissions are synced
  if (roleName === 'ADMIN') {
    await ensureAdminOwnsAllPermissions()
  }
}

/**
 * Revoke role from user
 */
export async function revokeRole(userId: string, roleName: string): Promise<void> {
  const role = await prisma.role.findUnique({
    where: { name: roleName }
  })

  if (!role) {
    throw new Error(`Role ${roleName} not found`)
  }

  await prisma.userRole.deleteMany({
    where: {
      userId,
      roleId: role.id
    }
  })
}

/**
 * Get user with roles included
 */
export async function getUserWithRoles(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      roles: {
        include: {
          role: {
            select: {
              name: true
            }
          }
        }
      }
    }
  })

  if (!user) return null

  return {
    id: user.id,
    email: user.email,
    username: user.username,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    roles: user.roles.map((ur: { role: { name: string } }) => ur.role.name)
  }
}
