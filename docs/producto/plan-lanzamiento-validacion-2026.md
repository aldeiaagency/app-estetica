# Plan de lanzamiento y validación 2026 - Belleza Local

Última actualización: 13 de julio de 2026

## 1. Propósito

Este documento convierte el producto construido en una secuencia comercial. Cada fase define qué se vende, qué existe, qué falta configurar o construir y qué evidencia permite activarlo.

Estados:

- **Construido**: existe en el repositorio y ha pasado verificación interna.
- **Configurar**: necesita proveedor, secreto, dominio o dato externo.
- **Completar**: falta una parte funcional necesaria.
- **Validar**: debe probarse en staging o con pilotos antes de prometerse.
- **Futuro**: no debe venderse todavía.

## 2. Tesis de lanzamiento

Belleza Local no saldrá inicialmente como otro software completo para salones. Venderá este resultado:

> Implantamos en 48 horas una presencia profesional, reservas online y recordatorios para reducir WhatsApp manual y organizar las citas del centro.

El lanzamiento será asistido: el equipo configura el centro, importa su catálogo y acompaña a la propietaria. El segmento inicial son centros de uñas, pestañas, depilación y estética, con uno a tres profesionales y gestión actual por WhatsApp, Instagram, papel o Google Calendar.

## 3. Fases comerciales

| Fase | Producto | Precio orientativo | Estado |
|---|---|---:|---|
| 0 | Fundadores: presencia, reservas, WhatsApp compartido y marketplace sin pago online | 49 EUR de activación, primer mes incluido; después 24 EUR/mes | Base desplegada; falta completar producto y configuración externa |
| 1 | Reservas Protegidas: señales, lista de espera y recuperación de huecos | 39-59 EUR/mes | Código avanzado; falta configuración externa |
| 2 | Growth: recurrencia, bonos, packs, beneficios y venta online | 59 EUR/mes | Parcialmente construido |
| 3 | Elite: CRM, campañas, IA y multi-centro | 99-149 EUR/mes | No comercializar todavía |
| 4 | Marketplace de adquisición y Partner | Comisión, add-ons o desde 399 EUR | Depende de densidad e integraciones |

## 4. Fase 0 - Centros Fundadores

### 4.0 Estado confirmado tras la activación del 13 de julio de 2026

La base técnica ya está en producción y no debe volver a tratarse como trabajo pendiente:

- 91 pruebas superadas, tipos y build correctos, 0 vulnerabilidades de producción;
- 20 de 20 migraciones aplicadas en Supabase;
- remediaciones P0 de seguridad aplicadas;
- GitHub y CodeQL correctos;
- despliegue `Ready` en `https://app-estetica-one.vercel.app`;
- seis crons instalados, aunque limitados a ejecución diaria por Vercel Hobby.

La aplicación está operativa como base técnica, pero la Fase 0 comercial todavía no está completa. Faltan servicios externos imprescindibles, el canal WhatsApp y varias capacidades del marketplace definidas en este documento. Stripe no es un requisito de Fase 0: las suscripciones de los primeros pilotos pueden facturarse manualmente y los productos se pagan en el centro.

### 4.1 Resultado vendido

> Tus clientas pueden descubrir el centro, reservar o modificar su cita, recibir un recordatorio por WhatsApp y reservar productos con ofertas para pagarlos al recogerlos.

### 4.2 Funciones incluidas

- ficha pública del centro;
- servicios, precios, duración, profesionales y horarios;
- agenda y reservas online 24/7;
- enlace para Instagram, WhatsApp y Google Business Profile;
- alta manual y gestión de reservas;
- reprogramación y cancelación por la clienta;
- política de cancelación configurable;
- base básica de clientas e historial;
- confirmación y recordatorio por email;
- recordatorio desde un WhatsApp común de Belleza Local;
- marketplace de recogida: catálogo, ofertas, descuentos, cupones, carrito, reserva de stock, pedido y pago en el centro;
- panel básico de citas, clientes, pedidos y actividad;
- implantación y soporte.

### 4.3 Infraestructura obligatoria

