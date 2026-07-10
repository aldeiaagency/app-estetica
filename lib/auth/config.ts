import NextAuth from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db/client'
import { z } from 'zod'
import { isEmailConfigured } from '@/lib/email/client'

const signInSchema = z.object({
  email: z.string().trim().email().transform(value => value.toLowerCase()),
  password: z.string().min(8),
})

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt', maxAge: 60 * 60 * 24 * 7 },
  pages: { signIn: '/auth/signin', error: '/auth/error' },
  providers: [
    ...(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
      ? [Google({ clientId: process.env.AUTH_GOOGLE_ID, clientSecret: process.env.AUTH_GOOGLE_SECRET })]
      : []),
    Credentials({
      async authorize(credentials) {
        const parsed = signInSchema.safeParse(credentials)
        if (!parsed.success) return null

        const user = await prisma.user.findUnique({ where: { email: parsed.data.email } })
        if (!user?.password) return null
        if (!(await bcrypt.compare(parsed.data.password, user.password))) return null
        if (isEmailConfigured() && !user.emailVerified) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? undefined,
          image: user.image ?? undefined,
          role: user.role,
          organizationId: user.organizationId ?? undefined,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id
      if (!token.id) return token

      const currentUser = await prisma.user.findUnique({
        where: { id: token.id as string },
        select: { role: true, organizationId: true },
      })
      if (!currentUser) {
        delete token.id
        delete token.role
        delete token.organizationId
        return token
      }

      token.role = currentUser.role
      token.organizationId = currentUser.organizationId ?? undefined
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
