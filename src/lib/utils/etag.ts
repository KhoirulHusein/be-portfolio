import crypto from 'crypto'

/**
 * Generate ETag from a string value
 */
export function generateETag(value: string): string {
  const hash = crypto.createHash('md5').update(value).digest('hex')
  return `"${hash}"`
}
