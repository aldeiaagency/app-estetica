# Informe Fase 05 — Cancelación y Modificación de Reservas

**Fecha:** 2026-06-09
**Estado:** ✅ Aprobable

---

## 1. Objetivo de la fase

- Implementar `rescheduleBookingAction` — cambio de fecha/hora con re-verificación de disponibilidad
- Añadir UI de reprogramación en `/reserva/gestionar` (date strip + slots + confirm)
- Actualizar `/api/v1/booking` para exponer los IDs necesarios para la UI de reprogramación
- Auditar `gestionar/page.tsx` y migrar colores de `slate-`/`rose-` al design system (`zinc-`/`primary-`)

---

## 2. Acciones planificadas

- Leer `prisma/schema.prisma` — confirmar campos disponibles en `Booking` (especialmente `notes`)
- Actualizar `app/api/v1/booking/route.ts` — añadir `centerId`, `serviceId`, `staffId`
- Añadir `rescheduleBookingAction` en `app/actions/booking.ts`
- Reescribir `app/reserva/gestionar/page.tsx` — añadir flujo de reprogramación
- Ejecutar `npm run type-check` y `npm run lint`

---

## 3. Acciones ejecutadas

- ✅ Leído `prisma/schema.prisma` — confirmado `notes String?` en modelo `Booking` para auditar cambios
- ✅ Actualizado `app/api/v1/booking/route.ts` — añadidos `centerId`, `serviceId`, `staffId` a la respuesta
- ✅ Añadido `rescheduleBookingAction` en `app/actions/booking.ts`:
  - Validación Zod: `confirmationCode`, `customerEmail`, `newStartAt`, `newEndAt`
  - Política 24h: misma que cancelación
  - `prisma.$transaction` con re-verificación de conflictos por `staffId` o `centerId`
  - Auditoría: fecha anterior guardada en `notes` ("Reprogramada desde X de Y Z")
- ✅ Reescrito `app/reserva/gestionar/page.tsx`:
  - Migrado a colores del design system (`zinc-`/`primary-` en lugar de `slate-`/`rose-`)
  - Nuevo estado `subPhase: 'idle' | 'pick-date' | 'confirm-reschedule'`
  - Date strip (14 días a partir de mañana) + grid de slots via `/api/v1/availability`
  - Pantalla de confirmación del cambio (antes/después)
  - Estado `rescheduled` con mensaje de éxito
  - `useEffect` para cargar slots al cambiar la fecha seleccionada
- ✅ Ejecutado `tsc --noEmit` → sin errores
- ✅ Ejecutado `next lint --quiet` → sin errores ni warnings nuevos

---

## 4. Archivos modificados

| Archivo | Cambio |
|---|---|
| `app/api/v1/booking/route.ts` | Añadidos `centerId`, `serviceId`, `staffId` a la respuesta JSON |
| `app/actions/booking.ts` | Añadido `rescheduleBookingAction` con Zod, transacción, política 24h, auditoría en `notes` |
| `app/reserva/gestionar/page.tsx` | Reescrito: reschedule UI + migración design system + `BookingInfo` type actualizado |

---

## 5. Archivos creados

| Archivo | Descripción |
|---|---|
| `docs/informes/fase-05-modificacion-cancelacion.md` | Este informe |

---

## 6. Decisiones tomadas

| Decisión | Justificación |
|---|---|
| `subPhase` en lugar de `phase` nueva | El reschedule es un sub-flujo dentro de `found` — no rompe la máquina de estados principal |
| Slots start from tomorrow (not today) | Mínimo 24h de antelación — no tiene sentido mostrar slots de hoy si la política lo impide |
| Auditoria en `notes`, no nuevo campo | `notes String?` ya existe, no requiere migración; suficiente para trazabilidad |
| Conflicto chequea `staffId` o `centerId` | Si `staffId` es null, chequear conflictos a nivel de centro es la alternativa correcta |
| Design system migrado completo | `gestionar/page.tsx` era el único archivo con `slate-`/`rose-` — ahora coherente con el resto |
| No email de confirmación del cambio | Requiere nueva función en `lib/notifications/email.ts` — diferir a cuando se implemente Resend en producción |

---

## 7. Riesgos detectados

| Riesgo | Severidad | Estado |
|---|---|---|
| `staffId: null` en conflicto check | Bajo | Manejado: `staffId ? { staffId } : { centerId }` |
| Slots de hoy no filtrados si no se limita el date strip | Bajo | Mitigado: `getNextDays` arranca desde `+1 día` (mañana) |
| Email al negocio cuando hay cambio | Medio | Pendiente — se notifica al negocio solo si Resend está configurado. Diferir. |

---

## 8. Errores encontrados

Ninguno. El `tsc` y `lint` pasaron limpios en el primer intento.

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

- Email al negocio cuando se modifica una reserva — requiere nueva función en `lib/notifications/email.ts`
- Metadata `noindex` para `/reserva/gestionar` — `'use client'` requiere `layout.tsx` hermano (Fase 14)
- Test manual del flujo completo en producción con datos reales

---

## 12. Recomendación de siguiente fase

**Fase 6 — Ecommerce de productos**: crear `/productos`, `/productos/[slug]`, carrito y checkout. Es la siguiente pieza de valor para usuarios finales. Las fichas de centros ya muestran CTAs "Ver producto" deshabilitados — es el momento de activarlos.

---

## 13. Estado final

✅ **APROBABLE**

- `cancelBookingAction` funcional (Fase 4, pre-existente) + `rescheduleBookingAction` nuevo
- UI de gestión completa: lookup → ver estado → cambiar fecha/hora → cancelar
- Flujo de reprogramación: date strip → slots via API → confirm → éxito
- Design system `zinc-`/`primary-` aplicado a toda la página de gestión
- `type-check` y `lint` limpios
