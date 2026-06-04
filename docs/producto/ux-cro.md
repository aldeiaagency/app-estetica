# UX y CRO — Belleza Local

## Principios UX

1. **Menos pasos, más conversión**: Cada pantalla adicional reduce la conversión un 20-30%.
2. **Mobile first**: 80%+ del tráfico vendrá de móvil.
3. **Claridad sobre estética**: Entender la propuesta antes que impresionar visualmente.
4. **Velocidad como UX**: Cada segundo de carga adicional pierde el 7% de conversiones.
5. **Confianza visible**: Reseñas, fotos reales, precios claros, política de cancelación visible.

## Flujos críticos

### Flujo 1: Reserva (usuario final)

Objetivo: de "buscar un servicio" a "reserva confirmada" en < 3 minutos.

```
1. Home / Búsqueda
   → Buscador prominente: "¿Qué buscas?" + "¿Dónde?"
   → CTA: "Buscar disponibilidad"

2. Resultados
   → Cards de centros: foto, nombre, servicios, precio desde, valoración, disponibilidad próxima
   → Filtros: precio, valoración, disponibilidad hoy/mañana, distancia
   → Sin mapa en MVP (añadir en fase 2)

3. Ficha del centro
   → Foto hero, nombre, valoración, descripción breve
   → Lista de servicios con precio y duración
   → CTA sticky: "Reservar"
   → Horarios y datos de contacto

4. Selección de servicio
   → Lista de servicios del centro (si no viene de la ficha ya seleccionado)
   → Nombre, duración, precio, descripción breve

5. Selección de profesional (opcional)
   → "Sin preferencia" como opción por defecto
   → Fotos + nombre del profesional si están disponibles

6. Selección de fecha y hora
   → Calendario con días disponibles marcados
   → Slots de tiempo disponibles (formato 9:00, 9:30, 10:00...)
   → Máximo 4 semanas hacia adelante en MVP

7. Datos del usuario
   → Nombre, email, teléfono (mínimos imprescindibles)
   → Checkbox GDPR (obligatorio)
   → Opción de crear cuenta (no obligatoria)

8. Confirmación
   → Resumen: servicio, profesional, fecha, hora, centro
   → Precio visible
   → Botón "Confirmar reserva"

9. Página de éxito
   → "Reserva confirmada"
   → Resumen completo
   → "Añadir a calendario" (Google / iCal)
   → CTA: "Modificar o cancelar"
   → Email enviado (mostrar dirección)
```

**Métricas a medir**: Drop-off en cada paso. El objetivo es > 60% de completion desde paso 4 al 9.

### Flujo 2: Onboarding negocio

Objetivo: de "crear cuenta" a "ficha publicada" en < 15 minutos.

```
1. Registro
   → Email + contraseña
   → O login con Google
   → Sin formulario largo. Solo email + password.

2. Paso 1/5 — Tu negocio
   → Nombre del centro
   → Categoría (peluquería, estética, uñas, masajes, etc.)
   → Ciudad

3. Paso 2/5 — Servicios
   → Añadir 1-3 servicios para empezar
   → Nombre + duración + precio (minimalista)
   → "Añadir más tarde" disponible

4. Paso 3/5 — Horarios
   → Selector visual de días de apertura
   → Hora de apertura y cierre por día
   → Simple, sin excepciones en onboarding

5. Paso 4/5 — Tu equipo
   → Añadir 1 profesional (puede ser el propio dueño)
   → Nombre + foto opcional

6. Paso 5/5 — Publicar
   → Preview de la ficha
   → "Publicar y empezar a recibir reservas"
   → CTA de suscripción si no ha pagado

7. Dashboard post-onboarding
   → Enlace de reserva listo para compartir
   → Bienvenida con próximos pasos
   → Guía de primeros 7 días
```

**Métricas a medir**: Completion rate del wizard. Objetivo > 70%.

## Heurísticas de CRO por pantalla

### Home
- Buscador como elemento principal, por encima del fold en móvil.
- Prueba social visible: "X negocios confían en nosotros" o "X reservas este mes".
- Propuesta de valor en < 10 palabras.
- Eliminar cualquier elemento que no sea buscador + propuesta + prueba social.

### Ficha del centro
- CTA "Reservar" sticky en móvil (bottom bar).
- Fotos reales del centro: factor #1 de conversión.
- Precio visible antes de entrar al flujo de reserva.
- Reseñas visibles sin hacer scroll.
- Política de cancelación clara: "Cancelación gratuita hasta 24h antes".

### Flujo de reserva
- Barra de progreso visible en todo momento.
- No pedir datos innecesarios (sin dirección, sin fecha de nacimiento).
- Mostrar precio en cada paso.
- Botón "Atrás" siempre accesible.
- Error messages claros y accionables.

### Emails
- Subject line < 50 caracteres.
- CTA principal en la primera pantalla visible.
- Enlace de cancelación siempre visible (reduce ansiedad del usuario).
- Preheader: el texto que aparece en la bandeja de entrada.

## Componentes UI críticos

### BookingButton (CTA principal)
- Color: contraste alto, probablemente naranja/coral o verde.
- Texto: "Reservar cita", no "Submit" ni "Enviar".
- Tamaño mínimo en móvil: 44px altura.
- Estado loading visible al hacer clic.

### TimeSlotPicker
- Slots en grid de 2-3 columnas en móvil.
- Slots agotados visibles pero no seleccionables (color gris, texto "Ocupado").
- Fecha actual preseleccionada.
- Navegación de días con swipe en móvil.

### ServiceCard
- Foto o icono de la categoría.
- Nombre del servicio prominente.
- Duración + precio en la misma línea.
- Breve descripción opcional (2 líneas máx).
- CTA "Reservar este servicio" inline.

## Accesibilidad básica (WCAG 2.1 AA)

- Contraste de texto mínimo 4.5:1.
- Tamaño de fuente mínimo 16px para texto de cuerpo.
- Labels en todos los campos de formulario (no solo placeholder).
- Focus visible en todos los elementos interactivos.
- Imágenes con alt text descriptivo.
- Skip link para lectores de pantalla.

## Diseño visual

### Identidad base

- **Tono**: cercano, profesional, moderno. No frío ni clínico.
- **Colores**: a definir (propuesta: tonos cálidos — crema, rosa palo, verde salvia — evitar el azul genérico de SaaS).
- **Tipografía**: sans-serif limpia. Inter o Geist (ya incluido en Next.js).
- **Iconografía**: línea, no relleno. Consistente.
- **Imágenes**: fotos reales de centros, no stock genérico.

### Responsive
- Diseño mobile-first siempre.
- Breakpoints: 375px (móvil), 768px (tablet), 1280px (desktop).
- Dashboard negocio puede ser desktop-first (herramienta de trabajo).
- Frontend público siempre mobile-first.

## Riesgos UX/CRO

1. **Wizard de onboarding muy largo**: Si el negocio tarda > 15 min en publicar, abandona. Simplificar al máximo.
2. **Flujo de reserva con fricción**: Pedir registro obligatorio antes de reservar = -40% conversión. Guest checkout primero.
3. **Fotos de baja calidad**: Si los centros no suben fotos buenas, las cards se ven mal y no convierten. Considerar foto por defecto con categoría.
4. **Precios ocultos**: Si el precio no es visible antes de confirmar, hay abandono. Precio siempre visible.
