# Checklist — Fase 0 Operativa (2026-07-13)

**Estado actual:** Código ✅ · Migraciones ✅ · Tests ✅ · Build ✅  
**Bloqueante:** Credenciales externas  
**Responsable:** aldeiaceo@gmail.com (obtener credenciales) + Claude Code (configurar + redeploy + smoke tests)

---

## FASE 1: OBTENER CREDENCIALES (aldeiaceo@gmail.com)

### 1.1 Upstash Redis — Rate limiting

**Necesario para:** Health checks, rate limiting en endpoints públicos.  
**Proveedor:** https://console.upstash.com

```
☐ Crear redis base:
  - Región: European (EU-West-1)
  - Obtener: UPSTASH_REDIS_REST_URL
  - Obtener: UPSTASH_REDIS_REST_TOKEN
```

### 1.2 Meta/WhatsApp — Recordatorios transaccionales

**Necesario para:** Enviar recordatorios de reserva vía WhatsApp.  
**Proveedor:** https://www.facebook.com/business/

```
☐ Crear Business Portfolio y WABA
  - Enlazar o crear WhatsApp Business Account

☐ Registrar número de teléfono
  - Usar número dedicado (no personal)
  - Verificar propiedad
  - Esperar aprobación

☐ Crear y aprobar template "belleza_local_booking_reminder"
  - Category: UTILITY
  - Variables (5): nombre, centro, fecha, hora, enlace
  - Esperar aprobación (24-48h)

☐ Obtener credenciales:
  - WHATSAPP_ACCESS_TOKEN (System User Access Tokens)
  - WHATSAPP_PHONE_NUMBER_ID (ID del teléfono registrado)
  - WHATSAPP_APP_SECRET (Settings → Basic → App Secret)
  - WHATSAPP_VERIFY_TOKEN (generar aleatorio: openssl rand -hex 32)
```

### 1.3 Resend — Email transaccional

**Necesario para:** Confirmaciones de reserva, cambios de estado, recuperación de contraseña.  
**Proveedor:** https://resend.com

```
☐ Crear dominio remitente: bellezalocal.es
  - Obtener: RESEND_API_KEY
  - Confirmar: EMAIL_FROM = Belleza Local <noreply@bellezalocal.es>
```

### 1.4 Cloudflare R2 — Image uploads

**Necesario para:** Subir imágenes de centros, productos, avatares.  
**Proveedor:** https://dash.cloudflare.com

```
☐ Crear bucket: belleza-local-uploads
  - Región: wnam o weur
  - Acceso: Private

☐ Crear API token (R2 scope, mínimos permisos: PutObject, GetObject, DeleteObject)
  - Obtener: STORAGE_ENDPOINT
  - Obtener: STORAGE_ACCESS_KEY
  - Obtener: STORAGE_SECRET_KEY
```

### 1.5 Hostinger — DNS (NO bloqueante para Fase 0)

**Necesario para:** Dominio bellezalocal.es resuelva.  
**Proveedor:** Hostinger dashboard

```
☐ Configurar DNS registros en Hostinger:
  - A record: @ → Vercel nameservers
  - CNAME: www → cname.vercel-dns.com.
  - TXT (SPF): @ → v=spf1 include:smtp.resend.com ~all
  - CNAME (DKIM): default._domainkey → default.resend.domains.
  - TXT (DMARC): _dmarc → v=DMARC1; p=quarantine; rua=...
  - CNAME (CDN): cdn → belleza-local-uploads.cdn.r2.sh
```

### 1.6 n8n — Webhook signing secret (LOCAL)

**Necesario para:** Validar webhooks en app-estetica.  
**Generar:** Localmente

```
☐ Generar secret aleatorio:
  openssl rand -hex 32
  
  Obtener: N8N_WEBHOOK_SIGNING_SECRET
```

### 1.7 Cron externo — Integration outbox (cron-job.org)

**Necesario para:** Ejecutar `/api/cron/integration-outbox` cada 5 min.  
**Proveedor:** https://cron-job.org

```
☐ Crear cron job:
  - URL: https://app-estetica-one.vercel.app/api/cron/integration-outbox
  - Header: Authorization: Bearer <CRON_SECRET>
  - Frecuencia: Cada 5 minutos
  - Timeout: 30s
```

---

## FASE 2: CONFIGURAR VERCEL (Claude Code)

Una vez que aldeiaceo@gmail.com proporcione todas las credenciales:

```bash
# Opción A: CLI interactivo (recomendado)
vercel env add UPSTASH_REDIS_REST_URL production
vercel env add UPSTASH_REDIS_REST_TOKEN production
vercel env add WHATSAPP_ACCESS_TOKEN production
vercel env add WHATSAPP_PHONE_NUMBER_ID production
vercel env add WHATSAPP_APP_SECRET production
vercel env add WHATSAPP_VERIFY_TOKEN production
vercel env add WHATSAPP_REMINDER_TEMPLATE production
vercel env add WHATSAPP_TEMPLATE_LANGUAGE production
vercel env add RESEND_API_KEY production
vercel env add EMAIL_FROM production
vercel env add STORAGE_ENDPOINT production
vercel env add STORAGE_ACCESS_KEY production
vercel env add STORAGE_SECRET_KEY production
vercel env add N8N_WEBHOOK_SIGNING_SECRET production
```

