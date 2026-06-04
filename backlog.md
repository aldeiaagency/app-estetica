# Backlog — Belleza Local

Última actualización: 2026-06-04

## Leyenda

- `[P0]` Bloqueante para MVP
- `[P1]` MVP completo
- `[P2]` Post-MVP, siguiente fase
- `[P3]` Futuro / nice-to-have

---

## ÉPICA 1 — Infraestructura base

- [P0] Configurar PostgreSQL en producción (Railway/Neon)
- [P0] Ejecutar primera migración Prisma
- [P0] Configurar Auth.js con credenciales propias + Google OAuth opcional
- [P0] Configurar Stripe con productos/precios para Basic y Pro
- [P0] Configurar Resend para emails transaccionales
- [P0] Deploy en Vercel (rama main → producción)
- [P1] Configurar variables de entorno en Vercel
- [P1] Configurar dominio personalizado
- [P1] Configurar Cloudflare R2 para uploads de imágenes
- [P2] Configurar monitoreo básico (Sentry o similar)
- [P2] Configurar analytics (PostHog)

---

## ÉPICA 2 — Auth y onboarding de negocio

- [P0] Registro de usuario (negocio)
- [P0] Login / logout
- [P0] Recuperación de contraseña
- [P0] Creación de organización al registrarse
- [P0] Creación de primer centro
- [P1] Wizard de onboarding (5 pasos: negocio, servicios, horarios, staff, publicar)
- [P1] Email de bienvenida al registrarse
- [P1] Verificación de email
- [P2] OAuth Google para negocios
- [P2] Invitar colaboradores al centro

---

## ÉPICA 3 — Dashboard negocio (gestión básica)

- [P0] Vista de agenda/calendario (día / semana)
- [P0] Listado de reservas del día
- [P0] Crear/editar servicios (nombre, duración, precio)
- [P0] Gestionar horarios semanales del centro
- [P0] Gestionar staff/profesionales
- [P1] Vista de próximas reservas
- [P1] Ficha de cliente básica
- [P1] Historial de reservas por cliente
- [P1] Crear/cancelar reservas manualmente
- [P1] Estadísticas básicas (reservas del mes, ingresos estimados)
- [P2] Gestión de cabinas/recursos
- [P2] Excepciones de horario (vacaciones, festivos)
- [P2] Vista semana por profesional
- [P2] Bloqueos manuales de agenda

---

## ÉPICA 4 — Motor de disponibilidad

- [P0] Calcular slots disponibles dado servicio + staff + fecha
- [P0] Prevenir doble reserva (transacciones DB)
- [P0] Respetar duración de servicio + buffer post-servicio
- [P0] Respetar horarios del centro y del profesional
- [P1] Soporte zona horaria (Europe/Madrid)
- [P1] Excepciones de horario
- [P1] Bloqueos manuales
- [P2] Cabinas/recursos como restricción adicional
- [P2] Lista de espera básica
- [P2] Capacidad máxima configurable

---

## ÉPICA 5 — Reservas online (usuario final)

- [P0] Flujo de reserva paso a paso: servicio → profesional → fecha → hora → datos → confirmar
- [P0] Página de confirmación de reserva
- [P0] Email de confirmación al usuario
- [P0] Email de notificación al negocio
- [P1] Modificación de reserva por usuario
- [P1] Cancelación de reserva por usuario
- [P1] Enlace de reserva directo por centro
- [P1] Recordatorio automático 24h antes (email)
- [P2] Recordatorio 1h antes (email)
- [P2] Política de cancelación configurable
- [P2] Depósito obligatorio (anti no-show) — plan Pro

---

## ÉPICA 6 — Ficha pública del centro

- [P0] Página `/centro/[slug]` con info completa
- [P0] Listado de servicios con precios y duración
- [P0] Horarios del centro
- [P0] Datos de contacto y ubicación
- [P1] Galería de fotos del centro
- [P1] Descripción larga del centro
- [P1] Listado de profesionales
- [P1] Reseñas (solo lectura)
- [P2] Mapa con ubicación
- [P2] Bonos disponibles
- [P2] Productos disponibles
- [P2] Promociones activas

---

## ÉPICA 7 — Frontend público y búsqueda

