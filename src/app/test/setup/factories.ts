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

export interface CreateExperienceData {
  company: string
  role: string
  companyLogoUrl?: string
  startDate: Date
  endDate?: Date | null
  location?: string
  employmentType?: string
  summary?: string
  highlights?: string[]
  techStack?: string[]
  order?: number
  published?: boolean
  createdBy?: string
}

export interface CreateProjectData {
  title: string
  slug?: string
  summary?: string
  description?: string
  coverImageUrl?: string
  galleryUrls?: string[]
  repoUrl?: string
  liveUrl?: string
  videoUrl?: string
  links?: Record<string, any>
  techStack?: string[]
  tags?: string[]
  status?: 'ONGOING' | 'COMPLETED' | 'ARCHIVED'
  featured?: boolean
  order?: number
  startDate?: Date
  endDate?: Date | null
  published?: boolean
  createdBy?: string
}

/**
 * Create a test user with default USER role
 */
export async function createUser(data: CreateUserData): Promise<TestUser> {
  const hashedPassword = await import('@/lib/auth/password').then(m => m.hashPassword(data.password))
  
  // Add timestamp and random number to ensure uniqueness
  const uniqueId = Date.now() + Math.floor(Math.random() * 10000)
  const uniqueEmail = data.email.replace('@', `+${uniqueId}@`)
  const uniqueUsername = `${data.username}_${uniqueId}`
  
  const user = await prisma.user.create({
    data: {
      email: uniqueEmail,
      username: uniqueUsername,
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
 * Create an experience entry for testing
 */
export async function createExperience(data: CreateExperienceData) {
  return await prisma.experience.create({
    data: {
      company: data.company,
      role: data.role,
      companyLogoUrl: data.companyLogoUrl,
      startDate: data.startDate,
      endDate: data.endDate,
      location: data.location,
      employmentType: data.employmentType,
      summary: data.summary,
      highlights: data.highlights || [],
      techStack: data.techStack || [],
      order: data.order ?? 0,
      published: data.published ?? true,
      createdBy: data.createdBy,
      updatedBy: data.createdBy,
    },
  })
}

/**
 * Create a project entry for testing
 */
export async function createProject(data: CreateProjectData) {
  // Generate slug from title if not provided
  const slug = data.slug || data.title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
  
  return await prisma.project.create({
    data: {
      title: data.title,
      slug,
      summary: data.summary,
      description: data.description,
      coverImageUrl: data.coverImageUrl,
      galleryUrls: data.galleryUrls || [],
      repoUrl: data.repoUrl,
      liveUrl: data.liveUrl,
      videoUrl: data.videoUrl,
      links: data.links,
      techStack: data.techStack || [],
      tags: data.tags || [],
      status: data.status ?? 'ONGOING',
      featured: data.featured ?? false,
      order: data.order,
      startDate: data.startDate ?? new Date('2024-01-01'),
      endDate: data.endDate,
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
  await prisma.experience.deleteMany()
  await prisma.project.deleteMany()
  await prisma.user.deleteMany()
  // Don't delete rolePermission, permission, or role as they're needed for all tests
}
