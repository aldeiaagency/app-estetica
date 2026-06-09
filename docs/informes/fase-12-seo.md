# Informe Fase 12 — SEO Programatico, Sitemap y Paginas Locales

**Fecha:** 2026-06-10
**Estado:** Completada

---

## 1. Objetivo de la fase

Sitemap dinamico, paginas SEO programaticas de ciudad y ciudad+categoria, JSON-LD ItemList, y robots.txt ampliado.

## 2. Acciones planificadas

1. Helpers de slug en lib/seo/metadata.ts
2. app/sitemap.ts — sitemap dinamico completo
3. app/s/[ciudad]/page.tsx — landing por ciudad
4. app/s/[ciudad]/[categoria]/page.tsx — landing por ciudad+categoria
5. app/robots.ts — disallow ampliado

## 3. Acciones ejecutadas

Todas las planificadas.

## 4. Archivos creados

| Archivo | Descripcion |
|---|---|
| `app/sitemap.ts` | Reescrito: estaticas (/, /precios, /para-negocios) + centros publicados (seoNoindex=false) + paginas ciudad + ciudad+categoria |
| `app/s/[ciudad]/page.tsx` | Landing SEO con generateStaticParams + generateMetadata (localityPageMetadata) + JSON-LD ItemList + grid de centros + filtros por categoria |
| `app/s/[ciudad]/[categoria]/page.tsx` | Igual filtrado por categoria con breadcrumb ciudad > categoria |

## 5. Archivos modificados

| Archivo | Cambio |
|---|---|
| `lib/seo/metadata.ts` | Aniadidos: cityToSlug, slugToCity, categoryToSlug, slugToCategory, itemListJsonLd |
| `app/robots.ts` | Ampliado disallow: /auth/, /checkout, /carrito, /pedido/, /bono/confirmado/, /reserva/confirmada/ |

## 6. Decisiones tomadas

| Decision | Razon |
|---|---|
| /s/[ciudad] como prefijo | URL corta y clara; evita conflictos con otras rutas |
| cityToSlug con normalize NFD | Normaliza tildes/acentos de ciudades espanolas sin dependencias |
| generateStaticParams en paginas de ciudad | Pre-renderiza las paginas en build para maxima velocidad y SEO |
| noindex (notFound) si ciudad sin centros | Evita paginas vacias que penalizan SEO |
| seoNoindex=false en sitemap | Respeta el flag de admin para excluir centros del sitemap |

## 7. Riesgos detectados

- Dos ciudades que normalicen al mismo slug (ej. "Cádiz"/"Cadiz"): el primero encontrado gana. Improbable en MVP.
- Cambio de nombre de ciudad en el dashboard: el slug del enlace antiguo devolveria 404. Para MVP es aceptable.

## 8. Errores encontrados

Ninguno — compilacion limpia desde el primer intento.

## 9. Verificaciones ejecutadas

- npx tsc --noEmit
- npx next lint --quiet

## 10. Resultado de verificaciones

- TypeScript: 0 errores
- ESLint: 0 warnings ni errores

## 11. Que queda pendiente

- Paginas de servicio individual (/s/[ciudad]/[categoria]/[servicio]) — Fase futura
- Breadcrumbs JSON-LD (BreadcrumbList) en fichas y paginas locales
- Internal linking desde la home y buscar hacia paginas /s/
- hreflang si se internacionaliza

## 12. Recomendacion de siguiente fase

Fase 13 - UX/UI design system: audit de componentes, tokens de diseno consistentes, mobile-first revisado, animaciones sutiles.

## 13. Estado final

Completada — sitemap dinamico, paginas locales SEO y robots.txt operativos
