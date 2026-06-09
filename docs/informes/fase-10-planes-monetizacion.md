# Informe Fase 10 — Planes y Monetizacion (Stripe)

**Fecha:** 2026-06-10
**Estado:** Completada

---

## 1. Objetivo de la fase

Integrar Stripe para monetizar los planes de suscripcion: checkout de nuevos planes, billing portal para gestion existente, webhook para provisioning automatico, y pagina publica de precios.

## 2. Acciones planificadas

1. `lib/billing/stripe.ts` - singleton del cliente Stripe
2. `lib/billing/price-map.ts` - mapeo price IDs Plan enum
3. `app/actions/billing.ts` - server actions de checkout y billing portal
4. `app/api/webhooks/stripe/route.ts` - webhook handler
5. `app/precios/page.tsx` - pagina publica de pricing
6. `app/(dashboard)/dashboard/plan/page.tsx` - reescritura completa del panel de plan

## 3. Acciones ejecutadas

Todas las planificadas. Sin migraciones de BD necesarias (schema ya tenia stripeCustomerId, stripeSubscriptionId, planExpiresAt).

## 4. Archivos creados

| Archivo | Descripcion |
|---|---|
| `lib/billing/stripe.ts` | Singleton Stripe con apiVersion 2025-02-24.acacia |
| `lib/billing/price-map.ts` | Construye mapas bidireccionales PRICE_ID_TO_PLAN y PLAN_TO_PRICE_ID desde env vars |
| `app/actions/billing.ts` | createCheckoutSessionAction y createBillingPortalSessionAction |
| `app/api/webhooks/stripe/route.ts` | Handles checkout.session.completed, customer.subscription.updated, customer.subscription.deleted |
| `app/precios/page.tsx` | Pagina publica indexable con 4 planes, tabla comparativa, CTA signup |

## 5. Archivos modificados

| Archivo | Cambio |
|---|---|
| `app/(dashboard)/dashboard/plan/page.tsx` | Reescritura: plan actual con Checkout + Billing Portal, features actuales, comparativa de planes |

## 6. Decisiones tomadas

| Decision | Razon |
|---|---|
| metadata.organizationId en session Y subscription_data | El webhook lo lee de la session en checkout.completed; la subscription lo guarda para updated/deleted |
| Find-or-create Stripe Customer | Evita duplicados, se guarda el ID al crearlo |
| Billing Portal para gestion post-pago | Stripe gestiona upgrade/downgrade/cancelacion sin codigo adicional |
| Precio anual no incluido | MVP: simplifica flujo. Fase futura. |

## 7. Setup requerido en produccion

1. Crear 4 productos en Stripe Dashboard y copiar Price IDs a env:
   - STRIPE_PRICE_BASIC_MONTHLY, STRIPE_PRICE_PRO_MONTHLY, STRIPE_PRICE_GROWTH_MONTHLY, STRIPE_PRICE_PREMIUM_MONTHLY
2. Configurar webhook en Stripe: https://app.bellezalocal.es/api/webhooks/stripe
   - Eventos: checkout.session.completed, customer.subscription.updated, customer.subscription.deleted
3. Copiar STRIPE_WEBHOOK_SECRET al env de Vercel

## 8. Errores encontrados y corregidos

| Error | Fix |
|---|---|
| apiVersion '2025-04-30.basil' invalida para Stripe SDK v17 | Cambiado a '2025-02-24.acacia' |
| session.subscription_data no existe en Stripe.Checkout.Session | Sustituido por session.metadata?.organizationId |
| Tipo string inferido en lugar de Plan en el webhook | Tipo explicito Plan con priceId ternario |

## 9. Verificaciones ejecutadas

- npx tsc --noEmit
- npx next lint --quiet

## 10. Resultado de verificaciones

- TypeScript: 0 errores
- ESLint: 0 warnings ni errores

## 11. Que queda pendiente

- Enforcement de limites del plan al crear centros/servicios (Fase 11)
- Billing anual (Fase futura)
- Email de confirmacion de pago via Resend (Fase 14)
- Trial de 14 dias (requiere trial_period_days en Stripe)

## 12. Recomendacion de siguiente fase

Fase 11 - IA premium: recomendaciones, autocompletado de descripciones, sugerencias SEO automaticas con IA.

## 13. Estado final

Completada - flujo de pago funcional end-to-end (pendiente credenciales Stripe en .env)
