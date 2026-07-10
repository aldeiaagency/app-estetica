# Production readiness — App Estética

Fecha de revisión: 2026-07-10  
Rama de hardening: `fix/security-transaction-hardening-v2`

## Estado ejecutivo

La aplicación ha recibido un primer hardening de seguridad, pagos, inventario, uploads y calidad de entrega. No debe considerarse lista para producción comercial hasta completar los bloqueadores P0 descritos abajo y superar el pipeline CI con una base de datos PostgreSQL limpia.

## Cambios completados en esta rama

### 1. Autenticación y autorización base

- Normalización del email de acceso (`trim` + minúsculas).
- Google OAuth solo se registra cuando existen ambas credenciales.
- Claims de rol y organización se refrescan desde PostgreSQL en cada evaluación del JWT.
- Nuevo helper `lib/auth/authorization.ts` para que las acciones de servidor deriven la organización desde la sesión y no confíen en IDs enviados por el cliente.

### 2. Concurrencia de reservas

- Nueva migración PostgreSQL con `btree_gist` y restricción de exclusión.
- La base de datos impide dos reservas activas solapadas para el mismo profesional.
- La restricción cubre estados `PENDING` y `CONFIRMED` y utiliza rango semiabierto `[inicio, fin)`.

### 3. Inventario y pedidos

- La comprobación y decremento de stock se realiza con una actualización condicional atómica.
- Dos carritos concurrentes no pueden consumir la última unidad.
- Si Stripe está configurado y falla la creación de Checkout, el pedido se cancela y el stock se repone.
- Se elimina la degradación silenciosa a “pago en centro” tras un fallo técnico de Stripe.
- Email de cliente normalizado antes de persistir.

### 4. Stripe

- El webhook devuelve `503` si falta `STRIPE_WEBHOOK_SECRET`.
- Los precios de suscripción desconocidos fallan de forma cerrada; ya no se asigna PRO por defecto.
- Se gestionan creación, actualización, eliminación, pausa y reanudación de suscripciones.
- Estados sin derecho (`past_due`, `unpaid`, `canceled`, etc.) degradan el plan a BASIC.
- Los pagos únicos solo se cumplen cuando `payment_status === paid`.
- Se añade soporte para `checkout.session.async_payment_succeeded` y `async_payment_failed`.

### 5. Uploads R2

- El `Content-Type` validado queda incluido en la firma SigV4.
- La URL firmada caduca como máximo en 300 segundos.
- La respuesta devuelve los headers obligatorios para la subida.

### 6. CI

Nuevo workflow `.github/workflows/ci.yml` con:

1. PostgreSQL 16 efímero.
2. `npm ci`.
3. `prisma generate`.
4. `prisma migrate deploy`.
5. lint.
6. type-check.
7. tests.
8. build de producción.

## Bloqueadores P0 pendientes

### P0-1 — Encapsular autorización en todas las Server Actions

**Problema**  
Varias acciones de `app/actions/dashboard.ts` reciben `orgId` como argumento y lo utilizan como frontera de autorización. Aunque algunas llamadas actuales lo capturan desde una Server Action inline, el contrato de la función sigue siendo inseguro y reutilizable de forma incorrecta.

**Implementación requerida**

- Importar `requireAdminOrganization` o `assertOrganization` desde `lib/auth/authorization.ts`.
- Eliminar `orgId` de las firmas públicas de mutación.
- Resolver `organizationId` exclusivamente desde la sesión.
- Aplicar el patrón a pedidos, reservas, servicios, profesionales, horarios, bonos, productos, clientes y lista de espera.
- Mantener `SUPER_ADMIN` como única excepción explícita y auditada.

**Criterios de aceptación**

- Ninguna mutación B2B acepta `orgId` desde cliente o formulario.
- Test negativo: un usuario de organización A no puede leer ni mutar recursos de B.
- Test positivo: BUSINESS_ADMIN puede gestionar únicamente su organización.
- Las acciones devuelven un error genérico sin filtrar existencia de recursos ajenos.

### P0-2 — Validación canónica de disponibilidad al crear o reprogramar

**Problema**  
El wizard consulta slots calculados por `lib/availability/engine.ts`, pero `createBookingAction` y `rescheduleBookingAction` aceptan `startAt` y `endAt` enviados por cliente. La restricción PostgreSQL evita solapamientos, pero no impide reservas fuera de horario, con duración manipulada, profesional no vinculado al servicio, excepciones cerradas o bloqueos manuales.

**Implementación requerida**

