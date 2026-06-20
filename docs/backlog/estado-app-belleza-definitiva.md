# Estado - App Belleza Definitiva

Documento vivo de ejecucion para saber que esta resuelto, que esta en curso y que queda pendiente.

## Checkpoint actual

- Fecha: 2026-06-20
- Estado: Fases 1-8 implementadas, validadas y con migraciones aplicadas; piloto Madrid preparado a nivel operativo; pendiente negocios reales, legal final y QA visual
- Fase actual: Preparacion de piloto controlado
- Proxima fase: Piloto controlado
- Rama local revisada: `main`
- Repositorio GitHub: `aldeiaagency/app-estetica`

## Resumen de decision

La app deja de evolucionar como "agenda online + marketplace" y pasa a evolucionar como:

> Beauty Profile + Beauty Plan + Wallet de beneficios + packs por objetivo + seguimiento postservicio + recomendacion honesta.

La agenda, reservas, productos, bonos, dashboard y admin se conservan como infraestructura existente.

## Fases

| Fase | Estado | Inicio | Cierre | Notas |
|---|---|---:|---:|---|
| 0 - Planificacion definitiva | Completada | 2026-06-19 | 2026-06-19 | Roadmap creado |
| 1 - Reposicionamiento y base B2C | Completada | 2026-06-19 | 2026-06-20 | Codigo implementado y migracion aplicada |
| 2 - Plan, wallet y beneficios | Completada | 2026-06-19 | 2026-06-20 | Codigo implementado y migracion aplicada |
| 3 - Packs por objetivo | Completada | 2026-06-19 | 2026-06-20 | Codigo implementado y migracion aplicada |
| 4 - Seguimiento y recurrencia B2B | Completada | 2026-06-19 | 2026-06-20 | Codigo implementado y migracion aplicada |
| 5 - Productos inteligentes | Completada | 2026-06-19 | 2026-06-20 | Codigo implementado y migracion aplicada |
| 6 - B2B pricing y pagina negocios | Completada | 2026-06-19 | 2026-06-20 | Codigo implementado; mantiene compatibilidad Stripe con enums tecnicos |
| 7 - Ranking, calidad y SEO/GEO | Completada | 2026-06-19 | 2026-06-20 | Codigo implementado; type-check, tests, Prisma validate y build pasan |
| 8 - QA, legal y piloto | Completada | 2026-06-20 | 2026-06-20 | Codigo, documentacion, build y migraciones validadas |

## Hecho en Fase 0

- [x] Revisado el brief `codex_app_belleza_definitiva.md`.
- [x] Revisada la estructura actual de la app.
- [x] Confirmado que la app ya tiene base de marketplace, reservas, productos, bonos, cuenta, dashboard, admin, Auth, Stripe y Prisma.
- [x] Confirmado que no hace falta reconstruir desde cero.
- [x] Creado roadmap operativo nuevo: `docs/producto/app-belleza-definitiva-roadmap.md`.
- [x] Creado este documento de estado.

## Pendiente inmediato para Fase 1

- [x] Marcar Fase 1 como `En curso`.
- [x] Crear modelos Prisma `BeautyProfile` y `BeautyGoal`.
- [x] Crear migracion correspondiente.
- [x] Crear server action de diagnostico.
- [x] Crear ruta `/diagnostico`.
- [x] Crear ruta `/mi-plan`.
- [x] Reescribir home con nueva propuesta.
- [x] Anadir CTA de Beauty Profile en header/home.
- [x] Verificar type-check y tests.
- [x] Aplicar migracion en base de datos.
- [x] Ejecutar `prisma generate` cuando el entorno no bloquee el generador.
- [x] Ejecutar build completa cuando el entorno no bloquee procesos internos de Next.

## Hecho en Fase 2

- [x] Crear modelos Prisma `BeautyPlan`, `BeautyPlanItem`, `BeautyBenefit` y `UserBenefit`.
- [x] Crear migracion `20260619123000_add_beauty_plan_wallet`.
- [x] Persistir el plan mensual desde `/mi-plan`.
- [x] Permitir marcar recomendaciones como hechas, omitidas o descartadas.
- [x] Crear `/wallet`.
- [x] Mostrar beneficios activos, bonos, pedidos, citas y progreso del plan en wallet.
- [x] Crear beneficios iniciales globales si no existen.
- [x] Mostrar beneficios en ficha de centro.
- [x] Mostrar beneficio activo en cards de busqueda.
- [x] Crear `/dashboard/beneficios` para publicar/pausar beneficios por centro.
- [x] Anadir enlace a `Mi plan` en navegacion publica.
- [x] Anadir acceso a wallet desde `Mi cuenta`.
- [x] Verificar `npm run type-check`.
- [x] Verificar `npm run test` con 61/61 tests.

