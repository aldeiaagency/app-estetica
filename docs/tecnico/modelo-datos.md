# Modelo de Datos — Belleza Local

## Principios

1. Todo dato de negocio lleva `organizationId` o `centerId` para aislamiento multi-tenant.
2. Los IDs son `cuid()` (no UUIDs, no autoincrement) para seguridad y portabilidad.
3. Los precios siempre en céntimos (entero) para evitar errores de punto flotante.
4. Los timestamps siempre en UTC, conversión a zona horaria (Europe/Madrid) solo en UI.
5. Los estados de reserva son un enum con transiciones controladas.

## Entidades principales

### Auth y usuarios

```
User
  id: cuid
  email: string (unique)
  emailVerified: DateTime?
  name: string?
  image: string?
  role: UserRole (CUSTOMER | BUSINESS | PLATFORM_ADMIN)
  createdAt: DateTime

Account (Auth.js adapter)
  id, userId, type, provider, providerAccountId, ...

Session (Auth.js adapter)
  id, sessionToken, userId, expires
```

### Organización y centros

```
Organization
  id: cuid
  name: string
  slug: string (unique)
  plan: Plan (BASIC | PRO | GROWTH | PREMIUM)
  planExpiresAt: DateTime?
  stripeCustomerId: string? (unique)
  stripeSubscriptionId: string? (unique)
  maxCenters: int (calculado del plan)
  createdAt: DateTime

Center
  id: cuid
  organizationId: string (FK Organization)
  name: string
  slug: string (unique)
  description: string?
  descriptionLong: string? (SEO, descripción larga)
  category: CenterCategory (enum)
  phone: string?
  whatsapp: string?
  email: string?
  website: string?
  addressStreet: string
  addressCity: string
  addressProvince: string
  addressPostalCode: string
  addressLat: Decimal?
  addressLng: Decimal?
  coverImage: string?
  galleryImages: string[] (JSON array de URLs)
  published: bool (default false — requiere aprobación admin)
  approvedAt: DateTime?
  approvedBy: string?
  seoNoindex: bool (default false — control admin)
  createdAt: DateTime

  → relations: services, staff, bookings, scheduleRules, reviews
```

### Categorías de centro (enum)

```
PELUQUERIA
ESTETICA
UNAS
CEJAS_PESTANAS
DEPILACION
MASAJES
SPA
COSMETICA
BELLEZA_INTEGRAL
OTRO
```

### Servicios

```
ServiceCategory
  id: cuid
  name: string
  slug: string (unique)
  description: string?
  icon: string?
  order: int

Service
  id: cuid
  centerId: string (FK Center)
  categoryId: string? (FK ServiceCategory)
  name: string
  description: string?
  durationMinutes: int
  priceCents: int
  bufferMinutesBefore: int (default 0)
  bufferMinutesAfter: int (default 10)
  maxCapacity: int (default 1 — servicios grupales en el futuro)
  active: bool (default true)
  order: int
  createdAt: DateTime

ServiceStaff (many-to-many)
  serviceId: string (FK Service)
  staffId: string (FK Staff)
```

### Staff y recursos

```
Staff
  id: cuid
  centerId: string (FK Center)
  name: string
  role: string?
  bio: string?
  image: string?
  active: bool (default true)
  order: int
  createdAt: DateTime

Resource (cabinas, sillones, cabinas laser, etc.)
  id: cuid
  centerId: string (FK Center)
  name: string
  type: string?
  capacity: int (default 1)
  active: bool (default true)
```

### Horarios

```
ScheduleRule (horario semanal recurrente)
  id: cuid
  centerId: string? (FK Center) — null si es del staff
  staffId: string? (FK Staff)
  dayOfWeek: int (0=lunes, 6=domingo)
  openTime: string ("09:00")
  closeTime: string ("20:00")
  active: bool

ScheduleException (día con horario distinto o cierre)
  id: cuid
  centerId: string? (FK Center)
  staffId: string? (FK Staff)
  date: DateTime
  isClosed: bool
  openTime: string?
  closeTime: string?
  reason: string? ("vacaciones", "festivo", etc.)

ManualBlock (bloqueo manual de un slot)
  id: cuid
  centerId: string (FK Center)
  staffId: string?
  startAt: DateTime
  endAt: DateTime
  reason: string?
```

### Reservas

