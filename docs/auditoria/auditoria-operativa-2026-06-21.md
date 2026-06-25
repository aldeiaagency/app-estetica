# Auditoria operativa - 2026-06-21

## Resumen ejecutivo

La app esta en buen estado tecnico interno: compila, pasa type-check, pasa tests y pasa lint. Aun asi, no esta lista al 100% para operar en produccion porque hay bloqueos de configuracion externa y algunos puntos internos de experiencia que romperian flujos reales.

Estado por area:

- Codigo interno: base solida, pero con enlaces rotos y piezas de producto pendientes para auth, leads B2B y configuracion final de servicios externos.
- Vercel: despliegues activos, pero variables criticas incompletas. Los crons fallan en produccion porque falta `CRON_SECRET`. El preview de la rama actual esta protegido.
- Supabase: conexion y esquema existentes, pero sin datos operativos y sin historial de migraciones Prisma registrado.
- n8n: no se pudo auditar porque la conexion requiere autorizacion OAuth. La app no depende ahora de n8n para funcionar, pero n8n si seria util para leads B2B y automatizaciones externas.

Conclusion: se puede considerar construida como base funcional, pero no operativa al 100% hasta cerrar los puntos P0/P1 de este documento.

## Comprobaciones realizadas

- `npm run type-check`: correcto.
- `npm run test`: correcto, 61 tests superados.
- `npm run lint`: correcto, con aviso de deprecacion de `next lint` para Next.js 16.
- `npm run build`: correcto.
- Vercel CLI: proyecto enlazado, despliegues Ready, variables revisadas sin exponer valores.
- Produccion Vercel: paginas principales responden, auth protege areas privadas, cron de recordatorios falla por falta de `CRON_SECRET`.
- Supabase/Postgres: conexion correcta, tablas del esquema presentes, datos operativos a cero, sin tabla `_prisma_migrations`.
- n8n: conector localizado, pero bloqueado por autorizacion OAuth.

## Hallazgos P0 - bloquean operacion real

### P0. Vercel no tiene variables criticas para automatizaciones

En produccion, `/api/cron/reminders` devuelve error porque `CRON_SECRET` no esta configurado. Esto bloquea:

- Recordatorios automaticos de reservas.
- Liberacion automatica de reservas pendientes de senal caducadas.
- Seguimientos automaticos post-servicio.

Accion necesaria:

- Crear `CRON_SECRET` en Vercel para Production y Preview.
- Verificar los tres endpoints cron definidos en `vercel.json`.
- Probar ejecucion manual con cabecera `Authorization: Bearer <CRON_SECRET>`.

### P0. Stripe no esta configurado en Vercel

