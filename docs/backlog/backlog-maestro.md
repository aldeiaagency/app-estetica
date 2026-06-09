# Backlog Maestro — Belleza Local

**Última actualización:** 2026-06-09
**Estado general del producto:** MVP parcial — arquitectura sólida, funcionalidad incompleta
**Documento de auditoría:** `docs/auditoria/auditoria-integral-app.md`

---

## Estado general

- **Estado actual:** MVP en construcción. Motor de reservas funcional, home y búsqueda operativas, dashboard parcial. Claims falsos en home. Ecommerce/bonos sin flujo de compra. ServiceStaff vacío rompe el engine.
- **Objetivo:** Plataforma SaaS + marketplace abierto + ecommerce hiperlocal para belleza, estética, peluquería, cosmética y bienestar no médico. Navegación libre sin login, compra/reserva con cuenta ligera.
- **Riesgos principales:** Claims falsos (confianza/legal), ServiceStaff vacío (booking roto), bug OR/AND búsqueda, sin flujo compra bonos/productos, sin páginas legales, sin GDPR export/delete.
- **Estrategia de ejecución:** Una fase a la vez con aprobación humana explícita entre fases. No implementar sin aprobación. Documentar todo.

---

## Reglas del ciclo de trabajo

- No implementar sin aprobación explícita.
- Una fase cada vez.
- Cada fase debe tener informe propio en `docs/informes/`.
- Cada fase debe verificarse antes de pasar a la siguiente.
- Actualizar `docs/backlog/estado-ejecucion.md` tras cada fase.
- Frase obligatoria antes de implementar: **"Fase X preparada. Espero aprobación explícita para implementar."**

---

## Tabla de fases

| # | Nombre | Prioridad | Estado | Dependencias |
|---|---|---|---|---|
| 0 | Auditoría integral y backlog | P0 | ✅ Aprobada | — |
| 1 | App pública abierta, home y claims honestos | P0 | ⏳ Esperando aprobación | Fase 0 |
| 2 | Perfil de negocio como web completa | P0 | 🔲 Pendiente | Fase 1 |
| 3 | Búsqueda general e hiperlocal | P0 | 🔲 Pendiente | Fase 1 |
| 4 | Reservas, calendario mensual y disponibilidad 3 meses | P0 | 🔲 Pendiente | Fase 2 |
| 5 | Cancelación y modificación de reservas | P1 | 🔲 Pendiente | Fase 4 |
| 6 | Ecommerce de productos de belleza | P1 | 🔲 Pendiente | Fase 2 |
| 7 | Bonos, packs y tarjetas regalo | P1 | 🔲 Pendiente | Fase 2 |
| 8 | Dashboard negocio completo | P1 | 🔲 Pendiente | Fases 4,5,6,7 |
| 9 | Admin plataforma completo | P2 | 🔲 Pendiente | Fase 8 |
| 10 | Planes, gating y monetización | P2 | 🔲 Pendiente | Fase 8 |
| 11 | IA premium para negocios | P2 | 🔲 Pendiente | Fase 10 |
| 12 | SEO programático, sitemap, schema y páginas locales | P2 | 🔲 Pendiente | Fase 2 |
| 13 | UX/UI profesional y design system | P2 | 🔲 Pendiente | Fases 1-8 |
| 14 | Seguridad, privacidad, GDPR y multi-tenant | P3 | 🔲 Pendiente | Fases 1-10 |
| 15 | Tests, QA, build y preparación para piloto | P3 | 🔲 Pendiente | Todas |

---

## Fases detalladas

---

### Fase 0 — Auditoría integral y saneamiento del plan

**Estado:** ✅ Aprobada
**Objetivo:** Conocer el estado real del repo, documentar todo, crear backlog maestro.
**Informe:** `docs/informes/fase-00-auditoria.md`

**Acciones ejecutadas:**
- [x] Revisar estructura completa del proyecto
- [x] Revisar stack y dependencias
- [x] Revisar rutas públicas y protegidas
- [x] Revisar auth/middleware
- [x] Revisar motor de disponibilidad
- [x] Revisar dashboard y admin
- [x] Revisar ecommerce/bonos
- [x] Revisar SEO
- [x] Revisar modelos Prisma
- [x] Revisar UI y componentes
- [x] Revisar documentación existente
- [x] Crear `docs/auditoria/auditoria-integral-app.md`
- [x] Crear `docs/backlog/backlog-maestro.md` (este archivo)
- [x] Crear `docs/backlog/estado-ejecucion.md`
- [x] Crear `docs/informes/fase-00-auditoria.md`

