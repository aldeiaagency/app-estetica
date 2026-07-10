import { addDays, format } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { getAvailableSlots } from '@/lib/availability/engine'
import { localDayOfWeekMondayZero } from '@/lib/availability/slots'
import { prisma } from '@/lib/db/client'

const describeDatabase = process.env.DATABASE_URL ? describe : describe.skip

describeDatabase('booking concurrency integration', () => {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  let organizationId = ''
  let centerId = ''
  let serviceId = ''
  let staffId = ''
  let customerId = ''
  const bookingIds: string[] = []

  beforeAll(async () => {
    const organization = await prisma.organization.create({
      data: { name: `Test ${suffix}`, slug: `test-${suffix}`, plan: 'BASIC' },
    })
    organizationId = organization.id
    const center = await prisma.center.create({
      data: {
        organizationId,
        name: `Center ${suffix}`,
        slug: `center-${suffix}`,
        category: 'ESTETICA',
        addressCity: 'Madrid',
        addressProvince: 'Madrid',
        published: true,
      },
    })
    centerId = center.id
    const service = await prisma.service.create({
      data: {
        centerId,
        name: 'Servicio concurrente',
        durationMinutes: 30,
        priceCents: 3000,
        bufferMinutesBefore: 0,
        bufferMinutesAfter: 0,
      },
    })
    serviceId = service.id
    const staff = await prisma.staff.create({ data: { centerId, name: 'Profesional test' } })
    staffId = staff.id
    await prisma.serviceStaff.create({ data: { serviceId, staffId } })

    const localDate = toZonedTime(addDays(new Date(), 7), 'Europe/Madrid')
    await prisma.scheduleRule.create({
      data: {
        centerId,
        staffId: null,
        dayOfWeek: localDayOfWeekMondayZero(localDate),
        openTime: '09:00',
        closeTime: '18:00',
        active: true,
      },
    })
    const customer = await prisma.customer.create({
      data: {
        centerId,
        name: 'Clienta test',
        email: `client-${suffix}@example.com`,
      },
    })
    customerId = customer.id
  })

  afterAll(async () => {
    await prisma.booking.deleteMany({ where: { id: { in: bookingIds } } })
    if (customerId) await prisma.customer.deleteMany({ where: { id: customerId } })
    if (serviceId && staffId) await prisma.serviceStaff.deleteMany({ where: { serviceId, staffId } })
    if (centerId) {
      await prisma.scheduleRule.deleteMany({ where: { centerId } })
      await prisma.staff.deleteMany({ where: { centerId } })
      await prisma.service.deleteMany({ where: { centerId } })
      await prisma.center.deleteMany({ where: { id: centerId } })
    }
    if (organizationId) await prisma.organization.deleteMany({ where: { id: organizationId } })
    await prisma.$disconnect()
  })

  it('allows exactly one active booking for the same professional and interval', async () => {
    const localDate = toZonedTime(addDays(new Date(), 7), 'Europe/Madrid')
    const slots = await getAvailableSlots({
      centerId,
      serviceId,
      staffId,
      date: format(localDate, 'yyyy-MM-dd'),
    })
    expect(slots.length).toBeGreaterThan(0)
    const slot = slots[0]

    const create = (code: string) => prisma.booking.create({
      data: {
        confirmationCode: code,
        centerId,
        serviceId,
        staffId,
        customerId,
        startAt: slot.startAt,
        endAt: slot.endAt,
        status: 'CONFIRMED',
      },
    })

    const results = await Promise.allSettled([
      create(`A${suffix.replace(/[^A-Z0-9]/gi, '').slice(-7).toUpperCase()}`),
      create(`B${suffix.replace(/[^A-Z0-9]/gi, '').slice(-7).toUpperCase()}`),
    ])
    for (const result of results) {
      if (result.status === 'fulfilled') bookingIds.push(result.value.id)
    }

    expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1)
    expect(results.filter(result => result.status === 'rejected')).toHaveLength(1)
  })
})
