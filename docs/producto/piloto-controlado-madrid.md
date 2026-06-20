# Piloto controlado - Madrid

Fecha: 2026-06-20

## Decision de piloto

Ciudad inicial: Madrid.

Categoria principal: belleza recurrente no medica.

Subcategorias prioritarias:

- Estetica facial suave y asesoramiento de rutina.
- Unas/manicura recurrente.
- Peluqueria de mantenimiento, color y brillo.

Motivo: estas categorias permiten validar recurrencia, packs, beneficios, seguimiento postservicio, productos guardados en rutina y reposicion sin entrar en terreno medico ni prometer resultados.

## Objetivo del piloto

Validar si la app ayuda a una compradora a decidir mejor y a un negocio a generar recurrencia sin comunicacion invasiva.

Hipotesis a validar:

- Una usuaria entiende el valor de completar Beauty Profile antes de buscar.
- El Beauty Plan reduce indecision porque explica que hacer y que evitar.
- Wallet, packs y beneficios aumentan intencion de reserva o recompra.
- Rutina y reposicion ayudan a recordar productos sin empujar compras innecesarias.
- El negocio entiende seguimientos, campanas con consentimiento y oportunidades de vuelta.

## Alcance

Duracion recomendada: 2 semanas.

Negocios: 3-5 centros.

Usuarias: 15-25 compradoras.

Ciudad/cobertura: Madrid, con foco en barrios donde los negocios puedan atender de forma real.

No entra en piloto:

- Tratamientos medicos o medico-esteticos.
- WhatsApp/SMS automaticos.
- Promesas de resultado.
- Campanas a clientas sin consentimiento de marketing.
- Datos de salud.

## Negocios objetivo

Perfil de negocio recomendado:

- Tiene precios o rangos claros.
- Puede aceptar reservas reales.
- Tiene al menos 3 servicios activos.
- Puede crear 1 pack por objetivo.
- Puede publicar 1 beneficio sencillo.
- Acepta revisar seguimientos antes de enviarlos.
- Puede aportar 3-6 productos si vende producto o recomienda rutina.

Composicion sugerida:

- 1 centro de estetica facial.
- 1 centro de unas.
- 1 peluqueria/color.
- Opcional: 1 centro de cejas/pestanas.
- Opcional: 1 tienda o cabina con productos de rutina.

## Datos minimos por negocio

Usar la plantilla:

`docs/producto/plantilla-negocios-piloto.csv`

Campos obligatorios:

- Nombre comercial.
- Categoria.
- Direccion, ciudad y provincia.
- Email de contacto.
- Telefono o WhatsApp.
- 3 servicios con precio y duracion.
- Horario semanal.
- 1 beneficio.
- 1 pack por objetivo.
- Politica de cancelacion.

Campos recomendados:

- Fotos reales autorizadas.
- 1-2 profesionales.
- 2-4 productos con instrucciones de uso.
- Textos de "para quien es" y "para quien no es".
- Consentimiento de uso de imagen/textos para piloto.

## Seed interno

Se ha creado un seed separado para QA interna:

```bash
npm run seed:pilot
```

Por defecto crea datos ficticios no publicados.

Para hacerlos visibles en marketplace de forma controlada:

```bash
npm run seed:pilot -- --publish
```

Los centros ficticios llevan `seoNoindex=true` y nombres con prefijo `Piloto`. No deben usarse como negocios reales en comunicacion publica.

Credenciales internas creadas por el seed:

- Compradora: `piloto.compradora@bellezalocal.es`
- Negocio facial: `piloto.luzserena@bellezalocal.es`
- Negocio unas: `piloto.nailclub@bellezalocal.es`
- Negocio capilar: `piloto.rizovivo@bellezalocal.es`

Password para todas: `Demo2026!`

## QA de flujo B2C

- Completar registro con terminos aceptados.
- Completar Beauty Profile con consentimiento de personalizacion.
- Ver Beauty Plan con al menos una recomendacion positiva y una de evitar.
- Ver pack recomendado.
- Reclamar beneficio en wallet.
- Guardar producto en rutina.
- Activar reposicion.
- Descargar datos desde cuenta.
- Retirar marketing.
- Borrar personalizacion y comprobar que plan/rutina/reposicion desaparecen.

## QA de flujo B2B

- Entrar como negocio.
- Revisar servicios, staff y horario.
- Crear o editar un beneficio.
- Crear o editar un pack.
- Revisar plantillas de seguimiento.
- Confirmar que campanas solo aplican a clientas con marketing consent.
- Revisar oportunidades de recurrencia.

## Metricas a recoger

B2C:

- Visitas a home.
- Inicio de Beauty Profile.
- Finalizacion de Beauty Profile.
- Vuelta a `/mi-plan`.
- Click en recomendacion.
- Reserva iniciada desde plan o marketplace.
- Beneficio reclamado.
- Producto guardado en rutina.
- Reposicion activada.
- Retirada de marketing.

B2B:

- Packs creados.
- Beneficios activos.
- Seguimientos programados.
- Oportunidades de recurrencia vistas.
- Campanas descartadas por falta de consentimiento.
- Reservas repetidas.

## Go / No-Go

Go si:

- Las usuarias entienden por que se recomienda cada accion.
- Los negocios pueden cargar servicios, packs y beneficios sin ayuda constante.
- No aparecen datos medicos ni promesas de resultado.
- Las campanas respetan consentimiento.
- Reserva, wallet, rutina y reposicion funcionan en movil.

No-Go si:

- La usuaria percibe el Beauty Profile como diagnostico medico.
- El negocio no entiende diferencia entre beneficio, pack y campana.
- Hay paginas vacias o resultados falsamente inflados.
- El borrado/exportacion de datos falla.
- La app empuja compras sin explicar motivo.

## Pendiente humano

- Confirmar textos legales finales con asesor.
- Sustituir datos ficticios por negocios reales.
- Revisar fotos y permisos de uso.
- Activar metricas de evento.
- Hacer QA visual en dispositivos reales.
