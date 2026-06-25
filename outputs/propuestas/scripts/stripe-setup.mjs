/**
 * Setup turnkey de Stripe para Belleza Local.
 *
 * Crea los 4 productos + precios mensuales y, opcionalmente, el webhook.
 * Despues imprime las variables listas para pegar en Vercel.
 *
 * Uso en modo test:
 *   STRIPE_SECRET_KEY="sk_test_..." node outputs/propuestas/scripts/stripe-setup.mjs
 *
 * Con webhook:
 *   STRIPE_SECRET_KEY="sk_test_..." APP_URL="https://app-estetica-one.vercel.app" \
 *     node outputs/propuestas/scripts/stripe-setup.mjs --webhook
 *
 * Idempotente por nombre de producto: si ya existe, reutiliza.
 */
import Stripe from 'stripe'

const key = process.env.STRIPE_SECRET_KEY
if (!key) {
  console.error('Falta STRIPE_SECRET_KEY')
  process.exit(1)
}

const stripe = new Stripe(key)
const withWebhook = process.argv.includes('--webhook')
const appUrl = process.env.APP_URL ?? 'https://app-estetica-one.vercel.app'

const plans = [
  { name: 'Belleza Local - Presencia', env: 'STRIPE_PRICE_BASIC_MONTHLY', amount: 2400 },
  { name: 'Belleza Local - Growth', env: 'STRIPE_PRICE_PRO_MONTHLY', amount: 5900 },
  { name: 'Belleza Local - Elite', env: 'STRIPE_PRICE_GROWTH_MONTHLY', amount: 14900 },
  { name: 'Belleza Local - Partner', env: 'STRIPE_PRICE_PREMIUM_MONTHLY', amount: 39900 },
]

async function findOrCreateProduct(name) {
  const search = await stripe.products.search({ query: `name:'${name}'` }).catch(() => ({ data: [] }))
  if (search.data?.length) return search.data[0]
  return stripe.products.create({ name })
}

async function findOrCreatePrice(productId, amount) {
  const prices = await stripe.prices.list({ product: productId, active: true, limit: 100 })
  const match = prices.data.find((price) => (
    price.unit_amount === amount
    && price.currency === 'eur'
    && price.recurring?.interval === 'month'
  ))

  if (match) return match

  return stripe.prices.create({
    product: productId,
    unit_amount: amount,
    currency: 'eur',
    recurring: { interval: 'month' },
  })
}

const out = []

for (const plan of plans) {
  const product = await findOrCreateProduct(plan.name)
  const price = await findOrCreatePrice(product.id, plan.amount)
  out.push(`${plan.env}="${price.id}"`)
  console.error(`OK ${plan.name} -> ${price.id}`)
}

if (withWebhook) {
  const url = `${appUrl}/api/webhooks/stripe`
  const existing = await stripe.webhookEndpoints.list({ limit: 100 })
  const duplicate = existing.data.find((webhook) => webhook.url === url)

  if (duplicate) {
    console.error(`Webhook ya existe en ${url} (id ${duplicate.id}). Su secret solo se ve al crear; recrealo si no lo tienes.`)
  } else {
    const webhook = await stripe.webhookEndpoints.create({
      url,
      enabled_events: [
        'checkout.session.completed',
        'customer.subscription.updated',
        'customer.subscription.deleted',
      ],
    })

    out.push(`STRIPE_WEBHOOK_SECRET="${webhook.secret}"`)
    console.error(`Webhook creado en ${url}`)
  }
}

console.error('\n--- Pega estas variables en Vercel (Production + Preview) ---')
out.push(`STRIPE_SECRET_KEY="${key}"`)
console.log(out.join('\n'))
