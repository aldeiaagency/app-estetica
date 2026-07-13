'use server'

import { randomUUID } from 'node:crypto'
import bcrypt from 'bcryptjs'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { authTokenIdentifier, consumeAuthToken, createAuthToken } from '@/lib/auth/tokens'
import { prisma } from '@/lib/db/client'
import { sendEmailVerification, sendPasswordResetEmail } from '@/lib/email/auth'
import { isEmailConfigured } from '@/lib/email/client'
import { enforceRateLimit, getRequestFingerprint } from '@/lib/security/rate-limit'

const passwordSchema = z.string()
  .min(10, 'La contraseña debe tener al menos 10 caracteres')
  .max(128)
  .regex(/[a-z]/, 'Incluye una minúscula')
  .regex(/[A-Z]/, 'Incluye una mayúscula')
  .regex(/[0-9]/, 'Incluye un número')

const selfServePlanSchema = z.enum(['presencia', 'growth', 'elite', 'basic', 'pro']).transform(plan => ({
  presencia: 'BASIC',
  growth: 'PRO',
  elite: 'GROWTH',
  basic: 'BASIC',
  pro: 'PRO',
} as const)[plan])

const registerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().transform(value => value.toLowerCase()),
  password: passwordSchema,
  businessName: z.string().trim().max(160).optional(),
  role: z.enum(['CUSTOMER', 'BUSINESS_ADMIN']).default('CUSTOMER'),
  plan: selfServePlanSchema.default('basic'),
  termsAccepted: z.literal('on', {
    errorMap: () => ({ message: 'Debes aceptar los términos y la política de privacidad.' }),
  }),
}).superRefine((data, context) => {
  if (data.role === 'BUSINESS_ADMIN' && !data.businessName) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['businessName'], message: 'Indica el nombre del negocio.' })
  }
})

const forgotPasswordSchema = z.object({
  email: z.string().trim().email().transform(value => value.toLowerCase()),
})

const resetPasswordSchema = z.object({
  email: z.string().trim().email().transform(value => value.toLowerCase()),
  token: z.string().min(32).max(256),
  password: passwordSchema,
})

export async function registerUser(_previousState: { error: string } | null, formData: FormData) {
  const parsed = registerSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
    businessName: formData.get('businessName') ?? undefined,
    role: formData.get('role') ?? 'CUSTOMER',
    plan: formData.get('plan') ?? 'basic',
    termsAccepted: formData.get('termsAccepted'),
  })
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? 'Datos inválidos.' }

  const data = parsed.data
  try {
    await enforceRateLimit('auth', await getRequestFingerprint(`register:${data.email}`))
  } catch (error) {
    if (error instanceof Error && error.message === 'RATE_LIMITED') {
      return { error: 'Demasiados intentos. Espera unos minutos.' }
    }
  }

  const existing = await prisma.user.findUnique({ where: { email: data.email }, select: { id: true } })
  if (existing) return { error: 'No se pudo crear la cuenta con esos datos.' }

  if (!isEmailConfigured()) {
    return { error: 'El registro no esta disponible temporalmente porque no podemos verificar tu email.' }
  }

  const hashedPassword = await bcrypt.hash(data.password, 12)

  try {
    const user = await prisma.$transaction(async tx => {
      let organizationId: string | undefined
      if (data.role === 'BUSINESS_ADMIN') {
        const baseSlug = data.businessName!
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')
          .slice(0, 50) || 'negocio'
        const organization = await tx.organization.create({
          data: {
            name: data.businessName!,
            slug: `${baseSlug}-${randomUUID().slice(0, 8)}`,
            plan: data.plan,
          },
        })
        organizationId = organization.id
      }

      return tx.user.create({
        data: {
          name: data.name,
          email: data.email,
          password: hashedPassword,
          role: data.role,
          emailVerified: null,
          organizationId,
        },
      })
    })

    const identifier = authTokenIdentifier('email-verify', data.email)
    const token = await createAuthToken(identifier, 60 * 24)
    sendEmailVerification({ to: data.email, name: user.name, token }).catch(error => {
      console.error('[auth] verification email failed', error)
    })
  } catch (error) {
    console.error('[auth] registration failed', error)
    return { error: 'No se pudo crear la cuenta con esos datos.' }
  }

  redirect('/auth/signin?registered=1')
}

