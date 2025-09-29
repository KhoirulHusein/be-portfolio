import { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies';

interface SessionCookieOptions {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'strict' | 'lax' | 'none';
  path: string;
  maxAge: number;
  domain?: string;
}

/**
 * Build session cookie options based on environment
 * @param token - JWT token to store in cookie
 * @param env - Current environment (development, test, production)
 * @returns ResponseCookie configuration object
 */
export function buildSessionCookie(token: string, env: string = 'development'): ResponseCookie {
  const cookieName = process.env.SESSION_COOKIE_NAME || 'portfolio_session';
  const maxAge = parseInt(process.env.SESSION_COOKIE_TTL || '2592000'); // 30 days default

  let options: SessionCookieOptions;

  switch (env) {
    case 'production':
      options = {
        httpOnly: true,
        secure: true, // HTTPS only in production
        sameSite: 'none', // Cross-site requests in production
        path: '/',
        maxAge,
        // domain can be set if needed for subdomain sharing
        // domain: '.yourdomain.com'
      };
      break;

    case 'development':
    case 'test':
    default:
      options = {
        httpOnly: true,
        secure: false, // HTTP allowed in dev/test
        sameSite: 'lax', // More permissive for local development
        path: '/',
        maxAge,
      };
      break;
  }

  return {
    name: cookieName,
    value: token,
    ...options,
  };
}

/**
 * Build cookie options to clear session cookie
 * @param env - Current environment
 * @returns ResponseCookie configuration object to clear cookie
 */
export function clearSessionCookie(env: string = 'development'): ResponseCookie {
  const cookieName = process.env.SESSION_COOKIE_NAME || 'portfolio_session';

  let options: Omit<SessionCookieOptions, 'maxAge'> & { maxAge: number; expires: Date };

  switch (env) {
    case 'production':
      options = {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        path: '/',
        maxAge: 0,
        expires: new Date(0), // Set to past date
      };
      break;

    case 'development':
    case 'test':
    default:
      options = {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/',
        maxAge: 0,
        expires: new Date(0), // Set to past date
      };
      break;
  }

  return {
    name: cookieName,
    value: '',
    ...options,
  };
}

/**
 * Get session cookie name from environment
 */
export function getSessionCookieName(): string {
  return process.env.SESSION_COOKIE_NAME || 'portfolio_session';
}

/**
 * Check if current environment is production
 */
export function isProduction(): boolean {
  return process.env.APP_ENV === 'production' || process.env.NODE_ENV === 'production';
}

/**
 * Get current app environment
 */
export function getAppEnvironment(): string {
  return process.env.APP_ENV || process.env.NODE_ENV || 'development';
}