/**
 * About input validation utilities
 */

import { ValidationError } from '@/lib/auth'

export interface CreateAboutInput {
  headline: string
  subheadline?: string
  bio: string
  avatarUrl?: string
  location?: string
  emailPublic?: string
  phonePublic?: string
  links?: Record<string, string>
  skills?: string[]
}

export interface UpdateAboutInput {
  headline?: string
  subheadline?: string
  bio?: string
  avatarUrl?: string
  location?: string
  emailPublic?: string
  phonePublic?: string
  links?: Record<string, string>
  skills?: string[]
}

export interface PublishAboutInput {
  published: boolean
}

/**
 * Validate about creation/upsert input
 */
export function validateCreateAbout(input: any): CreateAboutInput {
  const errors: string[] = []

  // headline - required, 1-120 chars
  if (!input.headline || typeof input.headline !== 'string') {
    errors.push('Headline is required')
  } else if (input.headline.length < 1 || input.headline.length > 120) {
    errors.push('Headline must be between 1 and 120 characters')
  }

  // subheadline - optional, max 160 chars
  if (input.subheadline !== undefined) {
    if (typeof input.subheadline !== 'string' || input.subheadline.length > 160) {
      errors.push('Subheadline must be a string with max 160 characters')
    }
  }

  // bio - required, 1-20000 chars
  if (!input.bio || typeof input.bio !== 'string') {
    errors.push('Bio is required')
  } else if (input.bio.length < 1 || input.bio.length > 20000) {
    errors.push('Bio must be between 1 and 20000 characters')
  }

  // avatarUrl - optional, must be valid URL
  if (input.avatarUrl !== undefined) {
    if (typeof input.avatarUrl !== 'string' || !isValidUrl(input.avatarUrl)) {
      errors.push('Avatar URL must be a valid HTTP/HTTPS URL')
    }
  }

  // emailPublic - optional, must be valid email
  if (input.emailPublic !== undefined) {
    if (typeof input.emailPublic !== 'string' || !isValidEmail(input.emailPublic)) {
      errors.push('Public email must be a valid email address')
    }
  }

  // phonePublic - optional, 3-32 chars
  if (input.phonePublic !== undefined) {
    if (typeof input.phonePublic !== 'string' || input.phonePublic.length < 3 || input.phonePublic.length > 32) {
      errors.push('Public phone must be between 3 and 32 characters')
    }
  }

  // location - optional, max 100 chars
  if (input.location !== undefined) {
    if (typeof input.location !== 'string' || input.location.length > 100) {
      errors.push('Location must be a string with max 100 characters')
    }
  }

  // links - optional, object with string URL values
  if (input.links !== undefined) {
    if (typeof input.links !== 'object' || Array.isArray(input.links)) {
      errors.push('Links must be an object')
    } else {
      for (const [key, value] of Object.entries(input.links)) {
        if (typeof key !== 'string' || typeof value !== 'string' || !isValidUrl(value)) {
          errors.push(`Link "${key}" must be a valid URL`)
        }
      }
    }
  }

  // skills - optional, array of strings (1-50 chars each, max 100 items)
  if (input.skills !== undefined) {
    if (!Array.isArray(input.skills)) {
      errors.push('Skills must be an array')
    } else if (input.skills.length > 100) {
      errors.push('Skills array cannot exceed 100 items')
    } else {
      for (const skill of input.skills) {
        if (typeof skill !== 'string' || skill.length < 1 || skill.length > 50) {
          errors.push('Each skill must be between 1 and 50 characters')
        }
      }
    }
  }

  if (errors.length > 0) {
    throw new ValidationError(errors[0]) // Return first error for simplicity
  }

  return {
    headline: input.headline,
    subheadline: input.subheadline || undefined,
    bio: input.bio,
    avatarUrl: input.avatarUrl || undefined,
    location: input.location || undefined,
    emailPublic: input.emailPublic || undefined,
    phonePublic: input.phonePublic || undefined,
    links: input.links || undefined,
    skills: input.skills || undefined,
  }
}

/**
 * Validate about update input (all fields optional)
 */
export function validateUpdateAbout(input: any): UpdateAboutInput {
  const errors: string[] = []

  // All validations are optional but must pass if provided
  if (input.headline !== undefined) {
    if (typeof input.headline !== 'string' || input.headline.length < 1 || input.headline.length > 120) {
      errors.push('Headline must be between 1 and 120 characters')
    }
  }

  if (input.subheadline !== undefined) {
    if (typeof input.subheadline !== 'string' || input.subheadline.length > 160) {
      errors.push('Subheadline must be a string with max 160 characters')
    }
  }

  if (input.bio !== undefined) {
    if (typeof input.bio !== 'string' || input.bio.length < 1 || input.bio.length > 20000) {
      errors.push('Bio must be between 1 and 20000 characters')
    }
  }

  if (input.avatarUrl !== undefined) {
    if (typeof input.avatarUrl !== 'string' || !isValidUrl(input.avatarUrl)) {
      errors.push('Avatar URL must be a valid HTTP/HTTPS URL')
    }
  }

  if (input.emailPublic !== undefined) {
    if (typeof input.emailPublic !== 'string' || !isValidEmail(input.emailPublic)) {
      errors.push('Public email must be a valid email address')
    }
  }

  if (input.phonePublic !== undefined) {
    if (typeof input.phonePublic !== 'string' || input.phonePublic.length < 3 || input.phonePublic.length > 32) {
      errors.push('Public phone must be between 3 and 32 characters')
    }
  }

  if (input.location !== undefined) {
    if (typeof input.location !== 'string' || input.location.length > 100) {
      errors.push('Location must be a string with max 100 characters')
    }
  }

  if (input.links !== undefined) {
    if (typeof input.links !== 'object' || Array.isArray(input.links)) {
      errors.push('Links must be an object')
    } else {
      for (const [key, value] of Object.entries(input.links)) {
        if (typeof key !== 'string' || typeof value !== 'string' || !isValidUrl(value)) {
          errors.push(`Link "${key}" must be a valid URL`)
        }
      }
    }
  }

  if (input.skills !== undefined) {
    if (!Array.isArray(input.skills)) {
      errors.push('Skills must be an array')
    } else if (input.skills.length > 100) {
      errors.push('Skills array cannot exceed 100 items')
    } else {
      for (const skill of input.skills) {
        if (typeof skill !== 'string' || skill.length < 1 || skill.length > 50) {
          errors.push('Each skill must be between 1 and 50 characters')
        }
      }
    }
  }

  if (errors.length > 0) {
    throw new ValidationError(errors[0])
  }

  return {
    headline: input.headline,
    subheadline: input.subheadline,
    bio: input.bio,
    avatarUrl: input.avatarUrl,
    location: input.location,
    emailPublic: input.emailPublic,
    phonePublic: input.phonePublic,
    links: input.links,
    skills: input.skills,
  }
}

/**
 * Validate publish input
 */
export function validatePublishAbout(input: any): PublishAboutInput {
  if (typeof input.published !== 'boolean') {
    throw new ValidationError('Published must be a boolean value')
  }

  return {
    published: input.published,
  }
}

/**
 * Check if URL is valid HTTP/HTTPS
 */
function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * Basic email validation
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}