**Definition of Done:** ✅ Documentación creada, plan expuesto, aprobación recibida.

---

### Fase 1 — App pública abierta, home y claims honestos

**Estado:** ⏳ Esperando aprobación
**Objetivo:** Home honesta, moderna y premium. Navegar sin login. Eliminar claims falsos.

**Archivos afectados:**
- `app/page.tsx` — eliminar claims falsos, calcular métricas reales desde DB
- `middleware.ts` — verificar que no bloquea rutas públicas (ya correcto, confirmar)
- `app/buscar/page.tsx` — corregir bug OR/AND si aplica en este flujo
- `components/ui/public-header.tsx` — verificar navegación sin login
- `app/globals.css` — verificar que `btn-primary`, `btn-outline`, `section-eyebrow` etc. están definidas

**Acciones planificadas:**
- [ ] Leer `app/page.tsx` — identificar exactamente dónde están los claims falsos
- [ ] Eliminar o reemplazar métricas hardcodeadas:
  - "4.9 de media" → calcular desde DB o eliminar
  - "+350 centros" → calcular desde DB (count de centros publicados)
  - "+12.000 reservas" → calcular desde DB o eliminar
  - "50+ ciudades" → calcular desde DB o eliminar
  - "Más de 350 profesionales" → reemplazar con copy honesto
- [ ] Reemplazar widget mock de "Agenda de hoy" con copy estático de marketing honesto
- [ ] Añadir métricas reales calculadas dinámicamente desde DB si son reales
- [ ] Verificar que middleware.ts no bloquea rutas públicas
- [ ] Verificar que `btn-primary`, `btn-outline`, `section-eyebrow` están en globals.css
- [ ] Verificar PublicHeader sin login
- [ ] Crear `docs/informes/fase-01-home-app-publica.md`

**Riesgos:**
- Calcular métricas reales puede ralentizar la home (usar `revalidate` en lugar de `force-dynamic`)
- Si las métricas son 0/1, deben mostrarse con copy apropiado, no como números vacíos

**Comandos de verificación:**
```bash
npm run type-check
npm run lint
```

**Definition of Done:**
- No hay ningún número hardcodeado falso en `app/page.tsx`
- Las métricas se calculan desde DB o el bloque se elimina
- La home carga sin login
- No hay 404 en links del header
- `npm run type-check` pasa sin errores nuevos
- `npm run lint` pasa

**Dependencias:** Fase 0 ✅

---

### Fase 2 — Perfil de negocio como web completa

**Estado:** 🔲 Pendiente
**Objetivo:** Cada negocio debe tener un perfil público muy completo.

**Archivos afectados:**
- `app/centro/[slug]/page.tsx` — perfil completo con todas las secciones
- `app/centro/[slug]/layout.tsx` — si existe
- `lib/seo/metadata.ts` — metadata dinámica + JSON-LD
- `prisma/seed.mjs` — añadir ServiceStaff para que el engine funcione

**Acciones planificadas:**
- [ ] Auditar `app/centro/[slug]/page.tsx` actual (ya parcialmente implementado)
- [ ] Verificar secciones: hero, info, servicios, staff, productos, bonos, promociones, reseñas, galería
- [ ] Añadir CTA para compra de bonos (aunque sea un placeholder con "Próximamente")
- [ ] Añadir CTA para compra de productos (aunque sea un link)
- [ ] Verificar metadata dinámica: title, description, canonical
- [ ] Añadir JSON-LD LocalBusiness / Service
- [ ] Crear `ServiceStaff` en seed para vincular staff a servicios
- [ ] Verificar que galería tiene placeholder premium si no hay imágenes
- [ ] Añadir política de cancelación y horarios completos
- [ ] Crear `docs/informes/fase-02-perfil-negocio.md`

**Riesgos:**
- JSON-LD complejo puede romper el build si hay campos null no manejados
- ServiceStaff en seed requiere re-ejecutar seed en producción

