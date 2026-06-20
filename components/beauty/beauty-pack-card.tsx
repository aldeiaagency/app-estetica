import Link from 'next/link'
import { ArrowRight, CheckCircle2, Gift, Sparkles, X } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import type { BeautyPackRecord } from '@/app/actions/beauty-packs'

type BeautyPackCardProps = {
  pack: BeautyPackRecord
  compact?: boolean
}

export function BeautyPackCard({ pack, compact = false }: BeautyPackCardProps) {
  const href = pack.bonoId ? `/bono/${pack.bonoId}` : `/centro/${pack.centerSlug}/reservar`
  const ctaLabel = pack.bonoId ? 'Comprar pack' : 'Reservar este objetivo'

  return (
    <article className="rounded-lg border border-[#cfe0ff] bg-white p-5 shadow-[0_18px_45px_rgba(12,19,36,0.05)]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-[#e5edff] px-2.5 py-1 text-xs font-black text-[#2355c8]">
              <Sparkles className="h-3 w-3" />
              Pack por objetivo
            </span>
            {pack.durationDays && (
              <span className="rounded-full bg-[#f1f4f8] px-2.5 py-1 text-xs font-bold text-[#647089]">
                {pack.durationDays} dias
              </span>
            )}
          </div>
          <h3 className="mt-4 text-xl font-black tracking-tight text-[#0c1324]">{pack.name}</h3>
          <p className="mt-1 text-sm font-semibold text-[#46546b]">{pack.objective}</p>
          {!compact && pack.description && (
            <p className="mt-3 text-sm leading-6 text-[#647089]">{pack.description}</p>
          )}
        </div>
        <div className="shrink-0 text-right">
          <p className="text-xl font-black text-[#0c1324]">{formatPrice(pack.priceCents)}</p>
          {pack.compareAtPriceCents && (
            <p className="text-xs font-semibold text-[#8b96aa] line-through">{formatPrice(pack.compareAtPriceCents)}</p>
          )}
        </div>
      </div>

      {(pack.audience || pack.notFor) && (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {pack.audience && (
            <div className="rounded-md bg-[#f3fffc] p-3">
              <p className="text-xs font-black uppercase tracking-wider text-[#10786f]">Para ti si</p>
              <p className="mt-1 text-sm leading-5 text-[#46546b]">{pack.audience}</p>
            </div>
          )}
          {pack.notFor && (
            <div className="rounded-md bg-[#fffaf5] p-3">
              <p className="flex items-center gap-1 text-xs font-black uppercase tracking-wider text-[#8b5b32]">
                <X className="h-3 w-3" />
                Mejor evitar si
              </p>
              <p className="mt-1 text-sm leading-5 text-[#6d5948]">{pack.notFor}</p>
            </div>
          )}
        </div>
      )}

      {pack.expectedResult && (
        <div className="mt-4 rounded-md border border-[#d8dee9] bg-[#f7f9fc] p-3">
          <p className="text-xs font-black uppercase tracking-wider text-[#647089]">Resultado esperado</p>
          <p className="mt-1 text-sm leading-5 text-[#46546b]">{pack.expectedResult}</p>
        </div>
      )}

      {pack.items.length > 0 && (
        <div className="mt-5 space-y-2">
          {pack.items.map(item => (
            <div key={item.id} className="flex items-start gap-2 text-sm leading-5 text-[#46546b]">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#6f9277]" />
              <span>
                <strong className="text-[#0c1324]">{item.quantity}x</strong> {item.label}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="mt-5 flex flex-col gap-3 border-t border-[#e5eaf2] pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#647089]">
          <Gift className="h-4 w-4" />
          {pack.bonoId ? 'Compra con bono asociado' : 'Compra por reserva del centro'}
        </div>
        <Link href={href} className="btn-primary justify-center py-2 text-xs">
          {ctaLabel}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  )
}
