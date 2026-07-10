# Prisma y objetos SQL operativos

## Regla de migración

La base de datos se modifica exclusivamente con migraciones versionadas:

```bash
npx prisma migrate deploy
```

No utilizar `prisma db push` en staging o producción porque puede eliminar objetos creados con SQL nativo.

## Objetos gestionados fuera del modelo Prisma

Algunos objetos son deliberadamente SQL nativo porque expresan invariantes o infraestructura que Prisma 5 no modela completamente:

### `Booking_no_overlap_active`

Restricción PostgreSQL `EXCLUDE USING gist` que impide reservas activas solapadas para el mismo profesional. Debe conservarse aunque no aparezca en `schema.prisma`.

### `StripeWebhookEvent`

Tabla de idempotencia operativa. Se accede mediante SQL parametrizado en `lib/billing/payment-integrity.ts`.

Campos principales:

- `id`: `event.id` de Stripe;
- `status`: `PROCESSING`, `PROCESSED` o `FAILED`;
- `attempts`, `lastError`, `processedAt`.

### `OrderStockReservation`

Representa la reserva temporal de inventario asociada a un pedido.

- `releasedAt`: stock devuelto;
- `consumedAt`: pago confirmado;
- ambos nulos: reserva activa.

Nunca deben establecerse ambos valores.

### Campos `User.active` y `User.sessionVersion`

Se consultan mediante SQL tipado en Auth.js para evitar que una regeneración prematura del cliente bloquee el despliegue. Sirven para desactivar cuentas y revocar JWT.

## Comprobación de drift

Antes de cambiar `schema.prisma`:

1. restaurar una copia de staging en una base aislada;
2. aplicar todas las migraciones;
3. ejecutar `prisma migrate status`;
4. usar `prisma db pull` solo para inspección;
5. revisar que el resultado no elimine constraints, índices ni tablas operativas;
6. no commitear automáticamente el resultado de `db pull`.

## Creación de nuevas migraciones

- Migraciones de dominio estándar: Prisma migrate en desarrollo.
- Constraints avanzados, índices parciales, triggers o extensiones: SQL manual versionado.
- Toda migración debe ser aditiva o incluir un plan explícito de backfill y rollback.
- Una migración destructiva requiere backup probado y ventana de mantenimiento.

## CI

El workflow crea PostgreSQL 16 limpio y ejecuta:

```bash
npx prisma generate
npx prisma migrate deploy
npx prisma migrate status
```

Si falla cualquiera de estos pasos, el PR no debe fusionarse.