**Definition of Done:**
- Perfil tiene todas las secciones del spec
- JSON-LD válido en producción
- ServiceStaff vinculados — engine devuelve slots reales
- No hay secciones vacías sin empty state
- `npm run type-check` y `lint` pasan

**Dependencias:** Fase 1 ✅

---

### Fase 3 — Búsqueda general e hiperlocal

**Estado:** 🔲 Pendiente
**Objetivo:** Búsqueda funcional y correcta por texto, ciudad, categoría, servicio, producto y bono.

**Archivos afectados:**
- `app/buscar/page.tsx` — corregir bug OR/AND, ampliar filtros
- `app/api/v1/...` — si se añade API de búsqueda

**Acciones planificadas:**
- [ ] Leer `app/buscar/page.tsx` — identificar bug OR/AND con q+ciudad
- [ ] Corregir lógica: `AND: [{ OR: [...ciudadFilters] }, { OR: [...qFilters] }]`
- [ ] Añadir filtros: precio mínimo/máximo, disponibilidad hoy, valoración
- [ ] Añadir paginación básica o infinite scroll
- [ ] Añadir filtro por tipo de negocio (solo servicios / solo productos / mixto)
- [ ] Mejorar ranking: favoritos > más reservas > más recientes
- [ ] Añadir `robots: { index: false }` a variantes con query params (ya existe)
- [ ] Crear `docs/informes/fase-03-busqueda.md`

**Riesgos:**
- Paginación puede requerir cambios en la arquitectura de la página
- Filtros adicionales pueden generar queries complejas N+1

**Definition of Done:**
- q + ciudad combinados devuelven resultados correctos
- Bug OR/AND corregido con test manual
- Filtros básicos funcionan
- Empty state honesto para cada variante
- `npm run type-check` y `lint` pasan

**Dependencias:** Fase 1 ✅

---

### Fase 4 — Reservas, calendario mensual y disponibilidad 3 meses

**Estado:** 🔲 Pendiente
**Objetivo:** Flujo de reserva completo con calendario mensual estilo Google Calendar simplificado.

**Archivos afectados:**
- `lib/availability/engine.ts` — verificar y completar lógica de slots
- `components/booking/booking-wizard.tsx` — verificar flujo completo
- `app/centro/[slug]/reservar/page.tsx` — verificar diseño y flujo
- `app/reserva/confirmada/[code]/page.tsx` — auditar y actualizar diseño
- `app/actions/booking.ts` — verificar `createBookingAction`
- `prisma/seed.mjs` — crear ServiceStaff para que el engine funcione

**Acciones planificadas:**
- [ ] Verificar que `ServiceStaff` existen (bloqueo crítico del engine)
- [ ] Crear ServiceStaff en seed: vincular cada servicio con staff apropiado
- [ ] Verificar el wizard de reserva paso a paso
- [ ] Verificar que el calendario mensual funciona con datos reales
- [ ] Verificar que los slots se generan correctamente con horarios reales
- [ ] Auditar y actualizar `app/reserva/confirmada/[code]/page.tsx`
- [ ] Verificar flujo guest checkout (sin login)
- [ ] Verificar pre-fill de datos si usuario está logueado
- [ ] Verificar envío de email de confirmación (si hay RESEND_API_KEY)
- [ ] Crear `docs/informes/fase-04-reservas-calendario.md`

**Riesgos:**
- ServiceStaff vacío rompe completamente el engine — corregir primero
- Timezone bugs pueden aparecer en producción (Vercel usa UTC)
- Race condition ya mitigada con transacción

**Definition of Done:**
- `getAvailableSlots()` devuelve slots reales para la peluquería demo
- Un usuario externo puede completar el flujo de reserva de inicio a fin sin login
- Confirmación muestra código y datos de la reserva
- `npm run type-check` y `lint` pasan

**Dependencias:** Fase 2 ✅ (ServiceStaff)

---

### Fase 5 — Cancelación y modificación de reservas

**Estado:** 🔲 Pendiente
**Objetivo:** Permitir anular y modificar reservas tanto con cuenta como con código+email.

**Archivos afectados:**
- `app/reserva/gestionar/page.tsx` — UI completa de gestión
- `app/actions/booking.ts` — `cancelBookingAction` (existe), `rescheduleBookingAction` (nuevo)
- `app/reserva/confirmada/[code]/page.tsx` — links de gestión desde confirmación

