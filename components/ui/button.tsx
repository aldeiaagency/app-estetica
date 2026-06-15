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
          'inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e36952] focus-visible:ring-offset-2',
          {
            'bg-[#e36952] text-white shadow-[0_14px_30px_rgba(227,105,82,0.24)] hover:bg-[#cf5845] active:scale-[0.98]': variant === 'primary',
            'bg-[#eee7dd] text-[#332b26] hover:bg-[#e5ded3] active:scale-[0.98]': variant === 'secondary',
            'bg-transparent text-[#5f554d] hover:bg-[#eee7dd] hover:text-[#171412]': variant === 'ghost',
            'bg-red-600 text-white shadow-sm hover:bg-red-700 active:scale-[0.98]': variant === 'destructive',
            'border border-[#d7cbbb] bg-white text-[#332b26] hover:border-[#bda995] hover:bg-[#fbfaf7]': variant === 'outline',
            'px-3 py-1.5 text-xs': size === 'sm',
            'px-4 py-2.5 text-sm': size === 'md',
            'px-6 py-3.5 text-base': size === 'lg',
          },
          className
        )}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 shrink-0 animate-spin" />}
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
        'inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e36952] focus-visible:ring-offset-2',
        {
          'bg-[#e36952] text-white shadow-[0_14px_30px_rgba(227,105,82,0.24)] hover:bg-[#cf5845] active:scale-[0.98]': variant === 'primary',
          'bg-[#eee7dd] text-[#332b26] hover:bg-[#e5ded3] active:scale-[0.98]': variant === 'secondary',
          'bg-transparent text-[#5f554d] hover:bg-[#eee7dd] hover:text-[#171412]': variant === 'ghost',
          'bg-red-600 text-white shadow-sm hover:bg-red-700 active:scale-[0.98]': variant === 'destructive',
          'border border-[#d7cbbb] bg-white text-[#332b26] hover:border-[#bda995] hover:bg-[#fbfaf7]': variant === 'outline',
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
