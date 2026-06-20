import { LucideIcon } from 'lucide-react'

export function WalletSummaryCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: LucideIcon
  label: string
  value: string | number
  detail: string
}) {
  return (
    <article className="rounded-lg border border-[#d8dee9] bg-white p-5 shadow-[0_18px_45px_rgba(12,19,36,0.05)]">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#e5edff] text-[#2355c8]">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-bold text-[#647089]">{label}</p>
          <p className="text-2xl font-black text-[#0c1324]">{value}</p>
        </div>
      </div>
      <p className="mt-3 text-xs leading-5 text-[#647089]">{detail}</p>
    </article>
  )
}
