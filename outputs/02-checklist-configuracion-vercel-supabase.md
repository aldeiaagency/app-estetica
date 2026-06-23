# 02 · Checklist de configuración — Vercel + Supabase + Prisma

## A. Variables de entorno en Vercel

**Estado actual (verificado vía API):** solo **5 de 23** configuradas (todas en `production` + `preview`).

| Variable | Necesaria para | En Vercel | Dónde obtenerla |
|---|---|:---:|---|
| `DATABASE_URL` | Prisma (queries) | ✅ | Supabase → Settings → Database (pooled 6543) |
| `DIRECT_URL` | Prisma (migraciones) | ✅ | Supabase (direct 5432) |
| `AUTH_SECRET` | Auth.js | ✅ | `openssl rand -base64 32` |
| `NEXT_PUBLIC_APP_URL` | enlaces/SEO/emails | ✅ | dominio final |
| `NEXT_PUBLIC_APP_NAME` | branding | ✅ | "Belleza Local" |
| `CRON_SECRET` | crons (reminders/holds/follow-ups) | ❌ **P0** | generar (`openssl rand -hex 32`) |
| `STRIPE_SECRET_KEY` | pagos/suscripciones | ❌ **P0** | Stripe → API keys |
| `STRIPE_WEBHOOK_SECRET` | webhook | ❌ **P0** | Stripe → Webhooks (tras crear endpoint) |
| `STRIPE_PRICE_BASIC_MONTHLY` | plan Presencia | ❌ **P0** | Stripe → Products |
| `STRIPE_PRICE_PRO_MONTHLY` | plan Growth (B2B) | ❌ **P0** | Stripe |
| `STRIPE_PRICE_GROWTH_MONTHLY` | plan Elite | ❌ **P0** | Stripe |
| `STRIPE_PRICE_PREMIUM_MONTHLY` | plan Partner | ❌ **P0** | Stripe |
| `STRIPE_PRICE_PRESENCIA_MONTHLY` | alias nuevo | ❌ | Stripe (opcional, ver `price-map.ts`) |
| `STRIPE_PRICE_B2B_GROWTH_MONTHLY` | alias nuevo | ❌ | Stripe |
| `STRIPE_PRICE_ELITE_MONTHLY` | alias nuevo | ❌ | Stripe |
| `STRIPE_PRICE_PARTNER_MONTHLY` | alias nuevo | ❌ | Stripe |
| `RESEND_API_KEY` | email | ❌ **P0** | Resend → API Keys |
| `EMAIL_FROM` | remitente | ❌ **P0** | p.ej. `Belleza Local <noreply@bellezalocal.es>` |
| `STORAGE_ENDPOINT` | subir imágenes | ❌ **P1** | Cloudflare R2 |
| `STORAGE_ACCESS_KEY` | R2 | ❌ **P1** | Cloudflare R2 |
| `STORAGE_SECRET_KEY` | R2 | ❌ **P1** | Cloudflare R2 |
| `STORAGE_BUCKET` | R2 | ❌ **P1** | Cloudflare R2 |
| `NEXT_PUBLIC_CDN_URL` | servir imágenes | ❌ **P1** | dominio público del bucket R2 |
| `AUTH_GOOGLE_ID` | login Google | ❌ **P2** | Google Cloud Console |
| `AUTH_GOOGLE_SECRET` | login Google | ❌ **P2** | Google Cloud Console |
| `ANTHROPIC_API_KEY` | IA premium dashboard | ❌ **P2** | console.anthropic.com |
| `NEXT_PUBLIC_POSTHOG_KEY` / `_HOST` | analytics | ❌ **P3** | PostHog (si se adopta) |

> Las variables `STRIPE_PRICE_*` con nombres nuevos (`PRESENCIA`, `B2B_GROWTH`, `ELITE`, `PARTNER`) son aliases que el código resuelve en `lib/billing/price-map.ts`. Basta configurar los 4 base (`BASIC/PRO/GROWTH/PREMIUM`) o los 4 nuevos; `price-map.ts` los mapea. **Acción:** actualizar `.env.example` (ver `propuestas/`).

