import type { BookingStatus, OrderStatus } from '@prisma/client'

const ORDER_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  PENDING: ['PAID', 'CONFIRMED', 'CANCELLED'],
  PAID: ['READY', 'CANCELLED'],
  READY: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CONFIRMED: ['COMPLETED', 'CANCELLED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
}

const ORDER_ADVANCES: Partial<Record<OrderStatus, readonly OrderStatus[]>> = {
  PAID: ['READY'],
  READY: ['COMPLETED'],
  CONFIRMED: ['COMPLETED'],
  SHIPPED: ['DELIVERED'],
}

const BOOKING_TRANSITIONS: Record<BookingStatus, readonly BookingStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['CANCELLED', 'COMPLETED', 'NO_SHOW'],
  CANCELLED: [],
  COMPLETED: [],
  NO_SHOW: [],
}

export function canTransitionOrderStatus(from: OrderStatus, to: OrderStatus): boolean {
  return from === to || ORDER_TRANSITIONS[from].includes(to)
}

export function canAdvanceOrderStatus(from: OrderStatus, to: OrderStatus): boolean {
  return from === to || ORDER_ADVANCES[from]?.includes(to) === true
}

export function canTransitionBookingStatus(from: BookingStatus, to: BookingStatus): boolean {
  return from === to || BOOKING_TRANSITIONS[from].includes(to)
}
