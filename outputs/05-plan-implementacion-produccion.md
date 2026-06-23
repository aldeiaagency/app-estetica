# 05 · Plan de implementación a producción

Objetivo: pasar de "construida" a "operativa al 100%" en 3 olas. Cada tarea indica **responsable** (🤖 = yo, con tu aprobación · 👤 = tú/cuenta externa) y **dependencias**.

---

## OLA 1 — Encender la operación (P0) · objetivo: la app cobra, envía y muestra contenido

| # | Tarea | Resp. | Depende de |
|---|---|:---:|---|
| 1.1 | Generar `CRON_SECRET` y subirlo a Vercel (prod+preview) | 🤖 | — |
| 1.2 | Probar los 3 crons con `Authorization: Bearer` | 🤖 | 1.1 |
| 1.3 | Crear cuenta Stripe + 4 productos/precios + webhook | 👤 | — |
| 1.4 | Subir `STRIPE_*` (10 vars) a Vercel | 🤖 | 1.3 |
| 1.5 | Prueba real de checkout B2B (test) + webhook → plan activado | 🤖+👤 | 1.4 |
| 1.6 | Crear cuenta Resend + verificar dominio remitente | 👤 | (idealmente dominio, 3.x) |
| 1.7 | Subir `RESEND_API_KEY` + `EMAIL_FROM` a Vercel | 🤖 | 1.6 |
| 1.8 | Probar email de reserva + recordatorio + follow-up | 🤖 | 1.7 |
| 1.9 | Sembrar BD con `seed:pilot` (o datos reales del piloto) | 🤖 | aprobación |
| 1.10 | Baseline de migraciones Prisma (`migrate resolve --applied`) | 🤖 | aprobación |
| 1.11 | Verificar `/buscar` y `/centro/[slug]` muestran oferta real | 🤖 | 1.9 |

**Criterio de cierre OLA 1:** una usuaria puede ver centros, reservar (con señal cobrada en test), recibir email; un negocio puede suscribirse y su plan se activa por webhook; los crons responden 200.

---

## OLA 2 — Pulir experiencia y robustez (P1) · objetivo: lista para usuarias reales

| # | Tarea | Resp. | Depende de |
|---|---|:---:|---|
| 2.1 | Arreglar 3 enlaces rotos (forgot-password, /auth/register→/signup, reservas/nueva) | 🤖 | aprobación |
| 2.2 | Form B2B real (sustituir `mailto:`) → lead + email/n8n | 🤖 | (n8n opcional) |
| 2.3 | Configurar Cloudflare R2 + `STORAGE_*` + CORS | 👤+🤖 | — |
| 2.4 | Probar subida de imágenes desde dashboard | 🤖 | 2.3 |
| 2.5 | Añadir dominio `bellezalocal.es` + DNS | 👤 | — |
| 2.6 | Actualizar `NEXT_PUBLIC_APP_URL`/`AUTH_URL`/Resend/Stripe/Google al dominio | 🤖 | 2.5 |
| 2.7 | Email verification + reset password (o ocultar enlaces) | 🤖 | aprobación |
| 2.8 | Rate limiting en `/api/v1/availability` y `/api/v1/booking` | 🤖 | aprobación |
| 2.9 | Observabilidad: Sentry (errores) + PostHog (producto) | 🤖+👤 | cuentas |

**Criterio de cierre OLA 2:** dominio propio, imágenes funcionando, sin enlaces rotos, errores monitorizados, endpoints públicos protegidos.

---

## OLA 3 — Automatización, calidad y escala (P2/P3)

| # | Tarea | Resp. |
|---|---|:---:|
| 3.1 | n8n: workflow de leads B2B + onboarding + alertas de fallo | 🤖+👤 |
| 3.2 | Google OAuth productivo | 👤 |
| 3.3 | Tests del módulo beauty (recommendations, ranking, follow-ups consent) + 1 e2e de reserva | 🤖 |
| 3.4 | Migrar `next lint` → ESLint CLI | 🤖 |
| 3.5 | Banner de cookies / consentimiento + revisión retención GDPR | 🤖 |
| 3.6 | Limpieza de documentación obsoleta (marcar histórica) | 🤖 |
| 3.7 | IA premium (`ANTHROPIC_API_KEY`) si entra en el plan superior | 👤+🤖 |

---

## Procedimiento de release (a partir de ahora)
1. Rama feature → PR → preview (recordar: previews bajo SSO).
2. `type-check` + `lint` + `test` + `build` local en verde.
3. Si hay cambio de schema: `migrate dev` local → commit migración → tras merge, `migrate deploy` controlado contra prod (`DIRECT_URL`).
4. Merge a `main` → deploy producción automático (Vercel).
5. Smoke test de rutas críticas + revisar Sentry.

---

## Lo que puedo ejecutar ya mismo (con tu OK)
- 🤖 `CRON_SECRET` a Vercel + probar crons (no destructivo, desbloquea automatizaciones).
- 🤖 Seed piloto + baseline Prisma (toca datos → requiere tu aprobación explícita).
- 🤖 Arreglar los 3 enlaces rotos (cambio de código trivial, vía PR).
- 🤖 `.env.example` actualizado con todos los aliases (ver `propuestas/`).

Para Stripe/Resend/R2/Google/DNS necesito que crees las cuentas/keys; en cuanto las tenga, **configuro las variables y pruebo end-to-end yo**.
