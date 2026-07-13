# Auditoria integral de bugs y mejoras - Belleza Local

Fecha: 2026-07-13  
Repositorio: `aldeiaagency/app-estetica`  
Commit desplegado en produccion: `5bfa3974bdfb`  
Alcance: codigo, permisos, datos, reservas, pagos, automatizaciones, pruebas, UX responsive y estado de produccion.

## Veredicto ejecutivo

La aplicacion compila, los recorridos normales funcionan y la base de datos esta migrada. La portada tambien responde correctamente en escritorio y movil. Sin embargo, la app **no esta preparada para operar con datos o pagos reales** en su estado actual.

La auditoria ha confirmado cinco grupos de bloqueo critico:

1. Operaciones administrativas ejecutables sin autorizacion dentro de la propia accion.
2. Posible apropiacion de datos de clientas invitadas cuando el email no esta configurado.
3. Lecturas y acciones entre organizaciones expuestas como Server Actions sin validar la sesion.
4. Carreras entre pagos y reservas de stock que pueden devolver stock de pedidos cobrados.
5. Pagos que pueden llegar despues de cancelar o caducar localmente una compra o reserva.

El informe E2E anterior sigue siendo valido como prueba de recorridos felices, pero su conclusion de "parte interna validada" queda sustituida por este informe. Las pruebas E2E no intentaban invocar Server Actions directamente, cambiar de tenant ni provocar concurrencia financiera.

## Escala de gravedad

- `P0 - Critico`: riesgo de acceso no autorizado, fuga de datos, cobro sin servicio o corrupcion financiera. Bloquea cualquier piloto con datos reales.
- `P1 - Alto`: fallo funcional serio, perdida de integridad o riesgo operativo frecuente. Debe resolverse antes de activar la funcionalidad afectada.
- `P2 - Medio`: deuda de seguridad, calidad u operacion que no bloquea por si sola un piloto cerrado.
- `P3 - Mejora`: mejora de mantenibilidad, experiencia o capacidad de crecimiento.

## Evidencia de verificacion

- Build de produccion: correcta. Next genero 55 paginas/rutas sin errores.
- TypeScript: correcto.
- Lint: correcto con 15 avisos por `_legacyOrganizationId` no utilizado.
- Pruebas unitarias: 69 superadas, 1 omitida.
- Cobertura: 12,97% de sentencias y 13,16% de lineas.
- Cobertura de `lib/billing/checkout.ts` y `lib/billing/payment-integrity.ts`: 0%.
- Migraciones: 15 encontradas; Supabase informa `Database schema is up to date`.
- Navegador: home comprobada en 1440x900 y 390x844, sin desbordamiento horizontal, imagenes rotas ni errores de consola.
- Produccion Vercel: `/api/health/live` devuelve 200.
- Readiness de produccion: `/api/health/ready` devuelve 503.
- Dominio: `bellezalocal.es` y `www.bellezalocal.es` no resuelven por DNS desde el entorno de auditoria.
- La suite E2E integral no se repitio: escribe y elimina datos en la base configurada y carece de una proteccion que impida ejecutarla contra produccion.

## Hallazgos P0 - criticos

### P0-01 - Acciones administrativas sin autorizacion interna

**Evidencia**

- `app/actions/admin.ts:9`, `:35`, `:61`, `:92` y `:119` modifican publicacion de centros, planes, SEO y add-ons.
- Ninguna accion llama a `requirePlatformAdmin()`.
- `actorId` llega como argumento del cliente y se guarda en auditoria (`app/actions/admin.ts:11`, `:64`, `:95`, `:123`).

**Impacto**

Una llamada directa a la Server Action puede modificar datos de plataforma y falsificar quien realizo el cambio. Proteger la pagina `/admin` en middleware no protege la accion invocable.

**Correccion**

Ejecutar `requirePlatformAdmin()` al comienzo de cada accion, obtener `actorId` exclusivamente de la sesion y validar inputs con Zod.

### P0-02 - Una cuenta nueva puede reclamar historiales de invitadas por email

**Evidencia**

