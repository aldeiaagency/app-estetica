# MVP — Belleza Local

## Definición de MVP

El MVP es la versión mínima que permite:

1. Un negocio crear su ficha y recibir reservas online.
2. Un usuario buscar y reservar en un centro.
3. Cobrar a negocios por una suscripción básica.

## Lo que debe funcionar en el MVP

### Negocio
- [ ] Registro + login
- [ ] Crear organización + centro
- [ ] Configurar servicios (nombre, duración, precio)
- [ ] Configurar horarios semanales
- [ ] Añadir staff básico
- [ ] Publicar ficha
- [ ] Ver agenda (día)
- [ ] Ver reservas del día
- [ ] Recibir email cuando entra una reserva
- [ ] Suscripción Basic (24 €/mes vía Stripe)

### Usuario final
- [ ] Buscar centros por ciudad + categoría
- [ ] Ver ficha del centro
- [ ] Seleccionar servicio + profesional + fecha + hora
- [ ] Confirmar reserva con nombre + email + teléfono
- [ ] Recibir email de confirmación
- [ ] Cancelar reserva con enlace en email

### Plataforma/Admin
- [ ] Aprobar centros antes de publicar
- [ ] Login admin protegido
- [ ] Ver listado de centros

### Motor de disponibilidad
- [ ] Calcular slots disponibles por servicio + staff + fecha
- [ ] Prevenir doble reserva
- [ ] Respetar horarios del centro

## No incluido en MVP

- Bonos, productos, promociones
- Reseñas
- WhatsApp/SMS
- Multi-centro
- Modificación de reserva (solo cancelación)
- Recordatorio 24h antes (se prioriza en ciclo 2)
- Analítica avanzada
- Marketplace con ranking
- SEO programático completo (solo rutas base)
- Cabinas/recursos
- Lista de espera
- Depósito anti no-show
- CRM

## Criterios de aceptación del MVP

1. Un negocio puede registrarse y publicar su ficha en < 15 minutos.
2. Un usuario puede reservar sin crear cuenta (guest checkout de reservas).
3. El motor de disponibilidad no permite doble reserva bajo carga concurrente.
4. Los emails de confirmación llegan en < 60 segundos.
5. El pago a Stripe se procesa y el plan se activa automáticamente.
6. El admin puede aprobar/bloquear centros desde panel propio.
7. La ficha pública carga en < 2 segundos (LCP).
8. Las rutas de búsqueda básicas están indexadas (no noindex).

## Estimación de tiempo

| Área | Estimación |
|------|-----------|
| Infraestructura base | 2 días |
| Auth + onboarding negocio | 3 días |
| Dashboard básico (agenda, servicios, horarios) | 5 días |
| Motor de disponibilidad | 3 días |
| Flujo de reserva usuario | 3 días |
| Ficha pública | 2 días |
| Búsqueda básica | 2 días |
| Stripe billing | 2 días |
| Admin básico | 2 días |
| Emails transaccionales | 1 día |
| QA + ajustes | 3 días |
| **Total estimado** | **~28 días** |

## Stack MVP confirmado

- Next.js 15 App Router + TypeScript
- PostgreSQL (Neon o Railway) + Prisma
- Auth.js v5 (email/password + Google)
- Stripe Checkout + Webhooks
- Resend (email transaccional)
- Tailwind CSS + shadcn/ui (componentes base)
- Vercel (deploy)
- Cloudflare R2 (imágenes)

## Validación post-MVP

Métricas a medir tras lanzar MVP:
- ¿Cuántos negocios se registran y publican ficha?
- ¿Cuántas reservas se generan en la primera semana?
- ¿Cuántos upgrades a Pro hay en el primer mes?
- ¿Qué punto del onboarding abandona más gente?
