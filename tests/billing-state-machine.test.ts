import { describe, expect, it } from 'vitest'
import {
  canAdvanceOrderStatus,
  canTransitionBookingStatus,
  canTransitionOrderStatus,
} from '@/lib/billing/state-machine'

describe('financial state machines', () => {
  it('allows only the click-and-collect progression', () => {
    expect(canAdvanceOrderStatus('PAID', 'READY')).toBe(true)
    expect(canAdvanceOrderStatus('READY', 'COMPLETED')).toBe(true)
    expect(canAdvanceOrderStatus('PENDING', 'PAID')).toBe(false)
    expect(canAdvanceOrderStatus('CANCELLED', 'PAID')).toBe(false)
  })

  it('models cancellation without reopening terminal orders', () => {
    expect(canTransitionOrderStatus('PENDING', 'CANCELLED')).toBe(true)
    expect(canTransitionOrderStatus('PAID', 'CANCELLED')).toBe(true)
    expect(canTransitionOrderStatus('COMPLETED', 'CANCELLED')).toBe(false)
    expect(canTransitionOrderStatus('CANCELLED', 'PENDING')).toBe(false)
  })

  it('does not allow booking rollback or direct completion from a hold', () => {
    expect(canTransitionBookingStatus('PENDING', 'CONFIRMED')).toBe(true)
    expect(canTransitionBookingStatus('PENDING', 'COMPLETED')).toBe(false)
    expect(canTransitionBookingStatus('CONFIRMED', 'COMPLETED')).toBe(true)
    expect(canTransitionBookingStatus('CANCELLED', 'CONFIRMED')).toBe(false)
  })
})
