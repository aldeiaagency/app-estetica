import { PrismaAdapter } from '@auth/prisma-adapter'
import bcrypt from 'bcryptjs'
import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import { z } from 'zod'
import { prisma } from '@/lib/db/client'
import { isEmailConfigured } from '@/lib/email/client'

const signInSchema = z.object({
  email: z.string().trim().email().transform(value => value.toLowerCase()),
  password: z.string().min(8).max(128),
})

type AuthUserRow = {
  id: string
  email: string
  name: string | null
  image: string | null
  password: string | null
  emailVerified: Date | null
  role: string
  organizationId: string | null
  active: boolean
  sessionVersion: number
}

async function findAuthUserByEmail(email: string) {
  const rows = await prisma.$queryRaw<AuthUserRow[]>`
    SELECT
      "id", "email", "name", "image", "password", "emailVerified",
      "role"::text, "organizationId", "active", "sessionVersion"
    FROM "User"
    WHERE "email" = ${email}
    LIMIT 1
  `
  return rows[0] ?? null
}

async function findAuthStateById(id: string) {
  const rows = await prisma.$queryRaw<Pick<AuthUserRow, 'id' | 'role' | 'organizationId' | 'active' | 'sessionVersion'>[]>`
    SELECT "id", "role"::text, "organizationId", "active", "sessionVersion"
    FROM "User"
    WHERE "id" = ${id}
    LIMIT 1
  `
  return rows[0] ?? null
}

function invalidateToken(token: Record<string, unknown>) {
  delete token.id
  delete token.role
  delete token.organizationId
  delete token.sessionVersion
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt', maxAge: 60 * 60 * 24 * 7 },
  pages: { signIn: '/auth/signin', error: '/auth/error' },
  providers: [
    ...(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
      ? [Google({
          clientId: process.env.AUTH_GOOGLE_ID,
          clientSecret: process.env.AUTH_GOOGLE_SECRET,
          allowDangerousEmailAccountLinking: false,
        })]
      : []),
    Credentials({
      async authorize(credentials) {
        const parsed = signInSchema.safeParse(credentials)
        if (!parsed.success) return null

        const user = await findAuthUserByEmail(parsed.data.email)
        if (!user?.active || !user.password) return null
        if (!(await bcrypt.compare(parsed.data.password, user.password))) return null
        if (isEmailConfigured() && !user.emailVerified) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? undefined,
          image: user.image ?? undefined,
          role: user.role,
          organizationId: user.organizationId ?? undefined,
          sessionVersion: user.sessionVersion,
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (!user.id) return false
      const state = await findAuthStateById(user.id)
      return Boolean(state?.active)
    },
    async jwt({ token, user }) {
      if (user) token.id = user.id
      if (!token.id) return token

      const state = await findAuthStateById(token.id as string)
      if (!state?.active) {
        invalidateToken(token)
        return token
      }

      const previousVersion = typeof token.sessionVersion === 'number' ? token.sessionVersion : null
      if (previousVersion !== null && previousVersion !== state.sessionVersion) {
        invalidateToken(token)
        return token
      }

      token.role = state.role
      token.organizationId = state.organizationId ?? undefined
      token.sessionVersion = state.sessionVersion
      return token
    },
    session({ session, token }) {
      if (token?.id) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.organizationId = token.organizationId as string | undefined
      }
      return session
    },
  },
})
