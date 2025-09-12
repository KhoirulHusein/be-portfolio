import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting RBAC seeding...')

  // Create permissions
  const permissions = [
    { key: 'user:read', description: 'Read user information' },
    { key: 'user:write', description: 'Write/edit user information' },
    { key: 'role:read', description: 'Read role information' },
    { key: 'role:assign', description: 'Assign roles to users' },
    { key: 'role:revoke', description: 'Revoke roles from users' },
    { key: 'about:read', description: 'Read about information' },
    { key: 'about:write', description: 'Write/edit about information' },
    { key: 'about:publish', description: 'Publish/unpublish about information' },
    { key: 'about:delete', description: 'Delete about information' },
    { key: 'experience:create', description: 'Create experience entries' },
    { key: 'experience:read', description: 'Read experience information' },
    { key: 'experience:update', description: 'Update experience entries' },
    { key: 'experience:delete', description: 'Delete experience entries' },
    { key: 'experience:publish', description: 'Publish/unpublish experience entries' },
  ]

  console.log('📝 Creating permissions...')
  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: { key: permission.key },
      update: {},
      create: permission,
    })
  }

  // Create roles
  console.log('👥 Creating roles...')
  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: {
      name: 'ADMIN',
      description: 'Administrator with full access',
    },
  })

  const userRole = await prisma.role.upsert({
    where: { name: 'USER' },
    update: {},
    create: {
      name: 'USER',
      description: 'Regular user with limited access',
    },
  })

  // Assign permissions to roles
  console.log('🔗 Assigning permissions to roles...')
  
  // ADMIN gets all permissions
  const allPermissions = await prisma.permission.findMany()
  for (const permission of allPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: permission.id,
      },
    })
  }

  // USER gets only user:read permission
  const userReadPermission = await prisma.permission.findUnique({
    where: { key: 'user:read' },
  })
  
  if (userReadPermission) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: userRole.id,
          permissionId: userReadPermission.id,
        },
      },
      update: {},
      create: {
        roleId: userRole.id,
        permissionId: userReadPermission.id,
      },
    })
  }

  console.log('✅ RBAC seeding completed!')
  console.log(`Created roles: ADMIN (${adminRole.id}), USER (${userRole.id})`)
  console.log(`Created ${permissions.length} permissions`)
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
