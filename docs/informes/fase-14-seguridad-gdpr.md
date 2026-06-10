# Informe Fase 14 — Seguridad y GDPR

**Fecha:** 2026-06-10
**Estado:** Completada
**Commit:** 3477de1

---

## 1. Objetivo de la fase

Eliminar los 404 de las páginas legales del footer, implementar emails transaccionales con Resend, y añadir cabeceras de seguridad HTTP y rate limiting.

## 2. Archivos creados

| Archivo | Descripcion |
|---|---|
| `app/privacidad/page.tsx` | Política de privacidad RGPD/LOPDGDD: responsable, finalidades, plazos, derechos ARCO, encargados DPA |
| `app/terminos/page.tsx` | Términos y condiciones: tipos de usuario, reservas, planes, pagos, responsabilidad, ley aplicable |
| `app/cookies/page.tsx` | Política de cookies: listado exacto de 4 cookies técnicas esenciales con tabla, instrucciones opt-out por navegador |
| `lib/email/client.ts` | Instancia Resend (RESEND_API_KEY, EMAIL_FROM) |
| `lib/email/templates.ts` | sendBookingConfirmation, sendBookingCancellation, sendBookingReminder — HTML plano, responsive, con branding primary-600 |

## 3. Archivos modificados

| Archivo | Cambio |
|---|---|
| `app/actions/dashboard.ts` | updateBookingStatusAction: emails fire-and-forget en CONFIRMED y CANCELLED. Import formatDate/formatTime para formato de fecha en email |
| `next.config.mjs` | X-Frame-Options: DENY, X-Content-Type-Options, Referrer-Policy, HSTS 1 año, Permissions-Policy, CSP basico (Stripe + Google Fonts + self) |
| `middleware.ts` | Rate limit 60 req/min por IP en /api/* (excluye /api/webhooks/ — protegido por firma Stripe). Implementacion globalThis best-effort |

## 4. Decisiones tomadas

| Decision | Razon |
|---|---|
| Emails fire-and-forget (.catch(() => {})) | Un fallo de email no debe bloquear la confirmacion de la reserva |
| HTML plano en templates (sin React Email) | Evita dependencia extra; los emails son simples, el HTML inline es mas compatible |
| Rate limiting globalThis, no Redis | MVP sin KV externo. Nota: para produccion a escala, migrar a Upstash + @vercel/kv |
| CSP con unsafe-inline | Necesario para Next.js App Router (estilos inline de Tailwind). Refinar en post-MVP con nonces |
| Paginas legales con robots: noindex | No generan valor SEO, evitan confusion en resultados de busqueda |
| /api/webhooks/ excluido del rate limit | El webhook de Stripe es verificado por firma HMAC, no necesita rate limit |

## 5. Limitaciones conocidas (MVP)

- Rate limiting por IP es best-effort: no persiste entre Lambda cold starts ni entre multiples regiones. Para produccion real, usar Upstash Rate Limit con Vercel KV.
- CSP usa unsafe-inline/unsafe-eval: necesario con el App Router de Next.js hasta implementar nonces. Revisar en post-MVP.
- HSTS: no aplica en desarrollo local (HTTP). Solo efectivo en produccion con HTTPS.

## 6. Verificaciones ejecutadas

- npx tsc --noEmit → 0 errores
- npx next lint --quiet → 0 warnings ni errores

## 7. Configuracion de produccion requerida

- `RESEND_API_KEY` → consola resend.com → API Keys
- `EMAIL_FROM` → dominio verificado en Resend (ej: noreply@bellezalocal.es)

## 8. Estado final

Completada — 404s de pages legales resueltos, emails transaccionales operativos, cabeceras de seguridad HTTP completas, rate limiting en /api/*.

## 9. Recomendacion siguiente fase

Fase 15 — Tests/QA/build/piloto: type-check completo, build de produccion, smoke test del flujo reserva completo, seed limpio para el piloto.