**Acciones planificadas:**
- [ ] Auditar `app/reserva/gestionar/page.tsx`
- [ ] Implementar búsqueda por código + email/teléfono
- [ ] Implementar cancelación según política (verificar política de tiempo)
- [ ] Implementar modificación de fecha/hora (nuevo slot)
- [ ] Guardar auditoría de cambio en la reserva (campo `notes` o `auditLog`)
- [ ] Enviar notificación al negocio cuando hay cambio
- [ ] Crear `docs/informes/fase-05-modificacion-cancelacion.md`

**Riesgos:**
- Modificación requiere re-verificar disponibilidad para el nuevo slot
- Política de cancelación: sin configuración clara en centros demo

**Definition of Done:**
- Un usuario puede cancelar su reserva con código+email
- Un usuario puede cambiar fecha/hora dentro de la ventana permitida
- Negocio ve el cambio en el dashboard
- `npm run type-check` y `lint` pasan

**Dependencias:** Fase 4 ✅

---

### Fase 6 — Ecommerce de productos de belleza

**Estado:** 🔲 Pendiente
**Objetivo:** Flujo completo para vender productos desde negocios.

**Archivos afectados (nuevos):**
- `app/productos/page.tsx` — catálogo general
- `app/productos/[slug]/page.tsx` — ficha de producto
- `components/ecommerce/cart.tsx` — carrito
- `components/ecommerce/checkout.tsx` — checkout básico
- `app/actions/orders.ts` — acciones de pedido

**Archivos afectados (existentes):**
- `app/centro/[slug]/page.tsx` — botón "Comprar" en productos del centro
- `app/(dashboard)/dashboard/productos/page.tsx` — gestión de pedidos

**Acciones planificadas:**
- [ ] Crear `/productos` con catálogo filtrado por negocio/categoría
- [ ] Crear `/productos/[slug]` con ficha completa + botón comprar
- [ ] Implementar carrito básico (localStorage o server-side)
- [ ] Implementar checkout básico (sin Stripe real, preparado)
- [ ] Crear `Order` y `OrderItem` en schema si no existen
- [ ] Dashboard: añadir gestión de pedidos
- [ ] Crear `docs/informes/fase-06-ecommerce-productos.md`

**Riesgos:**
- Schema puede no tener `Order`/`OrderItem` → necesita migración
- Carrito sin auth es complejo (localStorage + hidratación SSR)
- Checkout sin Stripe = pedido sin cobro (mock o "pago en tienda")

**Definition of Done:**
- Un usuario puede ver catálogo, ver ficha de producto y añadir al carrito
- Flujo de checkout completo hasta confirmación de pedido
- Dashboard muestra pedidos pendientes
- `npm run type-check` y `lint` pasan

**Dependencias:** Fase 2 ✅

---

### Fase 7 — Bonos, packs y tarjetas regalo

**Estado:** 🔲 Pendiente
**Objetivo:** Bonos como herramienta de recurrencia — compra, wallet y redención.

**Archivos afectados:**
- `app/centro/[slug]/page.tsx` — botón "Comprar bono" real
- `app/cuenta/bonos/page.tsx` — wallet del usuario (nuevo)
- `app/actions/bonos.ts` — `purchaseBonoAction`, `redeemBonoAction`
- `app/(dashboard)/dashboard/bonos/page.tsx` — gestión de instancias

**Acciones planificadas:**
- [ ] Añadir botón "Comprar bono" en ficha pública con flujo real
- [ ] Crear flujo de compra de bono (sin Stripe real, confirmación mock)
- [ ] Crear `BonoInstance` al comprar
- [ ] Crear página `/cuenta/bonos` con wallet del usuario
- [ ] Implementar redención de bono al hacer reserva (step 4 del wizard)
- [ ] Dashboard: ver instancias vendidas, sessions usadas/disponibles
- [ ] Crear `docs/informes/fase-07-bonos.md`

**Riesgos:**
- Redención en el wizard de reserva añade complejidad al flujo existente
- Sin Stripe, las instancias se crean sin cobro real

**Definition of Done:**
- Un usuario puede comprar un bono desde la ficha pública
- El bono aparece en `/cuenta/bonos` con sessions disponibles
- El usuario puede usar el bono al reservar
- Dashboard muestra instancias y estado de sesiones
- `npm run type-check` y `lint` pasan

