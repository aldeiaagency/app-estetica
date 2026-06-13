// Seed de categorías de producto (idempotente).
// Ejecutar: node --env-file=.env.local prisma/seed-product-categories.mjs
//
// Crea la taxonomía base de productos de belleza y asigna una categoría a los
// productos existentes mediante una heurística simple por nombre/marca.

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const CATEGORIES = [
  { slug: 'capilar',     name: 'Cuidado capilar',   icon: '💇', order: 1, description: 'Champús, mascarillas, tratamientos y protección para el cabello.' },
  { slug: 'facial',      name: 'Cuidado facial',    icon: '🧴', order: 2, description: 'Sérums, cremas, limpiadores y tratamientos para el rostro.' },
  { slug: 'corporal',    name: 'Cuidado corporal',  icon: '🧼', order: 3, description: 'Aceites, cremas y exfoliantes para el cuerpo.' },
  { slug: 'maquillaje',  name: 'Maquillaje',        icon: '💄', order: 4, description: 'Bases, labiales, sombras y cosmética de color.' },
  { slug: 'unas',        name: 'Uñas',              icon: '💅', order: 5, description: 'Esmaltes, geles y cuidado de manos y uñas.' },
  { slug: 'solar',       name: 'Protección solar',  icon: '☀️', order: 6, description: 'Protectores solares faciales y corporales.' },
  { slug: 'perfumes',    name: 'Perfumes',          icon: '🌸', order: 7, description: 'Fragancias y aguas de colonia.' },
  { slug: 'accesorios',  name: 'Accesorios',        icon: '🪮', order: 8, description: 'Herramientas y accesorios de belleza.' },
]

// Heurística nombre/marca → slug de categoría
function guessCategory(name, brand) {
  const t = `${name} ${brand ?? ''}`.toLowerCase()
  if (/(spf|solar|protector)/.test(t)) return 'solar'
  if (/(champ|mascarilla|cabello|capilar|olaplex|kerastase|ghd|t[eé]rmico|aceite.*cabello)/.test(t)) return 'capilar'
  if (/(s[eé]rum|facial|rostro|antienvejecimiento|antiedad|crema.*d[ií]a|vitamina c)/.test(t)) return 'facial'
  if (/(nail|esmalte|u[ñn]a|opi|manicura)/.test(t)) return 'unas'
  if (/(labial|base|sombra|m[aá]scara|maquillaje|polvos|colorete)/.test(t)) return 'maquillaje'
  if (/(perfume|colonia|fragancia|eau de)/.test(t)) return 'perfumes'
  if (/(corporal|cuerpo|exfoliante)/.test(t)) return 'corporal'
  return null
}

async function main() {
  console.log('🌱 Sembrando categorías de producto...')

  const bySlug = {}
  for (const c of CATEGORIES) {
    const cat = await prisma.productCategory.upsert({
      where:  { slug: c.slug },
      update: { name: c.name, icon: c.icon, order: c.order, description: c.description },
      create: c,
    })
    bySlug[c.slug] = cat.id
  }
  console.log('✅ Categorías:', Object.keys(bySlug).length)

  // Asignar categoría a productos sin categoría
  const products = await prisma.product.findMany({
    where: { categoryId: null },
    select: { id: true, name: true, brand: true },
  })

  let assigned = 0
  for (const p of products) {
    const slug = guessCategory(p.name, p.brand)
    if (slug && bySlug[slug]) {
      await prisma.product.update({ where: { id: p.id }, data: { categoryId: bySlug[slug] } })
      assigned++
    }
  }
  console.log('✅ Productos categorizados:', assigned, 'de', products.length)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
