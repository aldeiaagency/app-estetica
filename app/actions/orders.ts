'use server'

import { prisma } from '@/lib/db/client'
import { z } from 'zod'
import { isStripeConfigured } from '@/lib/billing/stripe'
import { createOrderCheckoutSession } from '@/lib/billing/checkout'

const orderItemSchema = z.object({
  productId: z.string().cuid(),
  quantity: z.number().int().min(1).max(99),
})

const createOrderSchema = z.object({
  centerId: z.string().cuid(),
  customerName: z.string().trim().min(2).max(100),
  customerEmail: z.string().trim().email().transform(value => value.toLowerCase()),
  customerPhone: z.string().trim().max(30).optional(),
  items: z.array(orderItemSchema).min(1).max(50),
  consentGiven: z.boolean().refine(v => v === true, 'Debes aceptar la política de privacidad'),
})

export type CreateOrderInput = z.infer<typeof createOrderSchema>

type ReservedLine = {
  productId: string
  name: string
  priceCents: number
  quantity: number
  tracksStock: boolean
}

async function releaseReservedStock(orderId: string, lines: ReservedLine[]) {
  await prisma.$transaction(async tx => {
    const changed = await tx.order.updateMany({
      where: { id: orderId, status: 'PENDING' },
      data: { status: 'CANCELLED' },
    })
    if (changed.count !== 1) return

    for (const line of lines) {
      if (!line.tracksStock) continue
      await tx.product.update({
        where: { id: line.productId },
        data: { stock: { increment: line.quantity } },
      })
    }
  })
}

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
    select: { id: true, name: true },
  })
  if (!center) return { success: false, error: 'Centro no encontrado' }

  const quantityByProduct = new Map<string, number>()
  for (const item of items) {
    quantityByProduct.set(item.productId, (quantityByProduct.get(item.productId) ?? 0) + item.quantity)
  }
  const productIds = [...quantityByProduct.keys()]

  try {
    const result = await prisma.$transaction(async tx => {
      const products = await tx.product.findMany({
        where: { id: { in: productIds }, centerId, active: true },
        select: { id: true, priceCents: true, stock: true, name: true },
      })
      if (products.length !== productIds.length) throw new Error('PRODUCT_UNAVAILABLE')

      const lines: ReservedLine[] = products.map(product => ({
        productId: product.id,
        name: product.name,
        priceCents: product.priceCents,
        quantity: quantityByProduct.get(product.id)!,
        tracksStock: product.stock !== null,
      }))

      // Conditional updates make the stock check and decrement one atomic DB
      // operation. Two concurrent carts cannot both consume the last unit.
      for (const line of lines) {
        if (!line.tracksStock) continue
        const reserved = await tx.product.updateMany({
          where: { id: line.productId, centerId, active: true, stock: { gte: line.quantity } },
          data: { stock: { decrement: line.quantity } },
        })
        if (reserved.count !== 1) throw new Error(`OUT_OF_STOCK:${line.name}`)
      }

      const totalCents = lines.reduce((sum, line) => sum + line.priceCents * line.quantity, 0)
      const order = await tx.order.create({
        data: {
          centerId,
          customerName,
          customerEmail,
          customerPhone: customerPhone || null,
          totalCents,
          status: 'PENDING',
          items: {
            create: lines.map(line => ({
              productId: line.productId,
              name: line.name,
              priceCents: line.priceCents,
              quantity: line.quantity,
            })),
          },
        },
      })

      return { order, lines }
    })

    if (!isStripeConfigured()) return { success: true, orderId: result.order.id }

    try {
      const checkoutUrl = await createOrderCheckoutSession({
        orderId: result.order.id,
        items: result.lines.map(line => ({
          name: line.name,
          priceCents: line.priceCents,
          quantity: line.quantity,
        })),
        customerEmail,
        centerName: center.name,
      })
      return { success: true, orderId: result.order.id, checkoutUrl }
    } catch (error) {
      console.error('[order] Stripe checkout session failed:', error)
      await releaseReservedStock(result.order.id, result.lines)
      return { success: false, error: 'No se pudo iniciar el pago. No se ha descontado stock.' }
    }
  } catch (error) {
    if (error instanceof Error && error.message === 'PRODUCT_UNAVAILABLE') {
      return { success: false, error: 'Uno o más productos no están disponibles' }
    }
    if (error instanceof Error && error.message.startsWith('OUT_OF_STOCK:')) {
      return { success: false, error: `Stock insuficiente para "${error.message.slice(13)}"` }
    }
    console.error('[order] Error creating order:', error)
    return { success: false, error: 'Error al procesar el pedido. Inténtalo de nuevo.' }
  }
}
