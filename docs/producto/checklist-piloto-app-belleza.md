# Checklist piloto - App Belleza Definitiva

Fecha: 2026-06-20

Objetivo: probar la app con usuarias y negocios reales de forma controlada, sin recoger datos sensibles y con capacidad de medir conversion, utilidad y riesgos.

## Preparacion

- [x] Elegir ciudad/categoria prioritaria para piloto.
- [ ] Seleccionar 3-5 negocios con servicios, precios y disponibilidad reales.
- [ ] Confirmar textos legales finales con asesor legal.
- [x] Aplicar migraciones en base de datos.
- [x] Ejecutar `prisma generate` en entorno permitido.
- [x] Ejecutar build completa en entorno permitido.
- [x] Preparar seed interno de piloto no publicado por defecto.
- [x] Preparar plantilla de datos para negocios reales.
- [ ] Revisar responsive en movil pequeno, movil grande, tablet y desktop.
- [ ] Activar metricas basicas de evento sin datos sensibles.

Nota tecnica 2026-06-20:

- Base Supabase verificada con 9/9 migraciones registradas y sin rollbacks.
- Tablas nuevas de Beauty Profile, plan, wallet, packs, seguimientos, rutina y reposicion presentes.
- `npm run type-check`, `npm run test` y `npm run build` completados correctamente.
- Piloto definido en Madrid, con foco en estetica facial suave, unas/manicura recurrente y peluqueria de mantenimiento.
- Seed interno disponible en `prisma/seed-pilot-belleza.mjs`; no publica centros ficticios salvo ejecucion con `--publish`.

## QA B2C

- [ ] Registro de usuaria con aceptacion de terminos y privacidad.
- [ ] Creacion de Beauty Profile con consentimiento explicito.
- [ ] Beauty Plan generado con recomendacion positiva y elemento de evitar.
- [ ] Wallet muestra beneficios, bonos y plan.
- [ ] Guardar producto en rutina.
- [ ] Activar, pausar y terminar reposicion.
- [ ] Buscar centros con filtros de recomendado, precio claro, seguimiento, beneficios y packs.
- [ ] Reservar cita desde ficha de centro.
- [ ] Descargar datos desde `/cuenta`.
- [ ] Retirar marketing desde `/cuenta`.
- [ ] Borrar personalizacion desde `/cuenta` y comprobar que plan/rutina/reposicion quedan limpios.

## QA B2B

- [ ] Registro de negocio y creacion de centro.
- [ ] Alta de servicios con precios claros.
- [ ] Publicacion de beneficios.
- [ ] Creacion de packs por objetivo.
- [ ] Plantillas de seguimiento postservicio.
- [ ] Campanas solo a clientas con marketing consent.
- [ ] Panel de recurrencia muestra oportunidades sin enviar promociones sin consentimiento.
- [ ] Planes visibles Presencia, Growth, Elite y Partner coinciden con billing.

## SEO/GEO

- [ ] Fichas de centro indexables solo con servicios activos.
- [ ] Landings ciudad/categoria existen solo si hay centros publicados.
- [ ] FAQ visible coincide con FAQPage JSON-LD.
- [ ] No hay paginas vacias generadas por filtros.
- [ ] No quedan claims tipo "los mejores" sin soporte.

## Metricas piloto

- [ ] Conversion visita home -> Beauty Profile.
- [ ] Finalizacion Beauty Profile.
- [ ] Vuelta a `/mi-plan`.
- [ ] Click en recomendacion.
- [ ] Reserva desde Beauty Plan o marketplace.
- [ ] Beneficios reclamados.
- [ ] Productos guardados en rutina.
- [ ] Packs creados por negocio.
- [ ] Seguimientos generados.
- [ ] Opt-in y retirada de marketing.

## Go / No-Go

Go si:

- [ ] No se detectan datos medicos o sensibles en el flujo.
- [x] Type-check y tests pasan.
- [x] Build completa pasa en entorno permitido.
- [ ] Los negocios entienden packs, beneficios y seguimiento.
- [ ] Usuarias entienden por que se recomienda o se evita algo.

No-Go si:

- [ ] Hay textos con promesas de resultado o apariencia medica.
- [ ] El borrado/exportacion de datos falla.
- [ ] El marketplace muestra paginas vacias o resultados sin explicacion.
- [ ] Las campanas pueden enviarse sin consentimiento.
- [ ] La reserva o checkout se rompe en movil.
