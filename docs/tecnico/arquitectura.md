# Arquitectura Técnica — Belleza Local

## Stack

| Capa | Tecnología | Decisión |
|------|-----------|---------|
| Framework | Next.js 15 App Router | SSR + SSG + API routes en un solo repo |
| Lenguaje | TypeScript | Type safety obligatorio en todo el código |
| Base de datos | PostgreSQL | Relacional, transaccional, ideal para reservas |
| ORM | Prisma | Generación de tipos, migraciones, cliente tipado |
| Auth | Auth.js v5 | JWT + sesiones, adaptador Prisma, multi-proveedor |
| Pagos | Stripe | Suscripciones, webhooks, portal de cliente |
| Email | Resend | Transaccional, React Email para templates |
| Estilos | Tailwind CSS v4 | Utility-first, sin runtime CSS-in-JS |
| Componentes UI | shadcn/ui | Componentes accesibles y personalizables |
| Validación | Zod | Validación en client y server, schemas compartidos |
| Deploy | Vercel | Edge network, preview deployments, analytics |
| DB hosting | Neon o Railway | PostgreSQL managed, connection pooling |
| Storage | Cloudflare R2 | Imágenes de centros, S3-compatible, bajo coste |

## Arquitectura multi-tenant

### Modelo: Shared Database, Shared Schema

Todos los tenants comparten la misma base de datos y el mismo schema. El aislamiento se logra mediante:

1. **`organizationId` o `centerId`** en todos los modelos de negocio.
2. **Identidad derivada de la sesión** mediante `requireOrganization()`; nunca se confía en un tenant recibido del cliente.
3. **Filtros de pertenencia en la propia consulta Prisma/SQL** y pruebas negativas por rol y tenant.
4. **Validación en Server Actions y API routes** antes de cualquier operación.

No existe un middleware Prisma que aplique el tenant automáticamente ni se depende de RLS de Supabase. Por ello, cualquier nueva consulta privada debe usar los helpers tenant-aware y demostrar aislamiento mediante pruebas. El acceso REST anónimo de Supabase debe permanecer deshabilitado para estas tablas.

### Por qué shared schema (no schemas separados)

- Operaciones simples y bajo coste en fase inicial.
- Migraciones centralizadas y simples.
- Suficiente para el volumen esperado en MVP y Fase 1.
- Migrar a schemas separados si un cliente necesita aislamiento completo (Premium enterprise).

### Regla de aislamiento

```typescript
// Todo acceso a datos de negocio pasa por este patrón:
const center = await prisma.center.findFirst({
  where: {
    id: centerId,
    organizationId: session.user.organizationId, // nunca omitir
  },
})
```

## Estructura de rutas Next.js

```
app/
  layout.tsx                    → Root layout (providers, fonts, analytics)
  page.tsx                      → Home (marketplace/landing)
  globals.css

  (marketing)/                  → Grupo sin layout adicional
    buscar/
      page.tsx                  → /buscar (resultados)
      [localidad]/
        page.tsx                → /buscar/madrid
        [servicio]/
          page.tsx              → /buscar/madrid/depilacion-laser
    centros/[categoria]/
      [ciudad]/
        page.tsx                → /peluquerias/madrid
    centro/[slug]/
      page.tsx                  → Ficha del centro
      servicios/page.tsx
      bonos/page.tsx
      reservar/
        page.tsx                → Inicio flujo reserva
        [step]/page.tsx         → Pasos del flujo

  (dashboard)/                  → Requiere auth + rol BUSINESS
    layout.tsx                  → Sidebar, header de dashboard
    dashboard/
      page.tsx                  → /dashboard (resumen)
      agenda/page.tsx
      reservas/page.tsx
      servicios/page.tsx
      staff/page.tsx
      horarios/page.tsx
      clientes/page.tsx
      bonos/page.tsx
      productos/page.tsx
      promociones/page.tsx
      resenas/page.tsx
      analitica/page.tsx
      plan/page.tsx
      configuracion/page.tsx

  (admin)/                      → Requiere auth + rol PLATFORM_ADMIN
    layout.tsx
    admin/
      page.tsx                  → /admin (overview)
      centros/page.tsx
      organizaciones/page.tsx
      planes/page.tsx
      categorias/page.tsx
      localidades/page.tsx
      seo/page.tsx
      metricas/page.tsx

  cuenta/
    page.tsx                    → /cuenta (perfil usuario)
    reservas/page.tsx
    favoritos/page.tsx

  auth/
    signin/page.tsx
    signup/page.tsx
    error/page.tsx

  api/
    auth/[...nextauth]/route.ts → Auth.js handler
    webhooks/stripe/route.ts    → Stripe webhook
    v1/                         → API interna
      availability/route.ts
      bookings/route.ts
      centers/route.ts
      services/route.ts
```

