# Configuracion pendiente de produccion

Ultima actualizacion: 2026-06-16

Este documento recoge configuraciones externas que no deben quedar hardcodeadas en la app y que hay que revisar antes de dar por listo un despliegue real.

## Estado real por herramienta

| Herramienta | Estado interno en la app | Pendiente externo |
|---|---|---|
| Supabase DB | Prisma y modelos configurados | `DATABASE_URL`, `DIRECT_URL`, migraciones y datos reales |
| Cloudflare R2 | Endpoint interno de firma y upload directo configurado | Bucket, token, dominio CDN y CORS |
| Stripe | Checkout, webhook, suscripciones, bonos, pedidos y senales de reserva conectados | Claves, productos/precios, webhook y portal |
| Resend | Emails transaccionales preparados | API key y dominio remitente verificado |
| Vercel Cron | Ruta y `vercel.json` configurados | `CRON_SECRET` y despliegue activo |
| n8n | Workflows creados para leads, alertas y onboarding | URLs webhook en Vercel, canales de aviso y secreto de crons |

Importante: no se deben guardar secretos en el repositorio. Todo lo externo va en variables de entorno de Vercel y, para desarrollo local, en `.env.local`.

## Recordatorios automaticos de reservas

Estado del codigo:

- Ruta creada: `GET /api/cron/reminders`
- Programacion creada en `vercel.json`: todos los dias a las 08:00 UTC
- Funcion: busca reservas confirmadas del dia siguiente, envia email de recordatorio y marca `reminderSentAt`
- Ruta creada: `GET /api/cron/booking-holds`
- Programacion creada en `vercel.json`: una vez al dia (03:00 UTC). El plan Hobby de Vercel no permite crons mas frecuentes que diarios; si se necesita liberar huecos con mas inmediatez, subir a plan Pro o llamar a esta ruta desde un cron externo (ej. cron-job.org) con el header `Authorization: Bearer <CRON_SECRET>`.
- Funcion: libera reservas pendientes de senal cuando el pago no se completa dentro del plazo
- Ruta creada: `GET /api/cron/follow-ups`
- Programacion creada en `vercel.json`: una vez al dia (09:00 UTC)
- Funcion: envia por email los seguimientos y campanas programados (`FollowUpMessage` de canal `EMAIL` cuya fecha ya vencio), marca `SENT`/`FAILED`, y cancela los de marketing si la clienta revoco el consentimiento despues de programarse. Reutiliza `CRON_SECRET`, `RESEND_API_KEY` y `EMAIL_FROM`.

Configuracion pendiente en Vercel:

| Variable | Obligatoria | Uso |
|---|---:|---|
| `CRON_SECRET` | Si | Protege `/api/cron/reminders`, `/api/cron/booking-holds` y `/api/cron/follow-ups` para que no pueda ejecutarlo cualquiera |
| `RESEND_API_KEY` | Si | Permite enviar emails transaccionales |
| `EMAIL_FROM` | Si | Remitente validado en Resend, por ejemplo `Belleza Local <noreply@bellezalocal.es>` |
| `NEXT_PUBLIC_APP_URL` | Si | URL publica usada en enlaces de emails y confirmaciones |

Comprobacion manual recomendada:

1. Configurar las variables anteriores en Vercel.
2. Crear una reserva confirmada para manana.
3. Ejecutar manualmente `GET /api/cron/reminders` con cabecera `Authorization: Bearer <CRON_SECRET>`.
4. Confirmar que llega el email y que la reserva queda con `reminderSentAt`.
5. Crear una reserva pendiente de senal caducada y ejecutar `GET /api/cron/booking-holds`.
6. Confirmar que la reserva pasa a cancelada por sistema y libera el hueco.

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
- Senales online por servicio: la reserva queda `PENDING`, el cliente paga en Stripe y el webhook la confirma.
- Liberacion automatica de reservas pendientes de senal mediante `GET /api/cron/booking-holds`.

Configuracion pendiente en Stripe:

- Crear productos/precios para Basic, Pro, Growth y Premium.
- Copiar IDs a `STRIPE_PRICE_BASIC_MONTHLY`, `STRIPE_PRICE_PRO_MONTHLY`, `STRIPE_PRICE_GROWTH_MONTHLY`, `STRIPE_PRICE_PREMIUM_MONTHLY`.
- Configurar `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY` y `STRIPE_WEBHOOK_SECRET`.
- Crear webhook apuntando a `https://<dominio>/api/webhooks/stripe`.
- Eventos minimos: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`.
- Probar una reserva con senal real en modo test y verificar que Stripe redirige a `/reserva/confirmada/<codigo>?paid=1`.
- Configurar Billing Portal en Stripe Dashboard.

## n8n

Estado actual:

- Instancia: `https://aldeia-n8n.giuxk6.easypanel.host`.
- Workflow activo: `Belleza Local | Lead B2B - Captura y aviso`.
- Workflow activo: `Belleza Local | Alertas operativas`.
- Workflow activo: `Belleza Local | Onboarding negocio`.
- Workflow creado pero inactivo: `Belleza Local | Monitor crons`.

Webhooks creados:

- Lead B2B: `https://aldeia-n8n.giuxk6.easypanel.host/webhook/belleza-local-lead-b2b`
- Alertas operativas: `https://aldeia-n8n.giuxk6.easypanel.host/webhook/belleza-local-ops-alert`
- Onboarding negocio: `https://aldeia-n8n.giuxk6.easypanel.host/webhook/belleza-local-business-onboarding`

Configuracion en Vercel:

| Variable | Obligatoria | Uso |
|---|---:|---|
| `N8N_WEBHOOK_LEAD_B2B_URL` | No | Avisa a n8n cuando entra un lead B2B. El lead se guarda igualmente en Supabase aunque n8n falle |
| `N8N_WEBHOOK_OPS_ALERT_URL` | No | Preparada para alertas criticas futuras |
| `N8N_WEBHOOK_BUSINESS_ONBOARDING_URL` | No | Preparada para onboarding futuro de negocios aprobados |

Estas variables estan configuradas en Production. Preview puede configurarse por rama cuando se necesite validar un flujo antes de promocionarlo.

Configuracion pendiente dentro de n8n:

- Definir canal de aviso comercial: email, Slack, Telegram, CRM o Google Sheet.
- Activar los nodos de aviso que ahora estan desactivados por seguridad.
- Configurar `BELLEZA_LOCAL_APP_URL` y `BELLEZA_LOCAL_CRON_SECRET` si se quiere activar `Belleza Local | Monitor crons`.
- Rotar la API key usada para crear estos workflows si se ha compartido fuera de un gestor de secretos.

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
