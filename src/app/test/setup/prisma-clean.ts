import { beforeEach } from 'vitest'
import { prisma } from '@/lib/prisma'

beforeEach(async () => {
  try {
    // Use transaction for atomic cleanup
    await prisma.$transaction(async (tx) => {
      // Order matters due to FKs
      await tx.refreshToken.deleteMany({})
      await tx.project.deleteMany({})
      await tx.experience.deleteMany({})
      await tx.about.deleteMany({})
      await tx.user.deleteMany({})
    })
  } catch (error) {
    console.error('Database cleanup failed:', error)
    // Try manual cleanup if transaction fails
    try {
      await prisma.refreshToken.deleteMany({})
      await prisma.project.deleteMany({})
      await prisma.experience.deleteMany({})
      await prisma.about.deleteMany({})
      await prisma.user.deleteMany({})
    } catch (cleanupError) {
      console.error('Manual cleanup also failed:', cleanupError)
    }
  }
})