- Si Resend no esta configurado, el registro marca el email como verificado automaticamente (`app/actions/auth.ts:69` y `:98`).
- El login solo exige verificacion cuando el email esta configurado (`lib/auth/config.ts:77`).
- La exportacion de cuenta agrega clientes, reservas, pedidos y bonos por coincidencia de email (`app/api/account/export/route.ts:91`, `:107`, `:130`, `:149`).

**Impacto**

Alguien puede registrar el email utilizado previamente por una clienta invitada y descargar su historial, datos de contacto, reservas, bonos y pedidos.

**Correccion**

No autoverificar emails. Si el proveedor de correo no esta disponible, bloquear registro/login que dependa de verificacion. Vincular actividad de invitada mediante un enlace firmado enviado al correo, no solo por igualdad de texto.

### P0-03 - Server Actions con acceso entre organizaciones y a datos personales

**Evidencia**

- `getFollowUpMessagesForOrganization(orgId)` acepta un tenant arbitrario y devuelve nombres, emails y mensajes (`app/actions/follow-ups.ts:193`).
- `getRebookingOpportunities(orgId)` repite el patron (`app/actions/follow-ups.ts:231`).
- `scheduleFollowUpsForCompletedBooking()` permite omitir `orgId`; entonces no se ejecuta la comprobacion (`app/actions/follow-ups.ts:364` y `:400`).
- `getBeautyProfile(userId)`, `getOrCreateMonthlyBeautyPlan(userId)`, `getRoutineForUser(userId)` y `getReplenishmentForUser(userId)` aceptan identidad externa en modulos `use server`.

**Impacto**

Fuga de PII y preferencias sensibles entre usuarios o negocios, y programacion no autorizada de comunicaciones.

**Correccion**

Derivar siempre `userId` y `organizationId` de `auth()`/`requireOrganization()`. Mover consultas internas a modulos `server-only` que no exporten Server Actions. Aplicar pertenencia al tenant en la misma consulta SQL.

### P0-04 - Un pedido pagado puede devolver su stock

**Evidencia**

- `fulfillOrderPayment()` marca el pedido como `PAID` dentro de una transaccion (`lib/billing/checkout.ts:40`).
- La reserva de stock se consume despues, fuera de esa transaccion (`lib/billing/checkout.ts:56`).
- La limpieza reclama la reserva y repone stock antes de intentar cancelar solo pedidos `PENDING` (`lib/billing/payment-integrity.ts:65` y `:89`).

**Escenario**

El proceso termina despues de guardar `PAID` pero antes de `consumedAt`. Un reintento sale pronto al ver el pedido pagado. El cron posterior repone el stock aunque el pedido siga cobrado.

**Impacto**

Sobreventa, inventario incoherente y pedidos cobrados sin stock real.

**Correccion**

Bloquear pedido y reserva y escribir `PAID` + `consumedAt` en una unica transaccion. La liberacion debe exigir atomicamente que el pedido siga `PENDING`.

### P0-05 - Cobros posteriores a cancelacion o caducidad local

**Evidencia**

- El webhook acepta `checkout.session.async_payment_succeeded` (`app/api/webhooks/stripe/route.ts:122`).
- Los holds locales expiran a los 30/35 minutos aunque un metodo de pago asincrono pueda liquidarse despues.
- No se persiste `checkoutSessionId`, por lo que cancelar localmente no invalida Checkout.
- Una reserva `CANCELLED` se ignora al llegar el pago (`lib/billing/checkout.ts:188`).
- Un pedido `CANCELLED` provoca error y reintentos (`lib/billing/checkout.ts:45`).

**Impacto**

Una clienta puede ser cobrada cuando el stock ya fue liberado o la cita ya fue cancelada/reasignada.

**Correccion**

Limitar inicialmente Stripe a metodos de pago inmediatos o modelar `PAYMENT_PROCESSING`. Guardar el ID de Checkout, expirar la sesion al cancelar y disponer de compensacion/reembolso automatico si el cobro gana la carrera.

## Hallazgos P1 - altos

### P1-01 - Canje de bonos no autorizado y no atomico

