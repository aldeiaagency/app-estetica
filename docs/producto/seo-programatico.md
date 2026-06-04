# SEO Programático — Belleza Local

## Objetivo

Capturar tráfico orgánico de búsquedas hiperlocales ("depilación láser en madrid", "peluquería en salamanca barrio centro") sin generar thin content ni doorway pages.

**Regla crítica**: Solo indexar páginas con contenido real y útil. Sin centros reales = noindex.

## Arquitectura de URLs

### Tier 1 — URLs de alto valor (indexables siempre que haya centros)

```
/peluquerias/[ciudad]
/centros-estetica/[ciudad]
/depilacion/[ciudad]
/masajes/[ciudad]
/nail-art/[ciudad]
```

### Tier 2 — URLs por servicio + ciudad (indexables si hay ≥ 3 centros con ese servicio)

```
/centros-estetica/[ciudad]/[servicio]
/peluquerias/[ciudad]/[servicio]

Ejemplos:
/centros-estetica/madrid/depilacion-laser
/peluquerias/barcelona/coloracion
/masajes/sevilla/relajante
```

### Tier 3 — URLs de ficha de centro (siempre indexables si el centro está publicado)

```
/centro/[slug]
/centro/[slug]/servicios
/centro/[slug]/bonos
/centro/[slug]/promociones
```

### Tier 4 — URLs de contenido editorial (indexables con contenido real)

```
/mejores-centros/[categoria]/[ciudad]
/guia/[tema]/[ciudad]
/promociones/belleza/[ciudad]
```

### URLs con noindex por defecto

```
/buscar (resultados dinámicos con query params)
/centro/[slug]/reservar (flujo de reserva — proceso privado)
/centro/[slug]/reservar/* (pasos del flujo)
/dashboard/* (privado)
/admin/* (privado)
/cuenta/* (privado)
/api/* (APIs)
Cualquier página de categoría/localidad sin centros reales publicados
```

## Reglas de indexación

### Página indexable si:
1. Tiene al menos 1 centro publicado y aprobado (para fichas).
2. Tiene al menos 3 centros con ese servicio en esa ciudad (para páginas ciudad+servicio).
3. Tiene al menos 5 centros en esa ciudad (para páginas de ciudad).
4. El contenido no es duplicado de otra URL canónica.

### Página con noindex si:
- La ciudad/servicio no tiene centros reales.
- Es una variación paramétrica de una URL ya indexada.
- Es un paso de un flujo transaccional.
- Es una página de paginación profunda (p. ej. `?page=15`).

## Metadatos dinámicos

### Ficha de centro (`/centro/[slug]`)

```
title: "[Nombre Centro] — [Ciudad] | Reserva Online"
description: "[Nombre Centro] en [Barrio/Ciudad]. [Servicio estrella]. Reserva cita online en segundos. [X] reseñas · desde [precio]€."
```

### Página ciudad + categoría (`/peluquerias/madrid`)

```
title: "Peluquerías en Madrid — Reserva Online | Belleza Local"
description: "Descubre las mejores peluquerías en Madrid. [N] centros con disponibilidad real. Reserva tu cita online sin llamar."
```

### Página ciudad + servicio (`/centros-estetica/madrid/depilacion-laser`)

```
title: "Depilación Láser en Madrid — Centros y Precios | Belleza Local"
description: "Encuentra los mejores centros de depilación láser en Madrid. Precios desde [X]€. Disponibilidad real. Reserva online."
```

## Structured Data (JSON-LD)

### En cada ficha de centro:

```json
{
  "@context": "https://schema.org",
  "@type": "BeautySalon",
  "name": "Nombre del Centro",
  "image": "url-imagen",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Calle, Número",
    "addressLocality": "Madrid",
    "addressCountry": "ES"
  },
  "telephone": "+34...",
  "url": "https://bellezalocal.es/centro/slug",
  "openingHoursSpecification": [...],
  "priceRange": "€€",
  "hasOfferCatalog": {
    "@type": "OfferCatalog",
    "name": "Servicios",
    "itemListElement": [...]
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "reviewCount": "47"
  }
}
```

### En páginas de categoría/ciudad:

```json
{
  "@context": "https://schema.org",
  "@type": "ItemList",
  "name": "Peluquerías en Madrid",
  "numberOfItems": 12,
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "item": { "@type": "BeautySalon", "name": "...", "url": "..." }
    }
  ]
}
```

## Sitemap

```
/sitemap.xml               → Index de sitemaps
/sitemap-centros.xml       → Todas las fichas públicas
/sitemap-ciudades.xml      → Páginas de ciudad/categoría con centros
/sitemap-servicios.xml     → Páginas ciudad+servicio con ≥3 centros
/sitemap-editorial.xml     → Contenido editorial (si existe)
```

Generación: dinámica vía Next.js `app/sitemap.ts`. Actualización automática al publicar/despublicar centros.

## Robots.txt

```
User-agent: *
Allow: /
Disallow: /dashboard/
Disallow: /admin/
Disallow: /cuenta/
Disallow: /api/
Disallow: /centro/*/reservar
Disallow: /buscar?

Sitemap: https://bellezalocal.es/sitemap.xml
```

## Control admin de indexación

El admin puede:
- Forzar noindex en un centro específico
- Forzar noindex en una página de categoría/ciudad
- Marcar una URL como canónica manualmente
- Regenerar sitemap

## Estrategia de contenido por fase

### Fase 1 (MVP)
- Fichas de centros publicados: indexadas.
- Páginas ciudad con ≥5 centros: indexadas.
- Todo lo demás: noindex.

### Fase 2 (post-MVP, ~3 meses)
- Páginas ciudad+servicio con ≥3 centros: indexadas.
- Primeras páginas editoriales manuales (5-10 ciudades clave).
- Structured data completo en todos los centros.

### Fase 3 (~6 meses)
- Páginas editoriales generadas programáticamente con control de calidad.
- Featured snippets (FAQs en fichas).
- Google Business Profile integrado.
- Contenido local genuino: "mejores centros en [barrio] de [ciudad]".

## Riesgos SEO

1. **Thin content masivo**: No generar páginas vacías. Usar `noindex` agresivo al inicio.
2. **Doorway pages**: No crear cientos de variaciones de la misma página sin contenido único.
3. **Duplicidad**: Canonical correcto en todas las páginas con parámetros.
4. **Velocidad**: LCP < 2.5s en páginas de ficha y resultados. Crítico para ranking.
5. **Core Web Vitals**: Priorizar en el build de producción desde el inicio.
