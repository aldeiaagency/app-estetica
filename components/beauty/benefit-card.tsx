import Link from 'next/link'
import { ArrowRight, BadgePercent, CheckCircle2, Gift, Sparkles } from 'lucide-react'
import { claimBenefitAction, type BeautyBenefitRecord } from '@/app/actions/benefits'

const BENEFIT_ICON = {
  DISCOUNT: BadgePercent,
  PRIORITY_BOOKING: Sparkles,
  FREE_DIAGNOSIS: CheckCircle2,
  GIFT: Gift,
  MEMBER_ONLY_PACK: Gift,
  FREE_REVIEW: CheckCircle2,
  CASHBACK: BadgePercent,
  POINTS: Sparkles,
}

const BENEFIT_LABEL = {
  DISCOUNT: 'Descuento',
  PRIORITY_BOOKING: 'Prioridad',
  FREE_DIAGNOSIS: 'Diagnóstico',
  GIFT: 'Regalo',
  MEMBER_ONLY_PACK: 'Pack privado',
  FREE_REVIEW: 'Revisión',
  CASHBACK: 'Cashback',
  POINTS: 'Puntos',
}

export function BenefitCard({ benefit }: { benefit: BeautyBenefitRecord }) {
  const Icon = BENEFIT_ICON[benefit.benefitType] ?? Gift
  const claimed = benefit.userBenefitStatus === 'CLAIMED' || benefit.userBenefitStatus === 'ACTIVE'
  const used = benefit.userBenefitStatus === 'USED'

  return (
    <article className="rounded-lg border border-[#d8dee9] bg-white p-5 shadow-[0_18px_45px_rgba(12,19,36,0.05)]">
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-[#e5edff] text-[#2355c8]">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#f1f4f8] px-2.5 py-1 text-xs font-black text-[#647089]">
              {BENEFIT_LABEL[benefit.benefitType]}
            </span>
            {benefit.value && (
              <span className="rounded-full bg-[#e7f7f5] px-2.5 py-1 text-xs font-black text-[#10786f]">
                {benefit.value}
              </span>
            )}
          </div>
          <h3 className="mt-3 text-lg font-black leading-tight text-[#0c1324]">{benefit.title}</h3>
          {benefit.description && (
            <p className="mt-2 text-sm leading-6 text-[#647089]">{benefit.description}</p>
          )}
          {benefit.centerName && benefit.centerSlug && (
            <Link href={`/centro/${benefit.centerSlug}`} className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-[#2355c8]">
              {benefit.centerName}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      </div>

      <div className="mt-5 border-t border-[#e5eaf2] pt-4">
        {used ? (
          <span className="inline-flex w-full items-center justify-center rounded-md bg-[#f1f4f8] px-4 py-2.5 text-sm font-bold text-[#647089]">
            Usado
          </span>
        ) : claimed ? (
          <span className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#e7f7f5] px-4 py-2.5 text-sm font-bold text-[#10786f]">
            <CheckCircle2 className="h-4 w-4" />
            Guardado en wallet
          </span>
        ) : (
          <form action={async () => {
            'use server'
            await claimBenefitAction(benefit.id)
          }}>
            <button type="submit" className="btn-primary w-full">
              Guardar beneficio
            </button>
          </form>
        )}
      </div>
    </article>
  )
}
