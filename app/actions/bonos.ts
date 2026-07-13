'use server'

import { prisma } from '@/lib/db/client'
import { z } from 'zod'
import { isStripeConfigured } from '@/lib/billing/stripe'
import { createBonoCheckoutSession } from '@/lib/billing/checkout'
import { requireOrganization } from '@/lib/auth/authorization'
import { redeemBonoSessionAtomic } from '@/lib/billing/bonos'

const purchaseBonoSchema = z.object({
  bonoId:        z.string().cuid(),
  customerName:  z.string().min(2).max(100),
  customerEmail: z.string().email(),
  customerPhone: z.string().optional(),
  consentGiven:  z.boolean().refine(v => v === true, 'Debes aceptar la política de privacidad'),
})

export type PurchaseBonoInput = z.infer<typeof purchaseBonoSchema>

export async function purchaseBonoAction(input: unknown): Promise<
  { success: true; instanceId?: string; checkoutUrl?: string } | { success: false; error: string }
> {
  const parsed = purchaseBonoSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? 'Datos inválidos' }
  }

  const { bonoId, customerName, customerEmail, customerPhone } = parsed.data

  const bono = await prisma.bono.findFirst({
    where: { id: bonoId, active: true },
    include: { center: { select: { id: true, published: true } } },
  })

  if (!bono || !bono.center.published) {
    return { success: false, error: 'Bono no disponible' }
  }

  const centerId = bono.center.id

  // Si Stripe está configurado, cobramos online y creamos la BonoInstance en el webhook.
  if (isStripeConfigured()) {
    try {
      const checkoutUrl = await createBonoCheckoutSession({
        bonoId:        bono.id,
        bonoName:      bono.name,
        priceCents:    bono.priceCents,
        centerId,
        customerName:  customerName.trim(),
        customerEmail: customerEmail.toLowerCase(),
        customerPhone: customerPhone?.trim(),
      })
      return { success: true, checkoutUrl }
    } catch (err) {
      console.error('[bonos] Stripe checkout session failed:', err)
      return { success: false, error: 'No se pudo iniciar el pago. Inténtalo de nuevo.' }
    }
  }

  // Sin Stripe: se reserva el bono y se paga en el centro (comportamiento actual).
  try {
    const instance = await prisma.$transaction(async (tx) => {
      // find-or-create customer by (email, centerId)
      let customer = await tx.customer.findUnique({
        where: { email_centerId: { email: customerEmail.toLowerCase(), centerId } },
      })

      if (!customer) {
        customer = await tx.customer.create({
          data: {
            centerId,
            name:  customerName.trim(),
            email: customerEmail.toLowerCase(),
            phone: customerPhone?.trim() ?? null,
            consentGivenAt: new Date(),
          },
        })
      }

      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + bono.validityDays)

      return tx.bonoInstance.create({
        data: {
          bonoId:            bono.id,
          customerId:        customer.id,
          centerId,
          sessionsRemaining: bono.sessions,
          purchasedAt:       new Date(),
          expiresAt,
        },
      })
    })

    return { success: true, instanceId: instance.id }
  } catch (err) {
    console.error('[bonos] Error purchasing bono:', err)
    return { success: false, error: 'Error al procesar la compra. Inténtalo de nuevo.' }
  }
}

// Dashboard: decrement sessions on a BonoInstance (business-side redemption)
export async function redeemBonoSessionAction(
  instanceId: string,
  _legacyOrganizationId?: string,
): Promise<{ success: boolean; error?: string; sessionsRemaining?: number }> {
  try {
    const { organizationId } = await requireOrganization()
    const result = await redeemBonoSessionAtomic(instanceId, organizationId)
    if (result.success) return result
    if (result.reason === 'EXPIRED') return { success: false, error: 'El bono ha caducado' }
    if (result.reason === 'EMPTY') return { success: false, error: 'El bono no tiene sesiones disponibles' }
    return { success: false, error: 'Instancia no encontrada' }
  } catch (err) {
    console.error('[bonos] Error redeeming session:', err)
    return { success: false, error: 'Error al redimir la sesión' }
  }
}
