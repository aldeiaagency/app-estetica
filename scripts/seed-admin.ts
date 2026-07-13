import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production'
if (isProduction || process.env.ALLOW_DEMO_SEED !== 'true') {
  throw new Error('Seed bloqueado. Usa un entorno no productivo y ALLOW_DEMO_SEED=true.')
}

const seedPassword = process.env.SEED_DEMO_PASSWORD
if (!seedPassword || seedPassword.length < 12) {
  throw new Error('SEED_DEMO_PASSWORD debe tener al menos 12 caracteres.')
}
const demoPassword: string = seedPassword

async function main() {
  const password = await bcrypt.hash(demoPassword, 12)

  // Admin de plataforma
  const admin = await prisma.user.upsert({
    where: { email: 'admin@bellezalocal.es' },
    update: { password },
    create: {
      email: 'admin@bellezalocal.es',
      name: 'Admin',
      password,
      role: 'PLATFORM_ADMIN',
      emailVerified: new Date(),
    },
  })

  // Usuario negocio de prueba con organización y centro
  const org = await prisma.organization.upsert({
    where: { slug: 'demo-peluqueria' },
    update: {},
    create: {
      name: 'Demo Peluquería',
      slug: 'demo-peluqueria',
      plan: 'PRO',
    },
  })

  const business = await prisma.user.upsert({
    where: { email: 'negocio@bellezalocal.es' },
    update: { password, organizationId: org.id },
    create: {
      email: 'negocio@bellezalocal.es',
      name: 'Ana García',
      password,
      role: 'BUSINESS_ADMIN',
      emailVerified: new Date(),
      organizationId: org.id,
    },
  })

  const center = await prisma.center.upsert({
    where: { slug: 'peluqueria-ana-garcia-madrid' },
    update: {},
    create: {
      organizationId: org.id,
      name: 'Peluquería Ana García',
      slug: 'peluqueria-ana-garcia-madrid',
      description: 'Peluquería de confianza en el centro de Madrid.',
      category: 'PELUQUERIA',
      phone: '+34 600 000 001',
      addressStreet: 'Calle Gran Vía 1',
      addressCity: 'Madrid',
      addressProvince: 'Madrid',
      addressPostalCode: '28013',
      published: true,
      approvedAt: new Date(),
    },
  })

  console.log('✅ Admin creado:', admin.email)
  console.log('✅ Negocio creado:', business.email)
  console.log('✅ Centro creado:', center.name)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
