# Production readiness — App Estética

Fecha de revisión: 2026-07-10  
Rama: `fix/security-transaction-hardening-v2`  
PR: `#4`

## Estado ejecutivo

Los bloqueadores técnicos P0 detectados en la auditoría han sido implementados en esta rama. La versión de código fue verificada correctamente mediante CI y CodeQL el 10 de julio de 2026: dependencias, migraciones desde cero, lint, TypeScript, pruebas unitarias y de integración, build de producción, E2E en Chromium y análisis estático finalizaron correctamente.

La aplicación queda preparada para un **despliegue de preview y piloto cerrado** cuando se configuren las credenciales externas y se ejecuten los smoke tests de integración real.

No debe activarse cobro live ni captación pública hasta completar la lista externa de este documento.

## Mejoras completadas

### 1. Aislamiento multiempresa

- Las mutaciones B2B obtienen la organización desde `auth()` mediante `lib/auth/authorization.ts`.
- Los antiguos argumentos `orgId` se mantienen temporalmente solo para compatibilidad de llamadas; se ignoran como frontera de autorización.
- Los recursos se consultan con filtro de propiedad en la propia query.
- Roles reales alineados con Prisma: `CUSTOMER`, `BUSINESS`, `BUSINESS_ADMIN`, `PLATFORM_ADMIN`.
- Tests estáticos impiden reintroducir confianza en un ID de organización enviado por cliente.

### 2. Reservas canónicas y concurrencia

- `lib/availability/booking-slot.ts` es la autoridad única para crear o reprogramar.
- El cliente ya no controla `endAt` ni `newEndAt`.
- El servidor valida centro publicado, servicio activo, vínculo `ServiceStaff`, profesional activo, horarios, excepciones, bloqueos y ventana de reserva.
- PostgreSQL aplica una restricción de exclusión para evitar solapamientos `PENDING`/`CONFIRMED` por profesional.
- Alta y reprogramación utilizan transacciones serializables.
- Código de confirmación generado con `crypto.randomInt`.
- Test de integración concurrente: dos escrituras simultáneas, una única reserva válida.

### 3. Inventario y pedidos

- Reserva de stock mediante actualización condicional atómica.
- Tabla operativa `OrderStockReservation` con vencimiento.
- Stripe Checkout expira a los 30 minutos; pago en centro reserva durante 24 horas.
- Webhook `checkout.session.expired` y cron de respaldo reponen stock.
- Liberación y consumo son idempotentes; un pedido pagado no puede liberar unidades.
- Un error al crear Checkout restaura stock y devuelve error explícito.

### 4. Stripe

- Registro persistente de eventos en `StripeWebhookEvent`.
- Eventos duplicados no repiten fulfillment.
- Reintento controlado de eventos fallidos o bloqueados.
- Precio de suscripción desconocido falla cerrado.
- Cobertura de pago completado, pago asíncrono, expiración, fallo, suscripciones e invoices.
- Estado sin entitlement degrada a BASIC.
- `STRIPE_WEBHOOK_SECRET` ausente produce `503`.

### 5. Autenticación y sesiones

- Emails normalizados globalmente.
- Contraseña mínima de 10 caracteres con mayúscula, minúscula y número.
- Registro transaccional: no deja organizaciones huérfanas.
- Tokens de verificación/reset hasheados, con expiración y uso único.
- Reset incrementa `sessionVersion` y revoca sesiones anteriores.
- Campo `active` permite desactivar cuentas.
- Google OAuth solo se habilita con credenciales completas.
- Rate limiting sobre registro, recuperación, reset y verificación.

### 6. Rate limiting y abuso

- Backend distribuido compatible con Upstash Redis.
- Fallback local exclusivamente defensivo.
- Políticas separadas para auth, reservas, consultas, pedidos, leads, waitlist y uploads.
- Formularios públicos con normalización y honeypot.
- Middleware conserva un límite general de emergencia para APIs.

### 7. Uploads