| Elemento | Estado | Acción | Criterio de salida |
|---|---|---|---|
| Código auditado | Completado | Mantener CI y CodeQL | 91 tests, tipos y build correctos |
| Supabase | Completado | Mantener backup y migraciones | 20/20 migraciones aplicadas |
| Vercel | Completado con limitación | Mantener despliegue; resolver frecuencia de outbox | Deploy estable y outbox cada 1-5 minutos |
| Dominio | Configurar | Registrar, DNS, HTTPS y canonical | `bellezalocal.es` público y operativo |
| Email | Configurar | Resend, SPF, DKIM y DMARC | Confirmación y recordatorio entregados |
| Rate limit | Configurar | Upstash Redis europeo | Readiness 200 y prueba 429 |
| Imágenes | Configurar | Cloudflare R2, CDN y CORS | Subida desde dashboard correcta |
| n8n | Configurar y validar | Firma HMAC, leads, pedidos y alertas | Evento entregado una sola vez |
| WhatsApp | Completar y configurar | Meta Cloud API, número, template y webhook | Enviado, entregado, baja y reintento verificados |
| Observabilidad | Completar | Alertas de errores, crons y outbox | Incidente controlado detectado |
| Pruebas PostgreSQL | Validar | Ejecutar las 7 pruebas omitidas contra staging | 7/7 correctas |

Nota de operación: el informe de activación denomina al rate limit sin Upstash un fallback en memoria, pero el código productivo actual falla de forma cerrada cuando Redis no está disponible. Los flujos protegidos pueden responder `429`; Upstash es bloqueante para pilotos reales.

### 4.4 Alta, planes y cobro

1. Unificar nombres comerciales y técnicos: Presencia=`BASIC`, Growth=`PRO`, Elite=`GROWTH`, Partner=`PREMIUM`.
2. Corregir y probar slugs de precios, signup, base de datos y onboarding. El mapeo canónico ya está aplicado: `presencia`=`BASIC`, `growth`=`PRO`, `elite`=`GROWTH`.
3. Incluir marketplace sin pago online y WhatsApp compartido en Fundadores/Presencia.
4. Definir un recordatorio WhatsApp por reserva y registrar su consumo.
5. Activar suscripción o facturar manualmente a los primeros diez pilotos.
6. Preparar contrato, soporte, tratamiento de datos y cancelación mensual.
7. Implantar cada centro con ficha, cinco servicios mínimos, staff, horario, política y prueba real.

### 4.5 Reprogramación y cancelación

Estado: **Construido; falta validación productiva**.

Acciones:

1. Probar reserva anónima y autenticada.
2. Probar modificación dentro y fuera del plazo.
3. Probar cancelación repetida e idempotencia.
4. Probar dos reservas simultáneas para el mismo hueco.
5. Incluir enlace seguro de gestión en email y WhatsApp.
6. Mostrar la política concreta antes de confirmar.
7. Confirmar que cancelar libera el hueco.

### 4.6 WhatsApp común de recordatorios

Estado: **Código preparado; configurar y validar**. El canal email sigue operativo y el canal WhatsApp central ya tiene integración, consentimiento y webhook en código; faltan credenciales Meta, número y template aprobado.

Arquitectura de fase 0:

- número exclusivo de Belleza Local;
- remitente identificado como Belleza Local;
- mensaje con el nombre del centro;
- template transaccional/utility aprobado;
- el centro no necesita WhatsApp API;
- el agente futuro de cada centro usará otro número y otra conexión.

Ejemplo:

> Belleza Local: te recordamos tu cita en {{centro}} el {{fecha}} a las {{hora}} para {{servicio}}. Gestiona tu cita: {{enlace_seguro}}. Responde BAJA para no recibir más recordatorios por WhatsApp.

Desarrollo y configuración necesarios:

1. Usar Meta WhatsApp Cloud API como canal transaccional central; n8n puede orquestar, pero la app conserva el estado.
2. Verificar Meta Business Portfolio y WhatsApp Business Account.
3. Adquirir un número dedicado y aprobar el nombre `Belleza Local`.
4. Aprobar el template utility en español. Fuera de la ventana de 24 horas se necesita template aprobado.
5. Normalizar teléfonos a E.164.
6. Añadir consentimiento opcional específico para WhatsApp, separado del marketing.
7. Guardar fecha, fuente y baja del consentimiento.
8. Separar los estados de recordatorio email y WhatsApp; `reminderSentAt` único no sirve para ambos.
9. Crear entrega idempotente por reserva, canal y template, con reintentos.
10. Integrar la entrega con la outbox existente.
11. Crear webhook de Meta para enviado, entregado, leído y fallido.
12. Procesar `BAJA/STOP` y bloquear nuevos mensajes iniciados por la plataforma.
13. Registrar coste, límites y calidad del template por centro.
14. Actualizar privacidad y textos de consentimiento.
15. Probar teléfono inválido, baja, duplicado, reintento y enlace de gestión.

ManyChat no es necesario para estos recordatorios. El add-on futuro usará el número/WABA de cada centro. El número central seguirá siendo transaccional. No se conectará el mismo número a plataformas incompatibles; ManyChat indica que la coexistencia disponible tiene requisitos y limitaciones.

### 4.7 Marketplace operativo sin pago online

Alcance vendible:

> El centro publica y promociona productos; la clienta los encuentra, aplica una oferta o cupón, reserva el stock y paga al recoger el pedido.

El marketplace de Fase 0 será completamente operativo dentro de un alcance concreto: click & collect, carrito de un único centro y productos simples. No incluye envío, carrito multi-centro, variantes, reseñas de producto ni pago online. Si un artículo tiene tamaños o tonos, cada variante se publica como producto/SKU independiente. El centro cobra, entrega el ticket o factura y gestiona la devolución; Belleza Local no custodia ni liquida dinero.

#### Estado actual verificado

| Capacidad | Estado | Trabajo pendiente |
|---|---|---|
| Catálogo público, búsqueda, filtros y ficha | Construido | QA y SEO de producto |
| Carrito de un único centro y checkout | Construido | Hacer explícita la recogida en todos los pasos |
| Precio recalculado en servidor | Construido para precio base | Incorporar promociones sin confiar en el carrito |
| Reserva atómica de stock y caducidad | Construido | Validar concurrencia y frecuencia del cron |
| Pedido sin Stripe, pago en el centro | Construido | Pulir confirmación, plazo e instrucciones |
| Estados del pedido en dashboard | Construido | Completar transiciones, avisos y motivos |
| Crear producto y activar/desactivar | Construido | Mantener |
| Editar, duplicar, archivar y eliminar producto | Completar | CRUD seguro por centro |
| Categoría, SKU, galería y stock bajo | Parcial | Completar datos y panel |
| Ofertas automáticas y precio anterior | Construido en código | QA, datos reales y validación de reglas |
| Cupones de descuento | Construido en código | QA de concurrencia y redenciones |
| Aviso de pedido al centro | No construido | Email, dashboard y outbox |
| Confirmación y cambios de estado a la clienta | Parcial | Añadir emails de pedido y validar outbox |
| Consulta segura y cancelación por la clienta | No construido | Enlace firmado, política y reposición de stock |
| Imágenes gestionadas | Código parcial | Configurar R2 y probar galería |
| Administración y moderación del catálogo | Parcial | Completar ocultación, auditoría e incidencias |
| Analítica de embudo | Parcial/no verificado | Vistas, carrito, pedido, recogida y descuento |

#### Ofertas, descuentos y cupones

Se admitirán dos tipos de incentivo:

- **oferta automática**: se aplica sin código y muestra precio anterior, precio final y vigencia;
- **cupón**: la clienta introduce un código y recibe una validación clara antes de confirmar.

Reglas necesarias:

