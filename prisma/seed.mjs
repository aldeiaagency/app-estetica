/**
 * Seed — Negocios demo completos para BellezaLocal
 * Ejecutar: node --env-file=.env.local prisma/seed.mjs
 *
 * Idempotente: seguro de ejecutar varias veces.
 *
 * Crea DOS negocios con perfiles completos:
 *   1. Peluquería Ana García (Madrid)  — centrado en SERVICIOS (agenda, bonos, staff…)
 *   2. Glow Lab Beauty Store (Valencia) — centrado en PRODUCTOS (marketplace amplio)
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
// Imagen determinista y siempre disponible
function img(seed, w = 800, h = 600) {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/${w}/${h}`
}

// ─── Categorías de producto (compartidas) ──────────────────────────────────────

const PRODUCT_CATEGORIES = [
  { slug: 'capilar',    name: 'Cuidado capilar',  icon: '💇', order: 1, description: 'Champús, mascarillas y tratamientos para el cabello.' },
  { slug: 'facial',     name: 'Cuidado facial',   icon: '🧴', order: 2, description: 'Sérums, cremas y limpiadores para el rostro.' },
  { slug: 'corporal',   name: 'Cuidado corporal', icon: '🧼', order: 3, description: 'Aceites, cremas y exfoliantes corporales.' },
  { slug: 'maquillaje', name: 'Maquillaje',       icon: '💄', order: 4, description: 'Bases, labiales, sombras y cosmética de color.' },
  { slug: 'unas',       name: 'Uñas',             icon: '💅', order: 5, description: 'Esmaltes, geles y cuidado de uñas.' },
  { slug: 'solar',      name: 'Protección solar', icon: '☀️', order: 6, description: 'Protectores solares faciales y corporales.' },
  { slug: 'perfumes',   name: 'Perfumes',         icon: '🌸', order: 7, description: 'Fragancias y aguas de colonia.' },
  { slug: 'accesorios', name: 'Accesorios',       icon: '🪮', order: 8, description: 'Herramientas y accesorios de belleza.' },
]

async function ensureProductCategories() {
  const map = {}
  for (const c of PRODUCT_CATEGORIES) {
    const cat = await prisma.productCategory.upsert({
      where:  { slug: c.slug },
      update: { name: c.name, icon: c.icon, order: c.order, description: c.description },
      create: c,
    })
    map[c.slug] = cat.id
  }
  return map
}

// ════════════════════════════════════════════════════════════════════════════
// NEGOCIO 1 — Peluquería Ana García (SERVICIOS)
// ════════════════════════════════════════════════════════════════════════════

async function seedServiceBusiness(catBySlug) {
  console.log('\n💇 Negocio 1 — Peluquería Ana García (servicios)')

  const org = await prisma.organization.upsert({
    where:  { slug: 'peluqueria-ana-garcia-sl' },
    update: {},
    create: { name: 'Peluquería Ana García S.L.', slug: 'peluqueria-ana-garcia-sl', plan: 'PRO', maxCenters: 3 },
  })

  const passwordHash = await bcrypt.hash('Demo2026!', 12)
  await prisma.user.upsert({
    where:  { email: 'ana@bellezalocal.es' },
    update: { organizationId: org.id },
    create: {
      email: 'ana@bellezalocal.es', name: 'Ana García', password: passwordHash,
      role: 'BUSINESS', emailVerified: new Date(), organizationId: org.id,
    },
  })

  const center = await prisma.center.upsert({
    where:  { slug: 'peluqueria-ana-garcia' },
    update: {
      published: true, organizationId: org.id,
      coverImage: img('salon-ana-cover', 1200, 800),
      galleryImages: [img('salon-ana-1'), img('salon-ana-2'), img('salon-ana-3'), img('salon-ana-4')],
    },
    create: {
      organizationId: org.id,
      name: 'Peluquería Ana García',
      slug: 'peluqueria-ana-garcia',
      description: 'Peluquería de barrio con más de 10 años de experiencia. Especialistas en corte, coloración y tratamientos capilares para todos los tipos de cabello.',
      descriptionLong: 'Más de 10 años transformando looks en el corazón de Madrid. Nuestro equipo de especialistas trabaja con las mejores marcas del mercado y las técnicas más innovadoras para que salgas siendo la mejor versión de ti misma.',
      category: 'PELUQUERIA',
      phone: '+34 912 345 678', whatsapp: '+34 612 345 678', email: 'info@peluqueriaanagarcia.es',
      website: 'https://peluqueriaanagarcia.es',
      addressStreet: 'Calle Mayor, 42', addressCity: 'Madrid', addressProvince: 'Madrid', addressPostalCode: '28013',
      addressLat: 40.415363, addressLng: -3.707398,
      coverImage: img('salon-ana-cover', 1200, 800),
      galleryImages: [img('salon-ana-1'), img('salon-ana-2'), img('salon-ana-3'), img('salon-ana-4')],
      published: true,
    },
  })
  console.log('  ✅ Centro → /centro/' + center.slug)

  // Servicios
  const serviceDefinitions = [
    { name: 'Corte y peinado',      description: 'Corte personalizado según tu tipo de cabello y estilo. Incluye lavado y secado.',       durationMinutes: 45,  priceCents: 2800, order: 1 },
    { name: 'Coloración completa',  description: 'Tinte de raíz a puntas con productos profesionales. Consulta de color incluida.',        durationMinutes: 90,  priceCents: 6500, order: 2 },
    { name: 'Mechas o balayage',    description: 'Técnica de iluminación natural. Resultado progresivo y sin mantenimiento agresivo.',     durationMinutes: 120, priceCents: 8500, order: 3 },
    { name: 'Tratamiento keratina', description: 'Alisa y nutre el cabello hasta 6 meses. Ideal para pelo encrespado o dañado.',           durationMinutes: 120, priceCents: 9500, order: 4 },
    { name: 'Manicura gel',         description: 'Manicura completa con esmalte semipermanente de larga duración. Más de 100 colores.',    durationMinutes: 60,  priceCents: 3500, order: 5 },
    { name: 'Pedicura spa',         description: 'Tratamiento completo de pies: exfoliación, hidratación y esmaltado a elección.',         durationMinutes: 75,  priceCents: 4500, order: 6 },
    { name: 'Facial hidratación',   description: 'Limpieza facial profunda + hidratación intensiva. Piel luminosa en una sesión.',         durationMinutes: 60,  priceCents: 5500, order: 7 },
    { name: 'Masaje relajante',     description: 'Masaje corporal descontracturante con aceites esenciales. 60 minutos de bienestar.',     durationMinutes: 60,  priceCents: 6000, order: 8 },
    { name: 'Lavado y brushing',    description: 'Lavado con champú profesional + secado y peinado a elección.',                            durationMinutes: 30,  priceCents: 1800, order: 9 },
  ]
  const services = []
  for (const def of serviceDefinitions) {
    const existing = await prisma.service.findFirst({ where: { centerId: center.id, name: def.name } })
    services.push(existing ?? await prisma.service.create({ data: { centerId: center.id, ...def, active: true } }))
  }
  const svc = Object.fromEntries(services.map(s => [s.name, s]))
  console.log('  ✅ Servicios:', services.length)

  // Staff (con foto)
  const staffDefs = [
    { name: 'Ana García',    role: 'Directora artística',          bio: 'Especialista en coloración y tratamientos con 15 años de experiencia.', image: img('staff-ana'),    order: 1 },
    { name: 'María López',   role: 'Colorista & estilista',        bio: 'Master en balayage y coloración fantasía. Certificada por L\'Oréal.',    image: img('staff-maria'),  order: 2 },
    { name: 'Carlos Ruiz',   role: 'Especialista en tratamientos', bio: 'Experto en keratina, tratamientos capilares y técnicas avanzadas.',      image: img('staff-carlos'), order: 3 },
    { name: 'Laura Sánchez', role: 'Manicurista & esteticista',    bio: 'Especialista en manicura gel, nail art y tratamientos faciales.',         image: img('staff-laura'),  order: 4 },
  ]
  const staffMembers = []
  for (const def of staffDefs) {
    const existing = await prisma.staff.findFirst({ where: { centerId: center.id, name: def.name } })
    staffMembers.push(existing ?? await prisma.staff.create({ data: { centerId: center.id, ...def, active: true } }))
  }
  const [ana, maria, carlos, lauraSt] = staffMembers
  console.log('  ✅ Staff:', staffMembers.length)

  // Horarios
  await prisma.scheduleRule.deleteMany({ where: { centerId: center.id, staffId: null } })
  await prisma.scheduleRule.createMany({
    data: [
      { dayOfWeek: 0, openTime: '09:00', closeTime: '20:00' },
      { dayOfWeek: 1, openTime: '09:00', closeTime: '20:00' },
      { dayOfWeek: 2, openTime: '09:00', closeTime: '20:00' },
      { dayOfWeek: 3, openTime: '09:00', closeTime: '20:00' },
      { dayOfWeek: 4, openTime: '09:00', closeTime: '20:00' },
      { dayOfWeek: 5, openTime: '09:00', closeTime: '15:00' },
    ].map(r => ({ centerId: center.id, ...r, active: true })),
  })

  // ServiceStaff
  const mappings = [
    { staff: ana,     names: serviceDefinitions.map(s => s.name) },
    { staff: maria,   names: ['Corte y peinado', 'Coloración completa', 'Mechas o balayage', 'Lavado y brushing'] },
    { staff: carlos,  names: ['Tratamiento keratina', 'Facial hidratación', 'Masaje relajante'] },
    { staff: lauraSt, names: ['Manicura gel', 'Pedicura spa'] },
  ]
  for (const { staff, names } of mappings) {
    for (const name of names) {
      const service = svc[name]
      if (!service) continue
      const exists = await prisma.serviceStaff.findFirst({ where: { serviceId: service.id, staffId: staff.id } })
      if (!exists) await prisma.serviceStaff.create({ data: { serviceId: service.id, staffId: staff.id } })
    }
  }
  console.log('  ✅ ServiceStaff vinculado')

  // Bonos
  const bonoDefs = [
    { name: 'Bono 5 Cortes',        description: '5 cortes al precio de 4. Para cualquier tipo de corte.',          sessions: 5,  validityDays: 365, priceCents: 12000, serviceId: svc['Corte y peinado']?.id },
    { name: 'Bono 10 Manicuras',    description: 'Tu manicura gel a precio especial. Ahorra más de 50€.',           sessions: 10, validityDays: 365, priceCents: 28000, serviceId: svc['Manicura gel']?.id },
    { name: 'Pack Relax Total',     description: '4 masajes relajantes. El mejor regalo.',                          sessions: 4,  validityDays: 180, priceCents: 21000, serviceId: svc['Masaje relajante']?.id },
    { name: 'Bono Coloración',      description: '3 sesiones de coloración completa.',                              sessions: 3,  validityDays: 180, priceCents: 17500, serviceId: svc['Coloración completa']?.id },
    { name: 'Pack Beauty Completo', description: 'Corte + manicura + facial. La experiencia completa.',             sessions: 3,  validityDays: 90,  priceCents: 14500, serviceId: null },
  ]
  for (const def of bonoDefs) {
    const exists = await prisma.bono.findFirst({ where: { centerId: center.id, name: def.name } })
    if (!exists) await prisma.bono.create({ data: { centerId: center.id, ...def, active: true } })
  }
  console.log('  ✅ Bonos:', bonoDefs.length)

  // Productos (pocos, de venta cruzada) — categorizados y con imagen
  const productDefs = [
    { name: 'Champú reparador Olaplex N°4', brand: 'Olaplex',        cat: 'capilar', description: 'Champú reparador para cabello dañado o teñido. Sin sulfatos. 250ml.', priceCents: 2800, stock: 20 },
    { name: 'Mascarilla Bond Intense',       brand: 'Kérastase',     cat: 'capilar', description: 'Mascarilla de hidratación intensa para cabello muy dañado. 200ml.',   priceCents: 4200, stock: 15 },
    { name: 'Sérum Vitamina C Facial',       brand: 'Medik8',        cat: 'facial',  description: 'Sérum antioxidante con vitamina C al 20%. Luminosidad inmediata. 30ml.', priceCents: 6500, stock: 10 },
    { name: 'Spray Protector Térmico',       brand: 'GHD',           cat: 'capilar', description: 'Protección frente al calor hasta 230°C. 120ml.',                       priceCents: 2500, stock: 18 },
    { name: 'Set Esmaltes Gel',              brand: 'OPI',           cat: 'unas',    description: 'Set de 3 esmaltes de gel de larga duración. Tonos de temporada.',      priceCents: 3200, stock: 8  },
  ]
  await upsertProducts(center.id, productDefs, catBySlug)
  console.log('  ✅ Productos:', productDefs.length)

  // Promociones
  await ensurePromotion(center.id, {
    title: 'Septiembre de estreno: -20% en coloración',
    description: 'Renueva tu color esta temporada con un 20% de descuento en coloración completa.',
    discountType: 'PERCENTAGE', discountValue: 20, serviceId: svc['Coloración completa']?.id,
    startsAt: daysAgo(5), endsAt: daysFromNow(30),
  })
  await ensurePromotion(center.id, {
    title: 'Primera manicura: 5€ de descuento',
    description: 'Si es tu primera visita, llévate 5€ de descuento en tu manicura gel.',
    discountType: 'FIXED_AMOUNT', discountValue: 500, serviceId: svc['Manicura gel']?.id,
    startsAt: daysAgo(2), endsAt: daysFromNow(60),
  })
  console.log('  ✅ Promociones: 2')

  // Clientes
  const customerDefs = [
    { name: 'Laura Martínez',  email: 'laura.martinez@example.com',  phone: '+34 611 222 333' },
    { name: 'Sofía González',  email: 'sofia.gonzalez@example.com',  phone: '+34 622 333 444' },
    { name: 'Elena Rodríguez', email: 'elena.rodriguez@example.com', phone: '+34 633 444 555' },
    { name: 'Patricia Torres', email: 'patricia.torres@example.com', phone: '+34 644 555 666' },
    { name: 'Carmen Jiménez',  email: 'carmen.jimenez@example.com',  phone: '+34 655 666 777' },
  ]
  const customers = []
  for (const def of customerDefs) {
    customers.push(await prisma.customer.upsert({
      where:  { email_centerId: { email: def.email, centerId: center.id } },
      update: {},
      create: { centerId: center.id, ...def, consentGivenAt: new Date(), marketingConsent: true, marketingConsentDate: new Date() },
    }))
  }
  const [laura, sofia, elena, patricia, carmen] = customers

  // Reservas (3 meses) + reseñas
  const bookingDefs = [
    { startAt: daysAgo(12, 10, 0),  service: svc['Corte y peinado'],     staff: ana,     customer: laura,    status: 'COMPLETED' },
    { startAt: daysAgo(10, 11, 30), service: svc['Manicura gel'],         staff: lauraSt, customer: sofia,    status: 'COMPLETED' },
    { startAt: daysAgo(8,  10, 0),  service: svc['Facial hidratación'],   staff: carlos,  customer: elena,    status: 'COMPLETED' },
    { startAt: daysAgo(7,  16, 0),  service: svc['Masaje relajante'],     staff: carlos,  customer: patricia, status: 'COMPLETED' },
    { startAt: daysAgo(5,  12, 0),  service: svc['Mechas o balayage'],    staff: maria,   customer: carmen,   status: 'COMPLETED' },
    { startAt: daysAgo(4,  10, 0),  service: svc['Coloración completa'],  staff: maria,   customer: laura,    status: 'NO_SHOW'   },
    { startAt: daysAgo(3,  9,  0),  service: svc['Corte y peinado'],      staff: ana,     customer: sofia,    status: 'COMPLETED' },
    { startAt: daysAgo(1,  17, 0),  service: svc['Tratamiento keratina'], staff: carlos,  customer: patricia, status: 'COMPLETED' },
    { startAt: daysFromNow(1, 10, 0),  service: svc['Corte y peinado'],    staff: ana,     customer: carmen,   status: 'CONFIRMED' },
    { startAt: daysFromNow(1, 12, 0),  service: svc['Manicura gel'],        staff: lauraSt, customer: laura,    status: 'CONFIRMED' },
    { startAt: daysFromNow(2, 11, 0),  service: svc['Mechas o balayage'],   staff: maria,   customer: sofia,    status: 'CONFIRMED' },
    { startAt: daysFromNow(2, 16, 0),  service: svc['Masaje relajante'],    staff: carlos,  customer: elena,    status: 'PENDING'   },
    { startAt: daysFromNow(3, 9,  30), service: svc['Coloración completa'], staff: maria,   customer: patricia, status: 'PENDING'   },
    { startAt: daysFromNow(5, 11, 0),  service: svc['Facial hidratación'],  staff: carlos,  customer: laura,    status: 'CONFIRMED' },
    { startAt: daysFromNow(10, 10, 0), service: svc['Tratamiento keratina'],staff: carlos,  customer: elena,    status: 'CONFIRMED' },
    { startAt: daysFromNow(14, 9,  0), service: svc['Manicura gel'],        staff: lauraSt, customer: carmen,   status: 'PENDING'   },
    { startAt: daysFromNow(20, 11, 0), service: svc['Corte y peinado'],     staff: ana,     customer: elena,    status: 'CONFIRMED' },
    { startAt: daysFromNow(35, 10, 0), service: svc['Corte y peinado'],     staff: ana,     customer: laura,    status: 'CONFIRMED' },
  ]
  const reviewTexts = [
    'Ana es increíble. El corte me quedó perfecto y el ambiente es muy acogedor. Volveré sin duda.',
    'La manicura duró más de tres semanas sin despegarse. Laura es súper profesional.',
    'El facial fue una experiencia increíble. Salí con la piel luminosa. ¡Recomendado!',
    'El masaje fue justo lo que necesitaba. Carlos tiene manos mágicas.',
    'Muy buenas mechas, el resultado es natural y precioso. María sabe lo que hace.',
    'Siempre salgo encantada. El equipo es amable y los resultados excelentes.',
  ]
  await createBookingsAndReviews(center.id, bookingDefs, reviewTexts, [5, 5, 5, 5, 4, 5])
  console.log('  ✅ Reservas + reseñas creadas')

  return center
}

// ── Helpers de productos / promociones / reservas ─────────────────────────────

async function upsertProducts(centerId, defs, catBySlug) {
  for (const d of defs) {
    const { cat, images, ...rest } = d
    const data = {
      ...rest,
      categoryId: cat ? (catBySlug[cat] ?? null) : null,
      image: rest.image ?? img('prod-' + d.name),
      images: images ?? [img('prod-' + d.name), img('prod-' + d.name + '-2')],
      active: true,
    }
    const existing = await prisma.product.findFirst({ where: { centerId, name: d.name } })
    if (existing) {
      await prisma.product.update({ where: { id: existing.id }, data: { categoryId: data.categoryId, image: data.image, images: data.images } })
    } else {
      await prisma.product.create({ data: { centerId, ...data } })
    }
  }
}

async function ensurePromotion(centerId, def) {
  const existing = await prisma.promotion.findFirst({ where: { centerId, title: def.title } })
  if (!existing) await prisma.promotion.create({ data: { centerId, ...def, active: true } })
}

async function createBookingsAndReviews(centerId, bookingDefs, reviewTexts, ratings) {
  const created = []
  for (const def of bookingDefs) {
    if (!def.service || !def.staff || !def.customer) continue
    try {
      const booking = await prisma.booking.create({
        data: {
          confirmationCode: genCode(), centerId,
          serviceId: def.service.id, staffId: def.staff.id, customerId: def.customer.id,
          startAt: def.startAt, endAt: addMin(def.startAt, def.service.durationMinutes),
          status: def.status, source: 'MARKETPLACE',
        },
      })
      created.push({ booking, def })
    } catch { /* code collision, skip */ }
  }
  const completed = created.filter(b => b.def.status === 'COMPLETED')
  for (let i = 0; i < completed.length && i < reviewTexts.length; i++) {
    const { booking } = completed[i]
    const exists = await prisma.review.findUnique({ where: { bookingId: booking.id } })
    if (exists) continue
    await prisma.review.create({
      data: {
        centerId, bookingId: booking.id, customerId: booking.customerId,
        rating: ratings[i] ?? 5, comment: reviewTexts[i],
        approved: true, publishedAt: new Date(),
      },
    })
  }
}

