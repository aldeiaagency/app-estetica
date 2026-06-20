'use client'

import { useTransition } from 'react'
import { Sparkles, Lock, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface AiBtnProps {
  canUseAI: boolean
  label?: string
  onGenerate: () => Promise<void>
}

export function AiBtn({ canUseAI, label = 'Generar con IA', onGenerate }: AiBtnProps) {
  const [isPending, startTransition] = useTransition()

  if (!canUseAI) {
    return (
      <Link
        href="/dashboard/plan"
        className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-medium text-zinc-400 hover:bg-zinc-100 transition-colors"
        title="Disponible desde el plan Growth"
      >
        <Lock className="h-3 w-3" />
        IA - Plan Growth+
      </Link>
    )
  }

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => startTransition(onGenerate)}
      className="inline-flex items-center gap-1.5 rounded-lg border border-primary-200 bg-primary-50 px-3 py-1.5 text-xs font-semibold text-primary-700 hover:bg-primary-100 transition-colors disabled:opacity-60 disabled:cursor-wait"
    >
      {isPending ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <Sparkles className="h-3 w-3" />
      )}
      {isPending ? 'Generando...' : label}
    </button>
  )
}
