# Auditoría Integral — Belleza Local (app-estetica)

**Fecha:** 2026-06-09
**Auditor:** CTO / Claude Code
**Estado:** Fase 0 completada

---

## 1. Resumen ejecutivo del estado real

Belleza Local es una plataforma SaaS + marketplace para negocios de belleza y bienestar no médico construida sobre Next.js 15, Prisma 5, Supabase (PostgreSQL), Auth.js v5 y Tailwind CSS v3.

El proyecto tiene **una arquitectura sólida y bien planificada** pero se encuentra en estado **MVP parcial**: hay código de calidad en capas clave (motor de disponibilidad, acciones del servidor, modelo de datos), pero múltiples páginas del dashboard, flujos de ecommerce/bonos y el motor de planes/gating no están implementados o son placeholders.

**El producto NO está listo para un piloto real.** Tiene deuda técnica moderada, claims falsos en la home, varias páginas del dashboard sin funcionalidad real, y el flujo de compra de bonos/productos no existe.

---

## 2. Qué está funcionando

| Componente | Estado | Notas |
|---|---|---|
| **Motor de disponibilidad** | ✅ Funcional | `lib/availability/engine.ts` — slots reales con timezone, buffers, anti-doble reserva |
| **Creación de reservas** | ✅ Funcional | `app/actions/booking.ts` — transacción con lock anti race-condition |
| **Auth (credentials)** | ✅ Funcional | Email+contraseña con bcrypt, JWT, callbacks correctos |
| **Modelo de datos Prisma** | ✅ Sólido | Schema completo: multi-tenant, GDPR, plans, addons, reviews, bonos, products |
| **Home pública** | ✅ Funcional | Datos reales desde DB, empty state honesto para centros, buscador |
| **Búsqueda `/buscar`** | ✅ Funcional | Filtros q/ciudad/categoría, cards reales, sin claims falsos |
| **Ficha pública `/centro/[slug]`** | ✅ Funcional | Servicios, staff, bonos, productos, reviews reales desde DB |
| **Flujo reserva `/centro/[slug]/reservar`** | ✅ Funcional | Wizard paso a paso, guest checkout, sin login |
| **Middleware auth** | ✅ Correcto | Solo protege /dashboard /admin /cuenta — rutas públicas libres |
| **Dashboard layout + sidebar** | ✅ Funcional | Sidebar con navegación, SessionProvider correcto |
| **Dashboard home `/dashboard`** | ✅ Funcional | Stats próximas reservas, ocupación real |
| **Calendario dashboard** | ✅ Funcional | Vista mensual 3 meses estilo Google Calendar con event pills |
| **Dashboard reservas** | ✅ Funcional | Tabla reservas, cambio de estado |
| **Dashboard bonos** | ✅ Funcional | CRUD bonos con plan gating |
| **Dashboard productos** | ✅ Funcional | CRUD productos con plan gating |
| **Acciones admin** | ✅ Funcional | Publicar/despublicar centros, cambiar planes, SEO noindex |
| **Planes definidos** | ✅ Sólido | `lib/billing/plans.ts` con features/precios por plan |
| **SEO base** | ✅ Parcial | Metadata dinámico en fichas, sitemap esqueleto, robots |
| **Notificaciones email** | ✅ Preparado | `lib/notifications/email.ts` con Resend — requiere credencial |
| **Seed demo** | ✅ Ejecutado | Peluquería Ana García con 9 servicios, 4 staff, 5 bonos, 7 productos, 31 reservas |

---

## 3. Qué es mock/demo/placeholder

| Elemento | Ubicación | Problema |
|---|---|---|
| **"4.9 de media"** | `app/page.tsx:133` | Hardcoded. No calculado desde DB |
| **"+350 centros"** | `app/page.tsx:136` | Hardcoded. Solo hay 1 centro real |
| **"+12.000 reservas"** | `app/page.tsx:138` | Hardcoded. Solo hay ~31 reservas de seed |
| **"50+ ciudades"** | `app/page.tsx:140` | Hardcoded. Solo hay 1 ciudad real |
| **"Más de 350 profesionales"** | `app/page.tsx:281` | Hardcoded en sección "Para negocios" |
| **Widget agenda "Agenda de hoy"** | `app/page.tsx:307-338` | Datos de marketing estáticos (mock) |
| **"€348 Ingresos hoy / 87% ocupación"** | `app/page.tsx:328-333` | Mock. No conectado a DB |
| **Google OAuth** | `lib/auth/config.ts` | Configurado pero requiere credenciales reales |
| **Stripe integración** | `lib/billing/plans.ts` | Precios definidos pero Stripe no conectado |
| **Email Resend** | `lib/notifications/email.ts` | Preparado pero requiere `RESEND_API_KEY` |
| **SMS Twilio** | `.env.example` | Definido pero no implementado |
| **WhatsApp Business** | `.env.example` | Definido como add-on pero no implementado |
| **Cloudflare R2 (imágenes)** | `.env.example` | Definido pero upload no implementado |
| **Página `/privacidad`** | Footer links | No existe la página |
| **Página `/terminos`** | Footer links | No existe la página |
| **Página `/cookies`** | Footer links | No existe la página |

