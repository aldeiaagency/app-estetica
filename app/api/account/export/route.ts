import { Prisma } from '@prisma/client'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/client'

export const dynamic = 'force-dynamic'

type ExportRow = Record<string, unknown>

async function getRowsByProfile(table: string, profileIds: string[]) {
  if (profileIds.length === 0) return []

  if (table === 'BeautyGoal') {
    return prisma.$queryRaw<ExportRow[]>`SELECT * FROM "BeautyGoal" WHERE "profileId" IN (${Prisma.join(profileIds)})`
  }
  if (table === 'BeautyPlan') {
    return prisma.$queryRaw<ExportRow[]>`SELECT * FROM "BeautyPlan" WHERE "profileId" IN (${Prisma.join(profileIds)})`
  }
  if (table === 'UserBenefit') {
    return prisma.$queryRaw<ExportRow[]>`SELECT * FROM "UserBenefit" WHERE "profileId" IN (${Prisma.join(profileIds)})`
  }
  if (table === 'BeautyRoutine') {
    return prisma.$queryRaw<ExportRow[]>`SELECT * FROM "BeautyRoutine" WHERE "profileId" IN (${Prisma.join(profileIds)})`
  }
  if (table === 'ProductUsage') {
    return prisma.$queryRaw<ExportRow[]>`SELECT * FROM "ProductUsage" WHERE "profileId" IN (${Prisma.join(profileIds)})`
  }

  return []
}

async function getPlanItems(planIds: string[]) {
  if (planIds.length === 0) return []
  return prisma.$queryRaw<ExportRow[]>`SELECT * FROM "BeautyPlanItem" WHERE "planId" IN (${Prisma.join(planIds)})`
}

async function getRoutineSteps(routineIds: string[]) {
  if (routineIds.length === 0) return []
  return prisma.$queryRaw<ExportRow[]>`SELECT * FROM "BeautyRoutineStep" WHERE "routineId" IN (${Prisma.join(routineIds)})`
}

export async function GET() {
  const session = await auth()
  const userId = session?.user?.id
  const email = session?.user?.email?.toLowerCase()

  if (!userId || !email) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      organizationId: true,
      emailVerified: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  const profiles = await prisma.$queryRaw<ExportRow[]>`
    SELECT *
    FROM "BeautyProfile"
    WHERE "userId" = ${userId}
  `
  const profileIds = profiles
    .map(profile => profile.id)
    .filter((id): id is string => typeof id === 'string')

  const [goals, plans, userBenefits, routines, productUsages] = await Promise.all([
    getRowsByProfile('BeautyGoal', profileIds),
    getRowsByProfile('BeautyPlan', profileIds),
    getRowsByProfile('UserBenefit', profileIds),
    getRowsByProfile('BeautyRoutine', profileIds),
    getRowsByProfile('ProductUsage', profileIds),
  ])
  const planIds = plans
    .map(plan => plan.id)
    .filter((id): id is string => typeof id === 'string')
  const routineIds = routines
    .map(routine => routine.id)
    .filter((id): id is string => typeof id === 'string')

  const [planItems, routineSteps, customers, bookings, orders, bonos] = await Promise.all([
    getPlanItems(planIds),
    getRoutineSteps(routineIds),
    prisma.customer.findMany({
      where: { OR: [{ email }, { userId }] },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        marketingConsent: true,
        marketingConsentDate: true,
        consentGivenAt: true,
        createdAt: true,
        updatedAt: true,
        center: { select: { name: true, slug: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.booking.findMany({
      where: { customer: { OR: [{ email }, { userId }] } },
      select: {
        id: true,
        confirmationCode: true,
        startAt: true,
        endAt: true,
        status: true,
        source: true,
        depositCents: true,
        depositPaid: true,
        notes: true,
        cancelledAt: true,
        cancellationReason: true,
        createdAt: true,
        updatedAt: true,
        center: { select: { name: true, slug: true, addressCity: true } },
        service: { select: { name: true, priceCents: true, durationMinutes: true } },
        staff: { select: { name: true } },
      },
      orderBy: { startAt: 'desc' },
      take: 500,
    }),
    prisma.order.findMany({
      where: { customerEmail: email },
      select: {
        id: true,
        customerName: true,
        customerEmail: true,
        customerPhone: true,
        totalCents: true,
        status: true,
        notes: true,
        paidAt: true,
        createdAt: true,
        updatedAt: true,
        center: { select: { name: true, slug: true } },
        items: { select: { name: true, priceCents: true, quantity: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 500,
    }),
    prisma.bonoInstance.findMany({
      where: { customer: { OR: [{ email }, { userId }] } },
      select: {
        id: true,
        sessionsRemaining: true,
        purchasedAt: true,
        activatedAt: true,
        expiresAt: true,
        bono: {
          select: {
            name: true,
            sessions: true,
            validityDays: true,
            priceCents: true,
            center: { select: { name: true, slug: true } },
          },
        },
      },
      orderBy: { purchasedAt: 'desc' },
      take: 500,
    }),
  ])

  const payload = {
    exportedAt: new Date().toISOString(),
    scope: 'Datos asociados a la cuenta autenticada en Belleza Local',
    account: user,
    consents: {
      customerRecords: customers.map(customer => ({
        center: customer.center,
        marketingConsent: customer.marketingConsent,
        marketingConsentDate: customer.marketingConsentDate,
        consentGivenAt: customer.consentGivenAt,
      })),
    },
    personalization: {
      profiles,
      goals,
      plans,
      planItems,
      userBenefits,
      routines,
      routineSteps,
      productUsages,
    },
    activity: {
      bookings,
      orders,
      bonos,
    },
    retentionNote:
      'El borrado automatico de personalizacion no elimina reservas, pedidos, bonos o registros necesarios para prestar el servicio, atender reclamaciones o cumplir obligaciones legales.',
  }

  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="belleza-local-datos-${new Date().toISOString().slice(0, 10)}.json"`,
      'Cache-Control': 'no-store',
    },
  })
}
