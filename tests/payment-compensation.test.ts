import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  queryRaw: vi.fn(),
  transaction: vi.fn(),
  compensationFindUnique: vi.fn(),
  compensationUpdate: vi.fn(),
  txCompensationUpdate: vi.fn(),
  txOrderUpdateMany: vi.fn(),
  txBookingUpdateMany: vi.fn(),
  refundCreate: vi.fn(),
}))

vi.mock('@/lib/db/client', () => ({
  prisma: {
    $queryRaw: mocks.queryRaw,
    $transaction: mocks.transaction,
    paymentCompensation: {
      findUnique: mocks.compensationFindUnique,
      update: mocks.compensationUpdate,
      updateMany: vi.fn(),
    },
  },
}))

vi.mock('@/lib/billing/stripe', () => ({
  getStripe: () => ({ refunds: { create: mocks.refundCreate } }),
}))

import { processPaymentCompensation } from '@/lib/billing/payment-compensation'

describe('payment compensation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.transaction.mockImplementation(async callback => callback({
      paymentCompensation: { update: mocks.txCompensationUpdate },
      order: { updateMany: mocks.txOrderUpdateMany },
      booking: { updateMany: mocks.txBookingUpdateMany },
    }))
  })

  it('uses a stable idempotency key and marks a successful order refund', async () => {
    mocks.queryRaw.mockResolvedValue([{
      targetType: 'ORDER',
      targetId: 'order_1',
      paymentIntentId: 'pi_1',
      idempotencyKey: 'refund:order:order_1:pi_1',
      reason: 'late_payment',
    }])
    mocks.refundCreate.mockResolvedValue({ id: 're_1', status: 'succeeded' })

    await expect(processPaymentCompensation('pi_1')).resolves.toBe(true)
    expect(mocks.refundCreate).toHaveBeenCalledWith(
      expect.objectContaining({ payment_intent: 'pi_1' }),
      { idempotencyKey: 'refund:order:order_1:pi_1' },
    )
    expect(mocks.txCompensationUpdate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: 'SUCCEEDED', stripeRefundId: 're_1' }),
    }))
    expect(mocks.txOrderUpdateMany).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ paymentState: 'REFUNDED' }),
    }))
  })

  it('keeps an asynchronous refund processing until Stripe confirms it', async () => {
    mocks.queryRaw.mockResolvedValue([{
      targetType: 'BOOKING',
      targetId: 'booking_1',
      paymentIntentId: 'pi_2',
      idempotencyKey: 'refund:booking:booking_1:pi_2',
      reason: 'cancelled_booking',
    }])
    mocks.refundCreate.mockResolvedValue({ id: 're_2', status: 'pending' })

    await expect(processPaymentCompensation('pi_2')).resolves.toBe(false)
    expect(mocks.compensationUpdate).toHaveBeenCalledWith({
      where: { paymentIntentId: 'pi_2' },
      data: { status: 'PROCESSING', stripeRefundId: 're_2' },
    })
    expect(mocks.txBookingUpdateMany).not.toHaveBeenCalled()
  })

  it('does not create a second refund when a retry finds it completed', async () => {
    mocks.queryRaw.mockResolvedValue([])
    mocks.compensationFindUnique.mockResolvedValue({ status: 'SUCCEEDED' })

    await expect(processPaymentCompensation('pi_done')).resolves.toBe(true)
    expect(mocks.refundCreate).not.toHaveBeenCalled()
  })
})
