# 01 · Auditoría de código y arquitectura

## 1. Stack y estructura (verificado)

- **Framework:** Next.js 15.5 (App Router) + React 18 + TypeScript.
- **Datos:** Supabase PostgreSQL + Prisma 5.22 (`DATABASE_URL` pooled 6543 / `DIRECT_URL` directo 5432, mismo proyecto Supabase — verificado).
- **Auth:** Auth.js v5 (next-auth beta) con providers **Google + Credentials** (bcrypt). Middleware edge para gating por rol.
- **Pagos:** Stripe 17 (suscripciones B2B + señales de reserva + checkout de productos). Webhook firmado.
- **Email:** Resend 4 + plantillas HTML propias.
- **Storage:** S3-compatible (Cloudflare R2) vía subida firmada (`/api/upload/sign`).
- **IA:** `@ai-sdk/anthropic` + `ai` v6 (acciones premium del dashboard).
- **Deploy:** Vercel (Node 24.x, framework nextjs, rama producción `main`).

**Salud técnica (auditoría previa 2026-06-21, reconfirmada):** `type-check` ✅ · `lint` ✅ (con aviso de `next lint` deprecado) · `test` ✅ 61 tests · `build` ✅.

### Inventario
- **57 páginas** (público + dashboard + admin + flujos beauty).
- **11 API routes**: `auth/[...nextauth]`, `webhooks/stripe`, `upload/sign`, `account/export`, `cron/{reminders,booking-holds,follow-ups}`, `v1/{availability,availability/month,booking,staff}`.
- **15 server actions**: auth, admin, billing, booking, dashboard, orders, bonos, ai + módulo beauty (beauty-profile, beauty-plan, beauty-packs, beauty-routine, benefits, follow-ups, account-privacy).

## 2. ¿El código soporta la visión definitiva?

**Sí.** El roadmap `docs/producto/app-belleza-definitiva-roadmap.md` marca sus **8 fases como "Completada"**, y el código lo confirma:

| Capacidad de la visión | Soporte en código | Estado real |
|---|---|---|
| Beauty Profile (diagnóstico) | `/diagnostico` + `beauty-profile.ts` + `lib/beauty/recommendations.ts` | 🟢 construido |
| Beauty Plan mensual | `/mi-plan` + `beauty-plan.ts` (generador determinista) | 🟢 construido |
| Rutina y reposición de productos | `/rutina` `/reposicion` + `beauty-routine.ts` + `ProductUsage` | 🟢 construido |
| Wallet / beneficios | `/wallet` + `benefits.ts` + `UserBenefit` | 🟢 construido |
| Packs por objetivo | `/dashboard/packs` + `beauty-packs.ts` | 🟢 construido |
| Marketplace curado (ranking por encaje) | `lib/marketplace/ranking.ts` | 🟢 construido |
| Fidelización B2B (follow-ups, recurrencia, campañas) | `/dashboard/{seguimientos,recurrencia,campanas}` + `follow-ups.ts` | 🟢 construido (envío email: ver §5) |
| Reservas + señales | `booking.ts` + `/api/v1/booking` + depósitos Stripe | 🟢 construido (necesita Stripe) |

**Conclusión:** no falta construir la visión; falta **encenderla** (datos + servicios externos).

## 3. Journey de NEGOCIO (plan superior "Partner/Elite") — paso a paso

| # | Paso | Ruta / acción | Estado | Bloqueo |
|---|---|---|:---:|---|
| 1 | Alta como negocio | `/auth/signup` rol `BUSINESS_ADMIN` + nombre → crea `Organization` (`auth.ts:53`) | 🟢 | ⚠️ sin verificación de email |
| 2 | Login | Credentials/Google → middleware enruta a `/dashboard` | 🟠 | Google visible pero sin `AUTH_GOOGLE_*` |
| 3 | Elegir plan y pagar | `/precios` → `billing.ts` → Stripe Checkout (suscripción) | 🔴 | **Stripe sin configurar** |
| 4 | Activar plan (webhook) | `/api/webhooks/stripe` setea `plan`, `stripeSubscriptionId` | 🔴 | **Webhook sin configurar** |
| 5 | Crear centro | `/dashboard/configuracion` | 🟢 | imágenes 🔴 (R2) |
| 6 | Servicios / staff / horarios | `/dashboard/{servicios,staff,horarios}` + motor disponibilidad | 🟢 | — |
| 7 | Productos / bonos / packs / beneficios | `/dashboard/{productos,bonos,packs,beneficios}` | 🟢 | imágenes 🔴 (R2); packs/beneficios gated por plan ✅ |
| 8 | Plantillas de seguimiento | `follow-ups.ts` (auto-crea starter templates) | 🟢 | — |
| 9 | Publicación del centro | flag `published` + `approvedAt` (aprobación admin) | 🟢 | requiere PLATFORM_ADMIN |
| 10 | Recibir/gestionar reservas | `/dashboard/reservas` | 🟠 | enlace **"Nueva reserva" roto** (`/dashboard/reservas/nueva` no existe) |
| 11 | Completar reserva → follow-up | `dashboard.ts:135` dispara `scheduleFollowUpsForCompletedBooking` | 🟢 | envío email 🔴 (Resend + CRON_SECRET) |
| 12 | Campañas / recurrencia | `/dashboard/{campanas,recurrencia}` (CRM, plan Growth+) | 🟢 | envío email 🔴 |

