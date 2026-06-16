# Infraestructura — Belleza Local

## Stack de servicios

| Servicio | Proveedor | Para qué |
|---------|----------|---------|
| Deploy (Next.js) | Vercel | Hosting, CDN, preview deployments, Edge Network |
| Base de datos | Supabase | PostgreSQL managed + connection pooling |
| Imágenes/uploads | Cloudflare R2 | Storage S3-compatible, bajo coste, CDN global |
| Email transaccional | Resend | Confirmaciones, recordatorios, notificaciones |
| Pagos / suscripciones | Stripe | Suscripciones SaaS, bonos, depósitos |
| SMS (add-on) | Twilio | Recordatorios SMS (add-on por consumo) |
| WhatsApp (add-on) | Meta Cloud API | WhatsApp Business API (add-on Growth+) |
| Analytics | PostHog (EU) | Product analytics, funneles, heatmaps |
| Errores | Sentry | Monitoreo de errores en producción |
| Código fuente | GitHub | Repositorio, CI/CD, code review |

## Configuración Supabase + Prisma

### Por qué dos URLs

Supabase usa **PgBouncer** como connection pooler (puerto 6543). PgBouncer mejora el rendimiento con muchas conexiones concurrentes pero **no soporta prepared statements** que usa Prisma por defecto en modo pooled.

Solución: usar la URL pooled para queries en runtime y la URL directa solo para migraciones.

```
DATABASE_URL   → Puerto 6543, ?pgbouncer=true&connection_limit=1  (queries)
DIRECT_URL     → Puerto 5432, sin pgbouncer                        (migraciones)
```

### schema.prisma

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")   // pooled — para queries
  directUrl = env("DIRECT_URL")     // direct — para migraciones
}
```

### Cómo obtener las URLs en Supabase

1. Ir a **Supabase Dashboard → Settings → Database**
2. Sección "Connection string" → seleccionar **"Transaction pooler"** → copiar como `DATABASE_URL`
   - Añadir `?pgbouncer=true&connection_limit=1` al final
3. Sección "Connection string" → seleccionar **"Direct connection"** → copiar como `DIRECT_URL`

Ejemplo de formato:
```
# DATABASE_URL (pooled, puerto 6543)
postgresql://postgres.abcdefgh:[password]@aws-0-eu-west-3.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1

# DIRECT_URL (direct, puerto 5432)
postgresql://postgres.abcdefgh:[password]@aws-0-eu-west-3.pooler.supabase.com:5432/postgres
```

### Región recomendada

**eu-west-3 (París)** para cumplir con GDPR (datos en la UE) y latencia mínima para España.

## Configuración Vercel

### Deploy automático

Al conectar el repo de GitHub a Vercel, cada push a `main` desplegará automáticamente.
Cada PR generará un **preview deployment** con URL única para review.

### Variables de entorno en Vercel

Ir a **Vercel Dashboard → Project → Settings → Environment Variables** y añadir:

**Producción** (marcar solo "Production"):
- `DATABASE_URL` → URL pooled de Supabase producción
- `DIRECT_URL` → URL directa de Supabase producción
- `AUTH_SECRET` → valor generado con `openssl rand -base64 32`
- `AUTH_URL` → `https://tu-dominio.es`
- Todas las demás variables del `.env.example`

**Preview** (marcar "Preview"):
- Usar las mismas URLs de Supabase o crear un proyecto Supabase separado para staging
- `AUTH_URL` → dejar vacío o usar la URL de preview de Vercel

### Dominio personalizado

Vercel Dashboard → Project → Settings → Domains → Add `bellezalocal.es`
Apuntar DNS a los nameservers de Vercel (o añadir registros A/CNAME según Vercel indique).

### Cron jobs

En `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/reminders",
      "schedule": "0 8 * * *"
    },
    {
      "path": "/api/cron/booking-holds",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

`/api/cron/reminders` envia recordatorios de reservas. `/api/cron/booking-holds` libera reservas pendientes de senal caducadas. Requiere `CRON_SECRET`; en planes con limites de cron hay que ajustar la frecuencia si Vercel no permite intervalos de 15 minutos.

## Cloudflare R2 para imágenes

### Por qué R2 y no Supabase Storage

- R2 es compatible con S3 API → migración futura sencilla
- Sin coste de egress (salida de datos) dentro de Cloudflare
- CDN global integrado
- Supabase Storage tiene menor madurez y pricing menos predecible

### Setup

1. Cloudflare Dashboard → R2 → Create bucket → nombre: `belleza-local-uploads`
2. Settings → R2 → API tokens → Create API token (R2 Admin Read/Write)
3. Configurar dominio personalizado para el bucket: `cdn.bellezalocal.es`

### Variables a configurar

```env
STORAGE_ENDPOINT="https://[account-id].r2.cloudflarestorage.com"
STORAGE_ACCESS_KEY="[api-key-id]"
STORAGE_SECRET_KEY="[api-key-secret]"
STORAGE_BUCKET="belleza-local-uploads"
NEXT_PUBLIC_CDN_URL="https://cdn.bellezalocal.es"
```

## Checklist de puesta en marcha

### Paso 1 — Supabase
- [ ] Crear proyecto en Supabase (región: eu-west-3)
- [ ] Copiar `DATABASE_URL` (pooled) y `DIRECT_URL` (direct)
- [ ] Ejecutar: `npx prisma migrate deploy` (producción) o `npx prisma migrate dev --name init` (dev)

### Paso 2 — Vercel
- [ ] Crear proyecto en Vercel → conectar repo GitHub `aldeiaagency/app-estetica`
- [ ] Añadir todas las variables de entorno
- [ ] Confirmar que el build pasa: `npm run build`
- [ ] Añadir dominio personalizado

### Paso 3 — Stripe
- [ ] Crear cuenta en Stripe (modo test primero)
- [ ] Crear productos: Basic, Pro, Growth, Premium
- [ ] Crear precios mensuales para cada producto
- [ ] Copiar los IDs de precio a las variables `STRIPE_PRICE_*`
- [ ] Configurar webhook de Stripe apuntando a `https://tu-dominio.es/api/webhooks/stripe`
- [ ] Copiar `STRIPE_WEBHOOK_SECRET`

### Paso 4 — Resend
- [ ] Crear cuenta en Resend
- [ ] Verificar dominio de envío (`bellezalocal.es`)
- [ ] Crear API key
- [ ] Test: enviar email de prueba

### Paso 5 — Cloudflare R2
- [ ] Crear bucket `belleza-local-uploads`
- [ ] Crear API token con permisos de lectura/escritura
- [ ] Configurar dominio CDN
- [ ] Test: subir imagen de prueba

### Paso 6 — Verificación final
- [ ] `npm run dev` funciona localmente
- [ ] Auth: registro + login funcionan
- [ ] DB: `npx prisma studio` muestra las tablas
- [ ] Deploy: `https://tu-dominio.es` carga correctamente

## Costes estimados en producción (escenario 100 centros)

| Servicio | Plan | Coste aprox/mes |
|---------|-----|----------------|
| Vercel | Pro | $20 |
| Supabase | Pro | $25 |
| Cloudflare R2 | Pay-as-you-go | ~$1-5 |
| Resend | Pro | $20 (50K emails) |
| Stripe | — | 1.4% + 0.25€/transacción |
| Sentry | Developer | Gratis |
| PostHog | Cloud EU | Gratis (hasta 1M eventos) |
| **Total fijo** | | **~$70-90/mes** |

Con 100 centros en Basic (24€/mes) = 2.400€/mes → margen operativo holgado.
