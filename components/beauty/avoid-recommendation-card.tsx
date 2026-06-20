import { ShieldAlert } from 'lucide-react'
import type { BeautyPlanAvoid } from '@/lib/beauty/recommendations'

export function AvoidRecommendationCard({ item }: { item: BeautyPlanAvoid }) {
  return (
    <article className="rounded-lg border border-[#ead8c8] bg-[#fffaf5] p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#f4e2d4] text-[#8b5b32]">
          <ShieldAlert className="h-4 w-4" />
        </div>
        <div>
          <h3 className="font-black text-[#0c1324]">{item.title}</h3>
          <p className="mt-1 text-sm leading-6 text-[#6d5948]">{item.reason}</p>
        </div>
      </div>
    </article>
  )
}
