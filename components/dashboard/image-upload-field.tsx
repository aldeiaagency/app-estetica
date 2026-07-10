'use client'

import { ImagePlus, Loader2, X } from 'lucide-react'
import { useRef, useState, useTransition } from 'react'
import type { UploadKind } from '@/lib/storage/r2'

interface ImageUploadFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  kind: UploadKind
  helper?: string
  previewClassName?: string
  showUrlInput?: boolean
}

export function ImageUploadField({
  label,
  value,
  onChange,
  kind,
  helper,
  previewClassName = 'h-44',
  showUrlInput = true,
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleFile(file: File | undefined) {
    if (!file) return
    setError(null)

    startTransition(async () => {
      try {
        if (file.size > 5 * 1024 * 1024) throw new Error('La imagen debe pesar menos de 5 MB.')
        const formData = new FormData()
        formData.set('file', file)
        formData.set('kind', kind)

        const response = await fetch('/api/upload/image', {
          method: 'POST',
          body: formData,
        })
        const result = await response.json()
        if (!response.ok) throw new Error(result.error ?? 'No se pudo subir la imagen')
        onChange(result.publicUrl)
      } catch (uploadError) {
        setError(uploadError instanceof Error ? uploadError.message : 'Error al subir la imagen')
      } finally {
        if (inputRef.current) inputRef.current.value = ''
      }
    })
  }

  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-3">
        <label className="block text-sm font-medium text-zinc-700">{label}</label>
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-400 transition-colors hover:text-zinc-700"
            aria-label={`Quitar ${label.toLowerCase()}`}
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" /> Quitar
          </button>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          onChange={event => handleFile(event.target.files?.[0])}
          className="hidden"
          aria-label={label}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isPending}
          aria-busy={isPending}
          className="inline-flex w-fit items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-[#0c1324] transition-colors hover:border-[#b9c4d5] hover:bg-[#f7f9fc] disabled:cursor-wait disabled:opacity-60"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <ImagePlus className="h-4 w-4" aria-hidden="true" />}
          {isPending ? 'Validando y subiendo…' : value ? 'Cambiar imagen' : 'Subir imagen'}
        </button>

        {showUrlInput && (
          <input
            type="url"
            value={value}
            onChange={event => onChange(event.target.value)}
            placeholder="https://…"
            className="input-base"
            aria-label={`${label}: URL externa`}
          />
        )}

        {helper && <p className="text-xs text-zinc-400">{helper}</p>}
        {error && <p className="text-xs font-semibold text-rose-600" role="alert">{error}</p>}

        {value && (
          <div className="overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt={label} className={`${previewClassName} w-full object-cover`} />
          </div>
        )}
      </div>
    </div>
  )
}
