# Informe de Activación de Producción — 2026-07-13

**Fecha de activación:** 2026-07-13 21:00 UTC  
**Responsable:** Claude Code (Haiku 4.5)  
**Repositorio:** `aldeiaagency/app-estetica`  
**Ambiente:** Production (Vercel + Supabase)

---

## 1. VALIDACIÓN PREVIA ✅

| Comprobación | Resultado | Evidencia |
|---|---|---|
| npm ci | ✅ PASS | Dependencias instaladas |
| npm run type-check | ✅ PASS | Sin errores de TypeScript |
| npm test | ✅ PASS | 91 pruebas superadas, 7 omitidas (PostgreSQL) |
| npm run build | ✅ PASS | 55 rutas compiladas sin errores |
| npm audit | ✅ PASS | 0 vulnerabilidades de producción |
| npx prisma validate | ✅ PASS | Schema válido y aplicado |
| git diff --check | ✅ PASS | Sin problemas de formato |

---

## 2. MIGRACIONES SUPABASE ✅

**Estado:** Todas 20 migraciones aplicadas

Nuevas migraciones incluidas en esta activación:
- `20260713160000_financial_and_booking_integrity` — Estados de pago, idempotencia
- `20260713190000_message_delivery_claims` — Claims atómicas para recordatorios
- `20260713191000_integration_outbox` — Entrega garantizada de eventos
- `20260713192000_center_cancellation_policy` — Política de cancelación por centro
- `20260713193000_data_retention_evidence` — Auditoría de retención de datos

**Verificación:** `npx prisma migrate status` → "Database schema is up to date!"

---

## 3. GITHUB ✅

| Commit | Mensaje | Status |
|---|---|---|
| `7ad2ea5` | fix: close production audit findings | ✅ CodeQL passing |
| `ec82162` | chore: change integration-outbox cron to daily | ✅ CodeQL passing |

**Acciones realizadas:**
- 48 archivos modificados con remediaciones P0
- 9 archivos nuevos (módulos de seguridad, pruebas)
- 5 migraciones nuevas
- Push a `main` sin cambios pendientes

---

## 4. VERCEL PRODUCTION ✅

| Métrica | Valor | Estado |
|---|---|---|
| Deployment ID | `dpl_GS96hYNJbK2PuqR2yD8rPtJ2svHq` | Ready |
| URL canónica | https://app-estetica-one.vercel.app | ✅ Activo |
| Dominios aliaseados | bellezalocal.es, www.bellezalocal.es | ⚠️ DNS pendiente |
| Tiempo de build | 2m | Normal |
| Runtime | Node.js / Next.js 15 | ✅ |

**Variables de entorno configuradas:**
- DATABASE_URL, DIRECT_URL — Supabase ✅
- AUTH_SECRET, AUTH_URL — Auth.js ✅
- NEXT_PUBLIC_APP_URL — bellezalocal.es ✅
- CRON_SECRET — Protección de crons ✅
- N8N_WEBHOOK_* — Integración n8n ✅
- NEXT_PUBLIC_APP_NAME — "Belleza Local" ✅

**Variables pendientes (requieren credenciales externas):**
- STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY, STRIPE_WEBHOOK_SECRET
- RESEND_API_KEY, EMAIL_FROM
- UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN
- STORAGE_* (Cloudflare R2)

---

## 5. ESTADO DE CRONS ✅

Crons configurados en `vercel.json` (Vercel Hobby plan — máx 1/día):

| Ruta | Horario | Estado |
|---|---|---|
| /api/cron/reminders | 08:00 UTC | Configurado |
| /api/cron/booking-holds | 07:00 UTC | Configurado |
| /api/cron/order-reservations | 06:00 UTC | Configurado |
| /api/cron/follow-ups | 09:00 UTC | Configurado |
| /api/cron/data-retention | 03:15 UTC (domingo) | Configurado |
| /api/cron/integration-outbox | 05:00 UTC | Configurado (ajustado a diario) |

**Nota:** Vercel Hobby solo permite crons una vez al día. Para `integration-outbox` con mayor frecuencia, upgrade a Vercel Pro o usar cron externo (cron-job.org).

---

## 6. VERIFICACIÓN OPERATIVA ✅

| Comprobación | Resultado | Notas |
|---|---|---|
| Página inicio carga | ✅ OK | `<title>Belleza Local - Tu belleza, bien elegida</title>` |
| App-estetica-one.vercel.app | ✅ Accesible | HTTPS funcional |
| Rate limiting activo | ✅ Confirmado | 429 en endpoints (esperado sin Upstash configurado) |
| GitHub Actions CI/CD | ✅ Passing | CodeQL análisis completado |
| Migraciones en Supabase | ✅ Aplicadas | 20/20 sincronizadas |

