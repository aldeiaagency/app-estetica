# Auditoria operativa regenerada - 2026-06-25

## Veredicto

La app ya esta construida y desplegada en produccion, con datos piloto y migraciones Prisma registradas. No esta lista al 100% para operar con usuarias y negocios reales porque siguen faltando integraciones externas clave: Stripe, Resend, storage R2, DNS final, Google OAuth/n8n si se quieren usar, y algunas piezas de producto interno como formulario B2B, reset password y verificacion de email.

La foto actual mejora claramente la auditoria anterior:

- `main` esta en GitHub y produccion esta en Vercel con estado Ready.
- `CRON_SECRET` ya esta en Vercel.
- Supabase ya no esta vacio: hay 3 centros piloto, servicios, productos, reservas y modulo beauty.
- Prisma ya tiene 9 migraciones registradas en `_prisma_migrations`.
- No se detectan enlaces internos estaticos rotos.

El mayor bloqueo ya no es "falta construir la app"; el bloqueo es "falta conectar la operacion real".

## Evidencia revisada

- Rama local: `main`.
- Ultimo commit: `e6e80ec docs: auditoria operativa completa en /outputs (00-08 + propuestas)`.
- Estado Git: hay cambios sin confirmar ajenos a esta auditoria nueva:
  - `docs/auditoria/auditoria-operativa-2026-06-21.md`
  - `outputs/propuestas/scripts/`
- `npm run type-check`: correcto.
- `npm run test`: correcto, 61 tests superados.
- `npm run lint`: correcto, con aviso de deprecacion de `next lint`.
- `npm run build` / `npx next build`: no verificable localmente por `spawn EPERM` en Windows. Vercel si tiene build de produccion Ready.
- Produccion Vercel: `https://app-estetica-one.vercel.app` responde 200 en `/`, `/diagnostico` y `/buscar`.
- Cron sin secreto: `/api/cron/reminders` responde 401, correcto.
- Vercel deployment Ready creado el 23/06/2026 con aliases:
  - `https://app-estetica-one.vercel.app`
  - `https://bellezalocal.es`
  - `https://www.bellezalocal.es`
- DNS: `bellezalocal.es` no resuelve todavia; Vercel pide `A bellezalocal.es 76.76.21.21`.
- Supabase/Postgres: conexion directa verificada con `pg`.
- n8n: conector bloqueado por OAuth.

## Clasificacion 1 - interno app/GitHub/Vercel/Supabase

### OK actual

| Area | Estado | Evidencia |
|---|---|---|
| GitHub/repo | OK | Rama `main`, remoto `aldeiaagency/app-estetica`, ultimo commit en origin/main |
| TypeScript | OK | `npm run type-check` correcto |
| Tests unitarios | OK | 61 tests correctos |
| Lint | OK | Sin errores ni warnings de ESLint |
| Enlaces internos estaticos | OK | Rastreo de 32 href internos sin rutas ausentes |
| Vercel produccion | OK | Deployment Ready, paginas publicas 200 |
| Crons protegidos | OK | `CRON_SECRET` existe y llamada sin token devuelve 401 |
| Supabase schema | OK | Postgres 17.6, schema `public` |
| Prisma migrations | OK | 9 migraciones registradas, ultima `20260619140000_add_beauty_routines` |
| Datos piloto | OK demo | 3 centros, 7 servicios, 5 productos, 5 reservas, 3 packs, perfil/plan/rutina beauty |

### Pendiente interno

| Prioridad | Hallazgo | Impacto | Accion autonoma |
|---|---|---|---|
| P0 | `NEXT_PUBLIC_APP_URL` en produccion genera sitemap con `https://app-estetica.vercel.app` | SEO/canonicals/emails apuntan a dominio incorrecto | Cambiar temporalmente a `https://app-estetica-one.vercel.app` o, tras DNS, a `https://bellezalocal.es`; redeploy y verificar `/sitemap.xml` |
| P0 | DNS de `bellezalocal.es` no resuelve | El dominio final no abre | Necesita configurar DNS externo; despues yo verifico Vercel, actualizo envs y redeploy |
| P1 | Centros piloto tienen `seoNoindex=true` | Sirven para demo, pero no entran en sitemap ni SEO publico | Decidir si son solo demo o convertirlos en datos reales; si son reales, cambiar `seoNoindex=false` |
| P1 | Formulario B2B sigue como `mailto:` en `/para-negocios#contacto` | No hay lead capturado, seguimiento ni pipeline comercial | Crear modelo/tabla `Lead`, server action, formulario y notificacion interna; opcionalmente conectar a n8n |
| P1 | Login con Google visible sin variables `AUTH_GOOGLE_*` | Boton puede fallar en produccion | Ocultar el boton si no hay credenciales o configurar OAuth |
| P1 | No hay reset password | Recuperacion de cuenta incompleta | Implementar token + email de reset o dejarlo fuera conscientemente hasta Resend |
| P1 | Registro marca `emailVerified` directamente | Seguridad/entregabilidad incompleta para app publica | Implementar verificacion de email cuando Resend este activo |
| P1 | Emails de crons/follow-ups fallan sin Resend | Recordatorios y seguimientos no salen | Configurar Resend y agregar guard/estado claro cuando falte la key |
| P1 | Uploads devuelven 501 sin storage | Imagenes de centros/productos no operativas | Configurar R2 o desactivar UI de subida hasta que exista storage |
| P2 | Rate limiting es en memoria por instancia | Defensa ligera, no robusta en serverless | Migrar a Upstash/Redis o similar |
| P2 | Build local no verificable por `spawn EPERM` | No bloquea Vercel, pero dificulta validacion local | Limpiar procesos Node/Prisma en Windows o validar en CI/Vercel |
| P2 | RLS Supabase desactivado | No rompe Prisma server-side, pero requiere revision de API REST publica | Revisar Supabase API/RLS y permisos anon/service_role |
| P3 | `next lint` deprecado | Futuro bloqueo al subir Next.js 16 | Migrar a ESLint CLI |

