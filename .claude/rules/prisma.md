# Reglas — Prisma / Base de datos

- Después de cada cambio en `schema.prisma`, ejecutar `npx prisma generate`.
- Nuevas tablas/columnas: crear migración con nombre descriptivo (`npx prisma migrate dev --name descripcion`).
- No usar `npx prisma db push` en producción (solo en desarrollo/prototipos).
- Precios siempre en céntimos (Int). Nunca Decimal/Float para dinero.
- IDs siempre `@id @default(cuid())`. Nunca autoincrement.
- Timestamps siempre UTC (Prisma los guarda en UTC por defecto).
- Índices compuestos obligatorios: `(centerId, startAt, endAt)` en Booking.
- Si añades un modelo nuevo, asegúrate de incluir `organizationId` o `centerId` para aislamiento multi-tenant.
- Relaciones: siempre definir `onDelete` (Cascade en hijos de auth, Restrict/SetNull en datos de negocio).