export async function requestPasswordReset(
  _previousState: { success?: boolean; error?: string; message?: string } | null,
  formData: FormData,
) {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get('email') })
  if (!parsed.success) return { success: false, error: 'Introduce un email válido.' }
  const email = parsed.data.email

  try {
    await enforceRateLimit('passwordReset', await getRequestFingerprint(`forgot:${email}`))
  } catch (error) {
    if (error instanceof Error && error.message === 'RATE_LIMITED') {
      return { success: true, message: 'Si existe una cuenta con ese email, enviaremos un enlace.' }
    }
  }

  const user = await prisma.user.findUnique({ where: { email }, select: { password: true } })
  if (user?.password) {
    const identifier = authTokenIdentifier('password-reset', email)
    const token = await createAuthToken(identifier, 30)
    sendPasswordResetEmail({ to: email, token }).catch(error => {
      console.error('[auth] password reset email failed', error)
    })
  }

  return {
    success: true,
    message: 'Si existe una cuenta con ese email, enviaremos un enlace para cambiar la contraseña.',
  }
}

export async function resetPassword(
  _previousState: { success?: boolean; error?: string; message?: string } | null,
  formData: FormData,
) {
  const parsed = resetPasswordSchema.safeParse({
    email: formData.get('email'),
    token: formData.get('token'),
    password: formData.get('password'),
  })
  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message ?? 'El enlace no es válido.' }

  const { email, token, password } = parsed.data
  try {
    await enforceRateLimit('passwordReset', await getRequestFingerprint(`reset:${email}`))
  } catch (error) {
    if (error instanceof Error && error.message === 'RATE_LIMITED') {
      return { success: false, error: 'Demasiados intentos. Solicita un nuevo enlace más tarde.' }
    }
  }

  const identifier = authTokenIdentifier('password-reset', email)
  if (!(await consumeAuthToken(identifier, token))) {
    return { success: false, error: 'El enlace ha caducado o ya fue usado.' }
  }

  const passwordHash = await bcrypt.hash(password, 12)
  const updated = await prisma.$executeRaw`
    UPDATE "User"
    SET "password" = ${passwordHash}, "sessionVersion" = "sessionVersion" + 1, "updatedAt" = CURRENT_TIMESTAMP
    WHERE "email" = ${email} AND "active" = true
  `
  if (updated !== 1) return { success: false, error: 'No se pudo actualizar la contraseña.' }
  return { success: true, message: 'Contraseña actualizada. Vuelve a iniciar sesión.' }
}

export async function verifyEmailToken(email: string, token: string) {
  const normalizedEmail = email.trim().toLowerCase()
  if (!z.string().email().safeParse(normalizedEmail).success || token.length < 32) {
    return { success: false, message: 'El enlace de verificación no es válido.' }
  }

  try {
    await enforceRateLimit('passwordReset', await getRequestFingerprint(`verify:${normalizedEmail}`))
  } catch (error) {
    if (error instanceof Error && error.message === 'RATE_LIMITED') {
      return { success: false, message: 'Demasiados intentos. Prueba más tarde.' }
    }
  }

  const identifier = authTokenIdentifier('email-verify', normalizedEmail)
  if (!(await consumeAuthToken(identifier, token))) {
    return { success: false, message: 'El enlace de verificación ha caducado o ya fue usado.' }
  }

  await prisma.user.update({ where: { email: normalizedEmail }, data: { emailVerified: new Date() } })
  return { success: true, message: 'Email verificado correctamente. Ya puedes entrar en tu cuenta.' }
}
