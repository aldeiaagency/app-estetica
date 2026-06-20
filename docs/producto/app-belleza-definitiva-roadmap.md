# App Belleza Definitiva - Roadmap operativo

Documento vivo para transformar `aldeiaagency/app-estetica` desde marketplace/SaaS de reservas hacia:

> beauty concierge personalizado + marketplace curado + sistema de fidelizacion para negocios.

Fecha de arranque: 2026-06-19

## Como usar este documento

- Al empezar una fase, cambiar su estado a `En curso`.
- Al cerrar una tarea, marcarla con `[x]` y anadir una nota breve si hubo decisiones relevantes.
- Al cerrar una fase, verificar sus criterios de aceptacion y mover lo pendiente a la siguiente fase o a "Pendientes no bloqueantes".
- No borrar tareas historicas importantes: marcarlas como resueltas para mantener trazabilidad.
- Si una tarea deja de tener sentido, marcarla como `Descartada` en notas, explicando por que.

## Estado global

| Fase | Estado | Objetivo |
|---|---|---|
| 0 - Planificacion definitiva | Completada | Convertir el brief estrategico en roadmap ejecutable |
| 1 - Reposicionamiento y base B2C | Completada | Home, diagnostico, Beauty Profile y primer Beauty Plan |
| 2 - Plan, wallet y beneficios | Completada | Persistir planes, beneficios y wallet de usuaria |
| 3 - Packs por objetivo | Completada | Convertir bonos visibles en packs orientados a resultado |
| 4 - Seguimiento y recurrencia B2B | Completada | Follow-ups, campanas y oportunidades de rebooking |
| 5 - Productos inteligentes | Completada | Rutinas, reposicion y recomendaciones por perfil |
| 6 - B2B pricing y pagina negocios | Completada | Reposicionar negocio hacia fidelizacion, LTV y planes nuevos |
| 7 - Ranking, calidad y SEO/GEO | Completada | Marketplace curado, ranking por encaje y contenido escalable |
| 8 - QA, legal y piloto | Completada | Cierre de riesgos, GDPR, pruebas y piloto controlado |

## Principios no negociables

- La app no debe sentirse como un catalogo frio de centros.
- La entrada principal B2C debe ser: "Cuentanos que quieres mejorar".
- Cada recomendacion debe explicar el motivo.
- La app debe poder decir que algo no conviene todavia.
- Evitar datos medicos, diagnosticos clinicos y promesas de resultado.
- Mostrar precios o rangos siempre que sea posible.
- Priorizar recurrencia como ayuda, no como presion.
- Mantener la base existente: reservas, centros, productos, bonos, dashboard, admin, Stripe y Auth.

## Fase 0 - Planificacion definitiva

Estado: Completada

Objetivo: dejar preparada la hoja de ruta para ejecutar la nueva vision sin reconstruir la app desde cero.

Tareas:

- [x] Revisar brief estrategico externo.
- [x] Revisar estructura real del repositorio.
- [x] Confirmar stack y piezas existentes.
- [x] Separar roadmap nuevo del roadmap MVP anterior.
- [x] Crear checklist vivo por fases.
- [x] Definir criterios de aceptacion por fase.

Notas:

- El repo ya contiene base suficiente para evolucionar: reservas, marketplace, productos, bonos, cuenta, dashboard, admin, Auth, Stripe y Prisma.
- Las rutas se implementaran como `/diagnostico`, `/mi-plan`, `/wallet`, `/rutina`, `/reposicion`, etc. La carpeta tecnica seguira siendo `app/`.
- El modelo `Plan` actual no coincide todavia con el pricing definitivo. Se ajustara en Fase 6 para evitar romper facturacion antes de tiempo.

## Fase 1 - Reposicionamiento y base B2C

Estado: Completada

Objetivo: que la app deje de parecer solo marketplace y empiece a sentirse como concierge de belleza.

Entregables:

- [x] Reescribir home con propuesta "Tu belleza, bien elegida".
- [x] Cambiar CTA principal a "Crear mi Beauty Profile".
- [x] Mantener buscador como CTA secundaria.
- [x] Crear ruta `/diagnostico`.
- [x] Crear modelo `BeautyProfile`.
- [x] Crear modelo `BeautyGoal`.
- [x] Anadir relacion `User -> BeautyProfile`.
- [x] Crear migracion `20260619120000_add_beauty_profile`.
- [x] Crear accion de servidor para guardar diagnostico.
- [x] Crear reglas iniciales de recomendacion sin IA compleja.
- [x] Crear ruta `/mi-plan`.
- [x] Mostrar plan inicial basado en reglas.
- [x] Mostrar al menos una recomendacion positiva y una recomendacion de evitar.
- [x] Explicar el "por que" en cada recomendacion.
- [x] Conectar CTAs hacia `/buscar` y `/productos`.
- [x] Anadir estados vacios y errores cuidados.
- [x] Ejecutar `prisma generate`.
- [x] Ejecutar `npm run type-check`.
- [x] Ejecutar tests relevantes.

