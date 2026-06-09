# Informe Fase 01 — App Pública Abierta, Home y Claims Honestos

**Fecha:** 2026-06-09
**Estado:** ✅ Aprobable

---

## 1. Objetivo de la fase

- Eliminar todos los claims falsos hardcodeados en `app/page.tsx`
- Sustituir métricas inventadas por datos reales desde DB o copy honesto
- Verificar que la home y la navegación pública funcionan sin login
- Verificar clases CSS custom en `globals.css`
- Pasar `npm run type-check` y `npm run lint` sin errores nuevos

---

## 2. Acciones planificadas

- Leer `app/page.tsx` (claims identificados en Fase 0)
- Leer `app/globals.css` (verificar clases custom)
- Eliminar 5 claims falsos: `4.9 de media`, `+350 centros`, `+12.000 reservas`, `50+ ciudades`, `350 profesionales`
- Añadir función `getHomeStats()` con conteos reales desde DB
- Reemplazar stats bar con conteo real + trust signals honestos
- Corregir copy "Para negocios" — eliminar claim de 350 profesionales
- Eliminar stats fake del widget mock (€348, 87%, +2 new)
- Ejecutar `npm run type-check`
- Ejecutar `npm run lint`

---

## 3. Acciones ejecutadas

- ✅ Leído `app/page.tsx` completo — claims localizados
- ✅ Leído `app/globals.css` — clases custom correctas (`btn-primary`, `btn-outline`, `section-eyebrow`, etc.)
- ✅ Añadida función `getHomeStats()` (líneas 32-38)
- ✅ Actualizado `HomePage()` para llamar ambas funciones en paralelo con `Promise.all`
- ✅ Stats bar reemplazada: muestra conteo real de centros (si > 0) + 2 trust signals honestos
- ✅ Copy "Para negocios" corregido — sin claim de "350 profesionales"
- ✅ Widget mock limpiado — eliminados valores €348/87%/+2 new, reemplazados por placeholders visuales
- ✅ Ejecutado `npm run type-check` → sin errores
- ✅ Ejecutado `npm run lint` → 6 warnings preexistentes (otros archivos), ninguno nuevo

---

## 4. Archivos modificados

| Archivo | Cambio |
|---|---|
| `app/page.tsx` | Añadida `getHomeStats()`, eliminados 5 claims falsos, corregido copy, limpiado widget |

---

## 5. Archivos creados

| Archivo | Descripción |
|---|---|
| `docs/informes/fase-01-home-app-publica.md` | Este informe |

---

## 6. Decisiones tomadas

| Decisión | Justificación |
|---|---|
| Mostrar conteo real de centros activos | Dato calculado desde DB — honesto. Si hay 1 → "1 centro activo" |
| Eliminar valoración media del hero | No hay suficientes reviews verificadas para una media significativa |
| Eliminar recuento de reservas del hero | Podría ser engañoso si el número es bajo |
| Eliminar recuento de ciudades | Solo hay 1 ciudad real — dato no representativo |
| Mantener widget de agenda como ilustración UI | Los mockups de producto son práctica estándar en marketing; lo eliminado son los números falsos (€348, 87%) |
| `Promise.all` para stats + centers | No aumenta latencia — queries paralelas |

---

## 7. Riesgos detectados

| Riesgo | Severidad | Estado |
|---|---|---|
| `getHomeStats()` añade 2 queries DB | Bajo | Queries simples (`count`), paralelas — impacto mínimo |
| `force-dynamic` en home | Medio | La home no cachea — revisar en Fase 12 si impacta LCP |

---

## 8. Errores encontrados

Ninguno en los archivos modificados.

Warnings preexistentes (otros archivos, no introducidos en esta fase):
- `productos/page.tsx`: `'Tag' is defined but never used`
- `para-negocios/page.tsx`: `'TrendingUp' is defined but never used`
- `booking-wizard.tsx`: `'UserCircle'` unused, `bookingDone`/`confirmCode` unused, `react-hooks/exhaustive-deps`
- `booking-calendar.tsx`: `'tabContainsView'` unused
- `sidebar-nav.tsx`: `'ClipboardList'` unused

Pendientes para Fase 8 (dashboard) y Fase 13 (UX/UI).

---

## 9. Verificaciones ejecutadas

| Verificación | Comando | Resultado |
|---|---|---|
| TypeScript | `npm run type-check` | ✅ Sin errores |
| Lint | `npm run lint` | ✅ 0 errores, 6 warnings preexistentes |

---

## 10. Resultado de verificaciones

- `tsc --noEmit` → exit 0, sin output de error
- `next lint` → 6 warnings preexistentes en otros archivos, ninguno en `app/page.tsx`

---

## 11. Qué queda pendiente

- Warnings de lint preexistentes (otros archivos) → Fase 8, Fase 13
- `force-dynamic` en home → revisar performance en Fase 12
- Páginas legales (`/privacidad`, `/terminos`, `/cookies`) → Fase 14

---

## 12. Recomendación de siguiente fase

**Fase 2 — Perfil de negocio como web completa**

Incluye la creación de `ServiceStaff` en el seed, que desbloquea el motor de disponibilidad y permite que el booking funcione realmente con la peluquería demo.

---

## 13. Estado final

✅ **APROBABLE**

- 5 claims falsos eliminados o reemplazados por datos reales o copy honesto
- `type-check` limpio
- `lint` sin errores nuevos
- Ningún código funcional roto