## Clasificacion 2 - herramientas externas

### Stripe

Estado: no configurado en local ni Vercel.

Falta:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- 4 price IDs base o 4 aliases nuevos:
  - `STRIPE_PRICE_BASIC_MONTHLY` / `STRIPE_PRICE_PRESENCIA_MONTHLY`
  - `STRIPE_PRICE_PRO_MONTHLY` / `STRIPE_PRICE_B2B_GROWTH_MONTHLY`
  - `STRIPE_PRICE_GROWTH_MONTHLY` / `STRIPE_PRICE_ELITE_MONTHLY`
  - `STRIPE_PRICE_PREMIUM_MONTHLY` / `STRIPE_PRICE_PARTNER_MONTHLY`

Codigo existente:

- Checkout de suscripciones B2B.
- Checkout de senales de reserva.
- Checkout de productos/bonos.
- Webhook firmado en `/api/webhooks/stripe`.
- Script propuesto `outputs/propuestas/scripts/stripe-setup.mjs`.

Dependencia:

- Necesito una key `sk_test` o `sk_live` de Stripe, o acceso a la cuenta, para crear productos/precios/webhook y subir variables a Vercel.

### Resend/email

Estado: no configurado en local ni Vercel.

Falta:

- `RESEND_API_KEY`
- `EMAIL_FROM`
- Dominio remitente verificado con DNS.

Impacto:

- Confirmaciones, recordatorios, lista de espera y follow-ups no son operativos de forma real.

Dependencia:

- Necesito key de Resend y DNS del dominio remitente.

### Cloudflare R2/storage

Estado: no configurado en local ni Vercel.

Falta:

- `STORAGE_ENDPOINT`
- `STORAGE_ACCESS_KEY`
- `STORAGE_SECRET_KEY`
- `STORAGE_BUCKET`
- `NEXT_PUBLIC_CDN_URL`

Impacto:

- La ruta `/api/upload/sign` existe, pero devuelve 501 si storage no esta configurado.

Dependencia:

- Necesito bucket, credenciales y dominio publico/CDN.

### n8n

Estado: no auditable ahora. El conector oficial responde `OAuth authorization required`.

La app no depende de n8n para crons criticos; usa Vercel Cron. n8n es recomendable para:

- Lead B2B desde formulario.
- Onboarding comercial de negocio.
- Alertas de fallo de crons/webhooks.
- Fallback externo de crons si hiciera falta.

Dependencia:

- Autorizar n8n OAuth en Codex. Despues puedo inspeccionar workflows existentes y crear/actualizar workflows siguiendo el SDK oficial.

### Google OAuth

Estado: boton visible, variables ausentes.

Falta:

- `AUTH_GOOGLE_ID`
- `AUTH_GOOGLE_SECRET`
- Redirect URI final en Google Cloud cuando el dominio resuelva.

Decision:

- O se configura Google OAuth, o oculto el boton hasta que este listo.

### Anthropic/IA

Estado: `ANTHROPIC_API_KEY` ausente.

Impacto:

- Solo afecta funciones premium de IA si se activan. No bloquea marketplace/reserva basica.

### DNS/dominio

Estado:

- Dominio asignado a Vercel.
- DNS no resuelve.

Falta:

- En proveedor DNS: `A bellezalocal.es 76.76.21.21`.
- Verificar tambien `www.bellezalocal.es` segun instruccion de Vercel.

Impacto:

- No hay dominio final operativo.
- No se deben fijar OAuth/Stripe/Resend definitivos hasta que el dominio resuelva.

## Paso a paso autonomo para dejarla operativa

### Fase 0 - Estabilizar auditoria y repositorio

1. Mantener esta auditoria como fuente actual.
2. Decidir si se incorporan al commit los documentos previos sin confirmar.
3. Limpiar o documentar el bloqueo local `spawn EPERM`; usar Vercel/CI como build autoritativo si Windows sigue bloqueando.

Criterio de cierre: repo limpio o con cambios intencionados, y validaciones locales posibles documentadas.

### Fase 1 - Cerrar pendientes internos sin cuentas externas

