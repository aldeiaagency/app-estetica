import 'server-only'

import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/client'

export class AuthorizationError extends Error {
  constructor(message = 'Sin permisos') {
    super(message)
    this.name = 'AuthorizationError'
  }
}

export async function requireAuthenticatedUser() {
  const session = await auth()
  if (!session?.user?.id) throw new AuthorizationError('Debes iniciar sesión')
  return session.user
}

export async function requireOrganization() {
  const user = await requireAuthenticatedUser()
  if (!user.organizationId) throw new AuthorizationError('Usuario sin organización')

  const membership = await prisma.user.findFirst({
    where: { id: user.id, organizationId: user.organizationId },
    select: { id: true, role: true, organizationId: true },
  })
  if (!membership?.organizationId) throw new AuthorizationError()

  return {
    userId: membership.id,
    role: membership.role,
    organizationId: membership.organizationId,
  }
}

export async function requireAdminOrganization() {
  const context = await requireOrganization()
  if (!['BUSINESS_ADMIN', 'SUPER_ADMIN'].includes(context.role)) {
    throw new AuthorizationError()
  }
  return context
}

export async function assertOrganization(expectedOrganizationId: string) {
  const context = await requireAdminOrganization()
  if (context.organizationId !== expectedOrganizationId && context.role !== 'SUPER_ADMIN') {
    throw new AuthorizationError()
  }
  return context
}
