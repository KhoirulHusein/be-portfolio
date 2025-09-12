/**
 * Experience input validation utilities
 */

import { ValidationError } from '@/lib/auth'

export interface CreateExperienceInput {
  company: string
  role: string
  companyLogoUrl?: string
  startDate: string | Date
  endDate?: string | Date | null
  location?: string
  employmentType?: string
  summary?: string
  highlights?: string[]
  techStack?: string[]
  order?: number
  published?: boolean
}

export interface UpdateExperienceInput {
  company?: string
  role?: string
  companyLogoUrl?: string
  startDate?: string | Date
  endDate?: string | Date | null
  location?: string
  employmentType?: string
  summary?: string
  highlights?: string[]
  techStack?: string[]
  order?: number
  published?: boolean
}

export interface PublishExperienceInput {
  published: boolean
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

// Employment types we support
const EMPLOYMENT_TYPES = [
  'Full-time',
  'Part-time',
  'Contract',
  'Temporary',
  'Volunteer',
  'Internship',
  'Freelance',
  'Self-employed'
]

export function validateCreateExperience(body: any): CreateExperienceInput {
  if (!body || typeof body !== 'object') {
    throw new ValidationError('Request body must be an object')
  }

  const errors: string[] = []
  const input = body as CreateExperienceInput

  // company - required, non-empty, max 100 chars
  if (!input.company || typeof input.company !== 'string') {
    errors.push('Company is required')
  } else if (input.company.trim().length === 0) {
    errors.push('Company cannot be empty')
  } else if (input.company.length > 100) {
    errors.push('Company must be max 100 characters')
  }

  // role - required, non-empty, max 100 chars
  if (!input.role || typeof input.role !== 'string') {
    errors.push('Role is required')
  } else if (input.role.trim().length === 0) {
    errors.push('Role cannot be empty')
  } else if (input.role.length > 100) {
    errors.push('Role must be max 100 characters')
  }

  // companyLogoUrl - optional, must be valid URL
  if (input.companyLogoUrl !== undefined) {
    if (input.companyLogoUrl !== null && typeof input.companyLogoUrl !== 'string') {
      errors.push('Company logo URL must be a string')
    } else if (input.companyLogoUrl && !isValidUrl(input.companyLogoUrl)) {
      errors.push('Company logo URL must be a valid URL')
    }
  }

  // startDate - required, valid date
  if (!input.startDate) {
    errors.push('Start date is required')
  } else {
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

  // location - optional, max 100 chars
  if (input.location !== undefined) {
    if (typeof input.location !== 'string' || input.location.length > 100) {
      errors.push('Location must be a string with max 100 characters')
    }
  }

  // employmentType - optional, must be from allowed values
  if (input.employmentType !== undefined) {
    if (typeof input.employmentType !== 'string') {
      errors.push('Employment type must be a string')
    } else if (input.employmentType && !EMPLOYMENT_TYPES.includes(input.employmentType)) {
      errors.push(`Employment type must be one of: ${EMPLOYMENT_TYPES.join(', ')}`)
    }
  }

  // summary - optional, max 1000 chars
  if (input.summary !== undefined) {
    if (typeof input.summary !== 'string' || input.summary.length > 1000) {
      errors.push('Summary must be a string with max 1000 characters')
    }
  }

  // highlights - optional, array of strings, each max 200 chars
  if (input.highlights !== undefined) {
    if (!Array.isArray(input.highlights)) {
      errors.push('Highlights must be an array')
    } else {
      for (let i = 0; i < input.highlights.length; i++) {
        const highlight = input.highlights[i]
        if (typeof highlight !== 'string') {
          errors.push(`Highlight at index ${i} must be a string`)
        } else if (highlight.length > 200) {
          errors.push(`Highlight at index ${i} must be max 200 characters`)
        }
      }
    }
  }

  // techStack - optional, array of strings, each max 50 chars
  if (input.techStack !== undefined) {
    if (!Array.isArray(input.techStack)) {
      errors.push('Tech stack must be an array')
    } else {
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

  // order - optional, integer >= 0
  if (input.order !== undefined) {
    if (typeof input.order !== 'number' || !Number.isInteger(input.order) || input.order < 0) {
      errors.push('Order must be an integer >= 0')
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

export function validateUpdateExperience(body: any): UpdateExperienceInput {
  if (!body || typeof body !== 'object') {
    throw new ValidationError('Request body must be an object')
  }

  const errors: string[] = []
  const input = body as UpdateExperienceInput

  // All fields are optional for update, but if provided they must be valid

  // company - optional, non-empty, max 100 chars
  if (input.company !== undefined) {
    if (typeof input.company !== 'string') {
      errors.push('Company must be a string')
    } else if (input.company.trim().length === 0) {
      errors.push('Company cannot be empty')
    } else if (input.company.length > 100) {
      errors.push('Company must be max 100 characters')
    }
  }

  // role - optional, non-empty, max 100 chars
  if (input.role !== undefined) {
    if (typeof input.role !== 'string') {
      errors.push('Role must be a string')
    } else if (input.role.trim().length === 0) {
      errors.push('Role cannot be empty')
    } else if (input.role.length > 100) {
      errors.push('Role must be max 100 characters')
    }
  }

  // companyLogoUrl - optional, must be valid URL
  if (input.companyLogoUrl !== undefined) {
    if (input.companyLogoUrl !== null && typeof input.companyLogoUrl !== 'string') {
      errors.push('Company logo URL must be a string')
    } else if (input.companyLogoUrl && !isValidUrl(input.companyLogoUrl)) {
      errors.push('Company logo URL must be a valid URL')
    }
  }

  // startDate - optional, valid date
  if (input.startDate !== undefined) {
    const startDate = new Date(input.startDate)
    if (isNaN(startDate.getTime())) {
      errors.push('Start date must be a valid date')
    }
  }

  // endDate - optional, valid date, must be >= startDate if both provided
  if (input.endDate !== undefined && input.endDate !== null) {
    const endDate = new Date(input.endDate)
    if (isNaN(endDate.getTime())) {
      errors.push('End date must be a valid date')
    } else if (input.startDate !== undefined) {
      const startDate = new Date(input.startDate)
      if (!isNaN(startDate.getTime()) && endDate < startDate) {
        errors.push('End date must be greater than or equal to start date')
      }
    }
  }

  // location - optional, max 100 chars
  if (input.location !== undefined) {
    if (typeof input.location !== 'string' || input.location.length > 100) {
      errors.push('Location must be a string with max 100 characters')
    }
  }

  // employmentType - optional, must be from allowed values
  if (input.employmentType !== undefined) {
    if (typeof input.employmentType !== 'string') {
      errors.push('Employment type must be a string')
    } else if (input.employmentType && !EMPLOYMENT_TYPES.includes(input.employmentType)) {
      errors.push(`Employment type must be one of: ${EMPLOYMENT_TYPES.join(', ')}`)
    }
  }

  // summary - optional, max 1000 chars
  if (input.summary !== undefined) {
    if (typeof input.summary !== 'string' || input.summary.length > 1000) {
      errors.push('Summary must be a string with max 1000 characters')
    }
  }

  // highlights - optional, array of strings, each max 200 chars
  if (input.highlights !== undefined) {
    if (!Array.isArray(input.highlights)) {
      errors.push('Highlights must be an array')
    } else {
      for (let i = 0; i < input.highlights.length; i++) {
        const highlight = input.highlights[i]
        if (typeof highlight !== 'string') {
          errors.push(`Highlight at index ${i} must be a string`)
        } else if (highlight.length > 200) {
          errors.push(`Highlight at index ${i} must be max 200 characters`)
        }
      }
    }
  }

  // techStack - optional, array of strings, each max 50 chars
  if (input.techStack !== undefined) {
    if (!Array.isArray(input.techStack)) {
      errors.push('Tech stack must be an array')
    } else {
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

  // order - optional, integer >= 0
  if (input.order !== undefined) {
    if (typeof input.order !== 'number' || !Number.isInteger(input.order) || input.order < 0) {
      errors.push('Order must be an integer >= 0')
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

export function validatePublishExperience(body: any): PublishExperienceInput {
  if (!body || typeof body !== 'object') {
    throw new ValidationError('Request body must be an object')
  }

  const errors: string[] = []
  const input = body as PublishExperienceInput

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