En Vercel no aparecen las variables Stripe necesarias para operar pagos, suscripciones y webhooks:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_BASIC_MONTHLY`
- `STRIPE_PRICE_PRO_MONTHLY`
- `STRIPE_PRICE_GROWTH_MONTHLY`
- `STRIPE_PRICE_PREMIUM_MONTHLY`
- `STRIPE_PRICE_PRESENCIA_MONTHLY`
- `STRIPE_PRICE_B2B_GROWTH_MONTHLY`
- `STRIPE_PRICE_ELITE_MONTHLY`
- `STRIPE_PRICE_PARTNER_MONTHLY`

Accion necesaria:

- Crear productos y precios definitivos en Stripe.
- Configurar las variables en Vercel.
- Configurar webhook de Stripe apuntando a la ruta de la app.
- Hacer prueba real de checkout y webhook.

### P0. Supabase no tiene datos operativos

El esquema existe, pero las tablas clave estan vacias: usuarios, organizaciones, centros, servicios, productos, packs, beneficios, reservas, rutinas y follow-ups.

Accion necesaria:

- Cargar datos piloto o datos reales.
- Crear al menos un negocio completo con centro, servicios, staff, productos, packs y contenido SEO.
- Validar que las paginas publicas muestran oferta real y que el dashboard puede operar.

### P0. La rama actual no esta como produccion publica final

La rama `feat/beauty-concierge` esta desplegada como preview, pero el preview esta protegido por Vercel Deployment Protection. Produccion apunta a despliegues de la rama principal/proyecto, no necesariamente al estado final de esta rama.

Accion necesaria:

- Decidir si se mergea `feat/beauty-concierge` a `main` o si se promociona manualmente.
- Desactivar proteccion del preview si se necesita validacion externa.
- Confirmar URL final publica.

## Hallazgos P1 - importantes antes de lanzar

### P1. Hay enlaces internos rotos

Rutas detectadas:

- `app/auth/signin/page.tsx:65` enlaza a `/auth/forgot-password`, pero esa ruta no existe.
- `components/booking/booking-wizard.tsx:715` enlaza a `/auth/register`, pero la ruta real es `/auth/signup`.
- `app/(dashboard)/dashboard/page.tsx:74`, `:208` y `:251` enlazan a `/dashboard/reservas/nueva`, pero esa ruta no existe.

Accion necesaria:

- Implementar recuperacion de contrasena o retirar el enlace temporalmente.
- Cambiar `/auth/register` por `/auth/signup`.
- Crear flujo de nueva reserva en dashboard o redirigir a una ruta existente.

### P1. Emails de produccion no estan configurados

En Vercel no aparecen `RESEND_API_KEY` ni `EMAIL_FROM`. Sin esto, los emails reales de confirmacion, recordatorios y seguimientos no quedan garantizados.

Accion necesaria:

- Configurar Resend en Vercel.
- Verificar dominio remitente.
- Probar email de reserva, recordatorio y follow-up.

### P1. Uploads/imagenes no estan operativos en produccion

La app tiene soporte para storage R2, pero Vercel no tiene las variables:

- `STORAGE_ENDPOINT`
- `STORAGE_ACCESS_KEY`
- `STORAGE_SECRET_KEY`
- `STORAGE_BUCKET`
- `NEXT_PUBLIC_CDN_URL`

Accion necesaria:

- Crear bucket y credenciales.
- Configurar variables.
- Probar subida de imagen desde dashboard.

### P1. Supabase no tiene historial Prisma

Las tablas existen, pero no se detecta `_prisma_migrations`. Esto no rompe necesariamente la ejecucion actual, pero deja inseguro el mantenimiento futuro con `prisma migrate deploy/status`.

Accion necesaria:

- Baselinear la base de datos actual o reconstruirla mediante migraciones.
- Registrar el historial correcto antes de futuras migraciones.

### P1. n8n no esta conectado para auditar workflows

El conector n8n requiere OAuth. No se pudo revisar si existen workflows reales.

Accion necesaria:

- Autorizar n8n en Codex.
- Revisar workflows existentes.
- Crear, si procede, workflows para leads B2B y fallback de crons.

## Hallazgos P2 - producto/configuracion

### P2. Google login se muestra, pero Vercel no tiene credenciales

El login con Google esta visible en `app/auth/signin/page.tsx`, pero no se detectaron `AUTH_GOOGLE_ID` ni `AUTH_GOOGLE_SECRET` en Vercel.

Accion necesaria:

- Configurar OAuth de Google o esconder/desactivar el boton hasta que este listo.

### P2. Falta recuperacion real de contrasena y verificacion de email

El registro marca `emailVerified` directamente en `app/actions/auth.ts:69`. Para una app publica conviene activar verificacion de correo y recuperacion de contrasena.

Accion necesaria:

- Crear flujo de reset password.
- Crear flujo de email verification.
- Ajustar copy y estados de login/registro.

### P2. B2B lead capture aun es manual

`app/para-negocios/page.tsx:299` usa un enlace `mailto:`. Para operacion comercial real falta formulario, registro de lead y notificacion interna.

Accion necesaria:

- Crear formulario B2B.
- Guardar lead o enviarlo a CRM/n8n.
- Notificar internamente y confirmar al negocio.

### P2. `.env.example` no documenta todos los aliases Stripe nuevos

El codigo soporta los aliases nuevos en `lib/billing/price-map.ts`, pero `.env.example` solo documenta los nombres antiguos.

Accion necesaria:

- Actualizar `.env.example` con los nombres nuevos.
- Mantener los antiguos si se quiere compatibilidad.

## Hallazgos P3 - limpieza y mantenimiento

### P3. `next lint` esta deprecado

El lint pasa, pero Next.js avisa de que `next lint` desaparece en Next.js 16.

Accion necesaria:

- Migrar el script de lint a ESLint CLI.

### P3. Documentacion antigua puede generar confusion

Hay documentacion previa que ya no refleja exactamente el estado actual.

Accion necesaria:

- Marcar como historica u obsoleta la documentacion antigua.
- Mantener este informe como lista viva hasta cerrar operacion.

## Workflows n8n recomendados

La app no necesita n8n para sus crons principales si Vercel Cron queda bien configurado. Aun asi, estos workflows tendrian sentido:

1. Lead B2B desde formulario: recibir solicitud, crear lead en CRM/Sheet, enviar email interno, confirmar al negocio.
2. Fallback de crons: llamar periodicamente a `/api/cron/reminders`, `/api/cron/booking-holds` y `/api/cron/follow-ups` con `CRON_SECRET` si Vercel Cron no es suficiente.
3. Alerta de fallos: notificar cuando un cron o webhook falle varias veces.
4. Onboarding de negocio: al aprobar un negocio, crear tareas internas, enviar bienvenida y checklist.

## Checklist para operativa 100%

- [ ] Arreglar enlaces rotos internos.
- [ ] Configurar `CRON_SECRET` en Vercel y probar crons.
- [ ] Configurar Stripe completo y webhook.
- [ ] Configurar Resend y dominio remitente.
- [ ] Configurar R2/storage y CDN.
- [ ] Configurar Google OAuth o esconder el boton.
- [ ] Definir dominio publico final y `NEXT_PUBLIC_APP_URL`.
- [ ] Mergear o promocionar la rama final a produccion.
- [ ] Cargar datos piloto/reales en Supabase.
- [ ] Baselinear migraciones Prisma en Supabase.
- [ ] Autorizar n8n y auditar workflows existentes.
- [ ] Crear workflow B2B o sustituir `mailto:` por flujo propio.
- [ ] Ejecutar prueba end-to-end: registro, login, reserva, email, pago, webhook, dashboard, cron, follow-up.

## Veredicto

No falta "construir media app"; la base esta avanzada y sana. Lo que falta es cerrar los ultimos huecos entre producto y operacion: variables externas, datos reales, dominio, promocion a produccion, unos enlaces rotos y los workflows comerciales/automatizaciones que queramos delegar en n8n.
