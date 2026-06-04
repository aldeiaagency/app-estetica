import type { NextAuthConfig } from 'next-auth'

// Config edge-safe: sin Prisma ni bcrypt — solo para el middleware
export const edgeAuthConfig: NextAuthConfig = {
  secret: process.env.AUTH_SECRET,
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  providers: [], // Los providers reales están en lib/auth/config.ts
  callbacks: {
    jwt({ token }) {
      return token
    },
    session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.organizationId = token.organizationId as string | undefined
      }
      return session
    },
  },
}
