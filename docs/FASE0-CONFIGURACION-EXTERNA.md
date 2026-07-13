# Configuración Externa - Fase 0

**Objetivo:** Configuración de servicios externos sin Stripe/pagos online.  
**Estado:** En progreso (2026-07-13)

---

## 1. VERCEL PRODUCTION ✅

### Variables configuradas:
- `DATABASE_URL` — Supabase pooled (6543) ✅
- `DIRECT_URL` — Supabase direct (5432) ✅
- `AUTH_SECRET` — Auth.js ✅
- `AUTH_URL` — https://bellezalocal.es ✅
- `NEXT_PUBLIC_APP_URL` — https://bellezalocal.es ✅
- `NEXT_PUBLIC_APP_NAME` — Belleza Local ✅
- `NEXT_PUBLIC_CDN_URL` — https://cdn.bellezalocal.es ✅
- `CRON_SECRET` — Protección de crons ✅
- `N8N_WEBHOOK_LEAD_B2B_URL` — Webhook leads ✅
- `N8N_WEBHOOK_OPS_ALERT_URL` — Alertas operativas ✅
- `N8N_WEBHOOK_BUSINESS_ONBOARDING_URL` — Onboarding ✅

### Health check:
- `/api/health/live` — Status: 429 (rate limiting sin Upstash) ⚠️
- `/api/health/ready` — Status: 429 (rate limiting sin Upstash) ⚠️

**Acción pendiente:** Configurar Upstash Redis (ver sección 2)

---

## 2. UPSTASH REDIS — 🔴 PENDIENTE CONFIGURACIÓN MANUAL

**Por qué:** Rate limiting distribuido, crons coordinados, failover en picos.

### Pasos para el propietario:

1. **Crear base Redis:**
   - URL: https://console.upstash.com
   - Región: **European (EU-West-1)** (mínima latencia a Supabase)
   - Type: Redis
   - Eviction Policy: `allkeys-lru` (para rate limiting)

2. **Obtener credenciales:**
   - UPSTASH_REDIS_REST_URL — `https://<endpoint>.upstash.io`
   - UPSTASH_REDIS_REST_TOKEN — `<token>`

3. **Configurar en Vercel:**
   ```bash
   vercel env add UPSTASH_REDIS_REST_URL production
   # Pegar: https://<endpoint>.upstash.io
   
   vercel env add UPSTASH_REDIS_REST_TOKEN production
   # Pegar: <token>
   ```

4. **Verificar:**
   ```bash
   vercel --prod
   curl https://app-estetica-one.vercel.app/api/health/ready
   # Debe devolver 200 (no 429)
   ```

**Costo:** ~$2-5/mes para tráfico de Fase 0.

---

## 3. RESEND — 📧 CONFIGURACIÓN INICIADA

### Dominio remitente:
- `bellezalocal.es`
- Requiere: SPF, DKIM, DMARC en DNS

### Registros DNS a configurar en Hostinger:

**SPF (TXT):**
```
v=spf1 include:smtp.resend.com ~all
```

**DKIM (CNAME):**
```
Nombre: default._domainkey
Valor: default.resend.domains.
```

**DMARC (TXT):**
```
v=DMARC1; p=quarantine; rua=mailto:dmarc@bellezalocal.es
```

### Variables en Vercel:
- `RESEND_API_KEY` — API key de producción
- `EMAIL_FROM` — `Belleza Local <noreply@bellezalocal.es>`

### Pruebas requeridas:
- [ ] Confirmación de reserva
- [ ] Recordatorio de reserva (cron)
- [ ] Confirmación de pedido
- [ ] Cambio de estado de pedido
- [ ] Recuperación de contraseña

**Status:** Pendiente API key de producción + DNS

---

## 4. CLOUDFLARE R2 — 🪣 PENDIENTE CONFIGURACIÓN

### Bucket:
- Nombre: `belleza-local-uploads`
- Región: `wnam` (Western North America) o `weur` (Western Europe)
- Acceso: Private

### Credenciales (mínimos permisos):

