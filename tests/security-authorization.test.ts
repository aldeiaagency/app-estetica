import { readFile } from 'node:fs/promises'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  requirePlatformAdmin: vi.fn(),
  revalidatePath: vi.fn(),
  transaction: vi.fn(),
  centerUpdate: vi.fn(),
  auditCreate: vi.fn(),
}))

vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidatePath }))
vi.mock('@/lib/auth/authorization', () => ({
  requirePlatformAdmin: mocks.requirePlatformAdmin,
}))
vi.mock('@/lib/db/client', () => ({
  prisma: {
    $transaction: mocks.transaction,
    center: { update: mocks.centerUpdate },
    adminAuditLog: { create: mocks.auditCreate },
    organization: { update: vi.fn() },
    organizationAddOn: {
      findFirst: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}))

import { publishCenterAction } from '@/app/actions/admin'

async function source(path: string) {
  return readFile(new URL(`../${path}`, import.meta.url), 'utf8')
}

describe('admin action authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.transaction.mockResolvedValue([])
    mocks.centerUpdate.mockReturnValue({ operation: 'center-update' })
    mocks.auditCreate.mockReturnValue({ operation: 'audit-create' })
  })

  it('rejects a direct action call before touching platform data', async () => {
    mocks.requirePlatformAdmin.mockRejectedValue(new Error('Sin permisos'))

    await expect(publishCenterAction('center-1', 'forged-actor')).resolves.toEqual({
      success: false,
      error: 'Sin permisos',
    })
    expect(mocks.centerUpdate).not.toHaveBeenCalled()
    expect(mocks.auditCreate).not.toHaveBeenCalled()
    expect(mocks.transaction).not.toHaveBeenCalled()
  })

  it('records the authenticated admin instead of a client-provided actor', async () => {
    mocks.requirePlatformAdmin.mockResolvedValue({ id: 'session-admin' })

    await expect(publishCenterAction('center-1', 'forged-actor')).resolves.toEqual({ success: true })
    expect(mocks.auditCreate).toHaveBeenCalledWith({
      data: {
        actorId: 'session-admin',
        action: 'PUBLISH_CENTER',
        targetType: 'Center',
        targetId: 'center-1',
      },
    })
  })
})

describe('identity and tenant security invariants', () => {
  it('fails closed when email verification is unavailable or incomplete', async () => {
    const [registration, authConfig] = await Promise.all([
      source('app/actions/auth.ts'),
      source('lib/auth/config.ts'),
    ])
    const registerAction = registration.slice(
      registration.indexOf('export async function registerUser'),
      registration.indexOf('export async function requestPasswordReset'),
    )

    expect(registerAction).toContain('if (!isEmailConfigured())')
    expect(registerAction).toContain('emailVerified: null')
    expect(registerAction).not.toContain('emailVerified: new Date()')
    expect(authConfig).toContain('if (!user.emailVerified) return null')
    expect(authConfig).not.toContain('isEmailConfigured')
  })

  it('exports only explicitly linked customer activity', async () => {
    const accountExport = await source('app/api/account/export/route.ts')

    expect(accountExport).toContain('where: { userId }')
    expect(accountExport).toContain('where: { customer: { userId } }')
    expect(accountExport).not.toMatch(/OR:\s*\[\{\s*email\s*\}/)
    expect(accountExport).not.toContain('customerEmail: email')
    expect(accountExport).not.toContain('prisma.order.findMany')
  })

  it('derives sensitive beauty identities from the authenticated session', async () => {
    const [profile, plan, routine, benefits, internalProfile] = await Promise.all([
      source('app/actions/beauty-profile.ts'),
      source('app/actions/beauty-plan.ts'),
      source('app/actions/beauty-routine.ts'),
      source('app/actions/benefits.ts'),
      source('lib/beauty/profile-data.ts'),
    ])

    expect(profile).toMatch(/getBeautyProfile\(_legacyUserId\?[\s\S]*?const userId = session\?\.user\?\.id/)
    expect(plan).toMatch(/getOrCreateMonthlyBeautyPlan\(_legacyUserId\?[\s\S]*?const userId = session\?\.user\?\.id/)
    expect(routine).toMatch(/getRoutineForUser\(_legacyUserId\?[\s\S]*?const userId = session\?\.user\?\.id/)
    expect(routine).toMatch(/getReplenishmentForUser\(_legacyUserId\?[\s\S]*?const userId = session\?\.user\?\.id/)
    expect(benefits).toMatch(/getAvailableBenefits\(_legacyProfileId\?[\s\S]*?const userId = session\?\.user\?\.id/)
    expect(internalProfile).toContain("import 'server-only'")
  })

  it('derives follow-up tenants from authorization and filters in SQL', async () => {
    const followUps = await source('app/actions/follow-ups.ts')

    expect(followUps).toContain("import { requireOrganization }")
    expect(followUps).toMatch(/getFollowUpMessagesForOrganization\(_legacyOrgId\?[\s\S]*?requireOrganization\(\)/)
    expect(followUps).toMatch(/getRebookingOpportunities\(_legacyOrgId\?[\s\S]*?requireOrganization\(\)/)
    expect(followUps).toMatch(/scheduleFollowUpsForCompletedBooking\(bookingId: string, _legacyOrgId\?[\s\S]*?requireOrganization\(\)/)
    expect(followUps).toContain('AND c."organizationId" = ${organizationId}')
    expect(followUps).not.toContain('${_legacyOrgId}')
  })
})
