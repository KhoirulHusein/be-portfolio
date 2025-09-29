/**
 * Project input validation utilities
 */

import { ValidationError } from '@/lib/auth'

export interface CreateProjectInput {
  title: string
  slug?: string
  summary?: string
  description?: string
  coverImageUrl?: string
  galleryUrls?: string[]
  repoUrl?: string
  liveUrl?: string
  videoUrl?: string
  links?: any // JSON object
  techStack?: string[]
  tags?: string[]
  status?: 'ONGOING' | 'COMPLETED' | 'ARCHIVED'
  featured?: boolean
  order?: number
  startDate?: string | Date
  endDate?: string | Date | null
  published?: boolean
}

// Validated input where slug and status are guaranteed to be present
export interface ValidatedCreateProjectInput extends Omit<CreateProjectInput, 'slug' | 'status'> {
  slug: string
  status: 'ONGOING' | 'COMPLETED' | 'ARCHIVED'
}

export interface UpdateProjectInput {
  title?: string
  slug?: string
  summary?: string
  description?: string
  coverImageUrl?: string
  galleryUrls?: string[]
  repoUrl?: string
  liveUrl?: string
  videoUrl?: string
  links?: any // JSON object
  techStack?: string[]
  tags?: string[]
  status?: 'ONGOING' | 'COMPLETED' | 'ARCHIVED'
  featured?: boolean
  order?: number
  startDate?: string | Date
  endDate?: string | Date | null
  published?: boolean
}

export interface PublishProjectInput {
  published: boolean
}

export interface ReorderProjectInput {
  order: number
}

// Utility function to validate URL
function isValidUrl(str: string): boolean {
  try {
    new URL(str)
    return true
  } catch {
    return false
  }
}

// Utility function to generate slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces, underscores, and multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, '') // Remove leading and trailing hyphens
}

// Project statuses we support
const PROJECT_STATUSES = ['ONGOING', 'COMPLETED', 'ARCHIVED'] as const