---

## 4. Qué está incompleto

| Componente | Estado | Detalle |
|---|---|---|
| **Dashboard servicios** | ⚠️ Parcial | Página existe pero CRUD puede estar incompleto — no auditado |
| **Dashboard staff** | ⚠️ Parcial | Página existe pero CRUD puede estar incompleto |
| **Dashboard horarios** | ⚠️ Parcial | Página existe pero la UI de edición no se ha verificado |
| **Dashboard clientes** | ⚠️ Parcial | Página existe pero CRM sin funcionalidad avanzada |
| **Dashboard configuración** | ⚠️ Parcial | Página existe pero campos del centro no auditados |
| **Dashboard plan** | ⚠️ Placeholder | Muestra el plan actual pero sin upgrade real a Stripe |
| **Admin dashboard `/admin`** | ⚠️ Parcial | Existe pero no auditado completamente |
| **Admin centros** | ⚠️ Parcial | Lista centros, tiene acciones de publicar pero UI sin verificar |
| **Admin organizaciones** | ⚠️ Parcial | Existe pero no auditada |
| **Admin planes** | ⚠️ Placeholder | Interfaz para gestionar planes — contenido no verificado |
| **Admin SEO** | ⚠️ Parcial | Toggle noindex existe, falta control completo |
| **Reserva confirmada `/reserva/confirmada/[code]`** | ⚠️ Desconocido | Página existe, no auditada en detalle |
| **Gestión reserva `/reserva/gestionar`** | ⚠️ Desconocido | Página existe, cancelación parcialmente implementada |
| **Búsqueda: bug OR/AND** | ⚠️ Bug potencial | `q` y `ciudad` usan `OR` al mismo nivel en `whereBase` — pueden pisarse |
| **Ecommerce productos** | ❌ Ausente | No existe `/productos`, `/productos/[slug]`, carrito, checkout |
| **Compra de bonos (pública)** | ❌ Ausente | Los bonos se muestran en la ficha pero no hay botón/flujo de compra |
| **Wallet bonos usuario** | ❌ Ausente | No existe `/cuenta/bonos` ni lógica de sesiones disponibles |
| **Modificación de reservas** | ❌ Ausente | Cancelación parcial, pero modificación de fecha/hora no existe |
| **Lista de espera** | ❌ Ausente | Modelo existe en DB pero UI/flujo no implementado |
| **ServiceStaff linking** | ❌ Ausente en seed | El seed no crea `ServiceStaff` — el engine devuelve 0 staff para servicios |
| **Páginas SEO locales** | ❌ Ausente | No existen páginas de ciudad/servicio para SEO programático |
| **Sitemap completo** | ⚠️ Esqueleto | `app/sitemap.ts` existe pero puede ser básico |
| **Páginas legales** | ❌ Ausente | /privacidad, /terminos, /cookies no existen |
| **Página para-negocios** | ⚠️ Desconocido | Existe pero no auditada |
| **Upload de imágenes** | ❌ Ausente | R2 configurado en env pero no hay endpoint de upload |
| **Rate limiting** | ❌ Ausente | Las reglas de backend lo requieren pero no está implementado |
| **Consentimiento marketing** | ⚠️ Parcial | `marketingConsent` en DB pero UI en registro no verificada |
| **Export/delete usuario (GDPR)** | ❌ Ausente | No implementado |

---

## 5. Qué está roto