Criterios de aceptacion:

- Una usuaria autenticada puede completar el diagnostico.
- Se crea o actualiza su `BeautyProfile`.
- Puede llegar a `/mi-plan` y ver una recomendacion personalizada.
- La home comunica la nueva vision en el primer viewport.
- No se piden datos medicos ni sensibles.

Riesgos:

- Si el diagnostico se hace muy largo, bajara la conversion.
- Si se intenta hacer IA desde el inicio, se retrasara el MVP y aumentara el riesgo legal.
- Hay que decidir si visitantes no autenticadas pueden empezar diagnostico y registrarse al final.

Notas de ejecucion:

- `npm run type-check` completado correctamente.
- `npm run test` completado correctamente: 61 tests pasan.
- Historico: `prisma generate` fallo inicialmente en este entorno Windows con `spawn EPERM`.
- Resuelto en Fase 8: `npm run build` ejecuto `prisma generate` correctamente y genero el cliente Prisma.
- Historico: `next build` directo tambien fallo inicialmente con `spawn EPERM` durante la creacion de build optimizada.
- Resuelto en Fase 8: `npm run build` completo correctamente.
- Cierre total 2026-06-20: migracion aplicada en base real y verificada en historial Prisma.

## Fase 2 - Plan, wallet y beneficios

Estado: Completada

Objetivo: convertir el primer plan en una experiencia recurrente con beneficios visibles.

Entregables:

- [x] Crear modelo `BeautyPlan`.
- [x] Crear modelo `BeautyPlanItem`.
- [x] Crear modelo `BeautyBenefit`.
- [x] Crear modelo `UserBenefit`.
- [x] Crear migracion `20260619123000_add_beauty_plan_wallet`.
- [x] Crear acciones para crear/regenerar plan mensual.
- [x] Crear acciones para marcar, omitir o descartar items.
- [x] Crear ruta `/wallet`.
- [x] Mostrar beneficios activos, bonos, productos recurrentes y ahorro estimado.
- [x] Permitir beneficios por centro desde base de datos.
- [x] Crear dashboard `/dashboard/beneficios` para publicar/pausar beneficios.
- [x] Mostrar beneficios en ficha de centro.
- [x] Mostrar "beneficio activo" en cards de centros cuando aplique.
- [x] Crear componentes base en `components/beauty`.
- [x] Ejecutar type-check y tests.
- [x] Aplicar migracion en base de datos.
- [x] Ejecutar `prisma generate` cuando el entorno no bloquee el generador.

Criterios de aceptacion:

- Una usuaria ve beneficios activos en `/wallet`.
- El plan mensual se persiste en base de datos.
- La ficha de centro muestra beneficios cuando existen.
- El sistema distingue recomendacion, recordatorio, beneficio y evitar.

Notas de ejecucion:

- `npm run type-check` completado correctamente.
- `npm run test` completado correctamente: 61 tests pasan.
- Cierre 2026-06-20: migracion aplicada en base real y verificada en historial Prisma.

## Fase 3 - Packs por objetivo

Estado: Completada

Objetivo: pasar de bonos tipo sesiones a packs orientados a resultado, sin romper los bonos existentes.

Entregables:

- [x] Crear modelo `BeautyPack`.
- [x] Crear modelo `BeautyPackItem`.
- [x] Crear migracion `20260619130000_add_beauty_packs`.
- [x] Mantener `Bono` como compatibilidad o producto legacy.
- [x] Crear ruta `/dashboard/packs`.
- [x] Crear componente `components/business/pack-builder.tsx`.
- [x] Mostrar packs en ficha de centro.
- [x] Mostrar packs recomendados en `/mi-plan`.
- [x] Reescribir copy visible de bonos hacia packs/planes por objetivo.
- [x] Definir si un pack se compra por flujo de bono, carrito o checkout propio.
- [x] Ejecutar type-check y tests.
- [x] Aplicar migracion en base de datos.
- [x] Ejecutar `prisma generate` cuando el entorno no bloquee el generador.
- [x] Ejecutar build completa cuando el entorno no bloquee procesos internos de Next.

Criterios de aceptacion:

