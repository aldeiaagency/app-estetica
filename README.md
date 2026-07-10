# Belleza Local — SaaS + marketplace de belleza y bienestar

Plataforma multi-tenant para centros de belleza, estética, peluquería y bienestar no médico.

## Alcance actual

El núcleo validable del piloto incluye:

- centro, servicios, profesionales y horarios;
- agenda, reservas, cancelación y reprogramación;
- clientes, recordatorios y follow-ups;
- marketplace básico y captación B2B.

Productos, bonos, Beauty Concierge, IA, campañas y wallet existen detrás de **feature flags desactivados por defecto**. No deben activarse sin completar sus credenciales y smoke tests.

## Stack

- Next.js 15 App Router + TypeScript
- PostgreSQL/Supabase + Prisma
- Auth.js v5
- Stripe
- Resend
- Cloudflare R2
- Tailwind CSS
- Vercel
- Upstash Redis para rate limiting distribuido

## Arquitectura

```text
Multi-tenant compartido con autorización por sesión y filtros organizationId/centerId
Motor canónico de disponibilidad con protección PostgreSQL contra solapamientos
Pagos y reservas de stock idempotentes
Uploads validados y sanitizados en servidor antes de R2
Feature flags con valores seguros por defecto
Health checks, crons, CI, CodeQL y E2E
```

## Instalación local

Requisitos: Node.js 20 y PostgreSQL 16.

```bash
git clone https://github.com/aldeiaagency/app-estetica.git
cd app-estetica
npm ci
cp .env.example .env.local
# Configura DATABASE_URL, DIRECT_URL, AUTH_SECRET, APP URL y CRON_SECRET
npx prisma generate
npx prisma migrate deploy
npm run dev
```

No utilices `prisma db push` en staging o producción: existen constraints y tablas operativas creados con SQL nativo.

## Validación

```bash
npm run lint
npm run type-check
npm test
npm run build
npm run security:audit
```

Los E2E se ejecutan en CI con Playwright. Para ejecutarlos localmente, instala temporalmente el runner y Chromium:

```bash
npm install --no-save --no-package-lock @playwright/test@1.52.0
npx playwright install chromium
npm run test:e2e
```

## Estructura relevante

```text
app/                         Rutas, Server Actions, APIs y crons
components/                  UI pública y dashboard
lib/auth/                    Sesiones y autorización multi-tenant
lib/availability/            Disponibilidad y resolución canónica de slots
lib/billing/                 Stripe, inventario e idempotencia
lib/security/                Rate limiting
lib/storage/                 Validación y subida de imágenes
lib/observability/           Logging y alertas
prisma/migrations/           Esquema evolutivo y constraints nativos
tests/                       Unitarios, integración y E2E
docs/                        Producto, seguridad y operación
```

## Operación

- Liveness: `/api/health/live`
- Readiness: `/api/health/ready`
- Variables: `.env.example`
- Despliegue: [`docs/DEPLOYMENT_CHECKLIST.md`](docs/DEPLOYMENT_CHECKLIST.md)
- Incidentes y rollback: [`docs/OPERATIONS_RUNBOOK.md`](docs/OPERATIONS_RUNBOOK.md)
- Arquitectura de seguridad: [`docs/SECURITY_ARCHITECTURE.md`](docs/SECURITY_ARCHITECTURE.md)
- Estado de producción: [`docs/PRODUCTION_READINESS.md`](docs/PRODUCTION_READINESS.md)
- Objetos SQL nativos: [`prisma/README.md`](prisma/README.md)

## Documentación de producto

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
- [Seguridad y GDPR](docs/tecnico/seguridad-gdpr.md)
