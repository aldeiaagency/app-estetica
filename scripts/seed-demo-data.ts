/**
 * Seed servicios, staff y horarios para el centro demo.
 * Ejecutar con: DATABASE_URL=... DIRECT_URL=... npx tsx scripts/seed-demo-data.ts
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const center = await prisma.center.findUnique({
    where: { slug: 'peluqueria-ana-garcia-madrid' },
  })

  if (!center) {
    console.error('Centro demo no encontrado. Ejecuta seed-admin.ts primero.')
    process.exit(1)
  }

  console.log('Seeding centro:', center.name)

  // Servicios
  const services = await Promise.all([
    prisma.service.upsert({
      where: { id: 'svc-corte-pelo' },
      update: {},
      create: {
        id: 'svc-corte-pelo',
        centerId: center.id,
        name: 'Corte de pelo',
        description: 'Corte personalizado con lavado y secado.',
        durationMinutes: 60,
        priceCents: 3500,
        bufferMinutesAfter: 10,
        active: true,
        order: 1,
      },
    }),
    prisma.service.upsert({
      where: { id: 'svc-coloracion' },
      update: {},
      create: {
        id: 'svc-coloracion',
        centerId: center.id,
        name: 'Coloración completa',
        description: 'Tinte de raíz a puntas con productos profesionales.',
        durationMinutes: 120,
        priceCents: 8500,
        bufferMinutesAfter: 15,
        active: true,
        order: 2,
      },
    }),
    prisma.service.upsert({
      where: { id: 'svc-mechas' },
      update: {},
      create: {
        id: 'svc-mechas',
        centerId: center.id,
        name: 'Mechas / Highlights',
        description: 'Mechas naturales o baliage para dar luminosidad.',
        durationMinutes: 150,
        priceCents: 12000,
        bufferMinutesAfter: 15,
        active: true,
        order: 3,
      },
    }),
    prisma.service.upsert({
      where: { id: 'svc-peinado' },
      update: {},
      create: {
        id: 'svc-peinado',
        centerId: center.id,
        name: 'Peinado / Brushing',
        description: 'Lavado y peinado a tu gusto.',
        durationMinutes: 45,
        priceCents: 2500,
        bufferMinutesAfter: 5,
        active: true,
        order: 4,
      },
    }),
  ])

  console.log(`✅ ${services.length} servicios creados`)

  // Staff
  const staff = await Promise.all([
    prisma.staff.upsert({
      where: { id: 'staff-ana' },
      update: {},
      create: {
        id: 'staff-ana',
        centerId: center.id,
        name: 'Ana García',
        role: 'Estilista senior',
        active: true,
        order: 1,
      },
    }),
    prisma.staff.upsert({
      where: { id: 'staff-carlos' },
      update: {},
      create: {
        id: 'staff-carlos',
        centerId: center.id,
        name: 'Carlos Martín',
        role: 'Colorista',
        active: true,
        order: 2,
      },
    }),
  ])

  console.log(`✅ ${staff.length} profesionales creados`)

  // ServiceStaff — todos los staff pueden hacer todos los servicios
  for (const svc of services) {
    for (const s of staff) {
      await prisma.serviceStaff.upsert({
        where: { serviceId_staffId: { serviceId: svc.id, staffId: s.id } },
        update: {},
        create: { serviceId: svc.id, staffId: s.id },
      })
    }
  }

  console.log('✅ ServiceStaff vinculado')

  // Horarios semanales: Lun-Vie 9-20, Sáb 9-15
  const schedules = [
    { dayOfWeek: 0, openTime: '09:00', closeTime: '20:00' }, // Lunes
    { dayOfWeek: 1, openTime: '09:00', closeTime: '20:00' }, // Martes
    { dayOfWeek: 2, openTime: '09:00', closeTime: '20:00' }, // Miércoles
    { dayOfWeek: 3, openTime: '09:00', closeTime: '20:00' }, // Jueves
    { dayOfWeek: 4, openTime: '09:00', closeTime: '20:00' }, // Viernes
    { dayOfWeek: 5, openTime: '09:00', closeTime: '15:00' }, // Sábado
  ]

  for (const rule of schedules) {
    const existing = await prisma.scheduleRule.findFirst({
      where: { centerId: center.id, staffId: null, dayOfWeek: rule.dayOfWeek },
    })
    if (!existing) {
      await prisma.scheduleRule.create({
        data: { centerId: center.id, ...rule, active: true },
      })
    }
  }

  console.log('✅ 6 reglas de horario creadas (Lun-Vie + Sáb)')
  console.log('\n🎉 Demo data seeded correctamente')
  console.log('Centro URL:', `/centro/peluqueria-ana-garcia-madrid`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
