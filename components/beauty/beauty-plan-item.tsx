import Link from 'next/link'
import { ArrowRight, BadgeCheck } from 'lucide-react'
import type { BeautyPlanRecommendation } from '@/lib/beauty/recommendations'

export function BeautyPlanItem({ item }: { item: BeautyPlanRecommendation }) {
  return (
    <article className="rounded-lg border border-[#d8dee9] bg-white p-5 shadow-[0_18px_45px_rgba(12,19,36,0.05)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1 rounded-full bg-[#e5edff] px-2.5 py-1 text-xs font-black text-[#2355c8]">
            <BadgeCheck className="h-3.5 w-3.5" />
            {item.tag}
          </span>
          <h3 className="mt-4 text-xl font-black tracking-tight text-[#0c1324]">{item.title}</h3>
        </div>
      </div>
      <p className="mt-3 text-sm leading-6 text-[#46546b]">{item.reason}</p>
      <div className="mt-4 rounded-md bg-[#f7f9fc] px-3 py-2 text-sm font-bold text-[#0c1324]">
        {item.estimate}
      </div>
      <Link
        href={item.href}
        className="mt-5 inline-flex items-center gap-2 text-sm font-black text-[#2355c8] transition-colors hover:text-[#2f6df6]"
      >
        {item.hrefLabel}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </article>
  )
}
