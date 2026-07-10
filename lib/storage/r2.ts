import crypto from 'crypto'

const REGION = 'auto'
const SERVICE = 's3'
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif'])

export type UploadKind = 'center-cover' | 'center-gallery' | 'staff' | 'product'

const KIND_PREFIX: Record<UploadKind, string> = {
  'center-cover': 'centers/covers',
  'center-gallery': 'centers/gallery',
  staff: 'staff',
  product: 'products',
}

function hmac(key: Buffer | string, value: string) {
  return crypto.createHmac('sha256', key).update(value).digest()
}

function sha256(value: string) {
  return crypto.createHash('sha256').update(value).digest('hex')
}

function encodePath(path: string) {
  return path.split('/').map(encodeURIComponent).join('/')
}

function encodeQuery(value: string) {
  return encodeURIComponent(value).replace(/[!'()*]/g, char => `%${char.charCodeAt(0).toString(16).toUpperCase()}`)
}

function getSigningKey(secretKey: string, dateStamp: string) {
  const kDate = hmac(`AWS4${secretKey}`, dateStamp)
  const kRegion = hmac(kDate, REGION)
  const kService = hmac(kRegion, SERVICE)
  return hmac(kService, 'aws4_request')
}

function getExtension(filename: string, contentType: string) {
  const ext = filename.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '')
  if (ext && ['jpg', 'jpeg', 'png', 'webp', 'avif'].includes(ext)) return ext === 'jpeg' ? 'jpg' : ext
  if (contentType === 'image/png') return 'png'
  if (contentType === 'image/webp') return 'webp'
  if (contentType === 'image/avif') return 'avif'
  return 'jpg'
}

export function isStorageConfigured() {
  return Boolean(
    process.env.STORAGE_ENDPOINT &&
    process.env.STORAGE_ACCESS_KEY &&
    process.env.STORAGE_SECRET_KEY &&
    process.env.STORAGE_BUCKET &&
    process.env.NEXT_PUBLIC_CDN_URL
  )
}

export function assertValidImageUpload(input: { contentType: string; size: number }) {
  if (!ALLOWED_IMAGE_TYPES.has(input.contentType)) {
    return { success: false as const, error: 'Formato no permitido. Usa JPG, PNG, WebP o AVIF.' }
  }
  if (!Number.isFinite(input.size) || input.size <= 0 || input.size > MAX_UPLOAD_BYTES) {
    return { success: false as const, error: 'La imagen debe pesar menos de 5 MB.' }
  }
  return { success: true as const }
}

export function createUploadKey(params: {
  organizationId: string
  kind: UploadKind
  filename: string
  contentType: string
}) {
  const now = new Date()
  const yyyy = now.getUTCFullYear()
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0')
  const extension = getExtension(params.filename, params.contentType)
  return `${params.organizationId}/${KIND_PREFIX[params.kind]}/${yyyy}/${mm}/${crypto.randomUUID()}.${extension}`
}

export function createPresignedPutUrl(params: {
  key: string
  contentType: string
  expiresSeconds?: number
}) {
  if (!isStorageConfigured()) throw new Error('Storage is not configured')
  if (!ALLOWED_IMAGE_TYPES.has(params.contentType)) throw new Error('Unsupported content type')

  const endpoint = process.env.STORAGE_ENDPOINT!.replace(/\/$/, '')
  const accessKey = process.env.STORAGE_ACCESS_KEY!
  const secretKey = process.env.STORAGE_SECRET_KEY!
  const bucket = process.env.STORAGE_BUCKET!
  const url = new URL(endpoint)
  const now = new Date()
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '')
  const dateStamp = amzDate.slice(0, 8)
  const expires = String(Math.min(params.expiresSeconds ?? 300, 300))
  const credentialScope = `${dateStamp}/${REGION}/${SERVICE}/aws4_request`
  const credential = `${accessKey}/${credentialScope}`
  const canonicalUri = `/${bucket}/${encodePath(params.key)}`
  const host = url.host
  const signedHeaders = 'content-type;host'
  const query: Record<string, string> = {
    'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
    'X-Amz-Credential': credential,
    'X-Amz-Date': amzDate,
    'X-Amz-Expires': expires,
    'X-Amz-SignedHeaders': signedHeaders,
  }
  const canonicalQuery = Object.keys(query)
    .sort()
    .map(key => `${encodeQuery(key)}=${encodeQuery(query[key])}`)
    .join('&')
  const canonicalHeaders = `content-type:${params.contentType}\nhost:${host}\n`
  const canonicalRequest = [
    'PUT',
    canonicalUri,
    canonicalQuery,
    canonicalHeaders,
    signedHeaders,
    'UNSIGNED-PAYLOAD',
  ].join('\n')
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    sha256(canonicalRequest),
  ].join('\n')
  const signature = crypto.createHmac('sha256', getSigningKey(secretKey, dateStamp)).update(stringToSign).digest('hex')
  const uploadUrl = `${endpoint}${canonicalUri}?${canonicalQuery}&X-Amz-Signature=${signature}`
  const publicUrl = `${process.env.NEXT_PUBLIC_CDN_URL!.replace(/\/$/, '')}/${encodePath(params.key)}`

  return { uploadUrl, publicUrl, requiredHeaders: { 'Content-Type': params.contentType } }
}