## Pendiente inmediato para Fase 2

- [x] Aplicar migracion en base de datos.
- [x] Ejecutar `prisma generate` cuando el entorno no bloquee el generador.
- [x] Ejecutar build completa cuando el entorno no bloquee procesos internos de Next.

## Hecho en Fase 3

- [x] Crear modelos Prisma `BeautyPack` y `BeautyPackItem`.
- [x] Crear enum `BeautyPackItemType`.
- [x] Crear migracion `20260619130000_add_beauty_packs`.
- [x] Relacionar `BeautyPlanItem.packId` con `BeautyPack`.
- [x] Mantener `Bono` como compatibilidad o producto legacy.
- [x] Crear acciones de packs con SQL parametrizado.
- [x] Crear `/dashboard/packs`.
- [x] Crear `components/business/pack-builder.tsx`.
- [x] Anadir acceso a packs en navegacion del dashboard.
- [x] Mostrar packs en ficha de centro.
- [x] Mostrar packs recomendados en `/mi-plan`.
- [x] Ajustar copy visible de `/dashboard/bonos` hacia bonos legacy y packs por objetivo.
- [x] Definir compra MVP: usar flujo de bono si hay `bonoId`; si no, llevar a reserva del centro.
- [x] Verificar `npm run type-check`.
- [x] Verificar `npm run test` con 61/61 tests.
- [x] Documentar intento de servidor local bloqueado por `spawn EPERM`.

## Pendiente inmediato para Fase 3

- [x] Aplicar migracion en base de datos.
- [x] Ejecutar `prisma generate` cuando el entorno no bloquee el generador.
- [x] Ejecutar build completa cuando el entorno no bloquee procesos internos de Next.

## Hecho en Fase 4

- [x] Crear modelos Prisma `FollowUpTemplate` y `FollowUpMessage`.
- [x] Crear enums `FollowUpTemplateCategory`, `CommunicationPurpose`, `CommunicationChannel` y `FollowUpMessageStatus`.
- [x] Crear migracion `20260619133000_add_follow_ups`.
- [x] Crear acciones de seguimiento con SQL parametrizado.
- [x] Crear plantillas iniciales para manicura, facial, coloracion y general.
- [x] Crear `/dashboard/seguimientos` con plantillas y mensajes programados.
- [x] Crear `/dashboard/recurrencia` con oportunidades de repeticion.
- [x] Crear `/dashboard/campanas` separando marketing con opt-in.
- [x] Anadir accesos en navegacion del dashboard.
- [x] Programar seguimiento al marcar una reserva como `COMPLETED`.
- [x] Anadir KPI de oportunidades de vuelta al dashboard principal.
- [x] Preparar canales MVP `EMAIL` e `IN_APP`.
- [x] Dejar WhatsApp/SMS fuera de MVP como post-MVP/add-on.
- [x] Verificar `npm run type-check`.
- [x] Verificar `npm run test` con 61/61 tests.
- [x] Verificar `npx prisma validate` con URLs locales ficticias.

## Pendiente inmediato para Fase 4

- [x] Aplicar migracion en base de datos.
- [x] Ejecutar `prisma generate` cuando el entorno no bloquee el generador.
- [x] Ejecutar build completa cuando el entorno no bloquee procesos internos de Next.

## Hecho en Fase 5

