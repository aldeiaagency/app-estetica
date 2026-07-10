# Arquitectura de seguridad

## Principios

1. **El cliente no es una fuente de autoridad.** IDs, precios, duración, fin de reserva, roles y estados se recalculan o validan en servidor.
2. **Autorización dentro de la mutación.** Cada Server Action obtiene usuario y organización desde la sesión y filtra propiedad en la query.
3. **La base de datos es la última barrera.** Restricciones e índices protegen invariantes ante concurrencia o errores de aplicación.
4. **Pagos idempotentes y fail-closed.** Un evento repetido no duplica efectos; configuraciones desconocidas producen error.
5. **Módulos no validados permanecen cerrados.** Feature flags desactivan funciones avanzadas por defecto.

## Fronteras de confianza

### Navegador → aplicación

Datos aceptables como propuesta:

- IDs de centro/servicio/profesional;
- inicio deseado;
- datos de contacto;
- cantidades de carrito.

Datos que nunca se confían:

- `organizationId`;
- `endAt` o duración;
- precio, total o depósito;
- plan o entitlement;
- estado de reserva/pedido;
- MIME declarado como prueba del contenido.

### Aplicación → PostgreSQL

- Prisma para operaciones del dominio.
- SQL parametrizado para restricciones/servicios operativos no modelados.
- Transacciones serializables para reserva e inventario.
- Restricción GiST para evitar doble reserva.

### Stripe → aplicación

- Firma obligatoria con `STRIPE_WEBHOOK_SECRET`.
- `event.id` reclamado en `StripeWebhookEvent` antes de procesar.
- Fulfillment únicamente con `payment_status=paid`.
- Precio desconocido no obtiene plan por defecto.

### Storage → publicación

- El navegador envía el archivo al servidor.
- Se validan magic bytes, tamaño y dimensiones.
- Se eliminan metadatos comunes.
- Solo el binario validado se sube a R2.

## Autorización multi-tenant

`requireOrganization()` realiza:

1. lectura de sesión;
2. lectura fresca del usuario;
3. validación del rol empresarial;
4. validación de organización existente;
5. devolución de `organizationId` confiable.

Las mutaciones usan patrones como:

```ts
const { organizationId } = await requireOrganization()
const resource = await prisma.resource.findFirst({
  where: { id, center: { organizationId } },
})
```

No se debe sustituir este patrón por una comparación posterior con un ID recibido del cliente.

## Reservas

`resolveBookableSlot()` es el contrato canónico. Valida:

- centro publicado;
- servicio y profesional activos;
- vínculo `ServiceStaff`;
- ventana máxima;
- horario y excepción;
- bloqueos generales y del profesional;
- reservas activas;
- duración y buffers desde base de datos.

La restricción `Booking_no_overlap_active` resuelve la carrera residual entre validación y escritura.

## Inventario

- El stock se decrementa con `UPDATE ... WHERE stock >= quantity`.
- `OrderStockReservation` representa la reserva temporal.
- Pago consume la reserva.
- Fallo/expiración la libera exactamente una vez.
- Cron recupera eventos que Stripe no haya entregado.

## Sesiones

- `active=false` bloquea nuevos accesos y JWT existentes.
- `sessionVersion` se almacena en el JWT y se compara con base de datos.
- Cambio de contraseña incrementa la versión y revoca sesiones previas.
- Rol/organización se refrescan desde PostgreSQL.

## Rate limiting

- Producción: Upstash Redis.
- Desarrollo/fallo temporal: fallback local.
- La ausencia de Upstash hace que readiness falle en Vercel production.

## Datos personales

- Logs estructurados redactan emails, teléfonos, tokens, cookies y secretos.
- Tokens expirados se eliminan semanalmente.
- Los registros transaccionales no se eliminan automáticamente: su retención debe seguir obligaciones fiscales/legales.
- Los eventos Stripe procesados/fallidos se retienen 90 días.

## Reglas para contribuciones

- No añadir secretos al repositorio.
- No introducir rutas directas de upload público.
- No aceptar `orgId`, precios o fin de reserva como autoridad.
- Todo webhook debe ser verificable e idempotente.
- Toda mutación económica debe tener test de reintento y concurrencia.
- Toda migración debe pasar sobre PostgreSQL limpio en CI.
