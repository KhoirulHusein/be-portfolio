import { NextResponse } from 'next/server'

/**
 * Extract cookie value from response
 */
export function extractCookie(response: NextResponse, cookieName: string): string | null {
  const setCookieHeader = response.headers.get('set-cookie')
  if (!setCookieHeader) return null

  // Match cookie name and capture value (even if empty)
  const cookieMatch = setCookieHeader.match(new RegExp(`${cookieName}=([^;]*)`))
  return cookieMatch ? cookieMatch[1] : null
}

/**
 * Extract all cookies from response as object
 */
export function extractAllCookies(response: NextResponse): Record<string, string> {
  const setCookieHeader = response.headers.get('set-cookie')
  if (!setCookieHeader) return {}

  const cookies: Record<string, string> = {}
  // Updated regex to capture empty values too
  const cookieMatches = setCookieHeader.matchAll(/([^=]+)=([^;]*)/g)
  
  for (const match of cookieMatches) {
    cookies[match[1]] = match[2]
  }
  
  return cookies
}

/**
 * Check if cookie has specific attributes
 */
export function checkCookieAttributes(response: NextResponse, cookieName: string, attributes: string[]): boolean {
  const setCookieHeader = response.headers.get('set-cookie')
  if (!setCookieHeader) return false

  // Look for the specific cookie in the set-cookie header (handle empty values)
  const cookieRegex = new RegExp(`${cookieName}=([^;]*)(.*?)(?=;\\s*[^=]+=|$)`, 'i')
  const match = setCookieHeader.match(cookieRegex)
  
  if (!match) return false
  
  const cookieString = setCookieHeader
  return attributes.every(attr => {
    // Case insensitive match for cookie attributes
    return cookieString.toLowerCase().includes(attr.toLowerCase())
  })
}

/**
 * Create request with cookie header
 */
export function requestWithCookie(url: string, method: string, cookieName: string, cookieValue: string, body?: any, additionalHeaders?: Record<string, string>): Request {
  const headers: Record<string, string> = {
    'cookie': `${cookieName}=${cookieValue}`,
    ...(additionalHeaders ?? {})
  }

  if (body) {
    headers['content-type'] = 'application/json'
  }

  // Ensure absolute URL
  const absoluteUrl = url.startsWith('http') ? url : `http://localhost:4000${url}`

  return new Request(absoluteUrl, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  })
}