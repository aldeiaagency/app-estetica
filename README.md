# Belleza Local — SaaS + Marketplace de Belleza y Bienestar

Plataforma SaaS + marketplace hiperlocal para negocios de belleza, estética, peluquería y bienestar no médico.

## Qué es

- **Para negocios**: digitaliza tu centro sin herramientas caras. Agenda, reservas, servicios, staff, bonos, productos y visibilidad online.
- **Para usuarios**: encuentra y reserva en centros de belleza cercanos, con disponibilidad real, sin llamar.
- **Para la plataforma**: modelo SaaS por suscripción + marketplace progresivo + add-ons.

## Stack

- **Frontend / Full-stack**: Next.js 15 (App Router) + TypeScript
- **Base de datos**: PostgreSQL + Prisma ORM
- **Auth**: Auth.js v5
- **Pagos**: Stripe
- **Email**: Resend
- **Estilos**: Tailwind CSS
- **Deploy**: Vercel / Railway

## Arquitectura rápida

```
Multi-tenant compartido · Row-level security por organizationId/centerId
Motor de disponibilidad propio · Sin Google Calendar
Notificaciones email-first en básico, WhatsApp/SMS como add-on en premium
SEO programático hiperlocal con control de indexación
```

## Instalación local

```bash
git clone https://github.com/aldeiaagency/app-estetica.git
cd app-estetica
npm install
cp .env.example .env.local
# Edita .env.local con tus credenciales
npx prisma migrate dev --name init
npx prisma generate
npm run dev
```

## Estructura de carpetas

```
app/                    → Next.js App Router
  (marketing)/          → Frontend público: home, búsqueda, fichas, SEO
  (dashboard)/          → Panel del negocio
  (admin)/              → Admin de plataforma
  api/                  → API routes
components/
  ui/                   → Componentes base (botones, inputs, modals)
  marketing/            → Header, Footer, Hero, CTAs
  marketplace/          → CenterCard, SearchFilters, MapView
  booking/              → BookingFlow, Calendar, TimeSlots
  dashboard/            → Agenda, ServiceForm, StaffManager
  admin/                → CenterList, PlanManager, ModerationQueue
lib/
  db/                   → Cliente Prisma singleton
  auth/                 → Configuración Auth.js
  availability/         → Motor de disponibilidad
  notifications/        → Email, SMS, WhatsApp
  billing/              → Stripe, planes, add-ons
  seo/                  → Metadata, structured data, sitemaps
  validation/           → Schemas Zod
prisma/
  schema.prisma         → Modelo de datos completo
docs/
  producto/             → PRD, MVP, planes, SEO, UX, roadmap
  tecnico/              → Arquitectura, modelo datos, motor, roles, notificaciones
```

## Planes

| Plan | Precio | Descripción |
|------|--------|-------------|
| Basic | 24 €/mes | Ficha + agenda + reservas + recordatorios comunes |
| Pro | 59 €/mes | + Bonos, pagos, anti no-show, reseñas, promociones |
| Growth | 149 €/mes | + Multi-centro (hasta 3), CRM ligero, marketplace activo |
| Premium | 399 €+/mes | + Marca blanca, API, BI avanzado, soporte prioritario |

## Documentación

- [PRD](docs/producto/prd.md)
- [MVP](docs/producto/mvp.md)
- [Planes y monetización](docs/producto/planes-y-monetizacion.md)
- [SEO programático](docs/producto/seo-programatico.md)
- [UX/CRO](docs/producto/ux-cro.md)
- [Roadmap producto](docs/producto/roadmap-producto.md)
- [Arquitectura técnica](docs/tecnico/arquitectura.md)
- [Modelo de datos](docs/tecnico/modelo-datos.md)
- [Motor de disponibilidad](docs/tecnico/motor-disponibilidad.md)
- [Roles y permisos](docs/tecnico/roles-permisos.md)
- [Notificaciones](docs/tecnico/notificaciones.md)
- [Seguridad y GDPR](docs/tecnico/seguridad-gdpr.md)
- [Backlog](backlog.md)
