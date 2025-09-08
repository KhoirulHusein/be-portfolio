import { ValidationError } from '../../auth/errors'

export interface RegisterRequest {
  email: string
  username: string
  password: string
}

export interface LoginRequest {
  emailOrUsername: string
  password: string
}

export interface RefreshRequest {
  refreshToken: string
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const USERNAME_REGEX = /^[a-zA-Z0-9._-]+$/

export function validateRegister(data: any): RegisterRequest {
  const { email, username, password } = data

  if (!email || typeof email !== 'string') {
    throw new ValidationError('Email is required')
  }

  if (!EMAIL_REGEX.test(email)) {
    throw new ValidationError('Invalid email format')
  }

  if (!username || typeof username !== 'string') {
    throw new ValidationError('Username is required')
  }

  if (!USERNAME_REGEX.test(username)) {
    throw new ValidationError('Username can only contain letters, numbers, dots, underscores, and hyphens')
  }

  if (username.length < 3 || username.length > 30) {
    throw new ValidationError('Username must be between 3 and 30 characters')
  }

  if (!password || typeof password !== 'string') {
    throw new ValidationError('Password is required')
  }

  if (password.length < 8) {
    throw new ValidationError('Password must be at least 8 characters long')
  }

  if (password.length > 128) {
    throw new ValidationError('Password must not exceed 128 characters')
  }

  return {
    email: email.toLowerCase().trim(),
    username: username.trim(),
    password
  }
}

export function validateLogin(data: any): LoginRequest {
  const { emailOrUsername, password } = data

  if (!emailOrUsername || typeof emailOrUsername !== 'string') {
    throw new ValidationError('Email or username is required')
  }

  if (!password || typeof password !== 'string') {
    throw new ValidationError('Password is required')
  }

  return {
    emailOrUsername: emailOrUsername.toLowerCase().trim(),
    password
  }
}

export function validateRefresh(data: any): RefreshRequest {
  const { refreshToken } = data

  if (!refreshToken || typeof refreshToken !== 'string') {
    throw new ValidationError('Refresh token is required')
  }

  return { refreshToken }
}

export function validateChangePassword(data: any): ChangePasswordRequest {
  const { currentPassword, newPassword } = data

  if (!currentPassword || typeof currentPassword !== 'string') {
    throw new ValidationError('Current password is required')
  }

  if (!newPassword || typeof newPassword !== 'string') {
    throw new ValidationError('New password is required')
  }

  if (newPassword.length < 8) {
    throw new ValidationError('New password must be at least 8 characters long')
  }

  if (newPassword.length > 128) {
    throw new ValidationError('New password must not exceed 128 characters')
  }

  return { currentPassword, newPassword }
}
