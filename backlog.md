# Backlog — Belleza Local

Última actualización: 2026-06-04

**Nota**: No hay barrera MVP/post-MVP. Todo está aquí, ordenado por prioridad real de negocio.
Construimos en orden — las reservas básicas antes que WhatsApp propio, pero nada está "descartado".

## Leyenda de prioridad

- `[P0]` Bloqueante — sin esto no hay producto
- `[P1]` Core — define el valor real de la plataforma
- `[P2]` Diferenciador — lo que hace que se queden y paguen más
- `[P3]` Premium / add-on — monetización adicional o features avanzadas

---

## ÉPICA 1 — Infraestructura y deploy

- [P0] Crear proyecto en Supabase (PostgreSQL)
- [P0] Crear proyecto en Vercel y conectar repo GitHub
- [P0] Configurar variables de entorno en Vercel
- [P0] Primera migración Prisma (`npx prisma migrate dev --name init`)
- [P0] Deploy funcional en Vercel (rama main → producción)
- [P0] Configurar dominio personalizado
- [P1] Crear bucket en Cloudflare R2 para imágenes
- [P1] Configurar Resend con dominio verificado
- [P1] Configurar Stripe (cuenta, productos, precios Basic/Pro/Growth/Premium)
- [P1] Cron jobs en Vercel para recordatorios automáticos
- [P2] Sentry para errores de producción
- [P2] PostHog para product analytics
- [P2] CI/CD básico (GitHub Actions: lint + type-check + build)

---

## ÉPICA 2 — Auth y onboarding de negocio

- [P0] Registro de usuario (negocio) con email + contraseña
- [P0] Login / logout
- [P0] Recuperación de contraseña (email con token)
- [P0] Creación de organización al registrarse
- [P0] Creación de primer centro
- [P1] Wizard de onboarding (5 pasos: negocio → servicios → horarios → staff → publicar)
- [P1] Email de bienvenida al registrarse
- [P1] Verificación de email
- [P1] Registro/login con Google (OAuth)
- [P2] Invitar colaboradores al centro (rol BUSINESS)
- [P2] Permisos por colaborador (ver agenda / gestionar servicios / gestionar clientes)

---

## ÉPICA 3 — Dashboard negocio (agenda y reservas)

- [P0] Vista de agenda del día con reservas
- [P0] Listado de reservas con estados
- [P0] Crear reserva manual desde dashboard
- [P0] Cancelar reserva desde dashboard
- [P1] Vista semanal de agenda
- [P1] Modificar reserva existente
- [P1] Marcar no-show manualmente
- [P1] Vista de próximas reservas (semana)
- [P1] Enlace de reserva shareable (URL directa al flujo de reserva del centro)
- [P2] Vista de agenda por profesional
- [P2] Crear bloqueos manuales en agenda
- [P2] Gestionar excepciones de horario (vacaciones, festivos)
- [P2] Notas internas en reservas (solo visibles al negocio)

---

## ÉPICA 4 — Servicios, staff y horarios

- [P0] CRUD de servicios (nombre, duración, precio, categoría)
- [P0] CRUD de staff/profesionales
- [P0] Configuración de horarios semanales (por centro)
- [P1] Asignar servicios a profesionales específicos
- [P1] Horarios por profesional (distinto al centro)
- [P1] Buffer pre/post servicio configurable
- [P2] Cabinas / recursos físicos (salas, sillones, equipos)
- [P2] Servicios grupales (capacidad > 1)
- [P2] Duración flexible (rango min-max) por servicio

---

## ÉPICA 5 — Motor de disponibilidad

- [P0] Calcular slots libres dado servicio + staff + fecha
- [P0] Prevenir doble reserva con transacción DB
- [P0] Respetar horarios del centro y del profesional
- [P0] Respetar duración + buffer post-servicio
- [P1] Soporte zona horaria Europe/Madrid
- [P1] Excepciones de horario (vacaciones, festivos)
- [P1] Bloqueos manuales de agenda
- [P1] Tests unitarios del motor (obligatorios antes de producción)
- [P2] Cabinas/recursos como restricción adicional
- [P2] Lista de espera: notificar cuando se libera un slot
- [P2] Capacidad máxima configurable (no aceptar > X% del día)

---

## ÉPICA 6 — Flujo de reserva (usuario final)

- [P0] Flujo paso a paso: servicio → profesional → fecha → hora → datos → confirmar
- [P0] Reserva sin crear cuenta (guest checkout)
- [P0] Página de confirmación con código de reserva
- [P0] Email de confirmación al usuario (Resend)
- [P0] Email de notificación al negocio cuando entra reserva
- [P1] Cancelación de reserva por enlace en email (sin login)
- [P1] Modificación de reserva por el usuario
- [P1] Recordatorio automático 24h antes (email, cron job)
- [P1] Recordatorio 2h antes (email)
- [P2] Política de cancelación configurable (plazo, penalización)
- [P2] Depósito obligatorio anti no-show (Stripe PaymentIntent)
- [P2] Flujo de reserva con bono del cliente
- [P3] Confirmación/recordatorio por WhatsApp (add-on)
- [P3] Confirmación/recordatorio por SMS (add-on por consumo)

