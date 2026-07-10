import 'server-only'

import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/client'
import type { UserRole } from '@prisma/client'

export class AuthorizationError extends Error {
  constructor(message = 'Sin permisos') {
    super(message)
    this.name = 'AuthorizationError'
  }
}

export async function requireAuthenticatedUser() {
  const session = await auth()
  if (!session?.user?.id) throw new AuthorizationError('Debes iniciar sesión')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, role: true, organizationId: true },
  })
  if (!user) throw new AuthorizationError('Sesión no válida')
  return user
}

export async function requireOrganization() {
  const user = await requireAuthenticatedUser()
  if (!user.organizationId) throw new AuthorizationError('Usuario sin organización')
  if (!['BUSINESS', 'BUSINESS_ADMIN'].includes(user.role)) throw new AuthorizationError()

  const organization = await prisma.organization.findUnique({
    where: { id: user.organizationId },
    select: { id: true, plan: true },
  })
  if (!organization) throw new AuthorizationError()

  return {
    userId: user.id,
    email: user.email,
    role: user.role as UserRole,
    organizationId: organization.id,
    plan: organization.plan,
  }
}

export async function requireAdminOrganization() {
  const context = await requireOrganization()
  if (context.role !== 'BUSINESS_ADMIN') throw new AuthorizationError()
  return context
}

export async function requirePlatformAdmin() {
  const user = await requireAuthenticatedUser()
  if (user.role !== 'PLATFORM_ADMIN') throw new AuthorizationError()
  return user
}

export async function assertOrganization(expectedOrganizationId: string) {
  const context = await requireOrganization()
  if (context.organizationId !== expectedOrganizationId) throw new AuthorizationError()
  return context
}

export async function getCurrentBusinessContext() {
  return requireOrganization()
}
