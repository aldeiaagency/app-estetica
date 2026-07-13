'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { SidebarNav, type SidebarNavProps } from '@/components/dashboard/sidebar-nav'

export function MobileSidebar(props: SidebarNavProps) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => setOpen(false), [pathname])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-9 w-9 items-center justify-center rounded-md text-[#647089] hover:bg-[#edf3ff]"
        aria-label="Abrir menu"
        aria-expanded={open}
      >
        <Menu className="h-5 w-5" />
      </button>
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} aria-label="Cerrar menu" />
          <div className="relative h-full w-64 shadow-2xl">
            <SidebarNav {...props} />
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-md text-white hover:bg-white/10"
              aria-label="Cerrar menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