---

## ÉPICA 7 — Ficha pública del centro

- [P0] Página `/centro/[slug]` con info completa
- [P0] Listado de servicios con precios y duración
- [P0] Horarios del centro
- [P0] Datos de contacto y ubicación
- [P1] Galería de fotos (upload a Cloudflare R2)
- [P1] Descripción larga del centro (con campo optimizado para SEO)
- [P1] Listado de profesionales con foto
- [P2] Mapa con ubicación (Google Maps embed)
- [P2] Bonos disponibles para comprar
- [P2] Productos en venta
- [P2] Promociones activas
- [P2] Reseñas (listado + puntuación media)

---

## ÉPICA 8 — Frontend público y búsqueda

- [P0] Home con propuesta de valor + buscador
- [P1] Página de resultados: ciudad + categoría/servicio
- [P1] Cards de centro en resultados (foto, nombre, valoración, precio desde, disponibilidad)
- [P1] Filtros básicos (categoría, disponibilidad hoy, precio)
- [P2] Búsqueda por barrio/zona
- [P2] Filtros avanzados (valoración mínima, disponibilidad en X días)
- [P2] Mapa de resultados
- [P2] Favoritos (requiere cuenta de usuario)
- [P2] Cuenta de usuario: historial de reservas, favoritos
- [P3] Búsqueda semántica / sugerencias con IA

---

## ÉPICA 9 — SEO programático

- [P1] Metadatos dinámicos (title, description, OG) en fichas y páginas locales
- [P1] Structured data LocalBusiness + Service en fichas
- [P1] Sitemap.xml dinámico por tipo de página
- [P1] robots.txt correcto (noindex en dashboard, admin, flujo reserva)
- [P1] Páginas de ciudad/categoría con ≥5 centros (`/peluquerias/madrid`)
- [P1] Regla noindex automática si página no tiene centros reales
- [P2] Páginas ciudad+servicio con ≥3 centros (`/centros-estetica/madrid/depilacion-laser`)
- [P2] Control de indexación por centro desde admin
- [P2] Featured listings en páginas locales
- [P3] Páginas editoriales con contenido genuino (guías locales)
- [P3] Integración Google Business Profile por centro

---

## ÉPICA 10 — Bonos y packs

- [P1] Crear bonos en dashboard (nombre, nº sesiones, validez, precio, servicio)
- [P1] Mostrar bonos disponibles en ficha pública
- [P1] Compra de bono online (Stripe Checkout)
- [P1] Envío de bono por email al cliente
- [P1] Gestión de bonos activos por cliente en dashboard
- [P1] Usar bono al reservar (descuenta sesión del bono)
- [P2] Bono multi-servicio (aplica a toda la categoría)
- [P2] Bono de regalo (comprar para otra persona)

---

## ÉPICA 11 — Productos de cosmética

- [P1] Crear productos en dashboard (nombre, precio, marca, stock, imagen)
- [P1] Mostrar productos en ficha pública
- [P2] Compra de producto online (Stripe Checkout)
- [P2] Gestión de stock
- [P2] Productos destacados en home y búsquedas (add-on)
- [P3] E-commerce completo con carrito y envío

---

## ÉPICA 12 — Promociones

- [P1] Crear promoción en dashboard (descuento %, precio fijo, fechas)
- [P1] Aplicar promoción automáticamente al reservar
- [P1] Mostrar promociones activas en ficha pública
- [P2] Promociones de primer cliente (descuento solo nuevos clientes)
- [P2] Promociones por temporada con countdown
- [P3] Promociones destacadas en home (add-on)

---

## ÉPICA 13 — Reseñas y reputación

- [P1] Solicitar reseña por email automáticamente 2h post-servicio
- [P1] Formulario de reseña (1-5 estrellas + comentario)
- [P1] Moderación de reseñas desde dashboard negocio
- [P1] Mostrar reseñas en ficha pública con puntuación media
- [P1] Puntuación en resultados de búsqueda
- [P2] Respuesta del negocio a reseñas (pública)
- [P2] Moderación admin de reseñas (para denuncias)
- [P2] Reseñas verificadas (solo clientes con reserva completada)

---

## ÉPICA 14 — Anti no-show y lista de espera

- [P1] Política de cancelación configurable (plazo, texto)
- [P2] Depósito obligatorio configurable (% o importe fijo) vía Stripe
- [P2] Cargo automático de penalización en no-show
- [P2] Lista de espera: el cliente se apunta y recibe email cuando hay hueco
- [P2] Contador de no-shows por cliente (visible en ficha del cliente)
- [P2] Bloqueo automático de clientes con >X no-shows (configurable)

---

## ÉPICA 15 — Billing y planes