// ════════════════════════════════════════════════════════════════════════════
// NEGOCIO 2 — Glow Lab Beauty Store (PRODUCTOS)
// ════════════════════════════════════════════════════════════════════════════

async function seedProductBusiness(catBySlug) {
  console.log('\n🛍️  Negocio 2 — Glow Lab Beauty Store (productos)')

  const org = await prisma.organization.upsert({
    where:  { slug: 'glow-lab-beauty-sl' },
    update: {},
    create: { name: 'Glow Lab Beauty S.L.', slug: 'glow-lab-beauty-sl', plan: 'GROWTH', maxCenters: 3 },
  })

  const passwordHash = await bcrypt.hash('Demo2026!', 12)
  await prisma.user.upsert({
    where:  { email: 'tienda@glowlab.es' },
    update: { organizationId: org.id },
    create: {
      email: 'tienda@glowlab.es', name: 'Marta Beltrán', password: passwordHash,
      role: 'BUSINESS', emailVerified: new Date(), organizationId: org.id,
    },
  })

  const center = await prisma.center.upsert({
    where:  { slug: 'glow-lab-beauty-store' },
    update: {
      published: true, organizationId: org.id,
      coverImage: img('glow-cover', 1200, 800),
      galleryImages: [img('glow-1'), img('glow-2'), img('glow-3')],
    },
    create: {
      organizationId: org.id,
      name: 'Glow Lab Beauty Store',
      slug: 'glow-lab-beauty-store',
      description: 'Tienda de cosmética y perfumería premium en Valencia. Las mejores marcas de cuidado facial, capilar, maquillaje y fragancias, con asesoramiento experto.',
      descriptionLong: 'En Glow Lab seleccionamos lo mejor de la cosmética profesional y la perfumería de nicho. Más de 200 referencias de marcas líderes, con asesoramiento personalizado y recogida en tienda. Compra online y recoge en tu próxima visita.',
      category: 'COSMETICA',
      phone: '+34 963 111 222', whatsapp: '+34 600 111 222', email: 'hola@glowlab.es',
      website: 'https://glowlab.es',
      addressStreet: 'Carrer de Colón, 18', addressCity: 'Valencia', addressProvince: 'Valencia', addressPostalCode: '46004',
      addressLat: 39.469907, addressLng: -0.376288,
      coverImage: img('glow-cover', 1200, 800),
      galleryImages: [img('glow-1'), img('glow-2'), img('glow-3')],
      published: true,
    },
  })
  console.log('  ✅ Centro → /centro/' + center.slug)

  // Un par de servicios de tienda (asesoría / maquillaje) para que el perfil sea completo
  const serviceDefinitions = [
    { name: 'Asesoría de belleza personalizada', description: 'Sesión con nuestras expertas para encontrar tu rutina ideal de cuidado facial.', durationMinutes: 30, priceCents: 1500, order: 1 },
    { name: 'Maquillaje profesional',            description: 'Maquillaje para eventos por nuestro equipo. Productos premium incluidos.',        durationMinutes: 60, priceCents: 4500, order: 2 },
  ]
  const services = []
  for (const def of serviceDefinitions) {
    const existing = await prisma.service.findFirst({ where: { centerId: center.id, name: def.name } })
    services.push(existing ?? await prisma.service.create({ data: { centerId: center.id, ...def, active: true } }))
  }
  const svc = Object.fromEntries(services.map(s => [s.name, s]))

  // Staff
  const staffDefs = [
    { name: 'Marta Beltrán',  role: 'Asesora de belleza & maquilladora', bio: 'Maquilladora profesional y asesora de skincare con 8 años de experiencia.', image: img('staff-marta'), order: 1 },
    { name: 'Nadia Costa',    role: 'Especialista en perfumería',         bio: 'Experta en perfumería de nicho y fragancias artesanales.',                  image: img('staff-nadia'), order: 2 },
  ]
  const staffMembers = []
  for (const def of staffDefs) {
    const existing = await prisma.staff.findFirst({ where: { centerId: center.id, name: def.name } })
    staffMembers.push(existing ?? await prisma.staff.create({ data: { centerId: center.id, ...def, active: true } }))
  }
  const [marta, nadia] = staffMembers

  // Horarios de tienda (Lun-Sáb 10-21)
  await prisma.scheduleRule.deleteMany({ where: { centerId: center.id, staffId: null } })
  await prisma.scheduleRule.createMany({
    data: [0, 1, 2, 3, 4, 5].map(d => ({ centerId: center.id, dayOfWeek: d, openTime: '10:00', closeTime: '21:00', active: true })),
  })

  // ServiceStaff
  for (const s of services) {
    for (const st of [marta, nadia]) {
      const exists = await prisma.serviceStaff.findFirst({ where: { serviceId: s.id, staffId: st.id } })
      if (!exists) await prisma.serviceStaff.create({ data: { serviceId: s.id, staffId: st.id } })
    }
  }

  // Catálogo amplio de productos (el corazón de este negocio)
  const productDefs = [
    // Facial
    { name: 'Sérum Hialurónico Hydra Boost', brand: 'The Ordinary',    cat: 'facial',     description: 'Ácido hialurónico 2% + B5. Hidratación profunda. 30ml.',          priceCents: 1290, stock: 40 },
    { name: 'Crema Hidratante Dramatically', brand: 'Clinique',        cat: 'facial',     description: 'Gel-crema hidratante para todo tipo de piel. 50ml.',               priceCents: 3200, stock: 25 },
    { name: 'Contorno de Ojos Advanced',     brand: 'Estée Lauder',    cat: 'facial',     description: 'Reduce signos de fatiga y ojeras. 15ml.',                          priceCents: 5800, stock: 18 },
    { name: 'Limpiador Facial Espuma',       brand: 'CeraVe',          cat: 'facial',     description: 'Espuma limpiadora con ceramidas para piel normal a grasa. 236ml.', priceCents: 1450, stock: 50 },
    // Maquillaje
    { name: 'Base de Maquillaje Luminous',   brand: 'L\'Oréal Paris',  cat: 'maquillaje', description: 'Base fluida de acabado luminoso. 24h de duración. Tonos variados.', priceCents: 1690, stock: 35 },
    { name: 'Paleta de Sombras Nude',        brand: 'Urban Decay',     cat: 'maquillaje', description: '12 tonos nude altamente pigmentados. Acabados mate y satinado.',   priceCents: 4900, stock: 15 },
    { name: 'Labial Mate Velvet',            brand: 'MAC',             cat: 'maquillaje', description: 'Labial de acabado mate aterciopelado y larga duración.',           priceCents: 2400, stock: 30 },
    { name: 'Máscara de Pestañas Volume',    brand: 'Maybelline',      cat: 'maquillaje', description: 'Volumen extremo sin grumos. Cepillo profesional.',                 priceCents: 1290, stock: 45 },
    // Capilar
    { name: 'Champú Nutritivo Argán',        brand: 'Moroccanoil',     cat: 'capilar',    description: 'Champú con aceite de argán para cabello seco. 250ml.',             priceCents: 2600, stock: 22 },
    { name: 'Aceite Capilar Treatment',      brand: 'Moroccanoil',     cat: 'capilar',    description: 'Aceite de tratamiento icónico. Brillo y suavidad. 100ml.',         priceCents: 3900, stock: 20 },
    // Corporal
    { name: 'Crema Corporal Karité',         brand: 'L\'Occitane',     cat: 'corporal',   description: 'Crema ultra nutritiva con 25% de manteca de karité. 200ml.',       priceCents: 3500, stock: 28 },
    { name: 'Exfoliante Corporal Azúcar',    brand: 'Sol de Janeiro',  cat: 'corporal',   description: 'Exfoliante de azúcar con aroma tropical. 220g.',                   priceCents: 2900, stock: 16 },
    // Solar
    { name: 'Protector Solar Facial SPF50+', brand: 'ISDIN',           cat: 'solar',      description: 'Fusion Water. Textura ultraligera de absorción inmediata. 50ml.',  priceCents: 1950, stock: 38 },
    // Perfumes
    { name: 'Eau de Parfum Blossom',         brand: 'Jo Malone',       cat: 'perfumes',   description: 'Fragancia floral fresca. Notas de peonía y manzana. 100ml.',       priceCents: 13500, stock: 10 },
    { name: 'Perfume Noir Intense',          brand: 'Yves Saint Laurent', cat: 'perfumes', description: 'Fragancia oriental intensa para noche. 90ml.',                    priceCents: 11800, stock: 12 },
    // Uñas
    { name: 'Esmalte Gel Semipermanente',    brand: 'Essie',           cat: 'unas',       description: 'Esmalte de larga duración con brillo gel. Sin lámpara.',           priceCents: 990,  stock: 60 },
    // Accesorios
    { name: 'Set 5 Brochas Maquillaje',      brand: 'Real Techniques', cat: 'accesorios', description: 'Set profesional de 5 brochas para rostro y ojos.',                 priceCents: 2790, stock: 24 },
    { name: 'Esponja de Maquillaje Blender', brand: 'beautyblender',   cat: 'accesorios', description: 'Esponja original para un acabado impecable.',                      priceCents: 1990, stock: 33 },
  ]
  await upsertProducts(center.id, productDefs, catBySlug)
  console.log('  ✅ Productos:', productDefs.length)

  // Promoción de tienda
  await ensurePromotion(center.id, {
    title: '-15% en tu primera compra online',
    description: 'Estrena nuestra tienda online con un 15% de descuento en todo el catálogo.',
    discountType: 'PERCENTAGE', discountValue: 15, serviceId: null,
    startsAt: daysAgo(3), endsAt: daysFromNow(45),
  })
  console.log('  ✅ Promociones: 1')

  // Clientes + pedidos + alguna reserva/reseña
  const customerDefs = [
    { name: 'Cliente Demo Valencia', email: 'cliente.valencia@example.com', phone: '+34 666 777 888' },
    { name: 'Marina Soler',          email: 'marina.soler@example.com',     phone: '+34 677 888 999' },
  ]
  const customers = []
  for (const def of customerDefs) {
    customers.push(await prisma.customer.upsert({
      where:  { email_centerId: { email: def.email, centerId: center.id } },
      update: {},
      create: { centerId: center.id, ...def, consentGivenAt: new Date() },
    }))
  }
  const [cliente1, marina] = customers

  // Pedidos demo (estados click & collect)
  const products = await prisma.product.findMany({ where: { centerId: center.id }, take: 6 })
  await ensureOrder(center.id, 'cliente.valencia@example.com', 'Cliente Demo Valencia', [
    { product: products[0], quantity: 1 },
    { product: products[3], quantity: 2 },
  ], 'COMPLETED')
  await ensureOrder(center.id, 'marina.soler@example.com', 'Marina Soler', [
    { product: products[1], quantity: 1 },
  ], 'READY')

  // Una reserva completada de asesoría + reseña
  await createBookingsAndReviews(
    center.id,
    [{ startAt: daysAgo(6, 11, 0), service: svc['Asesoría de belleza personalizada'], staff: marta, customer: cliente1, status: 'COMPLETED' }],
    ['Marta me ayudó a elegir mi rutina y los productos son geniales. Un trato de 10.'],
    [5],
  )
  console.log('  ✅ Pedidos + reseña creados')

  return center
}

