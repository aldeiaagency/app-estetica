# Informe Fase 16 — Marketplace de productos, pagos y cuenta de cliente

**Fecha:** 2026-06-10
**Estado:** ✅ COMPLETADO (build limpio, 61/61 tests, migración aplicada)

---

## Origen

Auditoría externa de Belleza Local. Diagnóstico: el SaaS de reservas está sólido (~85%),
pero el "marketplace de productos" era un esqueleto (~25%) con un bug crítico de precios.
Esta fase resuelve los 7 puntos accionables de esa auditoría.

---

## Trabajo realizado

### 1. 🚨 Bug de manipulación de precios (CRÍTICO) — resuelto

**Antes:** `app/actions/orders.ts` calculaba el total del pedido con los `priceCents`
enviados por el **cliente**. Cualquiera podía comprar con `priceCents: 1`.

**Ahora:**
- El schema de input solo acepta `productId` + `quantity` (nunca nombre ni precio).
- El total y el precio por línea se calculan **exclusivamente con los precios de la BD**.
- Deduplicación de cantidades si el carrito envía el mismo producto dos veces.
- El frontend (`checkout/page.tsx`) ya solo envía `productId` + `quantity`.

### 2. 🔗 Links legales rotos — resueltos

5 enlaces apuntaban a `/legal/privacidad` y `/legal/terminos` (404). Las páginas reales
viven en `/privacidad` y `/terminos` (Fase 14). Corregidos en:
`checkout`, `booking-wizard`, `bono-purchase-form`, `auth/signup`.

### 3. 🧱 Taxonomía de productos — implementada

- Nuevo modelo `ProductCategory` (jerárquico vía `parentId`, espejo de `ServiceCategory`).
- `Product` ampliado: `categoryId`, `slug` (único por centro), `images[]` (multi-imagen).
- Migración `20260610120000_add_product_marketplace` — **aplicada en BD** (no destructiva).
- Seed `prisma/seed-product-categories.mjs`: 8 categorías base (capilar, facial, corporal,
  maquillaje, uñas, solar, perfumes, accesorios) + asignación heurística a productos.
  **Ejecutado: 8 categorías creadas.**

### 4. 🔍 Filtros en `/productos` — implementados

Página reescrita con sidebar de filtros combinables:
- **Categoría** (vía `ProductCategory.slug`)
- **Ciudad** (vía `center.addressCity`, opciones cargadas dinámicamente)
- **Marca** (distinct de productos publicados)
- **Rango de precio** (mín/máx en €)
- **Orden** (recientes / precio ascendente / descendente)
Todos los filtros preservan el resto de parámetros al combinarse. `noindex` mantenido.

### 5. 💳 Stripe en productos y bonos — conectado

Patrón **Stripe Checkout Session (modo `payment`)**, coherente con el webhook de suscripciones:
- `lib/billing/checkout.ts` (nuevo): `createOrderCheckoutSession`, `fulfillOrderPayment`,
  `createBonoCheckoutSession`, `fulfillBonoPayment` (con idempotencia).
- `lib/billing/stripe.ts`: helper `isStripeConfigured()` + `APP_URL`.
- Webhook `checkout.session.completed` extendido para `mode: 'payment'` → marca pedido `PAID`
  o crea la `BonoInstance` al confirmarse el pago.
- **Degradación elegante:** mientras `STRIPE_SECRET_KEY` no esté configurada (hoy está
  comentada), el flujo se mantiene como "pago en el centro" (click & collect). Cuando se
  active la clave, el cobro online funciona sin cambios de código.

### 6. 👤 Cuenta de cliente `/cuenta` — creada

Portal del cliente final (rol CUSTOMER). Muestra, **filtrado por el email autenticado**
(privacidad y multi-tenant garantizados), tres secciones: reservas, pedidos y bonos, cada
una con su estado. El middleware ya protegía la ruta; ahora tiene contenido.

### 7. 🧪 Tests del motor de disponibilidad — añadidos

- Refactor: lógica pura extraída a `lib/availability/slots.ts` (`computeTotalDuration`,
  `localDayOfWeekMondayZero`, `overlaps`, `hasConflict`, `buildCandidateSlots`,
  `generateConfirmationCode`). El `engine.ts` ahora la consume (comportamiento idéntico).
- `tests/availability-slots.test.ts`: **20 tests** cubriendo solapamiento (el caso que
  causa dobles reservas), generación de slots, slots en el pasado, jornada insuficiente,
  bloqueo total, y formato del código de confirmación.

### 8. 🛒 Coherencia del modelo `Order` (click & collect)

`OrderStatus` ampliado con `PAID`, `READY`, `COMPLETED` (sin eliminar `SHIPPED`/`DELIVERED`
legacy, para no romper datos previos). Flujo: `PENDING → PAID → READY → COMPLETED`.
Dashboard de pedidos y `updateOrderStatusAction` actualizados al nuevo flujo.

---

## Verificación

| Verificación | Resultado |
|---|---|
| `npm run test` | ✅ 61/61 (4 suites; +20 tests del motor) |
| `npm run build` | ✅ Limpio — 41 rutas, 0 errores, 0 warnings |
| Migración BD | ✅ `20260610120000_add_product_marketplace` aplicada |
| Seed categorías | ✅ 8 ProductCategory creadas |
| Rutas nuevas | `/cuenta`, `/bono/gracias` |

### Nota sobre la base de datos

La BD apuntada por `.env.local` está **vacía de datos de negocio** (0 centros, 0 productos,
0 pedidos). Se hizo **baseline** de las 2 migraciones previas (`init`, `add_orders`) porque
el schema existía sin historial de migraciones registrado (P3005). Para tener datos de
prueba:
```bash
node --env-file=.env.local prisma/seed.mjs                      # datos demo
node --env-file=.env.local prisma/seed-product-categories.mjs   # re-categoriza productos
```

### Nota sobre Stripe

`STRIPE_SECRET_KEY` está comentada en `.env.local`. El código de pago está completo y
verificado en compilación, pero **el cobro real requiere activar la clave** y configurar el
webhook (`checkout.session.completed`) apuntando a `/api/webhooks/stripe`. Sin clave, el
marketplace funciona en modo "pago en el centro".

---

## Cierre de la auditoría

| Punto auditoría | Estado |
|---|---|
| Bug de precio en checkout | ✅ Resuelto |
| Sin `ProductCategory` | ✅ Creado |
| Filtros pobres en `/productos` | ✅ Ciudad/categoría/marca/precio/orden |
| Sin cobro online (productos) | ✅ Stripe conectado (degradación elegante) |
| Sin cobro online (bonos) | ✅ Stripe conectado |
| Sin cuenta de cliente | ✅ `/cuenta` creada |
| Sin tests del motor | ✅ 20 tests |
| Incoherencia envío en `Order` | ✅ Estados click & collect |
| Links legales rotos | ✅ Corregidos |
| Rate limiting (la auditoría lo daba por ausente) | ✅ Ya existía (Fase 14) |

### Pendiente (fuera de alcance de esta fase)
- Entidad `City` normalizada + geo-radio (lat/lng) — mejora futura para SEO y filtros.
- Variantes de producto (tamaño/color), reseñas de producto, wishlist.
- Decisión de negocio de comisión (documentada en backlog, post-MVP).
