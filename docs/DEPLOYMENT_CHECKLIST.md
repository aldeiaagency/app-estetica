# Checklist de despliegue

## Antes de fusionar

- [ ] CI verde: audit, migraciones, lint, type-check, tests, build y E2E.
- [ ] CodeQL sin alertas nuevas de severidad alta/crítica.
- [ ] PR revisado con CODEOWNERS.
- [ ] No existen secretos ni datos personales en el diff.
- [ ] Migraciones probadas sobre una base vacía y una copia de staging.
- [ ] Feature flags avanzados en `false`.

## Variables obligatorias

- [ ] `DATABASE_URL`
- [ ] `DIRECT_URL`
- [ ] `AUTH_SECRET`
- [ ] `AUTH_URL`
- [ ] `NEXT_PUBLIC_APP_URL`
- [ ] `CRON_SECRET`
- [ ] `UPSTASH_REDIS_REST_URL`
- [ ] `UPSTASH_REDIS_REST_TOKEN`

## Según módulos activados

### Stripe

- [ ] `STRIPE_SECRET_KEY`
- [ ] `STRIPE_PUBLISHABLE_KEY`
- [ ] `STRIPE_WEBHOOK_SECRET`
- [ ] IDs de precio correctos por plan.
- [ ] Endpoint configurado con eventos de checkout, invoice y subscription.
- [ ] Prueba Stripe test: pago, expiración, duplicado e impago.

### Email

- [ ] `RESEND_API_KEY`
- [ ] `EMAIL_FROM`
- [ ] SPF, DKIM y DMARC verificados.
- [ ] Verificación, reset, reserva y cancelación recibidos.

### Storage

- [ ] Variables `STORAGE_*`.
- [ ] `NEXT_PUBLIC_CDN_URL` con HTTPS.
- [ ] Bucket no permite escritura pública anónima.
- [ ] Upload de imagen real y rechazo de archivo falso.

## Migraciones

```bash
npm ci
npx prisma generate
npx prisma migrate deploy
npx prisma migrate status
```

No utilizar `prisma db push` en producción.

## Preview

- [ ] `/api/health/live` devuelve `200`.
- [ ] `/api/health/ready` devuelve `200`.
- [ ] Registro/login/reset.
- [ ] Centro/servicios/staff/horarios.
- [ ] Reserva/cancelación/reprogramación.
- [ ] Prueba multi-tenant negativa.
- [ ] Prueba concurrente de reserva.
- [ ] Crons con token correcto y rechazo con token incorrecto.
- [ ] Responsive móvil y navegación por teclado.

## Activación del piloto

- [ ] 3–5 centros, sin alta pública abierta.
- [ ] Stripe en modo test durante validación operativa.
- [ ] Backups y restauración comprobados.
- [ ] Canal de incidencias definido.
- [ ] Responsable de soporte y horario de respuesta.
- [ ] Métricas: reservas creadas, fallidas, canceladas, no-show y latencia.

## Activación live

- [ ] Una semana de piloto sin incidente crítico.
- [ ] Conciliación de pagos validada.
- [ ] Política de cancelaciones y devoluciones revisada legalmente.
- [ ] Aviso legal, privacidad, cookies y contratos revisados.
- [ ] Stripe live configurado por separado de test.
- [ ] Alertas operativas activas.
- [ ] Plan de rollback ensayado.
