import { PrismaClient } from '@prisma/client'
const p = new PrismaClient()
const centers = await p.center.findMany({
  include: { services: true, staff: true, bonos: true, products: true, scheduleRules: true, bookings: { take: 3 } }
})
console.log(JSON.stringify(centers.map(c => ({
  id: c.id,
  name: c.name,
  slug: c.slug,
  published: c.published,
  organizationId: c.organizationId,
  services: c.services.length,
  staff: c.staff.length,
  bonos: c.bonos.length,
  products: c.products.length,
  scheduleRules: c.scheduleRules.length,
  bookings: c.bookings.length,
})), null, 2))
await p.$disconnect()
