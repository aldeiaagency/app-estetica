import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('confirmation tokens', () => {
  beforeEach(() => { process.env.AUTH_SECRET = 'test-secret-with-more-than-32-characters' })

  it('accepts only the exact kind, id and email', async () => {
    const { createConfirmationToken, verifyConfirmationToken } = await import('../lib/security/confirmation-token')
    const token = createConfirmationToken('order', 'order-1', 'User@Example.com')
    expect(verifyConfirmationToken('order', 'order-1', 'user@example.com', token)).toBe(true)
    expect(verifyConfirmationToken('order', 'order-2', 'user@example.com', token)).toBe(false)
    expect(verifyConfirmationToken('booking', 'order-1', 'user@example.com', token)).toBe(false)
    expect(verifyConfirmationToken('order', 'order-1', 'other@example.com', token)).toBe(false)
    expect(verifyConfirmationToken('order', 'order-1', 'user@example.com')).toBe(false)
  })
})

describe('n8n delivery', () => {
  beforeEach(() => {
    process.env.N8N_WEBHOOK_SIGNING_SECRET = 'webhook-test-secret'
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }))
  })
  afterEach(() => vi.unstubAllGlobals())

  it('signs and identifies webhook deliveries', async () => {
    const { postN8nWebhook } = await import('../lib/integrations/n8n')
    await postN8nWebhook('https://example.test/hook', { hello: 'world' }, 'evt-1')
    const [, request] = vi.mocked(fetch).mock.calls[0]
    expect(request?.headers).toMatchObject({
      'x-belleza-event-id': 'evt-1',
      'x-belleza-signature': expect.stringMatching(/^sha256=/),
    })
  })

  it('throws so the outbox can retry failures', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 503, text: async () => 'down' }))
    const { postN8nWebhook } = await import('../lib/integrations/n8n')
    await expect(postN8nWebhook('https://example.test/hook', {}, 'evt-2')).rejects.toThrow('503')
  })
})