`redeemBonoSessionAction()` confia en el `orgId` recibido y separa lectura y decremento (`app/actions/bonos.ts:101-123`). Dos llamadas con una sesion restante pueden dejar saldo `-1`. Debe usar `requireOrganization()` y un `UPDATE ... WHERE sessionsRemaining > 0 RETURNING`, mas una restriccion `CHECK`.

### P1-02 - Huecos fantasma tras caducar una senal

El motor deja de considerar un hold `PENDING` vencido (`lib/availability/engine.ts:151`), pero la exclusion PostgreSQL sigue bloqueando todos los `PENDING` (`prisma/migrations/20260710090000_booking_overlap_guard/migration.sql:7`). El usuario ve el hueco libre y la creacion falla. El cron de limpieza solo corre una vez al dia (`vercel.json:8`).

### P1-03 - Transiciones manuales rompen pagos e inventario

`updateOrderStatusAction()` permite escribir estados sin consumir/liberar stock ni gestionar reembolsos (`app/actions/dashboard.ts:51`). El dashboard tambien permite confirmar reservas con senal impagada porque no exige `depositPaid` (`app/actions/dashboard.ts:71-131`). Sustituir setters genericos por comandos de negocio con precondiciones y efectos atomicos.

### P1-04 - Paginas de confirmacion exponen PII mediante un ID en la URL

- Pedido: consulta por `id` y muestra email, articulos y total sin sesion ni token (`app/pedido/confirmado/[id]/page.tsx:18` y `:50`).
- Bono: consulta por `id` y muestra email y datos completos (`app/bono/confirmado/[id]/page.tsx:18` y `:61`).
- Reserva: el codigo de ocho caracteres basta para mostrar email y datos (`app/reserva/confirmada/[code]/page.tsx:22` y `:138`).

Ademas, la pagina de pedido muestra "Pedido confirmado" sin comprobar si esta `PENDING` o `CANCELLED` (`app/pedido/confirmado/[id]/page.tsx:48`). Usar token firmado de un solo uso o sesion autenticada y representar el estado real.

### P1-05 - Reservas anonimas pueden sobrescribir identidad y consentimiento

Reserva y lista de espera hacen `upsert` por email+centro y actualizan nombre, telefono y consentimiento sin demostrar control del correo (`app/actions/booking.ts:92-109` y `:236`). No modificar el maestro de cliente desde una solicitud anonima; almacenar datos de la solicitud y aplicar doble opt-in.

### P1-06 - E2E destructivo sin guardia de entorno

`tests/e2e/audit.spec.ts` usa el `DATABASE_URL` disponible y elimina reservas, pedidos, clientes, servicios y el admin indicado al limpiar (`:78-99`). Exigir una base exclusiva de test, rechazar hosts de produccion y requerir una marca explicita como `ALLOW_DESTRUCTIVE_E2E=true`.

### P1-07 - Credenciales conocidas en seeds

`scripts/seed-admin.ts:7`, `prisma/seed.mjs:334` y `prisma/seed-pilot-belleza.mjs:22` contienen contrasenas conocidas. Algunos seeds hacen `upsert`, por lo que pueden restablecer una cuenta real. Bloquear ejecucion en produccion y tomar credenciales aleatorias desde entorno.

### P1-08 - Crons de mensajes sin claim ni idempotencia

Recordatorios y follow-ups seleccionan pendientes, envian y despues actualizan. Dos ejecuciones concurrentes pueden duplicar emails. Los lotes son secuenciales, limitados y no drenan backlog. Implementar claim atomico (`FOR UPDATE SKIP LOCKED`), idempotency key, reintentos y cola de fallos.

### P1-09 - Frecuencia incompatible con la duracion de los holds

Los holds duran 30/35 minutos y el stock en tienda 24 horas, pero Vercel ejecuta limpieza una vez al dia (`vercel.json:7-13`). Un stock puede quedar reservado casi 48 horas y un hueco casi 24 horas. Mover estas tareas a una cola/worker o a un scheduler con frecuencia de minutos.

### P1-10 - Despliegue sin migracion de produccion

