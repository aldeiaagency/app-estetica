import { CalendarCheck, CircleDollarSign, Sparkles } from 'lucide-react'
import type { GeneratedBeautyPlan } from '@/lib/beauty/recommendations'

export function BeautyPlanCard({ plan }: { plan: GeneratedBeautyPlan }) {
  return (
    <section className="rounded-lg border border-[#d8dee9] bg-white p-6 shadow-[0_24px_70px_rgba(12,19,36,0.08)]">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#2355c8]">Tu plan de {plan.monthLabel}</p>
          <h1 className="mt-3 max-w-3xl text-3xl font-black tracking-tight text-[#0c1324] sm:text-5xl">
            {plan.priority}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[#647089]">{plan.summary}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:min-w-72 lg:grid-cols-1">
          <div className="rounded-lg border border-[#d8dee9] bg-[#f7f9fc] p-4">
            <div className="flex items-center gap-2 text-sm font-black text-[#0c1324]">
              <CircleDollarSign className="h-4 w-4 text-[#2f6df6]" />
              Presupuesto
            </div>
            <p className="mt-2 text-sm text-[#647089]">{plan.budgetLabel}</p>
          </div>
          <div className="rounded-lg border border-[#d8dee9] bg-[#f7f9fc] p-4">
            <div className="flex items-center gap-2 text-sm font-black text-[#0c1324]">
              <CalendarCheck className="h-4 w-4 text-[#6f9277]" />
              Ritmo
            </div>
            <p className="mt-2 text-sm text-[#647089]">{plan.maintenanceLabel}</p>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-lg bg-[#0c1324] p-4 text-white">
        <div className="flex items-start gap-3">
          <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-[#9db8ff]" />
          <div>
            <p className="font-black">Cómo usar este plan</p>
            <p className="mt-1 text-sm leading-6 text-white/70">
              Elige una acción principal, revisa el motivo y decide con precio visible. Puedes cambiarlo después.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
