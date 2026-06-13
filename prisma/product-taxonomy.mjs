/**
 * Taxonomía de producto de 3 niveles — estilo Sephora / Druni / Primor / Maquillalia.
 * Fuente de verdad compartida por los seeds. La app la LEE desde la BD (no la hardcodea).
 *
 *   Nivel 1 (categoría)  →  Nivel 2 (subcategoría)  →  Nivel 3 (sub-subcategoría)
 */

export const PRODUCT_TAXONOMY = [
  {
    slug: 'maquillaje', name: 'Maquillaje', icon: '💄',
    children: [
      { slug: 'maquillaje-rostro', name: 'Rostro', children: [
        { slug: 'bases-maquillaje', name: 'Bases de maquillaje' },
        { slug: 'correctores',      name: 'Correctores' },
        { slug: 'polvos-faciales',  name: 'Polvos' },
        { slug: 'coloretes',        name: 'Coloretes' },
        { slug: 'iluminadores',     name: 'Iluminadores' },
      ]},
      { slug: 'maquillaje-ojos', name: 'Ojos', children: [
        { slug: 'mascaras-pestanas', name: 'Máscaras de pestañas' },
        { slug: 'sombras-ojos',      name: 'Sombras de ojos' },
        { slug: 'delineadores',      name: 'Delineadores' },
        { slug: 'cejas-maquillaje',  name: 'Cejas' },
      ]},
      { slug: 'maquillaje-labios', name: 'Labios', children: [
        { slug: 'barras-labios',         name: 'Barras de labios' },
        { slug: 'glosses',               name: 'Glosses y brillos' },
        { slug: 'perfiladores-labiales', name: 'Perfiladores' },
      ]},
    ],
  },
  {
    slug: 'facial', name: 'Cuidado facial', icon: '🧴',
    children: [
      { slug: 'limpieza-facial', name: 'Limpieza facial', children: [
        { slug: 'limpiadores-faciales', name: 'Limpiadores y geles' },
        { slug: 'aguas-micelares',      name: 'Aguas micelares' },
        { slug: 'desmaquillantes',      name: 'Desmaquillantes' },
      ]},
      { slug: 'tratamientos-faciales', name: 'Tratamientos', children: [
        { slug: 'serums-faciales',    name: 'Sérums' },
        { slug: 'cremas-hidratantes', name: 'Cremas hidratantes' },
        { slug: 'contorno-ojos',      name: 'Contorno de ojos' },
        { slug: 'mascarillas-faciales', name: 'Mascarillas' },
      ]},
      { slug: 'exfoliantes-faciales', name: 'Exfoliantes' },
    ],
  },
  {
    slug: 'capilar', name: 'Cabello', icon: '💇',
    children: [
      { slug: 'champus',        name: 'Champús' },
      { slug: 'acondicionadores', name: 'Acondicionadores y mascarillas' },
      { slug: 'tratamientos-capilares', name: 'Tratamientos', children: [
        { slug: 'aceites-capilares', name: 'Aceites capilares' },
        { slug: 'serums-capilares',  name: 'Sérums capilares' },
      ]},
      { slug: 'styling-capilar', name: 'Styling', children: [
        { slug: 'protectores-termicos', name: 'Protectores térmicos' },
        { slug: 'lacas-fijadores',      name: 'Lacas y fijadores' },
      ]},
    ],
  },
  {
    slug: 'corporal', name: 'Cuidado corporal', icon: '🧼',
    children: [
      { slug: 'hidratacion-corporal',   name: 'Hidratación corporal' },
      { slug: 'exfoliantes-corporales', name: 'Exfoliantes corporales' },
      { slug: 'aceites-corporales',     name: 'Aceites corporales' },
    ],
  },
  {
    slug: 'perfumes', name: 'Perfumes', icon: '🌸',
    children: [
      { slug: 'perfumes-mujer',  name: 'Perfumes mujer' },
      { slug: 'perfumes-hombre', name: 'Perfumes hombre' },
      { slug: 'sets-perfume',    name: 'Sets de regalo' },
    ],
  },
  {
    slug: 'unas', name: 'Uñas', icon: '💅',
    children: [
      { slug: 'esmaltes',                name: 'Esmaltes' },
      { slug: 'esmaltes-semipermanentes', name: 'Esmaltes semipermanentes' },
      { slug: 'cuidado-unas',            name: 'Cuidado de uñas' },
    ],
  },
  {
    slug: 'solar', name: 'Protección solar', icon: '☀️',
    children: [
      { slug: 'solar-facial',   name: 'Solar facial' },
      { slug: 'solar-corporal', name: 'Solar corporal' },
      { slug: 'aftersun',       name: 'Aftersun' },
    ],
  },
  {
    slug: 'accesorios', name: 'Accesorios', icon: '🪮',
    children: [
      { slug: 'brochas-esponjas', name: 'Brochas y esponjas' },
      { slug: 'herramientas-pelo', name: 'Herramientas de pelo' },
    ],
  },
]

/**
 * Aplana la taxonomía en orden padre→hijo (para upsert seguro de FKs),
 * con descripción opcional y orden incremental.
 */
export function flattenTaxonomy() {
  const out = []
  let order = 0
  const walk = (nodes, parentSlug, depth) => {
    for (const n of nodes) {
      out.push({
        slug: n.slug,
        name: n.name,
        icon: n.icon ?? null,
        parentSlug: parentSlug ?? null,
        order: order++,
        depth,
      })
      if (n.children) walk(n.children, n.slug, depth + 1)
    }
  }
  walk(PRODUCT_TAXONOMY, null, 0)
  return out
}