- [P0] Integración Stripe Checkout para suscripciones (Basic, Pro, Growth, Premium)
- [P0] Webhook Stripe para activar/desactivar plan automáticamente
- [P0] Feature gating según plan (bloquear funciones superiores)
- [P1] Página de planes y precios en el dashboard
- [P1] Portal de cliente Stripe (gestión de facturación, cancelación)
- [P1] Trial gratuito 14 días (con o sin tarjeta — pendiente decidir)
- [P2] Add-ons como productos separados en Stripe
- [P2] Upgrade/downgrade de plan desde dashboard
- [P3] Facturación anual con descuento (~20%)

---

## ÉPICA 16 — Admin plataforma

- [P0] Login admin protegido (rol PLATFORM_ADMIN)
- [P0] Listado de centros con estado (pendiente / publicado / bloqueado)
- [P0] Aprobar / publicar / bloquear centros
- [P0] Cambiar plan de una organización
- [P1] Métricas globales (centros, reservas, MRR)
- [P1] Gestionar categorías globales
- [P1] Gestionar localidades (para SEO)
- [P1] Control de indexación SEO por centro y página
- [P2] Featured listings: asignar y gestionar posiciones
- [P2] Moderación de reseñas
- [P2] Activar/desactivar add-ons por organización
- [P2] Audit log de acciones sensibles
- [P3] Panel de soporte (ver reservas de cualquier centro)
- [P3] Métricas avanzadas (churn, LTV, conversión por canal)

---

## ÉPICA 17 — CRM ligero (plan Growth)

- [P2] Ficha de cliente con historial de reservas, bonos, notas, etiquetas
- [P2] Búsqueda de clientes por nombre / email / teléfono
- [P2] Segmentación básica (activos / inactivos / con bonos)
- [P2] Campañas de email básicas (envío a segmento)
- [P2] Recuperación automática de clientes inactivos (>60 días sin reserva)
- [P2] Rebooking automático: proponer nueva cita tras visita completada
- [P3] Historial de gasto por cliente
- [P3]  Puntuación RFM básica (recencia, frecuencia, valor)

---

## ÉPICA 18 — Multi-centro (plan Growth)

- [P2] Soporte hasta 3 centros por organización en Growth
- [P2] Vista unificada de reservas cross-centro
- [P2] Analítica comparativa por centro
- [P3] Gestión centralizada de servicios (replicar a todos los centros)
- [P3] Gestión centralizada de clientes (cliente compartido entre centros)
- [P3] Centros ilimitados en Premium

---

## ÉPICA 19 — WhatsApp y notificaciones avanzadas (add-on)

- [P2] WhatsApp Business API: recordatorios desde número del negocio (add-on 29€/mes)
- [P2] Confirmación de reserva por WhatsApp
- [P2] Cancelación/modificación por WhatsApp
- [P3] Rebooking automático por WhatsApp
- [P3] Campañas de WhatsApp (solo opt-in explícito)
- [P3] SMS por consumo (add-on 0,08€/SMS)

---

## ÉPICA 20 — IA y automatización (add-on Premium)

- [P3] Recepcionista IA: agente que responde preguntas y gestiona reservas por chat
- [P3] Sugerencias de horarios alternativos con IA
- [P3] Detección automática de patrones de no-show
- [P3] Generación de respuestas a reseñas con IA
- [P3] Optimización de agenda con IA (rellenar huecos)

---

## ÉPICA 21 — Marca blanca y API (plan Premium)

- [P3] Dominio propio en ficha pública (add-on 19€/mes)
- [P3] PWA instalable con icono del negocio (plan Premium)
- [P3] API pública con autenticación (plan Premium)
- [P3] Webhooks de eventos (nueva reserva, cancelación, etc.)
- [P3] Integración con TPV (Square, SumUp)
- [P3] Integración con contabilidad (Holded, Conta.cl)

---

## DECISIONES PENDIENTES

- [ ] ¿Nombre de marca final? ¿"Belleza Local" es definitivo?
- [ ] ¿Dominio? (bellezalocal.es, bookbelleza.es, etc.)
- [ ] ¿Trial con tarjeta o sin tarjeta?
- [ ] ¿Pago solo Stripe o también Redsys para empresas españolas?
- [ ] ¿SMS en Basic o solo email? (recomendación: solo email en Basic)
- [ ] ¿Comisión marketplace y cuánto? (recomendación: 0% directas, 10-15% nuevos clientes captados)
- [ ] ¿Ciudad(es) foco para SEO inicial? (propuesta: Madrid + Barcelona primero)
- [ ] Revisión legal textos GDPR antes de lanzar con usuarios reales

---

## COMPLETADO

- [x] Documentación base del proyecto (PRD, MVP, planes, SEO, UX, roadmaps)
- [x] Schema Prisma completo con todos los modelos
- [x] Scaffold de app (layouts, páginas, lib, API routes)
- [x] CLAUDE.md + reglas de desarrollo
- [x] .env.example con Supabase + todos los servicios