`npm run build` genera Prisma y compila, pero no ejecuta `prisma migrate deploy` (`package.json:7`). El CI migra una base efimera, no Supabase. Anadir un paso de migracion controlado antes de promover el despliegue y ampliar readiness con comprobaciones de esquema.

### P1-11 - Entrega n8n sin garantia

`lib/integrations/n8n.ts:16` envia PII sin firma HMAC, idempotencia ni reintentos, y absorbe errores. Un lead puede guardarse pero no llegar al equipo comercial. Usar outbox persistente, firma, clave idempotente, reintentos y alerta de elementos pendientes.

### P1-12 - El alta Growth crea el tipo de cuenta equivocado

El CTA B2B usa `/auth/signup?plan=growth` (`app/para-negocios/page.tsx:148`), pero signup solo interpreta `tipo=negocio` (`app/auth/signup/page.tsx:10`). El alta se presenta como cuenta de cliente y, aunque llegara como negocio, el servidor crea siempre plan `BASIC` (`app/actions/auth.ts:86`). Unificar el funnel B2B y conservar tipo de cuenta, plan y origen hasta checkout/activacion.

### P1-13 - Dashboard y administracion no tienen navegacion movil funcional

Ambos sidebars se ocultan bajo `md` (`app/(dashboard)/layout.tsx:23` y `app/(admin)/layout.tsx:19`). Dashboard muestra un boton de menu sin accion (`app/(dashboard)/layout.tsx:38`) y admin no ofrece alternativa. Implementar drawer accesible y pruebas responsive de todas las rutas privadas.

### P1-14 - Enlaces visibles del dashboard terminan en 404

La navegacion ofrece `/dashboard/promociones`, `/dashboard/resenas` y `/dashboard/analitica` (`components/dashboard/sidebar-nav.tsx:47-58`), pero esas paginas no existen. Ocultar los enlaces hasta implementar las vistas o crear las pantallas reales.

### P1-15 - Login ignora el destino solicitado

El formulario descarta `callbackUrl` y siempre navega a `/dashboard` (`components/auth/signin-form.tsx:37`). Una clienta que inicia sesion para volver a cuenta, diagnostico u otra ruta protegida acaba redirigida al inicio por no tener rol de negocio. Validar y respetar un callback interno seguro; usar un destino por rol solo cuando no exista callback.

### P1-16 - El carrito se borra antes de completar el pago

Checkout llama a `clearCart()` antes de salir hacia Stripe (`app/checkout/page.tsx:65`). Si la redireccion falla o la clienta cancela, pierde el carrito. Ademas, carrito y checkout renderizan vacio antes de hidratar `localStorage` (`components/ecommerce/cart-provider.tsx:31-45`). Mantener el carrito hasta confirmacion del webhook y mostrar un estado de hidratacion.

### P1-17 - Las flags no se reflejan en navegacion y marketing

Cabecera y home enlazan Marketplace, Rutina, productos y bonos aunque esten desactivados. Middleware devuelve al inicio con `?feature=unavailable`, pero la home no explica el motivo. Ocultar funciones apagadas o mostrar una pantalla explicita de proximamente, nunca un CTA que parece roto.

### P1-18 - Errores de servicio se presentan como resultados vacios

Reserva convierte fallos de disponibilidad en listas vacias (`components/booking/booking-wizard.tsx:181`) y busqueda convierte errores de base en "No encontramos centros" (`app/buscar/page.tsx:121`). Diferenciar carga, vacio real, error recuperable y caida del servicio; registrar y alertar el error tecnico.

## Hallazgos P2 - medios

### P2-01 - Credencial Vercel en un archivo no ignorado

`.env.production` contiene `VERCEL_OIDC_TOKEN`, no esta versionado pero tampoco ignorado. La build local lo carga automaticamente. Eliminarlo del proyecto, rotarlo, anadir `.env.production` a `.gitignore` y activar secret scanning.

### P2-02 - Rate limiting fail-open e inconsistente

Middleware usa un `Map` local por instancia (`middleware.ts:18`) y Server Actions caen tambien a memoria local si Upstash falla (`lib/security/rate-limit.ts:86`). En serverless se puede eludir cambiando de instancia. Aplicar un unico backend distribuido y definir fail-closed para auth, exportacion y operaciones sensibles.