1. Crear formulario B2B real en `/para-negocios#contacto`.
2. Crear almacenamiento de leads en Supabase/Prisma (`Lead`) o tabla equivalente.
3. Sustituir `mailto:` por server action.
4. Ocultar boton Google si no hay `AUTH_GOOGLE_*`.
5. Preparar reset password/email verification condicionado a Resend.
6. Mejorar guard de Resend para que crons reporten "email no configurado" de forma clara.

Criterio de cierre: no hay CTA roto o manual para B2B/auth, y la app degrada con gracia cuando falta una integracion.

### Fase 2 - Dominio, Vercel y SEO base

1. Configurar DNS externo de `bellezalocal.es`.
2. Verificar que apex y `www` resuelven.
3. Actualizar `NEXT_PUBLIC_APP_URL` y `AUTH_URL` en Vercel.
4. Redeploy.
5. Verificar `/robots.txt`, `/sitemap.xml`, canonicals y emails con URL final.
6. Decidir si los centros piloto siguen `seoNoindex=true` o pasan a SEO publico.

Criterio de cierre: dominio final abre, sitemap usa `https://bellezalocal.es`, y Vercel muestra dominio validado.

### Fase 3 - Supabase listo para operacion

1. Confirmar backups/PITR del proyecto Supabase.
2. Revisar RLS/API REST publica.
3. Mantener migraciones Prisma como fuente de verdad.
4. Si los datos piloto son solo demo, cargar datos reales.
5. Si los datos piloto valen para beta, revisar nombres, imagenes, noindex y textos.

Criterio de cierre: datos reales o demo aprobada, migraciones sanas, seguridad Supabase revisada.

### Fase 4 - Stripe operativo

1. Con una key Stripe, ejecutar/ajustar `outputs/propuestas/scripts/stripe-setup.mjs`.
2. Crear productos/precios de planes.
3. Crear webhook a `https://bellezalocal.es/api/webhooks/stripe`.
4. Subir `STRIPE_*` a Vercel Production y Preview.
5. Redeploy.
6. Probar:
   - Suscripcion de negocio.
   - Activacion de plan por webhook.
   - Pago de senal de reserva.
   - Pago de bono/producto.

Criterio de cierre: pagos test pasan y la base refleja pagos/suscripciones.

### Fase 5 - Email operativo

1. Crear/verificar dominio en Resend.
2. Subir `RESEND_API_KEY` y `EMAIL_FROM` a Vercel.
3. Redeploy.
4. Probar:
   - Confirmacion de reserva.
   - Recordatorio cron.
   - Follow-up post-servicio.
   - Lista de espera.

Criterio de cierre: emails reales llegan y quedan registrados como enviados cuando aplica.

### Fase 6 - Storage operativo

1. Crear bucket R2.
2. Configurar CORS y dominio publico/CDN.
3. Subir `STORAGE_*` y `NEXT_PUBLIC_CDN_URL` a Vercel.
4. Probar subida de imagen desde dashboard.
5. Validar que las imagenes se ven en paginas publicas y privadas.

Criterio de cierre: uploads y visualizacion de imagenes funcionan en produccion.

### Fase 7 - n8n y automatizacion externa

1. Autorizar n8n OAuth en Codex.
2. Auditar workflows existentes.
3. Crear workflow lead B2B o adaptar el template existente.
4. Crear alertas de fallo para crons/webhooks.
5. Opcional: fallback externo que llame crons con `CRON_SECRET`.

Criterio de cierre: workflows activos, probados y documentados.

### Fase 8 - Prueba end-to-end final

Ejecutar una cadena completa:

1. Registro de usuaria.
2. Diagnostico/perfil beauty.
3. Ver centro real.
4. Reserva.
5. Pago de senal si aplica.
6. Email de confirmacion.
7. Cron de recordatorio.
8. Completar reserva desde dashboard.
9. Follow-up.
10. Compra de producto/bono.
11. Suscripcion de negocio y activacion por webhook.
12. Upload de imagen.
13. Revision de logs/alertas.

Criterio de cierre: la cadena completa pasa en produccion sin pasos manuales ocultos.

## Orden recomendado inmediato

1. DNS de `bellezalocal.es`.
2. Actualizar `NEXT_PUBLIC_APP_URL` / `AUTH_URL`.
3. Stripe.
4. Resend.
5. R2.
6. Formulario B2B interno.
7. Google OAuth o ocultar boton.
8. Reset password + verificacion email.
9. n8n.
10. E2E final.

## Bloqueos que no puedo resolver sin acceso externo

- Crear o leer la cuenta de Stripe sin key/acceso.
- Crear/verificar dominio Resend sin acceso DNS.
- Crear bucket R2 sin credenciales Cloudflare.
- Configurar DNS del dominio sin acceso al proveedor DNS.
- Auditar/crear workflows en n8n sin OAuth.
- Configurar Google OAuth sin acceso a Google Cloud o sin client id/secret.

En cuanto esas credenciales/accesos esten disponibles, puedo configurar variables, redeployar y probar los flujos yo.
