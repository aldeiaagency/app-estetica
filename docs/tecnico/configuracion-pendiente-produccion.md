# Configuracion pendiente de produccion

Ultima actualizacion: 2026-06-16

Este documento recoge configuraciones externas que no deben quedar hardcodeadas en la app y que hay que revisar antes de dar por listo un despliegue real.

## Recordatorios automaticos de reservas

Estado del codigo:

- Ruta creada: `GET /api/cron/reminders`
- Programacion creada en `vercel.json`: todos los dias a las 08:00 UTC
- Funcion: busca reservas confirmadas del dia siguiente, envia email de recordatorio y marca `reminderSentAt`

Configuracion pendiente en Vercel:

| Variable | Obligatoria | Uso |
|---|---:|---|
| `CRON_SECRET` | Si | Protege `/api/cron/reminders` para que no pueda ejecutarlo cualquiera |
| `RESEND_API_KEY` | Si | Permite enviar emails transaccionales |
| `EMAIL_FROM` | Si | Remitente validado en Resend, por ejemplo `Belleza Local <noreply@bellezalocal.es>` |
| `NEXT_PUBLIC_APP_URL` | Si | URL publica usada en enlaces de emails y confirmaciones |

Comprobacion manual recomendada:

1. Configurar las variables anteriores en Vercel.
2. Crear una reserva confirmada para manana.
3. Ejecutar manualmente `GET /api/cron/reminders` con cabecera `Authorization: Bearer <CRON_SECRET>`.
4. Confirmar que llega el email y que la reserva queda con `reminderSentAt`.

## Lista de espera

Estado del codigo:

- El cliente puede apuntarse a lista de espera cuando no hay huecos disponibles.
- El dashboard tiene vista `Lista de espera` dentro de Reservas.
- El negocio puede avisar, marcar como reservada o cerrar una solicitud.
- Al cancelar una cita se intenta avisar automaticamente a las primeras solicitudes compatibles.

Configuracion pendiente:

- Confirmar que `RESEND_API_KEY`, `EMAIL_FROM` y `NEXT_PUBLIC_APP_URL` estan configuradas.
- Revisar copy y branding de los emails cuando se cierre el branding definitivo.
- Decidir si el aviso debe enviarse solo por email o tambien por WhatsApp/SMS en planes superiores.

## Entregabilidad antes de merge a produccion

- Revisar variables de entorno en Vercel.
- Probar flujo completo: reserva, cancelacion, lista de espera, aviso y recordatorio.
- Verificar dominio remitente en Resend.
- Confirmar que el cron aparece activo en Vercel despues del despliegue.

## Imagenes y galeria

Estado del codigo:

- El dashboard permite guardar URL de portada y galeria del centro.
- El dashboard permite guardar URL de foto de profesionales.
- El dashboard permite guardar URL de imagen de producto.
- El perfil publico, marketplace y flujo de reserva usan esas imagenes cuando existen.

Configuracion pendiente:

- Decidir storage real para subida de archivos: Supabase Storage o Cloudflare R2.
- Definir limites de peso, formato y dimensiones.
- Anadir compresion/conversion a WebP antes de guardar.
- Migrar los inputs de URL a subida directa cuando el storage este decidido.