export function validateCreateProject(body: any): ValidatedCreateProjectInput {
  if (!body || typeof body !== 'object') {
    throw new ValidationError('Request body must be an object')
  }

  const errors: string[] = []
  const input = body as CreateProjectInput

  // title - required, non-empty, max 100 chars
  if (!input.title || typeof input.title !== 'string') {
    errors.push('Title is required')
  } else if (input.title.trim().length === 0) {
    errors.push('Title cannot be empty')
  } else if (input.title.length > 100) {
    errors.push('Title must be max 100 characters')
  }

  // slug - optional, generate from title if not provided, max 100 chars, must be URL-friendly
  if (input.slug !== undefined) {
    if (typeof input.slug !== 'string') {
      errors.push('Slug must be a string')
    } else if (input.slug.length > 100) {
      errors.push('Slug must be max 100 characters')
    } else if (input.slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input.slug)) {
      errors.push('Slug must be URL-friendly (lowercase, alphanumeric, hyphens only)')
    }
  }
  
  // Generate slug from title if not provided and title is valid
  if (!input.slug && input.title && typeof input.title === 'string' && input.title.trim().length > 0) {
    input.slug = generateSlug(input.title)
  }

  // summary - optional, max 500 chars
  if (input.summary !== undefined) {
    if (typeof input.summary !== 'string' || input.summary.length > 500) {
      errors.push('Summary must be a string with max 500 characters')
    }
  }

  // description - optional, max 10000 chars (markdown content)
  if (input.description !== undefined) {
    if (typeof input.description !== 'string' || input.description.length > 10000) {
      errors.push('Description must be a string with max 10000 characters')
    }
  }

  // coverImageUrl - optional, must be valid URL
  if (input.coverImageUrl !== undefined) {
    if (input.coverImageUrl !== null && typeof input.coverImageUrl !== 'string') {
      errors.push('Cover image URL must be a string')
    } else if (input.coverImageUrl && !isValidUrl(input.coverImageUrl)) {
      errors.push('Cover image URL must be a valid URL')
    }
  }

  // galleryUrls - optional, array of valid URLs, max 10 items
  if (input.galleryUrls !== undefined) {
    if (!Array.isArray(input.galleryUrls)) {
      errors.push('Gallery URLs must be an array')
    } else {
      if (input.galleryUrls.length > 10) {
        errors.push('Gallery URLs must contain max 10 items')
      }
      for (let i = 0; i < input.galleryUrls.length; i++) {
        const url = input.galleryUrls[i]
        if (typeof url !== 'string') {
          errors.push(`Gallery URL at index ${i} must be a string`)
        } else if (!isValidUrl(url)) {
          errors.push(`Gallery URL at index ${i} must be a valid URL`)
        }
      }
    }
  }

  // repoUrl - optional, must be valid URL
  if (input.repoUrl !== undefined) {
    if (input.repoUrl !== null && typeof input.repoUrl !== 'string') {
      errors.push('Repository URL must be a string')
    } else if (input.repoUrl && !isValidUrl(input.repoUrl)) {
      errors.push('Repository URL must be a valid URL')
    }
  }

  // liveUrl - optional, must be valid URL
  if (input.liveUrl !== undefined) {
    if (input.liveUrl !== null && typeof input.liveUrl !== 'string') {
      errors.push('Live URL must be a string')
    } else if (input.liveUrl && !isValidUrl(input.liveUrl)) {
      errors.push('Live URL must be a valid URL')
    }
  }

  // videoUrl - optional, must be valid URL
  if (input.videoUrl !== undefined) {
    if (input.videoUrl !== null && typeof input.videoUrl !== 'string') {
      errors.push('Video URL must be a string')
    } else if (input.videoUrl && !isValidUrl(input.videoUrl)) {
      errors.push('Video URL must be a valid URL')
    }
  }

  // links - optional, must be valid JSON object
  if (input.links !== undefined) {
    if (input.links !== null && typeof input.links !== 'object') {
      errors.push('Links must be an object')
    }
  }

  // techStack - optional, array of strings, each max 50 chars, max 20 items
  if (input.techStack !== undefined) {
    if (!Array.isArray(input.techStack)) {
      errors.push('Tech stack must be an array')
    } else {
      if (input.techStack.length > 20) {
        errors.push('Tech stack must contain max 20 items')
      }
      for (let i = 0; i < input.techStack.length; i++) {
        const tech = input.techStack[i]
        if (typeof tech !== 'string') {
          errors.push(`Tech stack item at index ${i} must be a string`)
        } else if (tech.length > 50) {
          errors.push(`Tech stack item at index ${i} must be max 50 characters`)
        }
      }
    }
  }

  // tags - optional, array of strings, each max 30 chars, max 10 items
  if (input.tags !== undefined) {
    if (!Array.isArray(input.tags)) {
      errors.push('Tags must be an array')
    } else {
      if (input.tags.length > 10) {
        errors.push('Tags must contain max 10 items')
      }
      for (let i = 0; i < input.tags.length; i++) {
        const tag = input.tags[i]
        if (typeof tag !== 'string') {
          errors.push(`Tag at index ${i} must be a string`)
        } else if (tag.length > 30) {
          errors.push(`Tag at index ${i} must be max 30 characters`)
        }
      }
    }
  }

  // status - optional, must be from allowed values, default ONGOING
  if (input.status !== undefined) {
    if (typeof input.status !== 'string') {
      errors.push('Status must be a string')
    } else if (!PROJECT_STATUSES.includes(input.status as any)) {
      errors.push(`Status must be one of: ${PROJECT_STATUSES.join(', ')}`)
    }
  } else {
    input.status = 'ONGOING' // default value
  }

  // featured - optional, boolean, default false
  if (input.featured !== undefined) {
    if (typeof input.featured !== 'boolean') {
      errors.push('Featured must be a boolean')
    }
  } else {
    input.featured = false // default value
  }

  // order - optional, integer
  if (input.order !== undefined) {
    if (!Number.isInteger(input.order)) {
      errors.push('Order must be an integer')
    }
  }

  // startDate - optional, valid date
  if (input.startDate !== undefined && input.startDate !== null) {
    const startDate = new Date(input.startDate)
    if (isNaN(startDate.getTime())) {
      errors.push('Start date must be a valid date')
    }
  }

  // endDate - optional, valid date, must be >= startDate
  if (input.endDate !== undefined && input.endDate !== null) {
    const endDate = new Date(input.endDate)
    if (isNaN(endDate.getTime())) {
      errors.push('End date must be a valid date')
    } else if (input.startDate) {
      const startDate = new Date(input.startDate)
      if (!isNaN(startDate.getTime()) && endDate < startDate) {
        errors.push('End date must be greater than or equal to start date')
      }
    }
  }

  // published - optional, boolean, default false
  if (input.published !== undefined) {
    if (typeof input.published !== 'boolean') {
      errors.push('Published must be a boolean')
    }
  } else {
    input.published = false // default value
  }

  if (errors.length > 0) {
    throw new ValidationError(errors.join(', '))
  }

  // Ensure slug is always set
  if (!input.slug) {
    throw new ValidationError('Slug is required but could not be generated')
  }

  // Ensure status is always set
  if (!input.status) {
    input.status = 'ONGOING' // default value
  }

  return input as ValidatedCreateProjectInput
}

