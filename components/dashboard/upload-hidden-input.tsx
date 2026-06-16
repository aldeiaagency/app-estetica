'use client'

import { useState } from 'react'
import { ImageUploadField } from '@/components/dashboard/image-upload-field'
import type { UploadKind } from '@/lib/storage/r2'

interface UploadHiddenInputProps {
  name: string
  label: string
  kind: UploadKind
  helper?: string
}

export function UploadHiddenInput({ name, label, kind, helper }: UploadHiddenInputProps) {
  const [value, setValue] = useState('')

  return (
    <>
      <input type="hidden" name={name} value={value} />
      <ImageUploadField label={label} value={value} onChange={setValue} kind={kind} helper={helper} />
    </>
  )
}