**Bloqueos del journey de negocio:** Stripe (3,4), R2 (5,7), enlace roto (10), email/cron (11,12), email verification (1).

## 4. Journey de USUARIA — paso a paso

| # | Paso | Ruta / acción | Estado | Bloqueo |
|---|---|---|:---:|---|
| 1 | Descubrir / buscar | `/` `/buscar` `/s/[ciudad]` | 🟠 | **BD vacía → 0 centros** |
| 2 | Ver ficha de centro | `/centro/[slug]` (JSON-LD, ranking) | 🟠 | sin datos |
| 3 | Diagnóstico Beauty Profile | `/diagnostico` → `beauty-profile.ts` | 🟢 | requiere login para guardar |
| 4 | Registro / login | `/auth/signup` rol CUSTOMER | 🟠 | sin verificación email; reset roto |
| 5 | Ver Beauty Plan | `/mi-plan` (genera plan por perfil) | 🟢 | mejor con oferta real (packs/servicios) |
| 6 | Rutina / reposición | `/rutina` `/reposicion` | 🟢 | recordatorios reposición 🔴 (cron/email) |
| 7 | Wallet / beneficios | `/wallet` | 🟢 | depende de beneficios de negocios reales |
| 8 | Reservar servicio | `/centro/[slug]/reservar` (wizard) | 🟠 | señal 🔴 (Stripe); enlace `/auth/register` **roto** |
| 9 | Confirmación reserva | email + `/reserva/confirmada/[code]` | 🔴 | **email no sale (Resend)** |
| 10 | Comprar productos | `/productos` → `/carrito` → `/checkout` | 🔴 | **Stripe sin configurar** |
| 11 | Comprar pack/bono | `/bono/[id]` | 🔴 | Stripe |
| 12 | Recordatorio de cita | cron `reminders` | 🔴 | **CRON_SECRET** |

**Bloqueos del journey de usuaria:** BD vacía (1,2,5), Stripe (8,10,11), email (9), cron (6,12), enlaces rotos (8), reset password (4).

## 5. Hallazgos de código (no bloquean build, sí calidad/operación)

### 🔴 Enlaces internos rotos (confirmados)
- `app/auth/signin/page.tsx:65` → `/auth/forgot-password` **(ruta inexistente)**. No hay flujo de reset en este repo (la memoria de reset era de otro proyecto).
- `components/booking/booking-wizard.tsx:715` → `/auth/register` **(debe ser `/auth/signup`)**.
- `app/(dashboard)/dashboard/page.tsx:74,208,251` → `/dashboard/reservas/nueva` **(ruta inexistente)**.

### 🟠 Producto / UX pendientes
- **Captura de leads B2B por `mailto:`** (`para-negocios/page.tsx:299`) — sin formulario, sin registro de lead, sin notificación.
- **Sin verificación de email**: `auth.ts` marca `emailVerified` directamente al registrar.
- **Sin recuperación de contraseña** (no existe la ruta).
- **Botón Google** visible sin credenciales → error si se pulsa.

### 🟠 Arquitectura / deuda
- **Las 7 server actions del módulo beauty usan SQL crudo** (`$queryRaw`/`$executeRaw`, ~75 queries) en vez del cliente tipado de Prisma. Está **parametrizado (sin inyección)** pero pierde type-safety y duplica los enums a mano en `lib/beauty/recommendations.ts`. Deuda de mantenibilidad, no bug.
- **Follow-ups**: el envío automático por email **se implementó en esta sesión** (`/api/cron/follow-ups` + `sendFollowUpMessage`), pendiente solo de `RESEND_API_KEY`/`CRON_SECRET` en Vercel.
- **Sin rate limiting** en endpoints públicos (`/api/v1/availability`, `/api/v1/booking`) — la regla `backend.md` lo exige.
- **Sin observabilidad** (ni Sentry ni PostHog instalados).

### 🟢 Lo que está bien
- Aislamiento multi-tenant correcto (scoping por `organizationId`/`userId`, verificación de propiedad antes de mutar).
- Webhook Stripe verifica firma y maneja los 3 eventos clave.
- Middleware protege `/dashboard` (BUSINESS/BUSINESS_ADMIN) y `/admin` (PLATFORM_ADMIN).
- GDPR: consentimiento, export (`/api/account/export`) y borrado (`account-privacy.ts`).

## 6. Recomendaciones de arquitectura (priorizadas)
1. Arreglar los 3 enlaces rotos (trivial, alta visibilidad).
2. Form B2B real → guardar lead (`Lead` model o tabla) + email interno (o n8n).
3. Rate limiting (Upstash Ratelimit o middleware propio) en `/api/v1/*`.
4. Observabilidad: Sentry (errores) + PostHog (producto).
5. Email verification + reset password (o ocultar enlaces hasta tenerlo).
6. Tests del módulo beauty (recommendations, ranking, follow-ups consent) + 1 e2e del journey de reserva.
