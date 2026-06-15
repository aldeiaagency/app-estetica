import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { Button } from './button'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    href?: string
    onClick?: () => void
  }
  className?: string
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center rounded-lg border border-dashed border-[#d7cbbb] bg-white px-8 py-16 text-center shadow-[0_20px_55px_rgba(42,32,24,0.06)]',
      className
    )}>
      {Icon && (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-md bg-[#eee7dd]">
          <Icon className="h-7 w-7 text-[#9a8f84]" />
        </div>
      )}
      <h3 className="font-black text-[#171412]">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-[#6c625a]">{description}</p>}
      {action && (
        <div className="mt-5">
          {action.href ? (
            <Link href={action.href}>
              <Button size="sm">{action.label}</Button>
            </Link>
          ) : (
            <Button size="sm" onClick={action.onClick}>{action.label}</Button>
          )}
        </div>
      )}
    </div>
  )
}
