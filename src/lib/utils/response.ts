import { NextResponse } from 'next/server'

import { AuthError } from '@/lib/auth'

export interface APIResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
  }
}

export interface APIErrorResponse {
  success: boolean
  errors: string[]
}

export interface APISuccessResponse<T = any> {
  success: boolean
  data: T
}

export function ok<T>(data: T, status = 200, headers?: Headers): NextResponse {
  const response: APIResponse<T> = {
    success: true,
    data
  }
  const res = NextResponse.json(response, { status })
  
  // Add custom headers if provided
  if (headers) {
    headers.forEach((value, key) => {
      res.headers.set(key, value)
    })
  }
  
  return res
}

export function created<T>(data: T): NextResponse {
  return ok(data, 201)
}

export function noContent(): NextResponse {
  return new NextResponse(null, { status: 204 })
}

export function error(
  message: string, 
  code: string, 
  status = 500,
  headers?: Headers
): NextResponse {
  const response: APIResponse = {
    success: false,
    error: {
      code,
      message
    }
  }
  const res = NextResponse.json(response, { status })
  
  // Add custom headers if provided
  if (headers) {
    headers.forEach((value, key) => {
      res.headers.set(key, value)
    })
  }
  
  return res
}

/**
 * Generate success response with consistent format
 */
export function generateSuccessResponse<T>(data: T, status = 200): NextResponse {
  const response: APISuccessResponse<T> = {
    success: true,
    data
  }
  return NextResponse.json(response, { status })
}

/**
 * Generate error response with consistent format
 */
export function generateErrorResponse(errors: string[], status = 400): NextResponse {
  const response: APIErrorResponse = {
    success: false,
    errors
  }
  return NextResponse.json(response, { status })
}

export function handleError(err: unknown, headers?: Headers): NextResponse {
  console.error('API Error:', err)
  
  if (err instanceof AuthError) {
    return error(err.message, err.code, err.statusCode, headers)
  }
  
  if (err instanceof Error) {
    return error(err.message, 'INTERNAL_ERROR', 500, headers)
  }
  
  return error('An unexpected error occurred', 'INTERNAL_ERROR', 500, headers)
}

export function methodNotAllowed(): NextResponse {
  return error('Method not allowed', 'METHOD_NOT_ALLOWED', 405)
}