**Dependencias:** Fase 4 ✅

---

### Fase 8 — Dashboard negocio completo

**Estado:** 🔲 Pendiente
**Objetivo:** Sistema operativo completo para negocios.

**Archivos afectados:**
- `app/(dashboard)/dashboard/servicios/page.tsx`
- `app/(dashboard)/dashboard/staff/page.tsx`
- `app/(dashboard)/dashboard/horarios/page.tsx`
- `app/(dashboard)/dashboard/clientes/page.tsx`
- `app/(dashboard)/dashboard/configuracion/page.tsx`
- `app/(dashboard)/dashboard/plan/page.tsx`
- `components/dashboard/`

**Acciones planificadas:**
- [ ] Auditar todas las páginas del dashboard
- [ ] Completar CRUD servicios con categorías y orden
- [ ] Completar CRUD staff con asignación a servicios (ServiceStaff)
- [ ] Completar UI horarios: editar reglas por día, excepciones, festivos
- [ ] Completar CRM clientes: historial, tags, segmentación básica
- [ ] Completar configuración centro: todos los campos, upload imagen (mock)
- [ ] Completar página plan: mostrar features del plan actual, CTA upgrade
- [ ] Añadir analítica básica: ingresos por período, top servicios, ocupación
- [ ] Crear `docs/informes/fase-08-dashboard-negocio.md`

**Riesgos:**
- Upload de imágenes requiere R2 → usar URL externa o skip por ahora
- Analítica puede ser costosa en queries → usar cache

**Definition of Done:**
- Cada sección del dashboard tiene funcionalidad básica completa
- CRUD servicios, staff, horarios funcionan end-to-end
- CRM muestra historial real de reservas por cliente
- Plan muestra features correctas según plan
- `npm run type-check` y `lint` pasan

**Dependencias:** Fases 4, 5, 6, 7 ✅

---

### Fase 9 — Admin plataforma completo

**Estado:** 🔲 Pendiente
**Objetivo:** Control total de la plataforma.

**Archivos afectados:**
- `app/admin/` (todas las páginas)
- `app/actions/admin.ts`

**Acciones planificadas:**
- [ ] Auditar todas las páginas admin
- [ ] Overview: stats de plataforma (negocios, usuarios, reservas, revenue)
- [ ] Centros: listado con filtros, aprobar/rechazar, moderación
- [ ] Organizaciones: listado, cambiar plan, ver add-ons
- [ ] Usuarios: listado, ver rol, gestión básica
- [ ] Reservas: vista global (multi-tenant, solo stats agregados)
- [ ] SEO: control noindex, featured listings
- [ ] Auditoría: ver `AdminAuditLog`
- [ ] Crear `docs/informes/fase-09-admin.md`

**Riesgos:**
- Datos multi-tenant en admin — nunca mostrar datos privados de un tenant a otro
- Admin debe estar bien protegido (rol PLATFORM_ADMIN)

**Definition of Done:**
- Admin puede ver y gestionar todos los negocios
- Admin puede cambiar planes
- Admin puede controlar SEO e indexación
- `npm run type-check` y `lint` pasan

**Dependencias:** Fase 8 ✅

---

### Fase 10 — Planes, gating y monetización

**Estado:** 🔲 Pendiente
**Objetivo:** Aplicar gating real de features según plan de la organización.

**Archivos afectados:**
- `lib/billing/plans.ts` — helpers de gating (ya existe)
- `app/(dashboard)/dashboard/*/page.tsx` — aplicar gating en UI
- `app/actions/dashboard.ts` — aplicar gating en server actions
- `app/(dashboard)/dashboard/plan/page.tsx` — upgrade flow

**Acciones planificadas:**
- [ ] Auditar `lib/billing/plans.ts` — verificar `canUsePlanFeature`
- [ ] Aplicar gating en todas las páginas del dashboard
- [ ] Aplicar gating en todas las server actions
- [ ] Crear UI de upgrade con planes y precios
- [ ] Preparar integración Stripe (sin activar cobro real)
- [ ] Crear helpers: `requirePlanFeature()`, `checkPlanLimit()`
- [ ] Crear `docs/informes/fase-10-planes-monetizacion.md`

