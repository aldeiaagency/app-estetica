import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  authTokenIdentifier: vi.fn(),
  bcryptHash: vi.fn(),
  consumeAuthToken: vi.fn(),
  createAuthToken: vi.fn(),
  enforceRateLimit: vi.fn(),
  getRequestFingerprint: vi.fn(),
  isEmailConfigured: vi.fn(),
  organizationCreate: vi.fn(),
  redirect: vi.fn(),
  sendEmailVerification: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  transaction: vi.fn(),
  userCreate: vi.fn(),
  userFindUnique: vi.fn(),
}))

vi.mock('bcryptjs', () => ({ default: { hash: mocks.bcryptHash } }))
vi.mock('next/navigation', () => ({ redirect: mocks.redirect }))
vi.mock('@/lib/auth/tokens', () => ({
  authTokenIdentifier: mocks.authTokenIdentifier,
  consumeAuthToken: mocks.consumeAuthToken,
  createAuthToken: mocks.createAuthToken,
}))
vi.mock('@/lib/db/client', () => ({
  prisma: {
    $executeRaw: vi.fn(),
    $transaction: mocks.transaction,
    user: {
      findUnique: mocks.userFindUnique,
      update: vi.fn(),
    },
  },
}))
vi.mock('@/lib/email/auth', () => ({
  sendEmailVerification: mocks.sendEmailVerification,
  sendPasswordResetEmail: mocks.sendPasswordResetEmail,
}))
vi.mock('@/lib/email/client', () => ({ isEmailConfigured: mocks.isEmailConfigured }))
vi.mock('@/lib/security/rate-limit', () => ({
  enforceRateLimit: mocks.enforceRateLimit,
  getRequestFingerprint: mocks.getRequestFingerprint,
}))

import { registerUser } from '@/app/actions/auth'

function registrationForm(overrides: Record<string, string> = {}) {
  const values = {
    name: 'Ana Garcia',
    email: 'ana@example.com',
    password: 'SecurePass123',
    businessName: 'Salon Ana',
    role: 'BUSINESS_ADMIN',
    plan: 'basic',
    termsAccepted: 'on',
    ...overrides,
  }
  const formData = new FormData()
  for (const [key, value] of Object.entries(values)) formData.set(key, value)
  return formData
}

describe('secure registration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getRequestFingerprint.mockResolvedValue('fingerprint')
    mocks.enforceRateLimit.mockResolvedValue(undefined)
    mocks.userFindUnique.mockResolvedValue(null)
    mocks.isEmailConfigured.mockReturnValue(true)
    mocks.bcryptHash.mockResolvedValue('password-hash')
    mocks.organizationCreate.mockResolvedValue({ id: 'organization-1' })
    mocks.userCreate.mockResolvedValue({ id: 'user-1', name: 'Ana Garcia' })
    mocks.transaction.mockImplementation(async callback => callback({
      organization: { create: mocks.organizationCreate },
      user: { create: mocks.userCreate },
    }))
    mocks.authTokenIdentifier.mockReturnValue('email-verify:ana@example.com')
    mocks.createAuthToken.mockResolvedValue('verification-token')
    mocks.sendEmailVerification.mockResolvedValue(undefined)
  })

  it('assigns a validated self-service plan to a business organization', async () => {
    await registerUser(null, registrationForm({ plan: 'growth' }))

    expect(mocks.organizationCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ plan: 'GROWTH' }),
    })
    expect(mocks.userCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        role: 'BUSINESS_ADMIN',
        organizationId: 'organization-1',
        emailVerified: null,
      }),
    })
  })

  it('rejects arbitrary or privileged plans before accessing the database', async () => {
    const result = await registerUser(null, registrationForm({ plan: 'premium' }))

    expect(result).toEqual(expect.objectContaining({ error: expect.any(String) }))
    expect(mocks.userFindUnique).not.toHaveBeenCalled()
    expect(mocks.transaction).not.toHaveBeenCalled()
  })

  it('does not create an organization when a customer submits a business plan', async () => {
    await registerUser(null, registrationForm({ role: 'CUSTOMER', plan: 'pro', businessName: '' }))

    expect(mocks.organizationCreate).not.toHaveBeenCalled()
    expect(mocks.userCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ role: 'CUSTOMER', organizationId: undefined }),
    })
  })

  it('fails closed without email delivery and never auto-verifies the account', async () => {
    mocks.isEmailConfigured.mockReturnValue(false)

    const result = await registerUser(null, registrationForm())

    expect(result).toEqual({
      error: 'El registro no esta disponible temporalmente porque no podemos verificar tu email.',
    })
    expect(mocks.transaction).not.toHaveBeenCalled()
    expect(mocks.sendEmailVerification).not.toHaveBeenCalled()
  })
})