### P2-03 - Buffers de agenda aplicados de forma incoherente

`endAt` ya incluye buffers, pero al leer reservas el motor vuelve a restar el buffer anterior del servicio candidato (`lib/availability/engine.ts:183`). Puede ocultar huecos validos. Persistir por separado hora visible e intervalo ocupado, o tratar `startAt/endAt` como intervalo final sin expandir de nuevo.

### P2-04 - Readiness superficial y demasiado informativo

`app/api/health/ready/route.ts:12` valida varias integraciones solo por presencia de variables y publica flags/estado interno. No detecta claves invalidas ni columnas ausentes. Separar readiness interno autenticado de una respuesta publica minima.

### P2-05 - Retencion publicada no implementada

La politica de privacidad promete plazos (`app/privacidad/page.tsx:73`), pero el cron solo elimina tokens y eventos Stripe (`app/api/cron/data-retention/route.ts:15`). Implementar matriz de retencion, anonimizado, excepciones legales y evidencias de ejecucion.

### P2-06 - Cobertura insuficiente en superficies criticas

La cobertura global es 13,16% de lineas y 0% en checkout, integridad de pagos, rate limit, n8n y autenticacion. No hay umbrales. Anadir pruebas de autorizacion por rol/tenant, concurrencia, webhooks duplicados, cancelacion vs pago y crons concurrentes.

### P2-07 - Dependencia con aviso moderado

`npm audit` informa dos vulnerabilidades moderadas relacionadas con PostCSS dentro de Next. No hay vulnerabilidades altas o criticas. Actualizar Next/PostCSS cuando exista una ruta compatible; no aplicar el downgrade forzado sugerido por npm.

### P2-08 - Arquitectura documentada distinta de la real

La documentacion afirma aislamiento automatico mediante middleware Prisma/RLS, pero la proteccion real depende de filtros manuales y no hay politicas RLS en migraciones. Corregir la documentacion y, preferiblemente, introducir una capa de repositorios tenant-aware mas restricciones en base.

### P2-09 - Requisitos de contrasena contradictorios

Signup y reset indican ocho caracteres (`app/auth/signup/page.tsx:77` y `app/auth/reset-password/page.tsx:28`), mientras el servidor exige diez, mayuscula, minuscula y numero (`app/actions/auth.ts:13-18`). Compartir un unico esquema y mostrar todos los requisitos antes de enviar.

### P2-10 - Formularios con etiquetas y controles no accesibles

Reservas, checkout, login, alta y lead B2B contienen etiquetas sin asociacion `htmlFor`/`id`; los botones de mostrar contrasena carecen de nombre accesible. Centralizar campos con label, descripcion de error, foco y `aria-live`, y anadir axe al CI.

### P2-11 - Politica de cancelacion contradictoria

Terminos dice que cada centro define su politica (`app/terminos/page.tsx:75`), la interfaz promete 24 horas y el servidor impone 24 horas para todos (`app/actions/booking.ts:309-316`). Modelar la politica por centro/servicio y usar esa misma fuente en legal, UI y backend.

### P2-12 - `seoNoindex` no se respeta en metadatos de centro

Sitemap excluye centros marcados, pero la pagina de centro puede seguir generando `robots.index=true` (`app/centro/[slug]/page.tsx:34`). Aplicar `seoNoindex` a metadata, enlaces internos y cualquier landing relacionada.

### P2-13 - Datos estructurados de resenas inconsistentes

El promedio se calcula sobre una muestra limitada de resenas, mientras `reviewCount` puede incluir un conjunto distinto (`app/centro/[slug]/page.tsx:68` y `:122`). Calcular promedio y recuento sobre la misma consulta aprobada para no publicar JSON-LD enganoso.

### P2-14 - Sin estados globales propios de carga, error y 404

No existen limites `loading.tsx`, `error.tsx` y `not-found.tsx` de producto. Las esperas y errores caen en pantallas genericas de Next. Anadirlos con recuperacion, trazabilidad y lenguaje coherente con la marca.

## Estado de experiencia y frontend

### Correcto