**Riesgos:**
- Gating mal aplicado puede bloquear features que deberían funcionar
- Sin Stripe real = sin revenue real

**Definition of Done:**
- Features de plan PRO+ están bloqueadas para plan BASIC
- UI muestra correctamente qué está disponible en cada plan
- CTA de upgrade funciona y lleva a página de planes
- `npm run type-check` y `lint` pasan

**Dependencias:** Fase 8 ✅

---

### Fase 11 — IA premium para negocios

**Estado:** 🔲 Pendiente
**Objetivo:** Arquitectura IA preparada y mock-safe para negocios premium.

**Archivos afectados (nuevos):**
- `lib/ai/` — módulo IA
- `lib/ai/recommendations.ts`
- `lib/ai/campaign-suggestions.ts`
- `lib/ai/content-generator.ts`
- `app/(dashboard)/dashboard/ia/page.tsx`

**Acciones planificadas:**
- [ ] Diseñar arquitectura de módulo IA
- [ ] Crear `lib/ai/` con interfaces tipadas y mocks
- [ ] Implementar recomendaciones semanales (mock)
- [ ] Implementar sugerencias de campañas (mock)
- [ ] Implementar generación de textos de servicios (mock)
- [ ] Implementar análisis de huecos de agenda (calculado desde DB, no IA)
- [ ] Crear UI dashboard IA con estado "próximamente" para negocios BASIC/PRO
- [ ] Preparar integración con Anthropic API (sin activar)
- [ ] Crear `docs/informes/fase-11-ia-premium.md`

**Riesgos:**
- Sin API key de IA = todo mock — documentar claramente
- IA en dashboard puede aumentar costes si se activa sin control

**Definition of Done:**
- Módulo IA arquitecturado y tipado
- UI en dashboard con mocks funcionales
- Feature gateada a PREMIUM
- `npm run type-check` y `lint` pasan

**Dependencias:** Fase 10 ✅

---

### Fase 12 — SEO programático, sitemap, schema y páginas locales

**Estado:** 🔲 Pendiente
**Objetivo:** SEO hiperlocal con páginas de ciudad+categoría, schema.org completo.

**Archivos afectados:**
- `app/sitemap.ts` — sitemap completo
- `app/robots.ts` — robots actualizado
- `lib/seo/metadata.ts` — helpers JSON-LD
- `app/[categoria]/[ciudad]/page.tsx` — páginas locales (nuevas)
- `app/centro/[slug]/page.tsx` — JSON-LD LocalBusiness

**Acciones planificadas:**
- [ ] Auditar `app/sitemap.ts` — añadir centros, servicios, categorías
- [ ] Crear páginas locales `/[categoria]/[ciudad]` con centros reales
- [ ] Añadir noindex en páginas vacías (sin centros)
- [ ] Implementar JSON-LD `LocalBusiness` en fichas de centros
- [ ] Implementar JSON-LD `Service` en fichas de centros
- [ ] Implementar JSON-LD `Product` si hay productos
- [ ] Implementar JSON-LD `ItemList` en páginas de búsqueda/listados
- [ ] Canonical correcto en todas las páginas
- [ ] Crear `docs/informes/fase-12-seo.md`

**Riesgos:**
- Páginas locales vacías pueden generar thin content → noindex obligatorio
- JSON-LD mal formado puede ser penalizado por Google

**Definition of Done:**
- Sitemap incluye todas las fichas de centros publicados
- JSON-LD válido en fichas (verificable con Rich Results Test)
- Páginas locales sin centros tienen noindex
- `npm run type-check` y `lint` pasan

**Dependencias:** Fase 2 ✅

---

### Fase 13 — UX/UI profesional y design system

**Estado:** 🔲 Pendiente
**Objetivo:** Design system coherente y mobile-first para toda la plataforma.

**Archivos afectados:**
- `components/ui/` — todos los componentes
- `app/globals.css` — clases utility faltantes
- Todas las páginas públicas y dashboard