## Lib / lógica de negocio

```
lib/
  db/
    client.ts           → Prisma singleton (evitar múltiples instancias en dev)
    tenant.ts           → Helpers de aislamiento multi-tenant

  auth/
    config.ts           → Auth.js config (providers, callbacks, session)
    session.ts          → Helpers de sesión y roles

  availability/
    engine.ts           → Motor de disponibilidad principal
    slots.ts            → Generador de slots libres
    conflicts.ts        → Detección de colisiones

  notifications/
    email.ts            → Resend + React Email templates
    sms.ts              → Twilio SMS (add-on)
    whatsapp.ts         → WhatsApp Business API (add-on)
    dispatcher.ts       → Selección de canal según plan

  billing/
    stripe.ts           → Cliente Stripe
    plans.ts            → Definición de planes y límites
    webhooks.ts         → Handlers de webhooks Stripe
    addons.ts           → Gestión de add-ons

  seo/
    metadata.ts         → Generadores de metadatos por tipo de página
    structured-data.ts  → JSON-LD schemas
    sitemap.ts          → Generación dinámica de sitemap

  validation/
    booking.ts          → Schema Zod de reserva
    center.ts           → Schema Zod de centro
    service.ts          → Schema Zod de servicio
```

## Seguridad en capas

```
1. Red: HTTPS forzado, HSTS
2. Auth: Auth.js JWT con expiración corta, refresh tokens
3. Autorización: middleware de Next.js + validación en cada API route
4. Multi-tenant: organizationId en TODAS las queries
5. Input: Zod en todos los endpoints de entrada
6. Output: no exponer IDs internos donde no sea necesario
7. Headers: CSP, X-Frame-Options, X-Content-Type-Options
8. Rate limiting: por IP en endpoints públicos (Vercel Edge)
```

## Decisiones arquitectónicas importantes

### Sin Google Calendar
El motor de disponibilidad es 100% propio. Google Calendar puede ser una integración opcional (sincronización bidireccional) pero nunca la fuente de verdad de disponibilidad.

### Sin microservicios en MVP
Todo en un monolito Next.js. Si alguna función se vuelve pesada (generación de SEO masiva, envío de notificaciones en batch), se mueve a un job externo o a n8n.

### API routes como backend
Las API routes de Next.js son el backend. En fase futura se pueden extraer a un servicio separado si el tráfico lo justifica. En MVP y Fase 1, no es necesario.

### Server Actions vs API routes
- **Server Actions**: para operaciones de formulario simples en el dashboard (crear servicio, actualizar horario).
- **API routes**: para operaciones críticas (reservas, pagos), webhooks externos, y cualquier cosa que necesite ser llamada desde fuera de Next.js.

### Caché y rendimiento
- **`cache: 'force-cache'`** en páginas SEO que no cambian con frecuencia.
- **`revalidate: 3600`** (1h) en fichas de centros.
- **`no-store`** en cualquier cosa relacionada con disponibilidad y reservas en tiempo real.

## Diagrama de flujo de reserva (simplificado)

```
Usuario → GET /centro/[slug]/reservar
       → Selecciona servicio, profesional, fecha
       → GET /api/v1/availability?centerId=&serviceId=&staffId=&date=
           → AvailabilityEngine.getSlots()
               → Leer horarios del centro/staff
               → Leer reservas existentes
               → Calcular slots libres
           → Return: [{ time: "10:00", available: true }, ...]
       → Selecciona hora
       → POST /api/v1/bookings
           → Validar datos (Zod)
           → Re-verificar disponibilidad (transacción DB)
           → Crear Booking en estado PENDING
           → Si hay depósito: crear PaymentIntent en Stripe
           → Cambiar estado a CONFIRMED
           → Enviar emails (confirmación usuario + notificación negocio)
           → Return: { bookingId, confirmationCode }
       → Redirect a /reserva/[confirmationCode] (página de éxito)
```
