import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/client'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const querySchema = z.object({
  centerId: z.string().min(1),
  serviceId: z.string().min(1),
})

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl

  const parsed = querySchema.safeParse({
    centerId: searchParams.get('centerId'),
    serviceId: searchParams.get('serviceId'),
  })

  if (!parsed.success) {
    return NextResponse.json({ error: 'centerId y serviceId son requeridos' }, { status: 400 })
  }

  const { centerId, serviceId } = parsed.data

  const service = await prisma.service.findFirst({
    where: { id: serviceId, centerId, active: true },
  })

  if (!service) {
    return NextResponse.json({ error: 'Servicio no encontrado' }, { status: 404 })
  }

  // Get staff linked to service, filtered by centerId and active
  const staffLinks = await prisma.serviceStaff.findMany({
    where: {
      serviceId,
      staff: { centerId, active: true },
    },
    select: {
      staff: {
        select: { id: true, name: true, role: true, image: true },
      },
    },
  })

  const staff = staffLinks
    .map(l => l.staff)
    .sort((a, b) => a.name.localeCompare(b.name))

  return NextResponse.json({ staff })
}