- [x] Crear modelos Prisma `BeautyRoutine`, `BeautyRoutineStep` y `ProductUsage`.
- [x] Crear enums `BeautyRoutineStatus`, `BeautyRoutineStepStatus`, `BeautyRoutineStepType`, `BeautyRoutineMoment` y `ProductUsageStatus`.
- [x] Anadir campos inteligentes a `Product`: instrucciones, para quien es, para quien no es, duracion, reposicion, etiquetas, compatibilidad y alternativa.
- [x] Crear migracion `20260619140000_add_beauty_routines`.
- [x] Crear acciones de rutina, reposicion y recomendacion con SQL parametrizado.
- [x] Crear `/rutina` con productos guardados, pausa, reanudacion, terminado, quitar y avisos.
- [x] Crear `/reposicion` con productos en seguimiento, estados de reposicion y alternativa.
- [x] Crear `components/beauty/save-to-routine-button.tsx`.
- [x] Permitir guardar productos desde la ficha y desde recomendaciones de `/mi-plan`.
- [x] Mostrar productos recomendados por perfil en `/mi-plan`.
- [x] Mostrar etiquetas de rutina/reposicion en listado y ficha de producto.
- [x] Ampliar `/dashboard/productos` para que el negocio informe uso, duracion, compatibilidad y recomendacion.
- [x] Anadir accesos a rutina/reposicion en header publico y cuenta.
- [x] Verificar `npx prisma validate` con URLs locales ficticias.
- [x] Verificar `npm run type-check`.
- [x] Verificar `npm run test` con 61/61 tests.

## Pendiente inmediato para Fase 5

- [x] Aplicar migracion en base de datos.
- [x] Ejecutar `prisma generate` cuando el entorno no bloquee el generador.
- [x] Ejecutar build completa cuando el entorno no bloquee procesos internos de Next.

## Hecho en Fase 6

- [x] Reescribir `/para-negocios` hacia recurrencia, fidelizacion, packs, productos y seguimiento.
- [x] Eliminar metricas y testimonios no verificables de la pagina B2B.
- [x] Definir planes visibles `Presencia`, `Growth`, `Elite` y `Partner`.
- [x] Mantener migracion tecnica sin romper Stripe: `BASIC -> Presencia`, `PRO -> Growth`, `GROWTH -> Elite`, `PREMIUM -> Partner`.
- [x] Centralizar nombres, precios y textos en `lib/billing/plans.ts`.
- [x] Actualizar `lib/billing/price-map.ts` con aliases nuevos y compatibilidad antigua.
- [x] Actualizar `/precios` para usar la misma fuente de billing.
- [x] Actualizar `/dashboard/plan`, `app/admin/planes`, badges y selector admin de organizaciones.
- [x] Actualizar mensajes de gating de bonos, packs, productos e IA hacia plan Growth.
- [x] Revisar add-ons: WhatsApp/SMS quedan como avanzado/add-on, no promesa base.
- [x] Corregir terminos para no afirmar que Basic/Presencia es gratis.
- [x] Verificar `npm run type-check`.
- [x] Verificar `npm run test` con 61/61 tests.

## Pendiente inmediato para Fase 6

- [ ] Configurar price IDs definitivos en Stripe cuando existan: `STRIPE_PRICE_PRESENCIA_MONTHLY`, `STRIPE_PRICE_B2B_GROWTH_MONTHLY`, `STRIPE_PRICE_ELITE_MONTHLY`, `STRIPE_PRICE_PARTNER_MONTHLY`.
- [ ] Revisar copy legal definitivo de planes en Fase 8.
- [x] Ejecutar build completa cuando el entorno no bloquee procesos internos de Next.

## Hecho en Fase 7

- [x] Crear scoring de marketplace en `lib/marketplace/ranking.ts`.
- [x] Ordenar `/buscar` por encaje, precio claro, calidad, packs, beneficios, seguimiento y destacado comercial limitado por calidad minima.
- [x] Anadir filtros publicos: recomendado para mi, precio claro, seguimiento, beneficios y packs.
- [x] Mejorar cards de centros con "ideal para" y motivos de encaje.
- [x] Mantener beneficio activo visible en cards y sumar packs/seguimiento como senales.
- [x] Mejorar ficha de centro con senales de precio, packs, beneficios y seguimiento.
- [x] Mostrar contexto de servicio y fecha aproximada en resenas verificadas cuando existe reserva asociada.
- [x] Reforzar landings `/s/[ciudad]` y `/s/[ciudad]/[categoria]` con respuestas directas, FAQs visibles y FAQPage JSON-LD.
- [x] Mantener landings programaticas solo si hay centros publicados; sin centros se conserva `notFound()`.

## Pendiente inmediato para Fase 7

- [x] Ejecutar `npm run type-check`.
- [x] Ejecutar `npm run test`.
- [x] Ejecutar `npx prisma validate`.
- [x] Ejecutar build completa cuando el entorno no bloquee procesos internos de Next.

## Hecho en Fase 8