- La ruta directa `/api/upload/sign` devuelve `410` y no permite bypass.
- `/api/upload/image` recibe y valida el binario en servidor.
- Detección por magic bytes para JPG, PNG, WebP y AVIF.
- Límites de tamaño y dimensiones.
- Eliminación de EXIF/XMP/ICCP y metadatos textuales comunes.
- El servidor —no el navegador— escribe el objeto validado en R2.

### 8. Feature flags y alcance piloto

Por defecto permanecen cerrados:

- productos;
- bonos;
- Beauty Concierge;
- recomendaciones IA;
- campañas;
- wallet.

Se mantienen activos marketplace básico y follow-ups. El middleware bloquea rutas deshabilitadas tanto en UI como API.

### 9. Base de datos

- Restricciones para intervalos, precios, depósitos, buffers, cantidades y días de semana.
- Índices para reservas, pedidos, clientes, tokens, auditoría y waitlist.
- Migraciones verificadas en CI contra PostgreSQL 16 limpio.
- Tablas operativas fuera del dominio Prisma documentadas en `prisma/README.md`.

### 10. Calidad y seguridad automatizadas

- CI: instalación reproducible, audit crítico, Prisma, migraciones, lint, type-check, tests, build y Playwright.
- CodeQL semanal y por PR.
- Dependabot para npm y GitHub Actions.
- CODEOWNERS en áreas sensibles.
- Plantilla de PR con checklist de seguridad y rollback.
- Pruebas de invariantes de tenant, reservas, Stripe e imágenes.

### 11. Observabilidad y operación

- Logger JSON con redacción de datos sensibles.
- Webhook opcional para alertas operativas.
- `/api/health/live` para liveness.
- `/api/health/ready` para base de datos, secretos, integraciones y flags.
- Crons de reservas, stock, follow-ups, recordatorios y retención.
- Limpieza semanal de tokens expirados y eventos Stripe antiguos.

### 12. UX y accesibilidad

- Enlace global “Saltar al contenido principal”.
- Foco visible coherente.
- Respeto a `prefers-reduced-motion`.
- Estados de upload accesibles (`aria-busy`, `role=alert`).
- Mensajes de error más específicos sin filtrar recursos ajenos.

## Integraciones externas obligatorias

Estas tareas requieren paneles o credenciales fuera del repositorio:

1. **Vercel:** cargar todas las variables de `.env.example` y ejecutar migraciones.
2. **Upstash:** crear Redis y configurar sus dos variables en producción.
3. **Stripe:** claves live, precios, endpoint webhook, eventos requeridos y prueba con Stripe CLI.
4. **Resend:** dominio verificado, SPF, DKIM y DMARC.
5. **Cloudflare R2:** bucket privado de escritura, CDN, CORS mínimo y lifecycle.
6. **Google OAuth:** redirect URIs exactas del dominio final.
7. **DNS:** dominio y CDN resolviendo con HTTPS.
8. **Observabilidad:** URL privada del canal de alertas.
9. **n8n:** credenciales, monitor de crons y canal operativo.

## Smoke tests de preview

- Registro cliente y negocio, verificación, login y reset.
- Alta/edición de centro, servicio, profesional y horarios.
- Reserva normal, con señal, cancelación y reprogramación.
- Profesional no vinculado, día cerrado y bloqueo manual rechazados.
- Dos reservas simultáneas al mismo hueco.
- Dos compras sobre la última unidad.
- Checkout pagado, fallido, duplicado y expirado.
- Cambio, impago, cancelación y reactivación de plan.
- Upload válido y rechazo de archivo falso, sobredimensionado o con metadatos.
- Usuario de organización A intentando mutar recursos de B.
- Liveness/readiness y ejecución autenticada de todos los crons.

## Criterio de salida

La aplicación se considera apta para piloto cuando:

- CI y CodeQL están verdes;
- las migraciones pasan desde cero y sobre staging;
- el preview supera todos los smoke tests;
- `/api/health/ready` devuelve `200` en producción;
- las integraciones externas están configuradas;
- existe backup verificado y procedimiento de rollback;
- se ha probado con cuentas Stripe test, nunca directamente con live.

La activación pública y cobro live solo debe realizarse tras un piloto cerrado con 3–5 centros y al menos una semana de observación sin incidentes críticos.
