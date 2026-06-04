# PRD — Belleza Local

## Visión

Ser la plataforma de referencia en España para negocios locales de belleza, estética y bienestar no médico: primero como herramienta de gestión SaaS, después como marketplace de descubrimiento y reserva.

## Problema

Los negocios pequeños de belleza y estética (peluquerías, centros de estética, salones de uñas, depilación, masajes, etc.) siguen gestionando su agenda por teléfono o WhatsApp manual, pierden clientes por no-shows, no tienen presencia digital profesional, y las herramientas existentes (Treatwell, Fresha) les cobran comisiones abusivas (30-40%) o son demasiado complejas para negocios de 1-5 personas.

## Oportunidad

- Fresha aumentó precios en noviembre 2025 → migraciones activas.
- Millones de negocios en España sin digitalizar.
- Usuarios finales no tienen dónde buscar disponibilidad real en su barrio.
- Nadie domina el nicho "SaaS asequible + marketplace local" sin comisiones agresivas.

## Usuarios

### Negocio local (B2B)
- Peluquería, centro de estética, salón de uñas, depilación, masajes, spa urbano.
- 1-10 empleados, 1-3 centros.
- No técnicos. Necesitan simplicidad.
- Pain: teléfono constante, no-shows, sin visibilidad digital.
- Objetivo: más reservas, menos llamadas, agenda ordenada.

### Usuario final (B2C)
- Mujer 25-55, residente urbana o semiurbana.
- Busca servicios de belleza cerca de casa o el trabajo.
- Pain: no sabe qué centros hay, tiene que llamar para saber si hay hueco, no puede reservar online.
- Objetivo: encontrar, ver disponibilidad, reservar en 2 minutos.

### Admin plataforma (interno)
- Equipo AldeIA.
- Gestiona centros, planes, moderación, SEO, featured listings.

## Propuesta de valor

**Para negocios**: "Digitaliza tu centro en 10 minutos. Recibe reservas 24/7. Sin comisiones sobre tus reservas. Desde 24 €/mes."

**Para usuarios**: "Encuentra y reserva en centros de belleza cerca de ti. Disponibilidad real. Sin llamar."

**Diferenciador clave vs competencia**: Sin comisión sobre reservas. Precio justo para negocio pequeño. Herramienta propia + visibilidad marketplace progresiva.

## Funcionalidades por rol

### Negocio
1. Ficha pública del centro (nombre, descripción, fotos, ubicación, horarios, contacto)
2. Gestión de servicios (nombre, duración, precio, categoría, profesional asignado)
3. Gestión de staff / profesionales
4. Gestión de horarios semanales y excepciones
5. Recepción de reservas online
6. Agenda visual (día/semana)
7. Modificar/cancelar reservas
8. Recordatorios automáticos (email en Basic)
9. Ficha básica de clientes
10. Estadísticas simples
11. Bonos (Pro)
12. Productos (Pro)
13. Promociones (Pro)
14. Anti no-show / depósito (Pro)
15. Reseñas (Pro)
16. Multi-centro (Growth)
17. CRM ligero (Growth)
18. Marca blanca (Premium)

### Usuario final
1. Búsqueda por ciudad + servicio
2. Listado de centros con disponibilidad
3. Ficha completa del centro
4. Seleccionar servicio → profesional → fecha → hora
5. Confirmar reserva (datos mínimos: nombre, email, teléfono)
6. Confirmación por email
7. Modificar/cancelar reserva propia
8. Cuenta de usuario (historial, favoritos)
9. Ver bonos disponibles
10. Ver promociones activas

### Admin
1. Ver y aprobar centros
2. Publicar/despublicar centros
3. Cambiar planes
4. Gestionar categorías y localidades
5. Controlar indexación SEO
6. Featured listings
7. Métricas globales

## Restricciones críticas

- **Sin datos médicos**: no ficha médica, no diagnósticos, no historial clínico.
- **Sin servicios médicos**: no medicina estética invasiva, no fisioterapia clínica.
- **GDPR desde el inicio**: consentimiento, minimización de datos, retención limitada.
- **Sin Google Calendar como motor**: disponibilidad 100% propia.
- **Multi-tenant estricto**: datos de un centro nunca accesibles desde otro.

## Métricas de éxito

- Negocios activos de pago (MRR por plan)
- Tasa de activación (centros que publican ficha en < 48h tras registro)
- Reservas generadas/mes desde la plataforma
- Tasa de no-show (debe bajar con recordatorios)
- NPS de negocios y usuarios
- Posicionamiento SEO para queries clave ([servicio] + [ciudad])

## Fuera de alcance (siempre)

- Medicina estética invasiva
- Fisioterapia clínica
- Historia médica o datos de salud sensibles
- Clínicas médicas reguladas
- App nativa iOS/Android en fase inicial (PWA suficiente)

## Fuera de alcance (MVP)

- Marketplace completo con algoritmo de ranking
- WhatsApp propio por negocio (add-on post-MVP)
- E-commerce completo con stock
- IA / recepcionista virtual
- Multi-idioma
- Pagos con Redsys (Stripe en MVP)