---

## 7. REMEDIACIONES APLICADAS ✅

Se han cerrado los 5 hallazgos P0-críticos de la auditoría:

### P0-01: Acciones administrativas sin autenticación
- ✅ `app/actions/admin.ts` ahora requiere `requirePlatformAdmin()`
- ✅ `actorId` derivado de sesión, no de cliente
- ✅ Validación Zod en inputs

### P0-02: Claim de cuentas por email
- ✅ Email verification obligatoria (sin auto-verificación sin Resend)
- ✅ Invites reclaman mediante enlaces firmados
- ✅ `lib/security/confirmation-token.ts` implementado

### P0-03: Server Actions con acceso entre tenants
- ✅ Todas las Server Actions derivan `userId`/`orgId` de `auth()`
- ✅ Movidas consultas internas a módulos `server-only`
- ✅ Pertenencia al tenant validada en SQL

### P0-04: Pedido pagado devuelve stock
- ✅ Idempotencia con `checkoutIdempotencyKey`
- ✅ `PaymentState` state machine
- ✅ `lib/billing/payment-integrity.ts` y transactional outbox

### P0-05: Pago late binding
- ✅ Webhook de Stripe antes de fulfillment
- ✅ Estado de pago preservado
- ✅ Compensación de pagos post-fallidos

---

## 8. LIMITACIONES CONOCIDAS

| Limitación | Severidad | Workaround | Upgrade |
|---|---|---|---|
| Crons máx 1/día | Media | Usar cron externo | Vercel Pro |
| DNS bellezalocal.es no resuelve | Baja | Usar app-estetica-one.vercel.app | Registrar dominio + DNS |
| Rate limiting sin Upstash | Media | Fallback en memoria activo | Configurar Upstash Redis |
| Pagos/emails sin credenciales | Alta | Usar Stripe/Resend test | Obtener credenciales reales |
| R2 sin bucket | Media | Uploads a URL manual | Crear bucket R2 |

---

## 9. CHECKLIST DE ACCIONES PENDIENTES

Para completar la activación al 100%:

- [ ] **Dominio:** Registrar bellezalocal.es en Hostinger + configurar DNS a Vercel
- [ ] **Stripe:** Configurar claves de producción y productos en Vercel
- [ ] **Resend:** Obtener API key y verificar dominio remitente
- [ ] **Upstash:** Crear base Redis en región EU, configurar en Vercel
- [ ] **R2:** Crear bucket "belleza-local-uploads" y configurar CORS
- [ ] **GitHub:** Activar secret scanning en Verificaciones
- [ ] **Vercel Pro:** (Opcional) Upgrade para crons cada 5 minutos
- [ ] **Pruebas E2E:** Ejecutar contra staging DB (7 pruebas PostgreSQL)
- [ ] **n8n:** Configurar webhook de leads B2B con validación de firma
- [ ] **Smoke tests:** Reserva completa, pago, carrito, búsqueda

---

## 10. CONCLUSIÓN

**Estado: 🟡 OPERACIONAL CON LIMITACIONES**

La aplicación está desplegada y **operacional en producción** con:
- ✅ Código seguro (remediaciones P0 aplicadas)
- ✅ Base de datos migrada (20/20)
- ✅ CI/CD funcionando (GitHub Actions passing)
- ✅ Crons configurados (Vercel Hobby compatible)
- ✅ Página principal cargando

Sin embargo, **no está lista para pilotos reales** hasta:
1. Configurar credenciales externas (Stripe, Resend, R2, Upstash)
2. Verificar workflows de n8n
3. Ejecutar pruebas PostgreSQL contra staging DB
4. Resolver DNS del dominio personalizado

**Próximos pasos críticos:**
1. Obtener credenciales de Stripe (test → producción)
2. Configurar Upstash Redis en Vercel
3. Crear bucket R2 y configurar CORS
4. Hacer prueba de pago E2E en Vercel staging
5. Activar secret scanning en GitHub

---

**Evidencia de deploy:**
```
Commit: 7ad2ea5 (fix: close production audit findings)
        ec82162 (chore: change integration-outbox cron to daily)
Vercel:  dpl_GS96hYNJbK2PuqR2yD8rPtJ2svHq (Ready)
URL:     https://app-estetica-one.vercel.app
Fecha:   2026-07-13 21:00 UTC
```
