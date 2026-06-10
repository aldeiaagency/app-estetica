# Belleza Local — Piloto Readiness

**Fecha:** 2026-06-10  
**Estado:** LISTO PARA PILOTO PRIVADO (beta cerrada, 3-5 negocios)

---

## Criterios de aceptación

| Área | Criterio | Estado |
|---|---|---|
| Build | `npm run build` limpio sin errores ni warnings | ✅ |
| Tests | 41/41 tests unitarios pasan | ✅ |
| Auth | Registro, login, roles (BUSINESS / PLATFORM_ADMIN / CUSTOMER) | ✅ |
| Onboarding | Creación de organización y centro tras registro | ✅ |
| Reservas | Flujo público centro → servicio → horario → confirmación | ✅ |
| Dashboard | Agenda, KPIs, reservas, clientes, servicios, staff, horarios | ✅ |
| Emails | Confirmación y cancelación fire-and-forget vía Resend | ✅ |
| Pagos | Stripe con lazy init, webhook verificado | ✅ |
| SEO | Sitemap dinámico, robots.txt, metadata en todas las páginas | ✅ |
| Seguridad | CSP, HSTS, X-Frame-Options, rate limiting API (60 req/min) | ✅ |
| RGPD | Páginas privacidad, términos, cookies; consentimiento implícito | ✅ |
| Multi-tenant | Todos los queries filtrados por `organizationId`/`centerId` | ✅ |
| Mobile | Diseño mobile-first 375px, menú hamburguesa, tablas acordeón | ✅ |
| Design system | Tokens `primary-600` / `zinc-` / `beauty-500` en todos los componentes | ✅ |

---

## Requisitos de infraestructura para piloto

### Variables de entorno (`.env.local` / Vercel)

```
DATABASE_URL=               # Supabase pooler puerto 6543
DIRECT_URL=                 # Supabase directo puerto 5432
NEXTAUTH_SECRET=            # openssl rand -base64 32
NEXTAUTH_URL=               # https://tudominio.com
STRIPE_SECRET_KEY=          # sk_live_... o sk_test_...
STRIPE_WEBHOOK_SECRET=      # whsec_...
NEXT_PUBLIC_STRIPE_PK=      # pk_live_... o pk_test_...
RESEND_API_KEY=             # re_...
EMAIL_FROM=                 # Belleza Local <noreply@bellezalocal.es>
NEXT_PUBLIC_APP_URL=        # https://tudominio.com
ANTHROPIC_API_KEY=          # sk-ant-... (solo si plan PRO/PREMIUM usan IA)
```

### Pasos de arranque

1. `npx prisma migrate deploy` — aplica migraciones en producción
2. Crear cuenta PLATFORM_ADMIN manual en Supabase o via seed
3. Configurar webhook Stripe → `/api/webhooks/stripe`
4. Verificar dominio remitente en Resend
5. Deploy en Vercel con variables de entorno

---

## Límites del piloto privado

- **Negocios admitidos:** 3-5 (invitación manual por PLATFORM_ADMIN)
- **Plan asignado:** PRO (features completas excepto multi-centro y white-label)
- **Datos reales:** permitidos desde el inicio para feedback auténtico
- **SLA informal:** respuesta a incidencias en 24h

---

## Funcionalidades fuera del piloto (backlog)

- Módulo de bonos (UI lista, lógica de compra pendiente de test)
- Carrito de productos físicos (flujo Stripe)
- Notificaciones SMS/WhatsApp (plan PREMIUM)
- Multi-centro (plan GROWTH+)
- Panel de métricas avanzadas (admin)
- App móvil nativa

---

## Contacto operativo

- Panel admin: `/admin` (requiere PLATFORM_ADMIN)
- Onboarding negocios: `/auth/signup` → tipo BUSINESS
- Soporte: aldeiaceo@gmail.com