```
Customer (usuario que reserva — puede ser anonimo)
  id: cuid
  userId: string? (FK User — si tiene cuenta)
  centerId: string (FK Center — cliente pertenece a un centro)
  name: string
  email: string
  phone: string?
  noShowCount: int (default 0)
  consentGivenAt: DateTime
  createdAt: DateTime

  @@unique([email, centerId])  -- mismo email puede existir en múltiples centros

Booking
  id: cuid
  confirmationCode: string (unique, 8 chars alfanumérico, visible al usuario)
  centerId: string (FK Center)
  serviceId: string (FK Service)
  staffId: string? (FK Staff)
  resourceId: string? (FK Resource)
  customerId: string (FK Customer)
  startAt: DateTime
  endAt: DateTime  (startAt + service.durationMinutes)
  status: BookingStatus
  source: BookingSource
  depositCents: int?
  depositPaid: bool (default false)
  stripePaymentIntentId: string?
  notes: string?
  internalNotes: string? (solo visible al negocio)
  reminderSentAt: DateTime? (cuándo se envió el recordatorio)
  noShowAt: DateTime?
  cancelledAt: DateTime?
  cancelledBy: CancelledBy? (CUSTOMER | BUSINESS | SYSTEM)
  cancellationReason: string?
  createdAt: DateTime

  @@index([centerId, startAt, endAt])
  @@index([centerId, status])
  @@index([customerId])

enum BookingStatus:
  PENDING      → Creada, pendiente confirmación
  CONFIRMED    → Confirmada (pago si aplica)
  CANCELLED    → Cancelada
  COMPLETED    → Completada (post-servicio)
  NO_SHOW      → Cliente no apareció

enum BookingSource:
  WEB          → Reserva directa en la ficha del centro
  MARKETPLACE  → Reserva generada desde búsqueda en la plataforma
  DASHBOARD    → Creada manualmente por el negocio
  API          → Via API (Premium)

WaitlistEntry
  id: cuid
  centerId: string (FK Center)
  serviceId: string (FK Service)
  staffId: string?
  customerId: string (FK Customer)
  requestedDate: DateTime
  notifiedAt: DateTime?
  status: WaitlistStatus (WAITING | NOTIFIED | BOOKED | EXPIRED)
  createdAt: DateTime
```

### Comercio (Pro)

```
Bono
  id: cuid
  centerId: string (FK Center)
  name: string
  description: string?
  sessions: int (número de sesiones incluidas)
  validityDays: int (días de validez desde activación)
  priceCents: int
  serviceId: string? (FK Service — si es para un servicio específico)
  active: bool
  createdAt: DateTime

BonoInstance (bono comprado/emitido)
  id: cuid
  bonoId: string (FK Bono)
  customerId: string (FK Customer)
  centerId: string (FK Center)
  sessionsRemaining: int
  purchasedAt: DateTime
  activatedAt: DateTime?
  expiresAt: DateTime?
  stripePaymentId: string?

Product
  id: cuid
  centerId: string (FK Center)
  name: string
  description: string?
  brand: string?
  priceCents: int
  stock: int?
  image: string?
  active: bool
  createdAt: DateTime

Promotion
  id: cuid
  centerId: string (FK Center)
  title: string
  description: string?
  discountType: DiscountType (PERCENTAGE | FIXED_AMOUNT)
  discountValue: int (porcentaje 0-100 o céntimos)
  serviceId: string? (FK Service — null = aplica a todo)
  startsAt: DateTime
  endsAt: DateTime
  active: bool
  createdAt: DateTime
```

### Reseñas (Pro)

```
Review
  id: cuid
  centerId: string (FK Center)
  bookingId: string (FK Booking, unique — una reseña por reserva)
  customerId: string (FK Customer)
  rating: int (1-5)
  comment: string?
  publishedAt: DateTime?
  approved: bool (default false — requiere moderación o auto-aprobación)
  moderatedBy: string? (admin userId)
  reply: string? (respuesta del negocio)
  repliedAt: DateTime?
  createdAt: DateTime
```

### Billing y planes

```
PlanConfig (configuración de límites por plan, gestionada por admin)
  plan: Plan (PK)
  maxCenters: int
  maxServicesPerCenter: int
  maxStaffPerCenter: int
  hasBookingDeposit: bool
  hasBonos: bool
  hasProducts: bool
  hasPromotions: bool
  hasReviews: bool
  hasWaitlist: bool
  hasCRM: bool
  hasMultiCenter: bool
  hasFeaturedListing: bool
  hasWhiteLabelOption: bool
  hasApiAccess: bool
  monthlyPriceCents: int
  annualPriceCents: int
  stripePriceIdMonthly: string?
  stripePriceIdAnnual: string?

OrganizationAddOn
  id: cuid
  organizationId: string (FK Organization)
  addOnType: AddOnType (WHATSAPP | SMS | AI_RECEPTIONIST | FEATURED_LISTING | ...)
  centerId: string? (si el add-on es por centro)
  activeFrom: DateTime
  activeTo: DateTime?
  stripeSubscriptionItemId: string?
  active: bool
```

### SEO y marketplace

```
LocalityPage (páginas SEO de ciudad/categoría)
  id: cuid
  city: string
  province: string?
  category: CenterCategory?
  service: string? (slug del servicio)
  slug: string (unique)
  title: string?
  description: string?
  noindex: bool (default false — admin puede forzar noindex)
  published: bool
  centerCount: int (actualizado periódicamente)
  lastUpdatedAt: DateTime

FeaturedListing
  id: cuid
  centerId: string (FK Center)
  city: string
  category: CenterCategory?
  service: string? (slug del servicio)
  priority: int (mayor número = más arriba)
  startsAt: DateTime
  endsAt: DateTime
  active: bool
  priceCents: int (cuánto pagó)

AdminAuditLog
  id: cuid
  actorId: string (FK User — admin que hizo la acción)
  action: string ("center.publish", "plan.change", etc.)
  targetType: string ("Center", "Organization", etc.)
  targetId: string
  metadata: Json (datos adicionales)
  createdAt: DateTime
```

## Índices críticos

```prisma
@@index([centerId, startAt, endAt])   // Booking — motor de disponibilidad
@@index([centerId, status])            // Booking — filtros de agenda
@@index([email, centerId])             // Customer — unicidad de cliente por centro
@@index([organizationId])              // Center — queries multi-tenant
@@index([city, category])             // Center — búsqueda marketplace
@@index([centerId, dayOfWeek])        // ScheduleRule — disponibilidad
```