async function ensureOrder(centerId, email, name, lines, status) {
  const valid = lines.filter(l => l.product)
  if (valid.length === 0) return
  const exists = await prisma.order.findFirst({ where: { centerId, customerEmail: email, status } })
  if (exists) return
  const totalCents = valid.reduce((s, l) => s + l.product.priceCents * l.quantity, 0)
  await prisma.order.create({
    data: {
      centerId, customerName: name, customerEmail: email,
      totalCents, status,
      paidAt: ['PAID', 'READY', 'COMPLETED'].includes(status) ? new Date() : null,
      items: { create: valid.map(l => ({ productId: l.product.id, name: l.product.name, priceCents: l.product.priceCents, quantity: l.quantity })) },
    },
  })
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Seed BellezaLocal — negocios demo')

  const catBySlug = await ensureProductCategories()
  console.log('✅ Categorías de producto:', Object.keys(catBySlug).length)

  const c1 = await seedServiceBusiness(catBySlug)
  const c2 = await seedProductBusiness(catBySlug)

  console.log('\n🎉 Seed completado!')
  console.log('─────────────────────────────────────────────')
  console.log('💇 Servicios:  /centro/' + c1.slug + '   (login negocio: ana@bellezalocal.es / Demo2026!)')
  console.log('🛍️  Productos:  /centro/' + c2.slug + '  (login negocio: tienda@glowlab.es / Demo2026!)')
  console.log('🔎 Marketplace: /productos   ·   Buscar: /buscar')
  console.log('─────────────────────────────────────────────')
}

main()
  .catch(e => { console.error('❌ Error en seed:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
