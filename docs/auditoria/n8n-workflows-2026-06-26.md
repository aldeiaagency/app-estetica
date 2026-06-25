# Workflows n8n Belleza Local - 2026-06-26

## Veredicto

Se han creado los workflows necesarios para conectar Belleza Local con n8n sin meter secretos en el repositorio.

Los webhooks principales estan activos y probados con payloads de auditoria. El monitor programado de crons queda creado pero inactivo hasta configurar `BELLEZA_LOCAL_CRON_SECRET` dentro de n8n.

## Instancia

- URL: `https://aldeia-n8n.giuxk6.easypanel.host`
- API publica: operativa con `X-N8N-API-KEY`

## Workflows creados

| Workflow | ID | Estado | Uso |
|---|---|---:|---|
| `Belleza Local | Lead B2B - Captura y aviso` | `yxLiPsTQw2beRe1J` | Activo | Recibe leads B2B desde la app |
| `Belleza Local | Monitor crons` | `2ROWkudLQH2tFkxZ` | Inactivo | Comprueba crons de Vercel con `CRON_SECRET` |
| `Belleza Local | Alertas operativas` | `3v4cDfmIdUHpMgJE` | Activo | Recibe alertas tecnicas desde la app |
| `Belleza Local | Onboarding negocio` | `CBpPQgOzPFK745fz` | Activo | Inicia seguimiento cuando un negocio se aprueba |

## Webhooks activos

- Lead B2B: `https://aldeia-n8n.giuxk6.easypanel.host/webhook/belleza-local-lead-b2b`
- Alertas operativas: `https://aldeia-n8n.giuxk6.easypanel.host/webhook/belleza-local-ops-alert`
- Onboarding negocio: `https://aldeia-n8n.giuxk6.easypanel.host/webhook/belleza-local-business-onboarding`

## Pruebas realizadas

- Lead B2B: `202 Accepted`.
- Alertas operativas: `202 Accepted`.
- Onboarding negocio: `202 Accepted`.

Las pruebas usaron datos ficticios de auditoria y no guardaron credenciales en el repositorio.

## Integracion app

La accion del formulario B2B guarda primero el lead en Supabase. Despues, si existe `N8N_WEBHOOK_LEAD_B2B_URL`, envia una copia del lead a n8n.

Si n8n falla o tarda demasiado, el formulario no se rompe.

Variable configurada en Vercel Production:

```dotenv
N8N_WEBHOOK_LEAD_B2B_URL=https://aldeia-n8n.giuxk6.easypanel.host/webhook/belleza-local-lead-b2b
```

Variables preparadas para futuras conexiones:

```dotenv
N8N_WEBHOOK_OPS_ALERT_URL=https://aldeia-n8n.giuxk6.easypanel.host/webhook/belleza-local-ops-alert
N8N_WEBHOOK_BUSINESS_ONBOARDING_URL=https://aldeia-n8n.giuxk6.easypanel.host/webhook/belleza-local-business-onboarding
```

Estas tres variables estan configuradas en Production. Preview puede configurarse despues por rama si se necesita probar flujos antes de produccion.

## Pendiente dentro de n8n

- Configurar canal comercial real: email, Slack, Telegram, CRM o Google Sheet.
- Activar los nodos de aviso que quedaron desactivados por seguridad.
- Configurar `BELLEZA_LOCAL_APP_URL` y `BELLEZA_LOCAL_CRON_SECRET`.
- Activar `Belleza Local | Monitor crons` cuando el secret exista.
- Rotar la API key compartida para esta configuracion.

## Seguridad

No se debe guardar la API key de n8n en Git. Para uso futuro, debe guardarse en un gestor de secretos o regenerarse cuando haga falta.
