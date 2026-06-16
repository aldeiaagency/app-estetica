'use client'

import { useRef, useState, useTransition } from 'react'
import { ImagePlus, Loader2, X } from 'lucide-react'
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
        const signedRes = await fetch('/api/upload/sign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: file.name,
            contentType: file.type,
            size: file.size,
            kind,
          }),
        })

        const signed = await signedRes.json()
        if (!signedRes.ok) {
          throw new Error(signed.error ?? 'No se pudo preparar la subida')
        }

        const uploadRes = await fetch(signed.uploadUrl, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': file.type },
        })

        if (!uploadRes.ok) {
          throw new Error('No se pudo subir la imagen al storage')
        }

        onChange(signed.publicUrl)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al subir la imagen')
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
          >
            <X className="h-3.5 w-3.5" /> Quitar
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
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isPending}
          className="inline-flex w-fit items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-[#0c1324] transition-colors hover:border-[#b9c4d5] hover:bg-[#f7f9fc] disabled:cursor-wait disabled:opacity-60"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
          {isPending ? 'Subiendo...' : value ? 'Cambiar imagen' : 'Subir imagen'}
        </button>

        {showUrlInput && (
          <input
            type="url"
            value={value}
            onChange={event => onChange(event.target.value)}
            placeholder="https://..."
            className="input-base"
          />
        )}

        {helper && <p className="text-xs text-zinc-400">{helper}</p>}
        {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}

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
