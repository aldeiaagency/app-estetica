# Roadmap de Producto — Belleza Local

> Este documento conserva el roadmap histórico de construcción. El plan vigente de lanzamiento y activación comercial está en [`plan-lanzamiento-validacion-2026.md`](./plan-lanzamiento-validacion-2026.md).

## Fase 0 — Fundamentos (semanas 1-4)

**Objetivo**: Infraestructura lista, documentación cerrada, scaffold del proyecto.

- [x] Repositorio y estructura de proyecto
- [x] Documentación de producto y técnica
- [x] Schema Prisma inicial
- [ ] Stack técnico instalado y configurado
- [ ] Variables de entorno y deploy base
- [ ] Base de datos en producción
- [ ] CI/CD básico

---

## Fase 1 — MVP Operativo (semanas 5-12)

**Objetivo**: Un negocio puede registrarse, configurar su ficha y recibir reservas. Un usuario puede buscar y reservar.

### Backend
- [ ] Auth.js: registro, login, recuperación de contraseña
- [ ] Modelo de organización y centro
- [ ] CRUD de servicios
- [ ] CRUD de staff
- [ ] CRUD de horarios semanales
- [ ] Motor de disponibilidad v1 (slots disponibles sin colisiones)
- [ ] API de reservas (crear, cancelar)
- [ ] Emails transaccionales (confirmación, cancelación, notificación negocio)
- [ ] Stripe: suscripción Basic y Pro
- [ ] Webhook Stripe para activar planes
- [ ] Admin: aprobar/publicar centros

### Frontend público
- [ ] Home con buscador
- [ ] Página de resultados por ciudad/categoría
- [ ] Ficha de centro
- [ ] Flujo de reserva (5 pasos)
- [ ] Página de confirmación
- [ ] Cancelación por enlace en email
- [ ] Páginas legales (privacidad, cookies, aviso legal)

### Dashboard negocio
- [ ] Onboarding wizard (5 pasos)
- [ ] Agenda del día
- [ ] Listado de reservas
- [ ] Gestión de servicios
- [ ] Gestión de horarios
- [ ] Gestión de staff
- [ ] Vista de plan y upgrade
- [ ] Enlace de reserva shareable

### Admin plataforma
- [ ] Login admin
- [ ] Listado de centros
- [ ] Aprobar/publicar/bloquear centros
- [ ] Cambiar plan de organización

---

## Fase 2 — Retención y valor (semanas 13-20)

**Objetivo**: Reducir no-shows, aumentar valor por cliente, mejorar visibilidad.

- [ ] Recordatorios automáticos 24h antes (email)
- [ ] Modificación de reserva por usuario
- [ ] Bonos / packs de sesiones (plan Pro)
- [ ] Política de cancelación con depósito (plan Pro)
- [ ] Lista de espera (plan Pro)
- [ ] Reseñas: solicitud post-servicio + visualización (plan Pro)
- [ ] Galería de fotos del centro
- [ ] Descripción larga + SEO del centro
- [ ] SEO básico: páginas ciudad con centros
- [ ] Sitemap dinámico
- [ ] Structured data LocalBusiness
- [ ] Analítica básica en dashboard (reservas, ingresos, no-shows)
- [ ] Excepciones de horario (vacaciones, festivos)
- [ ] Bloqueos manuales en agenda
- [ ] Métricas en admin

---

## Fase 3 — Marketplace y crecimiento (semanas 21-32)

**Objetivo**: La plataforma genera tráfico y reservas por sí sola.

- [ ] SEO: páginas ciudad+servicio (≥3 centros)
- [ ] SEO: páginas editoriales manuales (10 ciudades clave)
- [ ] Multi-centro (plan Growth, hasta 3 centros)
- [ ] Featured listings (add-on)
- [ ] CRM ligero: ficha de cliente, historial, etiquetas (plan Growth)
- [ ] Campañas de email básicas (plan Growth)
- [ ] Recuperación de clientas inactivas (plan Growth)
- [ ] Productos de cosmética en ficha (plan Pro)
- [ ] Promociones en ficha pública (plan Pro)
- [ ] Cabinas / recursos físicos (plan Growth)
- [ ] Analítica por centro separada (plan Growth)
- [ ] Vista multi-centro en dashboard (plan Growth)
- [ ] Mapa de resultados (Google Maps embed)
- [ ] Favoritos de usuario
- [ ] Historial de reservas en cuenta de usuario

---

## Fase 4 — Premium y automatización (semanas 33-52)

**Objetivo**: Subir ARPU con planes Premium y add-ons de automatización.

- [ ] WhatsApp Business API como add-on
- [ ] Marca blanca / dominio propio (plan Premium)
- [ ] API / webhooks para integraciones externas (plan Premium)
- [ ] BI avanzado: exportación, informes a medida
- [ ] Recepcionista IA (add-on, agente de reservas por chat)
- [ ] Rebooking automático por WhatsApp (add-on)
- [ ] Migración asistida de datos desde competidores
- [ ] Integraciones con TPV (Square, SumUp)
- [ ] Múltiples idiomas (catalán, euskera, inglés)
- [ ] Comisión marketplace (solo nuevos clientes captados)
- [ ] PWA para usuarios finales (instalable en móvil)

---

## Decisiones de roadmap pendientes

1. **¿Trial gratuito?** Propuesta: 14 días gratis en Basic. Requiere tarjeta desde el inicio (reduce spammers) o sin tarjeta (más conversiones). Decidir antes de lanzar.
2. **¿Onboarding asistido gratuito en los primeros 50 centros?** Inversión de tiempo que puede acelerar la validación del producto.
3. **¿Foco en qué ciudades primero?** Propuesta: Madrid y Barcelona para tráfico SEO. Elegir 2-3 ciudades medianas para prueba de concepto real (Sevilla, Valencia, Bilbao).
4. **¿Marketplace en Fase 1 o solo ficha directa?** El marketplace requiere tráfico para ser útil. Propuesta: Fase 1 = directamente a la ficha por URL directa. Fase 2 = búsqueda con listado.
5. **¿SMS en Basic?** Propuesta: no. Solo email en Basic. SMS como add-on de pago. Revisar si el no-show rate mejora solo con email o se necesita SMS.