- Crear un servicio único `validateAndResolveBookingSlot`.
- Entrada permitida: `centerId`, `serviceId`, `staffId`, `startAt`.
- El servidor debe obtener duración y buffers desde `Service` y calcular `endAt`.
- Validar vínculo `ServiceStaff`, centro publicado, servicio/profesional activos, horario, excepción, bloqueos manuales, ventana máxima de reserva y antelación mínima.
- Reutilizar exactamente la misma función en disponibilidad, alta y reprogramación.
- Traducir el error PostgreSQL `23P01` de la exclusión a `SLOT_TAKEN`.

**Criterios de aceptación**

- El cliente deja de enviar `endAt`.
- Un horario inventado o alterado es rechazado.
- Un profesional no asignado al servicio es rechazado.
- Una reserva en día cerrado o bloque manual es rechazada.
- Test de concurrencia: dos solicitudes simultáneas al mismo slot producen una sola reserva.

### P0-3 — Liberación de stock en Checkout abandonado

**Problema**  
El stock se reserva al crear el pedido. Ahora se revierte si falla la creación de la sesión, pero sigue faltando una expiración para sesiones creadas y nunca pagadas.

**Implementación requerida**

- Añadir `expiresAt` o `stockReservedUntil` a `Order`.
- Configurar `expires_at` de Stripe Checkout.
- Procesar `checkout.session.expired` para cancelar y reponer stock de forma idempotente.
- Añadir cron de respaldo para reservas de stock vencidas.

**Criterios de aceptación**

- Un checkout abandonado devuelve el stock automáticamente.
- Repetir webhook/cron no duplica stock.
- Un pedido pagado nunca se libera.

## Pendientes P1

### Rate limiting distribuido

El middleware actual es por isolate y solo cubre rutas API. Implementar Upstash Redis, Vercel KV o equivalente para:

- login y recuperación de contraseña;
- leads y formularios públicos;
- consulta/cancelación/reprogramación por código;
- creación de reservas, pedidos y waitlist;
- firma de uploads.

Añadir CAPTCHA o Turnstile en formularios públicos de alto abuso.

### Verificación real del archivo subido

La firma ahora fija el MIME declarado, pero R2 no inspecciona contenido. Añadir flujo de cuarentena:

1. subir a prefijo privado;
2. worker valida magic bytes, dimensiones y tamaño real;
3. reencode opcional;
4. mover a prefijo público;
5. eliminar objetos inválidos.

### CSP

Eliminar gradualmente `unsafe-eval` y reducir `unsafe-inline` usando nonces/hashes. Restringir `img-src` y `connect-src` a dominios configurados.

### Emails y observabilidad

- Cola/reintentos para emails transaccionales.
- Registro idempotente de webhooks Stripe mediante `event.id`.
- Sentry u OpenTelemetry.
- Alertas de cron, fallos de pago y errores de reserva.

## Integraciones externas no completables desde código

Estas tareas requieren credenciales, DNS o paneles externos:

- Stripe: claves live, productos/precios, endpoint webhook y pruebas con Stripe CLI.
- Resend: API key, dominio verificado, DKIM/SPF/DMARC.
- R2: bucket, CORS, dominio CDN y lifecycle.
- Google OAuth: client ID/secret y redirect URIs.
- Dominio: DNS y dominio personalizado en Vercel.
- n8n: activar monitor de cron y canales de alerta.
- Vercel: confirmar variables de producción y ejecutar migraciones.

## Orden de ejecución recomendado

1. Completar P0-1 y tests multi-tenant.
2. Completar P0-2 y tests de concurrencia/disponibilidad.
3. Completar P0-3 y webhook `checkout.session.expired`.
4. Activar rate limiting distribuido.
5. Ejecutar CI hasta verde.
6. Desplegar preview y ejecutar smoke tests.
7. Configurar integraciones externas.
8. Piloto cerrado con 3–5 centros.
9. Solo después habilitar cobros live y captación pública.

## Smoke tests obligatorios

- Registro, verificación y login.
- Alta y edición de centro, servicios, staff y horarios.
- Reserva normal, reserva con señal, cancelación y reprogramación.
- Doble reserva concurrente.
- Día cerrado, excepción y bloqueo manual.
- Pedido con stock limitado y dos compras concurrentes.
- Checkout pagado, fallido, expirado y webhook duplicado.
- Cambio de plan, impago, cancelación y reactivación.
- Upload válido y rechazo de tipo/tamaño inválido.
- Acceso cruzado entre dos organizaciones.

## Criterio de salida a producción

La app solo se considera lista cuando:

- todos los P0 están completados;
- CI está verde en una rama limpia;
- migraciones se aplican desde cero y sobre una copia de staging;
- smoke tests pasan en preview;
- Stripe, email, storage, DNS y cron están operativos;
- existe rollback documentado;
- no hay secretos en el repositorio;
- el piloto cerrado confirma la operativa real.