**Componentes a crear/completar:**
- [ ] `Card` — card genérico
- [ ] `Modal` — dialog accesible
- [ ] `Tabs` — tabs reutilizables
- [ ] `MonthCalendar` — calendario mes genérico
- [ ] `SlotPicker` — selector de slots
- [ ] `Price` — formato precio consistente
- [ ] `BusinessCard` — card de negocio
- [ ] `ProductCard` — card de producto
- [ ] `BonusCard` — card de bono
- [ ] `ReviewCard` — card de reseña
- [ ] `StatCard` — card de estadística

**Acciones planificadas:**
- [ ] Auditar componentes existentes en `components/ui/`
- [ ] Completar componentes faltantes
- [ ] Unificar uso de clases: `btn-primary`, `btn-outline`, `section-title`, etc.
- [ ] Verificar mobile-first en todas las páginas
- [ ] Crear `docs/informes/fase-13-ux-ui.md`

**Definition of Done:**
- Todos los componentes del spec existen y están tipados
- No hay mezcla de estilos incoherentes
- Todas las páginas son mobile-first responsive
- `npm run type-check` y `lint` pasan

**Dependencias:** Fases 1-8 ✅

---

### Fase 14 — Seguridad, privacidad, GDPR y multi-tenant

**Estado:** 🔲 Pendiente
**Objetivo:** Cerrar mínimos de seguridad y cumplimiento.

**Archivos afectados:**
- `app/actions/*.ts` — verificar tenant isolation en todas
- `app/api/v1/*.ts` — rate limiting
- `app/privacidad/page.tsx` — nueva
- `app/terminos/page.tsx` — nueva
- `app/cookies/page.tsx` — nueva
- `app/auth/signup/page.tsx` — consentimiento GDPR

**Acciones planificadas:**
- [ ] Auditar todas las server actions para tenant isolation
- [ ] Verificar que admin actions no exponen datos de un tenant a otro
- [ ] Implementar páginas legales mínimas
- [ ] Verificar consentimiento privacidad en registro y reserva
- [ ] Implementar consentimiento marketing separado
- [ ] Preparar endpoint export/delete usuario
- [ ] Añadir rate limiting básico en `/api/v1/availability` y `/api/v1/booking`
- [ ] Enmascarar email en páginas públicas de confirmación
- [ ] Crear `docs/informes/fase-14-seguridad-gdpr.md`

**Definition of Done:**
- No hay rutas que expongan datos cross-tenant
- Páginas legales existen y son accesibles
- Consentimientos GDPR implementados
- Rate limiting básico en endpoints críticos
- `npm run type-check` y `lint` pasan

**Dependencias:** Fases 1-10 ✅

---

### Fase 15 — Tests, QA, build y preparación para piloto

**Estado:** 🔲 Pendiente
**Objetivo:** Verificar que el producto está listo para un piloto real.

**Tests prioritarios:**
- Motor de disponibilidad
- Flujo de booking completo
- Cancelación
- Modificación
- Búsqueda
- Gating de planes
- Permisos multi-tenant

**Acciones planificadas:**
- [ ] Ejecutar `npm run type-check` — corregir todos los errores TS
- [ ] Ejecutar `npm run lint` — corregir todos los warnings
- [ ] Ejecutar `npm run build` — build limpio
- [ ] Escribir tests unitarios para `lib/availability/engine.ts`
- [ ] Escribir tests de integración para `app/actions/booking.ts`
- [ ] Verificar flujo completo de reserva manual (QA)
- [ ] Verificar flujo completo de cancelación manual (QA)
- [ ] Verificar dashboard completo con cuenta demo (QA)
- [ ] Verificar admin completo con cuenta admin (QA)
- [ ] Crear `docs/informes/fase-15-qa-build.md`
- [ ] Crear checklist de piloto

**Definition of Done:**
- `npm run build` pasa sin errores
- `npm run type-check` sin errores
- `npm run lint` sin errores
- Tests críticos escritos y pasando
- QA manual completado
- Informe de piloto listo

**Dependencias:** Todas las fases anteriores ✅

---

## Próxima fase recomendada

**Fase 1 — App pública abierta, home y claims honestos**

Es la fase con mayor impacto inmediato: eliminar los claims falsos protege legalmente y mejora la confianza, y es un cambio de bajo riesgo (solo `app/page.tsx`). Está lista para implementar en cuanto se reciba aprobación explícita.

---

*Documento vivo — actualizar tras cada fase completada*
*Ver estado actual en: `docs/backlog/estado-ejecucion.md`*
