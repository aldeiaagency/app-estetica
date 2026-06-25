'use server'

import { prisma } from '@/lib/db/client'
import bcrypt from 'bcryptjs'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { isEmailConfigured } from '@/lib/email/client'
import { sendEmailVerification, sendPasswordResetEmail } from '@/lib/email/auth'
import { authTokenIdentifier, consumeAuthToken, createAuthToken } from '@/lib/auth/tokens'

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  businessName: z.string().optional(),
  role: z.enum(['CUSTOMER', 'BUSINESS_ADMIN']).default('CUSTOMER'),
  termsAccepted: z.literal('on', {
    errorMap: () => ({ message: 'Debes aceptar los terminos y la politica de privacidad.' }),
  }),
})

const forgotPasswordSchema = z.object({
  email: z.string().email(),
})

const resetPasswordSchema = z.object({
  email: z.string().email(),
  token: z.string().min(32),
  password: z.string().min(8),
})

export async function registerUser(prevState: { error: string } | null, formData: FormData) {
  const parsed = registerSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
    businessName: formData.get('businessName') ?? undefined,
    role: formData.get('role') ?? 'CUSTOMER',
    termsAccepted: formData.get('termsAccepted'),
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

  const shouldVerifyEmail = isEmailConfigured()
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role,
      emailVerified: shouldVerifyEmail ? null : new Date(),
      organizationId,
    },
  })

  if (shouldVerifyEmail) {
    const identifier = authTokenIdentifier('email-verify', email)
    const token = await createAuthToken(identifier, 60 * 24)
    sendEmailVerification({ to: email, name: user.name, token }).catch(error => {
      console.error('[auth] Error sending verification email:', error)
    })
  }

  redirect('/auth/signin?registered=1')
}

export async function requestPasswordReset(
  _prevState: { success?: boolean; error?: string; message?: string } | null,
  formData: FormData
) {
  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get('email'),
  })

  if (!parsed.success) {
    return { success: false, error: 'Introduce un email valido.' }
  }

  const email = parsed.data.email.toLowerCase()
  const user = await prisma.user.findUnique({ where: { email } })

  if (user?.password) {
    const identifier = authTokenIdentifier('password-reset', email)
    const token = await createAuthToken(identifier, 30)
    sendPasswordResetEmail({ to: email, token }).catch(error => {
      console.error('[auth] Error sending password reset email:', error)
    })
  }

  return {
    success: true,
    message: 'Si existe una cuenta con ese email, enviaremos un enlace para cambiar la contrasena.',
  }
}

export async function resetPassword(
  _prevState: { success?: boolean; error?: string; message?: string } | null,
  formData: FormData
) {
  const parsed = resetPasswordSchema.safeParse({
    email: formData.get('email'),
    token: formData.get('token'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return { success: false, error: 'El enlace no es valido o la contrasena es demasiado corta.' }
  }

  const email = parsed.data.email.toLowerCase()
  const identifier = authTokenIdentifier('password-reset', email)
  const valid = await consumeAuthToken(identifier, parsed.data.token)

  if (!valid) {
    return { success: false, error: 'El enlace ha caducado o ya fue usado.' }
  }

  await prisma.user.update({
    where: { email },
    data: { password: await bcrypt.hash(parsed.data.password, 12) },
  })

  return { success: true, message: 'Contrasena actualizada. Ya puedes entrar con la nueva contrasena.' }
}

export async function verifyEmailToken(email: string, token: string) {
  const normalizedEmail = email.toLowerCase()
  const identifier = authTokenIdentifier('email-verify', normalizedEmail)
  const valid = await consumeAuthToken(identifier, token)

  if (!valid) return { success: false, message: 'El enlace de verificacion ha caducado o ya fue usado.' }

  await prisma.user.update({
    where: { email: normalizedEmail },
    data: { emailVerified: new Date() },
  })

  return { success: true, message: 'Email verificado correctamente. Ya puedes entrar en tu cuenta.' }
}
