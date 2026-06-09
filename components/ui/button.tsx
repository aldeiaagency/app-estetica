import { cn } from '@/lib/utils'
import { ButtonHTMLAttributes, forwardRef } from 'react'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
          {
            'bg-primary-600 text-white shadow-sm shadow-primary-500/20 hover:bg-primary-700 active:scale-[0.97]': variant === 'primary',
            'bg-zinc-100 text-zinc-800 hover:bg-zinc-200 active:scale-[0.97]': variant === 'secondary',
            'bg-transparent text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900': variant === 'ghost',
            'bg-red-600 text-white shadow-sm hover:bg-red-700 active:scale-[0.97]': variant === 'destructive',
            'border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300': variant === 'outline',
            'px-3 py-1.5 text-xs': size === 'sm',
            'px-4 py-2.5 text-sm': size === 'md',
            'px-6 py-3.5 text-base': size === 'lg',
          },
          className
        )}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin shrink-0" />}
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'

interface ButtonLinkProps {
  href: string
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  children: React.ReactNode
  target?: string
  rel?: string
}

function ButtonLink({ href, variant = 'primary', size = 'md', className, children, ...rest }: ButtonLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
        {
          'bg-primary-600 text-white shadow-sm shadow-primary-500/20 hover:bg-primary-700 active:scale-[0.97]': variant === 'primary',
          'bg-zinc-100 text-zinc-800 hover:bg-zinc-200 active:scale-[0.97]': variant === 'secondary',
          'bg-transparent text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900': variant === 'ghost',
          'bg-red-600 text-white shadow-sm hover:bg-red-700 active:scale-[0.97]': variant === 'destructive',
          'border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300': variant === 'outline',
          'px-3 py-1.5 text-xs': size === 'sm',
          'px-4 py-2.5 text-sm': size === 'md',
          'px-6 py-3.5 text-base': size === 'lg',
        },
        className
      )}
      {...rest}
    >
      {children}
    </Link>
  )
}

export { Button, ButtonLink }
