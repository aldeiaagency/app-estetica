# 07 · Riesgos: seguridad, GDPR y operación

## A. Seguridad

| Riesgo | Sev. | Estado | Acción |
|---|:---:|---|---|
| **Sin rate limiting** en `/api/v1/availability` y `/api/v1/booking` (endpoints públicos) | 🔴 Alta | No implementado (la regla `backend.md` lo exige) | Upstash Ratelimit o limitador por IP en middleware |
| **Sin observabilidad** (Sentry) | 🟠 Media | No instalado | A ciegas ante errores en prod; instalar Sentry |
| **Secretos** | 🟢 | Correcto: en env, no en repo; `.env.local` gitignored | Mantener. Rotar tokens compartidos puntualmente (p.ej. el token Vercel usado en esta sesión) |
| **Webhook Stripe** | 🟢 | Verifica firma (`constructEvent`) | OK; añadir idempotencia/log de eventos |
| **Aislamiento multi-tenant** | 🟢 | Scoping por org/centro, verificación de propiedad | OK; mantener en nuevas queries |
| **RLS Supabase** | 🟠 | A confirmar | La app usa conexión Prisma directa; confirmar que la API REST pública de Supabase no expone datos (RLS on o sin anon key pública) |
| **Deployment Protection (SSO)** | 🟢 | Activa en previews | Bien para no exponer trabajo en curso; valorar bypass para QA |
| **Verificación de email** | 🟠 | Ausente (`emailVerified` se marca al registrar) | Permite registros con email no validado; activar verificación |
| **Login Google sin credenciales** | 🟠 | Botón visible, sin `AUTH_GOOGLE_*` | Error al pulsar; ocultar o configurar |
| **CSP / headers de seguridad** | 🟠 | Revisar `next.config.mjs` | Añadir headers (CSP, HSTS, X-Frame-Options) |

## B. GDPR (sector belleza, datos personales sensibles del perfil)

| Requisito | Estado | Nota |
|---|:---:|---|
| Consentimiento de personalización | 🟢 | `BeautyProfile.consentPersonalizationAt`; el diagnóstico exige consentimiento |
| Consentimiento de marketing | 🟢 | `Customer.marketingConsent`; follow-ups/campañas lo respetan; el cron re-chequea en el envío |
| Derecho de acceso (export) | 🟢 | `/api/account/export` (con auth) |
| Derecho de supresión | 🟢 | `account-privacy.ts` borra datos de personalización (confirmación "BORRAR") |
| Revocar consentimiento | 🟢 | `revokeMarketingConsentAction` en `/cuenta` |
| Política de privacidad / términos / cookies | 🟠 | Existen `/privacidad` `/terminos` `/cookies`; **falta banner de consentimiento de cookies** |
| Registro de actividades / DPA | 🟠 | Confirmar DPA con Supabase/Vercel/Resend/Stripe/Cloudflare (encargados de tratamiento) |
| Retención de datos | 🟠 | Definir políticas (p.ej. follow-ups antiguos, perfiles inactivos) |
| Minimización en logs | 🟢 | Regla "no loggear datos personales" (verificar cumplimiento en nuevas trazas) |
| Base legal follow-ups | 🟢 | FOLLOW_UP (interés legítimo postservicio) vs MARKETING (consentimiento) bien separados |

**Acciones GDPR P1/P2:**
- Banner de cookies/consentimiento (analytics solo tras opt-in).
- Documentar registro de tratamientos + DPAs con cada proveedor.
- Política de retención y borrado automático (n8n o cron).

## C. Operación

| Riesgo | Sev. | Detalle | Mitigación |
|---|:---:|---|---|
| **BD vacía** | 🔴 | 0 filas → marketplace sin contenido | Seed piloto / onboarding real (OLA 1) |
| **Sin baseline de migraciones** | 🟠 | `_prisma_migrations` ausente; futuro `migrate deploy` fallaría | `migrate resolve --applied` (OLA 1/2) |
| **Migraciones no en el deploy** | 🟠 | Build solo hace `generate+build` | Procedimiento de release con `migrate deploy` controlado |
| **Crons sin secret** | 🔴 | Devuelven 500 en prod | `CRON_SECRET` (OLA 1) |
| **Email "outbox" sin proveedor** | 🔴 | Nada sale sin Resend | Configurar Resend (OLA 1) |
| **Cron Hobby 1×/día** | 🟠 | Recordatorios/holds/follow-ups con baja frecuencia y ±59 min | n8n fallback (cadencia mayor) o Vercel Pro |
| **Dependencia de token compartido** | 🟢 | El token Vercel de esta sesión es puntual | Rotar tras uso; preferir tokens scoped/efímeros |
| **Sin tests del módulo nuevo** | 🟠 | Regresiones no detectadas | Tests beauty + e2e (OLA 3) |
| **Backups** | 🟠 | Confirmar PITR Supabase | Según plan; documentar restore |

## D. Top 5 a cerrar primero (impacto × riesgo)
1. `CRON_SECRET` + Resend → desbloquea email/recordatorios/follow-ups (operación básica).
2. Stripe completo → desbloquea ingresos (suscripciones + señales + productos).
3. Seed + baseline → la app deja de estar vacía y la BD es mantenible.
4. Rate limiting + Sentry → no exponer endpoints públicos sin defensa ni volar a ciegas.
5. Banner de cookies + verificación de email → cumplimiento y confianza.
