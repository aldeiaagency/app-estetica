# Matriz de implementación — PR #4

| # | Área | Estado | Implementación principal |
|---:|---|---|---|
| 1 | Aislamiento multiempresa | Completado | `lib/auth/authorization.ts`, `app/actions/dashboard.ts`, tests de invariantes |
| 2 | Reservas canónicas | Completado | `lib/availability/booking-slot.ts`, `engine.ts`, `app/actions/booking.ts`, constraint GiST |
| 3 | Inventario y Checkout | Completado | `OrderStockReservation`, `orders.ts`, webhook y cron |
| 4 | Stripe | Completado | idempotencia persistente, lifecycle de checkout/subscription/invoice |
| 5 | Auth y sesiones | Completado | normalización, password policy, active/sessionVersion, tokens de un uso |
| 6 | Rate limiting | Completado en código | Upstash + fallback; requiere credenciales externas en producción |
| 7 | Uploads | Completado | validación binaria/sanitización en servidor; ruta directa retirada |
| 8 | Feature flags | Completado | módulos avanzados cerrados por defecto y protegidos por middleware |
| 9 | CI/calidad | Completado | CI, audit, migraciones, tests, build, Playwright, CodeQL, Dependabot |
| 10 | E2E | Completado | shell público, guards, flags, health/readiness y headers |
| 11 | Base de datos | Completado | constraints, índices, auditoría crítica y tests concurrentes |
| 12 | Observabilidad | Completado | logging redactado, health checks, crons, runbook y alert webhook |
| 13 | UX/accesibilidad | Completado | skip link, focus, reduced motion y estados de upload accesibles |
| 14 | Documentación | Completado | readiness, seguridad, operaciones, despliegue y objetos SQL nativos |

## Dependencias externas

No forman parte del código y deben completarse en los paneles correspondientes:

- variables Vercel;
- Upstash Redis;
- Stripe test/live y webhooks;
- Resend y DNS de correo;
- Cloudflare R2/CDN;
- Google OAuth;
- dominio final;
- canal de alertas y n8n.

El criterio verificable final es CI/CodeQL verde más smoke tests sobre preview con dichas integraciones.
