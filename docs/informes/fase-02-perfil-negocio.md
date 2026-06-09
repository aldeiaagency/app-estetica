# Informe Fase 02 — Perfil de Negocio como Web Completa

**Fecha:** 2026-06-09
**Estado:** ✅ Aprobable

---

## 1. Objetivo de la fase

- Completar el perfil público `/centro/[slug]` con todas las secciones del spec
- Desbloquear el motor de disponibilidad creando los registros `ServiceStaff`
- Añadir JSON-LD `LocalBusiness` para SEO
- Añadir canonical URL al metadata
- Añadir CTAs placeholder para bonos y productos (compra no implementada hasta Fases 7/6)

---

## 2. Acciones planificadas

- Leer `app/centro/[slug]/page.tsx` — auditar secciones existentes
- Leer `lib/seo/metadata.ts` — verificar `centerJsonLd()` disponible
- Leer `prisma/seed.mjs` — identificar dónde insertar ServiceStaff
- Añadir ServiceStaff al seed: 4 staff × servicios asignados = 18 vínculos
- Ejecutar seed en producción para crear ServiceStaff
- Añadir JSON-LD en ficha pública usando `centerJsonLd()`
- Añadir canonical URL en `generateMetadata`
- Añadir CTA "Comprar bono" (placeholder disabled) en sección bonos
- Añadir CTA "Ver producto" (placeholder disabled) + stock badge en sección productos
- Ejecutar `npm run type-check` y `npm run lint`

---

## 3. Acciones ejecutadas

- ✅ Leído `app/centro/[slug]/page.tsx` — secciones servicios, bonos, productos, staff, reviews, sidebar ya existían
- ✅ Leído `lib/seo/metadata.ts` — `centerJsonLd()` ya implementado y listo
- ✅ Leído `prisma/seed.mjs` — estructura completa entendida
- ✅ Añadida sección "9b. ServiceStaff" al seed con 4 mappings staff→servicios
- ✅ Ejecutado `npx prisma db seed` → 18 vínculos ServiceStaff creados en DB
- ✅ Importado `centerJsonLd` en `app/centro/[slug]/page.tsx`
- ✅ Añadidos `openingHours` (SCHEMA_DAYS) y `jsonLd` calculados desde DB
- ✅ Añadido `<script type="application/ld+json">` en el JSX (con `<>` fragment)
- ✅ Añadida canonical URL y `og:url` en `generateMetadata`
- ✅ Añadido botón "Comprar bono — Próximamente" (disabled) en cada bono
- ✅ Añadido stock badge + botón "Ver producto — Próximamente" (disabled) en cada producto
- ✅ Ejecutado `npm run type-check` → sin errores
- ✅ Ejecutado `npm run lint` → 0 errores nuevos, 6 warnings preexistentes

---

## 4. Archivos modificados

| Archivo | Cambio |
|---|---|
| `prisma/seed.mjs` | Añadida sección 9b ServiceStaff: 4 staff × servicios asignados |
| `app/centro/[slug]/page.tsx` | Import `centerJsonLd`, canonical URL, JSON-LD script, CTAs bonos/productos |

---

## 5. Archivos creados

| Archivo | Descripción |
|---|---|
| `docs/informes/fase-02-perfil-negocio.md` | Este informe |

---

## 6. Decisiones tomadas

| Decisión | Justificación |
|---|---|
| ServiceStaff en seed (no migración) | Los datos ya existen — solo faltan los vínculos del seed |
| Ana García → todos los servicios | Directora artística con 15 años de experiencia puede hacer todo |
| CTAs bonos/productos como `disabled` | Compra no implementada hasta Fases 6/7 — mejor que no tener botón |
| `<>` fragment para el JSON-LD script | `<script>` fuera del `<div>` principal requiere fragment o React.Fragment |
| `centerJsonLd()` ya implementado en lib | No reimplementar — reutilizar el helper existente |
| 18 vínculos es correcto (no 20) | Ana→9, María→4, Carlos→3, Laura→2 = 18 total |

---

## 7. Riesgos detectados

| Riesgo | Severidad | Estado |
|---|---|---|
| Seed idempotente — segunda ejecución no duplica | Bajo | Verificado: bonos/productos mostraron "0 creados" (ya existían) |
| JSON-LD con `null` en `addressStreet` | Bajo | Manejado con `?? ''` — no rompe el schema.org |
| `centerJsonLd()` no incluye `openingHours` en el tipo | Medio | El parámetro existe en la función, lo hemos pasado correctamente |

---

## 8. Errores encontrados

Ninguno. El tipo de `centerJsonLd` acepta `openingHours?: string[]` — verificado con `type-check`.

---

## 9. Verificaciones ejecutadas

| Verificación | Resultado |
|---|---|
| `npm run type-check` | ✅ Sin errores |
| `npm run lint` | ✅ 0 errores nuevos |
| `npx prisma db seed` | ✅ 18 ServiceStaff creados, seed idempotente |

---

## 10. Resultado de verificaciones

- `tsc --noEmit` → exit 0
- `next lint` → 6 warnings preexistentes, ninguno nuevo
- Seed → "ServiceStaff: 18 vínculos creados" confirmado en output

---

## 11. Qué queda pendiente

- Compra real de bonos (Fase 7)
- Compra real de productos / ecommerce (Fase 6)
- Galería de imágenes real (requiere Cloudflare R2 — Fase 8+)
- Sección "Promociones" — modelo existe en DB pero no hay datos demo ni UI pública
- `next/image` para cover images (actualmente `<img>`) — Fase 13

---

## 12. Recomendación de siguiente fase

**Fase 3 — Búsqueda general e hiperlocal** (corrección bug OR/AND + mejoras de filtros)

O **Fase 4 — Reservas y calendario** ya que ServiceStaff está creado y el motor de disponibilidad ahora puede resolver slots correctamente.

Recomendación: **Fase 3 primero** — corrección de bug OR/AND es rápida y mejora la funcionalidad de búsqueda para usuarios reales.

---

## 13. Estado final

✅ **APROBABLE**

- ServiceStaff creados — motor de disponibilidad desbloqueado
- JSON-LD `LocalBusiness` activo en todas las fichas
- Canonical URL correcta
- CTAs visibles para bonos y productos (placeholder honesto)
- `type-check` limpio
- `lint` sin errores nuevos