| Problema | Severidad | Detalle |
|---|---|---|
| **Claims falsos en home** | 🔴 Alto | "4.9 de media", "+350 centros", "+12.000 reservas", "50+ ciudades", "350 profesionales" — datos inventados |
| **ServiceStaff vacío** | 🔴 Alto | Engine de disponibilidad busca en `ServiceStaff` para resolver staff por servicio. Sin registros, devuelve `[]` → no hay slots en la ficha pública |
| **Bug búsqueda OR/AND** | 🟡 Medio | Si se pasan `q` y `ciudad` juntos, el OR de ciudad se mezcla al mismo nivel que el OR de `q` — resultados incorrectos |
| **Links legales rotos** | 🟡 Medio | Footer enlaza a `/privacidad`, `/terminos`, `/cookies` que no existen (404) |
| **`btn-primary`, `btn-outline`, `section-eyebrow`** | 🟡 Medio | Clases CSS custom usadas en home y buscar que deben estar en globals.css — si faltan, elementos sin estilos |
| **Google OAuth sin credenciales** | 🟡 Medio | Botón Google en signin redirige al flujo que fallará en prod sin credenciales |
| **Dashboard servicios/staff** | 🟡 Medio | No verificados — pueden tener bugs de UX o acciones incompletas |
| **Reserva confirmada page** | 🟡 Medio | No auditada — puede tener diseño viejo sin actualizar |
| **Imágenes con `<img>` no `next/image`** | 🟡 Medio | En home, buscar y centro page se usa `<img>` en lugar de `next/image` — regla frontend incumplida |

---

## 6. Qué falta para llegar a producto profesional

### Mínimos para piloto real (P0/P1):
1. Eliminar todos los claims falsos de la home
2. Crear `ServiceStaff` en seed para que el engine funcione
3. Corregir bug OR/AND en búsqueda
4. Crear páginas legales mínimas (/privacidad, /terminos)
5. Completar/verificar dashboard servicios, staff, horarios, configuración
6. Implementar gestión de reserva (cancelar con código + email)
7. Implementar flujo de compra de bonos (aunque sea básico)

### Para producto completo (P2+):
1. Ecommerce de productos con carrito y checkout
2. Wallet de bonos para usuarios
3. Modificación de reservas
4. Upload real de imágenes
5. SEO programático: páginas ciudad + categoría
6. Páginas legales completas
7. GDPR export/delete
8. Rate limiting en endpoints públicos
9. Stripe integración real
10. Notificaciones email/SMS/WhatsApp activas
11. Tests unitarios e integración
12. IA premium (arquitectura + mocks)

---

## 7. Riesgos técnicos

| Riesgo | Severidad | Mitigación |
|---|---|---|
| **Engine sin ServiceStaff** | 🔴 Alto | Crear ServiceStaff en seed inmediatamente |
| **Race condition en reservas** | 🟢 Bajo | Ya mitigado con `prisma.$transaction` |
| **Prisma sin índices optimizados** | 🟡 Medio | Schema tiene índices básicos — revisar queries N+1 en búsqueda |
| **N+1 en búsqueda** | 🟡 Medio | `findMany` con `include` — considerar paginación |
| **JWT sin rotación** | 🟡 Medio | `strategy: 'jwt'` sin refresh automático — revisar para PRO+ |
| **Auth.js beta** | 🟡 Medio | `next-auth@5.0.0-beta.25` — puede tener breaking changes |
| **Sin paginación en búsqueda** | 🟡 Medio | `take: 30` hardcodeado — escalar a paginación real |
| **`next/image` no usado** | 🟢 Bajo | Imágenes sin optimización automática de Vercel |
| **Sin rate limiting** | 🟡 Medio | Endpoints de disponibilidad/reserva expuestos a abuso |
| **Build sin type-check en CI** | 🟡 Medio | Solo `lint` y `build` — añadir `tsc --noEmit` |
| **Stripe no conectado** | 🟡 Medio | Planes definidos pero sin cobro real — riesgo de producto sin monetización |

---

## 8. Riesgos de seguridad/GDPR