- [P0] Home con propuesta de valor clara
- [P1] Búsqueda por ciudad + categoría/servicio
- [P1] Página de resultados con filtros básicos
- [P1] Card de centro en resultados
- [P2] Búsqueda por localidad, barrio, provincia
- [P2] Filtros avanzados (precio, valoración, disponibilidad hoy)
- [P2] Mapa de resultados
- [P3] Búsqueda semántica / IA

---

## ÉPICA 8 — SEO programático

- [P1] Página SEO por localidad (`/centros-estetica/madrid`)
- [P1] Página SEO localidad + servicio (`/centros-estetica/madrid/depilacion-laser`)
- [P1] Sitemap.xml dinámico
- [P1] Metadatos dinámicos (title, description, OG) por centro y página SEO
- [P1] Structured data LocalBusiness + Service
- [P1] Reglas noindex (páginas sin centros reales)
- [P2] Páginas por categoría (`/peluquerias/barcelona`)
- [P2] Páginas de promociones locales
- [P2] Páginas de bonos/productos por ciudad
- [P3] Generación automática de contenido editorial local

---

## ÉPICA 9 — Planes y billing

- [P1] Integración Stripe Checkout para suscripciones
- [P1] Webhook Stripe para activar/desactivar planes
- [P1] Página de planes y precios
- [P1] Gestión del plan desde dashboard
- [P2] Portal de cliente Stripe (gestión de facturación)
- [P2] Add-ons como productos separados en Stripe
- [P2] Trial gratuito 14 días
- [P3] Facturación anual con descuento

---

## ÉPICA 10 — Bonos y productos (plan Pro)

- [P2] Crear bonos de sesiones en dashboard
- [P2] Venta de bonos en ficha pública
- [P2] Gestión de bonos activos por cliente
- [P2] Productos de cosmética en ficha pública
- [P2] Checkout simple para bonos/productos
- [P3] E-commerce completo con stock

---

## ÉPICA 11 — Reseñas y reputación (plan Pro)

- [P2] Solicitar reseña post-servicio (email automático)
- [P2] Formulario de reseña
- [P2] Moderación básica de reseñas
- [P2] Visualización de reseñas en ficha
- [P2] Puntuación media en resultados de búsqueda
- [P3] Respuesta del negocio a reseñas

---

## ÉPICA 12 — Admin plataforma

- [P1] Login admin protegido
- [P1] Listado de centros (todos los centros, con estado)
- [P1] Aprobar / publicar / despublicar centro
- [P1] Cambiar plan de una organización
- [P1] Gestionar categorías globales
- [P2] Gestionar localidades
- [P2] Control de indexación SEO por centro
- [P2] Featured listings (centros destacados)
- [P2] Métricas de plataforma
- [P2] Auditoría de acciones sensibles
- [P3] Panel de soporte
- [P3] Moderación de reseñas

---

## ÉPICA 13 — WhatsApp / notificaciones avanzadas (add-on)

- [P3] Integración WhatsApp Business API (add-on Growth/Premium)
- [P3] Recordatorios por WhatsApp desde número del negocio
- [P3] Confirmación por WhatsApp
- [P3] Rebooking automático por WhatsApp

---

## ÉPICA 14 — Multi-centro (plan Growth)

- [P2] Soporte hasta 3 centros por organización en Growth
- [P2] Vista multi-centro en dashboard
- [P2] Analítica por centro
- [P3] Gestión centralizada de clientes cross-centro

---

## DEUDA TÉCNICA / INFRAESTRUCTURA

- [P1] Tests unitarios del motor de disponibilidad
- [P1] Tests de integración del flujo de reserva
- [P2] Rate limiting en API routes
- [P2] Logging estructurado
- [P2] CI/CD básico (GitHub Actions)
- [P3] Tests E2E (Playwright)

---

## DECISIONES PENDIENTES

- [ ] ¿Nombre de marca final? ¿"Belleza Local" es definitivo?
- [ ] ¿Dominio?
- [ ] ¿Deploy inicial: Vercel + Neon o Railway todo-en-uno?
- [ ] ¿Trial gratuito sí/no desde el inicio?
- [ ] ¿Comisión marketplace: cuándo y cuánto?
- [ ] ¿Pago con Stripe o Redsys (España)?
- [ ] ¿SMS en Basic o solo email?
