import { prisma } from '@/lib/db/client'

// Navegación jerárquica del catálogo de productos (categoría → subcategoría → …).
// La taxonomía vive en la BD (ProductCategory con parentId); aquí la convertimos
// en un árbol navegable y resolvemos descendientes/ancestros para filtrar.

export interface CatNode {
  id:       string
  name:     string
  slug:     string
  icon:     string | null
  parentId: string | null
  children: CatNode[]
}

export interface CategoryData {
  roots:   CatNode[]                 // categorías de nivel 1, ordenadas
  bySlug:  Map<string, CatNode>
  byId:    Map<string, CatNode>
}

/** Carga todas las categorías y construye el árbol (puro a partir de las filas). */
export async function getCategoryData(): Promise<CategoryData> {
  const rows = await prisma.productCategory.findMany({ orderBy: { order: 'asc' } })

  const byId = new Map<string, CatNode>()
  for (const r of rows) {
    byId.set(r.id, { id: r.id, name: r.name, slug: r.slug, icon: r.icon, parentId: r.parentId, children: [] })
  }

  const roots: CatNode[] = []
  const bySlug = new Map<string, CatNode>()
  for (const node of byId.values()) {
    bySlug.set(node.slug, node)
    if (node.parentId && byId.has(node.parentId)) {
      byId.get(node.parentId)!.children.push(node)
    } else {
      roots.push(node)
    }
  }

  return { roots, bySlug, byId }
}

/** IDs de un nodo y todos sus descendientes (para filtrar productos). */
export function collectDescendantIds(node: CatNode): string[] {
  const ids: string[] = [node.id]
  for (const child of node.children) ids.push(...collectDescendantIds(child))
  return ids
}

/** Cadena de ancestros raíz→nodo (incluye el propio nodo), para el breadcrumb. */
export function getAncestorChain(node: CatNode, byId: Map<string, CatNode>): CatNode[] {
  const chain: CatNode[] = [node]
  let current = node
  while (current.parentId && byId.has(current.parentId)) {
    current = byId.get(current.parentId)!
    chain.unshift(current)
  }
  return chain
}
