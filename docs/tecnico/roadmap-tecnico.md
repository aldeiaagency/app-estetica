# Roadmap Técnico — Belleza Local

## Sprint 0 — Setup (1 semana)

- [ ] Instalar dependencias: `npm install` limpio
- [ ] Añadir Tailwind CSS v4
- [ ] Añadir shadcn/ui base
- [ ] Añadir Auth.js v5 + adaptador Prisma
- [ ] Configurar Resend
- [ ] Configurar Stripe SDK
- [ ] Actualizar schema Prisma (modelo completo)
- [ ] Primera migración: `npx prisma migrate dev --name init`
- [ ] Configurar base de datos en Neon o Railway
- [ ] Deploy en Vercel (con DATABASE_URL y secrets)
- [ ] CI básico: `npm run build` en GitHub Actions

## Sprint 1 — Auth + Skeleton (1 semana)

- [ ] Layout root (fonts, providers, globals.css)
- [ ] Páginas auth: `/auth/signin`, `/auth/signup`
- [ ] Middleware de protección de rutas
- [ ] Layout del dashboard (sidebar, header)
- [ ] Layout del admin (protegido)
- [ ] Páginas placeholder: dashboard, admin, cuenta
- [ ] Componentes UI base: Button, Input, Card, Badge (shadcn/ui)
- [ ] Home placeholder con buscador básico

## Sprint 2 — Onboarding negocio (1 semana)

- [ ] Wizard onboarding 5 pasos
- [ ] CRUD organización + centro
- [ ] CRUD servicios
- [ ] CRUD staff
- [ ] Configuración horarios semanales
- [ ] Vista de ficha pública (preview antes de publicar)
- [ ] Enviar a revisión (cambia centro a estado pendiente)

## Sprint 3 — Motor disponibilidad + Reservas (1.5 semanas)

- [ ] `lib/availability/engine.ts` completo
- [ ] Tests unitarios del motor
- [ ] `GET /api/v1/availability` — slots disponibles
- [ ] Flujo de reserva frontend (5 pasos)
- [ ] `POST /api/v1/bookings` — crear reserva con transacción
- [ ] Página de confirmación de reserva
- [ ] Cancelación por token (sin auth)
- [ ] Emails de confirmación y cancelación (Resend + React Email)

## Sprint 4 — Agenda y dashboard básico (1 semana)

- [ ] Vista de agenda (día) en dashboard
- [ ] Listado de reservas con filtros
- [ ] Crear reserva manual desde dashboard
- [ ] Cancelar/modificar reserva desde dashboard
- [ ] Ficha básica de cliente
- [ ] Estadísticas simples (contador de reservas del mes)

## Sprint 5 — Frontend público y búsqueda (1 semana)

- [ ] Home con buscador real
- [ ] Página de resultados por ciudad + categoría
- [ ] Ficha pública del centro completa
- [ ] SEO básico: metadatos dinámicos, canonical
- [ ] Structured data LocalBusiness
- [ ] Sitemap básico

## Sprint 6 — Billing (1 semana)

- [ ] Productos y precios en Stripe (Basic, Pro)
- [ ] Checkout con Stripe Checkout Session
- [ ] Webhook: `customer.subscription.created/updated/deleted`
- [ ] Activar/desactivar plan en `Organization` según webhook
- [ ] Página de planes en dashboard
- [ ] Portal de cliente Stripe (gestión de facturación)
- [ ] Feature gating: no mostrar funciones Pro en Basic

## Sprint 7 — Admin básico + QA (1 semana)

- [ ] Panel admin: listado de centros
- [ ] Aprobar / publicar / bloquear centros
- [ ] Cambiar plan de organización
- [ ] Login admin protegido
- [ ] QA del flujo completo de reserva
- [ ] QA de onboarding negocio
- [ ] Revisión de seguridad básica
- [ ] Performance: LCP < 2.5s en ficha pública
- [ ] Preparar `.env` de producción
- [ ] Deploy a producción limpio

## Sprint 8+ — Iteración post-MVP

Ver `docs/producto/roadmap-producto.md` para fases 2, 3 y 4.

## Deuda técnica a no acumular

- No mergear código sin types TypeScript correctos (`any` es deuda).
- No crear API routes sin validación Zod.
- No acceder a datos de negocio sin verificar `organizationId`.
- No mergear sin que el build pase.
- Documentar el motor de disponibilidad siempre que cambie.

## Comandos de referencia

```bash
# Desarrollo
npm run dev

# Base de datos
npx prisma migrate dev --name <nombre>     # Nueva migración
npx prisma migrate reset                   # Reset completo (solo dev)
npx prisma studio                          # GUI de base de datos
npx prisma generate                        # Regenerar cliente tras cambio de schema
npx prisma db push                         # Push de schema sin migración (prototipos)

# Build y calidad
npm run build
npm run lint
npm run type-check    # tsc --noEmit

# Emails (React Email)
npx react-email dev   # Previsualizar templates de email

# Tests (cuando existan)
npm test
npm run test:coverage
```

## Monitoreo en producción (post-MVP)

- Sentry para errores de aplicación
- Vercel Analytics para performance y Core Web Vitals
- PostHog para product analytics
- Alertas de pagos fallidos vía Stripe Dashboard
- Alertas de base de datos (Neon/Railway tienen monitoreo básico)