- Un negocio puede crear un pack por objetivo.
- Una usuaria puede ver para quien es, para quien no es, que incluye y precio.
- Los bonos existentes siguen funcionando.

Notas de ejecucion:

- Decision MVP de compra: si el pack tiene `bonoId`, usa el flujo existente de bono; si no, lleva a reserva del centro. Checkout propio de pack queda fuera de esta fase.
- `npm run type-check` completado correctamente.
- `npm run test` completado correctamente: 61 tests pasan.
- Intento de servidor local en puerto 3013 bloqueado por `spawn EPERM` de Next en este entorno.
- Cierre 2026-06-20: migracion aplicada en base real y verificada en historial Prisma.

## Fase 4 - Seguimiento y recurrencia B2B

Estado: Completada

Objetivo: ayudar al negocio a que clientas puntuales vuelvan con seguimiento util y no invasivo.

Entregables:

- [x] Crear modelo `FollowUpTemplate`.
- [x] Crear modelo `FollowUpMessage`.
- [x] Crear migracion `20260619133000_add_follow_ups`.
- [x] Crear ruta `/dashboard/seguimientos`.
- [x] Crear ruta `/dashboard/campanas`.
- [x] Crear ruta `/dashboard/recurrencia`.
- [x] Crear plantillas iniciales por categoria: manicura, facial, coloracion.
- [x] Programar follow-ups tras reserva completada.
- [x] Separar comunicaciones transaccionales, seguimiento y marketing.
- [x] Anadir oportunidades de rebooking en dashboard.
- [x] Preparar canales MVP: email e in-app.
- [x] Dejar WhatsApp/SMS como post-MVP o add-on.
- [x] Ejecutar type-check y tests.
- [x] Aplicar migracion en base de datos.
- [x] Ejecutar `prisma generate` cuando el entorno no bloquee el generador.
- [x] Ejecutar build completa cuando el entorno no bloquee procesos internos de Next.

Criterios de aceptacion:

- Tras completar una reserva se pueden generar mensajes programados.
- El negocio ve oportunidades de repeticion.
- Ninguna comunicacion promocional se envia sin opt-in.

Notas de ejecucion:

- La generacion automatica se engancha a `updateBookingStatusAction` cuando una reserva pasa a `COMPLETED`.
- Marketing queda separado en `/dashboard/campanas`; las campanas solo se programan para `Customer.marketingConsent = true`.
- Canales MVP: `EMAIL` e `IN_APP`. WhatsApp/SMS quedan fuera de esta fase.
- `npm run type-check` completado correctamente.
- `npm run test` completado correctamente: 61 tests pasan.
- `npx prisma validate` completado correctamente usando URLs locales ficticias.
- Cierre 2026-06-20: migracion aplicada en base real y verificada en historial Prisma.

## Fase 5 - Productos inteligentes

Estado: Completada

Objetivo: hacer que productos y recompra funcionen segun rutina, perfil y reposicion.

Entregables:

- [x] Crear modelo `BeautyRoutine`.
- [x] Crear modelo `BeautyRoutineStep`.
- [x] Crear modelo `ProductUsage`.
- [x] Crear migracion `20260619140000_add_beauty_routines`.
- [x] Crear ruta `/rutina`.
- [x] Crear ruta `/reposicion`.
- [x] Anadir etiquetas de recomendacion en productos.
- [x] Anadir campos de producto para uso, duracion, compatibilidad y alternativa.
- [x] Permitir guardar producto en rutina.
- [x] Permitir activar recordatorio de reposicion.
- [x] Permitir pausar o marcar producto terminado.
- [x] Mostrar productos recomendados por perfil en `/mi-plan`.
- [x] Mostrar senales de rutina/reposicion en listado y ficha de producto.
- [x] Ejecutar `npx prisma validate`.
- [x] Ejecutar `npm run type-check`.
- [x] Ejecutar `npm run test`.
- [x] Aplicar migracion en base de datos.
- [x] Ejecutar `prisma generate` cuando el entorno no bloquee el generador.
- [x] Ejecutar build completa cuando el entorno no bloquee procesos internos de Next.

Criterios de aceptacion:

- Una usuaria puede guardar productos en su rutina.
- La app puede sugerir reposicion o alternativa.
- La ficha de producto explica para quien es, para quien no es y como usarlo.

Notas de ejecucion:

- El panel de productos permite informar paso de rutina, etiquetas, duracion estimada, reposicion, compatibilidad, para quien es, para quien no es y como usarlo.
- `/rutina` permite revisar productos guardados, pausar, reanudar, marcar terminado, quitar y activar/desactivar avisos.
- `/reposicion` muestra productos en seguimiento, estado de reposicion, fecha estimada y alternativa si existe.
- `/mi-plan` muestra productos recomendados por perfil y permite guardarlos en rutina.
- `npx prisma validate`, `npm run type-check` y `npm run test` completados correctamente; 61 tests pasan.
- Cierre 2026-06-20: migracion aplicada en base real y verificada en historial Prisma.