1. Descuento porcentual o importe fijo.
2. Aplicación a productos concretos, categoría o pedido completo de un centro.
3. Fecha y hora de inicio/fin, activación manual y zona horaria del centro.
4. Importe mínimo, descuento máximo y límite total de usos.
5. Límite de un uso por cuenta; si se permite compra invitada, el email solo será una barrera débil y debe quedar indicado.
6. Promociones no acumulables en Fase 0; se aplica una única ventaja, la más favorable elegible.
7. El total se recalcula en servidor dentro de la creación transaccional del pedido.
8. El pedido conserva subtotal, descuento, total y una copia de la regla aplicada; cada línea conserva precio original y precio efectivo.
9. El uso del cupón y la reserva de stock se confirman de forma atómica para evitar sobreuso y sobreventa.
10. El dashboard permite crear, editar, pausar, programar y consultar usos de cada promoción.

El modelo `Promotion` existente solo contempla descuentos asociados a servicios. Debe ampliarse de forma compatible o separarse en promociones de producto. Como mínimo hacen falta alcance, código opcional, productos/categorías elegibles, mínimo de compra, tope, usos, acumulación, prioridad y redenciones. Los modelos `Order` y `OrderItem` también deben guardar el desglose y la fotografía histórica del precio aplicado.

#### Operación del centro

1. Crear, editar, duplicar, activar, archivar y ordenar productos.
2. Gestionar categoría, SKU, marca, descripción, precio, precio anterior, galería, stock y aviso de stock bajo.
3. Definir dirección, horario, instrucciones y plazo máximo de recogida.
4. Recibir cada pedido en dashboard y por email sin depender de una ejecución diaria.
5. Cambiar estados con una máquina de estados cerrada: pendiente, confirmado, listo, recogido o cancelado.
6. Registrar motivo de cancelación y reponer stock una sola vez.
7. Ver referencia, datos de contacto, líneas, descuento, total y trazabilidad del pedido.
8. Exportar pedidos en CSV puede quedar como mejora posterior; no bloquea Fase 0.

#### Experiencia de la clienta

1. Ver disponibilidad, oferta, vigencia y centro vendedor antes de añadir al carrito.
2. Entender siempre que reserva el producto y paga en el centro.
3. Aplicar o retirar un cupón y ver el desglose antes de confirmar.
4. Recibir referencia, dirección, horario, instrucciones, plazo y política de no recogida.
5. Consultar el pedido mediante enlace firmado sin exponer pedidos ajenos.
6. Cancelar mientras la política lo permita y recibir confirmación.
7. Recibir avisos al confirmar, dejar listo o cancelar el pedido.

#### Administración, legal y confianza

1. Habilitar productos y promociones para Fundadores/Presencia y activar `FEATURE_MARKETPLACE=true` y `FEATURE_PRODUCTS=true`.
2. Crear moderación de plataforma: ocultar productos, registrar motivo y auditar al administrador.
3. Definir categorías y productos prohibidos, datos obligatorios y responsabilidad del vendedor.
4. Publicar términos del marketplace, privacidad, no recogida, cancelación, devolución, producto defectuoso y atención de incidencias.
5. Mostrar quién vende, quién cobra y quién responde por el producto.
6. Añadir metadatos SEO, canonical y datos estructurados `Product`/`Offer` solo cuando stock y precio sean fiables.

#### Pruebas de salida del marketplace

1. Producto creado, editado, archivado y publicado con imágenes reales.
2. Oferta automática y cupón válidos, caducados, agotados y no elegibles.
3. Descuento fijo que nunca produce total negativo y porcentaje sujeto a tope.
4. Dos pedidos simultáneos sobre la última unidad sin sobreventa.
5. Dos usos simultáneos del último cupón disponible sin sobreuso.
6. Cancelación, caducidad y cambio de estado sin doble reposición de stock.
7. Aislamiento entre centros en productos, promociones y pedidos.
8. Pedido invitado consultable solo mediante enlace firmado válido.
9. Emails de pedido entregados y eventos de outbox idempotentes.
10. Flujo móvil completo probado en producción controlada con al menos un pedido recogido.

Para cobrar online falta decidir merchant of record, implementar Stripe Connect, KYC de vendedores, comisiones, transferencias, reembolsos, disputas, IVA, facturación y conciliación. Nada de ello bloquea la Fase 0 descrita aquí.

