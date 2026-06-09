'use server'

import { generateText } from 'ai'
import { aiModel } from '@/lib/ai/client'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/client'
import { PLAN_FEATURES } from '@/lib/billing/plans'

type AiResult = { success: true; text: string } | { success: false; error: string }

async function checkAiAccess(): Promise<
  { allowed: true; orgPlan: string } | { allowed: false; error: string }
> {
  const session = await auth()
  const orgId = session?.user?.organizationId
  if (!orgId) return { allowed: false, error: 'no_auth' }

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { plan: true },
  })
  if (!org) return { allowed: false, error: 'no_auth' }

  if (!PLAN_FEATURES[org.plan].hasAI) {
    return { allowed: false, error: 'plan_required' }
  }

  return { allowed: true, orgPlan: org.plan }
}

export async function generateDescriptionAction(centerId: string): Promise<AiResult> {
  const session = await auth()
  const orgId = session?.user?.organizationId
  if (!orgId) return { success: false, error: 'no_auth' }

  const access = await checkAiAccess()
  if (!access.allowed) return { success: false, error: access.error }

  const center = await prisma.center.findFirst({
    where: { id: centerId, organizationId: orgId },
    include: { services: { take: 8, select: { name: true } } },
  })
  if (!center) return { success: false, error: 'Centro no encontrado' }

  const serviceList = center.services.map(s => s.name).join(', ')

  try {
    const { text } = await generateText({
      model: aiModel,
      prompt: `Eres un experto en marketing para centros de belleza y estetica en Espana.

Escribe una descripcion atractiva y profesional de 150-200 palabras para un centro llamado "${center.name}" ubicado en ${center.addressCity} (${center.addressProvince}), especializado en ${center.category}.
${serviceList ? `Sus servicios incluyen: ${serviceList}.` : ''}

La descripcion debe:
- Ser calida, cercana y profesional
- Destacar la experiencia y el ambiente del centro
- Mencionar los servicios principales de forma natural
- Invitar a los clientes a reservar una cita
- Estar escrita en primera persona del plural (nosotros)
- Estar en castellano, sin accentos incorrectos

Solo devuelve la descripcion, sin titulos, comillas ni texto adicional.`,
    })
    return { success: true, text: text.trim() }
  } catch {
    return { success: false, error: 'Error al generar la descripcion. Inténtalo de nuevo.' }
  }
}

export async function generateSeoDescriptionAction(centerId: string): Promise<AiResult> {
  const session = await auth()
  const orgId = session?.user?.organizationId
  if (!orgId) return { success: false, error: 'no_auth' }

  const access = await checkAiAccess()
  if (!access.allowed) return { success: false, error: access.error }

  const center = await prisma.center.findFirst({
    where: { id: centerId, organizationId: orgId },
    include: { services: { take: 5, select: { name: true } } },
  })
  if (!center) return { success: false, error: 'Centro no encontrado' }

  const serviceList = center.services.map(s => s.name).join(', ')

  try {
    const { text } = await generateText({
      model: aiModel,
      prompt: `Eres un experto en SEO para negocios locales de belleza en Espana.

Escribe una meta descripcion SEO de maximo 155 caracteres para "${center.name}" en ${center.addressCity}, especializado en ${center.category}.
${serviceList ? `Servicios: ${serviceList}.` : ''}

Requisitos:
- Maximo 155 caracteres (cuenta bien)
- Incluye la ciudad y la especialidad
- Termina con un call-to-action como "Reserva online" o "Cita online"
- En castellano, sin accentos incorrectos

Solo devuelve la meta descripcion, sin comillas ni texto adicional.`,
    })
    const trimmed = text.trim().replace(/^["']|["']$/g, '')
    return { success: true, text: trimmed.slice(0, 155) }
  } catch {
    return { success: false, error: 'Error al generar la descripcion SEO. Inténtalo de nuevo.' }
  }
}
