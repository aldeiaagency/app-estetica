/**
 * Internal pilot seed for the Beauty Profile pilot.
 *
 * Run:
 *   node --env-file=.env.local prisma/seed-pilot-belleza.mjs
 *
 * Make pilot centers visible in marketplace:
 *   node --env-file=.env.local prisma/seed-pilot-belleza.mjs --publish
 *
 * The data is intentionally fictional and seoNoindex=true. Replace it with real
 * business data before a public pilot.
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { randomBytes } from 'crypto'
import { nanoid } from 'nanoid'
import { flattenTaxonomy } from './product-taxonomy.mjs'

const prisma = new PrismaClient()
const SHOULD_PUBLISH = process.argv.includes('--publish')
const IS_PRODUCTION = process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production'
if (IS_PRODUCTION || process.env.ALLOW_DEMO_SEED !== 'true') {
  throw new Error('Seed bloqueado. Usa un entorno no productivo y ALLOW_DEMO_SEED=true.')
}
const PASSWORD = process.env.SEED_DEMO_PASSWORD
if (!PASSWORD || PASSWORD.length < 12) {
  throw new Error('SEED_DEMO_PASSWORD debe tener al menos 12 caracteres.')
}

function img(seed, w = 900, h = 650) {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/${w}/${h}`
}

function slugify(value) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70) || 'piloto'
}

function code() {
  return randomBytes(4).toString('hex').toUpperCase()
}

function daysFromNow(days, hour = 10, minute = 0) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  date.setHours(hour, minute, 0, 0)
  return date
}

function daysAgo(days, hour = 10, minute = 0) {
  return daysFromNow(-days, hour, minute)
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60_000)
}

async function ensureProductCategories() {
  const map = {}
  for (const category of flattenTaxonomy()) {
    const parentId = category.parentSlug ? map[category.parentSlug] ?? null : null
    const row = await prisma.productCategory.upsert({
      where: { slug: category.slug },
      update: { name: category.name, icon: category.icon, order: category.order, parentId },
      create: { slug: category.slug, name: category.name, icon: category.icon, order: category.order, parentId },
    })
    map[category.slug] = row.id
  }
  return map
}

async function ensureBusiness(def) {
  const org = await prisma.organization.upsert({
    where: { slug: def.org.slug },
    update: {
      name: def.org.name,
      plan: def.org.plan,
      maxCenters: def.org.maxCenters ?? 1,
    },
    create: {
      name: def.org.name,
      slug: def.org.slug,
      plan: def.org.plan,
      maxCenters: def.org.maxCenters ?? 1,
    },
  })

  const password = await bcrypt.hash(PASSWORD, 12)
  await prisma.user.upsert({
    where: { email: def.owner.email },
    update: {
      name: def.owner.name,
      role: 'BUSINESS',
      organizationId: org.id,
      emailVerified: new Date(),
    },
    create: {
      email: def.owner.email,
      name: def.owner.name,
      password,
      role: 'BUSINESS',
      emailVerified: new Date(),
      organizationId: org.id,
    },
  })

  const center = await prisma.center.upsert({
    where: { slug: def.center.slug },
    update: {
      organizationId: org.id,
      name: def.center.name,
      description: def.center.description,
      descriptionLong: def.center.descriptionLong,
      category: def.center.category,
      phone: def.center.phone,
      whatsapp: def.center.whatsapp,
      email: def.center.email,
      website: def.center.website,
      addressStreet: def.center.addressStreet,
      addressCity: def.center.addressCity,
      addressProvince: def.center.addressProvince,
      addressPostalCode: def.center.addressPostalCode,
      addressLat: def.center.addressLat,
      addressLng: def.center.addressLng,
      coverImage: def.center.coverImage,
      galleryImages: def.center.galleryImages,
      published: SHOULD_PUBLISH,
      seoNoindex: true,
    },
    create: {
      organizationId: org.id,
      ...def.center,
      published: SHOULD_PUBLISH,
      seoNoindex: true,
    },
  })

  const services = await ensureServices(center.id, def.services)
  const staff = await ensureStaff(center.id, def.staff)
  await ensureSchedule(center.id, def.schedule)
  await ensureServiceStaff(services, staff, def.assignments)
  const products = await ensureProducts(center.id, def.products, def.categoryMap)
  const benefits = await ensureBenefits(center.id, def.benefits)
  const packs = await ensurePacks(center.id, def.packs, services, products)
  const customers = await ensureCustomers(center.id, def.customers)
  await ensureBookingsAndReviews(center, services, staff, customers, def.bookings)
  await ensureFollowUpTemplates(center.id, def.followUps)

  return { org, center, services, staff, products, benefits, packs, customers }
}

async function ensureServices(centerId, defs) {
  const out = new Map()
  for (const def of defs) {
    const existing = await prisma.service.findFirst({ where: { centerId, name: def.name } })
    const { key: _key, ...rest } = def
    const data = { centerId, ...rest, active: true }
    const row = existing
      ? await prisma.service.update({ where: { id: existing.id }, data })
      : await prisma.service.create({ data })
    out.set(def.key, row)
  }
  return out
}

async function ensureStaff(centerId, defs) {
  const out = new Map()
  for (const def of defs) {
    const existing = await prisma.staff.findFirst({ where: { centerId, name: def.name } })
    const { key: _key, ...rest } = def
    const data = { centerId, ...rest, active: true }
    const row = existing
      ? await prisma.staff.update({ where: { id: existing.id }, data })
      : await prisma.staff.create({ data })
    out.set(def.key, row)
  }
  return out
}

async function ensureSchedule(centerId, defs) {
  await prisma.scheduleRule.deleteMany({ where: { centerId, staffId: null } })
  await prisma.scheduleRule.createMany({
    data: defs.map(row => ({ centerId, ...row, active: true })),
  })
}

async function ensureServiceStaff(services, staff, assignments) {
  for (const item of assignments) {
    const staffRow = staff.get(item.staff)
    if (!staffRow) continue
    for (const serviceKey of item.services) {
      const service = services.get(serviceKey)
      if (!service) continue
      const exists = await prisma.serviceStaff.findFirst({
        where: { serviceId: service.id, staffId: staffRow.id },
      })
      if (!exists) await prisma.serviceStaff.create({ data: { serviceId: service.id, staffId: staffRow.id } })
    }
  }
}

async function ensureProducts(centerId, defs, categoryMap) {
  const out = new Map()
  for (const def of defs) {
    const slug = def.slug ?? slugify(def.name)
    const existing = await prisma.product.findFirst({ where: { centerId, slug } })
    const data = {
      centerId,
      slug,
      name: def.name,
      brand: def.brand,
      description: def.description,
      priceCents: def.priceCents,
      stock: def.stock,
      categoryId: def.cat ? categoryMap[def.cat] ?? null : null,
      image: def.image ?? img(`pilot-product-${slug}`),
      images: def.images ?? [img(`pilot-product-${slug}`), img(`pilot-product-${slug}-detail`)],
      usageInstructions: def.usageInstructions,
      recommendedFor: def.recommendedFor,
      notRecommendedFor: def.notRecommendedFor,
      expectedDurationDays: def.expectedDurationDays,
      replenishmentIntervalDays: def.replenishmentIntervalDays,
      routineStepType: def.routineStepType,
      compatibilityTags: def.compatibilityTags ?? [],
      recommendationTags: def.recommendationTags ?? [],
      active: true,
    }
    const row = existing
      ? await prisma.product.update({ where: { id: existing.id }, data })
      : await prisma.product.create({ data })
    out.set(def.key, row)
  }

  for (const def of defs) {
    if (!def.alternativeKey) continue
    const product = out.get(def.key)
    const alternative = out.get(def.alternativeKey)
    if (product && alternative) {
      await prisma.product.update({ where: { id: product.id }, data: { alternativeProductId: alternative.id } })
    }
  }

  return out
}

async function ensureBenefits(centerId, defs) {
  const out = new Map()
  for (const def of defs) {
    const existing = await prisma.beautyBenefit.findFirst({ where: { centerId, title: def.title } })
    const data = {
      centerId,
      title: def.title,
      description: def.description,
      benefitType: def.benefitType,
      value: def.value,
      membersOnly: def.membersOnly ?? true,
      active: true,
    }
    const row = existing
      ? await prisma.beautyBenefit.update({ where: { id: existing.id }, data })
      : await prisma.beautyBenefit.create({ data })
    out.set(def.key, row)
  }
  return out
}

async function ensurePacks(centerId, defs, services, products) {
  const out = new Map()
  for (const def of defs) {
    const slug = def.slug ?? slugify(def.name)
    const existing = await prisma.beautyPack.findFirst({ where: { centerId, slug } })
    const data = {
      centerId,
      slug,
      name: def.name,
      objective: def.objective,
      description: def.description,
      audience: def.audience,
      notFor: def.notFor,
      expectedResult: def.expectedResult,
      priceCents: def.priceCents,
      compareAtPriceCents: def.compareAtPriceCents,
      durationDays: def.durationDays,
      preferredArea: def.preferredArea,
      minMaintenanceLevel: def.minMaintenanceLevel,
      featured: def.featured ?? false,
      active: true,
    }

    const row = existing
      ? await prisma.beautyPack.update({ where: { id: existing.id }, data })
      : await prisma.beautyPack.create({ data })

    await prisma.beautyPackItem.deleteMany({ where: { packId: row.id } })
    for (let order = 0; order < def.items.length; order++) {
      const item = def.items[order]
      await prisma.beautyPackItem.create({
        data: {
          packId: row.id,
          label: item.label,
          itemType: item.itemType,
          quantity: item.quantity ?? 1,
          serviceId: item.serviceKey ? services.get(item.serviceKey)?.id ?? null : null,
          productId: item.productKey ? products.get(item.productKey)?.id ?? null : null,
          note: item.note,
          order,
        },
      })
    }
    out.set(def.key, row)
  }
  return out
}

async function ensureCustomers(centerId, defs) {
  const out = new Map()
  for (const def of defs) {
    const row = await prisma.customer.upsert({
      where: { email_centerId: { email: def.email, centerId } },
      update: {
        name: def.name,
        phone: def.phone,
        marketingConsent: def.marketingConsent,
        marketingConsentDate: def.marketingConsent ? new Date() : null,
      },
      create: {
        centerId,
        name: def.name,
        email: def.email,
        phone: def.phone,
        marketingConsent: def.marketingConsent,
        marketingConsentDate: def.marketingConsent ? new Date() : null,
        consentGivenAt: new Date(),
      },
    })
    out.set(def.key, row)
  }
  return out
}

async function ensureBookingsAndReviews(center, services, staff, customers, defs) {
  for (const def of defs) {
    const service = services.get(def.serviceKey)
    const staffRow = staff.get(def.staffKey)
    const customer = customers.get(def.customerKey)
    if (!service || !customer) continue

    const existing = await prisma.booking.findFirst({
      where: {
        centerId: center.id,
        serviceId: service.id,
        customerId: customer.id,
        startAt: def.startAt,
      },
    })

    const booking = existing
      ? await prisma.booking.update({
          where: { id: existing.id },
          data: {
            staffId: staffRow?.id,
            endAt: addMinutes(def.startAt, service.durationMinutes),
            status: def.status,
          },
        })
      : await prisma.booking.create({
          data: {
            confirmationCode: code(),
            centerId: center.id,
            serviceId: service.id,
            staffId: staffRow?.id,
            customerId: customer.id,
            startAt: def.startAt,
            endAt: addMinutes(def.startAt, service.durationMinutes),
            status: def.status,
            source: 'MARKETPLACE',
          },
        })

    if (def.review && def.status === 'COMPLETED') {
      const review = await prisma.review.findUnique({ where: { bookingId: booking.id } })
      const reviewData = {
        centerId: center.id,
        bookingId: booking.id,
        customerId: customer.id,
        rating: def.review.rating,
        comment: def.review.comment,
        approved: true,
        publishedAt: new Date(),
      }
      if (review) await prisma.review.update({ where: { id: review.id }, data: reviewData })
      else await prisma.review.create({ data: reviewData })
    }
  }
}

async function ensureFollowUpTemplates(centerId, defs) {
  for (const def of defs) {
    const existing = await prisma.followUpTemplate.findFirst({ where: { centerId, name: def.name } })
    const { key: _key, ...rest } = def
    const data = { centerId, ...rest, active: true }
    if (existing) await prisma.followUpTemplate.update({ where: { id: existing.id }, data })
    else await prisma.followUpTemplate.create({ data })
  }
}

async function ensurePilotUser(context) {
  const password = await bcrypt.hash(PASSWORD, 12)
  const user = await prisma.user.upsert({
    where: { email: 'piloto.compradora@bellezalocal.es' },
    update: { name: 'Compradora Piloto Madrid', role: 'CUSTOMER', emailVerified: new Date() },
    create: {
      email: 'piloto.compradora@bellezalocal.es',
      name: 'Compradora Piloto Madrid',
      password,
      role: 'CUSTOMER',
      emailVerified: new Date(),
    },
  })

  const profile = await prisma.beautyProfile.upsert({
    where: { userId: user.id },
    update: {
      skinType: 'COMBINATION',
      hairType: 'COLORED',
      beautyStyle: 'NATURAL',
      monthlyBudgetCents: 12000,
      maintenanceLevel: 'MEDIUM',
      mainConcern: 'mejorar luminosidad y mantener el color sin gastar de mas',
      secondaryConcern: 'organizar productos de rutina y reposicion',
      priceSensitivity: 'MEDIUM',
      buyingMotivation: 'ROUTINE',
      fear: 'WASTING_MONEY',
      consentPersonalizationAt: new Date(),
      profileCompletedAt: new Date(),
    },
    create: {
      userId: user.id,
      skinType: 'COMBINATION',
      hairType: 'COLORED',
      beautyStyle: 'NATURAL',
      monthlyBudgetCents: 12000,
      maintenanceLevel: 'MEDIUM',
      mainConcern: 'mejorar luminosidad y mantener el color sin gastar de mas',
      secondaryConcern: 'organizar productos de rutina y reposicion',
      priceSensitivity: 'MEDIUM',
      buyingMotivation: 'ROUTINE',
      fear: 'WASTING_MONEY',
      consentPersonalizationAt: new Date(),
      profileCompletedAt: new Date(),
    },
  })

  await prisma.beautyGoal.deleteMany({ where: { profileId: profile.id } })
  await prisma.beautyGoal.createMany({
    data: [
      { profileId: profile.id, area: 'SKIN', objective: 'Luminosidad sin rutina larga', priority: 0 },
      { profileId: profile.id, area: 'HAIR', objective: 'Mantener color y brillo', priority: 1 },
      { profileId: profile.id, area: 'NAILS', objective: 'Manicura recurrente sencilla', priority: 2 },
    ],
  })

  const month = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
  const existingPlan = await prisma.beautyPlan.findFirst({
    where: { profileId: profile.id, month, title: 'Plan piloto Madrid' },
  })
  const plan = existingPlan
    ? await prisma.beautyPlan.update({
        where: { id: existingPlan.id },
        data: {
          summary: 'Plan de prueba para validar Beauty Profile, packs, wallet, rutina y reposicion con negocios de Madrid.',
          estimatedBudgetCents: 12000,
        },
      })
    : await prisma.beautyPlan.create({
        data: {
          profileId: profile.id,
          title: 'Plan piloto Madrid',
          month,
          summary: 'Plan de prueba para validar Beauty Profile, packs, wallet, rutina y reposicion con negocios de Madrid.',
          estimatedBudgetCents: 12000,
        },
      })

  await prisma.beautyPlanItem.deleteMany({ where: { planId: plan.id } })

  const facial = context.services.get('facial-glow')
  const pack = context.packs.get('piel-4-semanas')
  const serum = context.products.get('serum-niacinamida')
  await prisma.beautyPlanItem.createMany({
    data: [
      {
        id: nanoid(),
        planId: plan.id,
        type: 'SERVICE',
        title: 'Reservar higiene facial suave',
        reason: 'Encaja con piel mixta, presupuesto medio y objetivo de luminosidad sin cambios agresivos.',
        priority: 0,
        serviceId: facial?.id,
        centerId: context.center.id,
        estimatedPriceCents: facial?.priceCents ?? 5200,
      },
      {
        id: nanoid(),
        planId: plan.id,
        type: 'PACK',
        title: 'Valorar pack Piel 4 semanas',
        reason: 'Permite probar seguimiento y rutina corta antes de comprar mas productos.',
        priority: 1,
        packId: pack?.id,
        centerId: context.center.id,
        estimatedPriceCents: pack?.priceCents ?? 9900,
      },
      {
        id: nanoid(),
        planId: plan.id,
        type: 'PRODUCT',
        title: 'Guardar serum de niacinamida en rutina',
        reason: 'Producto sencillo para controlar brillo y mantener una rutina corta.',
        priority: 2,
        productId: serum?.id,
        centerId: context.center.id,
        estimatedPriceCents: serum?.priceCents ?? 1890,
      },
      {
        id: nanoid(),
        planId: plan.id,
        type: 'AVOID',
        title: 'Evitar comprar una rutina completa de golpe',
        reason: 'La prueba busca validar decisiones graduales y reducir gasto innecesario.',
        priority: 3,
      },
    ],
  })

  const benefit = context.benefits.get('revision-rutina')
  if (benefit) {
    await prisma.userBenefit.upsert({
      where: { profileId_benefitId: { profileId: profile.id, benefitId: benefit.id } },
      update: { status: 'CLAIMED', claimedAt: new Date() },
      create: { profileId: profile.id, benefitId: benefit.id, status: 'CLAIMED', claimedAt: new Date() },
    })
  }

  const routine = await prisma.beautyRoutine.findFirst({
    where: { profileId: profile.id, title: 'Rutina piloto corta' },
  })
  if (routine) {
    const steps = await prisma.beautyRoutineStep.findMany({ where: { routineId: routine.id }, select: { id: true } })
    await prisma.productUsage.deleteMany({ where: { stepId: { in: steps.map(step => step.id) } } })
    await prisma.beautyRoutineStep.deleteMany({ where: { routineId: routine.id } })
  }

  const activeRoutine = routine ?? await prisma.beautyRoutine.create({
    data: { profileId: profile.id, title: 'Rutina piloto corta' },
  })

  const moisturizer = context.products.get('crema-barrera')
  for (const [order, item] of [
    { product: serum, title: 'Serum control brillo', stepType: 'SERUM', moment: 'MORNING', interval: 45 },
    { product: moisturizer, title: 'Crema barrera ligera', stepType: 'MOISTURIZER', moment: 'EVENING', interval: 60 },
  ].entries()) {
    if (!item.product) continue
    const step = await prisma.beautyRoutineStep.create({
      data: {
        routineId: activeRoutine.id,
        productId: item.product.id,
        title: item.title,
        stepType: item.stepType,
        moment: item.moment,
        instructions: item.product.usageInstructions,
        order,
      },
    })
    await prisma.productUsage.create({
      data: {
        profileId: profile.id,
        productId: item.product.id,
        stepId: step.id,
        status: 'IN_USE',
        expectedEndAt: daysFromNow(item.interval),
        replenishmentEnabled: true,
        replenishmentIntervalDays: item.interval,
      },
    })
  }

  return { user, profile, plan }
}

function pilotBusinesses(categoryMap) {
  const defaultSchedule = [
    { dayOfWeek: 0, openTime: '10:00', closeTime: '20:00' },
    { dayOfWeek: 1, openTime: '10:00', closeTime: '20:00' },
    { dayOfWeek: 2, openTime: '10:00', closeTime: '20:00' },
    { dayOfWeek: 3, openTime: '10:00', closeTime: '20:00' },
    { dayOfWeek: 4, openTime: '10:00', closeTime: '20:00' },
    { dayOfWeek: 5, openTime: '10:00', closeTime: '14:30' },
  ]

  return [
    {
      categoryMap,
      org: { name: 'Piloto Luz Serena SL', slug: 'piloto-luz-serena-sl', plan: 'GROWTH', maxCenters: 1 },
      owner: { name: 'Elena Ruiz', email: 'piloto.luzserena@bellezalocal.es' },
      center: {
        name: 'Piloto Luz Serena Estetica',
        slug: 'piloto-luz-serena-estetica',
        description: 'Centro interno de piloto para faciales suaves, rutina corta y seguimiento postservicio.',
        descriptionLong: 'Ficha ficticia para validar el piloto de Beauty Profile en Madrid. No representa un negocio real.',
        category: 'ESTETICA',
        phone: '+34 910 000 101',
        whatsapp: '+34 610 000 101',
        email: 'piloto.luzserena@bellezalocal.es',
        website: 'https://example.com/piloto-luz-serena',
        addressStreet: 'Calle Piloto, 12',
        addressCity: 'Madrid',
        addressProvince: 'Madrid',
        addressPostalCode: '28010',
        addressLat: 40.432200,
        addressLng: -3.697700,
        coverImage: img('pilot-luz-serena-cover', 1200, 800),
        galleryImages: [img('pilot-luz-serena-1'), img('pilot-luz-serena-2'), img('pilot-luz-serena-3')],
      },
      services: [
        { key: 'facial-glow', name: 'Higiene facial glow suave', description: 'Limpieza, exfoliacion suave e hidratacion final con rutina recomendada.', durationMinutes: 60, priceCents: 5200, order: 1 },
        { key: 'revision-rutina', name: 'Revision de rutina facial', description: 'Sesion corta para revisar productos actuales y evitar compras innecesarias.', durationMinutes: 30, priceCents: 1800, order: 2 },
        { key: 'ritual-calma', name: 'Ritual calma para piel sensible', description: 'Tratamiento no medico orientado a confort y cuidado cosmetico suave.', durationMinutes: 70, priceCents: 6800, order: 3 },
      ],
      staff: [
        { key: 'elena', name: 'Elena Ruiz', role: 'Esteticista y asesora facial', bio: 'Especialista en rutinas sencillas y seguimiento postservicio.', image: img('pilot-staff-elena'), order: 1 },
        { key: 'irene', name: 'Irene Plaza', role: 'Cabina facial', bio: 'Acompana faciales suaves y revisiones de rutina.', image: img('pilot-staff-irene'), order: 2 },
      ],
      schedule: defaultSchedule,
      assignments: [
        { staff: 'elena', services: ['facial-glow', 'revision-rutina', 'ritual-calma'] },
        { staff: 'irene', services: ['facial-glow', 'ritual-calma'] },
      ],
      products: [
        {
          key: 'serum-niacinamida',
          name: 'Serum piloto niacinamida 5',
          brand: 'BellezaLocal Lab',
          cat: 'serums-faciales',
          description: 'Serum ligero para rutina corta de piel mixta. Producto ficticio de piloto.',
          priceCents: 1890,
          stock: 24,
          usageInstructions: 'Aplicar 2-3 gotas por la manana antes de hidratante. Introducir poco a poco.',
          recommendedFor: 'Piel mixta que quiere controlar brillo sin una rutina larga.',
          notRecommendedFor: 'Usuarias que ya usan muchos activos o prefieren rutina solo de noche.',
          expectedDurationDays: 45,
          replenishmentIntervalDays: 45,
          routineStepType: 'SERUM',
          compatibilityTags: ['piel-mixta', 'rutina-corta'],
          recommendationTags: ['luminosidad', 'control-brillo'],
          alternativeKey: 'crema-barrera',
        },
        {
          key: 'crema-barrera',
          name: 'Crema piloto barrera ligera',
          brand: 'BellezaLocal Lab',
          cat: 'cremas-hidratantes',
          description: 'Crema ligera para cerrar rutina. Producto ficticio de piloto.',
          priceCents: 2190,
          stock: 30,
          usageInstructions: 'Aplicar una cantidad pequena tras el serum, manana o noche.',
          recommendedFor: 'Rutinas sencillas que necesitan hidratacion sin acabado pesado.',
          notRecommendedFor: 'Piel muy seca que necesita textura rica.',
          expectedDurationDays: 60,
          replenishmentIntervalDays: 60,
          routineStepType: 'MOISTURIZER',
          compatibilityTags: ['piel-mixta', 'barrera'],
          recommendationTags: ['hidratacion', 'rutina-corta'],
        },
        {
          key: 'spf-ligero',
          name: 'Protector solar piloto SPF50 ligero',
          brand: 'BellezaLocal Lab',
          cat: 'solar-facial',
          description: 'Protector solar facial ligero. Producto ficticio de piloto.',
          priceCents: 1990,
          stock: 18,
          usageInstructions: 'Aplicar por la manana como ultimo paso y reaplicar si procede.',
          recommendedFor: 'Usuarias que quieren una rutina diaria breve.',
          notRecommendedFor: 'Quien busque cobertura tipo maquillaje.',
          expectedDurationDays: 40,
          replenishmentIntervalDays: 40,
          routineStepType: 'SPF',
          compatibilityTags: ['spf', 'rutina-corta'],
          recommendationTags: ['proteccion', 'uso-diario'],
        },
      ],
      benefits: [
        { key: 'revision-rutina', title: 'Revision de rutina incluida', description: 'Una revision de 15 minutos despues del primer facial del piloto.', benefitType: 'FREE_REVIEW', value: '15 min', membersOnly: true },
        { key: 'descuento-producto', title: '10% en segundo producto de rutina', description: 'Solo si la usuaria decide guardar una rutina de maximo 3 pasos.', benefitType: 'DISCOUNT', value: '10%', membersOnly: true },
      ],
      packs: [
        {
          key: 'piel-4-semanas',
          name: 'Pack piloto piel 4 semanas',
          slug: 'pack-piloto-piel-4-semanas',
          objective: 'Luminosidad y rutina corta',
          description: 'Facial suave, revision de rutina y dos productos base para probar adherencia.',
          audience: 'Usuarias que quieren ordenar su rutina sin comprar demasiados productos.',
          notFor: 'No es un tratamiento medico ni una promesa de resultado.',
          expectedResult: 'Rutina mas clara y decision de recompra mas consciente.',
          priceCents: 9900,
          compareAtPriceCents: 11200,
          durationDays: 28,
          preferredArea: 'SKIN',
          minMaintenanceLevel: 'MEDIUM',
          featured: true,
          items: [
            { label: 'Higiene facial glow suave', itemType: 'SERVICE', serviceKey: 'facial-glow' },
            { label: 'Revision de rutina', itemType: 'CONSULTATION', serviceKey: 'revision-rutina' },
            { label: 'Serum piloto niacinamida 5', itemType: 'PRODUCT', productKey: 'serum-niacinamida' },
            { label: 'Seguimiento in-app a los 10 dias', itemType: 'FOLLOW_UP' },
          ],
        },
      ],
      followUps: [
        { name: 'Piloto seguimiento facial 10 dias', category: 'FACIAL', purpose: 'FOLLOW_UP', channel: 'EMAIL', serviceKeyword: 'facial', subject: 'Como va tu rutina despues del facial?', body: 'Hola {customerName}, han pasado unos dias desde {serviceName}. Si quieres ajustar algun paso, podemos revisar tu rutina sin anadir productos de mas. - {centerName}', sendAfterDays: 10, consentRequired: false },
        { name: 'Piloto beneficio con consentimiento', category: 'FACIAL', purpose: 'MARKETING', channel: 'EMAIL', serviceKeyword: 'rutina', subject: 'Revision de rutina disponible', body: 'Hola {customerName}, si quieres mantener tu rutina corta, tienes una revision disponible esta semana. - {centerName}', sendAfterDays: 20, consentRequired: true },
      ],
      customers: [
        { key: 'laura', name: 'Laura Piloto', email: 'laura.piloto@example.com', phone: '+34 611 000 101', marketingConsent: true },
        { key: 'marta', name: 'Marta Sin Marketing', email: 'marta.sinmarketing@example.com', phone: '+34 611 000 102', marketingConsent: false },
      ],
      bookings: [
        { customerKey: 'laura', serviceKey: 'facial-glow', staffKey: 'elena', startAt: daysAgo(18, 10, 0), status: 'COMPLETED', review: { rating: 5, comment: 'Me ayudo a entender que comprar y que evitar. La rutina quedo muy clara.' } },
        { customerKey: 'marta', serviceKey: 'revision-rutina', staffKey: 'elena', startAt: daysAgo(8, 12, 0), status: 'COMPLETED', review: { rating: 4, comment: 'Revision practica, sin presion por comprar mas productos.' } },
        { customerKey: 'laura', serviceKey: 'ritual-calma', staffKey: 'irene', startAt: daysFromNow(3, 11, 0), status: 'CONFIRMED' },
      ],
    },
    {
      categoryMap,
      org: { name: 'Piloto Nail Club SL', slug: 'piloto-nail-club-sl', plan: 'PRO', maxCenters: 1 },
      owner: { name: 'Clara Marin', email: 'piloto.nailclub@bellezalocal.es' },
      center: {
        name: 'Piloto Nail Club Chamberi',
        slug: 'piloto-nail-club-chamberi',
        description: 'Centro interno de piloto para manicura recurrente, beneficios y seguimiento.',
        descriptionLong: 'Ficha ficticia para validar packs de unas, recurrencia y beneficios. No representa un negocio real.',
        category: 'UNAS',
        phone: '+34 910 000 201',
        whatsapp: '+34 610 000 201',
        email: 'piloto.nailclub@bellezalocal.es',
        website: 'https://example.com/piloto-nail-club',
        addressStreet: 'Calle Piloto, 24',
        addressCity: 'Madrid',
        addressProvince: 'Madrid',
        addressPostalCode: '28015',
        addressLat: 40.433900,
        addressLng: -3.708200,
        coverImage: img('pilot-nail-club-cover', 1200, 800),
        galleryImages: [img('pilot-nail-club-1'), img('pilot-nail-club-2'), img('pilot-nail-club-3')],
      },
      services: [
        { key: 'mani-semi', name: 'Manicura semipermanente cuidada', description: 'Manicura con preparacion, color y recomendaciones de mantenimiento.', durationMinutes: 55, priceCents: 3200, order: 1 },
        { key: 'retiro', name: 'Retirada y cuidado de una', description: 'Retirada segura y cuidado de una antes de nueva aplicacion.', durationMinutes: 30, priceCents: 1500, order: 2 },
      ],
      staff: [
        { key: 'clara', name: 'Clara Marin', role: 'Manicurista', bio: 'Especialista en manicura recurrente y cuidado de una natural.', image: img('pilot-staff-clara'), order: 1 },
      ],
      schedule: defaultSchedule,
      assignments: [{ staff: 'clara', services: ['mani-semi', 'retiro'] }],
      products: [
        { key: 'aceite-cuticulas', name: 'Aceite piloto cuticulas', brand: 'BellezaLocal Lab', cat: 'cuidado-unas', description: 'Aceite de cuticulas para mantenimiento en casa.', priceCents: 890, stock: 25, usageInstructions: 'Aplicar por la noche en cuticula y masajear.', recommendedFor: 'Manicuras semipermanentes que buscan durar mejor.', notRecommendedFor: 'Usuarias con alergias conocidas a aceites cosmeticos.', expectedDurationDays: 75, replenishmentIntervalDays: 75, routineStepType: 'NAIL_CARE', compatibilityTags: ['unas'], recommendationTags: ['mantenimiento'] },
      ],
      benefits: [
        { key: 'prioridad-retiro', title: 'Hueco prioritario para retirada', description: 'Prioridad si la manicura necesita retirada antes de repetir.', benefitType: 'PRIORITY_BOOKING', value: 'prioridad', membersOnly: true },
      ],
      packs: [
        {
          key: 'manicura-mes',
          name: 'Pack piloto manicura del mes',
          slug: 'pack-piloto-manicura-mes',
          objective: 'Manicura recurrente sin improvisar',
          description: 'Manicura semipermanente, retirada y aceite de cuidado.',
          audience: 'Usuarias que repiten manicura cada 3-4 semanas.',
          notFor: 'No recomendado si buscas cambiar de tecnica cada semana.',
          expectedResult: 'Agenda y mantenimiento mas previsible.',
          priceCents: 4700,
          compareAtPriceCents: 5590,
          durationDays: 30,
          preferredArea: 'NAILS',
          minMaintenanceLevel: 'MEDIUM',
          featured: true,
          items: [
            { label: 'Manicura semipermanente cuidada', itemType: 'SERVICE', serviceKey: 'mani-semi' },
            { label: 'Retirada y cuidado de una', itemType: 'SERVICE', serviceKey: 'retiro' },
            { label: 'Aceite piloto cuticulas', itemType: 'PRODUCT', productKey: 'aceite-cuticulas' },
          ],
        },
      ],
      followUps: [
        { name: 'Piloto revision manicura 14 dias', category: 'MANICURE', purpose: 'FOLLOW_UP', channel: 'EMAIL', serviceKeyword: 'manicura', subject: 'Como sigue tu manicura?', body: 'Hola {customerName}, han pasado unos dias desde {serviceName}. Si notas levantamiento o quieres programar retirada, podemos ayudarte. - {centerName}', sendAfterDays: 14, consentRequired: false },
      ],
      customers: [
        { key: 'sofia', name: 'Sofia Piloto', email: 'sofia.piloto@example.com', phone: '+34 611 000 201', marketingConsent: true },
      ],
      bookings: [
        { customerKey: 'sofia', serviceKey: 'mani-semi', staffKey: 'clara', startAt: daysAgo(16, 16, 0), status: 'COMPLETED', review: { rating: 5, comment: 'La app me aviso del siguiente paso y no tuve que improvisar cita.' } },
      ],
    },
    {
      categoryMap,
      org: { name: 'Piloto Rizo Vivo SL', slug: 'piloto-rizo-vivo-sl', plan: 'PRO', maxCenters: 1 },
      owner: { name: 'Nuria Vega', email: 'piloto.rizovivo@bellezalocal.es' },
      center: {
        name: 'Piloto Rizo Vivo Studio',
        slug: 'piloto-rizo-vivo-studio',
        description: 'Centro interno de piloto para cabello, mantenimiento de color y reposicion de productos.',
        descriptionLong: 'Ficha ficticia para validar recomendaciones capilares y recompra guiada. No representa un negocio real.',
        category: 'PELUQUERIA',
        phone: '+34 910 000 301',
        whatsapp: '+34 610 000 301',
        email: 'piloto.rizovivo@bellezalocal.es',
        website: 'https://example.com/piloto-rizo-vivo',
        addressStreet: 'Calle Piloto, 36',
        addressCity: 'Madrid',
        addressProvince: 'Madrid',
        addressPostalCode: '28004',
        addressLat: 40.424200,
        addressLng: -3.701900,
        coverImage: img('pilot-rizo-vivo-cover', 1200, 800),
        galleryImages: [img('pilot-rizo-vivo-1'), img('pilot-rizo-vivo-2'), img('pilot-rizo-vivo-3')],
      },
      services: [
        { key: 'corte-rizo', name: 'Corte y definicion de rizo', description: 'Corte en seco y rutina de definicion sencilla.', durationMinutes: 75, priceCents: 4800, order: 1 },
        { key: 'color-brillo', name: 'Color y brillo mantenimiento', description: 'Revision de color no agresiva y recomendaciones de mantenimiento.', durationMinutes: 90, priceCents: 7200, order: 2 },
      ],
      staff: [
        { key: 'nuria', name: 'Nuria Vega', role: 'Especialista capilar', bio: 'Trabaja corte, color y rutinas capilares de bajo mantenimiento.', image: img('pilot-staff-nuria'), order: 1 },
      ],
      schedule: defaultSchedule,
      assignments: [{ staff: 'nuria', services: ['corte-rizo', 'color-brillo'] }],
      products: [
        { key: 'mascarilla-rizo', name: 'Mascarilla piloto rizo brillo', brand: 'BellezaLocal Lab', cat: 'acondicionadores', description: 'Mascarilla capilar de uso semanal para brillo y suavidad.', priceCents: 2490, stock: 16, usageInstructions: 'Usar 1 vez por semana, dejar actuar 5-10 minutos y aclarar.', recommendedFor: 'Cabello coloreado u ondulado que necesita mantenimiento simple.', notRecommendedFor: 'Cabello fino que se engrasa con mascarillas densas.', expectedDurationDays: 50, replenishmentIntervalDays: 50, routineStepType: 'HAIR_CARE', compatibilityTags: ['cabello-color', 'rizo'], recommendationTags: ['brillo', 'mantenimiento'] },
      ],
      benefits: [
        { key: 'diagnostico-color', title: 'Revision de color incluida', description: 'Revision corta antes de repetir color para evitar decisiones precipitadas.', benefitType: 'FREE_REVIEW', value: '10 min', membersOnly: true },
      ],
      packs: [
        {
          key: 'color-sin-prisas',
          name: 'Pack piloto color sin prisas',
          slug: 'pack-piloto-color-sin-prisas',
          objective: 'Mantener color y brillo',
          description: 'Servicio de color, mascarilla de mantenimiento y seguimiento.',
          audience: 'Usuarias con cabello coloreado que quieren planificar mantenimiento.',
          notFor: 'No recomendado para cambios radicales de color en una sola visita.',
          expectedResult: 'Mejor planificacion de mantenimiento.',
          priceCents: 8900,
          compareAtPriceCents: 9690,
          durationDays: 45,
          preferredArea: 'HAIR',
          minMaintenanceLevel: 'MEDIUM',
          featured: false,
          items: [
            { label: 'Color y brillo mantenimiento', itemType: 'SERVICE', serviceKey: 'color-brillo' },
            { label: 'Mascarilla piloto rizo brillo', itemType: 'PRODUCT', productKey: 'mascarilla-rizo' },
            { label: 'Seguimiento a 28 dias', itemType: 'FOLLOW_UP' },
          ],
        },
      ],
      followUps: [
        { name: 'Piloto color 28 dias', category: 'COLORATION', purpose: 'FOLLOW_UP', channel: 'EMAIL', serviceKeyword: 'color', subject: 'Mantenimiento de color sin urgencias', body: 'Hola {customerName}, para cuidar {serviceName}, revisa brillo y matiz antes de que sea urgente. Podemos ayudarte a decidir el siguiente paso. - {centerName}', sendAfterDays: 28, consentRequired: false },
      ],
      customers: [
        { key: 'carmen', name: 'Carmen Piloto', email: 'carmen.piloto@example.com', phone: '+34 611 000 301', marketingConsent: true },
      ],
      bookings: [
        { customerKey: 'carmen', serviceKey: 'color-brillo', staffKey: 'nuria', startAt: daysAgo(32, 10, 30), status: 'COMPLETED', review: { rating: 5, comment: 'Me gusto que el pack explicaba tambien que no hacer.' } },
      ],
    },
  ]
}

async function main() {
  console.log('Pilot seed: Beauty Profile Madrid')
  console.log(`Visibility: ${SHOULD_PUBLISH ? 'published in marketplace' : 'private/unpublished'}`)

  const categoryMap = await ensureProductCategories()
  const businesses = pilotBusinesses(categoryMap)
  const contexts = []

  for (const def of businesses) {
    const context = await ensureBusiness(def)
    contexts.push(context)
    console.log(`- ${context.center.slug}: ok`)
  }

  const primary = contexts[0]
  const pilotUser = await ensurePilotUser(primary)

  console.log('Pilot seed complete')
  console.log(`Buyer login: ${pilotUser.user.email} / ${PASSWORD}`)
  console.log(`Business logins: ${businesses.map(item => item.owner.email).join(', ')} / ${PASSWORD}`)
  console.log('Next: replace fictional centers with real pilot businesses before public traffic.')
}

main()
  .catch(error => {
    console.error('Pilot seed failed:', error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