## Fase 6 - B2B pricing y pagina negocios

Estado: Completada

Objetivo: alinear la propuesta B2B con fidelizacion, LTV y planes definitivos.

Entregables:

- [x] Reescribir `/para-negocios`.
- [x] Eliminar metricas o testimonios no verificables.
- [x] Cambiar foco de "agenda online" a "clientas recurrentes".
- [x] Definir planes: Presencia, Growth, Elite, Partner.
- [x] Decidir migracion tecnica desde `BASIC / PRO / GROWTH / PREMIUM`.
- [x] Actualizar `lib/billing/plans.ts`.
- [x] Actualizar mapas de precios Stripe cuando existan price IDs definitivos.
- [x] Actualizar `/precios` si muestra planes B2B.
- [x] Revisar add-ons y feature gating.
- [x] Actualizar dashboard de plan y admin de planes.
- [x] Ejecutar tests de billing.
- [x] Ejecutar `npm run type-check`.
- [x] Ejecutar `npm run test`.

Criterios de aceptacion:

- La pagina B2B vende diferenciacion, no solo agenda.
- Los precios visibles coinciden con billing y documentacion.
- No quedan claims comerciales falsos o no demostrables.

Notas de ejecucion:

- Decision de migracion: se conservan los enums tecnicos `BASIC`, `PRO`, `GROWTH` y `PREMIUM` para no romper Stripe ni organizaciones existentes.
- Mapeo visible: `BASIC -> Presencia`, `PRO -> Growth`, `GROWTH -> Elite`, `PREMIUM -> Partner`.
- Precios visibles salen de `PLAN_PRICES_CENTS`: Presencia 24 EUR/mes, Growth 59 EUR/mes, Elite 149 EUR/mes, Partner 399 EUR/mes.
- `lib/billing/price-map.ts` acepta variables Stripe antiguas y aliases nuevos: `STRIPE_PRICE_PRESENCIA_MONTHLY`, `STRIPE_PRICE_B2B_GROWTH_MONTHLY`, `STRIPE_PRICE_ELITE_MONTHLY`, `STRIPE_PRICE_PARTNER_MONTHLY`.
- WhatsApp/SMS se mantienen como capacidad avanzada/add-on, no como promesa base de todos los planes.
- `npm run type-check` y `npm run test` completados correctamente; 61 tests pasan.

## Fase 7 - Ranking, calidad y SEO/GEO

Estado: Completada

Objetivo: hacer que el marketplace sea curado y que las recomendaciones escalen con calidad.

Entregables:

- [x] Anadir filtros: recomendado para mi, precio claro, seguimiento, beneficios, packs.
- [x] Mejorar cards de centros con "ideal para" y beneficio activo.
- [x] Definir scoring de ranking por perfil, disponibilidad, calidad y precio claro.
- [x] Limitar impacto de featured listings por calidad minima.
- [x] Mejorar resenas con contexto de servicio y objetivo.
- [x] Revisar SEO programatico para nuevas categorias de intencion.
- [x] Preparar contenido para sistemas de IA: respuestas claras, entidades, FAQs, estructura.
- [x] Ejecutar `npm run type-check`.
- [x] Ejecutar `npm run test`.
- [x] Ejecutar `npx prisma validate`.

Criterios de aceptacion:

- El listado no se ordena solo por destacado o volumen.
- Las cards explican por que un centro puede encajar.
- SEO/GEO refuerza busquedas de intencion, no paginas vacias.

Notas de ejecucion:

- Se crea `lib/marketplace/ranking.ts` con scoring por perfil, precio visible, calidad, packs, beneficios, seguimiento y destacado comercial limitado por calidad minima.
- `/buscar` incorpora filtros de intencion y ordena por ranking curado en vez de depender solo de volumen o prioridad comercial.
- Las cards explican "ideal para" y muestran motivos de encaje.
- La ficha de centro muestra senales de precio, packs, beneficios y seguimiento, y las resenas incluyen contexto del servicio reservado cuando existe.
- Las landings `/s/[ciudad]` y `/s/[ciudad]/[categoria]` mantienen `notFound()` cuando no hay centros, muestran respuestas directas y anaden FAQPage JSON-LD visible para SEO/GEO.
- `npm run type-check` completado correctamente.
- `npm run test` completado correctamente: 61 tests pasan.
- `npx prisma validate` completado correctamente usando URLs locales ficticias para `DATABASE_URL` y `DIRECT_URL`.

