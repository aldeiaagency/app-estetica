# 03 · Workflows n8n necesarios

## Principio rector

**La app NO necesita n8n para funcionar.** Sus automatizaciones core (recordatorios, liberación de señales, follow-ups) están resueltas con **Vercel Cron + endpoints internos** (`/api/cron/*`). n8n aporta valor en la capa **comercial y de resiliencia**, no en el core transaccional.

> Decisión: mantener los crons críticos en Vercel (transaccionales, cerca de la BD). Usar n8n para leads B2B, fallback/monitorización y onboarding. Así no se acopla la operación crítica a un servicio externo.

Infra n8n disponible (memoria): `aldeia-n8n.giuxk6.easypanel.host` (EasyPanel + VPS). Endpoint MCP: `/mcp-server/http`.

---

## Workflows recomendados (por prioridad)

### 1. 🟢 P1 — Lead B2B desde formulario `/para-negocios`
Hoy es un `mailto:`. Sustituir por: form → webhook n8n.

- **Trigger:** Webhook `POST /webhook/lead-b2b` (lo llama la server action del form).
- **Pasos:**
  1. Validar payload (nombre, negocio, email, teléfono, ciudad, plan de interés).
  2. Guardar lead (Airtable/Google Sheet/Notion como CRM ligero, o tabla `Lead` en Supabase).
  3. Email interno a comercial (`hola@bellezalocal.es`) con los datos.
  4. Email de confirmación al negocio ("te contactamos en 24h").
  5. (Opcional) Mensaje a Slack/Telegram interno.
- **Plantilla:** `outputs/propuestas/n8n/lead-b2b.workflow.json` (esqueleto).

### 2. 🟠 P2 — Fallback/monitor de crons
Por si Vercel Cron (plan Hobby: 1×/día, ±59 min) no basta o falla.

- **Trigger:** Schedule n8n (p.ej. cada hora).
- **Pasos:** `GET` a `/api/cron/reminders`, `/api/cron/booking-holds`, `/api/cron/follow-ups` con header `Authorization: Bearer {{CRON_SECRET}}` → si respuesta ≠ 200, alertar.
- **Valor:** desbloquea cadencia >1×/día sin pagar Vercel Pro, y vigila que los crons respondan.

### 3. 🟠 P2 — Alerta de fallos (crons/webhooks)
- **Trigger:** Webhook que la app llama en errores críticos (o lectura de logs).
- **Pasos:** agregación + notificación (email/Slack/Telegram) cuando un cron o el webhook de Stripe falle N veces.

### 4. 🟢 P2 — Onboarding de negocio aprobado
- **Trigger:** Webhook desde la acción de admin al aprobar un centro (`published=true`).
- **Pasos:** email de bienvenida + checklist de configuración, crear tarea interna de seguimiento, (opcional) crear plantillas/recursos iniciales.

### 5. 🔵 P3 — Sincronización de reseñas / reputación
- Recoger reseñas externas (Google/IG) y proponerlas para moderación en el panel.

---

## Lo que NO debe ir a n8n
- Cobro de señales / checkout / webhook de Stripe → **transaccional, en la app**.
- Generación del Beauty Plan → lógica de producto, en la app.
- Envío de follow-ups core → **ya en `/api/cron/follow-ups`** (Vercel Cron).

---

## Requisitos para activar n8n
- [ ] Autorizar la conexión n8n (OAuth) — pendiente según auditoría previa.
- [ ] Definir el CRM destino de leads (Airtable/Sheet/Supabase `Lead`).
- [ ] Compartir `CRON_SECRET` con n8n (como credential, no en claro).
- [ ] Crear los webhooks y pegar sus URLs en las server actions correspondientes.

## Integración app → n8n (contrato)
| Evento app | Cómo | Workflow |
|---|---|---|
| Envío form B2B | server action `POST` al webhook n8n | 1 |
| Aprobación de centro | `admin.ts` `POST` al webhook | 4 |
| Error crítico | helper `notifyOps()` `POST` al webhook | 3 |

Se incluye esqueleto JSON en `outputs/propuestas/n8n/`.
