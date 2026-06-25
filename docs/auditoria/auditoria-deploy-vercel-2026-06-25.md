# Auditoria deploy Vercel - 2026-06-25

## Veredicto

El deploy actual de Vercel esta operativo y sirve los cambios internos del commit `6237b27`.

La app no esta todavia operativa al 100% para explotacion real porque faltan integraciones externas: DNS final, Stripe, Resend, Cloudflare R2, Google OAuth y n8n si se quiere usar para automatizaciones comerciales.

## Deploy auditado

- URL temporal valida: `https://app-estetica-one.vercel.app`
- Deployment Vercel: `app-estetica-6ajou2har-aldeiaagencys-projects.vercel.app`
- Deployment id: `dpl_ABHEzeApM1DhB24QxEN29szQGu98`
- Proyecto: `app-estetica`
- Target: `production`
- Estado: `Ready`
- Creado: `2026-06-25 23:35:30 Europe/Madrid`
- Aliases activos:
  - `https://app-estetica-one.vercel.app`
  - `https://bellezalocal.es`
  - `https://www.bellezalocal.es`
  - `https://app-estetica-aldeiaagencys-projects.vercel.app`
  - `https://app-estetica-git-main-aldeiaagencys-projects.vercel.app`

## Evidencia de que el commit nuevo esta desplegado

- `/admin/leads` existe y redirige a login, como debe hacer una ruta protegida.
- `/para-negocios` contiene el nuevo formulario B2B.
- `/auth/forgot-password`, `/auth/reset-password` y `/auth/verify-email` responden 200.
- `/auth/signin` ya no muestra Google cuando no hay `AUTH_GOOGLE_ID` y `AUTH_GOOGLE_SECRET`.
- `/robots.txt` y `/sitemap.xml` usan `https://app-estetica-one.vercel.app`.

## Rutas verificadas

Rutas publicas con 200:

- `/`
- `/para-negocios`
- `/precios`
- `/buscar`
- `/productos`
- `/diagnostico`
- `/carrito`
- `/checkout`
- `/cookies`
- `/privacidad`
- `/terminos`
- `/auth/signin`
- `/auth/signup`
- `/auth/forgot-password`
- `/auth/reset-password?token=invalid`
- `/auth/verify-email?token=invalid`
- `/robots.txt`
- `/sitemap.xml`

Rutas protegidas con redireccion correcta:

- `/dashboard` -> `/auth/signin?callbackUrl=%2Fdashboard`
- `/admin` -> `/auth/signin`
- `/admin/leads` -> `/auth/signin`
- `/cuenta` -> `/auth/signin`
- `/rutina` -> `/auth/signin?callbackUrl=/rutina`
- `/reposicion` -> `/auth/signin?callbackUrl=/reposicion`
- `/mi-plan` -> `/auth/signin?callbackUrl=/mi-plan`

Endpoints protegidos o controlados:

- `/api/cron/reminders`: 401 sin secreto, correcto.
- `/api/cron/follow-ups`: 401 sin secreto, correcto.
- `/api/cron/booking-holds`: 401 sin secreto, correcto.
- `/api/webhooks/stripe` GET: 405, correcto.
- `/api/webhooks/stripe` POST sin firma: 400, correcto.
- `/api/upload/sign` sin sesion: 401, correcto.
- `/api/account/export` sin sesion: 401, correcto.
- `/api/v1/availability` con ids de prueba: 200 y `slots: []`.
- `/api/v1/availability/month` con ids de prueba: 200, pero tarda mas que una ruta normal.

## Recursos y enlaces

- Recursos `_next`, CSS, JS e imagen principal: OK.
- Imagen principal optimizada por Next: 200.
- Enlaces internos rastreados desde home, precios, para negocios y login: OK.
- Logs recientes de Vercel: sin errores de runtime durante la auditoria.

## Supabase

- Migracion `20260625100000_add_b2b_leads` registrada.
- Tabla `"Lead"` existe.
- Conteo actual de leads: `0`.

## Variables Vercel detectadas

Configuradas:

- `DATABASE_URL`
- `DIRECT_URL`
- `AUTH_SECRET`
- `NEXT_PUBLIC_APP_NAME`
- `NEXT_PUBLIC_APP_URL`
- `CRON_SECRET`

Faltan para operacion completa:

- Stripe: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_*`
- Resend: `RESEND_API_KEY`, `EMAIL_FROM`
- Cloudflare R2: `STORAGE_ENDPOINT`, `STORAGE_ACCESS_KEY`, `STORAGE_SECRET_KEY`, `STORAGE_BUCKET`, `NEXT_PUBLIC_CDN_URL`
- Google OAuth: `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`
- Anthropic/IA si se quiere activar IA premium: `ANTHROPIC_API_KEY`

## DNS y dominios

- `https://app-estetica-one.vercel.app` funciona.
- `https://bellezalocal.es` no resuelve DNS.
- `https://www.bellezalocal.es` no resuelve DNS.
- El dominio antiguo `https://app-estetica.vercel.app` no esta alineado: la home responde 200, pero rutas como `/para-negocios`, `/auth/signin`, `/robots.txt` y `/sitemap.xml` devuelven 404.

Accion recomendada: usar solo `app-estetica-one` hasta cerrar DNS, y despues hacer que `bellezalocal.es` sea el dominio canonico.

## Hallazgos

| Prioridad | Hallazgo | Impacto | Accion |
|---|---|---|---|
| P0 | DNS de `bellezalocal.es` no resuelve | El dominio final no abre | Configurar DNS en proveedor del dominio |
| P0 | Stripe no esta configurado | Pagos, planes y webhooks no operan | Crear productos/precios/webhook y subir variables |
| P0 | Resend no esta configurado | Emails reales no salen | Verificar dominio remitente y subir variables |
| P1 | R2 no esta configurado | Upload de imagenes no operativo | Crear bucket, CORS y variables |
| P1 | Google OAuth no esta configurado | Login social queda desactivado | Configurar OAuth o mantener oculto |
| P1 | n8n no esta auditado | No hay workflows comerciales validados | Autorizar OAuth n8n y revisar workflows |
| P2 | `/api/v1/availability/month` puede ser lenta | Riesgo de latencia en calendario | Optimizar si se usa intensivamente |
| P2 | Vercel CLI termina con `spawn EPERM` en local tras mostrar datos | Molesta la auditoria local, no afecta el deploy | Revisar bloqueo local de Windows/Codex si se repite |

## Siguiente paso recomendado

1. Configurar DNS de `bellezalocal.es`.
2. Actualizar `NEXT_PUBLIC_APP_URL` y `AUTH_URL` a `https://bellezalocal.es` cuando el DNS resuelva.
3. Redeploy en Vercel.
4. Repetir verificacion de `/`, `/robots.txt`, `/sitemap.xml`, login y formulario B2B.
5. Configurar Stripe.
6. Configurar Resend.
7. Configurar R2.
8. Autorizar n8n y auditar/crear workflows.
9. Ejecutar prueba end-to-end completa.
