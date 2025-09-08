import jwt, { SignOptions } from 'jsonwebtoken'
import crypto from 'crypto'

type ExpiresIn = SignOptions['expiresIn']

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET!
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!

// Guard: pastikan JWT secrets tidak kosong
if (!ACCESS_SECRET || !REFRESH_SECRET) {
  throw new Error('JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be provided in environment variables')
}

// Beri tipe spesifik agar TS paham format durasi (e.g. "15m", "7d")
const ACCESS_EXPIRES = (process.env.JWT_ACCESS_EXPIRES ?? '15m') as ExpiresIn
const REFRESH_EXPIRES = (process.env.JWT_REFRESH_EXPIRES ?? '7d') as ExpiresIn

export interface JWTPayload {
  sub: string
  username: string
  email: string
  iat?: number
  exp?: number
}

export function signAccessToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  const options: SignOptions = {
    expiresIn: ACCESS_EXPIRES, // <-- sudah bertipe ExpiresIn
  }
  return jwt.sign(payload, ACCESS_SECRET, options)
}

export function verifyAccessToken(token: string): JWTPayload {
  return jwt.verify(token, ACCESS_SECRET) as JWTPayload
}

export function generateRefreshToken(): string {
  return crypto.randomBytes(64).toString('hex')
}

// fungsi ini tetap, hanya pastikan REFRESH_EXPIRES di atas tetap "7d"/"15m" dkk
export function getRefreshTokenExpiry(): Date {
  const expires = (REFRESH_EXPIRES as string) || '7d'
  const match = expires.match(/^(\d+)([dhm])$/)
  
  if (!match) {
    // Default to 7 days
    return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  }
  
  const [, amount, unit] = match
  const amountNum = parseInt(amount, 10)
  
  let ms = 0
  switch (unit) {
    case 'm':
      ms = amountNum * 60 * 1000
      break
    case 'h':
      ms = amountNum * 60 * 60 * 1000
      break
    case 'd':
      ms = amountNum * 24 * 60 * 60 * 1000
      break
    default:
      ms = 7 * 24 * 60 * 60 * 1000 // 7 days default
  }
  
  return new Date(Date.now() + ms)
}
