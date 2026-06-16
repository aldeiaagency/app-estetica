'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { upsertCenterAction } from '@/app/actions/dashboard'
import { generateDescriptionAction, generateSeoDescriptionAction } from '@/app/actions/ai'
import { AiBtn } from '@/components/dashboard/ai-btn'
import { CheckCircle2, AlertCircle, ImagePlus } from 'lucide-react'

const CATEGORIES = [
  'PELUQUERIA', 'ESTETICA', 'UNAS', 'CEJAS_PESTANAS',
  'DEPILACION', 'MASAJES', 'SPA', 'COSMETICA', 'BELLEZA_INTEGRAL', 'OTRO',
] as const

const CATEGORY_LABELS: Record<string, string> = {
  PELUQUERIA: 'Peluquería', ESTETICA: 'Estética', UNAS: 'Uñas',
  CEJAS_PESTANAS: 'Cejas y pestañas', DEPILACION: 'Depilación',
  MASAJES: 'Masajes', SPA: 'Spa', COSMETICA: 'Cosmética',
  BELLEZA_INTEGRAL: 'Belleza integral', OTRO: 'Otro',
}

const inputCls = 'w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm text-zinc-900 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 bg-white'
const labelCls = 'mb-1 block text-sm font-medium text-zinc-700'

interface CenterData {
  id?: string
  name: string
  description: string | null
  descriptionLong: string | null
  category: string
  phone: string | null
  whatsapp: string | null
  email: string | null
  website: string | null
  coverImage: string | null
  galleryImages: string[]
  addressStreet: string
  addressCity: string
  addressProvince: string
  addressPostalCode: string
}

interface CentroFormProps {
  center: CenterData | null
  orgId: string
  canUseAI: boolean
}

