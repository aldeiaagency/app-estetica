# Informe Fase 03 — Búsqueda General e Hiperlocal

**Fecha:** 2026-06-09
**Estado:** ✅ Aprobable

---

## 1. Objetivo de la fase

- Corregir el bug crítico en `app/buscar/page.tsx`: cuando `q` y `ciudad` se pasan simultáneamente, el segundo `OR` al mismo nivel del objeto sobreescribía al primero (comportamiento de JS con claves duplicadas).
- Reescribir la construcción del `whereBase` usando `AND` con grupos `OR` internos.
- Añadir soporte para filtro por precio máximo (`precioMax` query param).
- Actualizar `hasFilters` para incluir el nuevo parámetro.

---

## 2. Acciones planificadas

- Leer `app/buscar/page.tsx` — identificar la construcción exacta del `whereBase`
- Reemplazar el patrón spread-OR/OR por `andFilters: Prisma.CenterWhereInput[]` + `AND`
- Añadir soporte para `precioMax` (€ → céntimos)
- Ejecutar `npm run type-check` y `npm run lint`
- Crear informe y actualizar checkpoint

---

## 3. Acciones ejecutadas

- ✅ Identificado el bug: `{ ...ciudadOR, ...qOR }` producía `{ OR: qOR }` porque JS descarta la primera clave `OR` en favor de la segunda
- ✅ Reescrita la construcción de `whereBase` con array `andFilters` acumulativo
- ✅ Añadido soporte para `precioMax` query param (filtra centros con al menos un servicio activo a ese precio o menos)
- ✅ Actualizado `hasFilters` para incluir `precioMaxStr`
- ✅ Ejecutado `tsc --noEmit` → sin errores
- ✅ Ejecutado `next lint --quiet` → sin errores ni warnings nuevos

---

## 4. Archivos modificados

| Archivo | Cambio |
|---|---|
| `app/buscar/page.tsx` | Reescrita construcción de `whereBase` (bug OR/AND + soporte precioMax) |

---

## 5. Archivos creados

| Archivo | Descripción |
|---|---|
| `docs/informes/fase-03-busqueda.md` | Este informe |

---

## 6. Decisiones tomadas

| Decisión | Justificación |
|---|---|
| `andFilters: Prisma.CenterWhereInput[]` en lugar de spread | Limpio, explícito, fácil de extender con más filtros futuros |
| `precioMax` filtra por `services.some.priceCents.lte` | La alternativa (`avg`) es mucho más costosa y menos útil para el usuario |
| No añadir UI para `precioMax` en esta fase | El param funciona via URL; la UI va en Fase 13 (design system) para no romper el layout actual del buscador |
| `AND: []` cuando no hay filtros | Prisma ignora `AND: []` — no afecta a la query |

---

## 7. Riesgos detectados

| Riesgo | Severidad | Estado |
|---|---|---|
| `AND: []` en Prisma puede comportarse distinto en versiones futuras | Bajo | Evitado con `...(andFilters.length > 0 && { AND: andFilters })` |
| `precioMaxCents` con valor `0` se ignora silenciosamente | Bajo | Aceptable: "precio máximo 0€" no es un caso de uso real |

---

## 8. Errores encontrados

Ninguno. El cambio es 100% retrocompatible — si no se pasa ningún filtro, `whereBase` es `{ published: true }` idéntico al comportamiento anterior.

---

## 9. Verificaciones ejecutadas

| Verificación | Resultado |
|---|---|
| `tsc --noEmit` | ✅ Sin errores |
| `npx next lint --quiet` | ✅ Sin errores ni warnings nuevos |

---

## 10. Resultado de verificaciones

- `tsc --noEmit` → exit 0, sin output
- `next lint --quiet` → "✔ No ESLint warnings or errors"

---

## 11. Qué queda pendiente

- UI para filtro de precio (slider o inputs min/max) — Fase 13
- Filtro "disponibilidad hoy" — requiere disponibilidad por centro, costoso, diferir a Fase 4
- Paginación o infinite scroll — diferir a Fase 12 (SEO programático)
- Filtro por valoración mínima — diferir a Fase 13

---

## 12. Recomendación de siguiente fase

**Fase 4 — Reservas y calendario**: con `ServiceStaff` ya poblado (Fase 2), el motor de disponibilidad puede resolver slots reales. Es el momento de verificar el flujo completo de reserva end-to-end.

---

## 13. Estado final

✅ **APROBABLE**

- Bug OR/AND corregido: `q + ciudad` juntos ahora devuelven la intersección correcta
- Soporte `precioMax` añadido con validación
- `type-check` limpio
- `lint` sin errores nuevos
- Cambio retrocompatible (sin filtros = comportamiento idéntico al anterior)
