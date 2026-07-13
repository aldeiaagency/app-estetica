import { createHmac, timingSafeEqual } from 'node:crypto'

function secret() {
  const value = process.env.AUTH_SECRET
  if (!value) throw new Error('AUTH_SECRET is required for confirmation links')
  return value
}

export function createConfirmationToken(kind: string, id: string, email: string) {
  return createHmac('sha256', secret())
    .update(`${kind}:${id}:${email.trim().toLowerCase()}`)
    .digest('base64url')
}

export function verifyConfirmationToken(kind: string, id: string, email: string, token?: string) {
  if (!token) return false
  const expected = createConfirmationToken(kind, id, email)
  const actualBuffer = Buffer.from(token)
  const expectedBuffer = Buffer.from(expected)
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer)
}