### 4.8 Orden de ejecución y checklist

#### Bloque A - Activación técnica base

- [x] Auditoría, tests, tipos y build.
- [x] Migraciones Supabase.
- [x] Deploy de producción y CI/CodeQL.
- [x] Remediaciones P0 de seguridad.
- [x] Corrección de readiness para que click & collect no exija Stripe.
- [x] Rate limit excluye endpoints de salud.
- [ ] Upstash Redis EU y prueba de límites.
- [ ] Resend con dominio verificado, SPF, DKIM y DMARC.
- [ ] R2 con bucket, CDN, CORS y prueba de galería.
- [ ] Dominio `bellezalocal.es`, HTTPS, canonical y URLs de Auth/Resend/Meta.
- [ ] Outbox cada 1-5 minutos mediante Vercel Pro o cron externo.
- [ ] Firma HMAC y reintentos verificados en n8n.
- [ ] Alertas de error, cron y outbox.

#### Bloque B - Acceso comercial y configuración de planes

- [x] Corregir el mapeo de slugs: `presencia`=`BASIC`, `growth`=`PRO`, `elite`=`GROWTH`, `partner`=`PREMIUM`.
- [x] Mantener aliases antiguos de alta (`basic` y `pro`) sin conservar el mapeo incorrecto de `growth`.
- [x] Habilitar productos y promociones en el plan Fundadores/Presencia a nivel de código.
- [ ] Activar y verificar las feature flags de marketplace/productos en Preview y Production.
- [ ] Decidir facturación manual y contrato de los primeros diez centros.

#### Bloque C - Marketplace base

- [ ] CRUD completo de producto, categoría, SKU, galería, stock bajo y archivo.
- [ ] Instrucciones, horario y plazo de recogida por centro.
- [ ] Estados cerrados de pedido, cancelación y reposición idempotente.
- [ ] Consulta/cancelación segura por la clienta.
- [ ] Notificaciones al centro y a la clienta mediante outbox.
- [ ] Moderación de plataforma y políticas legales.

#### Bloque D - Ofertas y descuentos

- [x] Migración de promociones de producto, cupones y redenciones.
- [x] Motor transaccional de elegibilidad y cálculo en servidor.
- [x] Desglose histórico en pedido y líneas.
- [x] Dashboard para crear, programar, pausar y medir promociones.
- [x] Precio promocional visible en catálogo y ficha; cupón en checkout.
- [ ] Pruebas de concurrencia, caducidad, topes y no acumulación.

#### Bloque E - WhatsApp común

- [x] Integración Meta Cloud API, consentimiento separado, claims y bajas en código.
- [x] Registro de entregas y webhook autenticado en código.
- [ ] Meta Business Portfolio/WABA verificados y número dedicado.
- [ ] Template utility aprobado en español.
- [ ] Consentimiento, baja y teléfonos E.164.
- [ ] Estado por canal, outbox, reintentos y webhook de entrega.
- [ ] Enlace firmado de gestión de cita dentro del mensaje.
- [ ] Pruebas de envío, duplicado, fallo, entrega y `BAJA`.

#### Bloque F - Validación final

- [ ] Ejecutar las 7 pruebas PostgreSQL omitidas contra staging.
- [ ] E2E móvil de reserva, reprogramación, cancelación y WhatsApp.
- [ ] E2E móvil de oferta, cupón, pedido, cancelación y recogida.
- [ ] Prueba de aislamiento entre centros y accesos administrativos.
- [ ] Cargar datos reales, formar a cinco centros y ejecutar pedidos controlados.
- [ ] Siete días de operación sin errores críticos ni outbox atascada.

### 4.9 Criterios de salida de fase 0

- diez pilotos seleccionados y al menos cinco dispuestos a pagar;
- centro publicado en menos de 48 horas;
- reserva, reprogramación y cancelación verificadas;
- email y WhatsApp entregados, con consentimiento y baja funcional;
- oferta, cupón y pedido real recogido en el marketplace;
- readiness 200 durante siete días;
- crons sin duplicados y con alertas;
- cero incidentes críticos abiertos;
- métricas y soporte disponibles.

