# Cierre parte interna - 2026-06-25

## Alcance cerrado

Se ha cerrado la parte interna acordada para que la app no dependa de herramientas externas para tener flujos coherentes:

- Lead B2B real en `/para-negocios#contacto`.
- Tabla `Lead` en Supabase con migracion Prisma.
- Vista interna `/admin/leads`.
- Login con Google oculto si no existen credenciales.
- Recuperacion de contrasena preparada.
- Verificacion de email preparada.
- URL publica centralizada con fallback temporal a `https://app-estetica-one.vercel.app`.
- Crons de email con respuesta clara cuando Resend no esta configurado.

## Base de datos

Migracion aplicada y registrada en Supabase:

- `20260625100000_add_b2b_leads`

Estado verificado:

- Tabla `Lead` creada.
- Migracion registrada en `_prisma_migrations`.
- Conteo inicial de leads: `0`.

## Decisiones internas

- Mientras Resend no este configurado, las cuentas nuevas quedan verificadas para no bloquear el acceso.
- Cuando Resend exista, las cuentas nuevas se crean sin `emailVerified` y reciben enlace de verificacion.
- El boton de Google solo aparece si existen `AUTH_GOOGLE_ID` y `AUTH_GOOGLE_SECRET`.
- El dominio temporal operativo es `https://app-estetica-one.vercel.app` hasta que `bellezalocal.es` resuelva por DNS.

## Validaciones

- `npm run type-check`: correcto.
- `npm run test`: correcto, 63 tests.
- `npm run lint`: correcto.
- `node --env-file=.env.local ./node_modules/prisma/build/index.js validate`: correcto.
- `npm run build`: bloqueado en local por `EPERM` de Windows al regenerar Prisma en `node_modules/.prisma/client`.
- `npx next build`: bloqueado en local por `spawn EPERM` del entorno al crear procesos internos de Next.

La parte de codigo queda validada con tipos, tests, lint y esquema Prisma. La verificacion de build debe repetirse en un entorno limpio o en Vercel tras el push.

## Pendiente externo

Esto queda fuera de la parte interna y depende de credenciales/cuentas:

- DNS final de `bellezalocal.es`.
- Stripe.
- Resend.
- Cloudflare R2.
- n8n OAuth.
- Google OAuth.
