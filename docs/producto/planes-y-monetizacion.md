# Planes y Monetización — Belleza Local

## Modelo de ingresos

**Principal**: Suscripción SaaS mensual por centro/organización.
**Secundario**: Add-ons por consumo o funcionalidad.
**Futuro**: Comisión marketplace (solo en reservas generadas desde plataforma, no directas).

## Planes

### Basic — 24 €/mes por centro

**Para quién**: Peluquería o centro pequeño que quiere digitalizarse sin complicaciones.

**Incluye**:
- 1 centro
- Ficha pública básica (nombre, servicios, horarios, contacto, foto principal)
- Agenda propia
- Hasta 10 servicios
- Hasta 3 profesionales
- Reservas online ilimitadas
- Emails de confirmación y cancelación (desde dominio de la plataforma)
- Recordatorios automáticos 24h antes (email, desde cuenta común de la app)
- Analítica básica (reservas del mes, ocupación)
- Visibilidad orgánica en marketplace (no destacado)
- Sin WhatsApp propio
- Sin bonos ni productos
- Sin anti no-show
- Sin reseñas

**Límites técnicos**:
- Notificaciones vía cuenta compartida de la app (ahorra coste: no hay número propio)
- Sin personalización de emails
- Sin automatizaciones avanzadas

### Pro — 59 €/mes por centro

**Para quién**: Centro que quiere reducir no-shows, vender bonos y gestionar mejor su clientela.

**Incluye todo Basic más**:
- Servicios ilimitados
- Profesionales ilimitados
- Bonos / packs de sesiones
- Productos de cosmética (catálogo básico)
- Depósito obligatorio configurable (anti no-show)
- Política de cancelación con penalización
- Lista de espera
- Reseñas (solicitud post-servicio + visualización)
- Promociones simples (descuento porcentual o precio fijo)
- Enlace de reserva con UTM por campaña
- Reporting mejorado (ingresos, servicios más populares, no-shows)
- Múltiples fotos del centro

**Diferenciador**: Pagar 59 € elimina el coste de no-shows. Un no-show evitado = plan amortizado.

### Growth — 149 €/mes por organización

**Para quién**: Negocio con 2-3 centros o un centro que quiere crecer y fidelizar clientas.

**Incluye todo Pro más**:
- Hasta 3 centros
- Cabinas / recursos físicos (no solo staff)
- CRM ligero (ficha de cliente, historial, notas, etiquetas)
- Campañas de email básicas (reactivación de clientas)
- Recuperación de clientas inactivas (automática)
- SEO local ampliado (más páginas indexadas, acceso a featured)
- Marketplace activo (aparece en resultados premium)
- Analítica por centro separada
- Automatizaciones más avanzadas (rebooking post-visita)
- Gestión multi-centro desde una sola cuenta

### Premium — desde 399 €/mes

**Para quién**: Cadenas, franquicias, operadores con múltiples centros o necesidades especiales.

**Incluye todo Growth más**:
- Centros ilimitados
- Marca blanca / PWA con dominio propio
- API / webhooks propios
- BI avanzado (exportación, informes personalizados)
- Soporte prioritario (SLA definido)
- Permisos avanzados (roles por centro, por función)
- Onboarding asistido (configuración por el equipo)
- Automatizaciones premium
- Personalización fuerte de comunicaciones
- Integraciones avanzadas (TPV, contabilidad)

## Add-ons

Monetización adicional vendida por separado, disponible según plan base.

| Add-on | Precio | Plan mínimo | Descripción |
|--------|--------|-------------|-------------|
| WhatsApp propio del negocio | 29 €/mes | Pro | Recordatorios desde número propio del negocio |
| SMS por consumo | 0,08 €/SMS | Basic | SMS de confirmación/recordatorio |
| Recepcionista IA | 79 €/mes | Growth | Agente IA que responde preguntas y gestiona reservas por chat |
| Rebooking automático | 19 €/mes | Pro | Propone nueva cita tras cancelación automáticamente |
| Featured listing | 49 €/mes/localidad | Basic | Posición destacada en búsquedas de una localidad |
| Páginas SEO extra | 29 €/mes | Pro | Páginas SEO adicionales con contenido editorial |
| Migración de datos | 149 € (único) | Basic | Importación de clientes y reservas desde otro sistema |
| Onboarding asistido | 199 € (único) | Basic | Configuración completa por el equipo |
| Dominio propio | 19 €/mes | Growth | URL personalizada para la ficha pública |
| Campañas promocionales | 39 €/mes | Pro | Promociones destacadas en homepage y búsquedas |
| Soporte prioritario | 49 €/mes | Pro | SLA de respuesta en 4h hábiles |
| Analytics avanzado | 29 €/mes | Pro | Exportación de datos, informes a medida |

## Modelo de comisión marketplace (futuro, post-MVP)

- **0% de comisión** sobre reservas directas (cliente llega por su cuenta a la ficha).
- **10-15% de comisión** solo sobre reservas generadas por el marketplace cuando el cliente no conocía el centro (reservas de "nuevo cliente" captado por la plataforma).
- Esta comisión aplica solo si el centro tiene activo el Marketplace Activo (Growth+).
- Se implementa post-MVP cuando el marketplace tenga tráfico suficiente.

**Por qué esta estructura**: Es el principal diferenciador vs Treatwell/Fresha. Sin comisión para reservas directas. Comisión solo por valor real generado (nuevo cliente captado).

## Proyección financiera básica

| Escenario | Centros | Mix plan | MRR estimado |
|-----------|---------|----------|--------------|
| Early | 100 centros | 80% Basic, 20% Pro | ~2.400-3.400 €/mes |
| Growth | 500 centros | 60% Basic, 30% Pro, 10% Growth | ~16.000-20.000 €/mes |
| Scale | 2.000 centros | 40% Basic, 40% Pro, 15% Growth, 5% Premium | ~80.000-120.000 €/mes |

## Regla económica de notificaciones

**Por qué es crítico**:
- WhatsApp API: 0,005-0,01 €/mensaje
- SMS: 0,07-0,10 €/mensaje
- Email: 0,0001-0,001 €/mensaje

Con 100 centros y 1.000 recordatorios/mes:
- Solo email: ~0,10 € total
- SMS: ~70-100 €
- WhatsApp: ~5-10 €

**Regla**: Basic usa email exclusivamente. El número/cuenta es de la plataforma, no del negocio. SMS y WhatsApp son add-on de pago explícito. Así, el plan Basic es rentable desde el primer suscriptor.

## Riesgos de monetización

1. **Precio demasiado bajo**: 24 €/mes puede ser insuficiente si el CAC es alto. Revisar tras MVP.
2. **Churn por falta de uso**: Negocios que se registran pero no usan la app. Resolver con onboarding sólido.
3. **Comisión marketplace difícil de implementar**: Atribución de "nuevo cliente" es compleja técnicamente. No implementar hasta tener datos.
4. **Competencia de precio**: Fresha y Booksy tienen economías de escala. Posicionarse por simplicidad + precio justo, no solo por precio.
