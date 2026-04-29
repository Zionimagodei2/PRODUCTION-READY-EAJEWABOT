import { randomBytes, scryptSync, timingSafeEqual } from 'crypto'

const KEYLEN = 64

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, KEYLEN).toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, stored: string) {
  const [salt, originalHash] = stored.split(':')
  if (!salt || !originalHash) return false
  const computedHash = scryptSync(password, salt, KEYLEN)
  const originalBuf = Buffer.from(originalHash, 'hex')
  if (originalBuf.length !== computedHash.length) return false
  return timingSafeEqual(originalBuf, computedHash)
}
