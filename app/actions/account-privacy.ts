'use server'

import { Prisma } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/client'

export async function revokeMarketingConsentAction(): Promise<never> {
  const session = await auth()
  const userId = session?.user?.id
  const email = session?.user?.email?.toLowerCase()
  if (!userId || !email) {
    redirect('/auth/signin?callbackUrl=/cuenta')
  }

  await prisma.customer.updateMany({
    where: {
      OR: [
        { email },
        { userId },
      ],
    },
    data: {
      marketingConsent: false,
      marketingConsentDate: null,
    },
  })

  revalidatePath('/cuenta')
  redirect('/cuenta?privacy=marketing-revocado')
}

export async function deletePersonalizationDataAction(formData: FormData): Promise<never> {
  const confirmation = String(formData.get('confirmation') ?? '').trim().toUpperCase()
  if (confirmation !== 'BORRAR') {
    redirect('/cuenta?privacy=confirmacion-requerida')
  }

  const session = await auth()
  const userId = session?.user?.id
  const email = session?.user?.email?.toLowerCase()
  if (!userId || !email) {
    redirect('/auth/signin?callbackUrl=/cuenta')
  }

  await prisma.$transaction(async (tx) => {
    const profiles = await tx.$queryRaw<{ id: string }[]>`
      SELECT "id"
      FROM "BeautyProfile"
      WHERE "userId" = ${userId}
    `
    const profileIds = profiles.map(profile => profile.id)

    if (profileIds.length > 0) {
      await tx.$executeRaw`DELETE FROM "ProductUsage" WHERE "profileId" IN (${Prisma.join(profileIds)})`
      await tx.$executeRaw`DELETE FROM "BeautyRoutine" WHERE "profileId" IN (${Prisma.join(profileIds)})`
      await tx.$executeRaw`DELETE FROM "UserBenefit" WHERE "profileId" IN (${Prisma.join(profileIds)})`
      await tx.$executeRaw`DELETE FROM "BeautyPlan" WHERE "profileId" IN (${Prisma.join(profileIds)})`
      await tx.$executeRaw`DELETE FROM "BeautyGoal" WHERE "profileId" IN (${Prisma.join(profileIds)})`
      await tx.$executeRaw`DELETE FROM "BeautyProfile" WHERE "id" IN (${Prisma.join(profileIds)})`
    }

    await tx.customer.updateMany({
      where: {
        OR: [
          { email },
          { userId },
        ],
      },
      data: {
        marketingConsent: false,
        marketingConsentDate: null,
      },
    })
  })

  revalidatePath('/cuenta')
  revalidatePath('/mi-plan')
  revalidatePath('/wallet')
  revalidatePath('/rutina')
  revalidatePath('/reposicion')

  redirect('/cuenta?privacy=personalizacion-borrada')
}