**Política IAM:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::belleza-local-uploads/*"
    }
  ]
}
```

### Variables en Vercel:
- `STORAGE_ENDPOINT` — `https://<account-id>.r2.cloudflarestorage.com`
- `STORAGE_ACCESS_KEY` — Access key ID
- `STORAGE_SECRET_KEY` — Secret access key
- `STORAGE_BUCKET` — `belleza-local-uploads`
- `NEXT_PUBLIC_CDN_URL` — `https://cdn.bellezalocal.es` ✅ (ya configurado)

### CORS (si el bucket es público):
```json
[
  {
    "AllowedOrigins": ["https://bellezalocal.es", "https://www.bellezalocal.es"],
    "AllowedMethods": ["GET", "PUT", "DELETE"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3600
  }
]
```

### Custom domain:
- Dominio: `cdn.bellezalocal.es`
- CNAME: `<bucket-name>.cdn.r2.sh`

### Pruebas requeridas:
- [ ] Subir imagen de centro
- [ ] Subir imagen de producto
- [ ] Subir avatar de profesional
- [ ] Leer desde CDN
- [ ] Eliminar imagen

**Status:** Pendiente bucket + credenciales

---

## 5. CRONS Y OUTBOX

### Configuración actual (Vercel Hobby):
| Ruta | Horario | Frecuencia |
|------|---------|-----------|
| `/api/cron/reminders` | 08:00 UTC | 1/día |
| `/api/cron/booking-holds` | 07:00 UTC | 1/día |
| `/api/cron/order-reservations` | 06:00 UTC | 1/día |
| `/api/cron/follow-ups` | 09:00 UTC | 1/día |
| `/api/cron/data-retention` | 03:15 UTC (dom) | 1/semana |
| `/api/cron/integration-outbox` | 05:00 UTC | 1/día ⚠️ |

### Problema con `integration-outbox`:
- Fase 0 necesita entregar eventos a n8n con **máx 5 min de latencia**
- Vercel Hobby solo permite 1/día
- **Solución:** Cron externo (cron-job.org o servidor propio)

### Cron externo (obligatorio para Fase 0):

**Proveedor:** cron-job.org (gratuito, confiable)

1. URL: `https://app-estetica-one.vercel.app/api/cron/integration-outbox`
2. Header: `Authorization: Bearer <CRON_SECRET>`
3. Frecuencia: Cada 5 minutos
4. Timeout: 30s

**Status:** Configurado en Vercel, necesita cron externo para alta frecuencia

---

## 6. N8N — WEBHOOKS Y WORKFLOWS

### Workflows requeridos:

#### 1. **Lead B2B** (existing)
- Trigger: POST `/webhooks/lead-b2b-created`
- Validación: HMAC-SHA256 con `N8N_WEBHOOK_SIGNING_SECRET`
- Acciones: Email, Slack, CRM

#### 2. **Alertas operativas** (existing)
- Trigger: POST `/webhooks/ops-alert`
- Ejemplos: stock bajo, cita cancelada por sistema, pago fallido
- Acciones: Slack, email admin

#### 3. **Onboarding** (existing)
- Trigger: POST `/webhooks/onboarding-business-created`
- Acciones: Bienvenida, tutorial, plan default

#### 4. **Integration Outbox** (NEW — crítico Fase 0)
- Trigger: GET `/api/cron/integration-outbox`
- Procesa: IntegrationOutbox table (PENDING → DELIVERED)
- Reintenta: Hasta 3 veces con backoff
- Firma: HMAC-SHA256 con timestamp

### Variables en Vercel (ya configuradas):
- `N8N_WEBHOOK_LEAD_B2B_URL` ✅
- `N8N_WEBHOOK_OPS_ALERT_URL` ✅
- `N8N_WEBHOOK_BUSINESS_ONBOARDING_URL` ✅
- `N8N_WEBHOOK_SIGNING_SECRET` — 🔴 PENDIENTE

### Verificaciones:
- [ ] Recibir evento de lead B2B
- [ ] Validar firma HMAC
- [ ] Rechazar firma inválida (401)
- [ ] Rechazar timestamp antiguo (401)
- [ ] Procesar una sola vez (idempotencia)
- [ ] Reintentar con exponential backoff

**Status:** Workflows existen, necesita `N8N_WEBHOOK_SIGNING_SECRET` en Vercel

---

## 7. DNS — HOSTINGER 🌐

### Registros pendientes:

**Para bellezalocal.es y www.bellezalocal.es:**

| Tipo | Nombre | Valor |
|------|--------|-------|
| A | @ | Vercel nameservers |
| CNAME | www | cname.vercel-dns.com. |
| TXT (SPF) | @ | v=spf1 include:smtp.resend.com ~all |
| CNAME (DKIM) | default._domainkey | default.resend.domains. |
| TXT (DMARC) | _dmarc | v=DMARC1; p=quarantine; rua=... |
| CNAME | cdn | belleza-local-uploads.cdn.r2.sh |

**Estado actual:**
- bellezalocal.es: No resuelve (dominio no registrado o DNS no configurado)
- Usar: app-estetica-one.vercel.app como fallback

**Status:** 🔴 PENDIENTE acceso Hostinger

---

## SMOKE TESTS — FASE 0

### Antes de empezar:
- [ ] Upstash Redis configurado
- [ ] Resend API key confirmada
- [ ] R2 bucket creado
- [ ] N8N webhook signing secret configurado
- [ ] Cron externo (cron-job.org) configurado para integration-outbox

### Test 1: Registro y negocio
```
1. POST /auth/signup → registrar negocio
2. Verificar email recibido
3. Crear centro "Centro Prueba"
4. Listar centros en /dashboard
```

### Test 2: Productos
```
1. Crear producto: "Tratamiento facial"
2. Crear categoría: "Faciales"
3. Subir imagen → verificar en R2
4. Publicar producto
5. Verificar en marketplace público
```

### Test 3: Carro y pedido
```
1. Ir a /buscar → buscar "Faciales"
2. Ver centro, añadir producto al carrito
3. Checkout → crear pedido (sin pago online)
4. Verificar email de confirmación
5. Dashboard: ver pedido en "Pendientes"
```

### Test 4: Reserva
```
1. Buscar centro en /buscar
2. Ver disponibilidad
3. Hacer reserva de cita
4. Verificar confirmación por email
5. Dashboard: ver reserva confirmada
```

### Test 5: Cambio de estado
```
1. Dashboard → cambiar pedido a "Confirmado"
2. Verificar email de cambio de estado
3. Cambiar reserva a "Completada"
4. Cron de data retention: ver que procesa sin error
```

### Test 6: Rate limiting
```
1. /api/health/ready → debe devolver 200
2. Hacer 100 requests rápidos → alguno devuelve 429
3. Esperar → requests vuelven a ser 200
```

### Test 7: Imágenes
```
1. Subir imagen de centro
2. Subir imagen de producto
3. Subir avatar de profesional
4. Verificar que se resuelven desde CDN
5. Eliminar imagen → verificar que no está en R2
```

### Test 8: Outbox
```
1. Crear evento en IntegrationOutbox (manual en Supabase)
2. Ejecutar cron manual: curl -H "Authorization: Bearer <CRON_SECRET>" https://app-estetica-one.vercel.app/api/cron/integration-outbox
3. Verificar: evento pasa a DELIVERED
4. Verificar: n8n recibió el evento y validó firma
```

---

## RESUMEN DE PENDIENTES

| Servicio | Estado | Bloqueante |
|----------|--------|-----------|
| Vercel Production | ✅ Configurado | — |
| **Upstash Redis** | 🔴 Manual | SÍ (health checks) |
| **Resend** | 🔴 Manual | SÍ (emails) |
| **R2** | 🔴 Manual | SÍ (uploads) |
| **DNS** | 🔴 Manual | NO (fallback app-estetica-one.vercel.app) |
| **n8n** | ⚠️ Webhook secret | SÍ (outbox) |
| **Cron externo** | 🔴 Manual | SÍ (integration-outbox <5min) |
| **Feature flags** | ✅ Configuradas | — |

---

## PRÓXIMOS PASOS

1. **Obtener credenciales:**
   - Upstash Redis account
   - Resend API key
   - Cloudflare R2 credentials
   - Hostinger acceso (DNS)

2. **Configurar en Vercel:**
   - UPSTASH_REDIS_REST_URL
   - UPSTASH_REDIS_REST_TOKEN
   - RESEND_API_KEY
   - EMAIL_FROM
   - STORAGE_* variables
   - N8N_WEBHOOK_SIGNING_SECRET

3. **Re-deploy Vercel** con nuevas variables

4. **Ejecutar smoke tests** en orden

5. **Documento final:** Actualizar este documento con evidencias

---

**Última actualización:** 2026-07-13 21:30 UTC  
**Responsable:** Claude Code  
**Fase:** 0 (MVP sin Stripe)