- Home sin errores de consola, imagenes rotas ni enlaces vacios.
- Sin scroll horizontal en 1440x900 ni 390x844.
- En movil no se detectaron textos recortados en la home.
- Existe enlace de salto al contenido y jerarquia de headings razonable.
- Navegacion principal se adapta a menu movil.

### Mejoras recomendadas

1. Anadir pruebas automatizadas de accesibilidad con axe para formularios, dialogos, dashboard y checkout.
2. Comprobar todos los estados financieros en UI: pendiente, procesando, pagado, cancelado, reembolsado y error.
3. Evitar que una pagina de exito dependa de un parametro `?paid=1`; debe leer un estado verificado del servidor.
4. Anadir estados de recuperacion cuando email, Stripe, storage o n8n no esten disponibles.
5. Sustituir credenciales e imagenes piloto antes de abrir la app al publico.
6. Completar drawer movil, enlaces de navegacion y callback de login antes del piloto de centros.
7. Mantener el carrito hasta confirmacion de pago y separar hidratacion de estado vacio.
8. Centralizar politicas de cancelacion, calculo de resenas y metadatos SEO.

## Estado real de produccion

- Alias Vercel operativo: `https://app-estetica-one.vercel.app`.
- Liveness: 200 en commit `5bfa3974bdfb`.
- Readiness: 503 porque falta rate limiting distribuido.
- Stripe, webhook Stripe, email y storage no estan configurados en produccion.
- Flags activas: marketplace y follow-ups.
- Flags apagadas: products, bonos, beautyConcierge, aiRecommendations, campaigns y wallet.
- `bellezalocal.es` y `www.bellezalocal.es` no tienen resolucion DNS observable.
- Los cambios locales de endurecimiento y esta auditoria aun no estan desplegados.

## Plan de correccion recomendado

### Bloque 1 - Cerrar seguridad y aislamiento

- Resolver P0-01, P0-02 y P0-03.
- Cerrar IDOR de perfiles y paginas de confirmacion.
- Proteger seeds y E2E.
- Anadir pruebas negativas por rol, usuario y tenant.

**Criterio de salida:** ningun dato o accion cambia al manipular IDs, emails, roles u organizaciones.

### Bloque 2 - Reconstruir integridad de pagos

- Resolver P0-04 y P0-05.
- Modelar estados explicitos y transiciones atomicas.
- Guardar Checkout Session, idempotency keys y compensaciones.
- Probar concurrencia, reintentos y pagos tardios.

**Criterio de salida:** todo cobro termina en servicio/stock reservado o reembolso trazable, nunca en un estado silencioso.

### Bloque 3 - Corregir agenda, bonos y procesos de fondo

- Alinear constraint y disponibilidad.
- Atomicidad de canje de bonos.
- Scheduler con frecuencia adecuada.
- Claims e idempotencia para mensajes y n8n.
- Reparar alta B2B, navegacion movil, enlaces 404, callback y carrito.

**Criterio de salida:** no hay huecos fantasma, saldos negativos ni mensajes duplicados en pruebas concurrentes.

### Bloque 4 - Operacion y lanzamiento

- Migraciones automatizadas y readiness real.
- Upstash, email, DNS, observabilidad y alertas.
- Stripe/storage solo cuando los bloques anteriores esten cerrados.
- Elevar cobertura y fijar umbrales de CI.

**Criterio de salida:** readiness 200, dominio operativo, rollback ensayado y alertas verificadas.

## Recomendacion comercial

## Cierre de remediacion - 13 de julio de 2026

### Resultado

Los 5 hallazgos P0 y los 18 hallazgos P1 han sido corregidos en codigo. Los 14 P2 tienen remediacion aplicada o un control explicito. La activacion en produccion requiere desplegar las migraciones nuevas y configurar los secretos externos indicados al final de esta seccion.

