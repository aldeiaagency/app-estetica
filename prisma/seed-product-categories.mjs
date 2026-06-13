// Seed de la taxonomía de producto (3 niveles, idempotente).
// Ejecutar: node --env-file=.env.local prisma/seed-product-categories.mjs
//
// Crea la jerarquía completa (categoría → subcategoría → sub-subcategoría) y
// asigna una categoría hoja a los productos sin categoría mediante heurística.

import { PrismaClient } from '@prisma/client'
import { flattenTaxonomy } from './product-taxonomy.mjs'

const prisma = new PrismaClient()

/** Crea/actualiza toda la taxonomía y devuelve un mapa slug → id. */
export async function ensureTaxonomy(client = prisma) {
  const flat = flattenTaxonomy()
  const bySlug = {}
  // flat ya viene en orden padre→hijo, así que el parentId siempre existe al insertar.
  for (const c of flat) {
    const parentId = c.parentSlug ? bySlug[c.parentSlug] ?? null : null
    const cat = await client.productCategory.upsert({
      where:  { slug: c.slug },
      update: { name: c.name, icon: c.icon, order: c.order, parentId },
      create: { slug: c.slug, name: c.name, icon: c.icon, order: c.order, parentId },
    })
    bySlug[c.slug] = cat.id
  }
  return bySlug
}

// Heurística nombre/marca → slug de categoría HOJA
function guessLeafCategory(name, brand) {
  const t = `${name} ${brand ?? ''}`.toLowerCase()
  if (/(spf|solar|protector solar)/.test(t)) return 'solar-facial'
  if (/aftersun/.test(t)) return 'aftersun'
  if (/(perfume|colonia|fragancia|eau de|parfum)/.test(t)) return 'perfumes-mujer'
  if (/(champ)/.test(t)) return 'champus'
  if (/(acondicionador|mascarilla.*pelo|bond)/.test(t)) return 'acondicionadores'
  if (/(protector t[eé]rmico|t[eé]rmico)/.test(t)) return 'protectores-termicos'
  if (/(laca|fijador)/.test(t)) return 'lacas-fijadores'
  if (/(aceite.*capilar|capilar.*aceite|argan|argán|moroccanoil)/.test(t)) return 'aceites-capilares'
  if (/(s[eé]rum).*(capilar|pelo)/.test(t)) return 'serums-capilares'
  if (/(s[eé]rum|vitamina c|hialur)/.test(t)) return 'serums-faciales'
  if (/(contorno.*ojos)/.test(t)) return 'contorno-ojos'
  if (/(mascarilla facial)/.test(t)) return 'mascarillas-faciales'
  if (/(crema hidratante|hidratante facial|dramatically)/.test(t)) return 'cremas-hidratantes'
  if (/(limpiador|gel limpiador|espuma)/.test(t)) return 'limpiadores-faciales'
  if (/(agua micelar)/.test(t)) return 'aguas-micelares'
  if (/(desmaquillante)/.test(t)) return 'desmaquillantes'
  if (/(exfoliante.*facial)/.test(t)) return 'exfoliantes-faciales'
  if (/(exfoliante)/.test(t)) return 'exfoliantes-corporales'
  if (/(crema corporal|corporal|kar[ií]t[eé])/.test(t)) return 'hidratacion-corporal'
  if (/(base de maquillaje|base fluida)/.test(t)) return 'bases-maquillaje'
  if (/(corrector)/.test(t)) return 'correctores'
  if (/(polvos)/.test(t)) return 'polvos-faciales'
  if (/(colorete)/.test(t)) return 'coloretes'
  if (/(iluminador)/.test(t)) return 'iluminadores'
  if (/(m[aá]scara.*pesta|pesta[ñn]as)/.test(t)) return 'mascaras-pestanas'
  if (/(sombra|paleta)/.test(t)) return 'sombras-ojos'
  if (/(delineador|eyeliner)/.test(t)) return 'delineadores'
  if (/(ceja)/.test(t)) return 'cejas-maquillaje'
  if (/(labial|barra de labios|lipstick)/.test(t)) return 'barras-labios'
  if (/(gloss|brillo de labios)/.test(t)) return 'glosses'
  if (/(esmalte.*(gel|semi))/.test(t)) return 'esmaltes-semipermanentes'
  if (/(esmalte|nail)/.test(t)) return 'esmaltes'
  if (/(brocha|esponja|blender)/.test(t)) return 'brochas-esponjas'
  return null
}

async function main() {
  console.log('🌱 Sembrando taxonomía de producto (3 niveles)...')
  const bySlug = await ensureTaxonomy()
  console.log('✅ Categorías totales:', Object.keys(bySlug).length)

  const products = await prisma.product.findMany({ select: { id: true, name: true, brand: true } })
  let assigned = 0
  for (const p of products) {
    const slug = guessLeafCategory(p.name, p.brand)
    if (slug && bySlug[slug]) {
      await prisma.product.update({ where: { id: p.id }, data: { categoryId: bySlug[slug] } })
      assigned++
    }
  }
  console.log('✅ Productos (re)categorizados:', assigned, 'de', products.length)
}

// Permite importar ensureTaxonomy desde seed.mjs sin ejecutar main()
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('seed-product-categories.mjs')) {
  main()
    .catch((e) => { console.error(e); process.exit(1) })
    .finally(() => prisma.$disconnect())
}