- [x] Crear auditoria GDPR de nuevos datos en `docs/tecnico/gdpr-auditoria-fase-8.md`.
- [x] Crear checklist de piloto en `docs/producto/checklist-piloto-app-belleza.md`.
- [x] Anadir exportacion de datos en `/api/account/export`.
- [x] Anadir bloque de privacidad en `/cuenta`.
- [x] Permitir retirada de marketing desde `/cuenta`.
- [x] Permitir borrado de Beauty Profile, Beauty Plan, wallet, rutina, reposicion y beneficios guardados desde `/cuenta`.
- [x] Mantener reservas, pedidos y bonos fuera del borrado automatico por obligacion operativa/legal.
- [x] Validar aceptacion de terminos/privacidad en servidor durante registro.
- [x] Actualizar politica de privacidad con Beauty Profile, rutinas, reposicion y derechos desde cuenta.
- [x] Revisar textos visibles para reducir tono clinico: Beauty Profile/perfil/asesoria sustituyen "diagnostico" cuando era visible.
- [x] Retirar claims genericos tipo "los mejores centros".
- [x] Verificar responsive de rutas nuevas mediante revision estatica de layouts y constraints.
- [x] Verificar `npm run type-check`.
- [x] Verificar `npm run test` con 61/61 tests.
- [x] Verificar `npx prisma validate` con URLs locales ficticias.
- [x] Verificar `npm run build`; incluye `prisma generate` correcto.
- [x] Aplicar migraciones pendientes en base real: 9/9 registradas, sin rollbacks.
- [x] Verificar tablas nuevas de Beauty Profile, plan, wallet, packs, seguimientos, rutina y reposicion.

## Pendiente inmediato para piloto

- [x] Aplicar migraciones en base de datos real.
- [x] Definir ciudad/categoria piloto: Madrid, belleza recurrente no medica.
- [x] Crear documento operativo de piloto controlado.
- [x] Crear plantilla de datos para negocios reales.
- [x] Crear seed interno de piloto no publicado por defecto.
- [ ] Confirmar asesor legal para politica de privacidad, retencion y cierre completo de cuenta.
- [ ] Seleccionar negocios piloto y cargar datos reales.
- [ ] Hacer QA visual manual en dispositivos reales.
- [ ] Revisar warnings de Auth.js/Jose en Edge Runtime antes de produccion.

## Riesgos activos

| Riesgo | Impacto | Mitigacion |
|---|---|---|
| Beauty Profile demasiado largo | Baja conversion | Mantenerlo corto y por pasos |
| Datos sensibles | Riesgo legal/GDPR | Evitar preguntas medicas y pedir consentimiento claro |
| Pricing B2B nuevo rompe Stripe | Riesgo de facturacion | Mitigado conservando enums tecnicos y aliases de price IDs |
| Recomendaciones genericas | Pierde diferenciacion | Siempre explicar motivo y mostrar que evitar |
| Construir IA demasiado pronto | Complejidad y retraso | Empezar con reglas simples |
| Futuras migraciones desde este entorno | Prisma CLI local no pudo consultar/aplicar por bloqueo `spawn EPERM`/TLS; la base se actualizo con cliente PostgreSQL temporal | Para proximas migraciones, usar CI, Supabase SQL editor o entorno local sin ese bloqueo |
| Retencion legal por validar | Riesgo legal si se conserva o borra de mas | Revisar con asesor legal antes del piloto |
| Warnings Edge Runtime de Auth.js/Jose | Riesgo tecnico en despliegue Edge | Revisar runtime/middleware antes de produccion |
| `next dev` bloqueado por Windows | No se puede levantar servidor local desde este entorno | Intento en puerto 3013 falla por `spawn EPERM`; probar en entorno sin restriccion de spawn |

## Como cerrar una fase

Antes de marcar una fase como completada:

- [ ] Sus criterios de aceptacion estan cumplidos.
- [ ] Type-check ejecutado o motivo documentado.
- [ ] Tests relevantes ejecutados o motivo documentado.
- [ ] Las tareas no realizadas se movieron a la fase correcta.
- [ ] Este archivo fue actualizado.
- [ ] El roadmap operativo fue actualizado.

## Enlaces internos

- Roadmap operativo: `docs/producto/app-belleza-definitiva-roadmap.md`
- Estado anterior del MVP: `docs/backlog/estado-ejecucion.md`
- PRD anterior: `docs/producto/prd.md`
