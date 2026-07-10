import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireOrganization } from '@/lib/auth/authorization'
import { enforceRateLimit, getRequestFingerprint } from '@/lib/security/rate-limit'
import { validateAndSanitizeImage } from '@/lib/storage/image-validation'
import {
  createPresignedPutUrl,
  createUploadKey,
  isStorageConfigured,
  type UploadKind,
} from '@/lib/storage/r2'

export const runtime = 'nodejs'
export const maxDuration = 30

const kindSchema = z.enum(['center-cover', 'center-gallery', 'staff', 'product'])

export async function POST(request: NextRequest) {
  let context: Awaited<ReturnType<typeof requireOrganization>>
  try {
    context = await requireOrganization()
  } catch {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  if (!isStorageConfigured()) {
    return NextResponse.json({ error: 'Storage no configurado' }, { status: 501 })
  }

  try {
    await enforceRateLimit('upload', await getRequestFingerprint(context.organizationId))
  } catch (error) {
    if (error instanceof Error && error.message === 'RATE_LIMITED') {
      return NextResponse.json({ error: 'Demasiadas subidas. Espera unos minutos.' }, { status: 429 })
    }
  }

  const formData = await request.formData().catch(() => null)
  if (!formData) return NextResponse.json({ error: 'Formulario inválido' }, { status: 400 })

  const file = formData.get('file')
  const parsedKind = kindSchema.safeParse(formData.get('kind'))
  if (!(file instanceof File) || !parsedKind.success) {
    return NextResponse.json({ error: 'Archivo o tipo de imagen inválido' }, { status: 400 })
  }

  try {
    const originalBytes = new Uint8Array(await file.arrayBuffer())
    const validated = validateAndSanitizeImage(originalBytes)
    const key = createUploadKey({
      organizationId: context.organizationId,
      kind: parsedKind.data as UploadKind,
      filename: file.name,
      contentType: validated.contentType,
    })
    const signed = createPresignedPutUrl({
      key,
      contentType: validated.contentType,
      expiresSeconds: 120,
    })

    const uploadResponse = await fetch(signed.uploadUrl, {
      method: 'PUT',
      headers: signed.requiredHeaders,
      body: Buffer.from(validated.bytes),
      cache: 'no-store',
    })
    if (!uploadResponse.ok) {
      console.error('[upload] storage rejected object', uploadResponse.status, await uploadResponse.text())
      return NextResponse.json({ error: 'No se pudo guardar la imagen' }, { status: 502 })
    }

    return NextResponse.json({
      key,
      publicUrl: signed.publicUrl,
      contentType: validated.contentType,
      size: validated.bytes.byteLength,
      dimensions: validated.dimensions,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Imagen inválida'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
