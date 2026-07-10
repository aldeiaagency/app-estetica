import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth/config'
import {
  assertValidImageUpload,
  createPresignedPutUrl,
  createUploadKey,
  isStorageConfigured,
  type UploadKind,
} from '@/lib/storage/r2'

const uploadSchema = z.object({
  filename: z.string().trim().min(1).max(180),
  contentType: z.string().trim().min(1).max(80),
  size: z.number().int().positive(),
  kind: z.enum(['center-cover', 'center-gallery', 'staff', 'product']),
})

export async function POST(request: NextRequest) {
  const session = await auth()
  const organizationId = session?.user?.organizationId
  if (!organizationId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (!isStorageConfigured()) return NextResponse.json({ error: 'Storage no configurado' }, { status: 501 })

  const body = await request.json().catch(() => null)
  const parsed = uploadSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message ?? 'Datos inválidos' }, { status: 400 })
  }

  const validation = assertValidImageUpload({
    contentType: parsed.data.contentType,
    size: parsed.data.size,
  })
  if (!validation.success) return NextResponse.json({ error: validation.error }, { status: 400 })

  const key = createUploadKey({
    organizationId,
    kind: parsed.data.kind as UploadKind,
    filename: parsed.data.filename,
    contentType: parsed.data.contentType,
  })
  const signed = createPresignedPutUrl({
    key,
    contentType: parsed.data.contentType,
    expiresSeconds: 300,
  })

  return NextResponse.json({
    key,
    uploadUrl: signed.uploadUrl,
    publicUrl: signed.publicUrl,
    requiredHeaders: signed.requiredHeaders,
    maxBytes: 5 * 1024 * 1024,
  })
}
