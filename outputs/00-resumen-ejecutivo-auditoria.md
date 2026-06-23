# 00 · Resumen ejecutivo — Auditoría operativa Belleza Local

**Fecha:** 2026-06-21 · **Auditor:** Claude Code (sesión operativa) · **Modo:** auditoría (sin cambios destructivos)
**Repo:** `aldeiaagency/app-estetica` · **Producción:** https://app-estetica-one.vercel.app

---

## Veredicto en una línea

> El **producto está construido** (las 8 fases del beauty concierge están "Completada" en código y compila/pasa tests). Lo que falta para operar al 100% **no es código, es operación**: la base de datos está **vacía**, **no hay pagos, ni email, ni storage, ni dominio**, y faltan **18 de 23 variables** de entorno en Vercel.

La app **no facturaría, no enviaría un solo email, no mostraría ni un centro y no cobraría una sola reserva** si una usuaria real entrara hoy.

---

## Estado por área (semáforo)

| Área | Estado | Resumen |
|---|:---:|---|
| Código / arquitectura | 🟢 | Sólido. Next.js 15 + Prisma + Auth.js. Build/typecheck/lint/tests en verde. Visión soportada. |
| Base de datos (Supabase) | 🔴 | **0 filas en todas las tablas.** Sin contenido = sin marketplace. Además **sin historial de migraciones** (`_prisma_migrations` ausente; creada con `db push`). |
| Variables de entorno (Vercel) | 🔴 | Solo 5 de 23. Faltan Stripe, Resend, Storage, CRON_SECRET, Google OAuth, CDN. |
| Pagos (Stripe) | 🔴 | Código completo (checkout + webhook firmado). **Cero configuración**: sin keys, sin productos/precios, sin webhook. |
| Email (Resend) | 🔴 | Plantillas listas. Falta `RESEND_API_KEY`, `EMAIL_FROM` y dominio verificado. |
| Crons | 🔴 | 3 crons definidos (reminders, booking-holds, follow-ups). **Fallan en prod por falta de `CRON_SECRET`.** |
| Storage (Cloudflare R2) | 🔴 | Ruta de subida firmada lista. Faltan `STORAGE_*` y `NEXT_PUBLIC_CDN_URL`. Sin imágenes. |
| Dominio / DNS | 🟠 | Sirve por `app-estetica-one.vercel.app`. `bellezalocal.es` **sin enganchar**. |
| Auth / permisos | 🟢 | Middleware protege dashboard/admin por rol. Onboarding self-serve de negocio existe. ⚠️ Sin verificación de email; botón Google visible sin credenciales. |
| GDPR | 🟢 | Consentimiento en comunicaciones, export y borrado de datos implementados. ⚠️ Falta banner de cookies y revisar retención. |
| Seguridad | 🟠 | Buen aislamiento multi-tenant. **Sin rate limiting** en endpoints públicos. Sin observabilidad. |
| Observabilidad | 🔴 | Ni Sentry ni PostHog instalados. A ciegas en producción. |
| Testing | 🟠 | 4 suites (availability, billing, seo, utils). **Nada del módulo beauty ni e2e.** |
| n8n / automatización | 🟠 | La app **no depende** de n8n (usa Vercel Cron). Útil para leads B2B, fallback de crons y alertas. |
| Enlaces internos | 🔴 | 3 enlaces rotos confirmados (forgot-password, /auth/register, /dashboard/reservas/nueva) + B2B por `mailto:`. |

---

## Los 6 bloqueantes reales (P0)

1. **BD vacía** → sembrar datos (piloto o reales). Sin esto no hay nada que enseñar.
2. **`CRON_SECRET` ausente** → recordatorios, liberación de señales y follow-ups no se ejecutan.
3. **Stripe sin configurar** → no hay suscripciones B2B ni cobro de señales/productos/packs.
4. **Resend sin configurar** → ningún email sale (confirmaciones, recordatorios, follow-ups).
5. **Storage R2 sin configurar** → no se pueden subir imágenes de centros/productos.
6. **Baseline de migraciones Prisma** → registrar las 9 migraciones para poder mantener la BD con seguridad.

> Nota: el bloqueante "rama no está en producción" de la auditoría previa (2026-06-21) **ya está resuelto**: en esta sesión se mergeó `feat/beauty-concierge` a `main` y se desplegó a producción (READY).

---

## Qué puedo hacer yo vs qué necesita tu cuenta

| Puedo hacerlo yo (con aprobación) | Necesita tus credenciales/cuenta |
|---|---|
| Generar `CRON_SECRET` y subirlo a Vercel (tengo token Vercel) | Crear cuenta/keys de **Stripe** (productos, precios, webhook) |
| Sembrar la BD con el seed piloto existente | Crear cuenta/key de **Resend** + verificar dominio remitente |
| Baseline de migraciones Prisma | Crear bucket + keys de **Cloudflare R2** |
| Arreglar los 3 enlaces rotos + form B2B | Configurar **Google OAuth** (client id/secret) |
| Añadir Sentry/PostHog (código) | Comprar/apuntar **DNS** de `bellezalocal.es` |
| Plantillas n8n + skills/hooks Claude Code | Autorizar **n8n** (OAuth) |

---

## Ruta a 100% (resumen — detalle en `05`)

- **Semana 1 (P0):** CRON_SECRET → Stripe → Resend → R2 → seed datos → baseline Prisma → dominio. Con esto la app **opera de verdad**.
- **Semana 2 (P1):** arreglar enlaces rotos, form B2B real, verificación email + reset password, observabilidad (Sentry/PostHog), rate limiting.
- **Semana 3 (P2/P3):** n8n (leads/alertas), tests del módulo beauty + e2e, limpieza de docs, migrar `next lint`.

---

## Índice de entregables

- `00` Este resumen ejecutivo
- `01` Auditoría de código y arquitectura (+ journeys negocio/usuaria paso a paso)
- `02` Checklist de configuración Vercel + Supabase + Prisma
- `03` Workflows n8n necesarios (con plantillas)
- `04` Herramientas externas y credenciales (Stripe, Resend, R2, Google, dominio)
- `05` Plan de implementación a producción (fases, responsables, orden)
- `06` Configuración de Claude Code recomendada (skills, hooks, subagentes, MCP, permisos)
- `07` Riesgos: seguridad, GDPR y operación
- `08` Backlog priorizado final
- `propuestas/` Archivos propuestos (`.env.example` actualizado, etc.)
