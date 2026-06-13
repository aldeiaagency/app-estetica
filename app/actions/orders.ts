'use server'

import { prisma } from '@/lib/db/client'
import { z } from 'zod'
import { isStripeConfigured } from '@/lib/billing/stripe'
import { createOrderCheckoutSession } from '@/lib/billing/checkout'

// El cliente solo envía qué producto y cuánta cantidad.
// El nombre y el precio SIEMPRE se toman de la base de datos (nunca del cliente)
// para evitar manipulación de precios en el checkout.
const orderItemSchema = z.object({
  productId:  z.string().cuid(),
  quantity:   z.number().int().min(1).max(99),
})

const createOrderSchema = z.object({
  centerId:      z.string().cuid(),
  customerName:  z.string().min(2).max(100),
  customerEmail: z.string().email(),
  customerPhone: z.string().optional(),
  items:         z.array(orderItemSchema).min(1).max(50),
  consentGiven:  z.boolean().refine(v => v === true, 'Debes aceptar la política de privacidad'),
})

export type CreateOrderInput = z.infer<typeof createOrderSchema>

export async function createOrderAction(input: unknown): Promise<
  { success: true; orderId: string; checkoutUrl?: string } | { success: false; error: string }
> {
  const parsed = createOrderSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? 'Datos inválidos' }
  }

  const { centerId, customerName, customerEmail, customerPhone, items } = parsed.data

  const center = await prisma.center.findFirst({
    where: { id: centerId, published: true },
    select: { id: true },
  })
  if (!center) {
    return { success: false, error: 'Centro no encontrado' }
  }

  // Verify all products belong to center, are active, and have enough stock.
  // Deduplicate productIds in case the cart sends the same product twice.
  const quantityByProduct = new Map<string, number>()
  for (const item of items) {
    quantityByProduct.set(item.productId, (quantityByProduct.get(item.productId) ?? 0) + item.quantity)
  }
  const productIds = [...quantityByProduct.keys()]

  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, centerId, active: true },
    select: { id: true, priceCents: true, stock: true, name: true },
  })

  if (products.length !== productIds.length) {
    return { success: false, error: 'Uno o más productos no están disponibles' }
  }

  for (const product of products) {
    const qty = quantityByProduct.get(product.id)!
    if (product.stock !== null && product.stock !== undefined && product.stock < qty) {
      return { success: false, error: `Stock insuficiente para "${product.name}"` }
    }
  }

  // El total y el precio por línea se calculan EXCLUSIVAMENTE con los precios de la BD.
  const lineItems = products.map(p => ({
    productId:  p.id,
    name:       p.name,
    priceCents: p.priceCents,
    quantity:   quantityByProduct.get(p.id)!,
  }))
  const totalCents = lineItems.reduce((s, i) => s + i.priceCents * i.quantity, 0)

  try {
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          centerId,
          customerName,
          customerEmail,
          customerPhone: customerPhone ?? null,
          totalCents,
          status: 'PENDING',
          items: {
            create: lineItems.map(i => ({
              productId:  i.productId,
              name:       i.name,
              priceCents: i.priceCents,
              quantity:   i.quantity,
            })),
          },
        },
      })

      // Decrement stock for products that track it
      for (const product of products) {
        if (product.stock !== null && product.stock !== undefined) {
          await tx.product.update({
            where: { id: product.id },
            data: { stock: { decrement: quantityByProduct.get(product.id)! } },
          })
        }
      }

      return newOrder
    })

    // Si Stripe está configurado, generamos sesión de pago online.
    // Si no, el pedido queda PENDING y se cobra en el centro (click & collect).
    if (isStripeConfigured()) {
      try {
        const checkoutUrl = await createOrderCheckoutSession({
          orderId: order.id,
          items: lineItems.map(i => ({ name: i.name, priceCents: i.priceCents, quantity: i.quantity })),
          customerEmail,
          centerName: '',
        })
        return { success: true, orderId: order.id, checkoutUrl }
      } catch (err) {
        // El pedido ya está creado; si falla Stripe, degradamos a pago en centro.
        console.error('[order] Stripe checkout session failed, falling back to in-store payment:', err)
        return { success: true, orderId: order.id }
      }
    }

    return { success: true, orderId: order.id }
  } catch (err) {
    console.error('[order] Error creating order:', err)
    return { success: false, error: 'Error al procesar el pedido. Inténtalo de nuevo.' }
  }
}