Métricas: citas online, tiempo manual ahorrado, entregabilidad, autoservicio de cambios, pedidos recogidos, actividad semanal, soporte por centro y retención al tercer mes.

## 5. Fase 1 - Reservas Protegidas

Resultado: proteger citas de valor y recuperar huecos.

Incluye señales, política de cancelación, lista de espera, liberación de holds, recordatorios y reembolsos trazables.

Pendiente:

1. Configurar Stripe test/producción y webhook.
2. Probar señal, duplicado, caducidad, cancelación y reembolso.
3. Definir cómo se repercute el coste de Stripe.
4. Activar `hasBookingDeposit` y `hasWaitlist` por plan.
5. Medir no-show antes y después.

## 6. Fase 2 - Growth y recurrencia

Resultado: convertir una visita en la siguiente reserva y aumentar ticket.

Incluye bonos, packs, beneficios, rebooking, seguimiento, pago online de producto, rutina, reposición, reseñas y campañas email.

Pendiente:

1. Stripe para bonos y Stripe Connect para vendedores.
2. Emails/WhatsApp de compra, uso, saldo y reposición.
3. Activar `FEATURE_BONOS`, `FEATURE_PRODUCTS`, `FEATURE_FOLLOW_UPS` y campañas gradualmente.
4. Consentimiento de marketing separado.
5. Métricas de repetición y ticket incremental.
6. Validar que tres centros pagan 59 EUR/mes.

## 7. Fase 3 - Elite

Resultado: operar varios centros y una cartera activa con automatización.

Incluye multi-centro, CRM, segmentación, campañas, analítica, oportunidades e IA asistida.

No activar sin permisos multi-centro probados, reporting consistente, límites de IA, bajas de campañas, métricas de retorno y soporte adecuado.

## 8. Fase 4 - Marketplace de adquisición y Partner

No prometer nuevas clientas hasta alcanzar aproximadamente 25-30 centros en una ciudad, cobertura útil en varias categorías, 300 reservas mensuales y tráfico/atribución medible.

Monetización futura: destacados, comisión solo por clienta nueva, multi-centro, API, integraciones y white-label.

### Add-on: agente propio de WhatsApp y ManyChat

Cada centro podrá contratar número/WABA propio, agente para consultar disponibilidad, reservar, reprogramar y cancelar, traspaso humano y automatizaciones de Instagram/Facebook con ManyChat.

Requiere API de herramientas segura, autorización por centro, auditoría, Meta Embedded Signup o ManyChat por cliente, costes aislados, protección contra duplicados/prompt injection y bandeja humana.

El número central de Belleza Local no será el agente de todos los centros; seguirá siendo un canal transaccional común.

## 9. No vender todavía

- captación garantizada;
- pago marketplace con liquidación a centros;
- WhatsApp propio o ManyChat por centro;
- app móvil nativa;
- TPV, contabilidad o nóminas;
- diagnóstico médico por IA;
- API y white-label productivos;
- analítica o ROI garantizado;
- campañas autónomas WhatsApp/SMS;
- Partner sin alcance contractual.

## 10. Referencias

- Activación de producción: `docs/ACTIVATION_REPORT_2026-07-13.md`.
- Configuración: `docs/tecnico/configuracion-pendiente-produccion.md`.
- Auditoría: `docs/auditoria/auditoria-integral-bugs-mejoras-2026-07-13.md`.
- Monetización: `docs/producto/planes-y-monetizacion.md` y `lib/billing/plans.ts`.
- ManyChat Coexistence: https://help.manychat.com/hc/en-us/articles/19006109300508-Connect-your-WhatsApp-number-to-Manychat-with-Coexistence-BETA
- ManyChat métodos de conexión: https://help.manychat.com/hc/en-us/articles/19247843644060-How-to-connect-WhatsApp-to-Manychat-choosing-the-best-method