export function validateUpdateProject(body: any): UpdateProjectInput {
  if (!body || typeof body !== 'object') {
    throw new ValidationError('Request body must be an object')
  }

  const errors: string[] = []
  const input = body as UpdateProjectInput

  // title - optional, non-empty, max 100 chars
  if (input.title !== undefined) {
    if (typeof input.title !== 'string') {
      errors.push('Title must be a string')
    } else if (input.title.trim().length === 0) {
      errors.push('Title cannot be empty')
    } else if (input.title.length > 100) {
      errors.push('Title must be max 100 characters')
    }
  }

  // slug - optional, max 100 chars, must be URL-friendly
  if (input.slug !== undefined) {
    if (typeof input.slug !== 'string') {
      errors.push('Slug must be a string')
    } else if (input.slug.length > 100) {
      errors.push('Slug must be max 100 characters')
    } else if (input.slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input.slug)) {
      errors.push('Slug must be URL-friendly (lowercase, alphanumeric, hyphens only)')
    }
  }

  // summary - optional, max 500 chars
  if (input.summary !== undefined) {
    if (typeof input.summary !== 'string' || input.summary.length > 500) {
      errors.push('Summary must be a string with max 500 characters')
    }
  }

  // description - optional, max 10000 chars
  if (input.description !== undefined) {
    if (typeof input.description !== 'string' || input.description.length > 10000) {
      errors.push('Description must be a string with max 10000 characters')
    }
  }

  // coverImageUrl - optional, must be valid URL
  if (input.coverImageUrl !== undefined) {
    if (input.coverImageUrl !== null && typeof input.coverImageUrl !== 'string') {
      errors.push('Cover image URL must be a string')
    } else if (input.coverImageUrl && !isValidUrl(input.coverImageUrl)) {
      errors.push('Cover image URL must be a valid URL')
    }
  }

  // galleryUrls - optional, array of valid URLs, max 10 items
  if (input.galleryUrls !== undefined) {
    if (!Array.isArray(input.galleryUrls)) {
      errors.push('Gallery URLs must be an array')
    } else {
      if (input.galleryUrls.length > 10) {
        errors.push('Gallery URLs must contain max 10 items')
      }
      for (let i = 0; i < input.galleryUrls.length; i++) {
        const url = input.galleryUrls[i]
        if (typeof url !== 'string') {
          errors.push(`Gallery URL at index ${i} must be a string`)
        } else if (!isValidUrl(url)) {
          errors.push(`Gallery URL at index ${i} must be a valid URL`)
        }
      }
    }
  }

  // repoUrl - optional, must be valid URL
  if (input.repoUrl !== undefined) {
    if (input.repoUrl !== null && typeof input.repoUrl !== 'string') {
      errors.push('Repository URL must be a string')
    } else if (input.repoUrl && !isValidUrl(input.repoUrl)) {
      errors.push('Repository URL must be a valid URL')
    }
  }

  // liveUrl - optional, must be valid URL
  if (input.liveUrl !== undefined) {
    if (input.liveUrl !== null && typeof input.liveUrl !== 'string') {
      errors.push('Live URL must be a string')
    } else if (input.liveUrl && !isValidUrl(input.liveUrl)) {
      errors.push('Live URL must be a valid URL')
    }
  }

  // videoUrl - optional, must be valid URL
  if (input.videoUrl !== undefined) {
    if (input.videoUrl !== null && typeof input.videoUrl !== 'string') {
      errors.push('Video URL must be a string')
    } else if (input.videoUrl && !isValidUrl(input.videoUrl)) {
      errors.push('Video URL must be a valid URL')
    }
  }

  // links - optional, must be valid JSON object
  if (input.links !== undefined) {
    if (input.links !== null && typeof input.links !== 'object') {
      errors.push('Links must be an object')
    }
  }

  // techStack - optional, array of strings, each max 50 chars, max 20 items
  if (input.techStack !== undefined) {
    if (!Array.isArray(input.techStack)) {
      errors.push('Tech stack must be an array')
    } else {
      if (input.techStack.length > 20) {
        errors.push('Tech stack must contain max 20 items')
      }
      for (let i = 0; i < input.techStack.length; i++) {
        const tech = input.techStack[i]
        if (typeof tech !== 'string') {
          errors.push(`Tech stack item at index ${i} must be a string`)
        } else if (tech.length > 50) {
          errors.push(`Tech stack item at index ${i} must be max 50 characters`)
        }
      }
    }
  }

  // tags - optional, array of strings, each max 30 chars, max 10 items
  if (input.tags !== undefined) {
    if (!Array.isArray(input.tags)) {
      errors.push('Tags must be an array')
    } else {
      if (input.tags.length > 10) {
        errors.push('Tags must contain max 10 items')
      }
      for (let i = 0; i < input.tags.length; i++) {
        const tag = input.tags[i]
        if (typeof tag !== 'string') {
          errors.push(`Tag at index ${i} must be a string`)
        } else if (tag.length > 30) {
          errors.push(`Tag at index ${i} must be max 30 characters`)
        }
      }
    }
  }

  // status - optional, must be from allowed values
  if (input.status !== undefined) {
    if (typeof input.status !== 'string') {
      errors.push('Status must be a string')
    } else if (!PROJECT_STATUSES.includes(input.status as any)) {
      errors.push(`Status must be one of: ${PROJECT_STATUSES.join(', ')}`)
    }
  }

  // featured - optional, boolean
  if (input.featured !== undefined) {
    if (typeof input.featured !== 'boolean') {
      errors.push('Featured must be a boolean')
    }
  }

  // order - optional, integer
  if (input.order !== undefined) {
    if (!Number.isInteger(input.order)) {
      errors.push('Order must be an integer')
    }
  }

  // startDate - optional, valid date
  if (input.startDate !== undefined && input.startDate !== null) {
    const startDate = new Date(input.startDate)
    if (isNaN(startDate.getTime())) {
      errors.push('Start date must be a valid date')
    }
  }

  // endDate - optional, valid date, must be >= startDate
  if (input.endDate !== undefined && input.endDate !== null) {
    const endDate = new Date(input.endDate)
    if (isNaN(endDate.getTime())) {
      errors.push('End date must be a valid date')
    } else if (input.startDate) {
      const startDate = new Date(input.startDate)
      if (!isNaN(startDate.getTime()) && endDate < startDate) {
        errors.push('End date must be greater than or equal to start date')
      }
    }
  }

  // published - optional, boolean
  if (input.published !== undefined) {
    if (typeof input.published !== 'boolean') {
      errors.push('Published must be a boolean')
    }
  }

  if (errors.length > 0) {
    throw new ValidationError(errors.join(', '))
  }

  return input
}

export function validatePublishProject(body: any): PublishProjectInput {
  if (!body || typeof body !== 'object') {
    throw new ValidationError('Request body must be an object')
  }

  const errors: string[] = []
  const input = body as PublishProjectInput

  // published - required, boolean
  if (input.published === undefined) {
    errors.push('Published field is required')
  } else if (typeof input.published !== 'boolean') {
    errors.push('Published must be a boolean')
  }

  if (errors.length > 0) {
    throw new ValidationError(errors.join(', '))
  }

  return input
}

export function validateReorderProject(body: any): ReorderProjectInput {
  if (!body || typeof body !== 'object') {
    throw new ValidationError('Request body must be an object')
  }

  const errors: string[] = []
  const input = body as ReorderProjectInput

  // order - required, integer
  if (input.order === undefined) {
    errors.push('Order field is required')
  } else if (!Number.isInteger(input.order)) {
    errors.push('Order must be an integer')
  }

  if (errors.length > 0) {
    throw new ValidationError(errors.join(', '))
  }

  return input
}