# Reglas — SEO

- Toda página nueva: definir `export const metadata: Metadata` con title y description.
- Páginas con parámetros dinámicos de query (`?q=`, `?ciudad=`): `robots: { index: false }`.
- Páginas de categoría/localidad sin centros reales: `robots: { index: false }`.
- Fichas de centros publicados: indexadas por defecto.
- Siempre canonical correcto en páginas con variaciones de URL.
- JSON-LD en fichas de centro (BeautySalon) y páginas de listado (ItemList).
- No crear páginas SEO para localidades sin centros reales.
- Sitemap: actualizar `app/sitemap.ts` cuando se añadan nuevos tipos de página indexable.
- `robots.ts`: mantener actualizado si se añaden nuevas rutas privadas.
- LCP < 2.5s en páginas públicas. Priorizar imágenes con `priority` en el hero.
