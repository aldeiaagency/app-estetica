# Roadmap para app referencia del mercado

Ultima actualizacion: 2026-06-16

Objetivo: convertir Belleza Local en una plataforma de reservas, marketplace y gestion para negocios de belleza con una experiencia superior para cliente final y negocio.

## Prioridad 1 - Cierre profesional antes de piloto

Estas mejoras son las mas importantes antes de presentar la app a negocios reales.

1. Configuracion real de produccion
   - Variables de Vercel: `CRON_SECRET`, `RESEND_API_KEY`, `EMAIL_FROM`, `NEXT_PUBLIC_APP_URL`.
   - Verificacion de dominio remitente en Resend.
   - Prueba real de recordatorios y lista de espera.

2. Galeria e imagenes de negocio
   - Estado interno: upload real de portada, galeria, staff y productos preparado con endpoint firmado.
   - Pendiente externo: Cloudflare R2, dominio CDN y CORS.
   - Sin las credenciales reales, los perfiles pueden parecer demo aunque el diseño sea bueno.

3. Dashboard de negocio mas accionable
   - Agenda de hoy con alertas.
   - Ocupacion semanal.
   - Servicios mas rentables.
   - Clientes recurrentes, clientes en riesgo y no-shows.

4. Pulido visual global
   - Revisar todas las paginas publicas, dashboard, auth y cuenta.
   - Corregir restos de paletas antiguas.
   - Unificar botones, tablas, estados vacios, formularios y badges.

5. QA manual con datos reales
   - Reserva completa.
   - Cancelacion.
   - Reprogramacion.
   - Lista de espera.
   - Compra de bono.
   - Compra de producto.
   - Flujo negocio: servicios, staff, horarios, productos y pedidos.

## Prioridad 2 - Diferenciales de producto

Estas piezas pueden hacer que el producto destaque frente a agendas basicas.

1. Rebooking inteligente
   - Sugerir al cliente volver a reservar segun servicio anterior.
   - Ejemplo: unas cada 21 dias, cejas cada 30 dias, facial cada 45 dias.

2. Depositos y politica anti no-show
   - Estado interno: senal por servicio, pago con Stripe, reserva pendiente y limpieza automatica de bloqueos caducados.
   - Pendiente externo: claves Stripe, webhook y prueba real en modo test.
   - Pendiente futuro: reglas automaticas segun historial de no-show del cliente.

3. CRM ligero para belleza
   - Ficha de cliente con historial, preferencias, notas internas y consentimiento.
   - Segmentos: VIP, dormidos, primera visita, alto riesgo de no-show.

4. Automatizaciones de marketing permitidas
   - Reactivacion de clientes dormidos.
   - Campanas para bonos o productos.
   - Mensajes solo con consentimiento de marketing.

5. Marketplace local mas potente
   - Ranking por disponibilidad real, calidad del perfil, recurrencia y conversion.
   - Paginas SEO por ciudad, categoria y servicio.
   - Schema.org completo para negocios, servicios y productos.

## Prioridad 3 - Experiencia premium y escalabilidad

1. App o PWA para clientes recurrentes
   - Acceso rapido a reservas, bonos, pedidos y favoritos.

2. WhatsApp/SMS como add-on
   - Confirmaciones y recordatorios por WhatsApp en planes superiores.
   - Cuidado con coste y consentimiento.

3. IA para negocios
   - Recomendaciones de agenda.
   - Textos de servicios.
   - Ideas de campanas.
   - Deteccion de huecos con baja ocupacion.

4. Panel admin avanzado
   - Moderacion de negocios.
   - Calidad de perfiles.
   - Planes, add-ons, featured listings y soporte.

## Veredicto

La base actual ya apunta a producto serio: reserva con calendario mensual, marketplace, productos, bonos, dashboard y lista de espera. Para ser referencia, las siguientes inversiones no deberian centrarse solo en mas pantallas, sino en tres ejes:

- Confianza: perfiles visualmente fuertes, emails correctos, politicas claras y QA real.
- Rentabilidad para el negocio: menos no-shows, mas recurrencia, bonos, productos y rebooking.
- Descubrimiento local: SEO, marketplace ordenado por calidad y disponibilidad real.