export function CentroForm({ center, orgId, canUseAI }: CentroFormProps) {
  const router = useRouter()
  const [description,     setDescription]     = useState(center?.description     ?? '')
  const [descriptionLong, setDescriptionLong] = useState(center?.descriptionLong ?? '')
  const [coverImage, setCoverImage]           = useState(center?.coverImage ?? '')
  const [galleryText, setGalleryText]         = useState((center?.galleryImages ?? []).join('\n'))
  const [isPending, startTransition]           = useTransition()
  const [status, setStatus]                    = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg]                = useState('')

  const centerId = center?.id

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const galleryImages = galleryText
      .split(/\r?\n/)
      .map(url => url.trim())
      .filter(Boolean)

    startTransition(async () => {
      const result = await upsertCenterAction(
        {
          name:             fd.get('name') as string,
          description:      description || undefined,
          descriptionLong:  descriptionLong || undefined,
          category:         fd.get('category') as string,
          phone:            (fd.get('phone') as string) || undefined,
          whatsapp:         (fd.get('whatsapp') as string) || undefined,
          email:            (fd.get('email') as string) || undefined,
          website:          (fd.get('website') as string) || undefined,
          coverImage:       coverImage || undefined,
          galleryImages,
          addressStreet:    (fd.get('addressStreet') as string) || undefined,
          addressCity:      fd.get('addressCity') as string,
          addressProvince:  fd.get('addressProvince') as string,
          addressPostalCode:(fd.get('addressPostalCode') as string) || undefined,
        },
        orgId
      )
      if (result.success) {
        setStatus('success')
        router.refresh()
        setTimeout(() => setStatus('idle'), 3000)
      } else {
        setStatus('error')
        setErrorMsg(result.error ?? 'Error al guardar')
      }
    })
  }

  const galleryPreview = galleryText
    .split(/\r?\n/)
    .map(url => url.trim())
    .filter(Boolean)
    .slice(0, 8)

  async function handleGenerateDescription() {
    if (!centerId) return
    const result = await generateDescriptionAction(centerId)
    if (result.success) setDescriptionLong(result.text)
    else if (result.error === 'plan_required') router.push('/dashboard/plan')
  }

  async function handleGenerateSeo() {
    if (!centerId) return
    const result = await generateSeoDescriptionAction(centerId)
    if (result.success) setDescription(result.text)
    else if (result.error === 'plan_required') router.push('/dashboard/plan')
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5 sm:grid-cols-2">
      {/* Name */}
      <div className="sm:col-span-2">
        <label className={labelCls}>Nombre del centro <span className="text-rose-500">*</span></label>
        <input
          name="name"
          required
          minLength={2}
          defaultValue={center?.name ?? ''}
          placeholder="Ej: Studio Beauty & Spa"
          className={inputCls}
        />
      </div>

      {/* Category */}
      <div>
        <label className={labelCls}>Categoría <span className="text-rose-500">*</span></label>
        <select name="category" required defaultValue={center?.category ?? ''} className={inputCls}>
          <option value="" disabled>Selecciona una categoría</option>
          {CATEGORIES.map(cat => (
            <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>
          ))}
        </select>
      </div>

      {/* Email */}
      <div>
        <label className={labelCls}>Email del centro</label>
        <input name="email" type="email" defaultValue={center?.email ?? ''} placeholder="contacto@micentro.com" className={inputCls} />
      </div>

      {/* Short description (SEO) */}
      <div className="sm:col-span-2">
        <div className="mb-1 flex items-center justify-between">
          <label className={labelCls.replace('mb-1 ', '')}>
            Descripción corta
            <span className="ml-1.5 text-xs font-normal text-zinc-400">(155 car. — se usa como meta descripción SEO)</span>
          </label>
          {centerId && (
            <AiBtn
              canUseAI={canUseAI}
              label="Sugerir SEO"
              onGenerate={handleGenerateSeo}
            />
          )}
        </div>
        <textarea
          name="description"
          rows={2}
          value={description}
          onChange={e => setDescription(e.target.value)}
          maxLength={155}
          placeholder="Breve descripción optimizada para buscadores (máx. 155 caracteres)"
          className={`${inputCls} resize-none`}
        />
        <p className="mt-0.5 text-right text-xs text-zinc-400">{description.length}/155</p>
      </div>

      {/* Long description */}
      <div className="sm:col-span-2">
        <div className="mb-1 flex items-center justify-between">
          <label className={labelCls.replace('mb-1 ', '')}>
            Descripción completa
            <span className="ml-1.5 text-xs font-normal text-zinc-400">(visible en tu página pública)</span>
          </label>
          {centerId && (
            <AiBtn
              canUseAI={canUseAI}
              label="Generar con IA"
              onGenerate={handleGenerateDescription}
            />
          )}
        </div>
        <textarea
          name="descriptionLong"
          rows={5}
          value={descriptionLong}
          onChange={e => setDescriptionLong(e.target.value)}
          placeholder="Describe tu centro: ambiente, especialidades, por qué elegirte..."
          className={`${inputCls} resize-none`}
        />
        {!centerId && (
          <p className="mt-0.5 text-xs text-zinc-400">Guarda primero el centro para activar la generación con IA.</p>
        )}
      </div>

      {/* Visual identity */}
      <div className="sm:col-span-2 border-t border-zinc-100 pt-4">
        <div className="mb-3 flex items-center gap-2">
          <ImagePlus className="h-4 w-4 text-[#2355c8]" />
          <p className="text-sm font-semibold text-zinc-700">Imagenes del perfil publico</p>
        </div>
      </div>

      <div className="sm:col-span-2">
        <label className={labelCls}>Imagen de portada</label>
        <input
          type="url"
          value={coverImage}
          onChange={event => setCoverImage(event.target.value)}
          placeholder="https://..."
          className={inputCls}
        />
        <p className="mt-1 text-xs text-zinc-400">Se muestra en el hero de tu ficha, buscador y marketplace.</p>
        {coverImage && (
          <div className="mt-3 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={coverImage} alt="Vista previa de portada" className="h-44 w-full object-cover" />
          </div>
        )}
      </div>

      <div className="sm:col-span-2">
        <label className={labelCls}>Galeria</label>
        <textarea
          rows={4}
          value={galleryText}
          onChange={event => setGalleryText(event.target.value)}
          placeholder={'Una URL por linea. Maximo 8 imagenes.'}
          className={`${inputCls} resize-none`}
        />
        <p className="mt-1 text-xs text-zinc-400">Ideal para cabinas, trabajos, productos destacados o ambiente del centro.</p>
        {galleryPreview.length > 0 && (
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {galleryPreview.map(url => (
              <div key={url} className="overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="Imagen de galeria" className="h-24 w-full object-cover" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Phone */}
      <div>
        <label className={labelCls}>Teléfono</label>
        <input name="phone" type="tel" defaultValue={center?.phone ?? ''} placeholder="91 234 56 78" className={inputCls} />
      </div>

      {/* WhatsApp */}
      <div>
        <label className={labelCls}>WhatsApp</label>
        <input name="whatsapp" type="tel" defaultValue={center?.whatsapp ?? ''} placeholder="612 345 678" className={inputCls} />
      </div>

      {/* Website */}
      <div className="sm:col-span-2">
        <label className={labelCls}>Sitio web</label>
        <input name="website" type="url" defaultValue={center?.website ?? ''} placeholder="https://micentro.com" className={inputCls} />
      </div>

      {/* Address */}
      <div className="sm:col-span-2 border-t border-zinc-100 pt-4">
        <p className="mb-3 text-sm font-semibold text-zinc-700">Dirección</p>
      </div>

      <div className="sm:col-span-2">
        <label className={labelCls}>Calle y número</label>
        <input name="addressStreet" defaultValue={center?.addressStreet ?? ''} placeholder="Calle Mayor 10, 2ºA" className={inputCls} />
      </div>

      <div>
        <label className={labelCls}>Ciudad <span className="text-rose-500">*</span></label>
        <input name="addressCity" required defaultValue={center?.addressCity ?? ''} placeholder="Madrid" className={inputCls} />
      </div>

      <div>
        <label className={labelCls}>Provincia <span className="text-rose-500">*</span></label>
        <input name="addressProvince" required defaultValue={center?.addressProvince ?? ''} placeholder="Madrid" className={inputCls} />
      </div>

      <div>
        <label className={labelCls}>Código postal</label>
        <input name="addressPostalCode" defaultValue={center?.addressPostalCode ?? ''} placeholder="28001" maxLength={5} className={inputCls} />
      </div>

      {/* Submit */}
      <div className="sm:col-span-2 flex items-center gap-4 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-xl bg-primary-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 transition-colors disabled:opacity-60 disabled:cursor-wait"
        >
          {isPending ? 'Guardando...' : 'Guardar cambios'}
        </button>

        {status === 'success' && (
          <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-600">
            <CheckCircle2 className="h-4 w-4" /> Guardado
          </span>
        )}
        {status === 'error' && (
          <span className="flex items-center gap-1.5 text-sm font-medium text-rose-600">
            <AlertCircle className="h-4 w-4" /> {errorMsg}
          </span>
        )}
      </div>
    </form>
  )
}
