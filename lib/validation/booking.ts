import { z } from 'zod'

export const createBookingSchema = z.object({
  centerId: z.string().cuid(),
  serviceId: z.string().cuid(),
  staffId: z.string().cuid().optional(),
  startAt: z.string().datetime(),
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().optional(),
  consentGiven: z.literal(true, {
    errorMap: () => ({ message: 'Debes aceptar la política de privacidad' }),
  }),
})

export const cancelBookingSchema = z.object({
  confirmationCode: z.string().length(8),
  token: z.string().min(10),
})

export const modifyBookingSchema = z.object({
  confirmationCode: z.string().length(8),
  newStartAt: z.string().datetime(),
  newStaffId: z.string().cuid().optional(),
})

export type CreateBookingInput = z.infer<typeof createBookingSchema>
export type CancelBookingInput = z.infer<typeof cancelBookingSchema>
