'use server'

import { prisma } from '@/lib/db/client'
import bcrypt from 'bcryptjs'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  businessName: z.string().optional(),
  role: z.enum(['CUSTOMER', 'BUSINESS_ADMIN']).default('CUSTOMER'),
})

export async function registerUser(prevState: { error: string } | null, formData: FormData) {
  const parsed = registerSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
    businessName: formData.get('businessName') ?? undefined,
    role: formData.get('role') ?? 'CUSTOMER',
  })

  if (!parsed.success) {
    return { error: 'Datos inválidos. Revisa el formulario.' }
  }

  const { name, email, password, businessName, role } = parsed.data

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return { error: 'Ya existe una cuenta con ese email.' }
  }

  const hashedPassword = await bcrypt.hash(password, 12)

  let organizationId: string | undefined

  if (role === 'BUSINESS_ADMIN' && businessName) {
    const slug = businessName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 60)

    const uniqueSlug = `${slug}-${Date.now()}`

    const org = await prisma.organization.create({
      data: {
        name: businessName,
        slug: uniqueSlug,
        plan: 'BASIC',
      },
    })
    organizationId = org.id
  }

  await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role,
      emailVerified: new Date(),
      organizationId,
    },
  })

  redirect('/auth/signin?registered=1')
}
