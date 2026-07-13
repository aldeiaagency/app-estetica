# Auditoria E2E Belleza Local - 2026-07-13

## Veredicto corto

La parte interna de la app queda validada para piloto comercial controlado: la build local de produccion pasa, la base esta migrada, los datos piloto existen y la bateria E2E principal pasa completa.

No queda lista al 100% para explotacion publica porque produccion todavia tiene bloqueos externos: DNS del dominio, readiness 503 por Redis/Upstash, variables de integraciones comerciales y despliegue del ultimo codigo auditado.

## Evidencia interna

- Build local de produccion: `npm run build` OK.
- Unit tests: `npm run test` OK, 69 tests passed y 1 skipped.
- Auditoria E2E Playwright en build local de produccion: 29/29 OK.
- Migraciones Supabase/Prisma: 15 migrations, database schema up to date.
- Datos piloto tras limpieza: 3 centros publicados, 7 servicios activos, 5 productos activos.
- Limpieza post-auditoria: 0 clientes audit, 0 pedidos audit, 0 servicios audit, 0 leads audit, 0 admin temporal.

## Pruebas E2E ejecutadas

### Usuaria compradora - 20/20 OK

- Home, propuesta y CTAs.
- Busqueda por servicio y ciudad.
- Filtros de marketplace.
- Landings SEO por ciudad/categoria.
- Ficha de centro con servicios, packs, beneficios y productos.
- Flujo de reserva con servicio, profesional y disponibilidad.
- Reserva real sin pago externo.
- Gestion de reserva invalida sin filtrado de datos.
- Registro con contrasena debil rechazado.
- Recuperacion de contrasena sin email externo.
- Login de compradora y cuenta personal.
- Beauty Profile.
- Beauty Plan.
- Wallet.
- Rutina.
- Reposicion.
- Listado y detalle de productos.
- Carrito.
- Checkout con pago en centro.
- Guardar producto en rutina.

### Centro de estetica / negocio - 5/5 OK

- Acceso al panel y resumen del centro.
- Gestion de servicios y creacion temporal de servicio.
- Reservas y lista de espera.
- Packs, beneficios y productos.
- Seguimientos, recurrencia y campanas.

### Administrador - 4/4 OK

- Una compradora no accede al admin.
- Overview de plataforma.
- Leads B2B.
- Centros, organizaciones, planes, metricas y auditoria.

### Captacion B2B adicional

- Formulario publico `/para-negocios` probado manualmente con Playwright.
- Resultado: lead guardado en Supabase y mensaje de exito visible.
- n8n ausente/simulado no rompe el formulario.
- Lead de prueba eliminado.

## Arreglos aplicados durante la auditoria

- `app/api/v1/availability/month/route.ts`: se sustituyo el calculo mensual N+1 por una lectura mensual agrupada y calculo en memoria. Evita saturar el pool de Supabase y estabiliza la reserva.
- `components/auth/signin-form.tsx`: se impide que el login pueda enviar credenciales por GET antes de hidratacion. El formulario usa `method="post"` y el boton espera a hidratacion.
- `next.config.mjs`: se permite `fastly.picsum.photos`, dominio real al que redirige Picsum, para que imagenes piloto no choquen con CSP.
- `.env.example`: variable n8n corregida a `N8N_WEBHOOK_LEAD_B2B_URL`, que es la que consume el codigo.
- `tailwind.config.ts`: import ESM para que el servidor de pruebas no falle con `require`.
- `tests/e2e/core.spec.ts`: home espera `domcontentloaded` para evitar falsos negativos.
- `tests/e2e/audit.spec.ts`: nueva bateria E2E de auditoria completa.
- `package.json` / `package-lock.json`: Playwright agregado como dependencia de desarrollo para ejecutar `npm run test:e2e`.

## Estado externo verificado

- Produccion Vercel por alias `app-estetica-one.vercel.app`: `/api/health/live` responde 200.
- Produccion Vercel: `/api/health/ready` responde 503.
- Causa del 503: `distributedRateLimit` requerido y no configurado; Stripe, webhook Stripe, email y storage aparecen como opcionales no configurados.
- Features en produccion actual: marketplace y follow-ups activos; products, bonos, beautyConcierge, campaigns y wallet apagados.
- DNS: `bellezalocal.es` y `www.bellezalocal.es` no resuelven desde esta maquina.
- Produccion sigue en commit `5bfa3974bdfb`; los arreglos de esta auditoria aun no estan desplegados.

## Pendiente para 100% operativo

1. Corregir DNS de `bellezalocal.es` y `www.bellezalocal.es`.
2. Configurar Upstash Redis en Vercel para que readiness pase a 200.
3. Desplegar este codigo auditado a Vercel.
4. Configurar Resend/email real.
5. Configurar Stripe si se van a cobrar productos, bonos, reservas o suscripciones dentro de la app.
6. Configurar storage R2 o sustituir assets piloto por assets finales.
7. Configurar variables n8n en Vercel, especialmente `N8N_WEBHOOK_LEAD_B2B_URL`.
8. Revisar/activar canal real de notificaciones n8n y monitor de crons.
9. Decidir feature flags de lanzamiento: para piloto recomendado activar solo marketplace, reservas, panel negocio, captacion B2B y seguimientos.

