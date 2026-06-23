# 08 · Backlog priorizado final

Leyenda: **P0** bloquea operación · **P1** importante antes de usuarias reales · **P2** producto/robustez · **P3** limpieza/escala.
Esfuerzo: S (<2h) · M (medio día) · L (1-2 días). Resp.: 🤖 yo / 👤 tú.

---

## P0 — Operación (sin esto la app no opera)
| ID | Tarea | Esf. | Resp. | Notas |
|---|---|:--:|:--:|---|
| P0-1 | `CRON_SECRET` a Vercel + probar 3 crons | S | 🤖 | tengo token Vercel |
| P0-2 | Stripe: cuenta + 4 productos/precios + webhook | M | 👤 | código listo |
| P0-3 | `STRIPE_*` (10 vars) a Vercel + prueba checkout/webhook | S | 🤖 | tras P0-2 |
| P0-4 | Resend: cuenta + verificar dominio + key | M | 👤 | requiere DNS |
| P0-5 | `RESEND_API_KEY`/`EMAIL_FROM` a Vercel + probar 3 emails | S | 🤖 | tras P0-4 |
| P0-6 | Seed BD (`seed:pilot` o datos reales) | S | 🤖 | requiere tu OK (toca datos) |
| P0-7 | Baseline migraciones Prisma (`migrate resolve`) | S | 🤖 | no destructivo |

## P1 — Pre-lanzamiento
| ID | Tarea | Esf. | Resp. | Notas |
|---|---|:--:|:--:|---|
| P1-1 | Arreglar 3 enlaces rotos | S | 🤖 | forgot-password / register / reservas-nueva |
| P1-2 | Cloudflare R2 + `STORAGE_*` + CORS + prueba subida | M | 👤+🤖 | imágenes |
| P1-3 | Dominio `bellezalocal.es` + DNS + actualizar envs | M | 👤+🤖 | apex + www |
| P1-4 | Form B2B real (sustituir `mailto:`) → lead + aviso | M | 🤖 | + n8n opcional |
| P1-5 | Rate limiting en `/api/v1/availability` y `/booking` | M | 🤖 | regla backend |
| P1-6 | Observabilidad: Sentry (+ PostHog) | M | 🤖+👤 | errores/funnels |
| P1-7 | Verificación email + reset password (o ocultar enlaces) | M | 🤖 | seguridad/UX |
| P1-8 | Banner de cookies / consentimiento | S | 🤖 | GDPR |

## P2 — Producto / robustez
| ID | Tarea | Esf. | Resp. |
|---|---|:--:|:--:|
| P2-1 | n8n: leads B2B + onboarding negocio + alertas fallo | M | 🤖+👤 |
| P2-2 | Google OAuth productivo | S | 👤 |
| P2-3 | Tests módulo beauty (recommendations/ranking/consent) + 1 e2e reserva | L | 🤖 |
| P2-4 | IA premium (`ANTHROPIC_API_KEY`) si entra en plan superior | M | 👤+🤖 |
| P2-5 | Headers de seguridad (CSP/HSTS) en `next.config.mjs` | S | 🤖 |
| P2-6 | Revisión RLS Supabase + DPAs proveedores | M | 👤+🤖 |
| P2-7 | `.env.example` con aliases Stripe nuevos | S | 🤖 | ver `propuestas/` |

## P3 — Limpieza / escala
| ID | Tarea | Esf. | Resp. |
|---|---|:--:|:--:|
| P3-1 | Migrar `next lint` → ESLint CLI | S | 🤖 |
| P3-2 | Marcar documentación obsoleta como histórica | S | 🤖 |
| P3-3 | n8n fallback de crons (cadencia >1×/día) | M | 🤖+👤 |
| P3-4 | Política de retención + borrado automático | M | 🤖 |
| P3-5 | Refactor progresivo SQL crudo → cliente Prisma tipado (beauty) | L | 🤖 |
| P3-6 | Config Claude Code (permisos/hooks/skills) — ver `06` | S | 🤖 |

---

## Camino crítico (lo mínimo para "operativa de verdad")
```
P0-1 (cron) ─┐
P0-2→P0-3 (Stripe) ─┤
P0-4→P0-5 (Resend) ─┼─► OLA 1 cerrada → la app cobra, envía y muestra contenido
P0-6 (seed) ────────┤
P0-7 (baseline) ────┘
```
Tras OLA 1: P1-3 (dominio) + P1-2 (imágenes) + P1-1 (enlaces) para imagen pública impecable.

## Métrica de "100% operativa"
Una prueba end-to-end pasa completa: **registro → login → diagnóstico → plan → ver centro real → reservar con señal cobrada (test) → email de confirmación → recordatorio (cron) → completar reserva → follow-up enviado → negocio suscrito con plan activado por webhook → imagen subida**. Hoy esa cadena se rompe en: contenido, señal, email, cron y plan.