| Riesgo | Severidad | Estado |
|---|---|---|
| **Claims de datos de otros tenants** | 🔴 Crítico | Dashboard filtra por `orgId` en acciones — pero páginas admin deben verificarse |
| **Email expuesto en confirmación pública** | 🟡 Medio | `/reserva/confirmada/[code]` — verificar que no expone email completo |
| **Sin rate limiting en `/api/v1/`** | 🟡 Medio | Availability y booking expuestos sin límite |
| **Datos de clientes sin anonimización** | 🟡 Medio | `Customer` table sin export/delete/anonimize |
| **Consentimiento marketing** | 🟡 Medio | Campo en DB pero UI de registro no verificada |
| **Cookies de sesión** | 🟢 Bajo | Auth.js gestiona cookies — revisar `secure` en producción |
| **Secretos en código** | 🟢 Bajo | `.env.example` correcto — no hay secretos hardcodeados detectados |
| **Bcrypt rounds = 12** | 🟢 Bajo | Aceptable — no excesivo |
| **GDPR export/delete** | 🟡 Medio | No implementado — riesgo legal en UE |
| **Política de cancelación** | 🟡 Medio | No hay consentimiento explícito de política en flujo de reserva |

---

## 9. Riesgos de producto/negocio

| Riesgo | Severidad | Detalle |
|---|---|---|
| **Claims falsos** | 🔴 Alto | Pueden generar problemas legales y pérdida de confianza |
| **Booking roto por ServiceStaff vacío** | 🔴 Alto | Ningún usuario puede completar reserva con datos reales |
| **Sin ecommerce funcional** | 🟡 Medio | Negocios que solo venden productos no tienen flujo completo |
| **Sin compra de bonos** | 🟡 Medio | Bonos visibles pero no comprables — frustración del usuario |
| **Sin modificación de reservas** | 🟡 Medio | Mal UX: solo se puede cancelar, no cambiar fecha/hora |
| **Sin pages legales** | 🟡 Medio | 404 en privacidad/términos — problema de confianza y legal |
| **Stripe no activo** | 🟡 Medio | Sin monetización real = sin revenue |
| **Un solo centro demo** | 🟢 Bajo | Marketplace vacío hasta onboarding real de negocios |
| **SEO noindex en buscar** | 🟢 Bajo | La página de búsqueda no se indexa — correcto por ahora |

---

## 10. Plan de implementación por fases

Ver `docs/backlog/backlog-maestro.md` para el plan detallado por fases.

**Resumen del orden:**

| Prioridad | Fase | Impacto |
|---|---|---|
| P0 | Fase 0 — Auditoría (esta) | Base para todo |
| P0 | Fase 1 — Home honesta + rutas públicas | Confianza + SEO |
| P0 | Fase 2 — Perfil negocio completo | Valor core del producto |
| P0 | Fase 3 — Búsqueda corregida | Descubrimiento |
| P0 | Fase 4 — Reservas y calendario 3 meses | Core booking |
| P1 | Fase 5 — Cancelación/modificación | UX completa |
| P1 | Fase 6 — Ecommerce productos | Monetización |
| P1 | Fase 7 — Bonos y packs | Recurrencia |
| P1 | Fase 8 — Dashboard negocio completo | Valor para negocios |
| P2 | Fase 9 — Admin plataforma completo | Control plataforma |
| P2 | Fase 10 — Planes y gating real | Monetización |
| P2 | Fase 11 — IA premium | Diferenciación |
| P2 | Fase 12 — SEO programático | Growth orgánico |
| P2 | Fase 13 — UX/UI design system | Coherencia |
| P3 | Fase 14 — Seguridad/GDPR | Compliance |
| P3 | Fase 15 — Tests, QA, build, piloto | Lanzamiento |

---

## 11. Qué se hará primero

Las fases P0 son críticas para que el producto pueda usarse honestamente y el booking funcione. La Fase 1 incluye:

- Eliminar los 5 claims falsos hardcodeados en `app/page.tsx`
- Verificar que middleware no bloquea rutas públicas (ya correcto)
- Añadir empty state honesto para métricas
- Corregir el copy del widget de "Para negocios"

La Fase 4 debe incluir la creación de `ServiceStaff` para que el engine funcione con los datos reales del seed.

---

## 12. Qué no se hará (requiere credenciales o servicios externos)

- Stripe: no se configurará ni probará sin credenciales reales
- Resend (email): no se enviará email real sin `RESEND_API_KEY`
- Twilio (SMS): no se implementará sin credenciales
- WhatsApp Business API: no se implementará sin credenciales
- Cloudflare R2: upload de imágenes no se implementará sin credenciales
- Google OAuth: no se probará sin `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`
- Vercel deploy: no se hará deploy sin confirmación explícita

---

*Siguiente acción: Fase 1 — App pública abierta, home y claims honestos (pendiente aprobación)*
