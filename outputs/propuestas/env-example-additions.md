# Propuesta: actualizar `.env.example`

`.env.example` documenta los nombres antiguos de precios Stripe, pero el código (`lib/billing/price-map.ts`) ya soporta **aliases nuevos** alineados con el rebranding de planes. Añadir (manteniendo los antiguos por compatibilidad):

```dotenv
# --- Stripe price IDs (nombres nuevos / rebranding) ---
# Presencia (técnico BASIC) · Growth B2B (técnico PRO) · Elite (técnico GROWTH) · Partner (técnico PREMIUM)
STRIPE_PRICE_PRESENCIA_MONTHLY=
STRIPE_PRICE_B2B_GROWTH_MONTHLY=
STRIPE_PRICE_ELITE_MONTHLY=
STRIPE_PRICE_PARTNER_MONTHLY=

# --- Observabilidad (opcional, recomendado) ---
SENTRY_DSN=
NEXT_PUBLIC_SENTRY_DSN=
# NEXT_PUBLIC_POSTHOG_KEY / NEXT_PUBLIC_POSTHOG_HOST ya existen en .env.example
```

Notas:
- Mapeo técnico→público (confirmado en `lib/billing/plans.ts`): `BASIC→Presencia`, `PRO→Growth`, `GROWTH→Elite`, `PREMIUM→Partner`.
- Basta configurar **un set** de los 4 (antiguos o nuevos); `price-map.ts` resuelve ambos.
- Quitar `NODE_ENV` de `.env.example`/`.env.local` reales (no debe forzarse; rompe builds locales — ya corregido en `.env.local`).