**Importante:** marcar cada variable para **Production y Preview** (Preview ya quedó arreglado para las 5 actuales; las nuevas deben incluir Preview para que los previews compilen).

## B. Vercel — settings

- [ ] **Deployment Protection (SSO):** actualmente `all_except_custom_domains` → los **previews requieren login Vercel**. Si quieres validación externa de previews, desactivar o usar *Protection Bypass for Automation*. Producción (`.vercel.app`) ya es pública.
- [ ] **Dominio:** añadir `bellezalocal.es` (apex) + `www` (redirect a apex). Hoy solo existe `app-estetica-one.vercel.app`.
- [ ] Tras añadir dominio: actualizar `NEXT_PUBLIC_APP_URL` y `AUTH_URL` al dominio final, y los **redirect URIs** de Google OAuth.
- [ ] **Crons:** ya están en `vercel.json` (8:00 reminders, 3:00 holds, 9:00 follow-ups). Funcionan en cuanto exista `CRON_SECRET`.

## C. Supabase — datos y migraciones

**Estado verificado:** esquema presente, **0 filas en todas las tablas**, **sin `_prisma_migrations`** (BD creada con `db push`).

- [ ] **Sembrar datos (P0):** existe `prisma/seed-pilot-belleza.mjs` (904 líneas, datos ficticios `seoNoindex=true`) → `npm run seed:pilot` (o `--publish` para hacer visibles los centros). Reemplazar luego por datos reales del piloto.
- [ ] **Baseline de migraciones Prisma (P1):** registrar las 9 migraciones sin reaplicarlas (tablas ya existen):
  ```bash
  # opción A (no destructiva, recomendada): baseline
  for m in 20260604152949_init 20260609192612_add_orders 20260610120000_add_product_marketplace \
           20260616121500_add_booking_deposits 20260619120000_add_beauty_profile \
           20260619123000_add_beauty_plan_wallet 20260619130000_add_beauty_packs \
           20260619133000_add_follow_ups 20260619140000_add_beauty_routines; do
    npx prisma migrate resolve --applied "$m"
  done
  npx prisma migrate status   # debe decir "up to date"
  ```
  > Opción B (solo si la BD está vacía y se acepta recrear): `prisma migrate reset` — **destructiva**, requiere aprobación explícita.
- [ ] Revisar **RLS de Supabase**: la app usa la `service_role`/conexión directa de Prisma, no el cliente Supabase con RLS. Confirmar que no hay acceso público a la API REST de Supabase con datos sensibles (o que RLS está activo).
- [ ] **Backups:** confirmar plan de backups de Supabase (Point-in-Time Recovery según plan).

## D. Prisma — operación

- [ ] El build de Vercel ejecuta `prisma generate && next build` (NO `migrate deploy`). Las migraciones se aplican **manualmente** → documentar el procedimiento de release (ver `05`).
- [ ] Tras baseline, futuras migraciones: `npx prisma migrate dev --name X` en local → commit → `npx prisma migrate deploy` contra producción (con `DIRECT_URL`).
- [ ] Considerar añadir `prisma migrate deploy` a un step de release controlado (no al build, para evitar migraciones accidentales).

## E. Orden recomendado (config)
1. `CRON_SECRET` (yo puedo, 2 min) → crons vivos.
2. Stripe (tú: cuenta + productos/precios + webhook) → variables a Vercel.
3. Resend (tú: key + dominio) → variables a Vercel.
4. R2 (tú: bucket + keys) → variables a Vercel.
5. Seed datos + baseline Prisma (yo, con aprobación).
6. Dominio bellezalocal.es (tú: DNS) → actualizar `NEXT_PUBLIC_APP_URL`/`AUTH_URL`.
