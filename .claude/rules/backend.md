# Reglas — Backend / API Routes

- Toda API route valida input con Zod antes de cualquier operación.
- Toda API route que accede a datos de negocio verifica `organizationId` o `centerId` del token.
- Nunca hacer `prisma.model.findMany()` sin filtro de tenant en rutas de negocio.
- Reservas: siempre usar `prisma.$transaction()` para crear/modificar.
- Errores: devolver JSON con `{ error: string }` y HTTP status correcto.
- 400 = input inválido, 401 = no autenticado, 403 = sin permisos, 404 = no encontrado, 409 = conflicto (doble reserva), 500 = error interno.
- Rate limiting: implementar en endpoints públicos de disponibilidad y reservas.
- No loggear datos personales (email, nombre, teléfono) en producción.
- Webhooks: siempre verificar firma (Stripe `stripe.webhooks.constructEvent`).
