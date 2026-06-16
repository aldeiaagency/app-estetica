# Configuracion pendiente de produccion

Ultima actualizacion: 2026-06-16

Este documento recoge configuraciones externas que no deben quedar hardcodeadas en la app y que hay que revisar antes de dar por listo un despliegue real.

## Estado real por herramienta

| Herramienta | Estado interno en la app | Pendiente externo |
|---|---|---|
| Supabase DB | Prisma y modelos configurados | `DATABASE_URL`, `DIRECT_URL`, migraciones y datos reales |
| Cloudflare R2 | Endpoint interno de firma y upload directo configurado | Bucket, token, dominio CDN y CORS |
| Stripe | Checkout, webhook, suscripciones, bonos y pedidos conectados | Claves, productos/precios, webhook y portal |
| Resend | Emails transaccionales preparados | API key y dominio remitente verificado |
| Vercel Cron | Ruta y `vercel.json` configurados | `CRON_SECRET` y despliegue activo |

Importante: no se deben guardar secretos en el repositorio. Todo lo externo va en variables de entorno de Vercel y, para desarrollo local, en `.env.local`.

## Recordatorios automaticos de reservas

Estado del codigo:

- Ruta creada: `GET /api/cron/reminders`
- Programacion creada en `vercel.json`: todos los dias a las 08:00 UTC
- Funcion: busca reservas confirmadas del dia siguiente, envia email de recordatorio y marca `reminderSentAt`

Configuracion pendiente en Vercel:

| Variable | Obligatoria | Uso |
|---|---:|---|
| `CRON_SECRET` | Si | Protege `/api/cron/reminders` para que no pueda ejecutarlo cualquiera |
| `RESEND_API_KEY` | Si | Permite enviar emails transaccionales |
| `EMAIL_FROM` | Si | Remitente validado en Resend, por ejemplo `Belleza Local <noreply@bellezalocal.es>` |
| `NEXT_PUBLIC_APP_URL` | Si | URL publica usada en enlaces de emails y confirmaciones |

Comprobacion manual recomendada:

1. Configurar las variables anteriores en Vercel.
2. Crear una reserva confirmada para manana.
3. Ejecutar manualmente `GET /api/cron/reminders` con cabecera `Authorization: Bearer <CRON_SECRET>`.
4. Confirmar que llega el email y que la reserva queda con `reminderSentAt`.

## Lista de espera

Estado del codigo:

- El cliente puede apuntarse a lista de espera cuando no hay huecos disponibles.
- El dashboard tiene vista `Lista de espera` dentro de Reservas.
- El negocio puede avisar, marcar como reservada o cerrar una solicitud.
- Al cancelar una cita se intenta avisar automaticamente a las primeras solicitudes compatibles.

Configuracion pendiente:

- Confirmar que `RESEND_API_KEY`, `EMAIL_FROM` y `NEXT_PUBLIC_APP_URL` estan configuradas.
- Revisar copy y branding de los emails cuando se cierre el branding definitivo.
- Decidir si el aviso debe enviarse solo por email o tambien por WhatsApp/SMS en planes superiores.

## Entregabilidad antes de merge a produccion

- Revisar variables de entorno en Vercel.
- Probar flujo completo: reserva, cancelacion, lista de espera, aviso y recordatorio.
- Verificar dominio remitente en Resend.
- Confirmar que el cron aparece activo en Vercel despues del despliegue.

## Imagenes y galeria

Estado del codigo:

- El dashboard permite subir portada y galeria del centro a storage compatible S3/R2.
- El dashboard permite subir foto de profesionales.
- El dashboard permite subir imagen de producto.
- Tambien se mantiene input URL para casos manuales o migraciones.
- El perfil publico, marketplace y flujo de reserva usan esas imagenes cuando existen.
- Ruta interna creada: `POST /api/upload/sign`.
- Seguridad: requiere usuario autenticado con `organizationId`.
- Limites: solo JPG, PNG, WebP o AVIF; maximo 5 MB por imagen.

Configuracion pendiente:

- Crear bucket en Cloudflare R2: `belleza-local-uploads`.
- Configurar variables: `STORAGE_ENDPOINT`, `STORAGE_ACCESS_KEY`, `STORAGE_SECRET_KEY`, `STORAGE_BUCKET`, `NEXT_PUBLIC_CDN_URL`.
- Configurar dominio publico del bucket, por ejemplo `https://cdn.bellezalocal.es`.
- Configurar CORS del bucket para permitir `PUT` desde el dominio de la app.
- Anadir compresion/conversion a WebP como mejora posterior si se quiere optimizar costes.

CORS recomendado para R2:

```json
[
  {
    "AllowedOrigins": ["https://bellezalocal.es", "https://www.bellezalocal.es", "http://localhost:3000"],
    "AllowedMethods": ["GET", "PUT", "HEAD"],
    "AllowedHeaders": ["content-type"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

## Stripe

Estado del codigo:

- Suscripciones de planes con Stripe Checkout.
- Billing Portal para clientes con suscripcion.
- Webhook `POST /api/webhooks/stripe`.
- Compra online de productos y bonos con Stripe Checkout si `STRIPE_SECRET_KEY` esta configurada.
- Degradacion elegante a pago en centro si Stripe no esta configurado.

Configuracion pendiente en Stripe:

- Crear productos/precios para Basic, Pro, Growth y Premium.
- Copiar IDs a `STRIPE_PRICE_BASIC_MONTHLY`, `STRIPE_PRICE_PRO_MONTHLY`, `STRIPE_PRICE_GROWTH_MONTHLY`, `STRIPE_PRICE_PREMIUM_MONTHLY`.
- Configurar `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY` y `STRIPE_WEBHOOK_SECRET`.
- Crear webhook apuntando a `https://<dominio>/api/webhooks/stripe`.
- Eventos minimos: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`.
- Configurar Billing Portal en Stripe Dashboard.

## Supabase

Estado del codigo:

- Prisma usa `DATABASE_URL` para runtime.
- Prisma schema incluye `directUrl = env("DIRECT_URL")` para migraciones.
- Multi-tenant por `organizationId` en dashboard y acciones principales.

Configuracion pendiente:

- Configurar `DATABASE_URL` con pooler de Supabase.
- Configurar `DIRECT_URL` para migraciones.
- Ejecutar migraciones antes de produccion.
- Confirmar backups y region del proyecto.
