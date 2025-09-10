import { prisma } from '@/lib/prisma'
import { assignRole } from '@/lib/auth/rbac'

export interface TestUser {
  id: string
  email: string
  username: string
  password: string
}

export interface CreateUserData {
  email: string
  username: string
  password: string
}

export interface CreateAboutData {
  headline: string
  subheadline?: string
  bio: string
  avatarUrl?: string
  location?: string
  emailPublic?: string
  phonePublic?: string
  links?: Record<string, string>
  skills?: string[]
  published?: boolean
  createdBy?: string
}

/**
 * Create a test user with default USER role
 */
export async function createUser(data: CreateUserData): Promise<TestUser> {
  const hashedPassword = await import('@/lib/auth/password').then(m => m.hashPassword(data.password))
  
  const user = await prisma.user.create({
    data: {
      email: data.email,
      username: data.username,
      passwordHash: hashedPassword,
    },
    select: {
      id: true,
      email: true,
      username: true,
    }
  })

  // Assign default USER role
  await assignRole(user.id, 'USER')

  return {
    ...user,
    password: data.password,
  }
}

/**
 * Create an admin user with ADMIN role
 */
export async function createAdminUser(data: CreateUserData): Promise<TestUser> {
  const user = await createUser(data)
  await assignRole(user.id, 'ADMIN')
  return user
}

/**
 * Ensure role exists (for testing)
 */
export async function ensureRole(name: string): Promise<{ id: string; name: string }> {
  return await prisma.role.upsert({
    where: { name },
    create: { name },
    update: {},
    select: { id: true, name: true }
  })
}

/**
 * Ensure permission exists (for testing)
 */
export async function ensurePermission(key: string, description?: string): Promise<{ id: string; key: string }> {
  return await prisma.permission.upsert({
    where: { key },
    create: { key, description },
    update: {},
    select: { id: true, key: true }
  })
}

/**
 * Create an about entry for testing
 */
export async function createAbout(data: CreateAboutData) {
  return await prisma.about.create({
    data: {
      headline: data.headline,
      subheadline: data.subheadline,
      bio: data.bio,
      avatarUrl: data.avatarUrl,
      location: data.location,
      emailPublic: data.emailPublic,
      phonePublic: data.phonePublic,
      links: data.links,
      skills: data.skills || [],
      published: data.published ?? false,
      createdBy: data.createdBy,
      updatedBy: data.createdBy,
    },
  })
}

/**
 * Clean up test data
 */
export async function cleanupTestData(): Promise<void> {
  // Delete in correct order to respect foreign key constraints
  // NOTE: We keep roles and permissions for test stability
  await prisma.refreshToken.deleteMany()
  await prisma.userRole.deleteMany()
  await prisma.about.deleteMany()
  await prisma.user.deleteMany()
  // Don't delete rolePermission, permission, or role as they're needed for all tests
}
