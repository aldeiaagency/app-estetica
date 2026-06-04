# P0 Estado Actual — Belleza Local (actualizado 2026-06-04)

**Fecha auditoría**: 2026-06-04

## Resumen ejecutivo

La app tiene infraestructura sólida (Supabase, Auth.js, Prisma, motor de disponibilidad escrito) pero el 60% de las páginas son decorativas: datos hardcoded, flujos sin conectar y botones sin acción. No existe ninguna ruta bajo `/reserva/`, `/dashboard/` (salvo la principal) ni `/admin/` (salvo el overview).

---

## ✅ Qué funciona

| Área | Estado |
|------|--------|
| Auth (login/logout/registro) | Funcional — bcrypt + next-auth |
| Dashboard principal `/dashboard` | Conectado a DB — muestra citas y KPIs reales |
| Admin overview `/admin` | Conectado a DB — muestra métricas reales |
| Búsqueda `/buscar` por ciudad/categoría | Funcional — filtra desde Prisma |
| Motor de disponibilidad `lib/availability/engine.ts` | Escrito y funcional |
| API `/api/v1/availability` | Funcional |
| Schema Prisma | Completo — 20+ modelos |
| Middleware protección rutas | Funcional |
| Seed admin + negocio demo | Creado |

---

## ❌ Qué es mock / hardcoded

| Área | Problema |
|------|----------|
| Home: stats "500+, 12.000+, 4.9★" | Datos inventados |
| Home: DEMO_BOOKINGS | Reservas ficticias presentadas como reales |
| `/centro/[slug]` | Todo hardcoded — sin query Prisma |
| `/centro/[slug]/reservar` | 5 pasos demo — sin DB ni motor |
| Paso 3 del booking | Comentario "pendiente de conectar" |
| Dashboard nav (12 rutas) | Todas a 404 excepto `/dashboard` |
| Admin nav (7 rutas) | Todas a 404 excepto `/admin` |
| Admin auth | Comentado — admin es público |

---

## ❌ Qué falta (no existe)

- `app/reserva/confirmada/[code]/page.tsx`
- `app/reserva/gestionar/page.tsx`
- `app/reserva/[code]/page.tsx`
- `app/(dashboard)/dashboard/reservas/`
- `app/(dashboard)/dashboard/servicios/`
- `app/(dashboard)/dashboard/staff/`
- `app/(dashboard)/dashboard/horarios/`
- `app/(dashboard)/dashboard/configuracion/`
- `app/(dashboard)/dashboard/clientes/`
- `app/(dashboard)/dashboard/plan/`
- `app/(admin)/admin/centros/`
- `app/(admin)/admin/organizaciones/`
- `app/(admin)/admin/planes/`
- `app/(admin)/admin/seo/`
- `app/actions/` (solo existe auth.ts)
- `lib/notifications/`
- `components/booking/`
- Seed de servicios/staff/horarios para demo

---

## ⚠️ Riesgos

1. **Motor disponibilidad sin datos**: El centro demo no tiene servicios ni horarios → la reserva no puede funcionar sin seed.
2. **Admin sin auth**: El admin panel es accesible sin login (auth comentado).
3. **Race condition en reservas**: `createBookingWithLock` usa transaction Prisma pero PgBouncer en modo transaction no garantiza serializable. Riesgo bajo en fase inicial, documentado.
4. **Notificaciones**: `RESEND_API_KEY` no configurado → emails no se envían. No debe romper el flujo.

---

## Plan P0 ejecutable

### Orden de ejecución

1. **Infraestructura**: UI components, utils, seed datos demo
2. **Home**: eliminar claims falsos
3. **Centro**: conectar a Prisma, SEO real
4. **Búsqueda**: añadir filtro por `q`
5. **Booking flow**: cliente component real con disponibilidad
6. **Confirmación + gestión**: páginas de éxito y cancelación
7. **Dashboard**: reservas CRUD, servicios CRUD, staff, horarios, config
8. **Admin**: centros, orgs, planes, SEO — con auth real
9. **Notificaciones**: Resend graceful
10. **Build**: type-check + lint + fix

### Tiempo estimado

~8 horas de implementación continua para cerrar P0 completo.
