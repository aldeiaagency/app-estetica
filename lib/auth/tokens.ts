import { createHash, randomBytes } from 'crypto'
import { prisma } from '@/lib/db/client'

export type AuthTokenPurpose = 'email-verify' | 'password-reset'

export function authTokenIdentifier(purpose: AuthTokenPurpose, email: string) {
  return `${purpose}:${email.trim().toLowerCase()}`
}

export function hashAuthToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

export async function createAuthToken(identifier: string, expiresInMinutes: number) {
  const token = randomBytes(32).toString('hex')
  const expires = new Date(Date.now() + expiresInMinutes * 60 * 1000)

  await prisma.verificationToken.deleteMany({ where: { identifier } })
  await prisma.verificationToken.create({
    data: {
      identifier,
      token: hashAuthToken(token),
      expires,
    },
  })

  return token
}

export async function consumeAuthToken(identifier: string, token: string) {
  const hashed = hashAuthToken(token)
  const record = await prisma.verificationToken.findFirst({
    where: {
      identifier,
      token: hashed,
      expires: { gt: new Date() },
    },
  })

  if (!record) return false

  await prisma.verificationToken.delete({
    where: {
      identifier_token: {
        identifier,
        token: hashed,
      },
    },
  })

  return true
}
