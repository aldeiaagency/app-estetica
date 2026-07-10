# Runbook operativo

## Señales de salud

- `GET /api/health/live`: confirma que el proceso responde.
- `GET /api/health/ready`: confirma base de datos, secretos e integraciones requeridas por los feature flags.
- Un `503` en readiness impide considerar el despliegue apto para tráfico.

## Crons

| Ruta | Cadencia | Función |
|---|---:|---|
| `/api/cron/booking-holds` | cada 10 min | cancela señales no pagadas vencidas |
| `/api/cron/order-reservations` | cada 10 min | libera stock reservado vencido |
| `/api/cron/reminders` | diario 08:00 | recordatorios de citas |
| `/api/cron/follow-ups` | diario 09:00 | seguimientos programados |
| `/api/cron/data-retention` | domingo 03:15 | tokens expirados y eventos Stripe antiguos |

Todos requieren `Authorization: Bearer $CRON_SECRET`.

## Incidente: doble reserva reportada

1. Desactivar temporalmente reservas públicas en Vercel o retirar el centro de publicación.
2. Comprobar que la migración `booking_overlap_guard` figura aplicada.
3. Consultar reservas activas del mismo `staffId` e intervalo.
4. No eliminar registros: cancelar la reserva incorrecta conservando trazabilidad.
5. Ejecutar el test `booking-concurrency.integration.test.ts` contra staging.
6. Revisar si la reserva tenía `staffId=null`; el flujo actual debe asignar siempre profesional concreto.

## Incidente: stock negativo o bloqueado

1. Desactivar `FEATURE_PRODUCTS`.
2. Revisar `OrderStockReservation` y pedidos `PENDING`.
3. Ejecutar manualmente el cron de reservas de stock.
4. Verificar que una reserva tenga solo uno de `releasedAt` o `consumedAt`.
5. Corregir inventario mediante una operación auditada, nunca borrando pedidos.

## Incidente: webhook Stripe fallando

1. Revisar firma, secreto y URL del endpoint.
2. Consultar `StripeWebhookEvent` por `status='FAILED'` y `lastError`.
3. Corregir la causa antes de reintentar desde Stripe.
4. Stripe puede reenviar el mismo `event.id`; el sistema lo reclamará de nuevo si quedó `FAILED`.
5. No ejecutar fulfillment manual sin comprobar `payment_status=paid`.

## Incidente: checkout pagado pero pedido no confirmado

1. Confirmar pago en Stripe y obtener `payment_intent` y `checkout.session`.
2. Revisar el evento correspondiente en `StripeWebhookEvent`.
3. Reenviar el evento desde Stripe.
4. Confirmar que `OrderStockReservation.consumedAt` queda informado.
5. Si el pedido ya está `CANCELLED`, escalar: no restaurar automáticamente sin comprobar stock físico.

## Incidente: upload malicioso o incorrecto

1. Desactivar temporalmente `STORAGE_*` o la edición afectada.
2. Identificar la clave R2 bajo el prefijo de la organización.
3. Retirar el objeto del bucket/CDN.
4. Verificar que la UI use `/api/upload/image` y que `/api/upload/sign` responda `410`.
5. Registrar tipo real, tamaño y origen sin conservar datos personales innecesarios.

## Incidente: credencial expuesta

1. Revocar inmediatamente en el proveedor.
2. Rotar la variable en Vercel para todos los entornos.
3. Redeploy.
4. Si afecta `AUTH_SECRET`, cerrar sesiones y forzar nuevo login.
5. Si afecta Stripe, rotar clave y webhook secret.
6. Buscar el secreto en historial Git; si llegó a commit, reescribir historial y asumir compromiso.

## Rollback de aplicación

1. Desactivar feature flags avanzados.
2. Promover en Vercel el último deployment estable.
3. No revertir migraciones destructivamente durante el incidente.
4. Las migraciones de esta rama son aditivas; el código anterior puede ignorar tablas/campos adicionales.
5. Confirmar `/api/health/live` y operaciones core.

## Rollback de migración

Las migraciones añaden campos, tablas, índices y constraints. El rollback preferente es **forward-fix**.

En caso extremo:

- eliminar constraints solo después de identificar su nombre exacto;
- conservar `StripeWebhookEvent` y `OrderStockReservation` para trazabilidad;
- no eliminar `sessionVersion` mientras existan JWT emitidos con esa lógica;
- realizar snapshot de base de datos antes de cualquier DDL manual.

## Backups

- Backup automático diario de PostgreSQL.
- Prueba de restauración mensual en proyecto independiente.
- RPO objetivo: 24 h durante piloto, menor al activar pagos live.
- RTO objetivo: 4 h durante piloto.

## Alertas mínimas

Configurar `OBSERVABILITY_WEBHOOK_URL` para:

- fallo de cron;
- fallo persistente de webhook Stripe;
- readiness en `503`;
- incremento anómalo de errores de reserva/pedido;
- almacenamiento o email no disponibles.
