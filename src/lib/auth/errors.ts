export class AuthError extends Error {
  public code: string
  public statusCode: number

  constructor(message: string, code: string, statusCode: number) {
    super(message)
    this.name = 'AuthError'
    this.code = code
    this.statusCode = statusCode
  }
}

export class BadRequestError extends AuthError {
  constructor(message: string, code = 'BAD_REQUEST') {
    super(message, code, 400)
  }
}

export class UnauthorizedError extends AuthError {
  constructor(message: string, code = 'UNAUTHORIZED') {
    super(message, code, 401)
  }
}

export class ForbiddenError extends AuthError {
  constructor(message: string, code = 'FORBIDDEN') {
    super(message, code, 403)
  }
}

export class ConflictError extends AuthError {
  constructor(message: string, code = 'CONFLICT') {
    super(message, code, 409)
  }
}

export class TooManyRequestsError extends AuthError {
  constructor(message: string, code = 'TOO_MANY_REQUESTS') {
    super(message, code, 429)
  }
}

export class ValidationError extends BadRequestError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR')
  }
}

export class InvalidCredentialsError extends UnauthorizedError {
  constructor() {
    super('Invalid credentials', 'INVALID_CREDENTIALS')
  }
}

export class TokenExpiredError extends UnauthorizedError {
  constructor() {
    super('Token has expired', 'TOKEN_EXPIRED')
  }
}

export class TokenRevokedError extends UnauthorizedError {
  constructor() {
    super('Token has been revoked', 'TOKEN_REVOKED')
  }
}

export class UserExistsError extends ConflictError {
  constructor(field: string) {
    super(`User with this ${field} already exists`, 'USER_EXISTS')
  }
}