| Hallazgo | Estado | Evidencia principal |
|---|---|---|
| P0-01 a P0-03 | Resuelto | Autorizacion derivada de sesion, filtros por tenant en la consulta y exportacion vinculada por `userId`; pruebas negativas de autorizacion. |
| P0-04 y P0-05 | Resuelto | Estados de pago, stock y compensaciones atomicos; Checkout idempotente y reembolsos durables. |
| P1-01 a P1-03 | Resuelto | Canje atomico autorizado, holds oportunistas y transiciones financieras protegidas. |
| P1-04 | Resuelto | Confirmaciones de pedidos y reservas exigen token HMAC; bonos exigen usuario propietario. |
| P1-05 | Resuelto | Los `upsert` anonimos no sobrescriben identidad, telefono ni consentimientos existentes. |
| P1-06 y P1-07 | Resuelto | E2E destructivo exige opt-in y base segura; seeds exigen flag y contrasena externa. |
| P1-08 y P1-09 | Resuelto | Claims atomicos, reintentos limitados, recuperacion de claims y frecuencia de holds alineada. |
| P1-10 | Resuelto | `vercel-build` ejecuta `prisma migrate deploy` antes de compilar. |
| P1-11 | Resuelto | Outbox transaccional para n8n, firma HMAC, id de evento, reintentos exponenciales y estado terminal. |
| P1-12 a P1-17 | Resuelto | Plan de alta validado, menus moviles, enlaces muertos retirados, callback de login, carrito postpago y flags en navegacion. |
| P1-18 | Resuelto | Busqueda propaga caidas al estado global; agenda diferencia error tecnico de disponibilidad vacia. |
| P2-01 | Resuelto en repositorio | `.env.production` eliminado e ignorado. La credencial historica debe rotarse en Vercel. |
| P2-02 a P2-04 | Resuelto | Rate limit distribuido y fail-closed en produccion, buffers corregidos y readiness publico minimo. |
| P2-05 | Resuelto | Cron con matriz de 90 dias/12 meses/5 anos, anonimizacion y `DataRetentionRun` como evidencia. |
| P2-06 | Controlado | 91 pruebas y umbrales de cobertura obligatorios. Las 7 integraciones PostgreSQL quedan preparadas y se ejecutan solo contra una base de pruebas aislada. |
| P2-07 | Resuelto | Override seguro de PostCSS; `npm audit --omit=dev --audit-level=moderate` informa 0 vulnerabilidades. |
| P2-08 a P2-14 | Resuelto | Arquitectura real documentada, contrasenas coherentes, labels criticos asociados, cancelacion configurable, SEO/JSON-LD y estados globales. |

### Verificacion ejecutada

- `prisma format`, `prisma validate` y `prisma generate`: correctos.
- TypeScript: correcto, sin errores.
- Vitest: 91 pruebas superadas y 7 integraciones PostgreSQL omitidas por ausencia deliberada de `DATABASE_URL` de test.
- Cobertura: 13,69% statements, 10,88% branches, 18,39% functions y 14,19% lines; umbral CI activo para impedir regresiones.
- Build Next.js de produccion: correcto, 57 paginas generadas.
- Dependencias de produccion: 0 vulnerabilidades moderadas, altas o criticas.
- `git diff --check`: correcto; solo avisos de conversion CRLF del entorno Windows.

### Activacion externa pendiente

1. Aplicar las migraciones mediante el despliegue de Vercel o `prisma migrate deploy` con las URLs de Supabase.
2. Configurar `N8N_WEBHOOK_SIGNING_SECRET` en Vercel y validar la firma `x-belleza-signature` en n8n.
3. Configurar Upstash en produccion; el sistema falla cerrado si el backend distribuido no esta disponible.
4. Rotar la credencial Vercel que estuvo en `.env.production` y activar secret scanning en GitHub.
5. Ejecutar las 7 pruebas PostgreSQL contra una base efimera de staging, nunca contra produccion.

No captar todavia centros para usar pagos, bonos, campanas o datos reales. Se puede hacer demostracion interna o comercial con datos ficticios y sin activar cobros, siempre que el acceso al entorno quede restringido.

El primer piloto real debe esperar al cierre completo de los P0 y de los P1 que afecten al alcance elegido. Para un lanzamiento publico deben cerrarse todos los P1. Productos, bonos y pagos deben permanecer desactivados hasta terminar el bloque de integridad financiera.