**Variables opcionales (defaults correctos):**
- WHATSAPP_REMINDER_TEMPLATE = `belleza_local_booking_reminder`
- WHATSAPP_TEMPLATE_LANGUAGE = `es`
- WHATSAPP_API_VERSION = `v21.0`
- STORAGE_BUCKET = `belleza-local-uploads`

---

## FASE 3: RE-DEPLOY & VERIFICACIÓN (Claude Code)

```bash
# Redeploy con nuevas variables
vercel --prod --yes

# Esperar a que termine el deployment (2-3 min)

# Verificar health checks
curl https://app-estetica-one.vercel.app/api/health/live
curl https://app-estetica-one.vercel.app/api/health/ready
# Deben devolver 200, no 429
```

---

## FASE 4: SMOKE TESTS (Claude Code + aldeiaceo@gmail.com)

**Criterio de paso:** Todos los tests pasan sin errores.

### Test 1: Registro y negocio
```
☐ POST /auth/signup → registrar negocio con email test
☐ Verificar email recibido (Resend)
☐ Crear centro "Centro Prueba" en dashboard
☐ Listar centros en /dashboard
```

### Test 2: Productos
```
☐ Crear producto "Tratamiento facial"
☐ Subir imagen → verificar en R2/CDN
☐ Publicar producto
☐ Ver en /productos
```

### Test 3: Carrito y pedido
```
☐ /buscar → buscar productos
☐ Añadir al carrito
☐ Checkout → crear pedido (sin pago online)
☐ Verificar email de confirmación
```

### Test 4: Reserva
```
☐ /buscar → encontrar centro
☐ Hacer reserva de cita
☐ Verificar email de confirmación
☐ Dashboard: reserva confirmada
```

### Test 5: Rate limiting (con Upstash)
```
☐ /api/health/ready → 200 OK
☐ Hacer 100 requests rápidos → alguno devuelve 429
☐ Esperar 1 min → requests vuelven a 200
```

### Test 6: WhatsApp transaccional (CRÍTICO Fase 0)
```
☐ Crear reserva con teléfono válido
☐ Cron: GET /api/cron/reminders (o esperar 08:00 UTC)
☐ Verificar WhatsAppDelivery en Supabase:
  - providerMessageId poblado
  - status = SENT (o DELIVERED si ya procesó Meta)
☐ Verificar en WhatsApp real que mensaje fue entregado
☐ Responder "BAJA" → verificar opt-out
```

### Test 7: Imágenes en R2
```
☐ Subir imagen de centro
☐ Subir imagen de producto
☐ Verificar URLs en CDN (https://cdn.bellezalocal.es/...)
☐ Imagen se carga correctamente
```

### Test 8: Outbox (integration-outbox)
```
☐ Crear evento manual en IntegrationOutbox (Supabase)
☐ GET /api/cron/integration-outbox (con CRON_SECRET)
☐ Verificar: evento pasó a DELIVERED
☐ Verificar: n8n recibió y procesó
```

---

## FASE 5: VERIFICAR ESTADO FINAL

```
☐ /api/health/live → 200
☐ /api/health/ready → 200
☐ npm run build → sin errores
☐ npm run lint → sin errores
☐ Tests: npm test → 98 pass
☐ Git: sin cambios pending
☐ Deployment Vercel: Ready ✅
```

---

## RESUMEN DE TIEMPOS

| Tarea | Responsable | Tiempo |
|-------|-------------|--------|
| Obtener credenciales | aldeiaceo@gmail.com | 4-8h (incluye espera template Meta) |
| Configurar Vercel | Claude Code | 5 min |
| Re-deploy | Vercel (automático) | 2-3 min |
| Smoke tests | aldeiaceo@gmail.com + Claude Code | 30-45 min |
| **Total** | — | **~5h** |

---

## NOTAS IMPORTANTES

1. **WhatsApp template:** Esperar aprobación de Meta (24-48h). Mientras, el código está listo pero los mensajes fallarán con error "template not approved".

2. **DNS (bellezalocal.es):** NO es bloqueante. Fase 0 puede funcionar con `app-estetica-one.vercel.app`. DNS se configura cuando dominio esté listo.

3. **Cron externo:** Sin esto, `/api/cron/integration-outbox` solo corre 1/día (límite Vercel Hobby). Necesita cada 5 min para entregar eventos a n8n a tiempo.

4. **Meta Business Portfolio:** Asegúrate de que WABA está verificada y el número está aprobado antes de intentar crear templates.

---

**Fecha de este checklist:** 2026-07-13 21:50 UTC  
**Creador:** Claude Code  
**Siguiente acción:** aldeiaceo@gmail.com obtiene credenciales → Claude Code configura Vercel → Smoke tests
