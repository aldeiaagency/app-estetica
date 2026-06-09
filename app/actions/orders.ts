'use server'

import { prisma } from '@/lib/db/client'
import { z } from 'zod'

const orderItemSchema = z.object({
  productId:  z.string().cuid(),
  name:       z.string().min(1).max(200),
  priceCents: z.number().int().positive(),
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
  { success: true; orderId: string } | { success: false; error: string }
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

  // Verify all products belong to center, are active, and have enough stock
  const productIds = items.map(i => i.productId)
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, centerId, active: true },
    select: { id: true, priceCents: true, stock: true, name: true },
  })

  if (products.length !== productIds.length) {
    return { success: false, error: 'Uno o más productos no están disponibles' }
  }

  for (const item of items) {
    const product = products.find(p => p.id === item.productId)!
    if (product.stock !== null && product.stock !== undefined && product.stock < item.quantity) {
      return { success: false, error: `Stock insuficiente para "${item.name}"` }
    }
  }

  const totalCents = items.reduce((s, i) => s + i.priceCents * i.quantity, 0)

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
            create: items.map(i => ({
              productId:  i.productId,
              name:       i.name,
              priceCents: i.priceCents,
              quantity:   i.quantity,
            })),
          },
        },
      })

      // Decrement stock for products that track it
      for (const item of items) {
        const product = products.find(p => p.id === item.productId)!
        if (product.stock !== null && product.stock !== undefined) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          })
        }
      }

      return newOrder
    })

    return { success: true, orderId: order.id }
  } catch (err) {
    console.error('[order] Error creating order:', err)
    return { success: false, error: 'Error al procesar el pedido. Inténtalo de nuevo.' }
  }
}
