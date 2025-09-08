import { NextResponse } from 'next/server'
import { AuthError } from '../auth/errors'

export interface APIResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
  }
}

export function ok<T>(data: T, status = 200): NextResponse {
  const response: APIResponse<T> = {
    success: true,
    data
  }
  return NextResponse.json(response, { status })
}

export function created<T>(data: T): NextResponse {
  return ok(data, 201)
}

export function noContent(): NextResponse {
  const response: APIResponse = {
    success: true
  }
  return NextResponse.json(response, { status: 204 })
}

export function error(
  message: string, 
  code: string, 
  status = 500
): NextResponse {
  const response: APIResponse = {
    success: false,
    error: {
      code,
      message
    }
  }
  return NextResponse.json(response, { status })
}

export function handleError(err: unknown): NextResponse {
  console.error('API Error:', err)
  
  if (err instanceof AuthError) {
    return error(err.message, err.code, err.statusCode)
  }
  
  if (err instanceof Error) {
    return error(err.message, 'INTERNAL_ERROR', 500)
  }
  
  return error('An unexpected error occurred', 'INTERNAL_ERROR', 500)
}

export function methodNotAllowed(): NextResponse {
  return error('Method not allowed', 'METHOD_NOT_ALLOWED', 405)
}
