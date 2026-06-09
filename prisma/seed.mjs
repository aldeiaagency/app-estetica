/**
 * Seed — Perfil de negocio demo completo para BellezaLocal
 * Ejecutar: npx prisma db seed
 * O:        node --env-file=.env prisma/seed.mjs
 *
 * Idempotente: seguro de ejecutar varias veces.
 * Encuentra o crea el centro demo y añade todos los componentes.
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { randomBytes } from 'crypto'

const prisma = new PrismaClient()

// ─── Helpers ─────────────────────────────────────────────────────────────────

function genCode() {
  return randomBytes(4).toString('hex').toUpperCase()
}

function daysFromNow(n, h = 10, m = 0) {
  const d = new Date()
  d.setDate(d.getDate() + n)
  d.setHours(h, m, 0, 0)
  return d
}

function daysAgo(n, h = 10, m = 0) {
  return daysFromNow(-n, h, m)
}

function addMin(date, minutes) {
  return new Date(date.getTime() + minutes * 60_000)
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Iniciando seed de BellezaLocal...')

  // ── 1. Organización ──────────────────────────────────────────────────────
  const org = await prisma.organization.upsert({
    where:  { slug: 'peluqueria-ana-garcia-sl' },
    update: {},
    create: {
      name:       'Peluquería Ana García S.L.',
      slug:       'peluqueria-ana-garcia-sl',
      plan:       'PRO',
      maxCenters: 3,
    },
  })
  console.log('✅ Organización:', org.name)

  // ── 2. Usuario propietario ────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('Demo2026!', 12)
  const owner = await prisma.user.upsert({
    where:  { email: 'ana@bellezalocal.es' },
    update: { organizationId: org.id },
    create: {
      email:          'ana@bellezalocal.es',
      name:           'Ana García',
      password:       passwordHash,
      role:           'BUSINESS',
      emailVerified:  new Date(),
      organizationId: org.id,
    },
  })
  console.log('✅ Usuario propietario:', owner.email, '/ contraseña: Demo2026!')

  // ── 3. Centro ─────────────────────────────────────────────────────────────
  const center = await prisma.center.upsert({
    where:  { slug: 'peluqueria-ana-garcia' },
    update: {
      published:       true,
      organizationId:  org.id,
      descriptionLong: 'Más de 10 años transformando looks en el corazón de Madrid. Nuestro equipo de especialistas trabaja con las mejores marcas del mercado y las técnicas más innovadoras para que salgas siendo la mejor versión de ti misma.',
    },
    create: {
      organizationId:   org.id,
      name:             'Peluquería Ana García',
      slug:             'peluqueria-ana-garcia',
      description:      'Peluquería de barrio con más de 10 años de experiencia. Especialistas en corte, coloración y tratamientos capilares para todos los tipos de cabello.',
      descriptionLong:  'Más de 10 años transformando looks en el corazón de Madrid.',
      category:         'PELUQUERIA',
      phone:            '+34 912 345 678',
      whatsapp:         '+34 612 345 678',
      email:            'info@peluqueriaanagarcia.es',
      addressStreet:    'Calle Mayor, 42',
      addressCity:      'Madrid',
      addressProvince:  'Madrid',
      addressPostalCode:'28013',
      published:        true,
    },
  })
  console.log('✅ Centro:', center.name, '→ /centro/' + center.slug)

  // ── 4. Servicios ──────────────────────────────────────────────────────────
  const serviceDefinitions = [
    { name: 'Corte y peinado',       description: 'Corte personalizado según tu tipo de cabello y estilo. Incluye lavado y secado.',      durationMinutes: 45,  priceCents: 2800, order: 1 },
    { name: 'Coloración completa',   description: 'Tinte de raíz a puntas con productos profesionales. Consulta de color incluida.',       durationMinutes: 90,  priceCents: 6500, order: 2 },
    { name: 'Mechas o balayage',     description: 'Técnica de iluminación natural. Resultado progresivo y sin mantenimiento agresivo.',     durationMinutes: 120, priceCents: 8500, order: 3 },
    { name: 'Tratamiento keratina',  description: 'Alisa y nutre el cabello hasta 6 meses. Ideal para pelo encrespado o dañado.',           durationMinutes: 120, priceCents: 9500, order: 4 },
    { name: 'Manicura gel',          description: 'Manicura completa con esmalte semipermanente de larga duración. Más de 100 colores.',    durationMinutes: 60,  priceCents: 3500, order: 5 },
    { name: 'Pedicura spa',          description: 'Tratamiento completo de pies: exfoliación, hidratación y esmaltado a elección.',         durationMinutes: 75,  priceCents: 4500, order: 6 },
    { name: 'Facial hidratación',    description: 'Limpieza facial profunda + hidratación intensiva. Piel luminosa en una sesión.',          durationMinutes: 60,  priceCents: 5500, order: 7 },
    { name: 'Masaje relajante',      description: 'Masaje corporal descontracturante con aceites esenciales. 60 minutos de bienestar total.',durationMinutes: 60,  priceCents: 6000, order: 8 },
    { name: 'Lavado y brushing',     description: 'Lavado con champú profesional + secado y peinado a elección.',                           durationMinutes: 30,  priceCents: 1800, order: 9 },
  ]

  const services = []
  for (const def of serviceDefinitions) {
    const existing = await prisma.service.findFirst({ where: { centerId: center.id, name: def.name } })
    if (existing) {
      services.push(existing)
    } else {
      const created = await prisma.service.create({ data: { centerId: center.id, ...def, active: true } })
      services.push(created)
    }
  }
  console.log('✅ Servicios:', services.length)

  // Mapa name → service para referencias rápidas
  const svc = Object.fromEntries(services.map(s => [s.name, s]))

  // ── 5. Staff ──────────────────────────────────────────────────────────────
  const staffDefs = [
    { name: 'Ana García',   role: 'Directora artística',         bio: 'Especialista en coloración y tratamientos capilares con 15 años de experiencia.', order: 1 },
    { name: 'María López',  role: 'Colorista & estilista',       bio: 'Master en técnicas de balayage y coloración fantasía. Certificada por L\'Oréal.',   order: 2 },
    { name: 'Carlos Ruiz',  role: 'Especialista en tratamientos', bio: 'Experto en keratina, tratamientos capilares y técnicas de cuidado avanzadas.',      order: 3 },
    { name: 'Laura Sánchez', role: 'Manicurista & esteticista',  bio: 'Especialista en manicura gel, nail art y tratamientos faciales y corporales.',       order: 4 },
  ]

  const staffMembers = []
  for (const def of staffDefs) {
    const existing = await prisma.staff.findFirst({ where: { centerId: center.id, name: def.name } })
    if (existing) {
      staffMembers.push(existing)
    } else {
      const created = await prisma.staff.create({ data: { centerId: center.id, ...def, active: true } })
      staffMembers.push(created)
    }
  }
  console.log('✅ Staff:', staffMembers.map(s => s.name).join(', '))

  // ── 6. Horarios ───────────────────────────────────────────────────────────
  // Borrar los del centro (sin staffId) y recrear para asegurar correctos
  await prisma.scheduleRule.deleteMany({ where: { centerId: center.id, staffId: null } })
  const scheduleRules = [
    { dayOfWeek: 0, openTime: '09:00', closeTime: '20:00' }, // Lunes
    { dayOfWeek: 1, openTime: '09:00', closeTime: '20:00' },
    { dayOfWeek: 2, openTime: '09:00', closeTime: '20:00' },
    { dayOfWeek: 3, openTime: '09:00', closeTime: '20:00' },
    { dayOfWeek: 4, openTime: '09:00', closeTime: '20:00' }, // Viernes
    { dayOfWeek: 5, openTime: '09:00', closeTime: '15:00' }, // Sábado
  ]
  await prisma.scheduleRule.createMany({
    data: scheduleRules.map(r => ({ centerId: center.id, ...r, active: true })),
  })
  console.log('✅ Horarios: Lun-Vie 09-20h, Sáb 09-15h')

  // ── 7. Bonos ──────────────────────────────────────────────────────────────
  const bonoDefs = [
    { name: 'Bono 5 Cortes',         description: '5 cortes de cabello al precio de 4. Válido para cualquier tipo de corte.',                sessions: 5,  validityDays: 365, priceCents: 12000, serviceId: svc['Corte y peinado']?.id },
    { name: 'Bono 10 Manicuras',     description: 'Tu manicura gel de siempre a precio especial. Ahorra más de 50€.',                         sessions: 10, validityDays: 365, priceCents: 28000, serviceId: svc['Manicura gel']?.id },
    { name: 'Pack Relax Total',      description: '4 masajes relajantes. El mejor regalo para ti o para quien más quieres.',                  sessions: 4,  validityDays: 180, priceCents: 21000, serviceId: svc['Masaje relajante']?.id },
    { name: 'Bono Coloración',       description: '3 sesiones de coloración completa. Mantén tu color siempre perfecto.',                     sessions: 3,  validityDays: 180, priceCents: 17500, serviceId: svc['Coloración completa']?.id },
    { name: 'Pack Beauty Completo',  description: 'Corte + manicura + facial. La experiencia completa de belleza en un solo bono.',            sessions: 3,  validityDays: 90,  priceCents: 14500, serviceId: null },
  ]

  let bonosCreated = 0
  for (const def of bonoDefs) {
    const existing = await prisma.bono.findFirst({ where: { centerId: center.id, name: def.name } })
    if (!existing) {
      await prisma.bono.create({ data: { centerId: center.id, ...def, active: true } })
      bonosCreated++
    }
  }
  console.log('✅ Bonos creados:', bonosCreated, '(total', bonoDefs.length, ')')

  // ── 8. Productos ──────────────────────────────────────────────────────────
  const productDefs = [
    { name: 'Champú reparador Olaplex N°4',  brand: 'Olaplex',          description: 'Champú reparador para cabello dañado o teñido. Sin sulfatos. 250ml.',  priceCents: 2800, stock: 20 },
    { name: 'Mascarilla Bond Intense',        brand: 'Kerastase',        description: 'Mascarilla de hidratación intensa para cabello muy dañado. 200ml.',     priceCents: 4200, stock: 15 },
    { name: 'Sérum Vitamina C Facial',        brand: 'Medik8',           description: 'Sérum antioxidante con vitamina C al 20%. Luminosidad inmediata. 30ml.',priceCents: 6500, stock: 10 },
    { name: 'Aceite Nutritivo Elseve',        brand: 'L\'Oréal Paris',   description: 'Aceite ligero multiusos para cara, cuerpo y cabello. 100ml.',           priceCents: 2200, stock: 25 },
    { name: 'Crema Antienvejecimiento SPF50', brand: 'La Roche-Posay',   description: 'Crema de día con protección solar. Antiedad y nutritiva. 40ml.',        priceCents: 3800, stock: 12 },
    { name: 'Spray Protector Térmico',        brand: 'GHD',              description: 'Protección frente al calor hasta 230°C. 120ml.',                        priceCents: 2500, stock: 18 },
    { name: 'Color Wonder Nail Polish Set',   brand: 'OPI',              description: 'Set de 3 esmaltes de gel de larga duración. Tonos temporada.',           priceCents: 3200, stock: 8  },
  ]

  let productsCreated = 0
  for (const def of productDefs) {
    const existing = await prisma.product.findFirst({ where: { centerId: center.id, name: def.name } })
    if (!existing) {
      await prisma.product.create({ data: { centerId: center.id, ...def, active: true } })
      productsCreated++
    }
  }
  console.log('✅ Productos creados:', productsCreated, '(total', productDefs.length, ')')

  // ── 9. Clientes ───────────────────────────────────────────────────────────
  const customerDefs = [
    { name: 'Laura Martínez',   email: 'laura.martinez@example.com', phone: '+34 611 222 333' },
    { name: 'Sofía González',   email: 'sofia.gonzalez@example.com', phone: '+34 622 333 444' },
    { name: 'Elena Rodríguez',  email: 'elena.rodriguez@example.com', phone: '+34 633 444 555' },
    { name: 'Patricia Torres',  email: 'patricia.torres@example.com', phone: '+34 644 555 666' },
    { name: 'Carmen Jiménez',   email: 'carmen.jimenez@example.com',  phone: '+34 655 666 777' },
  ]

  const customers = []
  for (const def of customerDefs) {
    const customer = await prisma.customer.upsert({
      where:  { email_centerId: { email: def.email, centerId: center.id } },
      update: {},
      create: { centerId: center.id, ...def, consentGivenAt: new Date(), marketingConsent: true, marketingConsentDate: new Date() },
    })
    customers.push(customer)
  }
  console.log('✅ Clientes:', customers.length)

  const [laura, sofia, elena, patricia, carmen] = customers
  const [ana, maria, carlos, lauraSt] = staffMembers

  // ── 9b. ServiceStaff — vincular staff a sus servicios ────────────────────
  const serviceStaffMappings = [
    // Ana García (Directora) → puede realizar todos los servicios
    { staff: ana,     serviceNames: ['Corte y peinado', 'Coloración completa', 'Mechas o balayage', 'Tratamiento keratina', 'Manicura gel', 'Pedicura spa', 'Facial hidratación', 'Masaje relajante', 'Lavado y brushing'] },
    // María López (Colorista) → servicios de color y peluquería
    { staff: maria,   serviceNames: ['Corte y peinado', 'Coloración completa', 'Mechas o balayage', 'Lavado y brushing'] },
    // Carlos Ruiz (Tratamientos) → tratamientos capilares y corporales
    { staff: carlos,  serviceNames: ['Tratamiento keratina', 'Facial hidratación', 'Masaje relajante'] },
    // Laura Sánchez (Manicurista) → manicura, pedicura
    { staff: lauraSt, serviceNames: ['Manicura gel', 'Pedicura spa'] },
  ]

  let serviceStaffCreated = 0
  for (const { staff, serviceNames } of serviceStaffMappings) {
    if (!staff) continue
    for (const name of serviceNames) {
      const service = svc[name]
      if (!service) continue
      const existing = await prisma.serviceStaff.findFirst({
        where: { serviceId: service.id, staffId: staff.id },
      })
      if (!existing) {
        await prisma.serviceStaff.create({ data: { serviceId: service.id, staffId: staff.id } })
        serviceStaffCreated++
      }
    }
  }
  console.log('✅ ServiceStaff:', serviceStaffCreated, 'vínculos creados (total esperado: 20)')

  // ── 10. Reservas ─────────────────────────────────────────────────────────
  // Spread across 3 months (past + future) for a rich calendar
  const bookingDefs = [
    // ── PASADAS (para reseñas + historial) ──
    { startAt: daysAgo(12, 10, 0),  service: svc['Corte y peinado'],      staff: ana,     customer: laura,    status: 'COMPLETED' },
    { startAt: daysAgo(10, 11, 30), service: svc['Manicura gel'],          staff: lauraSt, customer: sofia,    status: 'COMPLETED' },
    { startAt: daysAgo(8,  10, 0),  service: svc['Facial hidratación'],    staff: carlos,  customer: elena,    status: 'COMPLETED' },
    { startAt: daysAgo(7,  16, 0),  service: svc['Masaje relajante'],      staff: carlos,  customer: patricia, status: 'COMPLETED' },
    { startAt: daysAgo(5,  12, 0),  service: svc['Mechas o balayage'],     staff: maria,   customer: carmen,   status: 'COMPLETED' },
    { startAt: daysAgo(4,  10, 0),  service: svc['Coloración completa'],   staff: maria,   customer: laura,    status: 'NO_SHOW'   },
    { startAt: daysAgo(3,  9,  0),  service: svc['Corte y peinado'],       staff: ana,     customer: sofia,    status: 'COMPLETED' },
    { startAt: daysAgo(2,  11, 0),  service: svc['Pedicura spa'],          staff: lauraSt, customer: elena,    status: 'CANCELLED' },
    { startAt: daysAgo(1,  17, 0),  service: svc['Tratamiento keratina'],  staff: carlos,  customer: patricia, status: 'COMPLETED' },

    // ── ESTA SEMANA (próximos 7 días) ──
    { startAt: daysFromNow(1, 10, 0),  service: svc['Corte y peinado'],      staff: ana,     customer: carmen,   status: 'CONFIRMED' },
    { startAt: daysFromNow(1, 12, 0),  service: svc['Manicura gel'],          staff: lauraSt, customer: laura,    status: 'CONFIRMED' },
    { startAt: daysFromNow(2, 11, 0),  service: svc['Mechas o balayage'],     staff: maria,   customer: sofia,    status: 'CONFIRMED' },
    { startAt: daysFromNow(2, 16, 0),  service: svc['Masaje relajante'],      staff: carlos,  customer: elena,    status: 'PENDING'   },
    { startAt: daysFromNow(3, 9,  30), service: svc['Coloración completa'],   staff: maria,   customer: patricia, status: 'PENDING'   },
    { startAt: daysFromNow(4, 10, 0),  service: svc['Pedicura spa'],          staff: lauraSt, customer: carmen,   status: 'CONFIRMED' },
    { startAt: daysFromNow(5, 11, 0),  service: svc['Facial hidratación'],    staff: carlos,  customer: laura,    status: 'CONFIRMED' },
    { startAt: daysFromNow(6, 12, 0),  service: svc['Corte y peinado'],       staff: ana,     customer: sofia,    status: 'PENDING'   },

    // ── PRÓXIMO MES ──
    { startAt: daysFromNow(10, 10, 0), service: svc['Tratamiento keratina'],  staff: carlos,  customer: elena,    status: 'CONFIRMED' },
    { startAt: daysFromNow(12, 11, 0), service: svc['Mechas o balayage'],     staff: maria,   customer: patricia, status: 'CONFIRMED' },
    { startAt: daysFromNow(14, 9,  0), service: svc['Manicura gel'],          staff: lauraSt, customer: carmen,   status: 'PENDING'   },
    { startAt: daysFromNow(16, 12, 0), service: svc['Coloración completa'],   staff: maria,   customer: laura,    status: 'CONFIRMED' },
    { startAt: daysFromNow(18, 10, 0), service: svc['Masaje relajante'],      staff: carlos,  customer: sofia,    status: 'PENDING'   },
    { startAt: daysFromNow(20, 11, 0), service: svc['Corte y peinado'],       staff: ana,     customer: elena,    status: 'CONFIRMED' },
    { startAt: daysFromNow(22, 16, 0), service: svc['Pedicura spa'],          staff: lauraSt, customer: patricia, status: 'CONFIRMED' },
    { startAt: daysFromNow(25, 10, 0), service: svc['Facial hidratación'],    staff: carlos,  customer: carmen,   status: 'PENDING'   },

    // ── DOS MESES VISTA ──
    { startAt: daysFromNow(35, 10, 0), service: svc['Corte y peinado'],       staff: ana,     customer: laura,    status: 'CONFIRMED' },
    { startAt: daysFromNow(38, 11, 0), service: svc['Mechas o balayage'],     staff: maria,   customer: sofia,    status: 'CONFIRMED' },
    { startAt: daysFromNow(40, 9,  0), service: svc['Manicura gel'],          staff: lauraSt, customer: elena,    status: 'PENDING'   },
    { startAt: daysFromNow(45, 12, 0), service: svc['Tratamiento keratina'],  staff: carlos,  customer: patricia, status: 'CONFIRMED' },
    { startAt: daysFromNow(50, 10, 0), service: svc['Coloración completa'],   staff: maria,   customer: carmen,   status: 'PENDING'   },
    { startAt: daysFromNow(55, 11, 0), service: svc['Masaje relajante'],      staff: carlos,  customer: laura,    status: 'CONFIRMED' },
  ]

  const createdBookings = []
  let bookingsCreated = 0
  for (const def of bookingDefs) {
    if (!def.service || !def.staff || !def.customer) continue
    const code = genCode()
    try {
      const booking = await prisma.booking.create({
        data: {
          confirmationCode: code,
          centerId:   center.id,
          serviceId:  def.service.id,
          staffId:    def.staff.id,
          customerId: def.customer.id,
          startAt:    def.startAt,
          endAt:      addMin(def.startAt, def.service.durationMinutes),
          status:     def.status,
          source:     'MARKETPLACE',
        },
      })
      createdBookings.push({ booking, def })
      bookingsCreated++
    } catch {
      // Skip if confirmation code collision (very unlikely)
    }
  }
  console.log('✅ Reservas creadas:', bookingsCreated)

  // ── 11. Reseñas (solo para reservas COMPLETED) ───────────────────────────
  const completedBookings = createdBookings.filter(b => b.def.status === 'COMPLETED')

  const reviewTexts = [
    { rating: 5, comment: 'Ana es increíble. El corte me quedó perfecto y el ambiente del salón es muy acogedor. Volveré sin duda.' },
    { rating: 5, comment: 'La manicura duró más de tres semanas sin despegarse. Laura es súper profesional y detallista.' },
    { rating: 5, comment: 'El facial fue una experiencia increíble. Salí con la piel luminosa y radiante. ¡Totalmente recomendado!' },
    { rating: 5, comment: 'El masaje fue exactamente lo que necesitaba. Carlos tiene manos mágicas. Me fui completamente relajada.' },
    { rating: 4, comment: 'Muy buenas mechas, el resultado es natural y precioso. María sabe muy bien lo que hace. La próxima vez pediré también tratamiento.' },
    { rating: 5, comment: 'Siempre salgo encantada. El equipo es amable, el espacio está muy cuidado y los resultados son siempre excelentes.' },
    { rating: 5, comment: 'La keratina que me hizo Carlos es lo mejor que he probado. El pelo me queda liso y brillante durante semanas.' },
  ]

  let reviewsCreated = 0
  for (let i = 0; i < completedBookings.length && i < reviewTexts.length; i++) {
    const { booking } = completedBookings[i]
    const { rating, comment } = reviewTexts[i]

    // Check if review already exists for this booking
    const existing = await prisma.review.findUnique({ where: { bookingId: booking.id } })
    if (existing) continue

    await prisma.review.create({
      data: {
        centerId:   center.id,
        bookingId:  booking.id,
        customerId: booking.customerId,
        rating,
        comment,
        approved:   true,
        publishedAt: new Date(),
      },
    })
    reviewsCreated++
  }
  console.log('✅ Reseñas creadas:', reviewsCreated)

  // ── 12. Resumen final ─────────────────────────────────────────────────────
  console.log('\n🎉 Seed completado con éxito!')
  console.log('─────────────────────────────────────────────────')
  console.log('🏠 Ficha pública:  /centro/peluqueria-ana-garcia')
  console.log('📅 Dashboard:      /dashboard (iniciar sesión como negocio)')
  console.log('👤 Email:          ana@bellezalocal.es')
  console.log('🔑 Contraseña:     Demo2026!')
  console.log('─────────────────────────────────────────────────')
  console.log('📦 Servicios:  ', services.length)
  console.log('👥 Staff:       ', staffMembers.length)
  console.log('🎁 Bonos:       ', bonoDefs.length)
  console.log('🛍️  Productos:   ', productDefs.length)
  console.log('📆 Reservas:    ', bookingsCreated, '(3 meses de agenda)')
  console.log('⭐  Reseñas:     ', reviewsCreated)
}

main()
  .catch(e => { console.error('❌ Error en seed:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