## Fase 8 - QA, legal y piloto

Estado: Completada

Objetivo: preparar salida controlada con riesgos reducidos.

Entregables:

- [x] Auditoria GDPR de nuevos datos.
- [x] Consentimiento explicito para personalizacion.
- [x] Consentimiento separado para marketing.
- [x] Flujo de borrado/exportacion de datos.
- [x] Revisar textos para evitar claims medicos.
- [x] Ejecutar `npm run type-check`.
- [x] Ejecutar `npm run test`.
- [x] Ejecutar `npm run build`.
- [x] Revisar responsive de rutas nuevas.
- [x] Preparar checklist de piloto con usuarias y negocios.

Criterios de aceptacion:

- La app puede probarse con usuarias reales sin recoger datos sensibles.
- Los negocios entienden el valor de recurrencia y seguimiento.
- El equipo puede medir conversion de Beauty Profile, vuelta a `/mi-plan` y beneficios reclamados.

Notas de ejecucion:

- Se crea auditoria GDPR de Fase 8 en `docs/tecnico/gdpr-auditoria-fase-8.md`.
- Se crea checklist de piloto en `docs/producto/checklist-piloto-app-belleza.md`.
- `/cuenta` permite descargar datos en JSON, retirar marketing y borrar datos de personalizacion.
- Se anade `/api/account/export` para portabilidad de datos de cuenta, personalizacion, reservas, pedidos y bonos.
- Se anade accion de borrado de Beauty Profile, Beauty Plan, wallet, rutina, reposicion y retirada de marketing.
- Registro valida aceptacion de terminos/privacidad tambien en servidor.
- Politica de privacidad actualizada para Beauty Profile, rutinas, reposicion, marketing separado y derechos desde cuenta.
- Se sustituyen textos visibles de "diagnostico" por "Beauty Profile", "perfil" o "asesoria" cuando podian sonar clinicos.
- `npm run type-check`, `npm run test`, `npx prisma validate` y `npm run build` completados correctamente.
- `npm run build` ejecuto `prisma generate` correctamente y genero el cliente Prisma.
- La build termina con warnings conocidos de Auth.js/Jose sobre `CompressionStream` en Edge Runtime, sin fallar compilacion.
- Base real actualizada el 2026-06-20: 9/9 migraciones registradas, sin rollbacks, y tablas nuevas verificadas.

## Pendientes transversales

- [ ] Decidir nombre visible definitivo: mantener `Belleza Local` o evolucionar a marca mas aspiracional.
- [ ] Definir si Beauty Profile permite empezar sin login y guardar al registrarse.
- [ ] Definir copy exacto para privacidad y consentimiento de personalizacion.
- [ ] Revisar encoding de documentos antiguos, que aparecen con caracteres corruptos.
- [ ] Mantener no-medico como restriccion central.
- [ ] Decidir ciudad/categoria prioritaria para piloto.
- [ ] Decidir si `BeautyPack` convive permanentemente con `Bono` o lo sustituye a medio plazo.

## Metricas a activar

B2C:

- [ ] Porcentaje de usuarias que completan Beauty Profile.
- [ ] Porcentaje que vuelve a `/mi-plan`.
- [ ] Clicks en recomendaciones.
- [ ] Reservas desde Beauty Plan.
- [ ] Compras desde Beauty Plan.
- [ ] Beneficios reclamados.
- [ ] Productos con recordatorio activado.

B2B:

- [ ] Packs creados por centro.
- [ ] Beneficios activos por centro.
- [ ] Seguimientos generados.
- [ ] Reservas repetidas.
- [ ] Productos repuestos.
- [ ] Upgrades de plan.
- [ ] Churn por plan.

## Proxima accion

Ejecutar piloto controlado en Madrid con negocios reales cuando se confirme legal y disponibilidad operativa.

Orden recomendado:

1. Confirmar textos legales finales con asesor legal.
2. Seleccionar 3-5 negocios reales y completar `docs/producto/plantilla-negocios-piloto.csv`.
3. Cargar datos reales sustituyendo o retirando los datos ficticios del seed interno.
4. Hacer QA visual manual en dispositivos reales.
5. Activar metricas basicas del piloto.

Material preparado:

- Piloto operativo: `docs/producto/piloto-controlado-madrid.md`.
- Plantilla de negocios: `docs/producto/plantilla-negocios-piloto.csv`.
- Seed interno: `prisma/seed-pilot-belleza.mjs`.
