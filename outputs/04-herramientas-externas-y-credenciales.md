# 04 · Herramientas externas y credenciales

Para cada servicio: qué crear, qué claves salen, y dónde van. **Ningún secreto se guarda en el repo** — todo va a variables de entorno de Vercel (y `.env.local` para desarrollo).

---

## 1. Stripe (P0) — pagos y suscripciones
**Qué hacer:**
1. Crear cuenta Stripe (modo test primero).
2. Crear **4 productos** con precio mensual recurrente (suscripción B2B):
   - Presencia (BASIC) · Growth (PRO) · Elite (GROWTH) · Partner (PREMIUM).
   - Precios actuales en código (`lib/billing/plans.ts`): 24€ / 59€ / 149€ / 399€ /mes (+IVA según política).
3. Copiar los **Price IDs** → `STRIPE_PRICE_BASIC_MONTHLY`, `_PRO_`, `_GROWTH_`, `_PREMIUM_` (y/o aliases `_PRESENCIA_/_B2B_GROWTH_/_ELITE_/_PARTNER_`).
4. API keys → `STRIPE_SECRET_KEY` (sk_…). `STRIPE_PUBLISHABLE_KEY` si se usa en cliente.
5. **Webhook:** endpoint `https://<dominio>/api/webhooks/stripe`, eventos: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted` → copiar **signing secret** → `STRIPE_WEBHOOK_SECRET`.
6. (Señales de reserva y checkout de productos usan PaymentIntents/Checkout — la misma `STRIPE_SECRET_KEY`.)
**Prueba:** checkout en test → confirmar que el webhook actualiza `Organization.plan`.

## 2. Resend (P0) — email
**Qué hacer:**
1. Crear cuenta Resend.
2. **Verificar dominio** `bellezalocal.es` (registros DNS SPF/DKIM que da Resend).
3. API key → `RESEND_API_KEY`.
4. `EMAIL_FROM` = `Belleza Local <noreply@bellezalocal.es>`.
**Prueba:** disparar confirmación de reserva, recordatorio y follow-up (este último vía `/api/cron/follow-ups`).
> Hasta verificar dominio, Resend solo envía a tu propio email (modo sandbox).

## 3. Cloudflare R2 (P1) — imágenes
**Qué hacer:**
1. Crear bucket R2 (p.ej. `belleza-local-media`).
2. Crear API token S3 → `STORAGE_ACCESS_KEY`, `STORAGE_SECRET_KEY`.
3. `STORAGE_ENDPOINT` = `https://<accountid>.r2.cloudflarestorage.com`. `STORAGE_BUCKET` = nombre.
4. Exponer bucket por dominio público (r2.dev o subdominio CDN) → `NEXT_PUBLIC_CDN_URL`.
5. Configurar **CORS** del bucket para permitir PUT firmado desde el dominio de la app.
**Prueba:** subir imagen de centro/producto desde el dashboard (`/api/upload/sign`).

## 4. Google OAuth (P2) — login con Google
**Qué hacer:**
1. Google Cloud Console → OAuth consent screen + credenciales OAuth 2.0.
2. Redirect URI: `https://<dominio>/api/auth/callback/google`.
3. → `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`.
> Alternativa interina: ocultar el botón de Google hasta tenerlo (evita error al pulsar).

## 5. Anthropic (P2) — IA premium del dashboard
- API key en console.anthropic.com → `ANTHROPIC_API_KEY` (la usa `@ai-sdk/anthropic`).
- Modelo recomendado por defecto: Claude más capaz disponible para la feature.

## 6. Supabase (ya existe)
- Proyecto `sijkaqbgxympmstmjnvs` (eu-west-1). `DATABASE_URL`/`DIRECT_URL` ya en Vercel.
- Pendiente: backups/PITR según plan, revisión de RLS (ver `02.C` y `07`).

## 7. Vercel (ya existe)
- Proyecto `app-estetica` (team `aldeiaagencys-projects`). Producción `main`.
- Pendiente: resto de env vars, dominio, decisión sobre Deployment Protection.

## 8. Dominio / DNS (P1)
- `bellezalocal.es`: añadir en Vercel como apex + `www`→apex. Registros A/CNAME que indique Vercel.
- Tras propagar: actualizar `NEXT_PUBLIC_APP_URL`, `AUTH_URL`, Resend (dominio), Stripe (webhook URL), Google (redirect URI).

## 9. Observabilidad (P2/P3) — opcional pero recomendado
- **Sentry** (errores server/client): DSN → `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN`.
- **PostHog** (producto/funnels): `NEXT_PUBLIC_POSTHOG_KEY` / `_HOST` (ya previstos en `.env.example`).

---

## Tabla resumen: quién hace qué

| Servicio | Lo hace | Prioridad | Yo puedo ayudar con |
|---|---|:---:|---|
| CRON_SECRET | Yo (token Vercel) | P0 | generarlo + subirlo |
| Stripe | Tú (cuenta) | P0 | el código ya está; te guío y configuro env tras tus keys |
| Resend | Tú (cuenta+DNS) | P0 | configurar env + probar envíos |
| R2 | Tú (cuenta) | P1 | configurar env + probar subida |
| Seed datos | Yo (con aprobación) | P0 | ejecutar `seed:pilot` |
| Baseline Prisma | Yo (con aprobación) | P1 | comandos `migrate resolve` |
| Google OAuth | Tú | P2 | ocultar botón mientras tanto |
| Dominio/DNS | Tú | P1 | actualizar env tras propagación |
| Sentry/PostHog | Yo (código) + tú (cuentas) | P2/P3 | integrar SDK |
